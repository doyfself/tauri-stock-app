import { Fragment, useEffect, useState } from 'react';
import { getMinuteDataByCode } from '@/apis/api';
import type { StockMinuteItem } from '@/types/response';
import StockKlineChartTimeBg from './StockKlineChartTimeBg';
interface StockMinuteChartProps {
  width: number;
  height: number;
  code: string;
}
const StockKlineChartTimeLine = ({
  width,
  height,
  code,
}: StockMinuteChartProps) => {
  // 仅用useState存储分时数据，不额外封装Hook
  const [minuteData, setMinuteData] = useState<StockMinuteItem[]>([]);

  // 1. 集成数据请求：组件挂载/代码变化时请求数据
  useEffect(() => {
    // 定义请求函数（内部异步函数，避免直接用async修饰useEffect）
    const fetchMinuteData = async () => {
      try {
        // 调用你的前端API，获取分时数据
        const response = await getMinuteDataByCode(code);
        console.log(response, '分时数据');
        // 若请求成功且有数据，更新状态
        if (response.data) {
          setMinuteData(response.data);
        }
      } catch (err) {
        // 按需求去除error处理，仅在控制台打印（可选）
        console.warn(`获取${code}分时数据失败:`, err);
      }
    };

    // 执行请求
    fetchMinuteData();
  }, [code]); // 仅当code变化时重新请求

  // 2. 计算分时数据线的坐标（与背景组件坐标规则完全对齐）
  // 核心：复用背景组件的网格计算逻辑，确保数据线与背景网格匹配
  const getPathData = (): string => {
    // 若无数据，返回空路径
    if (minuteData.length === 0) return '';

    // --- 复用背景组件的坐标规则 ---
    const leftPadding = 30; // 与背景组件一致的左侧留白
    const rightPadding = 50; // 与背景组件一致的右侧留白
    const validWidth = width - leftPadding - rightPadding; // 背景组件的有效网格宽度
    const yTopPadding = 10; // 背景组件Y轴网格顶部留白
    const yBottomReserve = 45; // 背景组件Y轴底部预留高度（X轴标签）
    const validHeight = height - yTopPadding - yBottomReserve; // 背景组件的有效网格高度

    // --- 计算Y轴坐标（匹配背景组件的percent范围）---
    // 先获取股票的涨跌幅范围（复用背景组件的getStockPriceRangeByCode逻辑）
    const getStockPriceRange = (code: string): number => {
      const normalizedCode = code.trim().toUpperCase();
      const codeMatch = normalizedCode.match(/^(SH|SZ)(\d{6})$/);
      if (!codeMatch) return 10;
      const coreCode = codeMatch[2];
      const cybPrefix = ['300', '301', '302'];
      const kcbPrefix = ['688', '689'];
      const bsePrefix = ['889', '83', '87', '82'];
      if (cybPrefix.some((p) => coreCode.startsWith(p))) return 20;
      if (kcbPrefix.some((p) => coreCode.startsWith(p))) return 20;
      if (bsePrefix.some((p) => coreCode.startsWith(p))) return 30;
      return 10;
    };
    const priceRange = getStockPriceRange(code);
    const maxPercent = priceRange;
    const minPercent = -priceRange;
    const percentRange = maxPercent - minPercent; // 背景组件Y轴的percent总范围

    // Y轴坐标转换：将数据的percent映射到SVG的y坐标
    // 背景组件Y轴网格是“从上到下percent递减”，需同步此规则
    const getYCoord = (percent: number) => {
      // 计算percent在总范围中的占比（0~1）
      const percentRatio = (maxPercent - percent) / percentRange;
      // 映射到背景组件的有效高度，加上顶部留白
      return yTopPadding + percentRatio * validHeight;
    };

    // --- 计算X轴坐标（匹配背景组件的时间网格）---
    // 分时数据点按时间均匀分布，按“数据点索引/总点数”分配X坐标
    const totalDataPoints = minuteData.length;
    const getXCoord = (index: number) => {
      // 计算当前数据点在时间轴中的占比（0~1）
      const timeRatio = index / (totalDataPoints - 1);
      // 映射到背景组件的有效宽度，加上左侧留白
      return leftPadding + timeRatio * validWidth;
    };

    // --- 生成SVG Path路径（M+L指令）---
    return minuteData.reduce((path, point, index) => {
      const x = getXCoord(index);
      const y = getYCoord(point.percent);
      // 第一个点用M（移动），后续点用L（连线）
      return index === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
    }, '');
  };

  // 3. 渲染：背景组件在下，分时数据线在上
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* 1. 渲染背景组件（网格+坐标） */}
      <StockKlineChartTimeBg width={width} height={height} code={code} />

      {/* 2. 渲染分时数据线（盖在背景上） */}
      {minuteData.length > 0 && (
        <path
          d={getPathData()}
          fill="none" // 不填充区域，仅显示线条
          stroke="#52c41a" // 绿色分时线（可根据涨跌调整颜色）
          strokeWidth={1.5} // 线条宽度，确保清晰可见
          strokeLinecap="round" // 线条端点圆角，优化视觉
        />
      )}

      {/* 可选：渲染最新价格点和标签（增强交互） */}
      {minuteData.length > 0 && (
        <Fragment>
          // 最新价格点（圆形标记）
          <circle
            cx={getXCoord(minuteData.length - 1)}
            cy={getYCoord(minuteData[minuteData.length - 1].percent)}
            r={4} // 圆点大小
            fill="#52c41a" // 与线条同色
            stroke="#191B1F" // 黑色边框，与背景区分
            strokeWidth={1}
          />
          // 最新价格标签
          <text
            x={getXCoord(minuteData.length - 1) + 8} // 标签在圆点右侧8px
            y={getYCoord(minuteData[minuteData.length - 1].percent)}
            fill="#52c41a" // 与线条同色
            fontSize={12}
            dominantBaseline="middle" // 垂直居中对齐
            textAnchor="start" // 文本从x坐标开始向右排列
          >
            {minuteData[minuteData.length - 1].percent.toFixed(2)}%
          </text>
        </Fragment>
      )}
    </svg>
  );

  // --- 辅助函数：复用背景组件的坐标计算逻辑 ---
  function getStockPriceRange(code: string): number {
    const normalizedCode = code.trim().toUpperCase();
    const codeMatch = normalizedCode.match(/^(SH|SZ)(\d{6})$/);
    if (!codeMatch) return 10;
    const coreCode = codeMatch[2];
    const cybPrefix = ['300', '301', '302'];
    const kcbPrefix = ['688', '689'];
    const bsePrefix = ['889', '83', '87', '82'];
    if (cybPrefix.some((p) => coreCode.startsWith(p))) return 20;
    if (kcbPrefix.some((p) => coreCode.startsWith(p))) return 20;
    if (bsePrefix.some((p) => coreCode.startsWith(p))) return 30;
    return 10;
  }

  function getXCoord(index: number): number {
    const leftPadding = 30;
    const rightPadding = 50;
    const validWidth = width - leftPadding - rightPadding;
    const totalDataPoints = minuteData.length;
    return leftPadding + (index / (totalDataPoints - 1)) * validWidth;
  }

  function getYCoord(percent: number): number {
    const priceRange = getStockPriceRange(code);
    const maxPercent = priceRange;
    const minPercent = -priceRange;
    const percentRange = maxPercent - minPercent;
    const yTopPadding = 10;
    const yBottomReserve = 45;
    const validHeight = height - yTopPadding - yBottomReserve;
    return yTopPadding + ((maxPercent - percent) / percentRange) * validHeight;
  }
};

export default StockKlineChartTimeLine;
