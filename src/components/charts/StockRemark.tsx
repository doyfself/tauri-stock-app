import { Input, Button } from 'antd';
import { getSelectionByCode, addSelectionApi } from '@/apis/api';
import { useEffect, useState } from 'react';
import type { SelectionItem } from '@/types/response';
export default function StockRemark({ code }: { code: string }) {
  const [currentSelection, setCurrentSelection] = useState<SelectionItem>();
  useEffect(() => {
    const fn = async () => {
      if (!code) return;
      const res = await getSelectionByCode(code);
      if (res.data) {
        setCurrentSelection(res.data);
        setRemark(res.data.remark);
      }
    };
    fn();
  }, [code]);
  const [isEditing, setIsEditing] = useState(false);
  const [remark, setRemark] = useState('');
  const onFinish = async () => {
    const res = await addSelectionApi({
      ...currentSelection,
      remark,
    } as SelectionItem);
    if (res.success) {
      setIsEditing(false);
    }
  };
  return (
    <div className="flex gap-10">
      <Input.TextArea
        rows={2}
        disabled={!isEditing}
        style={{
          color: 'red',
          fontSize: '16px',
        }}
        value={remark}
        onChange={(e) => setRemark(e.target.value)}
      />
      {!isEditing && (
        <Button type="link" onClick={() => setIsEditing(true)}>
          备注
        </Button>
      )}
      {isEditing && (
        <Button type="primary" onClick={onFinish}>
          完成
        </Button>
      )}
    </div>
  );
}
