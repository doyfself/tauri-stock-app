import {
  Input,
  Button,
  Modal,
  Form,
  type FormProps,
  DatePicker,
  Space,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs'; // ✅ 替换 moment
import { useEffect, useState } from 'react';
import HeaderSearch from '@/components/common/HeaderSearch';
import RichTextEditor from '@/components/common/RichTextEditor';

export interface RecordItem {
  id?: number;
  code: string;
  title: string;
  date: string; // 注意：这里 date 是时间戳字符串（如 "1717027200000"）
  description: string;
}

interface SelfReflectModalProps {
  modalOpen: boolean;
  setModalOpen: (val: boolean) => void;
  initList: () => void;
  initData: RecordItem | null;
  onFinish: (req: RecordItem) => Promise<void>;
}

type FieldType = {
  title: string;
  stock: {
    code: string;
    name: string;
  };
  date: Dayjs; // ✅ 类型改为 Dayjs
  description: string;
};

const AddRecordModal = ({
  modalOpen,
  setModalOpen,
  initList,
  initData,
  onFinish,
}: SelfReflectModalProps) => {
  const [form] = Form.useForm<FieldType>();
  const [submitting, setSubmitting] = useState(false);

  const handleFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    setSubmitting(true);
    try {
      // ✅ 使用 dayjs 设置 15:00:00 并转时间戳
      const timestamp = values.date
        .hour(15)
        .minute(0)
        .second(0)
        .millisecond(0)
        .valueOf()
        .toString();

      const req: RecordItem = {
        code: values.stock.code || '',
        title: values.title,
        date: timestamp, // 存储为时间戳字符串
        description: values.description,
      };

      if (initData?.id) {
        req.id = initData.id;
      }

      await onFinish(req);
      initList();
      setModalOpen(false);
      form.resetFields();
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (modalOpen && initData) {
      // ✅ 将时间戳字符串转换为 Dayjs 对象用于表单回显
      const dateValue = dayjs(Number(initData.date)); // 转成毫秒数再构造

      const fields: Partial<FieldType> = {
        title: initData.title,
        stock: {
          code: initData.code,
          name: '', // HeaderSearch 可能只用 code
        },
        date: dateValue,
        description: initData.description,
      };

      // 异步设置字段值（避免 Warning: Cannot update a component while rendering）
      setTimeout(() => {
        form.setFieldsValue(fields);
      }, 0);
    } else if (modalOpen) {
      form.resetFields();
    }
  }, [modalOpen, initData, form]);

  const handleCancel = () => {
    form.resetFields();
    setModalOpen(false);
  };

  const modalTitle = initData ? '编辑' : '新增';

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
        name="selfReflectForm"
        labelCol={{ span: 4 }}
        wrapperCol={{ span: 20 }}
        onFinish={handleFinish}
        initialValues={{
          date: dayjs(), // 默认今天
        }}
      >
        <Form.Item<FieldType>
          label="标题"
          name="title"
          rules={[{ required: true, message: '请输入标题!' }]}
        >
          <Input placeholder="请输入反省标题" />
        </Form.Item>

        <Form.Item<FieldType>
          label="股票代码"
          name="stock"
          rules={[{ required: true, message: '请选择股票!' }]}
        >
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
          <RichTextEditor key={modalOpen ? 'open' : 'closed'} />
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

export default AddRecordModal;
