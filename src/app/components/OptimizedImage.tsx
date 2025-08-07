import type { FC } from 'react';
import { memo, useState } from 'react';

type OptimizedImageProps = {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
};

const OptimizedImage: FC<OptimizedImageProps> = memo(
  ({ src, alt, className, onLoad, onError }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    const handleLoad = () => {
      setIsLoaded(true);
      onLoad?.();
    };

    const handleError = () => {
      setHasError(true);
      onError?.();
    };

    if (hasError) {
      return (
        <div
          className={`flex items-center justify-center bg-gray-200 ${className}`}
        >
          <span className="text-xs text-gray-500">Ошибка загрузки</span>
        </div>
      );
    }

    return (
      <img
        src={src}
        alt={alt}
        className={`${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-300 ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    );
  },
);

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
