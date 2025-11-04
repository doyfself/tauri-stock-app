import {
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Empty,
  Skeleton,
  Button,
  Popconfirm,
  message,
} from 'antd';
import { RiseOutlined, FallOutlined, DeleteOutlined } from '@ant-design/icons';
import type { HoldingItem } from '@/types/response';
import { deleteHoldingApi } from '@/apis/api';

interface HoldingsCardProps {
  holdingList: HoldingItem[];
  dynamicData?: any[];
  loading?: boolean;
  onDeleteSuccess?: () => void; // 删除成功后的回调
}

export default function HoldingsCard({
  holdingList,
  dynamicData,
  loading,
  onDeleteSuccess,
}: HoldingsCardProps) {
  // 处理删除持仓
  const handleDeleteHolding = async (holdingId: number, stockName: string) => {
    try {
      const result = await deleteHoldingApi(holdingId);
      if (result.success) {
        message.success(`已删除 ${stockName} 的持仓`);
        onDeleteSuccess?.(); // 调用成功回调
      } else {
        message.error(`删除失败: ${result.message}`);
      }
    } catch (error) {
      message.error('删除持仓失败');
      console.error('删除持仓失败:', error);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
        {[1, 2, 3].map((item) => (
          <Card key={item} className="shadow-sm">
            <Skeleton active />
          </Card>
        ))}
      </div>
    );
  }

  if (holdingList.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="暂无持仓数据"
        className="py-[48px]"
      />
    );
  }

  return (
    <div className="flex w-full gap-[10px]">
      {dynamicData &&
        holdingList.map((holding, index) => {
          const currentData = dynamicData[index] || {};
          const currentPrice = currentData.current || 0;

          // 计算盈利数据
          const profitAmount = (currentPrice - holding.cost) * holding.quantity;
          const profitRate =
            holding.cost > 0
              ? ((currentPrice - holding.cost) / holding.cost) * 100
              : 0;

          // 判断盈利状态 - 红涨绿跌
          const isProfit = profitAmount > 0;
          const isLoss = profitAmount < 0;

          return (
            <Card
              key={holding.code}
              title={`${holding.name} (${holding.code})`}
              className="mb-4 relative"
              extra={
                <div className="flex items-center gap-[8px]">
                  <Tag color={isProfit ? 'red' : isLoss ? 'green' : 'default'}>
                    {isProfit ? (
                      <RiseOutlined />
                    ) : isLoss ? (
                      <FallOutlined />
                    ) : null}
                    {profitRate.toFixed(2)}%
                  </Tag>
                  <Popconfirm
                    title="确认删除持仓"
                    description={`确定要删除 ${holding.name} 的持仓记录吗？`}
                    onConfirm={() =>
                      handleDeleteHolding(holding.id, holding.name)
                    }
                    okText="确定"
                    cancelText="取消"
                    okType="danger"
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      size="small"
                      className="hover:bg-[#fff2f0]"
                    />
                  </Popconfirm>
                </div>
              }
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="持仓数量"
                    value={holding.quantity}
                    suffix="股"
                  />
                  <Statistic
                    title="成本价"
                    value={holding.cost}
                    precision={2}
                    prefix="¥"
                    style={{ marginTop: 16 }}
                  />
                  <Statistic
                    title="当前价"
                    value={currentPrice}
                    precision={2}
                    prefix="¥"
                    style={{ marginTop: 16 }}
                  />
                </Col>

                <Col span={12}>
                  <Statistic
                    title="盈利金额"
                    value={profitAmount}
                    precision={2}
                    valueStyle={{
                      color: isProfit
                        ? '#ff4d4f' // 红色表示盈利
                        : isLoss
                          ? '#52c41a' // 绿色表示亏损
                          : '#000000',
                    }}
                  />
                  <Statistic
                    title="盈利比例"
                    value={profitRate}
                    precision={2}
                    suffix="%"
                    valueStyle={{
                      color: isProfit
                        ? '#ff4d4f' // 红色表示盈利
                        : isLoss
                          ? '#52c41a' // 绿色表示亏损
                          : '#000000',
                    }}
                    style={{ marginTop: 16 }}
                  />
                  <Statistic
                    title="持仓市值"
                    value={currentPrice * holding.quantity}
                    precision={2}
                    prefix="¥"
                    style={{ marginTop: 16 }}
                    valueStyle={{ whiteSpace: 'nowrap' }} // 防止换行
                  />
                </Col>
              </Row>
            </Card>
          );
        })}
    </div>
  );
}
