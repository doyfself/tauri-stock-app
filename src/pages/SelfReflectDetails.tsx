import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getSingleSelfReflectApi } from '@/apis/api';
import { SelfReflectItem } from '@/types/response';
import StockAnalysisContent from '@/components/StockAnalysisContent';
import { SelfReflectModal } from '@/pages/SelfReflect';
import { message } from 'antd';

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
      <SelfReflectModal
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        initList={initData}
        initData={data}
      />
    </>
  );
}
