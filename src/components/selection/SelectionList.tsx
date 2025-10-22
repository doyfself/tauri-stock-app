import {
  getAllSelectionsApi,
  getSelectionDetails,
  updateSelectionSortApi,
} from '@/apis/api';
import type { SelectionItem, SelectionDetailsType } from '@/types/response';
import { useSelectionStore } from '@/stores/userStore';
import { useEffect, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { SwapOutlined } from '@ant-design/icons';
import { Modal, InputNumber, type InputNumberProps } from 'antd';
import { useWindowSizeStore } from '@/stores/userStore';
import useInterval from '@/hooks/useInterval';
export default function App({ code }: { code: string }) {
  // 订阅刷新标识，当它变化时会触发组件更新
  const refreshFlag = useSelectionStore((state) => state.refreshFlag);
  const navigate = useNavigate();
  const [baseData, setBaseData] = useState<SelectionItem[]>([]);
  const [symbols, setSymbols] = useState<string>('');
  const [dynamicData, setDynamicData] = useState<SelectionDetailsType[]>([]);
  const [current, setCurrent] = useState(-1);
  const [target, setTarget] = useState(-1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { height: windowHeight } = useWindowSizeStore();
  const initData = async () => {
    // 获取自选列表
    const res = await getAllSelectionsApi();
    if (res && res.data) {
      setBaseData(res.data);
      setSymbols(res.data.map((item) => item.code).join(','));
    }
  };
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
  const fetchData = async () => {
    if (symbols) {
      try {
        const response = await getSelectionDetails(symbols);
        if (response && response.data) {
          setDynamicData(response.data);
        }
      } catch (error) {
        console.error('获取股票详情失败:', error);
        // 可根据需求添加错误处理，如重试机制
      }
    } else {
      setDynamicData([]);
    }
  };
  useEffect(() => {
    fetchData();
  }, [symbols]);
  useInterval(fetchData, 1000);
  const scanDetails = (code: string) => {
    navigate('/kline/' + code);
  };
  //  排序
  const sortSelection = (e: MouseEvent, index: number) => {
    e.stopPropagation();
    setCurrent(index + 1);
    setIsModalOpen(true);
  };
  const handleInputChange: InputNumberProps['onChange'] = (value) => {
    if (value) {
      setTarget(value as number);
    }
  };
  const handleOk = async () => {
    if (target === current) {
      return;
    }
    const symbolArr = symbols.split(',');
    const ele = symbolArr.splice(current - 1, 1);
    symbolArr.splice(target - 1, 0, ele[0]);
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
        <ul className="flex-1 overflow-auto">
          {dynamicData &&
            dynamicData.length &&
            dynamicData.map((item, index) => {
              return (
                <li
                  style={{
                    background: index === current ? '#2E4365' : '#1A1B1F',
                  }}
                  className="flex items-center pl-[5px] pr-[5px] h-[50px] justify-between border-b border-[#24262D] text-[13px]"
                  onClick={() => scanDetails(baseData[index].code)}
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
                        color:
                          (baseData[index] && baseData[index].color) || '#fff',
                      }}
                    >
                      <div>{item.name}</div>
                      <div>{item.code}</div>
                    </div>
                  </div>
                  <div
                    style={{
                      color: item.percent >= 0 ? 'red' : 'green',
                    }}
                  >
                    <div>{item.percent}%</div>
                    <div>{item.current}</div>
                  </div>
                </li>
              );
            })}
        </ul>
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
      </Modal>
    </>
  );
}
