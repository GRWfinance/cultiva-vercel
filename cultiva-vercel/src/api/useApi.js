import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

// Hook simples para buscar dados de um endpoint, com refetch manual
export function useApi(path, { enabled = true, deps = [] } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!enabled || !path) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.get(path);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [path, enabled, ...deps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
