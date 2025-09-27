import klineConfig from './config';
import type { StockKlineChartVolumeProps } from './types';
import { mapKlineToSvg, formatVolume } from './util';

export const StockKlineChartVolumeBar = ({
  index,
  data,
}: Pick<StockKlineChartVolumeProps, 'index' | 'data'>) => {
  return (
    <div className="bg-[#23272D] text-[12px] px-[10px] py-[5px] text-[#fff]">
      成交量：{formatVolume(data[index]?.volume || 0)}
    </div>
  );
};
export default function StockKlineChartVolume({
  data,
  coordinateX,
  width,
  index,
  isHovered,
}: StockKlineChartVolumeProps) {
  const maxVolume = Math.max(...data.map((item) => item.volume));
  const mapToSvg = mapKlineToSvg(klineConfig.volumeHeight, 0, maxVolume);
  return (
    <svg width={width} height={klineConfig.volumeHeight}>
      <g>
        <rect
          x="0"
          y="0"
          width={width}
          height={klineConfig.volumeHeight}
          fill="#191B1F"
        />
        {data.map((item, index) => {
          const isRise = item.close >= item.open;
          const fillColor = isRise
            ? klineConfig.riseColor
            : klineConfig.fallColor;
          return (
            <rect
              key={'stock-kline-chart-volumn' + index}
              x={coordinateX[index] - klineConfig.candleWidth / 2}
              y={mapToSvg(item.volume)}
              width={klineConfig.candleWidth}
              height={klineConfig.volumeHeight - mapToSvg(item.volume)}
              fill={isRise ? klineConfig.riseColor : klineConfig.fallColor}
              stroke={fillColor}
              strokeWidth={1}
            />
          );
        })}

        {/* Y轴虚线 - 跟随鼠标垂直移动，只在鼠标移入时显示 */}
        {isHovered && (
          <line
            x1={coordinateX[index]}
            y1={0}
            x2={coordinateX[index]}
            y2={klineConfig.volumeHeight}
            stroke="gray"
            strokeWidth="1"
            strokeDasharray="4 2"
          />
        )}
      </g>
    </svg>
  );
}
