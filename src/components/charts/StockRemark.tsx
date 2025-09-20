import { Input, Button } from 'antd';
import { getSelectionRemarkApi, addSelectionApi } from '@/apis/api';
import { useEffect, useState } from 'react';
export default function StockRemark({ code }: { code: string }) {
  useEffect(() => {
    getSelectionRemarkApi(code).then((res) => {
      if (res.data) {
        setRemark(res.data.remark);
      }
    });
  }, [code]);
  const [isEditing, setIsEditing] = useState(false);
  const [remark, setRemark] = useState('');
  const onFinish = () => {
    addSelectionApi(code, '', '', remark).then((res) => {
      if (res.success) {
        setIsEditing(false);
      }
    });
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
