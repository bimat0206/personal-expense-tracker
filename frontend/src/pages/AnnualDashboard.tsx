import { useState } from 'react';
import { useAnnualDashboard, useAvailableYears, useYearComparison } from '../hooks/useDashboard';
import { useTaxonomyLookup } from '../hooks/useTaxonomyLookup';
import { TotalsCard } from '../components/dashboard/TotalsCard';
import { MonthlyChart } from '../components/dashboard/MonthlyChart';
import { YearPicker } from '../components/dashboard/YearPicker';
import { MultiYearTrend } from '../components/dashboard/MultiYearTrend';
import { YearComparison } from '../components/dashboard/YearComparison';
import { BreakdownTable } from '../components/dashboard/BreakdownTable';
import { TopExpenses } from '../components/dashboard/TopExpenses';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { EmptyState } from '../components/shared/EmptyState';
import { currentYear } from '../utils/date';

export function AnnualDashboard() {
  const [year, setYear] = useState(currentYear());
  const [compareYear, setCompareYear] = useState<number | null>(null);
  const { data: years, loading: yearsLoading } = useAvailableYears();
  const { data, loading, error } = useAnnualDashboard(year);
  const { data: comparison } = useYearComparison(compareYear ?? year - 1, year);
  const { nameFor } = useTaxonomyLookup();

  if (yearsLoading) return <LoadingSpinner label="Loading dashboard…" />;

  return (
    <div className="page-stack">
      <div className="workspace-header">
        <div>
          <p className="eyebrow">Annual status</p>
          <h2>Finance Overview</h2>
          <p className="text-muted">Scan yearly cash flow, spending concentration, and year-over-year movement.</p>
        </div>
        <div className="header-actions">
          {years && years.years.length > 0 && (
            <YearPicker years={years.years} selected={year} onChange={setYear} />
          )}
        </div>
      </div>

      {error && <EmptyState title="Couldn't load dashboard" description={error} />}

      {loading && <LoadingSpinner />}

      {data && !loading && (
        <>
          <section className="totals-grid">
            <TotalsCard label="Total Income" valueCents={data.totals.incomeCents} tone="income" />
            <TotalsCard label="Total Expenses" valueCents={data.totals.expenseCents} tone="expense" />
            <TotalsCard label="Net Savings" valueCents={data.totals.netCents} tone="net" />
          </section>
          {data.isPartialPeriod && <p className="text-muted">Showing year-to-date figures for {year}.</p>}

          <div className="glass-panel chart-panel">
            <h3>Cash Flow by Month</h3>
            <div className="chart-container">
              <MonthlyChart monthly={data.monthly} />
            </div>
          </div>

          <div className="dashboard-grid">
            <BreakdownTable title="By Category" items={data.breakdowns.byCategory} nameFor={nameFor.category} />
            <BreakdownTable title="By Income Source" items={data.breakdowns.byIncomeSource} nameFor={nameFor.incomeSource} />
            <BreakdownTable title="By Payment Method" items={data.breakdowns.byPaymentMethod} nameFor={nameFor.paymentMethod} />
            <BreakdownTable title="By Tag" items={data.breakdowns.byTag} nameFor={nameFor.tag} />
          </div>

          <TopExpenses items={data.topExpenses} nameForCategory={nameFor.category} />

          {years && years.years.length > 1 && (
            <div className="glass-panel chart-panel">
              <h3>Multi-Year Trend</h3>
              <div className="chart-container">
                <MultiYearTrend years={years.years} />
              </div>
            </div>
          )}

          {years && years.years.length > 1 && (
            <div className="comparison-section">
              <div className="page-header">
                <h3>Compare Years</h3>
                <select
                  className="input"
                  value={compareYear ?? year - 1}
                  onChange={(e) => setCompareYear(Number(e.target.value))}
                >
                  {years.years.filter((y) => y.year !== year).map((y) => (
                    <option key={y.year} value={y.year}>
                      vs. {y.year}
                    </option>
                  ))}
                </select>
              </div>
              {comparison && (
                <YearComparison
                  yearA={compareYear ?? year - 1}
                  yearB={year}
                  dataA={comparison.yearA}
                  dataB={comparison.yearB}
                  delta={comparison.delta}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
