import { useState } from 'react';
import { useAnnualDashboard, useAvailableYears, useMonthlyBreakdownsForYear, useYearComparison } from '../hooks/useDashboard';
import { useTaxonomyLookup } from '../hooks/useTaxonomyLookup';
import { TotalsCard } from '../components/dashboard/TotalsCard';
import { MonthlyChart } from '../components/dashboard/MonthlyChart';
import { MonthlyBreakdownCharts } from '../components/dashboard/MonthlyBreakdownCharts';
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
  const { data: monthlyBreakdowns } = useMonthlyBreakdownsForYear(year);
  const { data: comparison } = useYearComparison(compareYear ?? year - 1, year);
  const { nameFor } = useTaxonomyLookup();
  const monthlyForBreakdownCharts = data?.monthly.map((month) => ({
    ...month,
    breakdowns: month.breakdowns ?? monthlyBreakdowns?.find((m) => m.month === month.month)?.breakdowns ?? {
      byCategory: [],
      byIncomeSource: [],
      byPaymentMethod: [],
      byTag: [],
    },
  })) ?? [];

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

          <section className="dashboard-primary-grid">
            <div className="glass-panel chart-panel">
              <div className="chart-panel-header">
                <div>
                  <p className="section-kicker">Cash flow</p>
                  <h3>Income, expenses & net by month</h3>
                  <p className="chart-subtitle">Compare money in and out while the line tracks monthly savings.</p>
                </div>
              </div>
              <div className="chart-container">
                <MonthlyChart monthly={data.monthly} />
              </div>
            </div>
            <TopExpenses items={data.topExpenses} nameForCategory={nameFor.category} />
          </section>

          <div className="section-heading">
            <div>
              <p className="section-kicker">Composition</p>
              <h3>Where the year went</h3>
              <p className="text-muted">Ranked totals across your key dimensions.</p>
            </div>
          </div>
          <section className="dashboard-grid">
            <BreakdownTable title="Spending by category" items={data.breakdowns.byCategory} nameFor={nameFor.category} />
            <BreakdownTable title="Income by source" items={data.breakdowns.byIncomeSource} nameFor={nameFor.incomeSource} />
            <BreakdownTable title="Payment methods" items={data.breakdowns.byPaymentMethod} nameFor={nameFor.paymentMethod} />
            <BreakdownTable title="Tags" items={data.breakdowns.byTag} nameFor={nameFor.tag} />
          </section>

          <div className="section-heading">
            <div>
              <p className="section-kicker">Monthly mix</p>
              <h3>How your patterns changed</h3>
              <p className="text-muted">Track category, source, and payment-method shifts through the year.</p>
            </div>
          </div>
          <MonthlyBreakdownCharts monthly={monthlyForBreakdownCharts} />

          {years && years.years.length > 1 && (
            <div className="glass-panel chart-panel">
              <div className="chart-panel-header">
                <div>
                  <p className="section-kicker">Long view</p>
                  <h3>Multi-year trend</h3>
                  <p className="chart-subtitle">See whether income, spending, and savings are moving in the right direction.</p>
                </div>
              </div>
              <div className="chart-container compact">
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
