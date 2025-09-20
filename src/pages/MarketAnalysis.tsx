import { useEffect, useState, useMemo } from 'react';
import { getAnalysisApi, addAnalysisApi } from '@/apis/api';
import { Input, Button } from 'antd';
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

type EditStatesType = {
  [key: string]: {
    isEditing: boolean;
    content: string;
  };
};

export default function MarketAnalysis() {
  // 缓存下午3点的时间戳
  const threePmTimestamp = useMemo(() => {
    const today = new Date();
    today.setHours(15, 0, 0, 0);
    return today.getTime().toString();
  }, []);

  // 管理每个市场的编辑状态和输入内容
  const [editStates, setEditStates] = useState<EditStatesType>(
    marketsCodes.reduce((acc, item) => {
      acc[item.code] = {
        isEditing: false, // 是否处于编辑状态
        content: '', // 输入框内容
      };
      return acc;
    }, {} as EditStatesType),
  );
  useEffect(() => {
    const code = marketsCodes.map((item) => item.code).join(',');
    getAnalysisApi(code).then((res) => {
      if (res.data) {
        Object.keys(res.data).forEach((key) => {
          const item = res.data?.[key];
          if (item !== null) {
            setEditStates((prev) => ({
              ...prev,
              [key]: {
                content: item?.analysis as string,
                isEditing: false,
              },
            }));
          }
        });
      }
    });
  }, []);

  // 处理编辑按钮点击
  const handleEdit = (code: string) => {
    setEditStates((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        isEditing: true,
      },
    }));
  };

  // 处理完成按钮点击
  const handleComplete = (code: string) => {
    setEditStates((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        isEditing: false,
      },
    }));
    addAnalysisApi(code, editStates[code].content);
  };

  // 处理输入框内容变化
  const handleInputChange = (code: string, value: string) => {
    setEditStates((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        content: value,
      },
    }));
  };

  return (
    <div className="overflow-auto h100p flex flex-col gap-20">
      {marketsCodes.map((item) => {
        const { isEditing, content } = editStates[item.code];
        return (
          <div className="flex gap-20" key={`market-analysis-${item.code}`}>
            <h3>{item.name}</h3>
            <StockKlineChartMain
              code={item.code}
              width={800}
              height={300}
              timestamp={threePmTimestamp}
              limit={80}
            />
            <Input.TextArea
              style={{
                color: 'green',
                fontSize: '16px',
              }}
              rows={4}
              disabled={!isEditing}
              value={content}
              onChange={(e) => handleInputChange(item.code, e.target.value)}
            />
            {!isEditing ? (
              <Button type="link" onClick={() => handleEdit(item.code)}>
                编辑
              </Button>
            ) : null}
            {isEditing ? (
              <Button type="primary" onClick={() => handleComplete(item.code)}>
                完成
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
