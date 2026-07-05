import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { components } from '../../../contracts/generated/types';

type Transaction = components['schemas']['Transaction'];

export interface TransactionFilters {
  year: number;
  month: number;
  categoryId?: number;
  incomeSourceId?: number;
  paymentMethodId?: number;
  tagId?: number;
  page?: number;
}

function monthRange(year: number, month: number): { dateFrom: string; dateTo: string } {
  const mm = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  return { dateFrom: `${year}-${mm}-01`, dateTo: `${year}-${mm}-${lastDay}` };
}

export function useTransactions(filters: TransactionFilters) {
  const [items, setItems] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { dateFrom, dateTo } = monthRange(filters.year, filters.month);
      const { data, error: apiError } = await apiClient.GET('/api/transactions', {
        params: {
          query: {
            dateFrom,
            dateTo,
            categoryId: filters.categoryId,
            incomeSourceId: filters.incomeSourceId,
            paymentMethodId: filters.paymentMethodId,
            tagId: filters.tagId,
            page: filters.page ?? 1,
            pageSize: 100,
          },
        },
      });
      if (apiError) throw new Error('Failed to load transactions');
      setItems(data?.items ?? []);
      setTotal(data?.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [filters.year, filters.month, filters.categoryId, filters.incomeSourceId, filters.paymentMethodId, filters.tagId, filters.page]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { items, total, loading, error, refetch };
}

export async function deleteTransaction(id: number): Promise<void> {
  const { error } = await apiClient.DELETE('/api/transactions/{id}', { params: { path: { id } } });
  if (error) throw new Error('Failed to delete transaction');
}
