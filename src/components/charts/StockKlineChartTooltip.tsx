import type { StockKlineChartVolumeProps } from './types';
import klineConfig from './config';
export default function StockKlineChartTooltip({
  data,
  coordinateX,
  index,
  isHovered,
  width,
}: Pick<
  StockKlineChartVolumeProps,
  'data' | 'coordinateX' | 'index' | 'isHovered' | 'width'
>) {
  const x = index >= coordinateX.length / 2 ? 0 : width - 160;
  if (data.length && isHovered) {
    const item = data[index];
    const rows = [
      { label: '时间', value: item.date },
      { label: '开盘价', value: item.open },
      {
        label: '最高价',
        value: item.high,
      },
      {
        label: '最低价',
        value: item.low,
      },
      { label: '收盘价', value: item.close },
      {
        label: '涨跌幅',
        value: `${item.percent}%`,
      },
      { label: '换手率', value: `${item.turnoverrate}%` },
      // { label: '横坐标', value: coordinateX[index] },
    ];
    return (
      <g>
        <rect
          x={x}
          y="0"
          width="160"
          height="180"
          fill="#1E2124"
          stroke="#30343A"
          strokeWidth={1}
        ></rect>
        {rows.map((row, i) => (
          <g key={i} transform={`translate(${x + 40}, ${22 + i * 20})`}>
            {/* 标题：右对齐 */}
            <text
              fontSize={12}
              fill="#FFF"
              textAnchor="end" // 右对齐
              dx={0} // 距离右侧的间距
              width={80} // 标题的固定宽度
            >
              {row.label}
            </text>

            {/* 内容：左对齐，跟在标题后面 */}
            <text
              fontSize={12}
              fill={
                item.percent >= 0
                  ? klineConfig.riseColor
                  : klineConfig.fallColor
              }
              textAnchor="start" // 左对齐
              dx={10} // 标题和内容的间距
            >
              {row.value}
            </text>
          </g>
        ))}
      </g>
    );
  }
}
