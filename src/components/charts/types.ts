export interface KlineDataType {
  date: string; // 日期格式：YYYY-MM-DD HH:mm
  open: number; // 开盘价
  high: number; // 最高价
  low: number; // 最低价
  close: number; // 收盘价
  volume: number; // 成交量
  percent: number; // 涨跌幅
  turnoverrate: number; // 换手率
}

export interface StockKlineChartMainProps {
  code: string;
  width: number;
  height: number;
  timestamp?: string;
  limit?: number;
}
export interface StockKlineChartChildProps
  extends Pick<StockKlineChartMainProps, 'width' | 'height'> {
  data: KlineDataType[];
  maxPrice: number;
  minPrice: number;
  coordinateX: number[]; // X轴坐标数组
  mapToSvg: (price: number) => number; // 将价格映射到SVG坐标
}

export interface StockKlineChartVolumeProps
  extends Pick<StockKlineChartChildProps, 'data' | 'coordinateX' | 'width'> {
  index: number; // 当前选中的柱子索引
  isHovered: boolean; // 是否处于悬停状态
}
