import type { AxiosError } from 'axios';

import { toast } from 'react-toastify';

export const onAxiosError = (error: AxiosError) => {
  console.log(error);
  toast.error(error.response!.statusText);
};
