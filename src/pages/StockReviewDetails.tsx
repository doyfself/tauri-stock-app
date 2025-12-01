import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSingleStockReviewApi } from '@/apis/api';
import { StockReviewItem } from '@/types/response';
import StockAnalysisContent from '@/components/myReview/StockAnalysisContent';
import { message } from 'antd';
import type { RecordItem } from '@/components/myReview/AddRecordModal';
import AddRecordModal from '@/components/myReview/AddRecordModal';
import { addStockReviewApi } from '@/apis/api';

export default function StockReviewDetails() {
  const { id, type } = useParams<{ id: string; type: string }>();
  const [data, setData] = useState<StockReviewItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const initData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const res = await getSingleStockReviewApi(+id);
      console.log(res);
      setData(res.data);
    } catch {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (req: RecordItem): Promise<void> => {
    await addStockReviewApi({ ...req, type: type as string });
  };

  useEffect(() => {
    initData();
  }, [id]);

  const editReview = () => {
    setModalOpen(true);
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
