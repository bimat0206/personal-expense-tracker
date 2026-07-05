import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { components } from '../../../contracts/generated/types';

type WishListItem = components['schemas']['WishListItem'];

export function useWishList(year: number, month: number) {
  const [items, setItems] = useState<WishListItem[]>([]);
  const [estimatedTotalCents, setEstimatedTotalCents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await apiClient.GET('/api/wishlist', { params: { query: { year, month } } });
      if (apiError) throw new Error('Failed to load wish list');
      setItems(data?.items ?? []);
      setEstimatedTotalCents(data?.estimatedTotalCents ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wish list');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function create(payload: {
    name: string;
    estimatedCostCents: number;
    categoryId: number;
    priority?: 'high' | 'medium' | 'low';
    note?: string;
  }) {
    const { error } = await apiClient.POST('/api/wishlist', { body: { year, month, ...payload } });
    if (error) throw new Error('Could not save wish list item');
    await refetch();
  }

  async function updateItem(id: number, payload: Partial<WishListItem>) {
    // @ts-expect-error partial update payload matches PUT body shape
    await apiClient.PUT('/api/wishlist/{id}', { params: { path: { id } }, body: payload });
    await refetch();
  }

  async function remove(id: number) {
    await apiClient.DELETE('/api/wishlist/{id}', { params: { path: { id } } });
    await refetch();
  }

  async function purchase(id: number, payload: { paymentMethodId: number; amountCents?: number; date?: string }) {
    const { data, error } = await apiClient.POST('/api/wishlist/{id}/purchase', {
      params: { path: { id } },
      body: payload,
    });
    if (error) throw new Error('Could not complete purchase');
    await refetch();
    return data;
  }

  async function copyToNextMonth(id: number) {
    await apiClient.POST('/api/wishlist/{id}/copy-next-month', { params: { path: { id } } });
    await refetch();
  }

  return { items, estimatedTotalCents, loading, error, refetch, create, updateItem, remove, purchase, copyToNextMonth };
}
