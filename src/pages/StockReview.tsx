import {
  Input,
  Button,
  Modal,
  Form,
  type FormProps,
  DatePicker,
  message,
  List,
  Popconfirm,
} from 'antd';
import './StockReview.css';
import type { Moment } from 'moment';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import {
  getStockReviewApi,
  addStockReviewApi,
  deleteStockReviewApi,
} from '@/apis/api';
import type { StockReviewListItem } from '@/types/response';
export default function StockReview() {
  const { type } = useParams<{ type: string }>();
  const [modalOpen, setModalOpen] = useState(false);
  const [, setList] = useState<StockReviewListItem[]>([]);
  const [showData, setShowData] = useState<StockReviewListItem[]>([]);
  const [keyword, setKeyword] = useState('');
  const [more, setMore] = useState(false);
  const initList = async () => {
    if (type) {
      const res = await getStockReviewApi(type, keyword);
      if (res && res.data) {
        setList(res.data);
        setShowData(res.data);
        setMore(res.data.length > 10);
      }
    }
  };
  useEffect(() => {
    initList();
  }, [type, keyword]);
  const onSearch = (value: string) => {
    setKeyword(value);
  };
  const deleteThis = async (id: number) => {
    await deleteStockReviewApi(id);
    initList();
  };
  return (
    <div className="relative w100p h100p overflow-hidden">
      <Button
        type="primary"
        className="rs-add-button"
        onClick={() => setModalOpen(true)}
      >
        新增领悟
      </Button>
      <ReflectSelectionModal
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        type={type as string}
        initList={initList}
      />
      <div className="rs-search-area">
        <h1>{type === 'position' ? '持仓三省' : '欲购三省'}</h1>
        <Input.Search
          placeholder="输入问题"
          allowClear
          enterButton="Search"
          size="large"
          onSearch={onSearch}
        />
        <List
          size="large"
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
                  <a key="list-loadmore-edit">删除</a>
                </Popconfirm>,
              ]}
            >
              <Link to={`/sr/details/${item.id}`}>{item.title}</Link>
            </List.Item>
          )}
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
}
type FieldType = {
  title: string;
  code: string;
  date: Moment;
  description: string;
};
const ReflectSelectionModal = ({
  modalOpen,
  setModalOpen,
  type,
  initList,
}: ReflectSelectionModalProps) => {
  const [form] = Form.useForm();
  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    let date = values.date.format('YYYY-MM-DD') + ' 15:00:00';
    date = new Date(date).getTime().toString();
    const res = await addStockReviewApi(
      type,
      values.code,
      values.title,
      date,
      values.description,
    );
    if (res.data) {
      initList();
      setModalOpen(false);
      form.resetFields();
    }
  };
  return (
    <>
      <Modal
        title="新增感悟"
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

          <Form.Item<FieldType>
            label="股票代码"
            name="code"
            rules={[{ required: true, message: '请输入股票代码!' }]}
          >
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
