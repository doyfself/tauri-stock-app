import { useState, useCallback, useMemo } from 'react';
import { getSelectionDetails } from '@/apis/api';
import useInterval from './useInterval';
import type { SelectionDetailsType } from '@/types/response';

interface UseRealTimeDataOptions {
  interval?: number; // 轮询间隔
  immediate?: boolean; // 是否立即执行
  enabled?: boolean; // 是否启用轮询
}

/**
 * 通用的实时数据 Hook
 * @param symbols - 股票代码数组
 * @param options - 配置选项
 */
export function useRealTimeData(
  symbols: string,
  options: UseRealTimeDataOptions = {},
) {
  const { interval = 1000, immediate = true, enabled = true } = options;

  const [data, setData] = useState<SelectionDetailsType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 获取数据的函数
  const fetchData = useCallback(async () => {
    if (symbols.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getSelectionDetails(symbols);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('获取数据失败'));
      console.error('获取实时数据失败:', err);
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  // 使用优化后的 useInterval
  useInterval(fetchData, interval, {
    immediate,
    enabled,
  });

  // 返回的数据和方法
  return useMemo(
    () => ({
      data,
      loading,
      error,
      fetchData,
    }),
    [data, loading, error, fetchData],
  );
}
