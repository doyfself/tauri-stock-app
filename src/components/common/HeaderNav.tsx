import './index.css';
import SearchStock from './SearchStock';
import { Link } from 'react-router-dom';
export default function HeaderNav() {
  return (
    <div className="header-nav">
      <div className="flex-1">
        <Link to="/">首页</Link>
      </div>
      <SearchStock />
      <Link to="/market">大盘分析</Link>
      <Link to="/sr/position">持仓三省</Link>
      <Link to="sr/want">欲购三省</Link>
      <Link to="/kline/SH000001">自选</Link>
    </div>
  );
}
