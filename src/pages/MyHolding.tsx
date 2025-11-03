import { useState, useEffect } from 'react';
import { Button, Tabs, message, Card, Row, Col, Statistic } from 'antd';
import {
  getAllHoldingsApi,
  getAllOrdersApi,
  getHistoryHoldingsApi,
} from '@/apis/api';
import type { HoldingItem, OrderItem } from '@/types/response';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import HoldingsCard from '@/components/myHolding/HoldingsCard';
import OrdersTable from '@/components/myHolding/OrdersTable';
import HistoryTable from '@/components/myHolding/HistoryTable';
import SelfReflectModal from '@/components/myHolding/SelfReflectModal';

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

  // 统计数据
  const totalHoldings = holdingList.length;
  const totalOrders = ordersPagination.total;
  const totalHistory = historyPagination.total;

  async function fetchHoldings() {
    setLoading(true);
    try {
      const holdingRes = await getAllHoldingsApi();
      setHoldingList(holdingRes.data || []);
      setSymbols(holdingRes.data.map((item) => item.code).join(','));
    } catch (error) {
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
    } catch (error) {
      message.error('获取委托记录失败');
    }
  }

  useEffect(() => {
    fetchHoldings();
    fetchOrders();
    fetchHistoryHoldings();
  }, []);

  const { data: dynamicData } = useRealTimeData(symbols, {
    enabled: symbols.length > 0 && activeTab === 'holdings',
  });

  const submitCallBack = () => {
    fetchHoldings();
    fetchOrders();
    fetchHistoryHoldings(1);
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

  // 顶部统计卡片
  const StatsCard = () => (
    <Card className="mb-6 shadow-sm">
      <Row gutter={16}>
        <Col span={8}>
          <Statistic
            title="当前持仓"
            value={totalHoldings}
            suffix="只"
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="委托记录"
            value={totalOrders}
            suffix="条"
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="历史持仓"
            value={totalHistory}
            suffix="条"
            valueStyle={{ color: '#fa8c16' }}
          />
        </Col>
      </Row>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
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

        {/* 统计卡片 */}
        <StatsCard />

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

        {/* 委托模态框 */}
        <SelfReflectModal
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          holdingList={holdingList}
          onOrderSuccess={submitCallBack}
        />
      </div>
    </div>
  );
}
