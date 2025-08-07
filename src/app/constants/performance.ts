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
    FAST: 300, // Ускорено с 1100 до 300 секунд
    MINUTE: 65,
  },

  // Настройки слайдера
  SLIDER_SPEED: {
    VERTICAL: 1000,
    HORIZONTAL: 60000,
  },
} as const;
