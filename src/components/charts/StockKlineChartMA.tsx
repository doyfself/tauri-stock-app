import type { StockKlineChartChildProps } from './types';
import klineConfig from './config';
export default function StockKlineChartMA({
  maData,
  coordinateX,
  mapToSvg,
}: Pick<StockKlineChartChildProps, 'coordinateX' | 'mapToSvg'> & {
  maData: number[][]; // MA数据
}) {
  return (
    <g>
      {klineConfig.averageLineConfig.map((item, i) => {
        const maList = maData[i];
        let points = '';
        maList.forEach((item, index) => {
          if (item != -1) {
            points += `${coordinateX[index]} ${mapToSvg(item)},`;
          }
        });
        return (
          <polyline
            key={'stock-kline-chart-ma' + i}
            points={points.slice(0, -1)} // 去掉最后一个逗号
            fill="none"
            stroke={item.color}
            strokeWidth="1"
          />
        );
      })}
    </g>
  );
}
