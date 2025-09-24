import request from '../utils/request';
import { invoke } from '@tauri-apps/api/core';
import * as responseType from '@/types/response';
export const queryStockByWordApi = (w: string) =>
  invoke<responseType.SearchStocksInvokeReturn>('search_stocks_by_keyword', {
    keyword: w, // 仅需传递关键词
  });
// K线数据
export const getKlineDataApi = (
  code: string,
  period: string,
  timestamp: string,
  limit: number = 100,
) =>
  invoke<responseType.KlineDataInvokeReturn>('get_kline_data', {
    params: {
      code,
      period,
      timestamp,
      limit,
    },
  });

export const getAllSelectionsApi = () =>
  invoke<responseType.GetAllSelectionInvokeReturn>('get_all_selections_cmd');

export const getSelectionByCode = (code: string) =>
  invoke<responseType.GetSingleSelectionInvokeReturn>(
    'get_selection_by_code_cmd',
    { code },
  );

// 添加自选
export const addSelectionApi = (selection: {
  code: string;
  name: string;
  color: string;
  remark: string;
  sort: number;
}) =>
  invoke<responseType.InvokeBooleanReturn>('add_or_update_selection_cmd', {
    selection,
  });

// 更新自选排序
export const updateSelectionSortApi = (newOrderCodes: string[]) =>
  invoke<responseType.InvokeBooleanReturn>('update_selection_sort_cmd', {
    params: {
      new_order: newOrderCodes,
    },
  });
// 删除自选
export const deleteSelectionApi = (code: string) =>
  invoke<responseType.InvokeBooleanReturn>('delete_selection_cmd', { code });

// 检查自选是否存在
export const isSelectionExistsApi = (code: string) =>
  invoke<responseType.InvokeBooleanReturn>('is_selection_exists_cmd', {
    code,
  });

export const getSingleStockDetailsApi = (code: string) =>
  invoke<responseType.SingleStockDetailsInvokeReturn>(
    'get_single_stock_detail',
    {
      code,
    },
  );

export const getSelectionDetails = (symbols: string) =>
  invoke<responseType.GetSelectionDetailsInvokeReturn>(
    'get_batch_stock_quote',
    {
      symbols,
    },
  );

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
export const getStockLineApi = (code: string, period: string) =>
  invoke<responseType.GetStockLinesInvokeReturn>('query_stock_lines_cmd', {
    code,
    period,
  });

// 添加
export const addStockLineApi = (
  argus: Omit<responseType.StockLineType, 'id'>[],
) =>
  invoke<responseType.InvokeBooleanReturn>('add_stock_lines_cmd', {
    reqs: argus,
  });
// 删除

export const deleteStockLineApi = (id: number) =>
  invoke<responseType.InvokeBooleanReturn>('delete_stock_line_cmd', {
    req: { id },
  });
