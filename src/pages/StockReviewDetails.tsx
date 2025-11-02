import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSingleStockReviewApi } from '@/apis/api';
import { StockReviewItem } from '@/types/response';
import StockAnalysisContent from '@/components/StockAnalysisContent';
import { ReflectSelectionModal } from '@/pages/StockReview';
import { message } from 'antd';

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
    } catch (error) {
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

  return (
    <>
      <StockAnalysisContent data={data} loading={loading} onEdit={editReview} />

      {/* 弹窗保留在父组件中 */}
      <ReflectSelectionModal
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        type={type as string}
        initList={initData}
        initData={data}
      />
    </>
  );
}
