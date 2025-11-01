import './styles/main.scss';

import { MainPage } from 'pages';
import { Layout } from 'widgets';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import { RoutesPath } from 'shared/routes-path';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    },
  },
});

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Pages />
      </BrowserRouter>
      <ToastContainer closeOnClick theme="colored" />
    </QueryClientProvider>
  );
};

const Pages = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path={RoutesPath.MAIN} element={<MainPage />} />
      </Route>
      <Route path="*" element={<Navigate replace to={RoutesPath.MAIN} />} />
    </Routes>
  );
};
