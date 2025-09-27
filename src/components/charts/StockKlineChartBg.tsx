import type { StockKlineChartChildProps } from './types';
import klineConfig from './config';
import { formatNumber } from './util';
import { Fragment } from 'react';
export default function StockKlineChartBg({
  width,
  height,
  maxPrice,
  minPrice,
}: Omit<StockKlineChartChildProps, 'data' | 'mapToSvg' | 'coordinateX'>) {
  const distance = (maxPrice - minPrice) / 5;
  const candleAreaHeight = height - klineConfig.padding * 2;
  return (
    <g>
      <rect x="0" y="0" width={width} height={height} fill="#191B1F" />
      {Array.from({ length: 6 }).map((_, i) => {
        const x1 = 0;
        const y = klineConfig.padding + (i * candleAreaHeight) / 5;
        const x2 = width - klineConfig.right;
        return (
          <Fragment key={'stock-kline-chart-bg' + i}>
            <line
              x1={x1}
              y1={y}
              x2={x2}
              y2={y}
              stroke="#535964"
              strokeWidth={0.5}
            />
            <text
              x={x2 + 10}
              y={y}
              textAnchor="start"
              dominantBaseline="middle"
              fontSize={12}
              fill="#666"
            >
              {formatNumber(maxPrice - i * distance)}
            </text>
          </Fragment>
        );
      })}
    </g>
  );
}
