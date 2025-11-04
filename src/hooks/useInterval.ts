import { useEffect, useRef } from 'react';
import { isInStockTradingTime } from '@/utils/common';

interface UseIntervalOptions {
  immediate?: boolean; // 是否立即执行一次
  enabled?: boolean; // 是否启用定时器
}

function useInterval(
  callback: () => void,
  timeout: number = 1000,
  options: UseIntervalOptions = {},
) {
  const { immediate = true, enabled = true } = options;

  const callbackRef = useRef<() => void>(callback);
  const timerRef = useRef<NodeJS.Timeout>(null);

  // 更新 callbackRef
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // 立即执行一次
    if (immediate) {
      callbackRef.current();
    }

    // 设置定时器
    timerRef.current = setInterval(() => {
      if (isInStockTradingTime()) {
        callbackRef.current();
      }
    }, timeout);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeout, enabled, immediate]);
}

export default useInterval;
