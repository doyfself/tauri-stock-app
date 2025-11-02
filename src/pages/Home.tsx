import { Button, message, Card, Statistic, Row, Col, Tag, Space } from 'antd';
import { invoke } from '@tauri-apps/api/core';
import {
  DownloadOutlined,
  StockOutlined,
  DatabaseOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { useLoadingStore } from '@/stores/userStore';
import { useState } from 'react';

export default function Home() {
  const [crawlResult, setCrawlResult] = useState<{
    total_crawled: number;
    total_saved: number;
    total_cleared?: number;
  } | null>(null);

  const { showLoading, hideLoading, setLoadingText } = useLoadingStore();

  const handleCrawlStocks = async () => {
    try {
      // 显示全局 Loading
      showLoading('正在连接股票数据源...');

      // 调用爬虫命令
      const result = await invoke<{
        success: boolean;
        message: string;
        total_crawled: number;
        total_saved: number;
        total_cleared?: number;
      }>('crawl_and_save_stocks');

      console.log(result);

      if (result.success) {
        // 更新加载文字并延迟隐藏
        setLoadingText('数据爬取完成！');
        setTimeout(() => {
          hideLoading();
          message.success(result.message);
        }, 1000);

        setCrawlResult({
          total_crawled: result.total_crawled,
          total_saved: result.total_saved,
          total_cleared: result.total_cleared,
        });
      } else {
        hideLoading();
        message.error(result.message);
      }
    } catch (error) {
      hideLoading();
      message.error(
        `爬取失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-[16px]">
      <div className="max-w-6xl mx-auto">
        {/* 头部标题区域 */}
        <div className="text-center mb-[32px]">
          <h1 className="text-[#fff] text-3xl font-bold mb-[16px]">
            股票数据管理
          </h1>
          <p className="text-[#ccc] text-lg max-w-2xl mx-auto">
            一键获取最新的A股市场数据，包括股票代码、名称等信息，为您的投资分析提供数据支持
          </p>
        </div>

        <Row gutter={[24, 24]}>
          {/* 左侧操作卡片 */}
          <Col xs={24} lg={12}>
            <Card
              className="bg-gray-800 border-gray-700 h-full"
              bodyStyle={{ padding: '32px' }}
            >
              <div className="text-center mb-[24px]">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-[16px]">
                  <RocketOutlined className="text-white text-2xl" />
                </div>
                <h2 className="text-[#fff] text-xl font-semibold mb-[8px]">
                  数据爬取
                </h2>
                <p className="text-[#999]">获取最新的A股股票数据</p>
              </div>

              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleCrawlStocks}
                size="large"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 border-none hover:from-blue-700 hover:to-purple-700 text-base font-semibold rounded-xl shadow-lg transition-all duration-300"
              >
                开始爬取 A 股数据
              </Button>

              {/* 功能说明 */}
              <div className="mt-[24px] p-[16px] bg-gray-700/50 rounded-lg">
                <Space direction="vertical" size="small" className="w-full">
                  <div className="flex items-center text-[#ccc] text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-[12px]"></div>
                    <span>自动获取最新股票代码和名称</span>
                  </div>
                  <div className="flex items-center text-[#ccc] text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-[12px]"></div>
                    <span>数据自动保存到本地数据库</span>
                  </div>
                  <div className="flex items-center text-[#ccc] text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-[12px]"></div>
                    <span>覆盖更新，确保数据最新</span>
                  </div>
                </Space>
              </div>
            </Card>
          </Col>

          {/* 右侧统计卡片 */}
          <Col xs={24} lg={12}>
            <Card
              className="bg-gray-800 border-gray-700 h-full"
              bodyStyle={{ padding: '32px' }}
            >
              <h3 className="text-[#fff] text-lg font-semibold mb-[24px] flex items-center">
                <DatabaseOutlined className="mr-[8px] text-blue-400" />
                数据统计
              </h3>

              {crawlResult ? (
                <Row gutter={[16, 16]}>
                  <Col xs={8}>
                    <Statistic
                      title={<span className="text-[#ccc]">爬取总数</span>}
                      value={crawlResult.total_crawled}
                      valueStyle={{ color: '#3b82f6' }}
                      prefix={<StockOutlined />}
                      className="text-center"
                    />
                  </Col>
                  <Col xs={8}>
                    <Statistic
                      title={<span className="text-[#ccc]">保存数量</span>}
                      value={crawlResult.total_saved}
                      valueStyle={{ color: '#10b981' }}
                      prefix={<DatabaseOutlined />}
                      className="text-center"
                    />
                  </Col>
                  {crawlResult.total_cleared !== undefined && (
                    <Col xs={8}>
                      <Statistic
                        title={<span className="text-[#ccc]">清理数量</span>}
                        value={crawlResult.total_cleared}
                        valueStyle={{ color: '#ef4444' }}
                        prefix={<DownloadOutlined />}
                        className="text-center"
                      />
                    </Col>
                  )}

                  {/* 状态标签 */}
                  <Col xs={24}>
                    <div className="text-center mt-[16px]">
                      <Tag
                        color="green"
                        className="text-sm py-[4px] px-[12px] border-none bg-green-500/20 text-green-300"
                      >
                        数据同步完成
                      </Tag>
                    </div>
                  </Col>
                </Row>
              ) : (
                <div className="text-center py-[32px]">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-[16px]">
                    <StockOutlined className="text-gray-400 text-xl" />
                  </div>
                  <p className="text-[#999]">暂无数据</p>
                  <p className="text-[#666] text-sm mt-[4px]">
                    点击左侧按钮开始爬取数据
                  </p>
                </div>
              )}

              {/* 使用说明 */}
              <div className="mt-[24px] pt-[16px] border-t border-gray-600">
                <h4 className="text-[#fff] text-sm font-medium mb-[12px]">
                  使用提示
                </h4>
                <Space direction="vertical" size="small" className="w-full">
                  <div className="text-[#999] text-xs">
                    • 建议在网络良好的环境下操作
                  </div>
                  <div className="text-[#999] text-xs">
                    • 爬取过程可能需要几分钟时间
                  </div>
                  <div className="text-[#999] text-xs">
                    • 数据会自动覆盖更新，无需手动清理
                  </div>
                </Space>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 底部信息 */}
        <div className="text-center mt-[32px]">
          <p className="text-[#666] text-sm">
            数据来源：东方财富、新浪财经等公开数据接口
          </p>
          <p className="text-[#555] text-xs mt-[8px]">
            更新时间：{new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
