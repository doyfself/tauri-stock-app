import { Input, Button } from 'antd';
import { getSelectionByCode, addSelectionApi } from '@/apis/api';
import { useEffect, useState } from 'react';
import type { SelectionItem } from '@/types/response';

export default function StockRemark({
  code,
  onRemarkUpdate,
}: {
  code: string;
  onRemarkUpdate?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [remark, setRemark] = useState('');
  const [currentSelection, setCurrentSelection] =
    useState<SelectionItem | null>(null);

  // 组件挂载时和code变化时获取自选信息
  useEffect(() => {
    const fetchSelectionData = async () => {
      if (!code) return;
      const res = await getSelectionByCode(code);
      if (res.data) {
        setCurrentSelection(res.data);
        setRemark(res.data.remark || '');
      }
    };

    fetchSelectionData();
  }, [code]);

  const handleEdit = async () => {
    // 进入编辑模式时，再次获取最新的自选信息
    if (!code) return;
    const res = await getSelectionByCode(code);
    if (res.data) {
      setCurrentSelection(res.data);
      setRemark(res.data.remark || '');
      setIsEditing(true);
    }
  };

  const onFinish = async () => {
    if (!currentSelection) return;

    try {
      // 保存前再次获取最新数据，确保使用最新的自选信息
      const latestRes = await getSelectionByCode(code);
      if (!latestRes.data) {
        console.error('自选信息不存在，无法更新备注');
        return;
      }

      const selection = {
        ...latestRes.data, // 使用最新的自选信息
        remark,
      } as SelectionItem;

      const res = await addSelectionApi(selection);
      if (res.success) {
        setIsEditing(false);
        // 更新本地状态
        setCurrentSelection(selection);
        // 通知父组件更新
        if (onRemarkUpdate) onRemarkUpdate();
      } else {
        console.error('保存备注失败');
      }
    } catch (error) {
      console.error('保存备注时发生错误:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // 取消时恢复原来的备注
    setRemark(currentSelection?.remark || '');
  };

  return (
    <div className="mt-[20px]">
      <Input.TextArea
        rows={5}
        disabled={!isEditing}
        style={{
          color: 'red',
          fontSize: '13px',
        }}
        value={remark}
        onChange={(e) => setRemark(e.target.value)}
      />
      {!isEditing && (
        <Button type="link" onClick={handleEdit}>
          备注
        </Button>
      )}
      {isEditing && (
        <div className="flex gap-[10px] mt-[10px]">
          <Button type="default" onClick={handleCancel} size="small">
            取消
          </Button>
          <Button type="primary" onClick={onFinish} size="small">
            完成
          </Button>
        </div>
      )}
    </div>
  );
}
