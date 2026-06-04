import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Home } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Страница не найдена
          </h2>
          <p className="text-gray-600 mb-6">
            К сожалению, запрашиваемая страница не существует
          </p>
          <Button onClick={() => navigate('/')}>
            <Home className="mr-2 h-4 w-4" />
            На главную
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
