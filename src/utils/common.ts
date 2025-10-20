/**
 * 防抖函数 (Debounce)
 * 多次触发时，只在最后一次触发后延迟执行
 * @param func 待执行函数
 * @param wait 延迟时间(毫秒)
 * @param immediate 是否立即执行（首次触发时立即执行，之后延迟）
 * @returns 包装后的函数
 */
export function debounce<F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  wait: number,
  immediate = false,
): (...args: Parameters<F>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: ThisParameterType<F>, ...args: Parameters<F>): void {
    // 清除已有定时器
    if (timeout) {
      clearTimeout(timeout);
    }

    if (immediate) {
      // 立即执行模式
      const shouldExecute = !timeout;
      // 重置定时器，确保wait时间内再次触发不会重复执行
      timeout = setTimeout(() => {
        timeout = null;
      }, wait);
      // 首次触发时执行
      if (shouldExecute) {
        func.apply(this, args);
      }
    } else {
      // 延迟执行模式
      timeout = setTimeout(() => {
        func.apply(this, args);
        timeout = null;
      }, wait);
    }
  };
}

/**
 * 节流函数 (Throttle)
 * 规定时间内只执行一次
 * @param func 待执行函数
 * @param wait 间隔时间(毫秒)
 * @param trailing 是否在最后一次触发后补执行
 * @returns 包装后的函数
 */
export function throttle<F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  wait: number,
  trailing = false,
): (...args: Parameters<F>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let lastExecuteTime = 0;

  return function (this: ThisParameterType<F>, ...args: Parameters<F>): void {
    const now = Date.now();
    const elapsed = now - lastExecuteTime;

    // 清除延迟执行的定时器
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }

    // 如果距离上次执行时间超过等待时间，立即执行
    if (elapsed >= wait) {
      func.apply(this, args);
      lastExecuteTime = now;
    } else if (trailing) {
      // 否则设置延迟执行（补执行最后一次）
      timeout = setTimeout(() => {
        func.apply(this, args);
        lastExecuteTime = Date.now();
        timeout = null;
      }, wait - elapsed);
    }
  };
}

/**
 * 动态给股票代码添加市场前缀（如 SH、SZ）
 * @param code 原始股票代码（纯数字）
 * @returns 带前缀的股票代码（如 SH600000、SZ000001）
 * @throws 当代码不符合规则时抛出错误
 */
export const addStockCodePrefix = (code: string): string => {
  // 去除可能的空格
  const cleanCode = code.trim();
  if (code.length !== 6) {
    return code;
  }

  // 验证代码是否为纯数字
  if (!/^\d+$/.test(cleanCode)) {
    throw new Error(`无效的股票代码：${code}，必须为纯数字`);
  }

  // 沪市主板：60开头（6位数字）
  if (/^60[0-9]{4}$/.test(cleanCode)) {
    return `SH${cleanCode}`;
  }

  // 沪市科创板：688开头（6位数字）
  if (/^688[0-9]{3}$/.test(cleanCode)) {
    return `SH${cleanCode}`;
  }

  // 深市主板：00开头（6位数字）
  if (/^00[0-9]{4}$/.test(cleanCode)) {
    return `SZ${cleanCode}`;
  }

  // 深市创业板：30开头（6位数字）
  if (/^30[0-9]{4}$/.test(cleanCode)) {
    return `SZ${cleanCode}`;
  }

  // 北交所：8开头（6位数字）
  if (/^8[0-9]{5}$/.test(cleanCode)) {
    return `BJ${cleanCode}`;
  }

  // 若不符合以上规则，抛出错误
  throw new Error(`无法识别的股票代码：${code}，请检查代码是否正确`);
};

/**
 * 判断当前时间是否在股票运营时间内（A股市场规则）
 * @param date 可选参数，指定要检查的日期，默认使用当前时间
 * @returns boolean 是否在交易时间内
 */
export const isInStockTradingTime = (date: Date = new Date()): boolean => {
  // 1. 检查是否为周末（周六或周日）
  const day = date.getDay();
  if (day === 0 || day === 6) {
    return false;
  }
  // 4. 检查具体交易时间段
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  // 早盘时间: 9:30 - 11:30
  const morningStart = 9 * 60 + 15; // 570
  const morningEnd = 11 * 60 + 30; // 690

  // 午盘时间: 13:00 - 15:00
  const afternoonStart = 13 * 60; // 780
  const afternoonEnd = 15 * 60; // 900

  // 判断是否在早盘或午盘时间段内
  return (
    (totalMinutes >= morningStart && totalMinutes <= morningEnd) ||
    (totalMinutes >= afternoonStart && totalMinutes <= afternoonEnd)
  );
};

/**
 * 将 Unix 时间戳（秒或毫秒）按照指定格式，转换为北京时间（东八区）字符串。
 *
 * @param timestamp 时间戳，可以是数字或字符串。支持秒（10位）或毫秒（13位）。
 * @param format 输出格式，例如 'YYYY-MM-DD HH:mm:ss'。
 * @returns 格式化后的北京时间字符串。如果输入无效，则返回 'Invalid Date'。
 */
export function formatDate(timestamp: number | string, format: string): string {
  // 1. 将输入转换为数字
  let ts = typeof timestamp === 'number' ? timestamp : parseInt(timestamp, 10);

  // 2. 验证时间戳是否有效
  if (isNaN(ts)) {
    return 'Invalid Date';
  }

  // 3. 自动识别并转换为毫秒 (如果是10位数字，则认为是秒)
  if (ts.toString().length === 10) {
    ts *= 1000;
  }

  // 4. 使用 Intl.DateTimeFormat 进行时区转换和格式化
  // 这是处理时区最标准、最可靠的现代方法
  try {
    const formatter = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai', // 明确指定为北京时间
      year: format.includes('YYYY') ? 'numeric' : undefined,
      month: format.includes('MM') ? '2-digit' : undefined,
      day: format.includes('DD') ? '2-digit' : undefined,
      hour: format.includes('HH') ? '2-digit' : undefined,
      minute: format.includes('mm') ? '2-digit' : undefined,
      second: format.includes('ss') ? '2-digit' : undefined,
      hour12: false, // 使用24小时制
    });

    // 使用 formatToParts 获取各个部分，以便精确替换
    const parts = formatter.formatToParts(new Date(ts));
    const values: Record<string, string> = {};
    parts.forEach((part) => {
      if (part.type !== 'literal') {
        // Intl 使用 'month', 'day' 等，我们需要映射到 'MM', 'DD'
        const key =
          part.type === 'month'
            ? 'MM'
            : part.type === 'day'
              ? 'DD'
              : part.type === 'hour'
                ? 'HH'
                : part.type === 'minute'
                  ? 'mm'
                  : part.type === 'second'
                    ? 'ss'
                    : part.type === 'year'
                      ? 'YYYY'
                      : part.type;
        values[key] = part.value;
      }
    });

    // 替换格式字符串中的占位符
    return format
      .replace('YYYY', values.YYYY || '')
      .replace('MM', values.MM || '')
      .replace('DD', values.DD || '')
      .replace('HH', values.HH || '')
      .replace('mm', values.mm || '')
      .replace('ss', values.ss || '');
  } catch (e) {
    console.log(e);
    // 如果格式化失败（例如格式字符串无效）
    return 'Invalid Date';
  }
}
