import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { addStockCodePrefix } from '@/utils/common';
import { getSingleStockReviewApi } from '@/apis/api';
import { StockReviewItem } from '@/types/response';
import StockKlineChartMain from '@/components/charts/StockKlineChartMain';
export default function StockReviewDetails() {
  // 获取路由参数id
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<StockReviewItem | null>(null);
  useEffect(() => {
    const fn = async () => {
      if (id) {
        const res = await getSingleStockReviewApi(+id);
        setData(res.data);
      }
    };
    fn();
  }, [id]);
  if (data) {
    return (
      <div className="pv-details-container">
        <h2 style={{ color: '#924c96' }}>{data.title}</h2>
        <StockKlineChartMain
          code={addStockCodePrefix(data.code)}
          width={800}
          height={300}
          timestamp={data.date}
          limit={50}
          onlyShow={true}
        />
        <p dangerouslySetInnerHTML={{ __html: data.description }}></p>
      </div>
    );
  }
}
