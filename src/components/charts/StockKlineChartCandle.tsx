import klineConfig from './config';
import { Fragment } from 'react';
import type { StockKlineCandleProps } from './types';
import type { OrderItem } from '@/types/response';

export default function StockKlineChartCandle({
  data,
  orders,
  coordinateX,
  mapToSvg,
}: StockKlineCandleProps) {
  // 统一时间格式为 YYYY-MM-DD 进行比较，修复时区问题
  const normalizeDate = (dateString: string): string => {
    if (dateString.includes('T')) {
      // 处理 orders 的时间格式: 2025-11-02T16:00:00.000Z
      return new Date(dateString).toLocaleDateString('en-CA'); // en-CA 格式为 YYYY-MM-DD
    } else {
      // 处理 data 的时间格式: 2019-02-03 15:00:00
      return dateString.split(' ')[0];
    }
  };

  // 创建日期到数据索引的映射
  const dateToIndexMap = new Map<string, number>();
  data.forEach((item, index) => {
    const normalizedDate = normalizeDate(item.date);
    dateToIndexMap.set(normalizedDate, index);
  });

  // 按日期分组订单，并检查每天是否有买入和卖出
  const ordersByDate = new Map<
    string,
    {
      orders: OrderItem[];
      hasBuy: boolean;
      hasSell: boolean;
    }
  >();

  orders.forEach((order: OrderItem) => {
    const normalizedDate = normalizeDate(order.time);
    if (!ordersByDate.has(normalizedDate)) {
      ordersByDate.set(normalizedDate, {
        orders: [],
        hasBuy: false,
        hasSell: false,
      });
    }

    const dateData = ordersByDate.get(normalizedDate);
    if (dateData) {
      dateData.orders.push(order);

      if (order.action === '1') {
        dateData.hasBuy = true;
      } else {
        dateData.hasSell = true;
      }
    }
  });

  return (
    <g>
      {/* 绘制蜡烛图 */}
      {data.map((item, index) => {
        const isRise = item.close >= item.open;
        const fillColor = isRise
          ? klineConfig.riseColor
          : klineConfig.fallColor;
        return (
          <Fragment key={'stock-kline-chart-candle' + index}>
            <line
              x1={coordinateX[index]}
              y1={mapToSvg(item.high)}
              x2={coordinateX[index]}
              y2={mapToSvg(item.low)}
              stroke={fillColor}
              strokeWidth={1}
            />
            <rect
              x={coordinateX[index] - klineConfig.candleWidth / 2}
              y={isRise ? mapToSvg(item.close) : mapToSvg(item.open)}
              width={klineConfig.candleWidth}
              height={Math.abs(mapToSvg(item.close) - mapToSvg(item.open)) | 1}
              fill={isRise ? klineConfig.riseColor : klineConfig.fallColor}
              stroke={fillColor}
              strokeWidth={1}
            />
          </Fragment>
        );
      })}

      {/* 绘制买卖点 */}
      {Array.from(ordersByDate.entries()).map(([date, dateData]) => {
        const dataIndex = dateToIndexMap.get(date);

        if (dataIndex === undefined) {
          return null;
        }

        const klineData = data[dataIndex];
        const x = coordinateX[dataIndex];
        const { orders: dateOrders, hasBuy, hasSell } = dateData;

        // 判断同一天是否有买入和卖出
        const hasBoth = hasBuy && hasSell;

        // 如果有买入和卖出，只显示一个"T"标记
        if (hasBoth) {
          return (
            <g key={`orders-${date}`}>
              {/* 交易标记 - 黄色T字母 */}
              <text
                x={x}
                y={mapToSvg(klineData.high) - 20}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#fa8c16" // 橙色
                fontSize={14}
                fontWeight="bold"
                style={{ userSelect: 'none' }}
              >
                T
              </text>

              {/* 连线到K线 */}
              <line
                x1={x}
                y1={mapToSvg(klineData.high) - 15}
                x2={x}
                y2={mapToSvg(klineData.high)}
                stroke="#fa8c16"
                strokeWidth={1}
                strokeDasharray="2,2"
                opacity={0.6}
              />
            </g>
          );
        }

        // 否则分别显示买卖点
        return (
          <g key={`orders-${date}`}>
            {dateOrders.map((order: OrderItem) => {
              const isBuy = order.action === '1';

              // 垂直排列，买入在上方，卖出在下方
              const verticalOffset = isBuy ? -25 : 5;
              const markerY = mapToSvg(klineData.high) + verticalOffset;

              return (
                <g key={`order-${order.id}`}>
                  {/* 买卖点标记 - 直接显示字母 */}
                  <text
                    x={x}
                    y={markerY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isBuy ? '#52c41a' : '#ff4d4f'}
                    fontSize={14}
                    style={{ userSelect: 'none' }}
                  >
                    {isBuy ? 'B' : 'S'}
                  </text>

                  {/* 连线到K线 */}
                  <line
                    x1={x}
                    y1={markerY + (isBuy ? 7 : -7)}
                    x2={x}
                    y2={
                      isBuy ? mapToSvg(klineData.high) : mapToSvg(klineData.low)
                    }
                    stroke={isBuy ? '#52c41a' : '#ff4d4f'}
                    strokeWidth={1}
                    strokeDasharray="2,2"
                    opacity={0.6}
                  />
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
}
