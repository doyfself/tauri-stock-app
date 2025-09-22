import type { StockKlineChartMainProps } from './types';
import StockKlineChartBg from './StockKlineChartBg';
import StockKlineChartCandle from './StockKlineChartCandle';
import StockKlineChartMa from './StockKlineChartMA';
import StockKlineChartDetails from './StockKlineChartDetails';
import StockKlineChartTooltip from './StockKlineChartTooltip';
import StockKlineChartLine from './StockKlineChartLine';
import StockKlineChartDrawLine from './StockKlineChartDrawLine';
import StockRemark from './StockRemark';
import { isInStockTradingTime } from '@/utils/common';
import StockKlineChartVolume, {
  StockKlineChartVolumeBar,
} from './StockKlineChartVolume';
import StockKlineChartStick from './StockKlineChartStick';
import { mapKlineToSvg, calculateMA } from './util';
import klineConfig from './config';
import { Radio } from 'antd';
import { useEffect, useState, useMemo } from 'react';
import { getKlineDataApi } from '@/apis/api';
import type { KlineDataResponse } from '@/types/response';
export default function StockKlineChartMain({
  code,
  width,
  height,
  timestamp = '',
  limit = 100,
}: StockKlineChartMainProps) {
  const [data, setData] = useState<KlineDataResponse[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maData, setMaData] = useState<number[][]>([]); // 用于存储MA数据
  const [coordinateX, setCoordinateX] = useState<number[]>([]);
  const [period, setPeriod] = useState<string>(
    klineConfig.periodSelectOptions[0].value,
  );
  const [selectIndex, setSelectIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState(false);
  useEffect(() => {
    // 存储定时器ID，用于清理
    let intervalId: NodeJS.Timeout;
    // 定义获取K线数据的函数
    const fetchKlineData = async () => {
      if (code) {
        const response = await getKlineDataApi(code, period, timestamp, limit);
        if (response && response.data) {
          let newData = response.data;
          newData = newData.slice(Math.max(newData.length - 100, 0));
          setData(newData);
          setSelectIndex(newData.length - 1);
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

    // 初始加载一次数据
    fetchKlineData();

    // 设置定时器，每1分钟（60000毫秒）执行一次
    // 如果传入时期，则不启动轮询
    if (isInStockTradingTime() && !timestamp) {
      intervalId = setInterval(fetchKlineData, 60000);
    }

    // 组件卸载时清除定时器，避免内存泄漏
    return () => clearInterval(intervalId);
  }, [code, period, timestamp, limit]);
  // 3. 缓存mapToSvg计算结果，依赖变化时再更新
  const mapToSvg = useMemo(
    () => mapKlineToSvg(height, minPrice, maxPrice),
    [height, minPrice, maxPrice],
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

  return (
    <div style={{ width: width + 'px' }}>
      {!timestamp && <StockKlineChartDetails code={code} />}
      <StockKlineChartPeriodSwtich period={period} setPeriod={setPeriod} />
      {maData.length && (
        <StockKlineChartMABar maData={maData} index={selectIndex} />
      )}
      <div className="relative">
        <svg width={width} height={height}>
          <StockKlineChartBg
            width={width}
            height={height}
            maxPrice={maxPrice}
            minPrice={minPrice}
          />
          {data.length && (
            <StockKlineChartCandle
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
            height={height}
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

          {!timestamp && (
            <StockKlineChartLine
              code={code}
              period={period}
              width={width}
              height={height}
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
        {!timestamp && (
          <StockKlineChartDrawLine
            width={width}
            height={height}
            code={code}
            period={period}
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
      {!timestamp && <StockRemark code={code} />}
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
    <Radio.Group
      block
      defaultValue={period}
      size="small"
      onChange={(e) => setPeriod(e.target.value)}
    >
      {klineConfig.periodSelectOptions.map((item) => (
        <Radio.Button value={item.value} key={item.value}>
          {item.label}
        </Radio.Button>
      ))}
    </Radio.Group>
  );
};
type StockKlineChartBarProps = {
  index: number;
  maData: number[][];
};
const StockKlineChartMABar = ({ index, maData }: StockKlineChartBarProps) => {
  return (
    <div
      style={{
        backgroundColor: '#eff3f7',
        borderBottom: '1px solid #e5e5e5',
        fontSize: '12px',
        padding: '5px 10px',
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
