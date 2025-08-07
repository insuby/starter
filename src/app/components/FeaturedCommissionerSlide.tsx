import { Marquee } from '@devnomic/marquee';

import type { FC } from 'react';
import { memo } from 'react';

import type { FeaturedCommissioner } from '../data/featured-commissioners';
import OptimizedImage from './OptimizedImage';

type FeaturedCommissionerSlideProps = {
  commissioner: FeaturedCommissioner;
  index: number;
};

const FeaturedCommissionerSlide: FC<FeaturedCommissionerSlideProps> = memo(
  ({ commissioner, index }) => {
    const nameParts = commissioner.fio.split(' ');
    const lastName = nameParts.slice(-1)[0];
    const firstName = nameParts.slice(0, 1).join(' ');
    const middleNames = nameParts.slice(1, -1).join(' ');

    return (
      <div className="featured-commissioner-slide">
        <div className="featured-commissioner-container">
          <div className="featured-commissioner-photo-section">
            <div className="featured-commissioner-photo-overlay" />
            <OptimizedImage
              src={`/images/${commissioner.photo}`}
              alt={`Фото ${commissioner.fio}`}
              className="featured-commissioner-photo"
            />
          </div>
          <div className="featured-commissioner-name-section">
            <span className="featured-commissioner-last-name">{lastName}</span>
            <h1 className="featured-commissioner-first-name">{firstName}</h1>
            <span className="featured-commissioner-middle-names">
              {middleNames}
            </span>
            <span className="featured-commissioner-birthdate">
              {commissioner.birthdate}
            </span>
          </div>
          <div className="featured-commissioner-content">
            <h2 className="featured-commissioner-position">
              {commissioner.position}
            </h2>
            <p className="featured-commissioner-region">
              {commissioner.region}
            </p>

            <div className="featured-commissioner-description">
              <Marquee
                direction="up"
                className="minute-scroll h-full"
                fade
                numberOfCopies={2}
              >
                <div className="space-y-2">
                  {commissioner.description
                    .split('\n\n')
                    .map((paragraph, index) => (
                      <p
                        key={index}
                        className="featured-commissioner-paragraph"
                      >
                        {paragraph.trim()}
                      </p>
                    ))}
                </div>
              </Marquee>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

FeaturedCommissionerSlide.displayName = 'FeaturedCommissionerSlide';

export default FeaturedCommissionerSlide;
