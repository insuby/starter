import { Marquee } from '@devnomic/marquee';

import type { FC } from 'react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';

import { PERFORMANCE_CONSTANTS } from '../constants';
import { useLazyMarquee } from '../hooks';
import type { Commissioner } from '../types';
import CommissionerCard from './CommissionerCard';

type VirtualizedCommissionerListProps = {
  commissionerPairs: Commissioner[][];
};

const VirtualizedCommissionerList: FC<VirtualizedCommissionerListProps> = memo(
  ({ commissionerPairs }) => {
    const [isVisible, setIsVisible] = useState(true);
    const marqueeRef = useRef<HTMLDivElement>(null);
    const shouldRenderMarquee = useLazyMarquee(500); // Загружаем через 500мс

    // Оптимизация: показываем только первые 20 пар для быстрого рендера
    const visiblePairs = useMemo(() => {
      return commissionerPairs.slice(0, 20);
    }, [commissionerPairs]);

    const handleMarqueeClick = useCallback(() => {
      setIsVisible(!isVisible);
    }, [isVisible]);

    return (
      <div className="relative h-[70%] overflow-hidden">
        {shouldRenderMarquee ? (
          <Marquee
            ref={marqueeRef}
            direction="up"
            className="fast-marquee h-full !gap-1"
            innerClassName="!gap-1"
            fade
            numberOfCopies={PERFORMANCE_CONSTANTS.MARQUEE_COPIES}
            speed={0.5} // Увеличиваем скорость
            pauseOnHover={false} // Отключаем паузу при наведении для ускорения
          >
            {visiblePairs.map((pair, pairIndex) => (
              <div
                key={pairIndex}
                className="mb-[0.1rem] flex justify-center gap-1"
                onClick={handleMarqueeClick}
              >
                {pair.map((commissioner, index) => (
                  <CommissionerCard
                    key={`${commissioner.fio}-${index}`}
                    commissioner={commissioner}
                    pairIndex={pairIndex}
                    index={index}
                  />
                ))}
              </div>
            ))}
          </Marquee>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-white">
              <div className="mb-2 text-lg">Загрузка списка комиссаров...</div>
              <div className="text-sm text-gray-300">Пожалуйста, подождите</div>
            </div>
          </div>
        )}

        {/* Индикатор загрузки */}
        {shouldRenderMarquee &&
          commissionerPairs.length > visiblePairs.length && (
            <div className="absolute bottom-2 right-2 rounded bg-blue-500/80 px-2 py-1 text-xs text-white">
              Показано {visiblePairs.length} из {commissionerPairs.length} пар
            </div>
          )}
      </div>
    );
  },
);

VirtualizedCommissionerList.displayName = 'VirtualizedCommissionerList';

export default VirtualizedCommissionerList;
