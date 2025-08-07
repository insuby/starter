import type { FC } from 'react';
import { memo } from 'react';
import Slider from 'react-slick';

import { SLIDER_SETTINGS } from '../constants/slider-settings';
import type { Commissioner } from '../types/commissioner';
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
      <div className="commissioner-card">
        <div className="commissioner-card-header">
          <div className="commissioner-card-photo">
            <OptimizedImage
              src={`/images/${commissioner.photo}`}
              alt={`Фото ${commissioner.fio}`}
              className="size-full object-cover"
            />
          </div>

          <div className="commissioner-card-info">
            <div className="commissioner-card-badges mt-12">
              <div className="commissioner-card-flag">
                <OptimizedImage
                  src={`/images/${commissioner.flag}`}
                  alt={`Флаг ${commissioner.fio}`}
                  className="size-full object-cover"
                />
              </div>
              <div className="commissioner-card-gerb">
                <OptimizedImage
                  src={`/images/${commissioner.gerb}`}
                  alt={`Герб ${commissioner.fio}`}
                  className="size-full object-cover"
                />
              </div>
            </div>
            <p className="commissioner-card-position">
              {commissioner.position}
            </p>
            <p className="commissioner-card-rank">{commissioner.rank}</p>
            <div className="commissioner-card-name">
              <span className="commissioner-card-first-name">{firstName}</span>
              <span className="commissioner-card-other-names">
                {otherNames}
              </span>
            </div>
            <p className="commissioner-card-birthdate">
              {commissioner.birthdate}
            </p>
          </div>
        </div>

        <div className="commissioner-card-content">
          <div className="commissioner-card-section">
            <h5 className="commissioner-card-section-title">
              Последняя должность:
            </h5>
            <div className="commissioner-card-section-content">
              <div className="flex flex-col gap-1">
                <p className="commissioner-card-text">
                  {commissioner.last_position.title}
                </p>
                <p className="commissioner-card-text-small">
                  {commissioner.last_position.date_1} -{' '}
                  {commissioner.last_position.date_2}
                </p>
              </div>
            </div>
          </div>

          <div className="commissioner-card-section">
            <h5 className="commissioner-card-section-title">Награды:</h5>
            <div className="commissioner-card-section-content">
              <Slider
                key={`medals-pair-${pairIndex}-${index}`}
                {...SLIDER_SETTINGS.vertical}
              >
                {commissioner.medals && commissioner.medals.length > 0 ? (
                  commissioner.medals.map((medal, medalIndex) => (
                    <div key={medalIndex} className="h-4">
                      <p className="commissioner-card-text line-clamp-1 text-xs">
                        {medal}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="h-2">
                    <p className="commissioner-card-empty text-xs">
                      отсутствуют
                    </p>
                  </div>
                )}
              </Slider>
            </div>
          </div>

          <div className="commissioner-card-section">
            <h5 className="commissioner-card-section-title">Достижения:</h5>
            <div className="commissioner-card-section-content">
              <Slider
                key={`achievements-pair-${pairIndex}-${index}`}
                {...SLIDER_SETTINGS.vertical}
              >
                {commissioner.achievement &&
                commissioner.achievement.length > 0 ? (
                  commissioner.achievement.map(
                    (achievement, achievementIndex) => (
                      <div key={achievementIndex} className="h-4">
                        <p className="commissioner-card-text line-clamp-1 text-xs">
                          {achievement}
                        </p>
                      </div>
                    ),
                  )
                ) : (
                  <div className="h-2">
                    <p className="commissioner-card-empty text-xs">
                      отсутствуют
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
