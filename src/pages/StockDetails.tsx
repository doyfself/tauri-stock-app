import { useParams } from 'react-router-dom';
import StockKlineChartMain from '@/components/charts/StockKlineChartMain';
import SelectionList from '@/components/selection/SelectionList';

export default function StockDetails() {
  // 获取路由参数id
  const { id } = useParams<{ id: string }>();
  return (
    <div className="flex h100p">
      <SelectionList code={id as string} />
      <StockKlineChartMain code={id as string} width={1000} height={300} />
    </div>
  );
}
