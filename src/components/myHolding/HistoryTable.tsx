import { Table, Tag, Empty } from 'antd';
import type { TableColumnsType, TablePaginationConfig } from 'antd';
import type { HoldingItem } from '@/types/response';

interface HistoryTableProps {
  historyList: HoldingItem[];
  pagination: any;
  onChange: (pagination: TablePaginationConfig) => void;
}

export default function HistoryTable({
  historyList,
  pagination,
  onChange,
}: HistoryTableProps) {
  const columns: TableColumnsType<HoldingItem> = [
    {
      title: '股票名称',
      dataIndex: 'name',
      width: 120,
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-gray-500 text-sm">{record.code}</div>
        </div>
      ),
    },
    {
      title: '持仓数量',
      dataIndex: 'quantity',
      width: 100,
      render: (value) => (
        <span className="font-semibold">{value.toLocaleString()} 股</span>
      ),
    },
    {
      title: '成本价',
      dataIndex: 'cost',
      width: 100,
      render: (value) => (
        <span className="text-gray-700">¥{value.toFixed(2)}</span>
      ),
    },
    {
      title: '卖出价',
      dataIndex: 'sell_price',
      width: 100,
      render: (value) =>
        value ? (
          <span className="text-blue-600 font-semibold">
            ¥{value.toFixed(2)}
          </span>
        ) : (
          '-'
        ),
    },
    {
      title: '盈利情况',
      dataIndex: 'profit',
      width: 120,
      render: (value) =>
        value ? (
          <div>
            <Tag
              color={value > 0 ? 'red' : 'green'}
              className="px-3 py-1 rounded-full m-0"
            >
              {value > 0 ? '盈利' : '亏损'}
            </Tag>
            <div
              className={`text-sm font-semibold mt-1 ${
                value > 0 ? 'text-red-500' : 'text-green-500'
              }`}
            >
              {value > 0 ? '+' : ''}
              {value.toFixed(2)}元
            </div>
          </div>
        ) : (
          '-'
        ),
    },
    {
      title: '盈利率',
      width: 100,
      render: (_, record) => {
        if (!record.sell_price || !record.profit) return '-';
        const profitRate =
          (record.profit / (record.cost * record.quantity)) * 100;
        return (
          <span
            className={`font-semibold ${
              profitRate > 0 ? 'text-red-500' : 'text-green-500'
            }`}
          >
            {profitRate > 0 ? '+' : ''}
            {profitRate.toFixed(2)}%
          </span>
        );
      },
    },
    {
      title: '持仓时间',
      dataIndex: 'hold_time',
      width: 120,
      render: (value) =>
        value ? (
          <div className="text-gray-600">{value.split(' ')[0]}</div>
        ) : (
          '-'
        ),
    },
    {
      title: '卖出时间',
      dataIndex: 'sell_time',
      width: 120,
      render: (value) =>
        value ? (
          <div className="text-gray-600">{value.split(' ')[0]}</div>
        ) : (
          '-'
        ),
    },
  ];

  if (historyList.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="暂无历史持仓记录"
        className="py-12"
      />
    );
  }

  return (
    <div>
      {/* 表格头部 */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">交易历史</h3>
        <p className="text-gray-600 text-sm">
          共 {pagination.total} 条历史持仓记录
        </p>
      </div>

      {/* 表格 */}
      <Table<HoldingItem>
        columns={columns}
        dataSource={historyList}
        size="middle"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        onChange={onChange}
        rowKey="id"
        scroll={{ x: 900 }}
        className="shadow-sm"
      />
    </div>
  );
}
