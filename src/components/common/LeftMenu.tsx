import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import logo from '@/assets/logo.svg';

// 导航配置数据
const NAV_CONFIG = [
  {
    title: '自选',
    url: '/kline/SH000001',
    icon: '⭐',
  },
  {
    title: '持仓三省',
    url: '/sr/position',
    icon: '📊',
  },
  {
    title: '欲购参考',
    url: '/sr/want',
    icon: '💡',
  },
  {
    title: '操作反省',
    url: '/reflect',
    icon: '🔄',
  },
  {
    title: '大盘分析',
    url: '/market',
    icon: '📈',
  },
  {
    title: '我的持仓',
    url: '/holding',
    icon: '💰',
  },
] as const;

// 路径匹配数组
const PATH_MATCHES = [
  '/kline',
  '/sr/position',
  '/sr/want',
  '/reflect',
  '/market',
  '/holding',
];

export default function LeftMenu() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState<number>(0);

  useEffect(() => {
    const index = PATH_MATCHES.findIndex((item) => pathname.includes(item));
    setActiveIndex(index >= 0 ? index : 0);
  }, [pathname]);

  return (
    <div className="w-[80px] bg-[#0F0F12] h-full flex flex-col items-center py-[24px] gap-[8px] shadow-xl border-r border-[#2A2A2E]">
      {/* Logo区域 - 增大尺寸 */}
      <div className="mb-[32px] p-[16px] bg-white rounded-[20px] shadow-lg hover:scale-105 transition-transform duration-200">
        <img
          src={logo}
          alt="应用Logo"
          className="w-[56px] h-[56px]" // 增大logo尺寸
        />
      </div>

      {/* 导航菜单 */}
      <nav className="flex flex-col items-center gap-[4px] w-full">
        {NAV_CONFIG.map((nav, index) => {
          const isActive = index === activeIndex;

          return (
            <button
              key={nav.title}
              className={`
                group relative w-[64px] h-[64px] flex flex-col items-center justify-center gap-[4px]
                rounded-[16px] transition-all duration-300 ease-out cursor-pointer
                border-[2px] backdrop-blur-sm
                ${
                  isActive
                    ? 'bg-[#4294F7] text-white shadow-lg shadow-blue-500/40 scale-105'
                    : 'border-transparent text-[#E0E0E0] hover:text-white hover:bg-[#2A2A2E] hover:scale-102'
                }
              `}
              onClick={() => navigate(nav.url)}
            >
              {/* 激活状态指示器 */}
              {isActive && (
                <div className="absolute left-[-4px] w-[4px] h-[32px] bg-white rounded-full shadow-sm" />
              )}

              {/* 图标 */}
              <span className="text-[18px] transition-transform duration-300 group-hover:scale-110">
                {nav.icon}
              </span>

              {/* 标题 */}
              <span
                className={`
                text-[12px] font-medium transition-all duration-300
                ${isActive ? 'text-white' : 'text-[#E0E0E0] group-hover:text-white'}
              `}
              >
                {nav.title}
              </span>

              {/* 悬停效果 */}
              <div
                className={`
                absolute inset-0 rounded-[16px] transition-all duration-300
                ${isActive ? 'bg-blue-600/30' : 'group-hover:bg-gray-700/30'}
              `}
              />
            </button>
          );
        })}
      </nav>

      {/* 底部装饰 */}
      <div className="mt-auto flex flex-col items-center gap-[16px]">
        <div className="w-[48px] h-[1px] bg-gradient-to-r from-transparent via-[#404044] to-transparent" />
        <div className="text-[12px] text-[#707070]">v1.0.0</div>
      </div>
    </div>
  );
}
