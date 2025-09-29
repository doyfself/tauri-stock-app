import { formatVolume } from './util';
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
import StockRemark from './StockRemark';

const markColors: Record<string, string> = {
  purple: '#B833A0',
  red: '#E6353A',
  yellow: '#F68F26',
  green: '#47A854',
  white: '#ffffff',
};
type KlineConfigType = typeof klineConfig;
// 1. 定义指标配置（顺序与原代码一致，包含名称、字段、样式逻辑）
interface IndicatorItemConfig {
  label: string;
  // 将 field 的类型从 string 改为 keyof SingleStockDetailsType
  field: keyof SingleStockDetailsType;
  formatValue?: (value: number | string) => string;
  getColor?: (
    value: number | string,
    details: SingleStockDetailsType,
    klineConfig: KlineConfigType,
  ) => string;
}
const indicatorConfig: IndicatorItemConfig[] = [
  {
    label: '开盘', // 指标名称
    field: 'open', // 对应 details 中的字段
    // 无特殊样式，用默认配置
  },
  {
    label: '最高',
    field: 'high',
    // 颜色规则：对比 last_close，涨为 riseColor，跌为 fallColor
    getColor: (value, details, klineConfig) =>
      +value >= details.last_close
        ? klineConfig.riseColor
        : klineConfig.fallColor,
  },
  {
    label: '最低',
    field: 'low',
    // 同「最高」的颜色规则
    getColor: (value, details, klineConfig) =>
      +value >= details.last_close
        ? klineConfig.riseColor
        : klineConfig.fallColor,
  },
  {
    label: '涨停',
    field: 'limit_up',
    // 固定为 riseColor
    getColor: (_, __, klineConfig) => klineConfig.riseColor,
  },
  {
    label: '跌停',
    field: 'limit_down',
    // 固定为 fallColor
    getColor: (_, __, klineConfig) => klineConfig.fallColor,
  },
  {
    label: '量比',
    field: 'volume_ratio',
    // 无特殊样式
  },
  {
    label: '换手率',
    field: 'turnover_rate',
    // 额外拼接 "%" 符号
    formatValue: (value) => `${value}%`,
  },
  {
    label: '市盈率(静)',
    field: 'pe_lyr',
  },
  {
    label: '市盈率(动)',
    field: 'pe_forecast',
  },
  {
    label: '市盈率(TTM)',
    field: 'pe_ttm',
  },
  {
    label: '市值',
    field: 'market_capital',
    // 调用外部格式化函数 formatVolume
    formatValue: (value) => formatVolume(+value),
  },
];
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
      <div className="text-[#fff] text-[16px]">
        {details.name}({details.symbol})
      </div>
    );
  }
  // 画线
  if (details)
    return (
      <div className="w-[320px] text-[#fff] bg-[#23272D] p-[10px] h-full">
        <div className="">
          <div className="text-[20px]">
            {details.name}
            <span className="text-[18px] ml-[10px]">{details.symbol}</span>
          </div>
          <div
            className="text-[18px]"
            style={{
              color:
                details.percent >= 0
                  ? klineConfig.riseColor
                  : klineConfig.fallColor,
            }}
          >
            {details.current}{' '}
            <span className="ml-[10px]">{details.percent}%</span>
          </div>
          {!inSelection ? (
            <Button
              type="primary"
              size="small"
              onClick={addSelection}
              icon={<PlusOutlined />}
            >
              加自选
            </Button>
          ) : (
            <Button
              danger
              type="primary"
              size="small"
              icon={<MinusOutlined />}
              onClick={delSelection}
            >
              删自选
            </Button>
          )}
          <ul className="flex items-center gap-[6px] mt-[10px] mb-[10px]">
            {Object.keys(markColors).map((key) => (
              <li
                className="w-[14px] h-[14px] cursor-pointer rounded-[2px]"
                onClick={() => markColorEvent(key)}
                key={key}
                style={{
                  backgroundColor: markColors[key],
                }}
              ></li>
            ))}
          </ul>
        </div>
        <ul className="flex flex-wrap">
          {indicatorConfig.map((item, index) => {
            // 从 details 对象中安全地获取值
            let rawValue = details[item.field];

            // 格式化值 (如果配置了格式化函数)
            if (!rawValue) {
              rawValue = '';
            }
            const displayValue = item.formatValue
              ? item.formatValue(rawValue as number)
              : String(rawValue);

            // 计算样式 (如果配置了颜色函数)
            const textStyle = item.getColor
              ? { color: item.getColor(rawValue, details, klineConfig) }
              : undefined; // 没有样式时为 undefined

            return (
              <li key={index} className="text-[13px] w-[150px] py-[5px]">
                <span>{item.label}:</span>{' '}
                {textStyle ? (
                  <span style={textStyle}>{displayValue}</span>
                ) : (
                  displayValue
                )}
              </li>
            );
          })}
        </ul>
        <StockRemark code={code} />
      </div>
    );
}
