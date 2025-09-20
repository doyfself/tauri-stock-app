import {
  getStockLineApi,
  deleteStockLineApi,
  type StockLineType,
  type DrawlinesType,
  type LinePoint,
} from '@/apis/api';
import React, { useEffect, useState, useRef } from 'react';
import { getLinePoints } from './util';
import { useSelectionLineStore } from '@/stores/userStore';

interface StockKlineChartLineProps {
  code: string;
  period: string;
  width: number; // 当前容器宽度（用于计算删除按钮位置）
  height: number; // 当前容器高度
}

export default function StockKlineChartLine({
  code,
  period,
  width,
}: StockKlineChartLineProps) {
  const [lineData, setLineData] = useState<StockLineType>();
  const [selectedLine, setSelectedLine] = useState<DrawlinesType | null>(null); // 选中的线条
  const svgRef = useRef<SVGGElement>(null); // 用于监听点击事件的g标签ref
  const triggerRefresh = useSelectionLineStore(
    (state) => state.triggerSelectionRefresh,
  );
  // 订阅刷新标识，当它变化时会触发组件更新
  const refreshFlag = useSelectionLineStore((state) => state.refreshFlag);
  // 加载画线数据
  useEffect(() => {
    getStockLineApi(code, period).then((res) => {
      if (res.data) {
        setLineData(res.data);
        setSelectedLine(null); // 数据更新时重置选中状态
      }
    });
  }, [code, period, refreshFlag]);

  // 点击空白区域取消选中
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // 若点击的不是g标签内部元素，取消选中
      if (svgRef.current && !svgRef.current.contains(e.target as Node)) {
        setSelectedLine(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // 计算删除按钮的位置（线条右上方）
  const getDeleteBtnPosition = (start: LinePoint, end: LinePoint) => {
    // 取线条中点的右上方作为按钮位置（避免超出容器）
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    // 确保按钮不超出容器边界
    const btnX = Math.min(midX + 20, width - 40); // 按钮宽度约40px，预留右边距
    const btnY = Math.max(midY - 20, 10); // 按钮高度约20px，预留上边距
    return { x: btnX, y: btnY };
  };

  // 处理删除按钮点击（这里仅示例，需根据实际删除接口实现）
  const handleDelete = async (e: React.MouseEvent, line: DrawlinesType) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发空白区域点击
    console.log('删除线条:', line.id);
    if (lineData) {
      await deleteStockLineApi(lineData?.code, lineData?.period, line.id);
      triggerRefresh();
    }
    setSelectedLine(null);
  };

  if (!lineData) return null;

  return (
    <g ref={svgRef}>
      {/* 已完成的贯穿线 */}
      {lineData.lines.map((line, index) => {
        // 计算线条在当前容器中的坐标（适配宽高）
        const { start, end } = getLinePoints(
          line.start,
          line.end,
          lineData.width,
          lineData.height,
        );

        // 判断当前线条是否被选中
        const isSelected = selectedLine?.id === line.id;

        return (
          <React.Fragment key={`drawn-line-${index}`}>
            {/* 线条元素 */}
            <line
              onClick={(e) => {
                e.stopPropagation(); // 阻止事件冒泡到document
                setSelectedLine(line);
              }}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={isSelected ? '#ff9800' : '#2196F3'}
              strokeWidth={isSelected ? 2.5 : 1.5}
              strokeOpacity={isSelected ? 1 : 0.8}
              cursor="pointer"
            />

            {/* 选中时显示删除按钮 */}
            {isSelected && (
              <g onClick={(e) => e.stopPropagation()}>
                {/* 矩形背景 */}
                <rect
                  x={getDeleteBtnPosition(start, end).x}
                  y={getDeleteBtnPosition(start, end).y}
                  width={40}
                  height={20}
                  rx={3}
                  ry={3}
                  fill="#fff"
                  stroke="#ddd"
                  strokeWidth={1}
                  filter="drop-shadow(0 2px 2px rgba(0,0,0,0.1))" // 阴影效果
                />
                {/* 删除文本 */}
                <text
                  x={getDeleteBtnPosition(start, end).x + 20} // 水平居中
                  y={getDeleteBtnPosition(start, end).y + 14} // 垂直居中（文本基线调整）
                  textAnchor="middle"
                  fill="#ff4d4f"
                  fontSize={12}
                  fontWeight={500}
                  onClick={(e) => handleDelete(e, line)}
                  cursor="pointer"
                >
                  删除
                </text>
              </g>
            )}
          </React.Fragment>
        );
      })}
    </g>
  );
}
