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

/**
 * 将实际价格转换为SVG水平贯穿线的起点和终点坐标
 * @param price - 实际价格
 * @param svgWidth - SVG的总宽度
 * @param svgHeight - SVG的总高度
 * @param maxPrice - K线图最高价
 * @param minPrice - K线图最低价
 * @returns 水平线的起点和终点坐标（{ start: {x, y}, end: {x, y} }）
 */
export const priceToHorizontalLine = (
  price: number,
  svgWidth: number,
  svgHeight: number,
  maxPrice: number,
  minPrice: number,
): {
  start: { x: number; y: number };
  end: { x: number; y: number };
} => {
  // 计算有效绘图区域高度（扣除上下间距）
  const validHeight = svgHeight - 2 * klineConfig.padding;
  if (validHeight <= 0) {
    // 无效高度时返回默认中线
    const defaultY = svgHeight / 2;
    return {
      start: { x: 0, y: defaultY },
      end: { x: svgWidth, y: defaultY },
    };
  }

  const priceRange = maxPrice - minPrice;
  // 价格超出范围时取边界值
  const clampedPrice = Math.max(minPrice, Math.min(maxPrice, price));
  // 计算有效区域内的相对y坐标（处理价格无波动的特殊情况）
  const relativeY =
    priceRange === 0
      ? validHeight / 2 // 价格无波动时居中显示
      : (1 - (clampedPrice - minPrice) / priceRange) * validHeight;

  // 最终SVG的y坐标（加上顶部间距）
  const lineY = relativeY + klineConfig.padding;

  // 返回水平贯穿线的起点（左边界）和终点（右边界）
  return {
    start: { x: 0, y: lineY },
    end: { x: svgWidth, y: lineY },
  };
};

/**
 * 将SVG的y坐标转换为实际价格
 * @param y - SVG中的y坐标（像素值）
 * @param height - SVG的总高度
 * @param maxPrice - K线图最高价
 * @param minPrice - K线图最低价
 * @returns 转换后的实际价格（保留2位小数）
 */
export const yToPrice = (
  y: number,
  height: number,
  maxPrice: number,
  minPrice: number,
): number => {
  const validHeight = height - 2 * klineConfig.padding;
  if (validHeight <= 0) return 0;

  const relativeY = y - klineConfig.padding;
  const clampedY = Math.max(0, Math.min(validHeight, relativeY));
  const priceRange = maxPrice - minPrice;

  const price =
    priceRange === 0
      ? maxPrice
      : maxPrice - (clampedY / validHeight) * priceRange;

  return Math.round(price * 100) / 100;
};

/**
 * 将实际价格转换为SVG的y坐标
 * @param price - 实际价格
 * @param height - SVG总高度
 * @param maxPrice - K线图最高价
 * @param minPrice - K线图最低价
 * @returns 对应的SVG y坐标（像素值）
 */
export const priceToY = (
  price: number,
  height: number,
  maxPrice: number,
  minPrice: number,
): number => {
  const validHeight = height - 2 * klineConfig.padding;
  if (validHeight <= 0) return height / 2;

  // 处理价格超出范围的情况（可选，通常不会发生）
  const clampedPrice = Math.max(minPrice, Math.min(maxPrice, price));
  const priceRange = maxPrice - minPrice;

  let relativeY: number;
  if (priceRange === 0) {
    relativeY = validHeight / 2; // 或 0，取决于你想放哪
  } else {
    // 注意：maxPrice 在顶部，所以价格越高，y 越小
    relativeY = ((maxPrice - clampedPrice) / priceRange) * validHeight;
  }

  return klineConfig.padding + relativeY;
};

// 时间戳转SVG x坐标（线性映射）
export const timeToX = (
  timestamp: number,
  containerWidth: number,
  timeMin: number,
  timeMax: number,
): number => {
  if (timeMax <= timeMin) return containerWidth / 2;
  const ratio = (timestamp - timeMin) / (timeMax - timeMin);
  return Math.max(0, Math.min(containerWidth, ratio * containerWidth));
};

/**
 * 根据带市场前缀的股票代码判断最大涨跌幅
 * @param code - 格式：sh/sz+6位数字（如sh600000、sz300001）
 * @returns 涨跌幅上限（20=±20%，10=±10%，30=±30%）
 */
export const getStockPriceRangeByCode = (code: string): number => {
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
