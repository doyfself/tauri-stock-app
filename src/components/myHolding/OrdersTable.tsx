import { Table, Tag, Button, Popconfirm, message, Tooltip } from 'antd';
import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import type { TableColumnsType, TablePaginationConfig } from 'antd';
import type { OrderItem } from '@/types/response';
import { handleDeleteOrderWithHolding } from './HoldingLogic';
import type { TableProps } from 'antd';
type TablePagination<T extends object> = NonNullable<
  Exclude<TableProps<T>['pagination'], boolean>
>;

interface OrdersTableProps {
  orderList: OrderItem[];
  pagination: TablePagination<OrderItem>;
  onChange: (pagination: TablePaginationConfig) => void;
  onRefresh: () => void;
}

export default function OrdersTable({
  orderList,
  pagination,
  onChange,
  onRefresh,
}: OrdersTableProps) {
  const handleDeleteOrder = async (
    orderId: number,
    orderData: Omit<OrderItem, 'id'>,
  ) => {
    try {
      const success = await handleDeleteOrderWithHolding({
        orderId,
        orderData,
        onSuccess: () => {
          message.success('删除委托成功');
          onRefresh();
        },
        onError: (error) => {
          message.error(`删除委托失败: ${error}`);
        },
      });

      if (!success) {
        message.error('删除委托失败');
      }
    } catch {
      message.error('删除委托失败');
    }
  };

  const columns: TableColumnsType<OrderItem> = [
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
      title: '操作类型',
      dataIndex: 'action',
      width: 100,
      render: (value) => (
        <Tag
          color={value === '1' ? 'green' : 'red'}
          className="px-3 py-1 rounded-full"
        >
          {value === '1' ? '买入' : '卖出'}
        </Tag>
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 100,
      render: (value) => (
        <span className="font-semibold">{value.toLocaleString()} 股</span>
      ),
    },
    {
      title: '价格',
      dataIndex: 'cost',
      width: 100,
      render: (value) => (
        <span className="text-blue-600 font-semibold">¥{value.toFixed(2)}</span>
      ),
    },
    {
      title: '总金额',
      width: 120,
      render: (_, record) => (
        <span className="font-semibold">
          ¥{(record.cost * record.quantity).toLocaleString()}
        </span>
      ),
    },
    {
      title: '委托时间',
      dataIndex: 'time',
      width: 140,
      render: (value) => (
        <div className="text-gray-600">
          {new Date(value).toLocaleDateString()}
          <br />
          <span className="text-sm">
            {new Date(value).toLocaleTimeString()}
          </span>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_, record) => (
        <Popconfirm
          title="确定删除这条委托记录吗？"
          description="删除后相关持仓数据也会相应调整"
          onConfirm={() =>
            handleDeleteOrder(record.id, {
              code: record.code,
              name: record.name,
              time: record.time,
              cost: record.cost,
              quantity: record.quantity,
              action: record.action,
            })
          }
          okText="确定"
          cancelText="取消"
          okType="danger"
        >
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
            className="text-red-500 hover:text-red-700"
          >
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      {/* 表格头部 */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">委托记录</h3>
          <p className="text-gray-600 text-sm">共 {pagination.total} 条记录</p>
        </div>
        <Tooltip title="刷新数据">
          <Button
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            className="flex items-center"
          >
            刷新
          </Button>
        </Tooltip>
      </div>

      {/* 表格 */}
      <Table<OrderItem>
        columns={columns}
        dataSource={orderList}
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
        rowClassName={(record) =>
          record.action === '0'
            ? 'bg-red-50 hover:bg-red-100'
            : 'bg-green-50 hover:bg-green-100'
        }
        rowKey="id"
        scroll={{ x: 800 }}
        className="shadow-sm"
      />
    </div>
  );
}
