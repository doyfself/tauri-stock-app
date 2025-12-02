import { useState, useEffect } from 'react';
import {
  Button,
  Tabs,
  message,
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Spin,
} from 'antd';
import dayjs from 'dayjs';
import {
  getAllHoldingsApi,
  getAllOrdersApi,
  getHistoryHoldingsApi,
  getMonthlyStatsApi,
} from '@/apis/api';
import type { HoldingItem, OrderItem, MonthlyStats } from '@/types/response';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import HoldingsCard from '@/components/myHolding/HoldingsCard';
import OrdersTable from '@/components/myHolding/OrdersTable';
import HistoryTable from '@/components/myHolding/HistoryTable';
import AddOrderModal from '@/components/myHolding/AddOrderModal';
import type { initModalData } from '@/components/myHolding/AddOrderModal';

interface PaginationParams {
  current: number;
  pageSize: number;
  total: number;
}

export default function MyHolding() {
  const [activeTab, setActiveTab] = useState('holdings');
  const [modalOpen, setModalOpen] = useState(false);
  const [holdingList, setHoldingList] = useState<HoldingItem[]>([]);
  const [historyHoldingList, setHistoryHoldingList] = useState<HoldingItem[]>(
    [],
  );
  const [orderList, setOrderList] = useState<OrderItem[]>([]);
  const [symbols, setSymbols] = useState<string>('');
  const [ordersPagination, setOrdersPagination] = useState<PaginationParams>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [historyPagination, setHistoryPagination] = useState<PaginationParams>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);

  const [initData, setInitData] = useState<initModalData>(null);

  const [selectedMonth, setSelectedMonth] = useState<dayjs.Dayjs>(dayjs());
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchMonthlyStats = async (month: dayjs.Dayjs) => {
    const year = month.year();
    const monthNum = month.month() + 1;

    setStatsLoading(true);
    try {
      const res = await getMonthlyStatsApi({ year, month: monthNum });
      if (res.success) {
        setMonthlyStats(res.data as MonthlyStats);
      } else {
        setMonthlyStats(null);
      }
    } catch (err) {
      console.error('获取月度统计失败:', err);
      setMonthlyStats(null);
      message.error('获取统计数据失败');
    } finally {
      setStatsLoading(false);
    }
  };

  async function fetchHoldings() {
    setLoading(true);
    try {
      const holdingRes = await getAllHoldingsApi();
      setHoldingList(holdingRes.data || []);
      setSymbols(holdingRes.data.map((item) => item.code).join(','));
    } catch {
      message.error('获取持仓数据失败');
    } finally {
      setLoading(false);
    }
  }

  async function fetchHistoryHoldings(
    page: number = historyPagination.current,
    pageSize: number = historyPagination.pageSize,
  ) {
    try {
      const historyRes = await getHistoryHoldingsApi({
        current: page,
        pageSize,
      });
      setHistoryHoldingList(historyRes.data || []);
      setHistoryPagination((prev) => ({
        ...prev,
        current: page,
        pageSize,
        total: historyRes.count as number,
      }));
    } catch (error) {
      console.log(error);
    }
  }

  async function fetchOrders(
    page: number = ordersPagination.current,
    pageSize: number = ordersPagination.pageSize,
  ) {
    try {
      const orderRes = await getAllOrdersApi({ current: page, pageSize });
      if (orderRes.success) {
        setOrderList(orderRes.data?.orders || []);
        setOrdersPagination((prev) => ({
          ...prev,
          current: page,
          pageSize,
          total: orderRes.data?.total || 0,
        }));
      } else {
        message.error(orderRes.message || '获取委托记录失败');
      }
    } catch {
      message.error('获取委托记录失败');
    }
  }

  useEffect(() => {
    fetchHoldings();
    fetchOrders();
    fetchHistoryHoldings();
  }, []);

  useEffect(() => {
    fetchMonthlyStats(selectedMonth);
  }, [selectedMonth]);

  const { data: dynamicData } = useRealTimeData(symbols, {
    enabled: symbols.length > 0 && activeTab === 'holdings',
  });

  const submitCallBack = () => {
    fetchHoldings();
    fetchOrders();
    fetchHistoryHoldings(1);
    fetchMonthlyStats(selectedMonth);
    message.success('操作成功');
  };

  const handleOrdersTableChange = (pagination: any) => {
    if (pagination.current && pagination.pageSize) {
      fetchOrders(pagination.current, pagination.pageSize);
    }
  };

  const handleHistoryTableChange = (pagination: any) => {
    if (pagination.current && pagination.pageSize) {
      fetchHistoryHoldings(pagination.current, pagination.pageSize);
    }
  };

  const StatsSection = () => (
    <Card className="mb-[6px] shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[16px] mb-[8px]">
        <h2 className="text-[18px] font-medium text-gray-800">交易绩效统计</h2>
        <DatePicker.MonthPicker
          value={selectedMonth}
          onChange={(date) => {
            if (date) {
              setSelectedMonth(date);
            }
          }}
          placeholder="选择月份"
          allowClear={false}
          className="w-full sm:w-auto"
        />
      </div>

      {statsLoading ? (
        <div className="flex justify-center py-[12px]">
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="操作次数"
              value={monthlyStats?.operation_count ?? 0}
              suffix="笔"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="胜率"
              value={
                monthlyStats
                  ? Number((monthlyStats.win_rate * 100).toFixed(2))
                  : 0
              }
              suffix="%"
              valueStyle={{
                color:
                  monthlyStats && monthlyStats.win_rate > 0.5
                    ? '#f5222d'
                    : '#52c41a',
              }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="盈利"
              value={monthlyStats?.total_profit ?? 0}
              prefix="¥"
              precision={2}
              valueStyle={{
                color:
                  monthlyStats?.total_profit !== undefined &&
                  monthlyStats.total_profit > 0
                    ? '#f5222d'
                    : '#52c41a',
              }}
            />
          </Col>
        </Row>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-[12px]">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题和操作按钮 */}
        <div className="flex justify-end items-center p-[12px]">
          <Button
            type="primary"
            onClick={() => setModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 border-blue-600"
          >
            新建委托
          </Button>
        </div>

        {/* 统计区域 */}
        <StatsSection />

        {/* 内容区域 */}
        <Card className="shadow-sm">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'holdings',
                label: (
                  <span className="flex items-center">
                    <span className="mr-2">📊</span>
                    持仓管理
                  </span>
                ),
                children: (
                  <HoldingsCard
                    holdingList={holdingList}
                    dynamicData={dynamicData}
                    loading={loading}
                    setInitData={setInitData}
                    setModalOpen={setModalOpen}
                  />
                ),
              },
              {
                key: 'orders',
                label: (
                  <span className="flex items-center">
                    <span className="mr-2">📝</span>
                    委托记录
                  </span>
                ),
                children: (
                  <OrdersTable
                    orderList={orderList}
                    pagination={ordersPagination}
                    onChange={handleOrdersTableChange}
                    onRefresh={fetchOrders}
                  />
                ),
              },
              {
                key: 'history',
                label: (
                  <span className="flex items-center">
                    <span className="mr-2">📋</span>
                    交易历史
                  </span>
                ),
                children: (
                  <HistoryTable
                    historyList={historyHoldingList}
                    pagination={historyPagination}
                    onChange={handleHistoryTableChange}
                  />
                ),
              },
            ]}
          />
        </Card>

        <AddOrderModal
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          onOrderSuccess={submitCallBack}
          initData={initData}
        />
      </div>
    </div>
  );
}
