import { useState } from 'react';
import {
  Button,
  Modal,
  Upload,
  Progress,
  Alert,
  Typography,
  Collapse,
} from 'antd';
import { InboxOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { importDatabaseApi } from '@/apis/api';

const { Dragger } = Upload;
const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface DatabaseImportProps {
  open: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export default function DatabaseImport({
  open,
  onClose,
  onImportSuccess,
}: DatabaseImportProps) {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    details?: string;
  } | null>(null);

  const handleImport = async (file: File) => {
    setImporting(true);
    setProgress(0);
    setImportResult(null);

    try {
      // 检查文件类型
      if (!file.name.toLowerCase().endsWith('.zip')) {
        throw new Error('请上传ZIP格式的压缩包');
      }

      // 读取文件为 ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // 调用后端导入命令
      const result = await importDatabaseApi(uint8Array);

      setImportResult({
        type: 'success',
        message: `数据库导入完成`,
        details: result,
      });
      setProgress(100);

      // 延迟执行成功回调，让用户看到成功消息
      setTimeout(() => {
        onImportSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('导入失败:', error);
      setImportResult({
        type: 'error',
        message: `数据库导入失败`,
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setImportResult(null);
    setProgress(0);
    onClose();
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.zip',
    showUploadList: false,
    beforeUpload: (file: File) => {
      handleImport(file);
      return false; // 阻止默认上传行为
    },
  };

  return (
    <Modal
      title="导入数据库"
      open={open}
      onCancel={handleClose}
      footer={[
        <Button key="close" onClick={handleClose}>
          关闭
        </Button>,
      ]}
      width={700}
    >
      <div style={{ padding: '20px 0' }}>
        <Dragger {...uploadProps} disabled={importing}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽数据库备份文件到此区域</p>
          <p className="ant-upload-hint">请上传包含数据库文件的ZIP压缩包</p>
        </Dragger>

        {importing && (
          <div style={{ marginTop: 20 }}>
            <Progress percent={progress} status="active" />
            <p style={{ textAlign: 'center', marginTop: 8, color: '#666' }}>
              正在导入数据库，请稍候...
            </p>
          </div>
        )}

        {/* 显示导入结果 */}
        {importResult && (
          <div style={{ marginTop: 20 }}>
            <Alert
              message={importResult.message}
              description={
                importResult.details && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {importResult.details}
                  </Text>
                )
              }
              type={importResult.type}
              showIcon
              closable
              onClose={() => setImportResult(null)}
            />
          </div>
        )}

        <Collapse
          style={{ marginTop: 20 }}
          expandIcon={({ isActive }) => (
            <QuestionCircleOutlined rotate={isActive ? 90 : 0} />
          )}
          defaultActiveKey={['1']}
        >
          <Panel header="导入说明和常见问题" key="1">
            <div style={{ padding: '10px 0' }}>
              <Paragraph>
                <strong>导入说明：</strong>
              </Paragraph>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>请确保备份文件包含完整的数据库文件</li>
                <li>导入过程将覆盖现有的数据</li>
                <li>建议在导入前备份当前数据</li>
                <li>支持子目录结构（如 databases/ 目录）</li>
                <li>自动忽略 macOS 系统文件</li>
              </ul>

              <Paragraph style={{ marginTop: '15px' }}>
                <strong>需要的数据库文件：</strong>
              </Paragraph>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>app_config.db</li>
                <li>all_stocks.db</li>
                <li>my_selection.db</li>
                <li>stock_review.db</li>
                <li>self_reflect.db</li>
                <li>market_analysis.db</li>
                <li>stock_lines.db</li>
                <li>holdings.db</li>
                <li>orders.db</li>
              </ul>

              <Paragraph style={{ marginTop: '15px' }}>
                <strong>支持的目录结构：</strong>
              </Paragraph>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>文件在根目录：app_config.db</li>
                <li>文件在子目录：databases/app_config.db</li>
              </ul>
            </div>
          </Panel>
        </Collapse>
      </div>
    </Modal>
  );
}
