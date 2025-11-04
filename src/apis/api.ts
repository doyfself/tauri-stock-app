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

export const getMinuteDataByCode = (code: string) =>
  invoke<responseType.GetStockMinuteDataInvokeReturn>('get_minute_chart', {
    code,
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

export const getStockReviewApi = (type: string, keyword: string) =>
  invoke<responseType.GetStockReviewInvokeReturn>('get_stock_review_list_cmd', {
    req: { type, keyword },
  });

// 获取单条评论

export const getSingleStockReviewApi = (id: number) =>
  invoke<responseType.GetSingleStockReviewInvokeReturn>(
    'get_single_stock_review_cmd',
    { req: { id } },
  );

// 添加
export const addStockReviewApi = (req: {
  id?: number;
  type: string;
  code: string;
  title: string;
  date: string;
  description: string;
}) =>
  invoke<responseType.InvokeBooleanReturn>('add_stock_review_cmd', {
    req,
  });
// 删除
export const deleteStockReviewApi = (id: number) =>
  invoke<responseType.InvokeBooleanReturn>('delete_stock_review_cmd', {
    req: { id },
  });

export const getAnalysisApi = () =>
  invoke<responseType.GetLastMarketAnalysisInvokeReturn>(
    'query_market_analysis_cmd',
  );

export const addAnalysisApi = (
  date: string,
  analysis: string,
  status: string,
) =>
  invoke<responseType.InvokeBooleanReturn>('add_market_analysis_cmd', {
    req: { date, analysis, status },
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

// 操作反省

export const getSelfReflectApi = () =>
  invoke<responseType.GetSelfReflectInvokeReturn>('get_self_reflect_list_cmd');

export const getSingleSelfReflectApi = (id: number) =>
  invoke<responseType.GetSingleSelfReflectInvokeReturn>(
    'get_single_self_reflect_cmd',
    { req: { id } },
  );

export const addSelfReflectApi = (req: {
  id?: number;
  code: string;
  title: string;
  date: string;
  description: string;
}) =>
  invoke<responseType.InvokeBooleanReturn>('add_self_reflect_cmd', {
    req,
  });
export const deleteSelfReflectApi = (id: number) =>
  invoke<responseType.InvokeBooleanReturn>('delete_self_reflect_cmd', {
    req: { id },
  });

/**
 * 获取所有持仓列表
 */
export const getAllHoldingsApi = () =>
  invoke<responseType.GetAllHoldingsInvokeReturn>('get_all_holdings_cmd');

export const getHistoryHoldingsApi = (params: QueryOrdersParams) =>
  invoke<responseType.GetAllHoldingsInvokeReturn>('get_history_holdings_cmd', {
    params: {
      page: params.current,
      page_size: params.pageSize,
    },
  });
/**
 * 添加持仓
 */

// 更新持仓请求参数
export const addHoldingApi = (params: responseType.AddHoldingParams) =>
  invoke<responseType.InvokeBooleanReturn>('add_holding_cmd', {
    params,
  });

export const queryHoldingByCodeApi = (code: string) =>
  invoke<responseType.GetHoldingByCodeInvokeReturn>(
    'get_latest_holding_by_code_cmd',
    {
      code,
    },
  );
/**
 * 更新持仓
 */
export const updateHoldingApi = (params: responseType.UpdateHoldingParams) =>
  invoke<responseType.InvokeBooleanReturn>('update_holding_cmd', {
    params,
  });

export const deleteHoldingApi = (id: number) =>
  invoke<responseType.InvokeBooleanReturn>('delete_holding_cmd', {
    id,
  });
/**
 * 获取所有委托列表
 */
export interface QueryOrdersParams {
  current: number; // 页码，从1开始
  pageSize: number; // 每页大小
}
export const getAllOrdersApi = (params: QueryOrdersParams) =>
  invoke<responseType.GetAllOrdersInvokeReturn>('get_all_orders_cmd', {
    params: {
      page: params.current,
      page_size: params.pageSize,
    },
  });

export const getOrdersByCodeApi = (code: string) =>
  invoke<responseType.GetOrdersByCodeInvokeReturn>('get_orders_by_code_cmd', {
    code,
  });
/**
 * 添加委托
 */
export const addOrderApi = (params: Omit<responseType.OrderItem, 'id'>) =>
  invoke<responseType.InvokeBooleanReturn>('add_order_cmd', { params });

export const deleteOrderApi = (id: number) =>
  invoke<responseType.InvokeBooleanReturn>('delete_order_cmd', { id });
