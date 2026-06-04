import { useState, useEffect, useSyncExternalStore } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { LoginPage } from './pages/LoginPage';
import { isAuthenticated, subscribeSession } from './lib/session';

export default function App() {
  const [error, setError] = useState<Error | null>(null);
  const authed = useSyncExternalStore(subscribeSession, isAuthenticated, isAuthenticated);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Application error:', event.error);
      setError(event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Ошибка загрузки</h1>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Перезагрузить
          </button>
        </div>
      </div>
    );
  }

  if (!authed) {
    // onLoggedIn не обязателен — подписка через useSyncExternalStore сама обновит,
    // но передаём no-op для совместимости с сигнатурой.
    return <LoginPage onLoggedIn={() => undefined} />;
  }

  return <RouterProvider router={router} />;
}
