import request from '../utils/request';
type QueryStockByWordResponse = {
  代码: string;
  名称: string;
}[];
export const queryStockByWordApi = (w: string) =>
  request.get<QueryStockByWordResponse>('/search?w=' + w);
// 定义 K 线数据类型接口
export interface KlineDataItem {
  date: string; // 日期格式：YYYY-MM-DD
  open: number; // 开盘价
  high: number; // 最高价
  low: number; // 最低价
  close: number; // 收盘价
  volume: number; // 成交量
  percent: number; // 涨跌幅
  turnoverrate: number; // 换手率
}
export const getKlineDataApi = (
  code: string,
  period: string,
  timestamp: string,
  limit: number,
) =>
  request.get<KlineDataItem[]>(
    `/kline?code=${code}&period=${period}&timestamp=${timestamp}&limit=${limit}`,
  );
// 个股详情
export interface KlineDetailsType {
  name: string; // 股票名称
  code: string; // 股票代码
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
export const getKlineDetailsApi = (code: string) =>
  request.get<KlineDetailsType>(`/stock_details?code=${code}`);

// 获取自选列表
export interface SelectionItem {
  code: string; // 股票代码
  name: string; // 股票名称
  color: string; // 股票颜色
  remark: string; // 备注
  sort: number; // 排序
}
export const getSelectionApi = () =>
  request.get<SelectionItem[]>('/get_selection');

export const getSelectionRemarkApi = (code: string) =>
  request.get<SelectionItem>('/get_selection_remark?code=' + code);

export type SelectionDetailsItem = Pick<
  KlineDetailsType,
  'code' | 'current' | 'name' | 'percent'
>;
export const getSelectionDetails = (symbols: string) =>
  request.get<SelectionDetailsItem[]>(
    '/get_selection_detail?symbols=' + symbols,
  );

// 添加自选
export const addSelectionApi = (
  code: string,
  name: string,
  color: string = '',
  remark: string = '',
) => request.post<boolean>('/add_selection', { code, name, color, remark });

// 更新自选排序
export const updateSelectionSortApi = (newOrderCodes: string[]) =>
  request.post<boolean>('/update_selection_sort', { newOrderCodes });
// 删除自选
export const deleteSelectionApi = (code: string) =>
  request.post<boolean>('/delete_selection', { code });

// 检查自选是否存在
export const isSelectionExistsApi = (code: string) =>
  request.get<boolean>('/is_selection_exists?code=' + code);

// 获取自选三省列表
export interface StockReviewItem {
  id: string; // 股票代码
  code: string; // 股票名称
  title: string;
  date: string; // 股票日期
  description: string; // 描述
}
export const getStockReviewApi = (type: string, keyword: string) =>
  request.get<StockReviewItem[]>(
    `/get_stock_review?type=${type}&keyword=${keyword}`,
  );

export const getSingleStockReviewApi = (type: string, id: string) =>
  request.get<StockReviewItem>(
    `/get_single_stock_review?id=${id}&type=${type}`,
  );

// 添加
export const addStockReviewApi = (
  type: string,
  code: string,
  title: string,
  date: string = '',
  description: string = '',
) =>
  request.post<boolean>('/add_stock_review', {
    type,
    code,
    title,
    date,
    description,
  });
// 删除自选
export const deleteStockReviewApi = (type: string, code: string) =>
  request.post<boolean>('/delete_stock_review', { code, type });

//  大盘分析
export interface MarketAnalysisItem {
  [key: string]: null | {
    date: string;
    analysis: string;
  };
}
export const getAnalysisApi = (code: string) =>
  request.get<MarketAnalysisItem>(`/get_analysis_info?code=${code}`);

export const addAnalysisApi = (code: string, analysis: string) =>
  request.post<boolean>('/add_analysis_info', {
    analysis,
    code,
  });

//  画线
export interface LinePoint {
  x: number;
  y: number;
}
export type DrawlinesType = {
  id: string;
  start: LinePoint;
  end: LinePoint;
};
export interface StockLineType {
  code: string; // 股票代码
  period: string; // 周期（如 "day"、"week"、"month" 等）
  lines: DrawlinesType[];
  width: number;
  height: number;
}
export const getStockLineApi = (code: string, period: string) =>
  request.post<StockLineType>('/query_lines', {
    code,
    period,
  });

// 添加
export const addStockLineApi = (argus: Omit<StockLineType, 'id'>) =>
  request.post<boolean>('/add_line', {
    ...argus,
  });

export const deleteStockLineApi = (code: string, period: string, id: string) =>
  request.post<boolean>('/delete_line', { code, id, period });
