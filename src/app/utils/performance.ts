// Утилита для ленивой загрузки изображений
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Утилита для батчинга обновлений
export const batchUpdate = <T>(
  items: T[],
  batchSize: number,
  callback: (batch: T[]) => void,
) => {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    setTimeout(() => callback(batch), 0);
  }
};

// Утилита для дебаунсинга
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): T => {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};

// Утилита для троттлинга
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
): T => {
  let lastCall = 0;
  return ((...args: any[]) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  }) as T;
};
