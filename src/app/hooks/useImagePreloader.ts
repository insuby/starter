import { useEffect, useState } from 'react';

import { preloadImage } from '../utils/performance';

export const useImagePreloader = (imageUrls: string[]) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadImages = async () => {
      setIsLoading(true);
      const loaded = new Set<string>();

      try {
        await Promise.allSettled(
          imageUrls.map(async (url) => {
            await preloadImage(url);
            loaded.add(url);
          }),
        );
      } catch (error) {
        console.error('Ошибка при загрузке изображений:', error);
      }

      setLoadedImages(loaded);
      setIsLoading(false);
    };

    if (imageUrls.length > 0) {
      loadImages();
    }
  }, [imageUrls]);

  return { loadedImages, isLoading };
};
