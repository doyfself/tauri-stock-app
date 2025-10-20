type ResponseBaseType<T> = {
  success: boolean;
  message: string;
  data: T;
  count?: number;
};

export type InvokeBooleanReturn = Promise<ResponseBaseType<boolean>>;

export type SearchStocksResponse = {
  symbol: string;
  name: string;
};

export type SearchStocksInvokeReturn = Promise<
  ResponseBaseType<SearchStocksResponse[]>
>;

export type KlineDataResponse = {
  date: string; // 日期格式：YYYY-MM-DD
  open: number; // 开盘价
  high: number; // 最高价
  low: number; // 最低价
  close: number; // 收盘价
  volume: number; // 成交量
  percent: number; // 涨跌幅
  turnoverrate: number; // 换手率
};
export type KlineDataInvokeReturn = Promise<
  ResponseBaseType<KlineDataResponse[]>
>;

export interface SelectionItem {
  code: string; // 股票代码
  name: string; // 股票名称
  color: string; // 股票颜色
  remark: string; // 备注
  sort: number; // 排序
}
export type GetAllSelectionInvokeReturn = Promise<
  ResponseBaseType<SelectionItem[]>
>;

export type GetSingleSelectionInvokeReturn = Promise<
  ResponseBaseType<SelectionItem>
>;

// 个股详情
export interface SingleStockDetailsType {
  name: string; // 股票名称
  symbol: string; // 股票代码
  current: number; // 当前价格
  pe_lyr: number; // 市盈率（TTM）
  pe_ttm: number; // 市盈率（静态）
  pe_forecast: number; // 市盈率（预测）
  percent: number; // 涨跌幅
  market_capital: number; // 市值
  limit_up: number; // 涨停价
  limit_down: number; // 跌停价
  last_close: number; // 昨收
  open: number; // 开盘价
  high: number; // 最高价
  low: number; // 最低价
  volume_ratio: number; // 量比
  turnover_rate: number; // 换手率
}

export type SingleStockDetailsInvokeReturn = Promise<
  ResponseBaseType<SingleStockDetailsType>
>;

export interface StockMinuteItem {
  timestamp: number; // 时间戳
  percent: number; // 涨跌幅
  volume: number; // 成交量
}
export type GetStockMinuteDataInvokeReturn = Promise<
  ResponseBaseType<StockMinuteItem[]>
>;

export type SelectionDetailsType = Pick<
  SingleStockDetailsType,
  'name' | 'current' | 'percent'
> & {
  code: string;
};
export type GetSelectionDetailsInvokeReturn = Promise<
  ResponseBaseType<SelectionDetailsType[]>
>;

export interface StockLineType {
  code: string; // 股票代码
  period: string; // 周期（如 "day"、"week"、"month" 等）
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  id: number; // 唯一标识符
  width: number;
  height: number;
}
export type GetStockLinesInvokeReturn = Promise<
  ResponseBaseType<StockLineType[]>
>;

export interface StockReviewItem {
  id: number; // 唯一标识符
  code: string; // 股票名称
  type: string; // 评论类型
  title: string;
  date: string; // 股票日期
  description: string; // 描述
}
export type StockReviewListItem = Pick<StockReviewItem, 'id' | 'title'>;

export type GetStockReviewInvokeReturn = Promise<
  ResponseBaseType<StockReviewListItem[]>
>;

export type GetSingleStockReviewInvokeReturn = Promise<
  ResponseBaseType<StockReviewItem>
>;

export type MarketAnalysisItem = {
  date: string; // 日期格式：YYYY-MM-DD
  analysis: string;
  status: string;
};
export type GetLastMarketAnalysisInvokeReturn = Promise<
  ResponseBaseType<MarketAnalysisItem[]>
>;

export interface SelfReflectItem {
  id: number; // 唯一标识符
  code: string; // 股票名称
  title: string;
  date: string; // 股票日期
  description: string; // 描述
}
export type SelfReflectListItem = Pick<SelfReflectItem, 'id' | 'title'>;

export type GetSelfReflectInvokeReturn = Promise<
  ResponseBaseType<SelfReflectListItem[]>
>;

export type GetSingleSelfReflectInvokeReturn = Promise<
  ResponseBaseType<SelfReflectItem>
>;
