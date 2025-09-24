import React, { useState, useRef } from 'react';
import { getLinePoints } from './util';
import { addStockLineApi } from '@/apis/api';
import { useSelectionLineStore } from '@/stores/userStore';
interface StockKlineChartDrawLineProps {
  width: number;
  height: number;
  code: string;
  period: string;
}
type LinePoint = {
  x: number;
  y: number;
};
type DrawlinesType = {
  start: LinePoint;
  end: LinePoint;
};

export default function StockKlineChartDrawLine({
  width,
  height,
  code,
  period,
}: StockKlineChartDrawLineProps) {
  const triggerRefresh = useSelectionLineStore(
    (state) => state.triggerSelectionRefresh,
  );
  // 起点（已选择）和终点（随鼠标移动）
  const [startPoint, setStartPoint] = useState<LinePoint | null>(null);
  const [endPoint, setEndPoint] = useState<LinePoint | null>(null);
  // 鼠标当前位置（用于水平引导线）
  const [mousePos, setMousePos] = useState<LinePoint | null>(null);
  // SVG元素引用
  const svgRef = useRef<SVGSVGElement>(null);
  // 已完成的线条列表
  const [drawnLines, setDrawnLines] = useState<DrawlinesType[]>([]);
  //  画线状态
  const [drawing, setDrawing] = useState(false);

  // 处理鼠标点击：选择起点或确认终点
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    // 获取SVG坐标系下的点击位置
    const { left, top } = svgRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;

    if (!startPoint) {
      // 第一次点击：设置起点，开始跟踪鼠标
      setStartPoint({ x, y });
      setEndPoint({ x, y }); // 初始化终点为起点
    } else {
      // 第二次点击：确认终点，添加线条到已完成列表
      if (endPoint) {
        setDrawnLines((prev) => [
          ...prev,
          {
            start: startPoint,
            end: endPoint,
            id: new Date().getTime().toString(),
          },
        ]);
      }
      // 重置起点，准备下一次画线
      setStartPoint(null);
      setEndPoint(null);
    }
  };

  // 处理鼠标移动：更新终点位置（仅当已选择起点时）
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!startPoint || !svgRef.current) return;

    // 获取SVG坐标系下的鼠标位置
    const { left, top } = svgRef.current.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    // 更新鼠标位置（用于水平引导线）
    setMousePos({ x, y });

    setEndPoint({ x, y });
  };

  const cancelDrawing = () => {
    setDrawnLines([]);
    setDrawing(false);
  };
  const revertLine = () => {
    setDrawnLines(drawnLines.slice(0, -1));
  };
  const onFinish = async () => {
    const argus = drawnLines.map((line) => ({
      code,
      period,
      x1: line.start.x,
      y1: line.start.y,
      x2: line.end.x,
      y2: line.end.y,
      width,
      height,
    }));
    if (argus.length === 0) {
      setDrawing(false);
      return;
    }
    const res = await addStockLineApi(argus);
    if (res.data) {
      setDrawnLines([]);
      setDrawing(false);
      triggerRefresh();
    }
  };

  return (
    <div
      className="absolute"
      style={{
        left: 0,
        top: 0,
        width: width + 'px',
      }}
    >
      <div className="absolute flex drawing-button">
        {drawing ? (
          <>
            <div onClick={cancelDrawing}>取消</div>
            <div onClick={revertLine}>撤销</div>
            <div onClick={onFinish}>完成</div>
          </>
        ) : (
          <div onClick={() => setDrawing(true)}>画线</div>
        )}
      </div>
      {drawing && (
        <svg
          ref={svgRef}
          width={width}
          height={height}
          style={{ cursor: startPoint ? 'crosshair' : 'default' }}
          onClick={handleSvgClick}
          onMouseMove={handleMouseMove}
          className="line-drawer-svg"
        >
          {/* 已完成的贯穿线 */}
          {drawnLines.map((line, index) => {
            const { start, end } = getLinePoints(
              line.start.x,
              line.start.y,
              line.end.x,
              line.end.y,
              width,
              height,
            );
            return (
              <line
                key={`drawn-line-${index}`}
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke="#2196F3"
                strokeWidth={1.5}
              />
            );
          })}
          {/* 水平引导线（随鼠标移动） */}
          {mousePos && (
            <line
              x1={0}
              y1={mousePos.y}
              x2={width}
              y2={mousePos.y}
              stroke="#333" // 红色引导线，区分主线条
              strokeWidth={1.3}
              strokeOpacity={0.6}
              strokeDasharray="3,3" // 虚线样式
            />
          )}
          {/* 实时预览的贯穿线（仅当已选择起点时） */}
          {startPoint && endPoint && (
            <>
              {/* 起点标记 */}
              <circle
                cx={startPoint.x}
                cy={startPoint.y}
                r={4}
                fill="#4CAF50"
                stroke="#fff"
                strokeWidth={1}
              />

              {/* 贯穿线预览 */}
              {(() => {
                const { start, end } = getLinePoints(
                  startPoint.x,
                  startPoint.y,
                  endPoint.x,
                  endPoint.y,
                  width,
                  height,
                );
                return (
                  <line
                    x1={start.x}
                    y1={start.y}
                    x2={end.x}
                    y2={end.y}
                    stroke="#2196F3"
                    strokeWidth={2}
                    strokeDasharray="5,3" // 虚线样式区分预览
                  />
                );
              })()}
            </>
          )}
        </svg>
      )}
    </div>
  );
}
