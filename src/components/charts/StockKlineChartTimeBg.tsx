import React, { Fragment, useMemo } from 'react';
interface StockKlineChartTimeBgProps {
  width: number;
  height: number;
  yMax: number;
  yMin: number;
}

const StockKlineChartTimeBg: React.FC<StockKlineChartTimeBgProps> = ({
  width,
  height,
  yMax,
  yMin,
}) => {
  const leftPadding = 30;
  const rightPadding = 50;
  const topPadding = 10;
  const bottomReserve = 45;
  const validWidth = width - leftPadding - rightPadding;
  const validHeight = height - topPadding - bottomReserve;

  // Y轴网格：1%整数间隔（背景参考线）
  const yLines = useMemo(() => {
    const lines: number[] = [];
    for (let p = yMax; p >= yMin; p -= 1) {
      lines.push(p);
    }
    return lines;
  }, [yMax, yMin]);

  const yLineStepHeight = validHeight / (yLines.length - 1 || 1);

  // X轴时间配置
  const timePoints = [
    { label: '9:30', gridCount: 0 },
    { label: '10:00', gridCount: 1 },
    { label: '10:30', gridCount: 2 },
    { label: '11:00', gridCount: 3 },
    { label: '11:30', gridCount: 4 },
    { label: '13:30', gridCount: 5 },
    { label: '14:00', gridCount: 6 },
    { label: '14:30', gridCount: 7 },
    { label: '15:00', gridCount: 8 },
  ];
  const totalGridCount = 8;
  const gridWidth = validWidth / totalGridCount;
  const timePositions = timePoints.map((point) => ({
    label: point.label,
    x: leftPadding + point.gridCount * gridWidth,
  }));

  return (
    <g>
      <rect x="0" y="0" width={width} height={height} fill="#191B1F" />

      {/* Y轴网格线（整数百分比参考线） */}
      {yLines.map((percent, i) => {
        const y = topPadding + i * yLineStepHeight;
        const labelX = width - rightPadding + 5;
        const isZeroLine = percent === 0;

        return (
          <Fragment key={`y-grid-${i}`}>
            <line
              x1={leftPadding}
              y1={y}
              x2={width - rightPadding}
              y2={y}
              stroke={isZeroLine ? '#888' : '#363C47'}
              strokeWidth={isZeroLine ? 1.2 : 0.3}
            />
            <text
              x={labelX}
              y={y}
              textAnchor="start"
              dominantBaseline="middle"
              fontSize={12}
              fill={isZeroLine ? '#fff' : '#666'}
            >
              {percent === 0 ? '0%' : `${percent}%`}
            </text>
          </Fragment>
        );
      })}

      {/* X轴网格线 + 时间标签 */}
      {timePositions.map((pos, i) => (
        <Fragment key={`x-grid-${i}`}>
          <line
            x1={pos.x}
            y1={topPadding}
            x2={pos.x}
            y2={height - bottomReserve}
            stroke="#363C47"
            strokeWidth={0.5}
          />
          <text
            x={pos.x}
            y={height - 15}
            textAnchor="middle"
            dominantBaseline="hanging"
            fontSize={12}
            fill="#666"
          >
            {pos.label}
          </text>
        </Fragment>
      ))}
    </g>
  );
};

export default StockKlineChartTimeBg;
