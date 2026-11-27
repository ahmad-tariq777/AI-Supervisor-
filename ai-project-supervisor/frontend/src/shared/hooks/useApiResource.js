import { useCallback, useEffect, useRef, useState } from 'react';

export default function useApiResource(fetcher, deps = []) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [version, setVersion] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: null }));

    fetcherRef
      .current(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ loading: false, error: null, data });
      })
      .catch((error) => {
        if (error?.name === 'AbortError' || controller.signal.aborted) return;
        setState({ loading: false, error, data: null });
      });

    return () => controller.abort();
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  return { ...state, reload };
}
