import { Outlet } from 'react-router-dom';
import HeaderNav from '@/components/common/HeaderNav';
export default function Home() {
  return (
    <div className="app-container">
      <header>
        <HeaderNav />
      </header>
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}
