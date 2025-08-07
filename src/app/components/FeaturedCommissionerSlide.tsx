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
      <div className="flex h-full items-center justify-center">
        <div className="relative flex size-full gap-8 overflow-hidden rounded-[32px] text-white">
          <div className="relative h-full w-2/5">
            <div className="absolute inset-0 z-10 size-full bg-gradient-to-t from-black via-[#00000010] to-transparent" />
            <OptimizedImage
              src={`/images/${commissioner.photo}`}
              alt={`Фото ${commissioner.fio}`}
              className="absolute inset-0 z-0 h-full object-cover"
            />
          </div>
          <div className="absolute bottom-8 left-4 z-10 flex w-[38%] flex-col">
            <span className="font-rubik-mono text-[27px] uppercase leading-tight tracking-tight text-white drop-shadow-lg">
              {lastName}
            </span>
            <h1 className="font-oswald-bold text-xl uppercase leading-tight tracking-wide text-white drop-shadow-lg">
              {firstName}
            </h1>
            <span className="font-oswald-medium text-xl uppercase leading-tight tracking-wide text-white drop-shadow-lg">
              {middleNames}
            </span>
            <span className="absolute -bottom-6 right-6 text-gray-200">
              {commissioner.birthdate}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-0 overflow-y-auto pr-3">
            <h2 className="font-rubik-mono m-0 text-xl uppercase tracking-wide text-white drop-shadow-lg">
              {commissioner.position}
            </h2>
            <p className="font-oswald-light m-0 whitespace-pre-wrap text-base text-white opacity-90">
              {commissioner.region}
            </p>

            <div className="mt-10 flex-1 overflow-hidden">
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
                        className="font-oswald-regular m-0 text-justify indent-4 text-sm leading-tight text-white"
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
