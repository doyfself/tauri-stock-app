import { Input } from 'antd';
import { useState, type ChangeEvent, useEffect, useRef } from 'react';
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
  showInHeader?: boolean;
}

const HeaderSearch = (props: HeaderSearchProps) => {
  const { value, onChange, id, showInHeader = false } = props;
  const [focuing, setFocuing] = useState(false);
  const [searchWord, setSearchWord] = useState('');
  const [result, setResult] = useState<SearchStocksResponse[]>([]);
  const prevCodeRef = useRef<string>('');

  // 当传入的 code 变化时，根据 code 查询对应的股票名称
  useEffect(() => {
    const currentCode = value?.code || '';

    // 如果 code 有变化且不为空，查询对应的股票信息
    if (currentCode && currentCode !== prevCodeRef.current) {
      prevCodeRef.current = currentCode;

      // 如果已经有 name，直接显示
      if (value?.name) {
        setSearchWord(value.name);
      } else {
        // 没有 name，根据 code 查询
        fetchStockByCode(currentCode);
      }
    } else if (!currentCode) {
      // 如果 code 为空，清空搜索词
      setSearchWord('');
      prevCodeRef.current = '';
    }
  }, [value?.code, value?.name]);

  // 根据 code 查询股票信息
  const fetchStockByCode = async (code: string) => {
    const queryCode = code.slice(2, 8);
    try {
      // 先显示 code
      setSearchWord(code);

      const result = await queryStockByWordApi(queryCode);
      if (result.data && result.data.length > 0) {
        // 查找完全匹配的股票
        const exactMatch = result.data.find((item) => item.symbol === code);
        if (exactMatch) {
          setSearchWord(exactMatch.name);

          // 如果父组件没有提供完整的 value，可以自动补全
          if (!value?.name) {
            const stockValue = {
              code: exactMatch.symbol,
              name: exactMatch.name,
            };
            onChange?.(stockValue);
          }
        } else {
          // 没有找到完全匹配的，保持显示 code
          setSearchWord(code);
        }
      }
    } catch (error) {
      console.error('Failed to fetch stock by code:', error);
      // 查询失败时保持显示 code
      setSearchWord(code);
    }
  };

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
    setResult([]);
  };

  const handleFocus = () => {
    setFocuing(true);
  };

  const handleBlur = () => {
    setTimeout(() => setFocuing(false), 200);
  };

  return (
    <div className="w-[200px] relative">
      <Input
        id={id}
        placeholder="输入股票名称或代码"
        value={searchWord}
        onChange={throttleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{
          color: '#fff',
        }}
        size={showInHeader ? 'small' : 'middle'}
        variant={showInHeader ? 'filled' : 'outlined'}
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
