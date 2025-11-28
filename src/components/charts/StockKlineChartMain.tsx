import type { StockKlineChartMainProps } from './types';
import StockKlineChartBg from './StockKlineChartBg';
import StockKlineChartCandle from './StockKlineChartCandle';
import StockKlineChartMa from './StockKlineChartMA';
import StockKlineChartDetails from './StockKlineChartDetails';
import StockKlineChartTooltip from './StockKlineChartTooltip';
import StockKlineChartLine from './StockKlineChartLine';
import StockKlineChartDrawLine from './StockKlineChartDrawLine';
import { formatDate } from '@/utils/common';
import StockKlineChartTimeLine from './StockKlineChartTimeLine';
import useInterval from '@/hooks/useInterval';
import StockKlineChartVolume, {
  StockKlineChartVolumeBar,
} from './StockKlineChartVolume';
import StockKlineChartStick from './StockKlineChartStick';
import { mapKlineToSvg, calculateMA } from './util';
import klineConfig from './config';
import { useEffect, useState, useMemo } from 'react';
import { getKlineDataApi, getOrdersByCodeApi } from '@/apis/api';
import type { OrderItem } from '@/types/response';
import type { StockKlineDataType } from './types';

export default function StockKlineChartMain({
  code,
  width,
  height,
  timestamp = '',
  onlyShow = false,
}: StockKlineChartMainProps) {
  const [data, setData] = useState<StockKlineDataType[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maData, setMaData] = useState<number[][]>([]); // 用于存储MA数据
  const [coordinateX, setCoordinateX] = useState<number[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [period, setPeriod] = useState<string>(
    klineConfig.periodSelectOptions[0].value,
  );
  const [selectIndex, setSelectIndex] = useState<number>(-1);
  const [isHovered, setIsHovered] = useState(false);
  const [limit, setLimit] = useState(0);
  const candleHeight = onlyShow
    ? height
    : height -
      klineConfig.volumeHeight -
      klineConfig.barHeight * 2 -
      klineConfig.newsAreaHeight;

  useEffect(() => {
    setLimit(
      Math.floor(
        (width - klineConfig.right) /
          (klineConfig.candleWidth + klineConfig.candleMargin),
      ),
    );
  }, [width]);
  // 定义获取K线数据的函数
  const fetchKlineData = async () => {
    if (code && limit > 0) {
      const response = await getKlineDataApi(code, period, timestamp, limit);
      if (response && response.data) {
        const newData = response.data.map((item) => {
          const timestamp = Number(item.date);
          item.date = formatDate(item.date, 'YYYY-MM-DD HH:mm');
          return {
            timestamp,
            ...item,
          };
        });
        setData(newData);
        if (selectIndex === -1) setSelectIndex(newData.length - 1);
        const maxPrice = Math.max(...newData.map((item) => item.high));
        const minPrice = Math.min(...newData.map((item) => item.low));
        const coordinateX = newData.map((_, index) => {
          return (
            index * (klineConfig.candleMargin + klineConfig.candleWidth) +
            klineConfig.candleWidth / 2
          );
        });

        setMaxPrice(maxPrice);
        setMinPrice(minPrice);
        setCoordinateX(coordinateX);
      }
    }
  };
  useInterval(fetchKlineData, 1000, {
    enabled: limit > 0,
  });
  useEffect(() => {
    fetchKlineData();
  }, [code, period, timestamp, limit]);
  // 获取委托数据
  useEffect(() => {
    if (period !== 'day') {
      setOrders([]);
      return;
    }
    const fetchOrders = async () => {
      if (code) {
        try {
          const response = await getOrdersByCodeApi(code);
          if (response && response.data) {
            setOrders(response.data);
          }
        } catch (error) {
          console.error('获取委托数据失败:', error);
        }
      }
    };
    fetchOrders();
  }, [code, period]);
  // 3. 缓存mapToSvg计算结果，依赖变化时再更新
  const mapToSvg = useMemo(
    () => mapKlineToSvg(candleHeight, minPrice, maxPrice),
    [candleHeight, minPrice, maxPrice],
  );

  // 4. 计算MA数据
  useEffect(() => {
    if (data.length > 0) {
      const maData = klineConfig.averageLineConfig.map((item) => {
        return calculateMA(data, item.period);
      });
      setMaData(maData);
      // 这里可以将maData存储到状态中，如果需要在其他组件中使用
    }
  }, [data]);

  if (period === 'time') {
    return (
      <div style={{ width: width + 'px' }}>
        <StockKlineChartPeriodSwtich period={period} setPeriod={setPeriod} />
        <StockKlineChartTimeLine width={width} height={height} code={code} />
      </div>
    );
  }

  return (
    <div style={{ width: width + 'px' }}>
      {onlyShow && <StockKlineChartDetails code={code} onlyShow={onlyShow} />}
      <StockKlineChartPeriodSwtich period={period} setPeriod={setPeriod} />
      {maData.length && (
        <StockKlineChartMABar maData={maData} index={selectIndex} />
      )}
      <div className="relative">
        <svg width={width} height={candleHeight}>
          <StockKlineChartBg
            width={width}
            height={candleHeight}
            maxPrice={maxPrice}
            minPrice={minPrice}
          />
          {data.length && (
            <StockKlineChartCandle
              orders={orders}
              data={data}
              coordinateX={coordinateX}
              mapToSvg={mapToSvg}
            />
          )}
          {maData.length && (
            <StockKlineChartMa
              maData={maData}
              coordinateX={coordinateX}
              mapToSvg={mapToSvg}
            />
          )}

          <StockKlineChartStick
            width={width}
            height={candleHeight}
            coordinateX={coordinateX}
            data={data}
            maxPrice={maxPrice}
            minPrice={minPrice}
            mapToSvg={mapToSvg}
            hoverCallback={(index, status) => {
              setSelectIndex(index);
              setIsHovered(status);
            }}
          />

          {data.length && (
            <StockKlineChartLine
              code={code}
              period={period}
              width={width}
              height={candleHeight}
              maxPrice={maxPrice}
              minPrice={minPrice}
              coordinateX={coordinateX} // 每根K线的x中心
              klineData={data}
            />
          )}
          <StockKlineChartTooltip
            data={data}
            coordinateX={coordinateX}
            width={width}
            index={selectIndex}
            isHovered={isHovered}
          />
        </svg>
        {!onlyShow && (
          <StockKlineChartDrawLine
            width={width}
            height={candleHeight}
            code={code}
            period={period}
            maxPrice={maxPrice}
            minPrice={minPrice}
            coordinateX={coordinateX} // 每根K线的x中心
            klineData={data}
          />
        )}
      </div>

      <StockKlineChartVolumeBar index={selectIndex} data={data} />
      <StockKlineChartVolume
        data={data}
        coordinateX={coordinateX}
        width={width}
        index={selectIndex}
        isHovered={isHovered}
      />
    </div>
  );
}
interface StockKlineChartPeriodSwtichProps {
  period: string;
  setPeriod: (period: string) => void;
}
const StockKlineChartPeriodSwtich = ({
  period,
  setPeriod,
}: StockKlineChartPeriodSwtichProps) => {
  return (
    <div className="bg-[#31343A] w100p flex border-[#100F12] border-t-1 border-b-1">
      <ul className="flex items-center bg-[#100F12] gap-px h-[25px] pl-px pr-px">
        {klineConfig.periodSelectOptions.map((item) => (
          <li
            key={item.value}
            onClick={() => setPeriod(item.value)}
            className="text-[#fff] h-full w-[50px] flex justify-center items-center text-[12px] cursor-pointer"
            style={{
              background: period === item.value ? '#535A64' : '#30333A',
            }}
          >
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
};
type StockKlineChartBarProps = {
  index: number;
  maData: number[][];
};
const StockKlineChartMABar = ({ index, maData }: StockKlineChartBarProps) => {
  return (
    <div
      className="bg-[#23272D] text-[12px] px-[10px]"
      style={{
        height: klineConfig.barHeight + 'px',
        lineHeight: klineConfig.barHeight + 'px',
      }}
    >
      {klineConfig.averageLineConfig.map((item, i) => {
        return (
          <span key={item.period} style={{ color: item.color }}>
            {item.name}:{' '}
            {maData[i][index] && maData[i][index] !== -1
              ? maData[i][index].toFixed(2)
              : 'N/A'}{' '}
          </span>
        );
      })}
    </div>
  );
};
