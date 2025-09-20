import klineConfig from './config';
import { Fragment } from 'react';
import type { StockKlineChartChildProps } from './types';
export default function StockKlineChartCandle({
  data,
  coordinateX,
  mapToSvg,
}: Pick<StockKlineChartChildProps, 'data' | 'coordinateX' | 'mapToSvg'>) {
  return (
    <g>
      {data.map((item, index) => {
        const isRise = item.close >= item.open;
        const fillColor = isRise
          ? klineConfig.riseColor
          : klineConfig.fallColor;
        return (
          <Fragment key={'stock-kline-chart-candle' + index}>
            <line
              x1={coordinateX[index]}
              y1={mapToSvg(item.high)}
              x2={coordinateX[index]}
              y2={mapToSvg(item.low)}
              stroke={fillColor}
              strokeWidth={1}
            />
            <rect
              x={coordinateX[index] - klineConfig.candleWidth / 2}
              y={isRise ? mapToSvg(item.close) : mapToSvg(item.open)}
              width={klineConfig.candleWidth}
              height={Math.abs(mapToSvg(item.close) - mapToSvg(item.open)) | 1}
              fill={isRise ? 'white' : klineConfig.fallColor}
              stroke={fillColor}
              strokeWidth={1}
            />
          </Fragment>
        );
      })}
    </g>
  );
}
