import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSingleSelfReflectApi } from '@/apis/api';
import { SelfReflectItem } from '@/types/response';
import StockAnalysisContent from '@/components/myReview/StockAnalysisContent';
import { message } from 'antd';
import type { RecordItem } from '@/components/myReview/AddRecordModal';
import AddRecordModal from '@/components/myReview/AddRecordModal';
import { addSelfReflectApi } from '@/apis/api';

export default function SelfReflectDetails() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SelfReflectItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const initData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const res = await getSingleSelfReflectApi(+id);
      setData(res.data);
    } catch {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, [id]);

  const editReview = () => {
    setModalOpen(true);
  };

  const onFinish = async (req: RecordItem): Promise<void> => {
    await addSelfReflectApi({ ...req });
  };
  return (
    <>
      <StockAnalysisContent data={data} loading={loading} onEdit={editReview} />

      {/* 新增/编辑模态框 */}
      <AddRecordModal
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        initList={initData}
        initData={data}
        onFinish={onFinish}
      />
    </>
  );
}
