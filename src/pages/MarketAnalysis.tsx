import { useEffect, useState, useMemo } from 'react';
import { getAnalysisApi, addAnalysisApi } from '@/apis/api';
import { Input, Button, Select } from 'antd';
import { DatePicker, List, Card } from 'antd';
import type { MarketAnalysisItem } from '@/types/response';
import StockKlineChartMain from '@/components/charts/StockKlineChartMain';

const marketsCodes = [
  {
    code: 'SH000001',
    name: '上证指数',
  },
  {
    code: 'SZ399001',
    name: '深证指数',
  },
  {
    code: 'SZ399006',
    name: '创业板',
  },
];

const getBgColor = (status: string) => {
  switch (status) {
    case '看多':
      return '#CA4A47';
    case '看空':
      return '#56A870';
    default:
      return '#323439';
  }
};

export default function MarketAnalysis() {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('观察');
  const [analysisList, setAnalysisList] = useState<MarketAnalysisItem[]>([]);
  // 缓存下午3点的时间戳
  const threePmTimestamp = useMemo(() => {
    const today = new Date();
    today.setHours(15, 0, 0, 0);
    return today.getTime().toString();
  }, []);
  const initData = async () => {
    const res = await getAnalysisApi();
    console.log(res);
    if (res && res.data) {
      setAnalysisList(res.data);
    }
  };
  useEffect(() => {
    initData();
  }, []);

  // 处理完成按钮点击
  const handleComplete = async () => {
    await addAnalysisApi(date, content, status);
    setIsEditing(false);
    initData();
  };
  return (
    <div className="flex h-full gap-[20px] overflow-hidden">
      <div className="flex flex-col gap-[10px] h-full overflow-auto">
        {marketsCodes.map((item) => {
          return (
            <div className="flex gap-20" key={`market-analysis-${item.code}`}>
              <StockKlineChartMain
                code={item.code}
                width={800}
                height={300}
                timestamp={threePmTimestamp}
                onlyShow={true}
              />
            </div>
          );
        })}
      </div>
      {isEditing && (
        <div className="flex flex-col flex-1 gap-10 w100p">
          <Select
            options={[
              { value: '观察', label: <span>观察</span> },
              { value: '看多', label: <span>看多</span> },
              { value: '看空', label: <span>看空</span> },
            ]}
            defaultValue={'观察'}
            onChange={(val) => setStatus(val)}
          />
          <DatePicker
            format="YYYY-MM-DD"
            onChange={(_, date) => setDate(date as string)}
          />
          <Input.TextArea
            style={{
              color: 'green',
              fontSize: '16px',
            }}
            rows={4}
            disabled={!isEditing}
            onChange={(e) => setContent(e.target.value)}
          />
          <div>
            <Button type="primary" onClick={handleComplete}>
              完成
            </Button>
            <Button type="default" onClick={() => setIsEditing(false)}>
              取消
            </Button>
          </div>
        </div>
      )}
      {!isEditing && (
        <div>
          <List
            dataSource={analysisList}
            renderItem={(item) => (
              <List.Item>
                <Card
                  title={item.date}
                  style={{ background: getBgColor(item.status) }}
                  size="small"
                >
                  {item.analysis}
                </Card>
              </List.Item>
            )}
          />
          <Button type="primary" onClick={() => setIsEditing(true)}>
            添加分析
          </Button>
        </div>
      )}
    </div>
  );
}
