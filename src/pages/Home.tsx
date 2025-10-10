import { Button, message, Input } from 'antd';
import { invoke } from '@tauri-apps/api/core';
import { DownloadOutlined } from '@ant-design/icons';
import { useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const handleCrawlStocks = async () => {
    setLoading(true);
    try {
      // 调用 Rust 的 crawl_and_save_stocks 命令
      const result = await invoke<{
        success: boolean;
        message: string;
        total_crawled: number;
        total_saved: number;
      }>('crawl_and_save_stocks');
      console.log(result);
      if (result.success) {
        message.success(result.message);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error(
        `爬取失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <Button
        type="primary"
        icon={<DownloadOutlined />}
        onClick={handleCrawlStocks}
        loading={loading}
        style={{ marginBottom: '20px' }}
      >
        爬取所有 A 股股票数据
      </Button>
    </div>
  );
}
