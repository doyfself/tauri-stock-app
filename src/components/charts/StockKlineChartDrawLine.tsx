import React, { useState, useRef } from 'react';
import { addTrendLinesApi } from '@/apis/api'; // 注意：使用新API
import { useSelectionLineStore } from '@/stores/userStore';
import type { StockKlineDataType } from './types';

// 工具函数：y坐标转价格（你已有 yToPrice，这里假设存在）
import { yToPrice } from './util';

// 新增：x坐标转时间戳（你需要提供 coordinateX 和 data）
// 假设你从父组件传入 coordinateX 和 k线数据
interface StockKlineChartDrawLineProps {
  width: number;
  height: number;
  code: string;
  period: string;
  maxPrice: number;
  minPrice: number;
  coordinateX: number[]; // 每根K线的x中心位置
  klineData: StockKlineDataType[]; // 必须包含13位时间戳
}

type Point = {
  x: number; // SVG x 坐标
  y: number; // SVG y 坐标
  price: number; // 实际价格
  timestamp: number; // 13位时间戳（对应最近的K线）
};

export default function StockKlineChartDrawLine({
  width,
  height,
  code,
  period,
  maxPrice,
  minPrice,
  coordinateX,
  klineData,
}: StockKlineChartDrawLineProps) {
  const triggerRefresh = useSelectionLineStore(
    (state) => state.triggerSelectionRefresh,
  );

  const [drawing, setDrawing] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const svgRef = useRef<SVGSVGElement>(null);

  // 根据鼠标x坐标找到最近的K线索引和时间戳
  const findNearestKline = (
    mouseX: number,
  ): { index: number; timestamp: number } => {
    let closestIndex = 0;
    let minDist = Math.abs(coordinateX[0] - mouseX);
    for (let i = 1; i < coordinateX.length; i++) {
      const dist = Math.abs(coordinateX[i] - mouseX);
      if (dist < minDist) {
        minDist = dist;
        closestIndex = i;
      }
    }
    return {
      index: closestIndex,
      timestamp: klineData[closestIndex]?.timestamp || Date.now(),
    };
  };

  // 鼠标移动：更新十字线位置
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawing || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });
  };

  // 单击：记录一个点
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawing || !svgRef.current || points.length >= 2) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const price = yToPrice(y, height, maxPrice, minPrice);
    const { timestamp } = findNearestKline(x);

    const newPoint: Point = { x, y, price, timestamp };
    setPoints((prev) => [...prev, newPoint]);

    // 如果是第二个点，立即提交
    if (points.length === 1) {
      setTimeout(() => onFinish([points[0], newPoint]), 0);
    }
  };

  // 双击：生成水平线（使用当前鼠标位置作为唯一点）
  const handleDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawing || !svgRef.current) return;
    e.preventDefault();

    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const price = yToPrice(y, height, maxPrice, minPrice);
    const { timestamp } = findNearestKline(x);

    const point: Point = { x, y, price, timestamp };
    // 水平线：起点=终点
    setTimeout(() => onFinish([point, point]), 0);
  };

  // 完成并提交线条
  const onFinish = async (linePoints: [Point, Point]) => {
    const [p1, p2] = linePoints;

    const req = {
      code,
      period,
      start_time: p1.timestamp,
      start_price: p1.price,
      end_time: p2.timestamp,
      end_price: p2.price,
    };

    try {
      const res = await addTrendLinesApi([req]);
      if (res.success) {
        triggerRefresh();
      }
    } catch (err) {
      console.error('保存趋势线失败:', err);
    }

    // 重置状态
    setPoints([]);
    setDrawing(false);
  };

  const cancelDrawing = () => {
    setPoints([]);
    setDrawing(false);
    setMousePos(null);
  };

  if (maxPrice === minPrice) {
    return (
      <div className="absolute right-10 top-[-27px] text-xs text-gray-500">
        价格数据异常，无法画线
      </div>
    );
  }

  return (
    <div className="absolute w-full top-[0]">
      {/* 控制按钮 */}
      <div className="cursor-default absolute flex right-[10px] top-[-27px] items-center text-[12px] h-[27px] gap-[10px] text-[#1576e8]">
        {drawing ? (
          <>
            <button
              onClick={cancelDrawing}
              className="hover:text-blue-700 transition-colors"
            >
              取消
            </button>
          </>
        ) : (
          <button
            onClick={() => setDrawing(true)}
            className="hover:text-blue-700 transition-colors"
          >
            画趋势线
          </button>
        )}
      </div>

      {/* 交互层 */}
      {drawing && (
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="absolute inset-0 cursor-crosshair pointer-events-auto"
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          {/* 已完成的线（如果有预览需求可加，但通常直接存DB不预览） */}

          {/* 十字引导线 */}
          {mousePos && (
            <>
              {/* X轴虚线（吸附到最近K线） */}
              {coordinateX.length > 0 && (
                <line
                  x1={coordinateX[findNearestKline(mousePos.x).index]}
                  y1={0}
                  x2={coordinateX[findNearestKline(mousePos.x).index]}
                  y2={height}
                  stroke="gray"
                  strokeWidth={1}
                  strokeDasharray="4,2"
                />
              )}

              {/* Y轴虚线 */}
              <line
                x1={0}
                y1={mousePos.y}
                x2={width}
                y2={mousePos.y}
                stroke="gray"
                strokeWidth={1}
                strokeDasharray="4,2"
              />

              {/* 当前价格标签 */}
              <text
                x={10}
                y={mousePos.y - 5}
                fill="#EA6A2C"
                fontSize={12}
                fontWeight={500}
                pointerEvents="none"
              >
                {yToPrice(mousePos.y, height, maxPrice, minPrice).toFixed(2)}
              </text>
            </>
          )}

          {/* 已点击的第一个点（预览） */}
          {points.length === 1 && mousePos && (
            <>
              {/* 临时斜线预览 */}
              <line
                x1={points[0].x}
                y1={points[0].y}
                x2={mousePos.x}
                y2={mousePos.y}
                stroke="#2196F3"
                strokeWidth={1.5}
                strokeDasharray="4,2"
              />
              {/* 起点标记 */}
              <circle cx={points[0].x} cy={points[0].y} r={4} fill="#2196F3" />
            </>
          )}
        </svg>
      )}
    </div>
  );
}
