import { getSelectionDetails } from '@/apis/api';
import { useState, useEffect } from 'react';
import type { SelectionDetailsType } from '@/types/response';
import { isInStockTradingTime } from '@/utils/common';
import { useNavigate } from 'react-router-dom';
const marketList = [
  {
    name: '沪指',
    symbol: 'SH000001',
  },
  {
    name: '深指',
    symbol: 'SZ399001',
  },
  {
    name: '创业板',
    symbol: 'SZ399006',
  },
  {
    name: '科创50',
    symbol: 'SH000688',
  },
  {
    name: '沪深300',
    symbol: 'SH000300',
  },
];
const symbols = marketList.map((item) => item.symbol).join(',');
export default function BottomBar() {
  const [dynamicData, setDynamicData] = useState<SelectionDetailsType[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    // 存储定时器ID，用于清理
    let intervalId: NodeJS.Timeout;

    // 定义请求数据的函数
    const fetchData = async () => {
      const response = await getSelectionDetails(symbols);
      setDynamicData(response.data);
    };

    // 立即执行一次请求
    fetchData();

    // 设置轮询：每隔5秒请求一次（时间可根据需求调整）
    if (symbols && isInStockTradingTime()) {
      intervalId = setInterval(fetchData, 1000);
    }

    // 清理函数：组件卸载或code变化时清除定时器
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);
  return (
    <div className="flex items-center text-[#fff] text-[13px] h-[25px] gap-[20px] pl-[10px] absolute left-[0] bottom-[0]">
      {dynamicData.map((item, index) => {
        return (
          <div
            className="flex items-center gap-[5px] cursor-pointer"
            key={item.code}
            onClick={() => {
              navigate('/kline/' + marketList[index].symbol);
            }}
          >
            <span>{item.name}</span>
            <div
              style={{
                color: item.percent >= 0 ? 'red' : 'green',
              }}
            >
              {item.current}
              <span className="ml-[5px]">{item.percent}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
