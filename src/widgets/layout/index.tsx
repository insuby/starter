import { Outlet } from 'react-router-dom';

export const Layout = () => {
  return (
    <div className="bg-brand-4 h-screen overflow-x-auto">
      <Outlet />
    </div>
  );
};
