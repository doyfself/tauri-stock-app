type ResponseBaseType<T> = {
  success: boolean;
  message: string;
  data: T;
  count?: number;
};

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
