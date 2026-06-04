import { useEffect, useState } from 'react';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Запускает асинхронную загрузку при изменении deps. Гонки исключаются через
// AbortController: ответ устаревшего запроса игнорируется и не пишется в стейт.
// Во время повторной загрузки прежние data сохраняются (нет «мигания» пустотой).
export function useAsync<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fn(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, loading: false, error: null });
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted || (e instanceof DOMException && e.name === 'AbortError')) {
          return;
        }
        const message = e instanceof Error ? e.message : 'Неизвестная ошибка';
        setState((prev) => ({ ...prev, loading: false, error: message }));
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
