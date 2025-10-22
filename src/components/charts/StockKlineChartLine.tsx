import { getStockLineApi, deleteStockLineApi } from '@/apis/api';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { priceToHorizontalLine } from './util';
import { useSelectionLineStore } from '@/stores/userStore';
import { StockLineType } from '@/types/response';

interface StockKlineChartLineProps {
  code: string;
  period: string;
  width: number; // 当前容器宽度
  height: number; // 当前容器高度
  maxPrice: number; // K线图最高价
  minPrice: number; // K线图最低价
}

export default function StockKlineChartLine({
  code,
  period,
  width: containerWidth,
  height: containerHeight,
  maxPrice,
  minPrice,
}: StockKlineChartLineProps) {
  const [lineData, setLineData] = useState<StockLineType[]>([]);
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);
  const containerRef = useRef<SVGGElement>(null);
  // 从store获取状态和方法
  const refreshFlag = useSelectionLineStore((state) => state.refreshFlag);
  const triggerRefresh = useSelectionLineStore(
    (state) => state.triggerSelectionRefresh,
  );

  // 加载水平线数据
  useEffect(() => {
    const fetchLineData = async () => {
      const res = await getStockLineApi(code, period);
      console.log(res, 'dddd');
      setLineData(res.data || []);
      setSelectedLineId(null);
    };

    fetchLineData();
  }, [code, period, refreshFlag]);

  // 点击空白区域取消选中
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

  // 计算删除按钮位置（针对水平线优化）
  const getDeleteBtnPosition = useCallback(
    (y: number) => {
      // 水平线中间偏左位置，避免右侧溢出
      const midX = Math.min(containerWidth / 4, containerWidth - 60); // 左侧1/4处，预留按钮宽度
      const btnY = Math.max(y - 30, 20); // 线上方30px，不超过顶部

      return { x: midX, y: btnY };
    },
    [containerWidth],
  );

  // 处理删除
  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await deleteStockLineApi(id);
      triggerRefresh();
      setSelectedLineId(null);
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败，请重试');
    }
  };

  // 线条点击切换选中状态
  const handleLineClick = (e: React.MouseEvent, lineId: number) => {
    e.stopPropagation();
    setSelectedLineId(lineId);
  };

  if (lineData.length === 0) return null;

  return (
    <g ref={containerRef}>
      {lineData.map((line) => {
        const { start, end } = priceToHorizontalLine(
          line.y, // 水平线y坐标
          containerWidth,
          containerHeight,
          maxPrice,
          minPrice,
        );
        const isSelected = selectedLineId === line.id;

        return (
          <React.Fragment key={`line-${line.id}`}>
            {/* 水平线条 */}
            <line
              onClick={(e) => handleLineClick(e, line.id)}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={isSelected ? '#ff9800' : '#2196F3'}
              strokeWidth={isSelected ? 2.5 : 1.5}
              strokeOpacity={isSelected ? 1 : 0.8}
              cursor="pointer"
              style={{ transition: 'all 0.2s ease' }}
            />

            {/* 选中时显示删除按钮 */}
            {isSelected && (
              <g onClick={(e) => e.stopPropagation()}>
                <rect
                  x={getDeleteBtnPosition(start.y).x}
                  y={getDeleteBtnPosition(start.y).y}
                  width={40}
                  height={20}
                  rx={3}
                  ry={3}
                  fill="#fff"
                  stroke="#ddd"
                  strokeWidth={1}
                  filter="drop-shadow(0 2px 3px rgba(0,0,0,0.1))"
                  style={{ animation: 'fadeIn 0.2s forwards' }}
                />
                <text
                  x={getDeleteBtnPosition(start.y).x + 20}
                  y={getDeleteBtnPosition(start.y).y + 14}
                  textAnchor="middle"
                  fill="#ff4d4f"
                  fontSize={12}
                  fontWeight={500}
                  onClick={(e) => handleDelete(e, line.id)}
                  cursor="pointer"
                  style={{ animation: 'fadeIn 0.2s 0.1s forwards' }}
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
