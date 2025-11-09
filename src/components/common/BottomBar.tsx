import { useNavigate } from 'react-router-dom';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { marketList } from '@/config';
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
