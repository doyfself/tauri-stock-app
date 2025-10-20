const klineConfig = {
  padding: 20, // 上下间距
  right: 60, // 右侧留白
  candleWidth: 6, // K线实体宽度
  candleMargin: 2, // K线间距
  riseColor: '#CA4A47', // 涨颜色
  fallColor: '#56A870', // 跌颜色
  barHeight: 25, // bar高度
  newsAreaHeight: 200, // 资讯区域高度
  volumeHeight: 100, // 成交量高度
  volumePaddingTop: 20, // 成交量顶部留白
  averageLineConfig: [
    {
      name: 'MA5',
      period: 5,
      color: '#ff9800', // 5日均线颜色
    },
    {
      name: 'MA10',
      period: 10,
      color: '#2196f3', // 10日均线颜色
    },
    {
      name: 'MA20',
      period: 20,
      color: '#9c27b0', // 20日均线颜色
    },
    {
      name: 'MA30',
      period: 30,
      color: '#009688', // 30日均线颜色
    },
  ],
  periodSelectOptions: [
    {
      label: '日K',
      value: 'day',
    },
    {
      label: '周K',
      value: 'week',
    },
    {
      label: '月K',
      value: 'month',
    },
    {
      label: '60m',
      value: '60m',
    },
    {
      label: '30m',
      value: '30m',
    },
    {
      label: '15m',
      value: '15m',
    },
    {
      label: '5m',
      value: '5m',
    },
    {
      label: '1m',
      value: '1m',
    },
    {
      label: '分时',
      value: 'time',
    },
  ], // 可选均线周期
};
export default klineConfig;
