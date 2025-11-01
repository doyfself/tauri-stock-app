import { useEffect, useState, useMemo } from 'react';
import { getMinuteDataByCode } from '@/apis/api';
import type { StockMinuteItem } from '@/types/response';
import StockKlineChartTimeBg from './StockKlineChartTimeBg';
import { getStockPriceRangeByCode } from './util';
import useInterval from '@/hooks/useInterval';

interface StockMinuteChartProps {
  width: number;
  height: number;
  code: string;
}

const backgroundConfig = {
  totalGridCount: 8,
  leftPadding: 30,
  rightPadding: 50,
  yTopPadding: 10,
  yBottomReserve: 45,
  totalDataCount: 240, // 固定240条数据
};

const StockKlineChartTimeLine = ({
  width,
  height,
  code,
}: StockMinuteChartProps) => {
  const [minuteData, setMinuteData] = useState<StockMinuteItem[]>([]);

  // 数据请求
  const fetchMinuteData = async () => {
    try {
      const response = await getMinuteDataByCode(code);
      if (response.data && response.data.length > 0) {
        const sortedData = response.data.sort(
          (a, b) => a.timestamp - b.timestamp,
        );
        setMinuteData(sortedData);
      }
    } catch (err) {
      console.warn(`获取${code}分时数据失败:`, err);
    }
  };

  useInterval(fetchMinuteData, 6000);

  // 计算数据中的最大/最小涨跌幅（保留原始值，仅用于计算Y轴范围）
  const { maxPercentData, minPercentData } = useMemo(() => {
    if (minuteData.length === 0)
      return { maxPercentData: 0, minPercentData: 0 };

    return minuteData.reduce(
      (acc, item) => ({
        maxPercentData: Math.max(acc.maxPercentData, item.percent), // 不取整
        minPercentData: Math.min(acc.minPercentData, item.percent), // 不取整
      }),
      { maxPercentData: -Infinity, minPercentData: Infinity },
    );
  }, [minuteData]);

  // 计算Y轴范围（仍用整数确保背景网格对齐）
  const { yMax, yMin } = useMemo(() => {
    const priceLimit = getStockPriceRangeByCode(code);
    // 基于原始数据计算留白（向上/向下取整确保包含所有数据）
    const upperWithPadding = Math.ceil(maxPercentData) + 1;
    const lowerWithPadding = Math.floor(minPercentData) - 1;

    const symmetricRange = Math.max(
      Math.abs(upperWithPadding),
      Math.abs(lowerWithPadding),
    );

    return {
      yMax: Math.min(Math.round(symmetricRange), priceLimit),
      yMin: Math.max(-Math.round(symmetricRange), -priceLimit),
    };
  }, [maxPercentData, minPercentData, code]);

  // X轴坐标计算（保持均匀分布）
  const getXByIndex = (index: number): number => {
    const validWidth =
      width - backgroundConfig.leftPadding - backgroundConfig.rightPadding;
    const step = validWidth / (backgroundConfig.totalDataCount - 1);
    return backgroundConfig.leftPadding + index * step;
  };

  // Y轴坐标计算（核心修正：使用原始percent值）
  const getYByPercent = (percent: number): number => {
    const validHeight =
      height - backgroundConfig.yTopPadding - backgroundConfig.yBottomReserve;
    const percentRange = yMax - yMin; // 背景网格总范围（整数）
    const pixelPerPercent = validHeight / percentRange; // 每1%对应的像素高度

    // 直接用原始percent计算，不做取整（确保精度）
    const distanceFromTop = (yMax - percent) * pixelPerPercent;
    return backgroundConfig.yTopPadding + distanceFromTop;
  };

  // 生成分时线路径（使用原始percent值）
  const getPathData = (): string => {
    if (minuteData.length === 0) return '';

    return minuteData.reduce((path, item, index) => {
      if (index >= backgroundConfig.totalDataCount) return path;

      const x = getXByIndex(index);
      const y = getYByPercent(item.percent); // 直接使用原始值

      return index === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
    }, '');
  };

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <StockKlineChartTimeBg
        width={width}
        height={height}
        yMax={yMax}
        yMin={yMin}
      />

      {minuteData.length > 0 && (
        <path
          d={getPathData()}
          fill="none"
          stroke={
            minuteData[minuteData.length - 1].percent >= 0
              ? '#52c41a'
              : '#ff4d4f'
          }
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};

export default StockKlineChartTimeLine;
