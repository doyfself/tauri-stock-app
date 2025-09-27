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
        <Button type="link" onClick={() => setIsEditing(true)}>
          备注
        </Button>
      )}
      {isEditing && (
        <div className="flex gap-[10px] mt-[10px]">
          <Button
            type="default"
            onClick={() => setIsEditing(false)}
            size="small"
          >
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
