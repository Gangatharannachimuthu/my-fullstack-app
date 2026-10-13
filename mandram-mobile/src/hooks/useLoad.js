import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '../api/client';

/**
 * Fetch-with-state for a screen: data, first-load spinner, pull-to-refresh flag,
 * and a readable error. Every tab does the same dance, so it lives in one place.
 *
 * `deps` should include whatever the fetch depends on (usually the selected
 * meeting) so switching meetings refetches.
 */
export default function useLoad(fetcher, deps = [], { initial = null } = {}) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fetcher, deps);

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const result = await run();
        setData(result);
        setError('');
      } catch (err) {
        setError(errorMessage(err, 'Could not load this screen'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [run]
  );

  useEffect(() => {
    load(false);
  }, [load]);

  return {
    data,
    setData,
    loading,
    refreshing,
    error,
    setError,
    reload: () => load(false),
    refresh: () => load(true),
  };
}
