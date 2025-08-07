import './styles/main.scss';
import 'slick-carousel/slick/slick-theme.css';
import 'slick-carousel/slick/slick.css';

import type { FC } from 'react';
import { memo } from 'react';
import Slider from 'react-slick';

import {
  FeaturedCommissionerSlide,
  VirtualizedCommissionerList,
} from './components';
import { SLIDER_SETTINGS } from './constants';
import cvoData from './data/cvo.json';
import { FEATURED_COMMISSIONERS } from './data/featured-commissioners';
import { useCommissionerPairs } from './hooks';
import type { Commissioner } from './types';

const TopSection: FC = memo(() => (
  <div className="flex h-[30%] items-center justify-center p-5">
    <div className="size-full overflow-hidden">
      <Slider {...SLIDER_SETTINGS.horizontal} className="h-full">
        {FEATURED_COMMISSIONERS.map((commissioner, index) => (
          <FeaturedCommissionerSlide
            key={index}
            commissioner={commissioner}
            index={index}
          />
        ))}
      </Slider>
    </div>
  </div>
));

TopSection.displayName = 'TopSection';

const BottomSection: FC<{ commissionerPairs: Commissioner[][] }> = memo(
  ({ commissionerPairs }) => (
    <VirtualizedCommissionerList commissionerPairs={commissionerPairs} />
  ),
);

BottomSection.displayName = 'BottomSection';

const App: FC = () => {
  const commissioners = cvoData as unknown as Commissioner[];
  const commissionerPairs = useCommissionerPairs(commissioners);

  return (
    <div className="mx-auto flex h-screen w-[720px] flex-col overflow-hidden bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900">
      <div className="flex size-full flex-col gap-[20px]">
        <TopSection />
        <BottomSection commissionerPairs={commissionerPairs} />
      </div>
    </div>
  );
};

export default App;
