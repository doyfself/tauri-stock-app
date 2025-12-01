import { Button, Popconfirm, Card, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getSelfReflectApi,
  addSelfReflectApi,
  deleteSelfReflectApi,
} from '@/apis/api';
import type { SelfReflectListItem } from '@/types/response';
import type { RecordItem } from '@/components/myReview/AddRecordModal';
import AddRecordModal from '@/components/myReview/AddRecordModal';

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
      if (res && res.data) {
        setList(res.data);
        setShowData(res.data.slice(0, 10));
        setMore(res.data.length > 10);
      }
    } finally {
      setLoading(false);
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

  const loadMore = () => {
    setShowData(list);
    setMore(false);
  };

  const onFinish = async (req: RecordItem): Promise<void> => {
    await addSelfReflectApi({ ...req });
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
                styles={{ body: { padding: '12px 16px' } }}
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
        <AddRecordModal
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          initList={initList}
          initData={null}
          onFinish={onFinish}
        />
      </div>
    </div>
  );
}
