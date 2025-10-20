import {
  Input,
  Button,
  Modal,
  Form,
  type FormProps,
  DatePicker,
  List,
  Popconfirm,
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
export default function SelfReflect() {
  const [modalOpen, setModalOpen] = useState(false);
  const [, setList] = useState<SelfReflectListItem[]>([]);
  const [showData, setShowData] = useState<SelfReflectListItem[]>([]);
  const [more, setMore] = useState(false);
  const initList = async () => {
    const res = await getSelfReflectApi();
    console.log(res);
    if (res && res.data) {
      setList(res.data);
      setShowData(res.data);
      setMore(res.data.length > 10);
    }
  };
  useEffect(() => {
    initList();
  }, []);
  const deleteThis = async (id: number) => {
    await deleteSelfReflectApi(id);
    initList();
  };
  const addReview = () => {
    setModalOpen(true);
  };
  return (
    <div className="relative flex justify-center pt-[50px]">
      <Button
        type="primary"
        className="absolute top-[20px] right-[20px]"
        onClick={addReview}
      >
        新增
      </Button>
      <SelfReflectModal
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        initList={initList}
        initData={null}
      />
      <div className="w-1/2">
        <h1 className="text-[#fff] text-[32px]">操作反省</h1>
        <List
          footer={more ? <div>show more</div> : null}
          bordered
          dataSource={showData}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Popconfirm
                  title="确认删除"
                  description="Are you sure to delete this task?"
                  onConfirm={() => deleteThis(item.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <a key="list-delete">删除</a>
                </Popconfirm>,
              ]}
            >
              <Link to={`/reflect/${item.id}`}>{item.title}</Link>
            </List.Item>
          )}
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
  code: string;
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
  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    let date = values.date.format('YYYY-MM-DD') + ' 15:00:00';
    date = new Date(date).getTime().toString();
    const req = {
      code: values.code || '',
      title: values.title,
      date: date,
      description: values.description,
    };
    if (initData) {
      Reflect.set(req, 'id', initData.id);
    }
    const res = await addSelfReflectApi(req);
    if (res.data) {
      initList();
      setModalOpen(false);
      form.resetFields();
    }
  };
  useEffect(() => {
    if (modalOpen && initData) {
      const fields = {
        ...initData,
        date: moment(formatDate(initData.date, 'YYYY-MM-DD')),
      };
      form.setFieldsValue(fields);
    }
  }, [modalOpen, initData, form]);
  return (
    <>
      <Modal
        title="新增"
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
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入标题!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldType> label="股票代码" name="code">
            <Input />
          </Form.Item>
          <Form.Item<FieldType>
            label="日期"
            name="date"
            rules={[{ required: true, message: '请选择日期!' }]}
          >
            <DatePicker format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item<FieldType>
            label="详细"
            name="description"
            rules={[{ required: true, message: '请输入详细解析!' }]}
          >
            <Input.TextArea rows={10} />
          </Form.Item>

          <Form.Item label={null}>
            <Button type="primary" htmlType="submit">
              提交
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
