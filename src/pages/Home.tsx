import { Button, message, Input } from 'antd';
import { invoke } from '@tauri-apps/api/core';
import { DownloadOutlined } from '@ant-design/icons';
import { useState } from 'react';
invoke('search_stocks_by_keyword', {
  keyword: '茅台', // 仅需传递关键词
}).then((res) => {
  console.log(res);
});
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
      <UpdateCookie />
    </div>
  );
}

function UpdateCookie() {
  const [cookie, setCookie] = useState('');
  const submitCookie = () => {
    // 提交新的 Cookie 值到后端
    invoke('save_xueqiu_cookie', { cookie })
      .then(() => {
        message.success('Cookie 更新成功');
      })
      .catch((error) => {
        message.error(
          `更新失败: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
  };
  return (
    <>
      <Input.TextArea
        rows={4}
        placeholder="请输入新的 Cookie 值"
        onChange={(e) => setCookie(e.target.value)}
      />
      <Button
        type="primary"
        style={{ marginTop: '10px' }}
        onClick={submitCookie}
      >
        更新 Cookie
      </Button>
    </>
  );
}
