import { Outlet } from 'react-router-dom';
import LeftMenu from '@/components/common/LeftMenu';
import HeaderNav from '@/components/common/HeaderNav';
import BottomBar from '@/components/common/BottomBar';
import { useRef, useEffect } from 'react';
import { useWindowSizeStore, useLoadingStore } from '@/stores/userStore';
import { Spin } from 'antd';
export default function Home() {
  // 1. 给主体容器加 ref
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const setZise = useWindowSizeStore((state) => state.setZise);

  useEffect(() => {
    if (mainContainerRef.current) {
      const rect = mainContainerRef.current.getBoundingClientRect();
      setZise(rect.width, rect.height);
    }
  }, [mainContainerRef]);
  const { visible, text } = useLoadingStore();
  return (
    <div className="flex bg-[#1A1B1F] flex-col h-[100vh] relative">
      <HeaderNav />
      <div className="flex-1 flex h-full pt-[40px] pb-[25px]">
        <LeftMenu />
        <div className="flex-1 h-full overflow-y-auto" ref={mainContainerRef}>
          <Outlet />
        </div>
      </div>
      <Spin spinning={visible} tip={text} fullscreen />
      <BottomBar />
    </div>
  );
}
