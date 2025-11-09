import { getAllSelectionsApi, updateSelectionSortApi } from '@/apis/api';
import type { SelectionItem } from '@/types/response';
import { useSelectionStore } from '@/stores/userStore';
import { useEffect, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { SwapOutlined } from '@ant-design/icons';
import { Modal, InputNumber, type InputNumberProps } from 'antd';
import { useWindowSizeStore } from '@/stores/userStore';
import { useRealTimeData } from '@/hooks/useRealTimeData';

export default function App({ code }: { code: string }) {
  // 订阅刷新标识，当它变化时会触发组件更新
  const refreshFlag = useSelectionStore((state) => state.refreshFlag);
  const navigate = useNavigate();
  const [baseData, setBaseData] = useState<SelectionItem[]>([]);
  const [symbols, setSymbols] = useState<string>('');
  const [current, setCurrent] = useState(-1);
  const [target, setTarget] = useState(-1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { height: windowHeight } = useWindowSizeStore();

  // 定时获取实时数据
  const { data: dynamicData, fetchData } = useRealTimeData(symbols, {
    enabled: symbols.length > 0,
  });

  const initData = async () => {
    // 获取自选列表
    const res = await getAllSelectionsApi();
    if (res && res.data) {
      setBaseData(res.data);
      // 只使用自选的 symbols
      const selectionSymbols = res.data.map((item) => item.code).join(',');
      setSymbols(selectionSymbols);
    } else {
      setBaseData([]);
      setSymbols('');
    }
  };

  useEffect(() => {
    fetchData();
  }, [symbols, fetchData]);

  useEffect(() => {
    initData();
  }, []);

  useEffect(() => {
    const index = baseData.findIndex((item) => code.includes(item.code));
    setCurrent(index);
  }, [baseData, code]);

  useEffect(() => {
    if (refreshFlag > 0) initData();
  }, [refreshFlag]);

  const scanDetails = (code: string) => {
    navigate('/kline/' + code);
  };

  // 排序
  const sortSelection = (e: MouseEvent, index: number) => {
    e.stopPropagation();
    setCurrent(index);
    setIsModalOpen(true);
  };

  const handleInputChange: InputNumberProps['onChange'] = (value) => {
    if (value) {
      setTarget(value as number);
    }
  };

  const handleOk = async () => {
    if (target === current || target < 1 || target > baseData.length) {
      return;
    }

    const actualTarget = target - 1;

    if (current < 0 || current >= baseData.length) {
      return;
    }

    const symbolArr = baseData.map((item) => item.code);
    const ele = symbolArr.splice(current, 1);
    symbolArr.splice(actualTarget, 0, ele[0]);
    await updateSelectionSortApi(symbolArr);
    initData();
    setIsModalOpen(false);
  };

  useEffect(() => {
    // 键盘事件处理函数
    const handleKeyDown = (e: KeyboardEvent) => {
      let code;
      // 上箭头 (ArrowUp)
      if (e.key === 'ArrowUp' && current > 0) {
        e.preventDefault(); // 阻止默认行为（如页面滚动）
        code = baseData[current - 1].code;
      }
      // 下箭头 (ArrowDown)
      else if (e.key === 'ArrowDown' && current < baseData.length - 1) {
        e.preventDefault(); // 阻止默认行为（如页面滚动）
        code = baseData[current + 1].code;
      }
      if (code) {
        navigate('/kline/' + code);
      }
    };
    // 绑定到 document（也可绑定到 window）
    document.addEventListener('keydown', handleKeyDown, true);

    // 清理函数：组件卸载时移除事件监听
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [current, baseData, navigate]);

  return (
    <>
      <div
        className="w-[200px] text-[#fff] flex flex-col border-r-1 border-[#0F1011]"
        style={{ height: windowHeight + 'px' }}
      >
        <div className="bg-[##535A65] text-[14px]  h-[30px] flex justify-center items-center">
          自选
        </div>
        <div className="bg-[#23272D] text-[12px] flex items-center justify-between h-[20px] pl-[5px] pr-[5px]">
          <span>名称</span>
          <span>涨幅/现价</span>
        </div>

        {/* 空状态美化 */}
        {baseData.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#666] text-[14px]">
            <div className="mb-2">暂无自选股票</div>
            <div className="text-[12px]">请添加股票到自选列表</div>
          </div>
        ) : (
          <ul className="flex-1 overflow-auto">
            {dynamicData &&
              dynamicData.length > 0 &&
              baseData.map((item, index) => {
                const dynamicItem = dynamicData[index];

                return (
                  <li
                    style={{
                      background: index === current ? '#2E4365' : '#1A1B1F',
                    }}
                    className="flex items-center pl-[5px] pr-[5px] h-[50px] justify-between border-b border-[#24262D] text-[13px]"
                    onClick={() => scanDetails(item.code)}
                    key={item.code}
                  >
                    <div className="flex">
                      <div>
                        {index + 1}
                        <div
                          onClick={(e) => sortSelection(e, index)}
                          className="cursor-pointer rotate-90"
                        >
                          <SwapOutlined />
                        </div>
                      </div>
                      <div
                        className="ml-[5px]"
                        style={{
                          color: item.color || '#fff',
                        }}
                      >
                        <div>{item.name}</div>
                        <div>{item.code}</div>
                      </div>
                    </div>
                    <div
                      style={{
                        color: dynamicItem?.percent >= 0 ? 'red' : 'green',
                      }}
                    >
                      <div>{dynamicItem?.percent || 0}%</div>
                      <div>{dynamicItem?.current || 0}</div>
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
      <Modal
        title="排序"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
      >
        <InputNumber
          style={{ width: 200 }}
          placeholder="输入目标位置"
          max={baseData.length}
          min={1}
          onChange={handleInputChange}
        />
        <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
          当前排序范围：1 - {baseData.length} (仅自选股票)
        </div>
      </Modal>
    </>
  );
}
