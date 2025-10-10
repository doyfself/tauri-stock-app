import klineConfig from './config';
import type { KlineDataType } from './types';
export function mapKlineToSvg(
  svgHeight: number,
  minPrice: number,
  maxPrice: number,
) {
  // 计算实际可用高度（减去上下边距）
  const availableHeight = svgHeight - klineConfig.padding * 2;

  // 计算价格范围
  const priceRange = maxPrice - minPrice;

  // 价格到Y坐标的映射函数
  // 注意：SVG的Y轴向下为正，所以需要反转
  const priceToY = (price: number) => {
    const ratio = (maxPrice - price) / priceRange;
    return klineConfig.padding + ratio * availableHeight;
  };
  return priceToY;
}

export function formatNumber(num: number) {
  // 检查是否为有效数字
  if (typeof num !== 'number' || isNaN(num)) {
    return num; // 非数字则返回原值
  }

  if (num >= 10) {
    // 大于等于10则取整
    return Math.round(num);
  } else if (num >= 1) {
    // 大于等于1且小于10则保留1位小数
    return Number(num.toFixed(1));
  } else {
    // 小于1则保留2位小数
    return Number(num.toFixed(2));
  }
}

/**
 * 将成交量数值转换为"xx万""xx亿"格式，保留两位小数
 * @param volume 原始成交量数值（如1234567、8901234567等）
 * @returns 格式化后的字符串（如"123.46万"、"89.01亿"）
 */
export const formatVolume = (volume: number): string => {
  // 处理非数字或负数情况（成交量通常非负）
  if (isNaN(volume) || volume < 0) {
    return '0.00万';
  }

  // 定义单位转换阈值（1亿 = 10000万 = 10^8，1万 = 10^4）
  const 亿 = 100000000;
  const 万 = 10000;

  // 根据数值大小选择单位并转换
  if (volume >= 亿) {
    // 大于等于1亿时，转换为“亿”单位
    const value = volume / 亿;
    return `${value.toFixed(2)}亿`;
  } else if (volume >= 万) {
    // 大于等于1万且小于1亿时，转换为“万”单位
    const value = volume / 万;
    return `${value.toFixed(2)}万`;
  } else {
    // 小于1万时，直接保留两位小数（不添加单位）
    return volume.toFixed(2);
  }
};

export function calculateMA(data: KlineDataType[], period: number): number[] {
  // 验证输入
  if (!Array.isArray(data) || data.length === 0) {
    return []; // 如果数据为空，返回空数组
  }

  const result = [];

  // 遍历所有K线数据
  for (let i = 0; i < data.length; i++) {
    // 前period-1个数据点无法计算均线，用null表示
    if (i < period - 1) {
      result.push(-1);
      continue;
    }

    // 计算从i-period+1到i的收盘价平均值
    let sum = 0;
    for (let j = 0; j < period; j++) {
      // 确保数据点有收盘价属性
      if (data[i - j] && typeof data[i - j].close === 'number') {
        sum += data[i - j].close;
      } else {
        throw new Error(`第${i - j}个数据点缺少有效的收盘价`);
      }
    }
    // 计算平均值并保留适当的小数位数
    const average = sum / period;
    result.push(Number(average.toFixed(2))); // 保留两位小数
  }
  return result;
}

// 计算贯穿线的起点和终点（确保线条穿过整个SVG）
export const getLinePoints = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  height: number,
): { start: LinePoint; end: LinePoint } => {
  // 计算线条斜率和截距（y = kx + b）
  const dx = x2 - x1;
  const dy = y2 - y1;

  // 特殊情况：垂直线（x坐标不变）
  if (dx === 0) {
    return {
      start: { x: x1, y: 0 }, // 顶部边界
      end: { x: x1, y: height }, // 底部边界
    };
  }

  // 特殊情况：水平线（y坐标不变）
  if (dy === 0) {
    return {
      start: { x: 0, y: y1 }, // 左侧边界
      end: { x: width, y: y1 }, // 右侧边界
    };
  }

  // 一般情况：计算线条与SVG边界的交点
  const k = dy / dx; // 斜率
  const b = y1 - k * x1; // 截距

  // 计算与左边界（x=0）的交点
  const leftY = k * 0 + b;
  // 计算与右边界（x=width）的交点
  const rightY = k * width + b;
  // 计算与上边界（y=0）的交点
  const topX = (0 - b) / k;
  // 计算与下边界（y=height）的交点
  const bottomX = (height - b) / k;

  // 筛选在SVG范围内的交点，确定贯穿线的两个端点
  const intersections: LinePoint[] = [];
  if (leftY >= 0 && leftY <= height) intersections.push({ x: 0, y: leftY });
  if (rightY >= 0 && rightY <= height)
    intersections.push({ x: width, y: rightY });
  if (topX >= 0 && topX <= width) intersections.push({ x: topX, y: 0 });
  if (bottomX >= 0 && bottomX <= width)
    intersections.push({ x: bottomX, y: height });

  // 取距离最远的两个交点（确保贯穿整个SVG）
  if (intersections.length >= 2) {
    return { start: intersections[0], end: intersections[1] };
  }

  //  fallback：默认取对角线（理论上不会触发）
  return { start: { x: 0, y: 0 }, end: { x: width, y: height } };
};
