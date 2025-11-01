import { getAllHoldingsApi, getAllOrdersApi } from '@/apis/api';
import {
  Radio,
  Button,
  Modal,
  Form,
  type FormProps,
  DatePicker,
  InputNumber,
  Card,
  Divider,
  Table,
  Statistic,
  Tag,
  Row,
  Col,
} from 'antd';
import { RiseOutlined, FallOutlined } from '@ant-design/icons';
import type { TableColumnsType, TablePaginationConfig } from 'antd';
import type { HoldingItem, OrderItem } from '@/types/response';
import { handleOrderWithHolding, type FieldType } from './HoldingLogic';
import HeaderSearch from '@/components/common/HeaderSearch';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { useEffect, useState } from 'react';
export default function MyHolding() {
  const [modalOpen, setModalOpen] = useState(false);
  const [holdingList, setHoldingList] = useState<HoldingItem[]>([]);
  const [orderList, setOrderList] = useState<OrderItem[]>([]);
  const [symbols, setSymbols] = useState<string>('');
  const [queryParams, setQueryParams] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  async function fetchHoldings() {
    const holdingRes = await getAllHoldingsApi();
    setHoldingList(holdingRes.data || []);
    setSymbols(holdingRes.data.map((item) => item.code).join(','));
    const orderRes = await getAllOrdersApi(queryParams);
    setOrderList(orderRes.data.orders || []);
    setQueryParams((prev) => ({
      ...prev,
      total: orderRes.data.total,
    }));
  }
  useEffect(() => {
    fetchHoldings();
  }, []);
  const { data: dynamicData } = useRealTimeData(symbols, {
    enabled: symbols.length > 0,
  });
  const submitCallBack = () => {
    fetchHoldings();
  };
  return (
    <div className="relative justify-center pt-[50px] px-[20px]">
      <Button
        type="primary"
        className="absolute top-[20px] right-[20px]"
        onClick={() => setModalOpen(true)}
      >
        委托
      </Button>
      <div className="flex w-full gap-[10px]">
        {dynamicData &&
          holdingList.map((holding, index) => {
            const currentData = dynamicData[index] || {};
            const currentPrice = currentData.current || 0;

            // 计算盈利数据
            const profitAmount =
              (currentPrice - holding.cost) * holding.quantity;
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
                className="mb-4"
                extra={
                  <Tag color={isProfit ? 'red' : isLoss ? 'green' : 'default'}>
                    {isProfit ? (
                      <RiseOutlined />
                    ) : isLoss ? (
                      <FallOutlined />
                    ) : null}
                    {profitRate.toFixed(2)}%
                  </Tag>
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
      <Divider />
      <MyOrders orderList={orderList} paginationConfig={queryParams} />
      <SelfReflectModal
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        holdingList={holdingList}
        onOrderSuccess={submitCallBack}
      />
    </div>
  );
}

function MyOrders({
  orderList,
}: {
  orderList?: OrderItem[];
  paginationConfig: TablePaginationConfig;
}) {
  const columns: TableColumnsType<OrderItem> = [
    {
      title: '名称',
      dataIndex: 'name',
    },
    {
      title: '代码',
      dataIndex: 'code',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
    },
    {
      title: '价格',
      dataIndex: 'cost',
      render: (value) => value.toFixed(2),
    },
    {
      title: '操作',
      dataIndex: 'action',
      render: (value) => (value === '1' ? '买入' : '卖出'),
    },
    {
      title: '日期',
      dataIndex: 'time',
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];
  // 动态设置行类名
  const setRowClassName = (record: OrderItem) => {
    if (record.action === '0') {
      return 'text-[#cf1322]';
    } else {
      return 'text-[#389e0d]';
    }
  };
  return (
    <Table<OrderItem>
      columns={columns}
      dataSource={orderList}
      size="small"
      rowClassName={setRowClassName}
    />
  );
}

interface SelfReflectModalProps {
  modalOpen: boolean;
  setModalOpen: (val: boolean) => void;
  onOrderSuccess: () => void;
  holdingList: HoldingItem[];
}
export const SelfReflectModal = ({
  modalOpen,
  setModalOpen,
  onOrderSuccess,
  holdingList,
}: SelfReflectModalProps) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    setSubmitting(true);
    try {
      const success = await handleOrderWithHolding({
        values,
        holdingList,
        onSuccess: () => {
          form.resetFields(); // 重置表单
          onOrderSuccess?.(); // 执行成功回调
          setModalOpen(false); // 关闭模态框
        },
      });

      if (!success) {
        // 错误已经在 handleOrderWithHolding 中处理了
        return;
      }
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <>
      <Modal
        title="委托"
        footer={null}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
      >
        <Form
          form={form}
          name="basic"
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 20 }}
          style={{ maxWidth: 1000 }}
          initialValues={{ remember: true }}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item<FieldType>
            label="股票"
            name="stock"
            rules={[{ required: true, message: '请输入标题!' }]}
          >
            <HeaderSearch />
          </Form.Item>
          <Form.Item<FieldType>
            label="日期"
            name="time"
            rules={[{ required: true, message: '请选择日期!' }]}
          >
            <DatePicker format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item<FieldType>
            label="价格"
            name="cost"
            rules={[{ required: true, message: '请输入成本价!' }]}
          >
            <InputNumber />
          </Form.Item>
          <Form.Item<FieldType>
            label="数量"
            name="quantity"
            rules={[{ required: true, message: '请输入数量!' }]}
          >
            <InputNumber />
          </Form.Item>
          <Form.Item<FieldType>
            label="操作"
            name="action"
            rules={[{ required: true, message: '买入or卖出!' }]}
          >
            <Radio.Group>
              <Radio.Button value="1">买入</Radio.Button>
              <Radio.Button value="0">卖出</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item label={null}>
            <Button type="primary" htmlType="submit" loading={submitting}>
              提交
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
