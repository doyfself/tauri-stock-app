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
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '@/utils/common';
import {
  getSelfReflectApi,
  addSelfReflectApi,
  deleteSelfReflectApi,
} from '@/apis/api';
import type { SelfReflectItem, SelfReflectListItem } from '@/types/response';
import HeaderSearch from '@/components/common/HeaderSearch';

export default function SelfReflect() {
  const [modalOpen, setModalOpen] = useState(false);
  const [list, setList] = useState<SelfReflectListItem[]>([]);
  const [showData, setShowData] = useState<SelfReflectListItem[]>([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const initList = async () => {
    setLoading(true);
    try {
      const res = await getSelfReflectApi();
      console.log(res);
      if (res && res.data) {
        setList(res.data);
        setShowData(res.data.slice(0, 10));
        setMore(res.data.length > 10);
      }
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initList();
  }, []);

  const deleteThis = async (id: number) => {
    try {
      await deleteSelfReflectApi(id);
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
    <div className="min-h-screen bg-gray-900 p-[16px]">
      <div className="max-w-4xl mx-auto">
        {/* 头部区域 */}
        <div className="flex justify-between items-center mb-[16px]">
          <div>
            <h1 className="text-[#fff] text-2xl font-bold mb-[4px]">
              操作反省
            </h1>
            <p className="text-[#ccc] text-sm">记录您的交易反思与经验总结</p>
          </div>
          <Button type="primary" onClick={addReview}>
            新增记录
          </Button>
        </div>

        {/* 内容列表 - 使用卡片布局 */}
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
                      <div className="text-[#fff] text-sm">📝</div>
                    </div>
                    <Link
                      to={`/reflect/${item.id}`}
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
                    <Button type="text" danger>
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
        <SelfReflectModal
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          initList={initList}
          initData={null}
        />
      </div>
    </div>
  );
}

interface SelfReflectModalProps {
  modalOpen: boolean;
  setModalOpen: (val: boolean) => void;
  initList: () => void;
  initData: SelfReflectItem | null;
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

export const SelfReflectModal = ({
  modalOpen,
  setModalOpen,
  initList,
  initData,
}: SelfReflectModalProps) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    setSubmitting(true);
    try {
      let date = values.date.format('YYYY-MM-DD') + ' 15:00:00';
      date = new Date(date).getTime().toString();
      const req = {
        code: values.stock.code || '',
        title: values.title,
        date: date,
        description: values.description,
      };

      if (initData) {
        Reflect.set(req, 'id', initData.id);
      }

      const res = await addSelfReflectApi(req);
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

  const modalTitle = initData ? '编辑记录' : '新增操作反省';

  return (
    <Modal
      title={modalTitle}
      footer={null}
      open={modalOpen}
      onCancel={handleCancel}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        name="selfReflectForm"
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        onFinish={onFinish}
      >
        <Form.Item<FieldType>
          label="标题"
          name="title"
          rules={[{ required: true, message: '请输入标题!' }]}
        >
          <Input placeholder="请输入反省标题" />
        </Form.Item>

        <Form.Item<FieldType> label="股票代码" name="stock">
          <HeaderSearch />
        </Form.Item>

        <Form.Item<FieldType>
          label="日期"
          name="date"
          rules={[{ required: true, message: '请选择日期!' }]}
        >
          <DatePicker format="YYYY-MM-DD" className="w-full" />
        </Form.Item>

        <Form.Item<FieldType>
          label="详细内容"
          name="description"
          rules={[{ required: true, message: '请输入详细解析!' }]}
        >
          <Input.TextArea
            rows={6}
            placeholder="请输入您的操作反省、经验总结、改进措施等内容..."
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
