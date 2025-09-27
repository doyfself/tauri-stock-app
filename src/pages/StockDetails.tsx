import { useParams } from 'react-router-dom';
import StockKlineChartMain from '@/components/charts/StockKlineChartMain';
import SelectionList from '@/components/selection/SelectionList';
import StockKlineChartDetails from '@/components/charts/StockKlineChartDetails';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useState } from 'react';

export default function StockDetails() {
  const [width, setWidth] = useState(0);
  const fn = async () => {
    const res = await getCurrentWindow().innerSize();
    const width = res.width / 2 - (80 + 200 + 320);
    setWidth(width);
  };
  fn();
  // 获取路由参数id
  const { id } = useParams<{ id: string }>();
  return (
    <div className="flex h-full">
      <SelectionList code={id as string} />
      <div className="flex-1">
        {width > 0 && (
          <StockKlineChartMain code={id as string} width={width} height={300} />
        )}
      </div>
      <StockKlineChartDetails code={id as string} onlyShow={false} />
    </div>
  );
}
