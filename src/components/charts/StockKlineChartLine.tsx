import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getTrendLinesApi, deleteTrendLineApi } from '@/apis/api';
import { priceToY } from './util';
import { useSelectionLineStore } from '@/stores/userStore';
import type { StockTrendLineType } from '@/types/response';
import type { StockKlineDataType } from './types';

interface StockKlineChartLineProps {
  code: string;
  period: string;
  width: number;
  height: number;
  maxPrice: number;
  minPrice: number;
  coordinateX: number[]; // 每根K线的x中心位置（长度应与klineData一致）
  klineData: StockKlineDataType[];
}

export default function StockKlineChartLine({
  code,
  period,
  width: containerWidth,
  height: containerHeight,
  maxPrice,
  minPrice,
  coordinateX,
  klineData,
}: StockKlineChartLineProps) {
  const [lines, setLines] = useState<StockTrendLineType[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);
  const containerRef = useRef<SVGGElement>(null);

  const refreshFlag = useSelectionLineStore((state) => state.refreshFlag);
  const triggerRefresh = useSelectionLineStore(
    (state) => state.triggerSelectionRefresh,
  );

  // 加载趋势线
  useEffect(() => {
    const fetchLines = async () => {
      try {
        const res = await getTrendLinesApi(code, period);
        setLines(res.data || []);
        setSelectedLineId(null);
      } catch (err) {
        console.error('加载趋势线失败:', err);
      }
    };
    fetchLines();
  }, [code, period, refreshFlag]);

  // 点击外部取消选中
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setSelectedLineId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // 替换 getLineSegment 为 getExtendedLine
  const getExtendedLine = useCallback(
    (line: StockTrendLineType) => {
      const startIndex = klineData.findIndex(
        (item) => item.timestamp == line.start_time,
      );
      const endIndex = klineData.findIndex(
        (item) => item.timestamp == line.end_time,
      );

      const x1 = startIndex !== -1 ? coordinateX[startIndex] : 0;
      const x2 = endIndex !== -1 ? coordinateX[endIndex] : containerWidth;

      const y1 = priceToY(
        line.start_price,
        containerHeight,
        maxPrice,
        minPrice,
      );
      const y2 = priceToY(line.end_price, containerHeight, maxPrice, minPrice);

      // 水平线：直接贯穿
      if (Math.abs(y1 - y2) < 1e-5) {
        return { x1: 0, y1, x2: containerWidth, y2: y1 };
      }

      // 垂直线（理论上不会发生，但防御性处理）
      if (Math.abs(x2 - x1) < 1e-5) {
        return { x1, y1: 0, x2: x1, y2: containerHeight };
      }

      // 斜线：计算与左右边界的交点
      const m = (y2 - y1) / (x2 - x1); // 斜率
      const b = y1 - m * x1; // 截距

      const yAtLeft = m * 0 + b; // x = 0 时的 y
      const yAtRight = m * containerWidth + b; // x = containerWidth 时的 y

      return {
        x1: 0,
        y1: yAtLeft,
        x2: containerWidth,
        y2: yAtRight,
      };
    },
    [
      klineData,
      coordinateX,
      containerWidth,
      containerHeight,
      maxPrice,
      minPrice,
    ],
  );

  // 删除按钮放在 (x1,y1) 和 (x2,y2) 的中点附近
  const getDeleteBtnPosition = useCallback(
    (x1: number, y1: number, x2: number, y2: number) => {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      return {
        x: Math.max(20, Math.min(midX - 20, containerWidth - 60)),
        y: Math.max(10, Math.min(midY - 10, containerHeight - 30)),
      };
    },
    [containerWidth, containerHeight],
  );

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await deleteTrendLineApi(id);
      triggerRefresh();
      setSelectedLineId(null);
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败，请重试');
    }
  };

  const handleLineClick = (e: React.MouseEvent, lineId: number) => {
    e.stopPropagation();
    setSelectedLineId(lineId);
  };

  if (lines.length === 0) return null;

  return (
    <g ref={containerRef}>
      // 替换 map 中的逻辑
      {lines.map((line) => {
        const extended = getExtendedLine(line); // 👈 使用新函数
        const isSelected = selectedLineId === line.id;
        const btnPos = getDeleteBtnPosition(
          extended.x1,
          extended.y1,
          extended.x2,
          extended.y2,
        );

        return (
          <React.Fragment key={`trend-line-${line.id}`}>
            <line
              onClick={(e) => handleLineClick(e, line.id)}
              x1={extended.x1}
              y1={extended.y1}
              x2={extended.x2}
              y2={extended.y2}
              stroke={isSelected ? '#ff9800' : '#9c27b0'} // 👈 紫色
              strokeWidth={isSelected ? 2.5 : 1.5}
              strokeOpacity={isSelected ? 1 : 0.85}
              cursor="pointer"
              style={{ transition: 'all 0.2s ease' }}
            />

            {isSelected && (
              <g onClick={(e) => e.stopPropagation()}>
                <rect
                  x={btnPos.x}
                  y={btnPos.y}
                  width={40}
                  height={20}
                  rx={3}
                  ry={3}
                  fill="#fff"
                  stroke="#ddd"
                  strokeWidth={1}
                  filter="drop-shadow(0 2px 3px rgba(0,0,0,0.1))"
                />
                <text
                  x={btnPos.x + 20}
                  y={btnPos.y + 14}
                  textAnchor="middle"
                  fill="#ff4d4f"
                  fontSize={12}
                  fontWeight={500}
                  onClick={(e) => handleDelete(e, line.id)}
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
