import { Fragment, useEffect, useState } from 'react';
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

// 背景网格基础配置（与StockKlineChartTimeBg保持一致：8格覆盖全天交易时段）
const backgroundConfig = {
  totalGridCount: 8, // 背景总网格数（9:30-15:00）
  leftPadding: 30, // 左侧留白（与背景组件对齐）
  rightPadding: 50, // 右侧留白（与背景组件对齐）
  yTopPadding: 10, // Y轴顶部留白
  yBottomReserve: 45, // Y轴底部预留（X轴标签高度）
};

const StockKlineChartTimeLine = ({
  width,
  height,
  code,
}: StockMinuteChartProps) => {
  const [minuteData, setMinuteData] = useState<StockMinuteItem[]>([]);
  const totalExpectedData = 240; // 全天分时数据总数（9:30-11:30 120条 + 13:30-15:00 120条）

  // 数据请求：首次加载+定时刷新
  const fetchMinuteData = async () => {
    try {
      const response = await getMinuteDataByCode(code);
      if (response.data && response.data.length > 0) {
        // 确保数据按时间升序（避免索引与实际交易顺序错位）
        const sortedData = response.data.sort(
          (a, b) => a.timestamp - b.timestamp,
        );
        setMinuteData(sortedData);
      }
    } catch (err) {
      console.warn(`获取${code}分时数据失败:`, err);
    }
  };
  useInterval(fetchMinuteData); // 定时刷新
  useEffect(() => {
    fetchMinuteData(); // 组件挂载/代码变化时首次加载
  }, [code]);

  // 核心：按数据索引计算X/Y坐标
  const getXByIndex = (index: number): number => {
    // 1. 计算背景有效宽度（总宽度 - 左右留白）
    const validWidth =
      width - backgroundConfig.leftPadding - backgroundConfig.rightPadding;
    // 2. 按“当前索引/总数据量”计算占比（确保240条数据铺满8个网格）
    // 若数据未加载完全（<240条），仍按当前总数据量计算，避免拉伸
    const dataCount = minuteData.length;
    const indexRatio = dataCount === 0 ? 0 : index / (dataCount - 1);
    // 3. 映射到有效宽度，加上左侧留白 → 最终X坐标
    return backgroundConfig.leftPadding + indexRatio * validWidth;
  };

  const getYByPercent = (percent: number): number => {
    // 1. 计算背景Y轴有效高度（总高度 - 上下预留）
    const validHeight =
      height - backgroundConfig.yTopPadding - backgroundConfig.yBottomReserve;
    // 2. 获取价格涨跌幅范围（如10%/20%，与背景网格对齐）
    const priceRange = getStockPriceRangeByCode(code);
    const maxPercent = priceRange;
    const minPercent = -priceRange;
    const percentRange = maxPercent - minPercent;
    // 3. 涨跌幅映射到Y轴（从上到下百分比递减，与背景对齐）
    const percentRatio = (maxPercent - percent) / percentRange;
    return backgroundConfig.yTopPadding + percentRatio * validHeight;
  };

  // 生成分时线Path路径
  const getPathData = (): string => {
    if (minuteData.length === 0) return '';

    return minuteData.reduce((path, item, index) => {
      const x = getXByIndex(index);
      const y = getYByPercent(item.percent);
      // 第一个点用“移动（M）”，后续点用“连线（L）”
      return index === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
    }, '');
  };

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* 1. 渲染背景组件（网格+时间标签，与数据对齐） */}
      <StockKlineChartTimeBg width={width} height={height} code={code} />

      {/* 2. 渲染分时数据线 */}
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
          strokeLinecap="round" // 线条端点圆角，优化视觉
        />
      )}
    </svg>
  );
};

export default StockKlineChartTimeLine;
