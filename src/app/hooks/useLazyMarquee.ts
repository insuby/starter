import { useEffect, useState } from 'react';

export const useLazyMarquee = (delay = 1000) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return shouldRender;
};
