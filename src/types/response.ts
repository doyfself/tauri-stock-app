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
  y: number;
  id: number; // 唯一标识符
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

// 持仓相关类型
// types/response.ts

export interface HoldingItem {
  id: number;
  code: string;
  name: string;
  cost: number;
  quantity: number;
  hold_time: string;
  status: number; // 1-当前持仓，0-历史记录
  sell_time?: string; // 卖出时间
  sell_price?: number; // 卖出价格
  profit?: number; // 盈利
}

export interface AddHoldingParams {
  code: string;
  name: string;
  cost: number;
  quantity: number;
  hold_time: string;
  status?: number; // 可选，默认为1
}

export interface UpdateHoldingParams {
  id: number;
  cost?: number;
  quantity?: number;
  status?: number;
  sell_time?: string;
  sell_price?: number;
  profit?: number;
}

export type GetAllHoldingsInvokeReturn = Promise<
  ResponseBaseType<HoldingItem[]>
>;

export type GetHoldingByCodeInvokeReturn = Promise<
  ResponseBaseType<HoldingItem>
>;

export interface MonthlyStats {
  year: number;
  month: number;
  operation_count: number;
  win_rate: number;
  total_profit: number;
}

export type GetMonthlyStatsInvokeReturn = Promise<
  ResponseBaseType<MonthlyStats>
>;

// 委托相关类型
export interface OrderItem {
  id: number; // 唯一标识符
  code: string; // 股票代码
  name: string; // 股票名称
  time: string; // 委托时间
  quantity: number; // 委托数量
  cost: number; // 委托价格/成本
  action: string; // 操作类型：买入/卖出
}

export interface PaginatedOrders<T> {
  orders: T[];
  total: number; // 总记录数
  page: number; // 当前页码
  page_size: number; // 每页大小
  total_pages: number; // 总页数
}

// 委托 API 返回类型
export type GetAllOrdersInvokeReturn = Promise<
  ResponseBaseType<PaginatedOrders<OrderItem>>
>;

export type GetOrdersByCodeInvokeReturn = Promise<
  ResponseBaseType<OrderItem[]>
>;
