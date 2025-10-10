import React, { Fragment } from 'react';
import { formatNumber } from './util';

/**
 * 根据带市场前缀的股票代码判断最大涨跌幅
 * @param code - 格式：sh/sz+6位数字（如sh600000、sz300001）
 * @returns 涨跌幅上限（20=±20%，10=±10%，30=±30%）
 */
const getStockPriceRangeByCode = (code: string): number => {
  const normalizedCode = code.trim().toUpperCase();
  const codeMatch = normalizedCode.match(/^(SH|SZ)(\d{6})$/);
  if (!codeMatch) {
    console.warn(`股票代码格式错误：${code}，需为 sh/sz+6位数字`);
    return 10;
  }

  const coreCode = codeMatch[2];
  const cybPrefix = ['300', '301', '302']; // 创业板
  const kcbPrefix = ['688', '689']; // 科创板
  const bsePrefix = ['889', '83', '87', '82']; // 北交所

  if (cybPrefix.some((p) => coreCode.startsWith(p))) return 20;
  if (kcbPrefix.some((p) => coreCode.startsWith(p))) return 20;
  if (bsePrefix.some((p) => coreCode.startsWith(p))) return 30;
  return 10; // 主板/中小板
};

// 分时图背景组件Props
interface StockKlineChartTimeBgProps {
  width: number;
  height: number;
  code: string;
}

/**
 * 分时图背景网格组件（从9:30开始，不包含集合竞价）
 * - 时间点：9:30/10:00/10:30/11:00/11:30/13:30/14:00/14:30/15:00
 * - 每个时段均占1格宽度
 * - 不显示9:15-9:30的任何元素
 */
const StockKlineChartTimeBg: React.FC<StockKlineChartTimeBgProps> = ({
  width,
  height,
  code,
}) => {
  // 1. 基础配置
  const priceRange = getStockPriceRangeByCode(code);
  const maxPercent = priceRange;
  const minPercent = -priceRange;
  const yLineTotal = maxPercent - minPercent + 1;
  const yLineStepHeight = (height - 45) / (maxPercent - minPercent);

  const leftPadding = 30; // 左侧留白
  const rightPadding = 50; // 右侧留白
  const validWidth = width - leftPadding - rightPadding;

  // 2. 核心规则：定义时间点与对应“格数”（从9:30开始，每格1）
  const timePoints = [
    { label: '9:30', gridCount: 0 }, // 9:30作为起点，0格
    { label: '10:00', gridCount: 1 }, // 9:30-10:00，加1格
    { label: '10:30', gridCount: 2 }, // 10:00-10:30，加1格
    { label: '11:00', gridCount: 3 }, // 10:30-11:00，加1格
    { label: '11:30', gridCount: 4 }, // 11:00-11:30，加1格
    { label: '13:30', gridCount: 5 }, // 11:30-13:30，加1格
    { label: '14:00', gridCount: 6 }, // 13:30-14:00，加1格
    { label: '14:30', gridCount: 7 }, // 14:00-14:30，加1格
    { label: '15:00', gridCount: 8 }, // 14:30-15:00，加1格
  ];
  const totalGridCount = 8; // 总格数（从0到8，共8格）
  const gridWidth = validWidth / totalGridCount;

  // 3. 计算每个时间点的X坐标
  const timePositions = timePoints.map((point) => ({
    label: point.label,
    x: leftPadding + point.gridCount * gridWidth,
  }));

  return (
    <g>
      {/* 1. 整体背景 */}
      <rect x="0" y="0" width={width} height={height} fill="#191B1F" />

      {/* 2. Y轴网格线 + 标签 */}
      {Array.from({ length: yLineTotal }).map((_, i) => {
        const currentPercent = maxPercent - i;
        const y = 10 + i * yLineStepHeight;
        const labelX = width - rightPadding + 5;

        const isZeroLine = currentPercent === 0;
        const lineStroke = isZeroLine ? '#888' : '#363C47';
        const lineStrokeWidth = isZeroLine ? 1 : 0.3;
        const showLabel = currentPercent % 2 === 0;

        return (
          <Fragment key={`y-grid-${i}`}>
            <line
              x1={leftPadding}
              y1={y}
              x2={width - rightPadding}
              y2={y}
              stroke={lineStroke}
              strokeWidth={lineStrokeWidth}
            />
            {showLabel && (
              <text
                x={labelX}
                y={y}
                textAnchor="start"
                dominantBaseline="middle"
                fontSize={12}
                fill={isZeroLine ? '#888' : '#666'}
              >
                {formatNumber(currentPercent)}%
              </text>
            )}
          </Fragment>
        );
      })}

      {/* 3. X轴网格线 + 时间标签（从9:30开始） */}
      {timePositions.map((pos, i) => (
        <Fragment key={`x-grid-${i}`}>
          <line
            x1={pos.x}
            y1={10}
            x2={pos.x}
            y2={height - 45}
            stroke="#363C47"
            strokeWidth={0.5}
          />
          <text
            x={pos.x}
            y={height - 15}
            textAnchor="middle"
            dominantBaseline="hanging"
            fontSize={12}
            fill="#666" // 所有标签颜色一致
          >
            {pos.label}
          </text>
        </Fragment>
      ))}
    </g>
  );
};

export default StockKlineChartTimeBg;
