import { useParams } from 'react-router-dom';
import { DatePicker } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import StockKlineChartMain from '@/components/charts/StockKlineChartMain';
import SelectionList from '@/components/selection/SelectionList';
import StockKlineChartDetails from '@/components/charts/StockKlineChartDetails';
import { useWindowSizeStore } from '@/stores/userStore';
import { useState, useEffect } from 'react';

// 可选：加载中文和自定义格式（按需）
import 'dayjs/locale/zh-cn';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);
dayjs.locale('zh-cn');

export default function StockDetails() {
  const { width: windowWidth, height: windowHeight } = useWindowSizeStore();
  const width = windowWidth - (200 + 320);
  const height = windowHeight - 40 - 27 - 25 - 20 - 40;
  const { id, date: routeDate } = useParams<{ id: string; date?: string }>();

  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [timestamp, setTimestamp] = useState<string>('');

  useEffect(() => {
    // 验证 routeDate 是否是合法 YYYY-MM-DD 格式
    const isValidDateStr = (str?: string): str is string => {
      return !!str && /^\d{4}-\d{2}-\d{2}$/.test(str);
    };

    let finalDate: Dayjs;

    if (isValidDateStr(routeDate)) {
      // 严格解析
      finalDate = dayjs(routeDate, 'YYYY-MM-DD', true);
      if (!finalDate.isValid()) {
        console.warn('Invalid date from route, fallback to today:', routeDate);
        finalDate = dayjs().startOf('day');
      }
    } else {
      finalDate = dayjs().startOf('day');
    }

    setSelectedDate(finalDate);
    // 设置 15:00:00 的时间戳
    const t = finalDate.hour(15).minute(0).second(0).valueOf().toString();
    setTimestamp(t);
  }, [routeDate]);

  const handleDateChange = (date: Dayjs | null) => {
    if (date && date.isValid()) {
      setSelectedDate(date);
      const t = date.hour(15).minute(0).second(0).valueOf().toString();
      setTimestamp(t);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 overflow-hidden">
        <SelectionList code={id as string} />
        <div className="flex-1 overflow-hidden">
          {/* 日期选择器区域 */}
          <div className="h-[40px] items-center flex justify-end pr-[10px]">
            <DatePicker
              value={selectedDate}
              onChange={handleDateChange}
              format="YYYY-MM-DD"
              allowClear={false}
              size="small"
            />
          </div>
          {width > 0 && timestamp && (
            <StockKlineChartMain
              code={id as string}
              width={width}
              height={height}
              timestamp={timestamp}
            />
          )}
        </div>
        <StockKlineChartDetails code={id as string} onlyShow={false} />
      </div>
    </div>
  );
}
