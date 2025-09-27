import { Input } from 'antd';
import { useState, type ChangeEvent } from 'react';
import { throttle } from '@/utils/common';
import { queryStockByWordApi } from '@/apis/api';
import { useNavigate } from 'react-router-dom';
import type { SearchStocksResponse } from '@/types/response';
export default function HeaderSearch() {
  const navigate = useNavigate();
  const [focuing, setFocuing] = useState(false);
  const [searchWord, setSearchWord] = useState('');
  const [result, setResult] = useState<SearchStocksResponse[]>([]);
  const throttleChange = throttle(async (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchWord(val);
    if (!val) return;
    const result = await queryStockByWordApi(val);
    if (result.data) setResult(result.data);
  }, 200);
  const resultItemClick = (code: string) => {
    navigate(`/kline/${code}`);
  };
  return (
    <div className="w-[200px] relative">
      <Input.Search
        placeholder="搜索"
        variant="filled"
        size="small"
        onFocus={() => setFocuing(true)}
        onBlur={() => setFocuing(false)}
        value={searchWord}
        onChange={throttleChange}
      />
      {focuing && (
        <div className="absolute w-[200px] h-[270px] bg-[#191B1F] border-1 border-[#47494C] rounded-[2px] z-999">
          {result.map((item) => {
            return (
              <div
                onMouseDown={() => resultItemClick(item.symbol)}
                className="flex items-center justify-between text-[13px] text-[#fff] h-[25px] pl-[10px] pr-[10px] cursor-pointer hover:text-[#4294F7]"
              >
                <span>{item.symbol}</span>
                <span>{item.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
