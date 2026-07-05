import { useCallback, useState } from 'react';
import { apiClient } from '../api/client';
import type { components } from '../../../contracts/generated/types';

type Transaction = components['schemas']['Transaction'];

export function useSearch() {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Transaction[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (q: string, cursor = 0, append = false) => {
    if (!q.trim()) {
      setItems([]);
      setNextCursor(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await apiClient.GET('/api/search', { params: { query: { q, cursor } } });
      if (apiError) throw new Error('Search failed');
      setItems((prev) => (append ? [...prev, ...(data?.items ?? [])] : data?.items ?? []));
      setNextCursor(data?.nextCursor ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  function search(q: string) {
    setQuery(q);
    run(q, 0, false);
  }

  function loadMore() {
    if (nextCursor !== null) run(query, nextCursor, true);
  }

  return { query, items, nextCursor, loading, error, search, loadMore };
}
