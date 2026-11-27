import { useEffect, useState } from 'react';
import { ApiError, apiRequest } from '../../../shared/api/apiClient.js';
import ErrorBanner from '../../../shared/components/common/ErrorBanner.jsx';

export default function StatusPage() {
  const [state, setState] = useState({ loading: true, error: null, ready: null });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const ready = await apiRequest('/health/ready', { signal: controller.signal });
        setState({ loading: false, error: null, ready });
      } catch (error) {
        if (error?.name === 'AbortError') return;
        if (error instanceof ApiError && error.status === 503 && error.body?.checks) {
          setState({ loading: false, error: null, ready: error.body });
          return;
        }
        setState({ loading: false, error: error.message, ready: null });
      }
    }

    load();
    return () => controller.abort();
  }, []);

  return (
    <section className="card">
      <h1>Platform status</h1>
      <ErrorBanner message={state.error} />
      {state.loading && <p>Checking the backend...</p>}
      {state.ready && (
        <ul className="status-list">
          <li>
            <span>Backend</span>
            <strong>reachable</strong>
          </li>
          <li>
            <span>Database</span>
            <strong>{state.ready.checks.database.connected ? 'connected' : 'not connected'}</strong>
          </li>
        </ul>
      )}
    </section>
  );
}
