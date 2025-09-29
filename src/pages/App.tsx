import { Outlet } from 'react-router-dom';
import LeftMenu from '@/components/common/LeftMenu';
import HeaderNav from '@/components/common/HeaderNav';
import BottomBar from '@/components/common/BottomBar';
export default function Home() {
  return (
    <div className="flex bg-[#1A1B1F] flex-col h-[100vh] relative">
      <HeaderNav />
      <div className="flex-1 flex h-full pt-[40px] pb-[25px]">
        <LeftMenu />
        <div className="flex-1 h-full pb-[40px] overflow-y-auto">
          <Outlet />
        </div>
      </div>

      <BottomBar />
    </div>
  );
}
