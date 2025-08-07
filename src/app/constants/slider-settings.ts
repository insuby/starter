import { PERFORMANCE_CONSTANTS } from './performance';

export const SLIDER_SETTINGS = {
  vertical: {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 3,
    arrows: false,
    vertical: true,
    verticalSwiping: true,
    autoplay: true,
    autoplaySpeed: PERFORMANCE_CONSTANTS.SLIDER_SPEED.VERTICAL,
    pauseOnHover: true,
    adaptiveHeight: false,
  },
  horizontal: {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    autoplay: true,
    autoplaySpeed: PERFORMANCE_CONSTANTS.SLIDER_SPEED.HORIZONTAL,
  },
} as const;
