import { SettingOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Dropdown, Input, Modal } from 'antd';
import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderSearch, { StockValue } from './HeaderSearch';
import DatabaseImport from '@/components/ImportDbData';

export default function HeaderNav() {
  const navigate = useNavigate();
  const [selectedStock, setSelectedStock] = useState<StockValue>({
    code: '',
    name: '',
  });
  const handleStockChange = (stock: StockValue) => {
    setSelectedStock(stock);
    // 导航到 K 线页面
    navigate(`/kline/${stock.code}`);
  };
  return (
    <div className="h-[40px] bg-[#30343A] w-[100vw] flex justify-center items-center absolute">
      <HeaderSearch
        value={selectedStock}
        onChange={handleStockChange}
        showInHeader={true}
      />
      <RightDropdown />
    </div>
  );
}

function RightDropdown() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const items: MenuProps['items'] = [
    {
      key: '1',
      label: <a onClick={() => setIsModalOpen(true)}>更新cookie</a>,
    },
    {
      key: '2',
      label: <a onClick={() => setImportModalOpen(true)}>导入数据库</a>,
    },
  ];
  return (
    <>
      <Dropdown menu={{ items }}>
        <SettingOutlined className="text-[#fff] absolute right-[20px]" />
      </Dropdown>
      <UpdateCookie isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />
      <DatabaseImport
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={() => {}}
      />
    </>
  );
}

function UpdateCookie({
  isModalOpen,
  setIsModalOpen,
}: {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}) {
  const [cookie, setCookie] = useState('');
  const navigate = useNavigate();
  const [successText, setSuccessText] = useState('');
  const handleOk = () => {
    // 提交新的 Cookie 值到后端
    invoke('save_xueqiu_cookie', { cookie })
      .then(() => {
        setIsModalOpen(false);
        navigate(0);
      })
      .catch(() => {
        setSuccessText('更新失败');
      });
  };
  return (
    <Modal
      title="更新cookie"
      open={isModalOpen}
      onOk={handleOk}
      onCancel={() => setIsModalOpen(false)}
    >
      <Input.TextArea
        rows={4}
        placeholder="请输入新的 Cookie 值"
        onChange={(e) => setCookie(e.target.value)}
      />
      <span>{successText}</span>
    </Modal>
  );
}
