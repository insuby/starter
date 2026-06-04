import { Badge } from './ui/badge';
import { type BlankStatus, statusNames } from '../data/mockData';

interface StatusBadgeProps {
  status: BlankStatus;
}

const statusColors: Record<BlankStatus, string> = {
  in_circulation: 'bg-green-100 text-green-800 border-green-200',
  issued: 'bg-blue-100 text-blue-800 border-blue-200',
  on_hold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  written_off: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={statusColors[status]}>
      {statusNames[status]}
    </Badge>
  );
}
