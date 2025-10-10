import { useParams } from 'react-router-dom';
import StockKlineChartMain from '@/components/charts/StockKlineChartMain';
import SelectionList from '@/components/selection/SelectionList';
import StockKlineChartDetails from '@/components/charts/StockKlineChartDetails';
import { useWindowSizeStore } from '@/stores/userStore';

export default function StockDetails() {
  const { width: windowWidth, height: windowHeight } = useWindowSizeStore();
  const width = windowWidth - (200 + 320);
  const height = windowHeight - 40 - 27 - 25 - 20;
  const { id } = useParams<{ id: string }>();
  return (
    <div className="flex h-full">
      <SelectionList code={id as string} />
      <div className="flex-1">
        {width > 0 && (
          <StockKlineChartMain
            code={id as string}
            width={width}
            height={height}
          />
        )}
      </div>
      <StockKlineChartDetails code={id as string} onlyShow={false} />
    </div>
  );
}
