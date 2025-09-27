import { Outlet } from 'react-router-dom';
import LeftMenu from '@/components/common/LeftMenu';
import HeaderNav from '@/components/common/HeaderNav';
import BottomBar from '@/components/common/BottomBar';
export default function Home() {
  return (
    <div className="flex bg-[#1A1B1F] flex-col h-[100vh]">
      <HeaderNav />
      <div className="flex-1 flex h-full">
        <LeftMenu />
        <div className="flex-1 h-full">
          <Outlet />
        </div>
      </div>
      <BottomBar />
    </div>
  );
}
