import { useEffect, useState, useMemo } from 'react';
import { getAnalysisApi, addAnalysisApi } from '@/apis/api';
import {
  Input,
  Button,
  Select,
  DatePicker,
  Card,
  Tag,
  Space,
  message,
  Typography,
  List,
} from 'antd';
import {
  EditOutlined,
  CalendarOutlined,
  PlusOutlined,
  CloseOutlined,
  CheckOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import moment from 'moment';
import type { MarketAnalysisItem } from '@/types/response';
import StockKlineChartMain from '@/components/charts/StockKlineChartMain';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const marketsCodes = [
  {
    code: 'SH000001',
    name: '上证指数',
  },
  {
    code: 'SZ399001',
    name: '深证指数',
  },
  {
    code: 'SZ399006',
    name: '创业板',
  },
];

const StatusTag = ({ status }: { status: string }) => {
  const config = {
    看多: { color: '#ff4d4f', icon: <ArrowUpOutlined />, text: '看多' },
    看空: { color: '#52c41a', icon: <ArrowDownOutlined />, text: '看空' },
    观察: { color: '#faad14', icon: <EyeOutlined />, text: '观察' },
  }[status] || { color: '#d9d9d9', icon: <EyeOutlined />, text: '观察' };

  return (
    <Tag
      color={config.color}
      icon={config.icon}
      style={{
        margin: 0,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      {config.text}
    </Tag>
  );
};

export default function MarketAnalysis() {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('观察');
  const [analysisList, setAnalysisList] = useState<MarketAnalysisItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 缓存下午3点的时间戳
  const threePmTimestamp = useMemo(() => {
    const today = new Date();
    today.setHours(15, 0, 0, 0);
    return today.getTime().toString();
  }, []);

  const initData = async () => {
    setLoading(true);
    try {
      const res = await getAnalysisApi();
      if (res && res.data) {
        setAnalysisList(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  const handleComplete = async () => {
    if (!content.trim()) {
      message.warning('请输入分析内容');
      return;
    }
    if (!date) {
      message.warning('请选择日期');
      return;
    }

    await addAnalysisApi(date, content, status);
    message.success('添加分析成功');
    setIsEditing(false);
    setContent('');
    setDate('');
    setStatus('观察');
    initData();
  };

  const handleCancel = () => {
    setIsEditing(false);
    setContent('');
    setDate('');
    setStatus('观察');
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* 左侧：市场指数图表 */}
      <div className="w-800px flex-shrink-0 bg-white border-r border-gray-200 overflow-auto">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <BarChartOutlined className="text-blue-500 text-xl mr-3" />
            <Title level={3} className="!mb-0">
              市场指数走势
            </Title>
          </div>

          <div className="space-y-6">
            {marketsCodes.map((item) => (
              <Card
                key={`market-analysis-${item.code}`}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                <StockKlineChartMain
                  code={item.code}
                  width={730}
                  height={220}
                  timestamp={threePmTimestamp}
                  onlyShow={true}
                />
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧：分析记录和编辑区域 */}
      <div className="flex-1 flex flex-col min-w-400px">
        {isEditing ? (
          // 编辑模式
          <div className="h-full flex flex-col bg-white">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <Title level={4} className="!mb-0">
                新建分析
              </Title>
              <Button
                type="text"
                icon={<CloseOutlined />}
                onClick={handleCancel}
                size="small"
              />
            </div>

            <div className="flex-1 p-[10px] overflow-auto">
              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <label className="block text-[14px] text-[#fff] my-[5px]">
                    市场观点
                  </label>
                  <Select
                    value={status}
                    onChange={setStatus}
                    style={{ width: '100%' }}
                    size="large"
                  >
                    <Option value="观察">
                      <Space>
                        <EyeOutlined />
                        <span>观察</span>
                      </Space>
                    </Option>
                    <Option value="看多">
                      <Space>
                        <ArrowUpOutlined />
                        <span>看多</span>
                      </Space>
                    </Option>
                    <Option value="看空">
                      <Space>
                        <ArrowDownOutlined />
                        <span>看空</span>
                      </Space>
                    </Option>
                  </Select>
                </div>

                <div>
                  <label className="block text-[14px] text-[#fff] my-[5px]">
                    分析日期
                  </label>
                  <DatePicker
                    value={date ? moment(date) : null}
                    format="YYYY-MM-DD"
                    onChange={(_, dateString) => setDate(dateString as string)}
                    style={{ width: '100%' }}
                    size="large"
                    suffixIcon={<CalendarOutlined />}
                  />
                </div>

                <div>
                  <label className="block text-[14px] text-[#fff] my-[5px]">
                    分析内容
                  </label>
                  <TextArea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="请输入您的市场分析..."
                    rows={6}
                    style={{
                      fontSize: '14px',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div className="flex gap-[5px] justify-end pt-[4px]">
                  <Button onClick={handleCancel}>取消</Button>
                  <Button
                    type="primary"
                    onClick={handleComplete}
                    icon={<CheckOutlined />}
                  >
                    保存分析
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // 查看模式
          <div className="h-full flex flex-col bg-white">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <Title level={4} className="!mb-0">
                市场分析记录
              </Title>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsEditing(true)}
              >
                添加分析
              </Button>
            </div>

            <div className="flex-1 overflow-auto">
              {analysisList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
                  <EditOutlined className="text-4xl mb-4" />
                  <Text className="mb-2">暂无分析记录</Text>
                  <Text type="secondary" className="text-sm mb-4">
                    开始记录您的市场观点
                  </Text>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsEditing(true)}
                  >
                    开始分析
                  </Button>
                </div>
              ) : (
                <div className="p-4">
                  <List
                    dataSource={analysisList}
                    loading={loading}
                    renderItem={(item) => (
                      <List.Item className="!px-0 !py-3 border-b border-gray-100 last:border-b-0">
                        <Card
                          size="small"
                          className="w-full border-0 shadow-none"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <Text className="text-gray-600">{item.date}</Text>
                            <StatusTag status={item.status} />
                          </div>
                          <div className="text-gray-800 leading-relaxed">
                            {item.analysis}
                          </div>
                        </Card>
                      </List.Item>
                    )}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
