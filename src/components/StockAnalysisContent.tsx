// components/StockReviewDetailContent.tsx
import { addStockCodePrefix } from '@/utils/common';
import StockKlineChartMain from '@/components/charts/StockKlineChartMain';
import { LeftOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Card, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';

interface DetailContentType {
  id: number; // 唯一标识符
  code: string; // 股票名称
  type?: string; // 评论类型
  title: string;
  date: string; // 股票日期
  description: string; // 描述
}

interface StockReviewDetailContentProps {
  data: DetailContentType | null;
  loading: boolean;
  onEdit: () => void;
}

export default function StockAnalysisContent({
  data,
  loading,
  onEdit,
}: StockReviewDetailContentProps) {
  const navigate = useNavigate();
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800 border-gray-700 text-center">
          <div className="text-[#fff]">数据不存在</div>
          <Button
            type="primary"
            onClick={() => navigate(-1)}
            className="mt-[16px]"
          >
            返回
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-[16px]">
      <div className="max-w-4xl mx-auto">
        {/* 头部操作栏 */}
        <Card className="mb-[16px] bg-gray-800 border-gray-700">
          <div className="flex justify-between items-center">
            <Button
              type="text"
              icon={<LeftOutlined />}
              onClick={() => navigate(-1)}
              className="text-[#ccc] hover:text-blue-400"
            >
              返回列表
            </Button>

            <h1 className="text-[#fff] text-[16px] font-bold text-center flex-1 mx-4 truncate">
              {data.title}
            </h1>

            <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
              编辑记录
            </Button>
          </div>
        </Card>

        {/* 主要内容区域 */}
        <div className="flex">
          {/* K线图卡片 */}
          <Card
            className="bg-gray-800 border-gray-700"
            bodyStyle={{ padding: '16px' }}
          >
            <StockKlineChartMain
              code={addStockCodePrefix(data.code)}
              width={800}
              height={300}
              timestamp={data.date}
              onlyShow={true}
            />
          </Card>

          {/* 详细内容卡片 */}
          <Card
            className="bg-gray-800 border-gray-700 flex-1"
            bodyStyle={{ padding: '24px' }}
          >
            <div
              className="max-w-none"
              dangerouslySetInnerHTML={{ __html: data.description }}
              style={{
                color: '#d1d5db',
                lineHeight: '1.7',
                fontSize: '15px',
              }}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
