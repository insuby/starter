import axios from 'axios';
import Cookies from 'js-cookie';

import { CookieKey } from 'shared/contants';

export const axiosInstance = axios.create({
  // baseURL: process.env.NODE_ENV !== 'development' ? process.env.API_URL : '',
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      (error.response.status === 401 || error.response.status === 403) &&
      !originalRequest._retry
    ) {
      Cookies.remove(CookieKey);
      return;
    }

    return Promise.reject(error);
  },
);
