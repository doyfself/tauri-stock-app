import { Button, Drawer, Input, List, type InputRef } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useRef, useState, type ChangeEvent } from 'react';
import { throttle } from '@/utils/common';
import { queryStockByWordApi } from '@/apis/api';
import { useNavigate } from 'react-router-dom';
export default function SearchStock() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchWord, setSearchWord] = useState('');
  const [result, setResult] = useState<string[]>([]);
  const inputRef = useRef<InputRef>(null);
  const throttleChange = throttle(async (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchWord(val);
    if (!val) return;
    const result = await queryStockByWordApi(val);
    if (result.data)
      setResult(result.data.map((item) => item['symbol'] + ' ' + item['name']));
  }, 200);
  const openDrawer = () => {
    setOpen(true);
    setSearchWord('');
    // 聚焦输入框
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };
  const resultItemClick = (index: number) => {
    const code = result[index].slice(0, 8);
    navigate(`/kline/${code}`);
    setOpen(false);
  };

  return (
    <>
      <Button shape="round" icon={<SearchOutlined />} onClick={openDrawer}>
        Search
      </Button>
      <Drawer
        title="搜索"
        open={open}
        maskClosable={true}
        onClose={() => setOpen(false)}
      >
        <Input
          placeholder="输入代码或名称"
          value={searchWord}
          ref={inputRef}
          onChange={throttleChange}
        />
        <List
          bordered
          dataSource={result}
          renderItem={(item, index) => (
            <List.Item>
              <div onClick={() => resultItemClick(index)}>{item}</div>
            </List.Item>
          )}
        />
      </Drawer>
    </>
  );
}
