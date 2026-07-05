import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../api/client';

export interface ConfigItem {
  id: number;
  name: string;
  color?: string | null;
  icon?: string | null;
  type?: string | null;
  archived: boolean;
  sortOrder: number;
}

type ConfigPath = '/api/categories' | '/api/income-sources' | '/api/payment-methods' | '/api/tags';

/** Shared list/create/update/archive/unarchive/remove hook for the four taxonomy entities. */
function createConfigHook(path: ConfigPath) {
  return function useConfig(includeArchived = false) {
    const [items, setItems] = useState<ConfigItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: apiError } = await apiClient.GET(path, { params: { query: { includeArchived } } });
        if (apiError) throw new Error('Failed to load');
        setItems((data as ConfigItem[]) ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }, [includeArchived]);

    useEffect(() => {
      refetch();
    }, [refetch]);

    /** Extract the best human-readable message from an API error object. */
    function extractErrorMessage(error: unknown, fallback: string): string {
      const e = error as { error?: string; details?: Array<{ field: string; message: string }> } | undefined;
      if (e?.details?.length) {
        return e.details.map((d) => `${d.field}: ${d.message}`).join('; ');
      }
      return e?.error ?? fallback;
    }

    async function create(payload: Partial<ConfigItem>) {
      // The four config resources have slightly different body shapes (icon/color/type); this
      // hook is intentionally generic across all of them, so the exact per-resource body type
      // can't be statically resolved from a `ConfigPath` union.
      const { error } = await apiClient.POST(path, { body: payload as never });
      if (error) throw new Error(extractErrorMessage(error, 'Could not save'));
      await refetch();
    }

    /** Like create but skips the refetch — caller is responsible for calling refetch() after a batch. */
    async function createRaw(payload: Partial<ConfigItem>) {
      const { error } = await apiClient.POST(path, { body: payload as never });
      if (error) throw new Error(extractErrorMessage(error, 'Could not save'));
    }

    async function update(id: number, payload: Partial<ConfigItem>) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (apiClient.PUT as any)(`${path}/{id}`, {
        params: { path: { id } },
        body: payload,
      });
      if (error) throw new Error(extractErrorMessage(error, 'Could not save'));
      await refetch();
    }

    /** Like update but skips the refetch — caller is responsible for calling refetch() after a batch. */
    async function updateRaw(id: number, payload: Partial<ConfigItem>) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (apiClient.PUT as any)(`${path}/{id}`, {
        params: { path: { id } },
        body: payload,
      });
      if (error) throw new Error(extractErrorMessage(error, 'Could not save'));
    }

    async function archive(id: number) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (apiClient.POST as any)(`${path}/{id}/archive`, { params: { path: { id } } });
      await refetch();
    }

    async function unarchive(id: number) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (apiClient.POST as any)(`${path}/{id}/unarchive`, { params: { path: { id } } });
      await refetch();
    }

    async function remove(id: number) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (apiClient.DELETE as any)(`${path}/{id}`, { params: { path: { id } } });
      if (error) throw new Error(extractErrorMessage(error, 'Cannot delete — try archiving instead.'));
      await refetch();
    }

    return { items, loading, error, refetch, create, createRaw, update, updateRaw, archive, unarchive, remove };
  };
}

export const useCategories = createConfigHook('/api/categories');
export const useIncomeSources = createConfigHook('/api/income-sources');
export const usePaymentMethods = createConfigHook('/api/payment-methods');
export const useTags = createConfigHook('/api/tags');

export interface AppSettings {
  currencyCode: string;
  topExpensesCount: number;
  backupReminderThresholdDays: number;
  backupReminderDue: boolean;
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data } = await apiClient.GET('/api/settings', {});
    setSettings((data as AppSettings) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function update(payload: Partial<AppSettings>) {
    await apiClient.PUT('/api/settings', { body: payload });
    await refetch();
  }

  return { settings, loading, refetch, update };
}
