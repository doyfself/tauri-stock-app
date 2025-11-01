import type { RouteObject } from 'react-router-dom';
import Home from '@/pages/Home';
import App from '@/pages/App';
import StockDetails from '../pages/StockDetails';
import StockReview from '@/pages/StockReview';
import StockReviewDetails from '@/pages/StockReviewDetails';
import MarketAnalysis from '@/pages/MarketAnalysis';
import SelfReflect from '@/pages/SelfReflect';
import SelfReflectDetails from '@/pages/SelfReflectDetails';
import MyHolding from '@/pages/MyHolding';
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      {
        path: 'kline/:id',
        element: <StockDetails />,
      },
      {
        path: 'market',
        element: <MarketAnalysis />,
      },
      {
        path: '/sr/:type',
        element: <StockReview />,
      },
      {
        path: '/sr/:type/:id',
        element: <StockReviewDetails />,
      },
      {
        path: '/reflect',
        element: <SelfReflect />,
      },
      {
        path: '/reflect/:id',
        element: <SelfReflectDetails />,
      },
      {
        path: '/holding',
        element: <MyHolding />,
      },
    ],
  },
];
