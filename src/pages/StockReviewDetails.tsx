import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { addStockCodePrefix } from '@/utils/common';
import { getSingleStockReviewApi, type StockReviewItem } from '@/apis/api';
import StockKlineChartMain from '@/components/charts/StockKlineChartMain';
export default function StockReviewDetails() {
  // 获取路由参数id
  const { id, type } = useParams<{ id: string; type: string }>();
  const [data, setData] = useState<StockReviewItem | null>(null);
  useEffect(() => {
    if (id && type) {
      getSingleStockReviewApi(type, id).then((res) => {
        if (res.success) {
          setData(res.data as StockReviewItem);
        }
      });
    }
  }, [type, id]);
  if (data) {
    return (
      <div className="pv-details-container">
        <h2>
          {data.title}({data.code})
        </h2>
        <StockKlineChartMain
          code={addStockCodePrefix(data.code)}
          width={800}
          height={300}
          timestamp={data.date}
          limit={50}
        />
        <p dangerouslySetInnerHTML={{ __html: data.description }}></p>
      </div>
    );
  }
}
