import { Input } from 'antd';
import { useState, type ChangeEvent, useEffect } from 'react';
import { throttle } from '@/utils/common';
import { queryStockByWordApi } from '@/apis/api';
import type { SearchStocksResponse } from '@/types/response';

export interface StockValue {
  code: string;
  name: string;
}

export interface HeaderSearchProps {
  value?: StockValue;
  onChange?: (value: StockValue) => void;
  id?: string;
}

const HeaderSearch = (props: HeaderSearchProps) => {
  const { value, onChange, id } = props;
  const [focuing, setFocuing] = useState(false);
  const [searchWord, setSearchWord] = useState(value?.code || '');
  const [result, setResult] = useState<SearchStocksResponse[]>([]);

  // 同步外部 value 到内部状态
  useEffect(() => {
    if (value?.name !== searchWord) {
      setSearchWord(value?.name || '');
    }
  }, [value?.code]);

  const throttleChange = throttle(async (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchWord(val);

    if (!val) {
      setResult([]);
      return;
    }

    const result = await queryStockByWordApi(val);
    if (result.data) setResult(result.data);
  }, 200);

  const resultItemClick = (item: SearchStocksResponse) => {
    const stockValue = {
      code: item.symbol,
      name: item.name,
    };

    // 设置选中值
    setSearchWord(item.name);
    // 调用父组件的 onChange，传递完整的股票信息
    onChange?.(stockValue);
    setFocuing(false);
  };

  const handleFocus = () => {
    setFocuing(true);
  };

  const handleBlur = () => {
    // 延迟隐藏下拉框，确保点击选项能触发
    setTimeout(() => setFocuing(false), 200);
  };

  return (
    <div className="w-[200px] relative">
      <Input.Search
        id={id}
        placeholder="搜索"
        variant="filled"
        size="small"
        value={searchWord}
        onChange={throttleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {focuing && result.length > 0 && (
        <div className="absolute w-[200px] max-h-[270px] bg-[#191B1F] border-1 border-[#47494C] rounded-[2px] z-999 overflow-y-auto">
          {result.map((item) => {
            return (
              <div
                key={item.symbol}
                onMouseDown={() => resultItemClick(item)}
                className="flex items-center justify-between text-[13px] text-[#fff] h-[25px] pl-[10px] pr-[10px] cursor-pointer hover:text-[#4294F7] hover:bg-[#2a2d33]"
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
};

export default HeaderSearch;
