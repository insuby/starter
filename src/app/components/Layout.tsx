import { useState } from 'react';
import { Outlet } from 'react-router';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { CabinetSwitcher } from './CabinetSwitcher';
import { Toaster } from './ui/sonner';
import { Building2 } from 'lucide-react';
import {
  currentUser,
  cabinetDefinitions,
  findCabinetByUserId,
  type CabinetId,
} from '../data/mockData';
import { DEMO_SWITCHER_ENABLED, devSwitchAccount, getBoundCabinetPath } from '../lib/session';

export function Layout() {
  const [key, setKey] = useState(0);
  const [cabinetId, setCabinetId] = useState<CabinetId | null>(() => {
    const match = findCabinetByUserId(currentUser.id);
    return match?.id ?? null;
  });

  // Переключение кабинета доступно только в режиме разработки.
  const applyCabinet = (id: CabinetId) => {
    const cab = cabinetDefinitions.find((d) => d.id === id);
    if (cab && devSwitchAccount(cab.userId)) {
      setCabinetId(id);
      setKey((k) => k + 1);
    }
  };

  const handleUserChange = () => {
    const match = findCabinetByUserId(currentUser.id);
    setCabinetId(match?.id ?? null);
    setKey((k) => k + 1);
  };

  const boundPath = getBoundCabinetPath();

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <Header onUserChange={handleUserChange} />

      {DEMO_SWITCHER_ENABLED ? (
        <CabinetSwitcher cabinetId={cabinetId} onCabinetChange={applyCabinet} />
      ) : (
        boundPath.length > 0 && (
          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-6 py-2 text-xs text-gray-600">
            <Building2 className="h-3.5 w-3.5 text-gray-400" />
            <span className="font-medium text-gray-700">Кабинет:</span>
            <span>{boundPath.join(' → ')}</span>
          </div>
        )
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar key={key} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet key={key} />
        </main>
      </div>
      <Toaster />
    </div>
  );
}
