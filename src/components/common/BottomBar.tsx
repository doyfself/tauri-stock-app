import { getSelectionDetails } from '@/apis/api';
import { useState, useEffect } from 'react';
import type { SelectionDetailsType } from '@/types/response';
import { useNavigate } from 'react-router-dom';
import useInterval from '@/hooks/useInterval';
import { useRealTimeData } from '@/hooks/useRealTimeData';
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
  const navigate = useNavigate();
  const { data: dynamicData } = useRealTimeData(symbols, {
    enabled: true,
  });
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
