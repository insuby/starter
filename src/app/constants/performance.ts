// Константы для производительности
export const PERFORMANCE_CONSTANTS = {
  // Размер батча для обновлений
  BATCH_SIZE: 10,

  // Задержка для дебаунсинга
  DEBOUNCE_DELAY: 300,

  // Задержка для троттлинга
  THROTTLE_DELAY: 100,

  // Количество копий для Marquee
  MARQUEE_COPIES: 2,

  // Скорость анимации Marquee (в секундах)
  MARQUEE_SPEED: {
    FAST: 1100,
    MINUTE: 65,
  },

  // Настройки слайдера
  SLIDER_SPEED: {
    VERTICAL: 3000,
    HORIZONTAL: 60000,
  },
} as const;

// Константы для изображений
export const IMAGE_CONSTANTS = {
  // Размеры изображений
  SIZES: {
    COMMISSIONER_PHOTO: { width: 96, height: 128 },
    FLAG: { width: 32, height: 16 },
    GERB: { width: 16, height: 16 },
    FEATURED_PHOTO: { width: 288, height: 216 },
  },

  // Форматы изображений
  FORMATS: ['webp', 'avif', 'jpg', 'png'],

  // Качество изображений
  QUALITY: 85,
} as const;
