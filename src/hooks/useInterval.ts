import { useEffect, useRef } from 'react';
import { isInStockTradingTime } from '@/utils/common';

/**
 * 定时执行 Hook
 * @param callback - 每隔指定时间要执行的方法（需是稳定引用，避免频繁触发定时器重置）
 * @param timeout - 执行间隔时间（单位：毫秒），默认1000ms（1秒）
 * @param enabled - 是否启用定时器，默认true（组件挂载即启动）
 */
function useInterval(
  callback: () => void,
  timeout: number = 1000,
  enabled: boolean = true,
) {
  // 用useRef存储最新的callback，避免因callback变化导致定时器频繁重置
  const callbackRef = useRef<() => void>(callback);

  // 1. 更新callbackRef：当callback变化时，同步到ref中（不触发effect重新执行）
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 2. 启动/清除定时器：依赖enabled和timeout，仅当这两个值变化时才重新处理定时器
  useEffect(() => {
    // 若未启用，直接返回（不启动定时器）
    if (!enabled) return;

    // 定时器执行函数：调用最新的callback
    const tick = () => {
      if (isInStockTradingTime()) {
        callbackRef.current();
      }
    };

    // 启动定时器：立即执行一次，之后每隔timeout执行一次（可选，根据需求决定是否立即执行）
    // 若不需要立即执行，删除tick()，直接用setInterval
    tick();
    const timerId = setInterval(tick, timeout);

    // 组件卸载/依赖变化时，清除定时器（避免内存泄漏）
    return () => {
      clearInterval(timerId);
    };
  }, [timeout, enabled]);
}

export default useInterval;
