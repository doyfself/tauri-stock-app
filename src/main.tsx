import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { routes } from './routes/index.tsx';
import './main.css';
import { ConfigProvider, theme } from 'antd';
const router = createBrowserRouter(routes);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
      }}
    >
      <RouterProvider
        router={router}
        future={{
          v7_startTransition: true,
        }}
      />
    </ConfigProvider>
  </StrictMode>,
);
