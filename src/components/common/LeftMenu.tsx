import { useLocation, useNavigate } from 'react-router-dom';
import logo from '@/assets/logo.svg';
import { useEffect, useState } from 'react';
const navList = [
  {
    title: '自选',
    url: '/kline/SH000001',
  },
  {
    title: '持仓三省',
    url: '/sr/position',
  },
  {
    title: '欲购参考',
    url: '/sr/want',
  },
  {
    title: '操作反省',
    url: '/reflect',
  },
  {
    title: '大盘分析',
    url: '/market',
  },
  {
    title: '我的持仓',
    url: '/holding',
  },
];
const includesArr = [
  '/kline',
  'sr/position',
  'sr/want',
  '/reflect',
  '/market',
  '/holding',
];
export default function LeftMenu() {
  const path = useLocation().pathname;
  const navigate = useNavigate();
  const [navIndex, setNavIndex] = useState<number>();
  useEffect(() => {
    const index = includesArr.findIndex((item) => path.includes(item));
    setNavIndex(index);
  }, [path]);
  return (
    <div className="w-[80px] bg-[#0F0F12] h-100p flex flex-col items-center gap-[10px] shrink-0">
      <img src={logo} />
      {navList.map((nav, index) => {
        return (
          <div
            key={nav.title}
            className="text-[#707B8F] cursor-pointer w-[40px] h-[60px] flex flex-wrap items-center hover:text-[#4294F7]"
            style={{
              color: index === navIndex ? '#4294F7' : '#707B8F',
            }}
            onClick={() => navigate(nav.url)}
          >
            {nav.title}
          </div>
        );
      })}
    </div>
  );
}
