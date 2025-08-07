import { useMemo } from 'react';

import type { Commissioner } from '../types/commissioner';

export const useCommissionerPairs = (commissioners: Commissioner[]) => {
  return useMemo(() => {
    const pairs = [];
    for (let i = 0; i < commissioners.length; i += 2) {
      const pair = [commissioners[i]];
      if (i + 1 < commissioners.length) {
        pair.push(commissioners[i + 1]);
      }
      pairs.push(pair);
    }
    return pairs;
  }, [commissioners]);
};
