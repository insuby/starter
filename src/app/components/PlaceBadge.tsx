import { Badge } from './ui/badge';
import { type BlankPlace, placeNames } from '../data/mockData';

type PlaceBadgeProps = {
  place: BlankPlace;
};

const placeColors: Record<BlankPlace, string> = {
  at_center: 'bg-violet-100 text-violet-900 border-violet-200',
  at_district: 'bg-indigo-100 text-indigo-900 border-indigo-200',
  at_omu: 'bg-sky-100 text-sky-900 border-sky-200',
  at_vk_subject: 'bg-cyan-100 text-cyan-900 border-cyan-200',
  at_vk_mo: 'bg-teal-100 text-teal-900 border-teal-200',
  in_transit: 'bg-orange-100 text-orange-900 border-orange-200',
  with_recipient: 'bg-blue-100 text-blue-900 border-blue-200',
  archived: 'bg-gray-100 text-gray-800 border-gray-200',
};

export const PlaceBadge = ({ place }: PlaceBadgeProps) => {
  return (
    <Badge variant="outline" className={placeColors[place]}>
      {placeNames[place]}
    </Badge>
  );
};
