import {
  Input,
  Button,
  Modal,
  Form,
  type FormProps,
  DatePicker,
  Popconfirm,
  message,
  Card,
  Space,
  Spin,
} from 'antd';
import type { Moment } from 'moment';
import moment from 'moment';
import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  StockOutlined,
} from '@ant-design/icons';
import { formatDate } from '@/utils/common';
import {
  getStockReviewApi,
  addStockReviewApi,
  deleteStockReviewApi,
} from '@/apis/api';
import type { StockReviewItem, StockReviewListItem } from '@/types/response';
import HeaderSearch from '@/components/common/HeaderSearch';

const { Search } = Input;

export default function StockReview() {
  const { type } = useParams<{ type: string }>();
  const [modalOpen, setModalOpen] = useState(false);
  const [list, setList] = useState<StockReviewListItem[]>([]);
  const [showData, setShowData] = useState<StockReviewListItem[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [more, setMore] = useState(false);

  const pageTitle = type === 'position' ? '持仓三省' : '欲购参考';

  const initList = useCallback(async () => {
    if (!type) return;

    setLoading(true);
    try {
      const res = await getStockReviewApi(type, keyword);
      if (res?.data) {
        setList(res.data);
        setShowData(res.data.slice(0, 10));
        setMore(res.data.length > 10);
      }
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [type, keyword]);

  useEffect(() => {
    initList();
  }, [initList]);

  const onSearch = (value: string) => {
    setKeyword(value);
  };

  const deleteThis = async (id: number) => {
    try {
      await deleteStockReviewApi(id);
      message.success('删除成功');
      initList();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const addReview = () => {
    setModalOpen(true);
  };

  const loadMore = () => {
    setShowData(list);
    setMore(false);
  };

  return (
    <div className="h-full bg-gray-900 p-[16px]">
      <div className="max-w-4xl mx-auto">
        {/* 头部区域 */}
        <div className="flex justify-between items-center mb-[16px]">
          <div>
            <h1 className="text-[#fff] text-2xl font-bold mb-[4px]">
              {pageTitle}
            </h1>
            <p className="text-[#ccc] text-sm">记录您的投资思考与决策过程</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={addReview}>
            新增记录
          </Button>
        </div>

        {/* 搜索区域 */}
        <Card className="mb-[16px] bg-gray-800 border-gray-700">
          <Search
            placeholder="搜索股票代码、标题或内容..."
            allowClear
            enterButton={
              <Button type="primary" icon={<SearchOutlined />}>
                搜索
              </Button>
            }
            onSearch={onSearch}
          />
        </Card>

        {/* 内容列表 - 使用卡片布局替代列表 */}
        <Spin spinning={loading}>
          <div className="grid grid-cols-1 gap-3">
            {showData.map((item) => (
              <Card
                key={item.id}
                className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-colors cursor-pointer"
                bodyStyle={{ padding: '12px 16px' }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
                      <StockOutlined className="text-[#fff]" />
                    </div>
                    <Link
                      to={`/sr/${type}/${item.id}`}
                      className="text-[#fff] hover:text-blue-400 flex-1"
                    >
                      <div className="font-medium text-base">{item.title}</div>
                    </Link>
                  </div>
                  <Popconfirm
                    title="确认删除"
                    description="确定要删除这条记录吗？"
                    onConfirm={() => deleteThis(item.id)}
                    okText="确认"
                    cancelText="取消"
                    okType="danger"
                  >
                    <Button type="text" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
                </div>
              </Card>
            ))}
          </div>

          {showData.length === 0 && !loading && (
            <Card className="bg-gray-800 border-gray-700 text-center py-8">
              <div className="text-[#999]">暂无记录</div>
            </Card>
          )}

          {more && (
            <div className="text-center mt-4">
              <Button type="dashed" onClick={loadMore} className="w-full">
                加载更多记录
              </Button>
            </div>
          )}
        </Spin>

        {/* 新增/编辑模态框 */}
        <ReflectSelectionModal
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          type={type as string}
          initList={initList}
          initData={null}
        />
      </div>
    </div>
  );
}

interface ReflectSelectionModalProps {
  modalOpen: boolean;
  setModalOpen: (val: boolean) => void;
  type: string;
  initList: () => void;
  initData: StockReviewItem | null;
}

type FieldType = {
  title: string;
  stock: {
    code: string;
    name: string;
  };
  date: Moment;
  description: string;
};

export const ReflectSelectionModal = ({
  modalOpen,
  setModalOpen,
  type,
  initList,
  initData,
}: ReflectSelectionModalProps) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    setSubmitting(true);
    try {
      const date = new Date(values.date.format('YYYY-MM-DD') + ' 15:00:00')
        .getTime()
        .toString();
      const req = {
        type: type,
        code: values.stock.code,
        title: values.title,
        date: date,
        description: values.description,
        ...(initData && { id: initData.id }),
      };

      const res = await addStockReviewApi(req);
      if (res.data) {
        message.success(initData ? '更新成功' : '新增成功');
        initList();
        setModalOpen(false);
        form.resetFields();
      }
    } catch (error) {
      message.error(initData ? '更新失败' : '新增失败');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (modalOpen && initData) {
      const fields = {
        ...initData,
        date: moment(formatDate(initData.date, 'YYYY-MM-DD')),
      };
      form.setFieldsValue(fields);
    } else if (modalOpen) {
      form.resetFields();
    }
  }, [modalOpen, initData, form]);

  const handleCancel = () => {
    form.resetFields();
    setModalOpen(false);
  };

  const modalTitle = initData ? '编辑记录' : '新增投资记录';

  return (
    <Modal
      title={modalTitle}
      footer={null}
      open={modalOpen}
      onCancel={handleCancel}
      width={600}
    >
      <Form
        form={form}
        name="stockReviewForm"
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        onFinish={onFinish}
      >
        <Form.Item<FieldType>
          label="标题"
          name="title"
          rules={[
            { required: true, message: '请输入记录标题!' },
            { max: 50, message: '标题不能超过50个字符!' },
          ]}
        >
          <Input placeholder="请输入记录标题" />
        </Form.Item>

        <Form.Item<FieldType>
          label="股票"
          name="stock"
          rules={[{ required: true, message: '请输入股票代码!' }]}
        >
          <HeaderSearch />
        </Form.Item>

        <Form.Item<FieldType>
          label="日期"
          name="date"
          rules={[{ required: true, message: '请选择记录日期!' }]}
        >
          <DatePicker format="YYYY-MM-DD" className="w-full" />
        </Form.Item>

        <Form.Item<FieldType>
          label="详细内容"
          name="description"
          rules={[
            { required: true, message: '请输入详细分析内容!' },
            { min: 10, message: '内容至少10个字符!' },
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder="请输入您的投资分析、决策理由、风险控制等内容..."
            showCount
            maxLength={2000}
          />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 4, span: 20 }}>
          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {submitting ? '提交中...' : '确认提交'}
            </Button>
            <Button onClick={handleCancel} disabled={submitting}>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};
