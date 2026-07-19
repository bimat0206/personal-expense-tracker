import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../api/client';

export interface Totals {
  incomeCents: number;
  expenseCents: number;
  netCents: number;
}

export interface BreakdownItem {
  id: number;
  amountCents: number;
}

export interface TopExpenseItem {
  id: number;
  date: string;
  amountCents: number;
  categoryId: number;
  note?: string | null;
}

export interface Breakdowns {
  byCategory: BreakdownItem[];
  byIncomeSource: BreakdownItem[];
  byPaymentMethod: BreakdownItem[];
  byTag: BreakdownItem[];
}

export interface YearOption {
  year: number;
  hasData: boolean;
  totals: Totals;
}

export interface AvailableYears {
  years: YearOption[];
}

export interface AnnualDashboardData {
  totals: Totals;
  monthly: { month: number; incomeCents: number; expenseCents: number; netCents: number; breakdowns: Breakdowns }[];
  breakdowns: Breakdowns;
  topExpenses: TopExpenseItem[];
  isPartialPeriod: boolean;
}

export interface MonthlyDashboardData {
  totals: Totals;
  breakdowns: Breakdowns;
  topExpenses: TopExpenseItem[];
  isPartialPeriod: boolean;
}

export interface YearComparisonData {
  yearA: AnnualDashboardData;
  yearB: AnnualDashboardData;
  delta: { incomePct: number | null; expensePct: number | null; netPct: number | null };
}

/**
 * The OpenAPI spec leaves most dashboard response fields optional (no nested `required` arrays),
 * so openapi-fetch's generated types are all-optional here. The backend always populates every
 * field (SYSTEM_DESIGN.md §8), so we cast to the concrete shape once, at the data-fetching layer,
 * rather than scattering non-null assertions through every consuming component.
 */
function useApiResource<T>(fetcher: () => Promise<{ data?: unknown; error?: unknown }>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await fetcher();
      if (apiError) throw new Error('Request failed');
      setData((data as T) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

export function useAvailableYears() {
  return useApiResource<AvailableYears>(() => apiClient.GET('/api/dashboard/years', {}), []);
}

export function useAnnualDashboard(year: number) {
  return useApiResource<AnnualDashboardData>(
    () => apiClient.GET('/api/dashboard/annual', { params: { query: { year } } }),
    [year],
  );
}

export function useMonthlyDashboard(year: number, month: number) {
  return useApiResource<MonthlyDashboardData>(
    () => apiClient.GET('/api/dashboard/monthly', { params: { query: { year, month } } }),
    [year, month],
  );
}

export function useMonthlyBreakdownsForYear(year: number) {
  return useApiResource<Array<{ month: number; breakdowns: Breakdowns }>>(
    async () => {
      const responses = await Promise.all(
        Array.from({ length: 12 }, (_, i) => {
          const month = i + 1;
          return apiClient
            .GET('/api/dashboard/monthly', { params: { query: { year, month } } })
            .then((result) => ({ month, ...result }));
        }),
      );
      const failed = responses.find((r) => r.error);
      return {
        error: failed?.error,
        data: responses.map((r) => ({
          month: r.month,
          breakdowns: (r.data as MonthlyDashboardData | undefined)?.breakdowns ?? {
            byCategory: [],
            byIncomeSource: [],
            byPaymentMethod: [],
            byTag: [],
          },
        })),
      };
    },
    [year],
  );
}

export function useYearComparison(yearA: number, yearB: number) {
  return useApiResource<YearComparisonData>(
    () => apiClient.GET('/api/dashboard/annual/compare', { params: { query: { yearA, yearB } } }),
    [yearA, yearB],
  );
}
