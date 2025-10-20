import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { addStockCodePrefix } from '@/utils/common';
import { getSingleSelfReflectApi } from '@/apis/api';
import { SelfReflectItem } from '@/types/response';
import StockKlineChartMain from '@/components/charts/StockKlineChartMain';
import { LeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SelfReflectModal } from '@/pages/SelfReflect';

export default function SelfReflectDetails() {
  // 获取路由参数id
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SelfReflectItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const initData = async () => {
    if (id) {
      const res = await getSingleSelfReflectApi(+id);
      console.log(res);
      setData(res.data);
    }
  };
  useEffect(() => {
    initData();
  }, [id]);
  const editReview = () => {
    setModalOpen(true);
  };
  if (data) {
    return (
      <div className="flex justify-center text-[16px] text-[#fff]">
        <div className="w-[800px] flex flex-col gap-[10px] pt-[20px]">
          <h2 className="text-[20px] text-[#e41414]">{data.title}</h2>
          {data.code && (
            <StockKlineChartMain
              code={addStockCodePrefix(data.code)}
              width={800}
              height={300}
              timestamp={data.date}
              onlyShow={true}
            />
          )}
          <p
            className="text-[16px]"
            dangerouslySetInnerHTML={{ __html: data.description }}
          ></p>
          <div className="flex">
            <Button
              type="link"
              icon={<LeftOutlined />}
              onClick={() => navigate(-1)}
            >
              返回
            </Button>
            <Button type="link" onClick={editReview}>
              编辑
            </Button>
          </div>

          <SelfReflectModal
            modalOpen={modalOpen}
            setModalOpen={setModalOpen}
            initList={initData}
            initData={data}
          />
        </div>
      </div>
    );
  }
}
