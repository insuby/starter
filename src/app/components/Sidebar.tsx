import { NavLink } from 'react-router';
import {
  LayoutDashboard,
  FileText,
  ArrowLeftRight,
  ClipboardList,
  BarChart3,
  Settings,
  FileSignature,
  Upload,
  Split,
  ScrollText,
} from 'lucide-react';
import { currentUser, isVkSubjectOperator } from '../data/mockData';
import { cn } from './ui/utils';

const getMenuItems = () => {
  const blanks = { to: '/blanks', icon: FileText, label: 'Бланки' };
  const distribution = { to: '/distribution', icon: Split, label: 'Распределение' };
  const reports = { to: '/reports', icon: BarChart3, label: 'Отчеты' };
  const transfers = { to: '/transfers', icon: ArrowLeftRight, label: 'Перемещения' };

  if (currentUser.role === 'center_operator') {
    return [
      { to: '/', icon: LayoutDashboard, label: 'Дашборд' },
      blanks,
      { to: '/upload', icon: Upload, label: 'Поступление номеров' },
      distribution,
      reports,
    ];
  }

  if (currentUser.role === 'vkmo_operator') {
    return [
      blanks,
      { to: '/operations', icon: ClipboardList, label: 'Операции' },
      { to: '/signatures', icon: FileSignature, label: 'На подписании' },
      reports,
    ];
  }

  if (currentUser.role === 'commissioner') {
    return [blanks, { to: '/signatures', icon: FileSignature, label: 'На подписании' }, reports];
  }

  if (currentUser.role === 'auditor') {
    return [blanks, reports];
  }

  if (currentUser.role === 'district_operator') {
    return [blanks, distribution, reports];
  }

  if (currentUser.role === 'subject_operator') {
    if (isVkSubjectOperator(currentUser)) {
      return [blanks, distribution, transfers, reports];
    }
    return [blanks, distribution, reports];
  }

  return [blanks];
};

export const Sidebar = () => {
  const menuItems = getMenuItems();

  return (
    <aside className="w-64 border-r bg-white">
      <nav className="flex flex-col gap-1 p-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}

        {(currentUser.role === 'center_operator' || currentUser.role === 'auditor') && (
          <>
            <div className="my-2 h-px bg-gray-200" />
            <NavLink
              to="/journal"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100',
                )
              }
            >
              <ScrollText className="h-5 w-5" />
              Журнал действий
            </NavLink>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100',
                )
              }
            >
              <Settings className="h-5 w-5" />
              Администрирование
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
};
