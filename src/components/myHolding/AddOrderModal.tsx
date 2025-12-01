import { useState } from 'react';
import {
  Modal,
  Form,
  DatePicker,
  InputNumber,
  Radio,
  Button,
  Space,
  Card,
} from 'antd';
import type { FormProps } from 'antd';
import { handleOrderWithHolding, type FieldType } from './HoldingLogic';
import HeaderSearch from '@/components/common/HeaderSearch';
import type { HoldingItem } from '@/types/response';

interface AddOrderModalProps {
  modalOpen: boolean;
  setModalOpen: (val: boolean) => void;
  onOrderSuccess: () => void;
  holdingList: HoldingItem[];
}

export default function AddOrderModal({
  modalOpen,
  setModalOpen,
  onOrderSuccess,
}: AddOrderModalProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [actionType, setActionType] = useState<'1' | '0'>('1');

  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    setSubmitting(true);
    try {
      const success = await handleOrderWithHolding({
        values,
        onSuccess: () => {
          form.resetFields();
          onOrderSuccess();
          setModalOpen(false);
        },
      });

      if (!success) {
        return;
      }
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <div className="text-center">
          <div className="text-xl font-bold text-gray-800">新建委托</div>
          <div className="text-gray-600 text-sm mt-1">请填写委托信息</div>
        </div>
      }
      footer={null}
      open={modalOpen}
      onCancel={() => setModalOpen(false)}
      destroyOnClose
      width={480}
      className="rounded-lg"
    >
      <Card className="shadow-none">
        <Form
          form={form}
          name="order"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          initialValues={{ action: '1' }}
        >
          <Form.Item<FieldType>
            label="选择股票"
            name="stock"
            rules={[{ required: true, message: '请选择股票!' }]}
          >
            <HeaderSearch />
          </Form.Item>

          <Form.Item<FieldType>
            label="委托日期"
            name="time"
            rules={[{ required: true, message: '请选择委托日期!' }]}
          >
            <DatePicker
              format="YYYY-MM-DD"
              style={{ width: '100%' }}
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item<FieldType>
            label="操作类型"
            name="action"
            rules={[{ required: true, message: '请选择操作类型!' }]}
          >
            <Radio.Group
              onChange={(e) => setActionType(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button
                value="1"
                className={`px-6 ${actionType === '1' ? 'bg-green-500 text-white border-green-500' : ''}`}
              >
                买入
              </Radio.Button>
              <Radio.Button
                value="0"
                className={`px-6 ${actionType === '0' ? 'bg-red-500 text-white border-red-500' : ''}`}
              >
                卖出
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item<FieldType>
              label="委托价格"
              name="cost"
              rules={[{ required: true, message: '请输入委托价格!' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                precision={2}
                placeholder="0.00"
                addonBefore="¥"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item<FieldType>
              label="委托数量"
              name="quantity"
              rules={[{ required: true, message: '请输入委托数量!' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                precision={0}
                placeholder="100"
                addonAfter="股"
                className="rounded-lg"
              />
            </Form.Item>
          </div>

          <Form.Item className="mb-0 mt-6">
            <Space size="middle" className="w-full justify-center">
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                className="px-8 rounded-lg bg-blue-600 hover:bg-blue-700 border-blue-600"
              >
                提交委托
              </Button>
              <Button
                onClick={() => setModalOpen(false)}
                className="px-8 rounded-lg"
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </Modal>
  );
}
