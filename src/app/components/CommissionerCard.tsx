import type { FC } from 'react';
import { memo } from 'react';
import Slider from 'react-slick';

import { SLIDER_SETTINGS } from 'app/constants';
import type { Commissioner } from 'app/types';

import OptimizedImage from './OptimizedImage';

type CommissionerCardProps = {
  commissioner: Commissioner;
  pairIndex: number;
  index: number;
};

const CommissionerCard: FC<CommissionerCardProps> = memo(
  ({ commissioner, pairIndex, index }) => {
    const nameParts = commissioner.fio.split(' ');
    const firstName = nameParts[0];
    const otherNames = nameParts.slice(1).join(' ');

    return (
      <div className="flex max-w-[340px] flex-1 flex-col rounded-xl border border-blue-300/30 bg-white/10 p-4 shadow-lg backdrop-blur-sm">
        <div className="mb-2 flex h-32 shrink-0 items-start gap-3">
          <div className="h-full w-24 overflow-hidden rounded">
            <OptimizedImage
              src={`/images/${commissioner.photo}`}
              alt={`Фото ${commissioner.fio}`}
              className="size-full object-cover"
            />
          </div>

          <div className="relative flex-1">
            <div className="absolute right-0 top-0 flex flex-col items-center gap-1">
              <div className="h-4 w-8 overflow-hidden">
                <OptimizedImage
                  src={`/images/${commissioner.flag}`}
                  alt={`Флаг ${commissioner.fio}`}
                  className="size-full object-cover"
                />
              </div>
              <div className="mt-2 size-4 overflow-hidden">
                <OptimizedImage
                  src={`/images/${commissioner.gerb}`}
                  alt={`Герб ${commissioner.fio}`}
                  className="size-full object-cover"
                />
              </div>
            </div>
            <p className="font-oswald-regular m-0 whitespace-pre-wrap text-xs leading-none text-gray-200">
              {commissioner.position}
            </p>
            <p className="font-oswald-regular m-0 mt-1 text-xs text-gray-300">
              {commissioner.rank}
            </p>
            <div className="flex flex-col gap-1">
              <span className="font-rubik-mono text-lg text-white">
                {firstName}
              </span>
              <span className="font-oswald-medium -mt-2.5 text-sm text-gray-300">
                {otherNames}
              </span>
            </div>
            <p className="font-oswald-light m-0 mt-1 text-xs text-gray-400">
              {commissioner.birthdate}
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <div className="h-20 shrink-0">
            <h5 className="font-rubik-mono m-0 mb-1 border-b-2 border-blue-400/50 pb-1 text-sm text-white">
              Последняя должность:
            </h5>
            <div className="h-12 overflow-hidden">
              <div className="flex flex-col gap-1">
                <p className="font-oswald-regular m-0 text-sm leading-none text-gray-200">
                  {commissioner.last_position.title}
                </p>
                <p className="font-oswald-light m-0 text-xs italic text-gray-400">
                  {commissioner.last_position.date_1} -{' '}
                  {commissioner.last_position.date_2}
                </p>
              </div>
            </div>
          </div>

          <div className="h-20 shrink-0">
            <h5 className="font-rubik-mono m-0 mb-1 border-b-2 border-blue-400/50 pb-1 text-sm text-white">
              Награды:
            </h5>
            <div className="h-12 overflow-hidden">
              <Slider
                key={`medals-pair-${pairIndex}-${index}`}
                {...SLIDER_SETTINGS.vertical}
              >
                {commissioner.medals && commissioner.medals.length > 0 ? (
                  commissioner.medals.map((medal, medalIndex) => (
                    <div key={medalIndex} className="h-4">
                      <p className="font-oswald-regular m-0 line-clamp-1 text-xs leading-none text-gray-200">
                        {medal}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="h-2">
                    <p className="font-oswald-light m-0 text-xs leading-none text-gray-200">
                      не указаны
                    </p>
                  </div>
                )}
              </Slider>
            </div>
          </div>

          <div className="h-20 shrink-0">
            <h5 className="font-rubik-mono m-0 mb-1 border-b-2 border-blue-400/50 pb-1 text-sm text-white">
              Достижения:
            </h5>
            <div className="h-12 overflow-hidden">
              <Slider
                key={`achievements-pair-${pairIndex}-${index}`}
                {...SLIDER_SETTINGS.vertical}
              >
                {commissioner.achievement &&
                commissioner.achievement.length > 0 ? (
                  commissioner.achievement.map(
                    (achievement, achievementIndex) => (
                      <div key={achievementIndex} className="h-4">
                        <p className="font-oswald-regular m-0 line-clamp-1 text-xs leading-none text-gray-200">
                          {achievement}
                        </p>
                      </div>
                    ),
                  )
                ) : (
                  <div className="h-2">
                    <p className="font-oswald-light m-0 text-xs leading-none text-gray-200">
                      не указаны
                    </p>
                  </div>
                )}
              </Slider>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

CommissionerCard.displayName = 'CommissionerCard';

export default CommissionerCard;
