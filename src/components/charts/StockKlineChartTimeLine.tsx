import { useState, useMemo } from 'react';
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
  totalDataCount: 240,
};

const StockKlineChartTimeLine = ({
  width,
  height,
  code,
}: StockMinuteChartProps) => {
  const [minuteData, setMinuteData] = useState<StockMinuteItem[]>([]);
  const [hoverInfo, setHoverInfo] = useState<{
    x: number;
    y: number;
    percent: number | null;
  } | null>(null);

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

  const { maxPercentData, minPercentData } = useMemo(() => {
    if (minuteData.length === 0)
      return { maxPercentData: 0, minPercentData: 0 };
    return minuteData.reduce(
      (acc, item) => ({
        maxPercentData: Math.max(acc.maxPercentData, item.percent),
        minPercentData: Math.min(acc.minPercentData, item.percent),
      }),
      { maxPercentData: -Infinity, minPercentData: Infinity },
    );
  }, [minuteData]);

  const { yMax, yMin } = useMemo(() => {
    const priceLimit = getStockPriceRangeByCode(code);
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

  const getXByIndex = (index: number): number => {
    const validWidth =
      width - backgroundConfig.leftPadding - backgroundConfig.rightPadding;
    const step = validWidth / (backgroundConfig.totalDataCount - 1);
    return backgroundConfig.leftPadding + index * step;
  };

  const getYByPercent = (percent: number): number => {
    const validHeight =
      height - backgroundConfig.yTopPadding - backgroundConfig.yBottomReserve;
    const percentRange = yMax - yMin;
    const pixelPerPercent = validHeight / percentRange;
    const distanceFromTop = (yMax - percent) * pixelPerPercent;
    return backgroundConfig.yTopPadding + distanceFromTop;
  };

  const getPathData = (): string => {
    if (minuteData.length === 0) return '';
    return minuteData.reduce((path, item, index) => {
      if (index >= backgroundConfig.totalDataCount) return path;
      const x = getXByIndex(index);
      const y = getYByPercent(item.percent);
      return index === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
    }, '');
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { leftPadding, rightPadding, yTopPadding, yBottomReserve } =
      backgroundConfig;

    // 限制在绘图区域（X方向）
    if (mouseX < leftPadding || mouseX > width - rightPadding) {
      setHoverInfo(null);
      return;
    }

    // Y 方向也限制在有效区域
    const minY = yTopPadding;
    const maxY = height - yBottomReserve;
    if (mouseY < minY || mouseY > maxY) {
      setHoverInfo(null);
      return;
    }

    // 👇 关键：从 mouseY 反推 percent
    const validHeight = height - yTopPadding - yBottomReserve;
    const percentRange = yMax - yMin;
    const pixelPerPercent = validHeight / percentRange;

    const percent = yMax - (mouseY - yTopPadding) / pixelPerPercent;

    setHoverInfo({
      x: mouseX,
      y: mouseY, // 👈 直接用 mouseY，不是 getYByPercent(percent)
      percent,
    });
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverInfo(null)}
      style={{ cursor: 'crosshair' }}
    >
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

      {/* Hover 横线 + 百分比标签 */}
      {hoverInfo && (
        <>
          {/* 横线：从左到右，Y = 鼠标 Y */}
          <line
            x1={backgroundConfig.leftPadding}
            y1={hoverInfo.y}
            x2={width - backgroundConfig.rightPadding}
            y2={hoverInfo.y}
            stroke="#aaa"
            strokeWidth={1}
            strokeDasharray="4,2"
          />
          {/* 百分比标签 */}
          {hoverInfo.percent && (
            <text
              x={width - backgroundConfig.rightPadding + 8}
              y={hoverInfo.y}
              fill={hoverInfo.percent >= 0 ? '#52c41a' : '#ff4d4f'}
              fontSize="12"
              dominantBaseline="middle"
            >
              {hoverInfo.percent.toFixed(2)}%
            </text>
          )}
        </>
      )}
    </svg>
  );
};

export default StockKlineChartTimeLine;
