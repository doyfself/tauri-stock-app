import { formatVolume } from './util';
import './index.css';
import { Button } from 'antd';
import klineConfig from './config';
import { useSelectionStore } from '@/stores/userStore';
import {
  getSingleStockDetailsApi,
  getSelectionByCode,
  getAllSelectionsApi,
  addSelectionApi,
  isSelectionExistsApi,
  deleteSelectionApi,
} from '@/apis/api';
import type { SingleStockDetailsType, SelectionItem } from '@/types/response';
import { useState, useEffect } from 'react';
import { isInStockTradingTime } from '@/utils/common';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';

const markColors: Record<string, string> = {
  purple: '#B833A0',
  red: '#E6353A',
  yellow: '#F68F26',
  green: '#47A854',
  black: '#000000',
};

export default function StockKlineChartDetails({
  code,
  onlyShow,
}: {
  code: string;
  onlyShow: boolean;
}) {
  const triggerRefresh = useSelectionStore(
    (state) => state.triggerSelectionRefresh,
  );
  const [details, setDetails] = useState<SingleStockDetailsType | null>(null); // 用于存储股票详情数据
  const [inSelection, setInSelection] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<SelectionItem>();
  useEffect(() => {
    const fn = async () => {
      if (!code) return;
      const res = await isSelectionExistsApi(code);
      setInSelection(res.data);

      const selectionRes = await getSelectionByCode(code);
      if (selectionRes && selectionRes.data) {
        setCurrentSelection(selectionRes.data);
      }
    };
    fn();
  }, [code]);
  useEffect(() => {
    // 存储定时器ID，用于清理
    let intervalId: NodeJS.Timeout;

    // 定义请求数据的函数
    const fetchData = async () => {
      if (code) {
        try {
          const response = await getSingleStockDetailsApi(code);
          if (response && response.data) {
            setDetails(response.data);
          }
        } catch (error) {
          console.error('获取股票详情失败:', error);
          // 可根据需求添加错误处理，如重试机制
        }
      }
    };

    // 立即执行一次请求
    fetchData();

    // 设置轮询：每隔5秒请求一次（时间可根据需求调整）
    if (code && isInStockTradingTime()) {
      intervalId = setInterval(fetchData, 1000);
    }

    // 清理函数：组件卸载或code变化时清除定时器
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [code]);
  const addSelection = async () => {
    if (details) {
      const allSelections = await getAllSelectionsApi();
      const count = allSelections.count || 0;
      const selection = {
        code,
        name: details.name,
        color: currentSelection?.color || '',
        remark: currentSelection?.remark || '',
        sort: count + 1,
      };
      const res = await addSelectionApi(selection);
      if (res.data) {
        setCurrentSelection(selection);
        setInSelection(true);
        triggerRefresh();
      } else {
        console.error('添加自选失败');
      }
    }
  };
  const delSelection = async () => {
    const res = await deleteSelectionApi(code);
    if (res.data) {
      setInSelection(false);
      triggerRefresh();
    } else {
      console.error('删除自选失败');
    }
  };
  const markColorEvent = async (key: string) => {
    console.log(currentSelection);
    if (inSelection && details) {
      const selection = {
        ...currentSelection,
        color: markColors[key] || '',
      } as SelectionItem;
      const res = await addSelectionApi(selection);
      if (res.data) {
        triggerRefresh();
      }
    }
  };
  if (onlyShow && details) {
    return (
      <div className="stock-details">
        <div className="header">
          <div>
            {details.name}({details.symbol})
          </div>
        </div>
      </div>
    );
  }
  // 画线
  if (details)
    return (
      <div className="stock-details">
        <div className="header">
          <div>
            {details.name}({details.symbol})
          </div>
          {!inSelection ? (
            <Button
              type="primary"
              onClick={addSelection}
              icon={<PlusOutlined />}
            >
              加自选
            </Button>
          ) : (
            <Button
              danger
              type="primary"
              icon={<MinusOutlined />}
              onClick={delSelection}
            >
              删自选
            </Button>
          )}
          <ul className="mark-color-ul">
            {Object.keys(markColors).map((key) => (
              <li
                onClick={() => markColorEvent(key)}
                key={key}
                style={{
                  backgroundColor: markColors[key],
                }}
              ></li>
            ))}
          </ul>
        </div>
        <div
          className="price"
          style={{
            color:
              details.percent >= 0
                ? klineConfig.riseColor
                : klineConfig.fallColor,
          }}
        >
          {details.current} <span>({details.percent}%)</span>
        </div>
        <ul>
          <li>开盘: {details.open}</li>
          <li>
            最高:{' '}
            <span
              style={{
                color:
                  details.high >= details.last_close
                    ? klineConfig.riseColor
                    : klineConfig.fallColor,
              }}
            >
              {details.high}
            </span>
          </li>
          <li>
            最低:{' '}
            <span
              style={{
                color:
                  details.low >= details.last_close
                    ? klineConfig.riseColor
                    : klineConfig.fallColor,
              }}
            >
              {details.low}
            </span>
          </li>
          <li>
            涨停:{' '}
            <span
              style={{
                color: klineConfig.riseColor,
              }}
            >
              {details.limit_up}
            </span>
          </li>
          <li>
            跌停:{' '}
            <span
              style={{
                color: klineConfig.fallColor,
              }}
            >
              {details.limit_down}
            </span>
          </li>
          <li>量比: {details.volume_ratio}</li>
          <li>换手率: {details.turnover_rate}%</li>
          <li>市盈率(静): {details.pe_lyr}</li>
          <li>市盈率(动): {details.pe_forecast}</li>
          <li>市盈率(TTM): {details.pe_ttm}</li>
          <li>市值: {formatVolume(details.market_capital)}</li>
        </ul>
      </div>
    );
}
