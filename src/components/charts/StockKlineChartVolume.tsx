import klineConfig from './config';
import type { StockKlineChartVolumeProps } from './types';
import { formatVolume } from './util';

export const StockKlineChartVolumeBar = ({
  index,
  data,
}: Pick<StockKlineChartVolumeProps, 'index' | 'data'>) => {
  return (
    <div
      className="bg-[#23272D] text-[12px] px-[10px] text-[#fff]"
      style={{
        height: klineConfig.barHeight + 'px',
        lineHeight: klineConfig.barHeight + 'px',
      }}
    >
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

  // 计算每个成交量柱的高度和位置
  const getVolumeBarProps = (volume: number) => {
    if (maxVolume === 0) {
      return { height: 0, y: klineConfig.volumeHeight };
    }

    // maxVolume 占据 90% 的高度，其他按比例计算
    const barHeight = (volume / maxVolume) * (klineConfig.volumeHeight * 0.9);
    const y = klineConfig.volumeHeight - barHeight;

    return { height: barHeight, y };
  };

  return (
    <svg width={width} height={klineConfig.volumeHeight}>
      <g>
        {/* 背景 */}
        <rect
          x="0"
          y="0"
          width={width}
          height={klineConfig.volumeHeight}
          fill="#191B1F"
        />

        {/* 成交量柱 */}
        {data.map((item, idx) => {
          const isRise = item.close >= item.open;
          const fillColor = isRise
            ? klineConfig.riseColor
            : klineConfig.fallColor;
          const { height: barHeight, y } = getVolumeBarProps(item.volume);

          // 如果高度为0，不渲染柱子
          if (barHeight === 0) return null;

          return (
            <rect
              key={`stock-kline-chart-volume-${idx}`}
              x={coordinateX[idx] - klineConfig.candleWidth / 2}
              y={y}
              width={klineConfig.candleWidth}
              height={barHeight}
              fill={fillColor}
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
