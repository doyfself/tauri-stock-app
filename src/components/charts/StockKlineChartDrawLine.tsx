import React, { useState, useRef, useEffect } from 'react';
import { addStockLineApi } from '@/apis/api';
import { useSelectionLineStore } from '@/stores/userStore';
import { yToPrice } from './util';

interface StockKlineChartDrawLineProps {
  width: number;
  height: number;
  code: string;
  period: string;
  maxPrice: number; // K线图最高价
  minPrice: number; // K线图最低价
}

// 类型定义：同时记录y坐标（用于实时绘制）和实际价格（用于存储）
type LineData = {
  y: number; // SVG中的y坐标（临时用）
  price: number; // 对应的实际价格（最终存储）
};

export default function StockKlineChartDrawLine({
  width,
  height,
  code,
  period,
  maxPrice,
  minPrice,
}: StockKlineChartDrawLineProps) {
  const triggerRefresh = useSelectionLineStore(
    (state) => state.triggerSelectionRefresh,
  );

  // 鼠标当前位置（y坐标和对应价格）
  const [mouseData, setMouseData] = useState<LineData | null>(null);
  // 已完成的水平线条（包含y坐标和价格）
  const [drawnLines, setDrawnLines] = useState<LineData[]>([]);
  // 画线模式开关
  const [drawing, setDrawing] = useState(false);
  // SVG元素引用
  const svgRef = useRef<SVGSVGElement>(null);

  // 处理鼠标移动：实时计算y坐标和对应价格
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawing || !svgRef.current || maxPrice === minPrice) return; // 避免价格相等时除零

    // 获取SVG坐标系下的鼠标位置
    const { top } = svgRef.current.getBoundingClientRect();
    const y = e.clientY - top;

    // 计算并更新鼠标位置对应的y坐标和价格
    const price = yToPrice(y, height, maxPrice, minPrice);
    setMouseData({
      y,
      price,
    });
  };

  // 处理双击：生成水平贯穿线（记录价格）
  const handleDoubleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawing || !mouseData || maxPrice === minPrice) return;
    e.preventDefault();

    // 添加当前线条（同时记录y和price，y用于实时显示，price用于存储）
    setDrawnLines((prev) => [...prev, mouseData]);
  };

  // 取消画线
  const cancelDrawing = () => {
    setDrawnLines([]);
    setDrawing(false);
    setMouseData(null);
  };

  // 撤销最后一条线
  const revertLine = () => {
    if (drawnLines.length === 0) return;
    setDrawnLines((prev) => prev.slice(0, -1));
  };

  // 完成画线：保存实际价格到数据库
  const onFinish = async () => {
    if (drawnLines.length === 0) {
      cancelDrawing();
      return;
    }

    // 构造请求参数：仅存储实际价格和必要信息（无需y坐标）
    const argus = drawnLines.map((line) => ({
      code,
      period,
      y: line.price, // 存储实际价格（核心）
      height,
    }));
    try {
      const res = await addStockLineApi(argus);
      if (res.data) {
        cancelDrawing();
        triggerRefresh();
      }
    } catch (err) {
      console.error('保存水平线失败：', err);
    }
  };

  // 退出画线模式时清空临时状态
  useEffect(() => {
    if (!drawing) {
      setMouseData(null);
    }
  }, [drawing]);

  // 价格相等时禁用画线（避免计算错误）
  if (maxPrice === minPrice) {
    return (
      <div className="absolute right-10 top-[-27px] text-xs text-gray-500">
        价格数据异常，无法画线
      </div>
    );
  }

  return (
    <div className="absolute  w-full top-[0]">
      {/* 控制按钮区 */}
      <div className="cursor-default absolute flex right-[10px] top-[-27px] items-center text-[12px] h-[27px] gap-[10px] text-[#1576e8]">
        {drawing ? (
          <>
            <button
              onClick={cancelDrawing}
              className="hover:text-blue-700 transition-colors"
            >
              取消
            </button>
            <button
              onClick={revertLine}
              className="hover:text-blue-700 transition-colors"
              disabled={drawnLines.length === 0}
            >
              撤销
            </button>
            <button
              onClick={onFinish}
              className="hover:text-blue-700 transition-colors"
            >
              完成
            </button>
          </>
        ) : (
          <button
            onClick={() => setDrawing(true)}
            className="hover:text-blue-700 transition-colors"
          >
            画水平线
          </button>
        )}
      </div>

      {/* 画线交互区 */}
      {drawing && (
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="absolute inset-0 cursor-crosshair pointer-events-auto"
          onMouseMove={handleMouseMove}
          onDoubleClick={handleDoubleClick}
        >
          {/* 已完成的水平贯穿线 */}
          {drawnLines.map((line, index) => (
            <line
              key={`drawn-line-${index}`}
              x1={0}
              y1={line.y}
              x2={width}
              y2={line.y}
              stroke="#2196F3"
              strokeWidth={1.5}
            />
          ))}

          {/* 鼠标悬停时的水平引导线+价格标签 */}
          {mouseData && (
            <>
              <line
                x1={0}
                y1={mouseData.y}
                x2={width}
                y2={mouseData.y}
                stroke="#EA6A2C"
                strokeWidth={1.5}
                strokeOpacity={0.7}
                strokeDasharray="4,2"
              />
              {/* 显示当前引导线对应的价格 */}
              <text
                x={10} // 左侧偏移10px
                y={mouseData.y - 5} // 线上方偏移5px
                fill="#EA6A2C"
                fontSize={12}
                fontWeight={500}
                pointerEvents="none" // 不影响鼠标交互
              >
                {mouseData.price.toFixed(2)}
              </text>
            </>
          )}
        </svg>
      )}
    </div>
  );
}
