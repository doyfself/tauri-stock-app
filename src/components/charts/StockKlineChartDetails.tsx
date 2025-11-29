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
  addXueqiuSelectionApi,
  removeXueqiuSelectionApi,
} from '@/apis/api';
import type { SingleStockDetailsType, SelectionItem } from '@/types/response';
import { useState, useEffect, useMemo } from 'react';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import StockRemark from './StockRemark';
import useInterval from '@/hooks/useInterval';
import { marketList } from '@/config';

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
  const [currentSelection, setCurrentSelection] =
    useState<SelectionItem | null>(null); // 新增：存储当前自选信息

  // 检查当前股票是否为市场指数
  const isMarketIndex = useMemo(() => {
    return marketList.some((item) => item.symbol === code);
  }, [code]);

  // 获取当前自选信息的函数
  const getCurrentSelection = async () => {
    if (code) {
      const res = await getSelectionByCode(code);
      return res.data;
    }
    return null;
  };

  // 刷新自选状态
  const refreshSelectionStatus = async () => {
    if (!code) return;

    const res = await isSelectionExistsApi(code);
    setInSelection(res.data);

    // 如果存在自选，获取自选信息
    if (res.data) {
      const selection = await getCurrentSelection();
      setCurrentSelection(selection as SelectionItem);
    } else {
      setCurrentSelection(null);
    }
  };

  useEffect(() => {
    refreshSelectionStatus();
  }, [code]);

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

  useInterval(fetchData, 1000);
  useEffect(() => {
    fetchData();
  }, [code]);

  const addSelection = async () => {
    if (details) {
      const allSelections = await getAllSelectionsApi();
      const count = allSelections.count || 0;
      const selection = {
        code,
        name: details.name,
        color: '',
        // 初始化时没有备注
        remark: '',
        sort: count + 1,
      };
      const res = await addSelectionApi(selection);
      if (res.data) {
        addXueqiuSelectionApi(code); // 同步添加到雪球自选
        // 添加成功后刷新自选状态
        await refreshSelectionStatus();
        triggerRefresh();
      } else {
        console.error('添加自选失败');
      }
    }
  };

  const delSelection = async () => {
    const res = await deleteSelectionApi(code);
    if (res.data) {
      // 删除成功后刷新自选状态
      await refreshSelectionStatus();
      removeXueqiuSelectionApi(code); // 同步从雪球自选删除
      triggerRefresh();
    } else {
      console.error('删除自选失败');
    }
  };

  const markColorEvent = async (key: string) => {
    if (!code) return;

    // 先获取最新的自选信息
    const latestSelection = await getCurrentSelection();
    if (!latestSelection) {
      console.error('自选信息不存在，无法标记颜色');
      // 如果自选不存在，刷新状态
      await refreshSelectionStatus();
      return;
    }

    const selection = {
      ...latestSelection,
      color: markColors[key] || '',
    } as SelectionItem;

    const res = await addSelectionApi(selection);
    if (res.data) {
      // 更新成功后刷新自选状态
      await refreshSelectionStatus();
      triggerRefresh();
    } else {
      console.error('标记颜色失败');
    }
  };

  // 获取当前选中的颜色key
  const getCurrentColorKey = (): string | null => {
    if (!currentSelection?.color) return null;

    // 通过颜色值反向查找对应的key
    for (const [key, color] of Object.entries(markColors)) {
      if (color.toLowerCase() === currentSelection.color.toLowerCase()) {
        return key;
      }
    }
    return null;
  };

  const currentColorKey = getCurrentColorKey();

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
            className="text-[20px] mb-[10px]"
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
          {/* 只有非市场指数才显示自选按钮 */}
          {!isMarketIndex && (
            <>
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
            </>
          )}
          {/* 只有非市场指数且在自选中才显示颜色标记 */}
          {!isMarketIndex && inSelection && (
            <ul className="flex items-center gap-[6px] mt-[10px] mb-[10px]">
              {Object.keys(markColors).map((key) => {
                const isActive = currentColorKey === key;
                return (
                  <li
                    className={`w-[14px] h-[14px] cursor-pointer rounded-[2px] relative ${
                      isActive
                        ? 'ring-2 ring-white ring-offset-1 ring-offset-[#23272D]'
                        : ''
                    }`}
                    onClick={() => markColorEvent(key)}
                    key={key}
                    style={{
                      backgroundColor: markColors[key],
                    }}
                    title={`标记为${key}色`}
                  >
                    {/* 为白色边框添加一个内边框，提高可见性 */}
                    {markColors[key] === '#ffffff' && (
                      <div className="absolute inset-[1px] border border-gray-400 rounded-[1px]" />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
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
        {/* 只有非市场指数且在自选中才显示备注 */}
        {!isMarketIndex && inSelection && (
          <StockRemark
            code={code}
            onRemarkUpdate={refreshSelectionStatus} // 传递刷新函数给备注组件
          />
        )}
      </div>
    );
}
