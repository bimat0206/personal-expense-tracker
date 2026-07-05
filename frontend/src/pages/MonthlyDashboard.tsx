import { useNavigate, useParams } from 'react-router-dom';
import { useMonthlyDashboard } from '../hooks/useDashboard';
import { useWishList } from '../hooks/useWishList';
import { useTaxonomyLookup } from '../hooks/useTaxonomyLookup';
import { MonthYearSwitcher } from '../components/shared/MonthYearSwitcher';
import { TotalsCard } from '../components/dashboard/TotalsCard';
import { BreakdownTable } from '../components/dashboard/BreakdownTable';
import { TopExpenses } from '../components/dashboard/TopExpenses';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { EmptyState } from '../components/shared/EmptyState';
import { centsToDisplay } from '../utils/currency';
import { currentYear, currentMonth } from '../utils/date';

export function MonthlyDashboard() {
  const params = useParams();
  const navigate = useNavigate();
  const year = Number(params.year) || currentYear();
  const month = Number(params.month) || currentMonth();

  const { data, loading, error } = useMonthlyDashboard(year, month);
  const { estimatedTotalCents } = useWishList(year, month);
  const { nameFor } = useTaxonomyLookup();

  function goTo(y: number, m: number) {
    navigate(`/monthly/${y}/${m}`);
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <h2>Monthly Dashboard</h2>
        <MonthYearSwitcher year={year} month={month} onChange={goTo} />
      </div>

      {error && <EmptyState title="Couldn't load this month" description={error} />}
      {loading && <LoadingSpinner />}

      {data && !loading && (
        <>
          <div className="totals-grid">
            <TotalsCard label="Income" valueCents={data.totals.incomeCents} tone="income" />
            <TotalsCard label="Expenses" valueCents={data.totals.expenseCents} tone="expense" />
            <TotalsCard label="Net Savings" valueCents={data.totals.netCents} tone="net" />
          </div>

          {data.isPartialPeriod && <p className="text-muted">This month is still in progress — figures are month-to-date.</p>}

          {estimatedTotalCents > 0 && (
            <div className="glass-panel wishlist-callout">
              <span>Planned purchases this month (Wish List reference, not included above):</span>
              <strong>{centsToDisplay(estimatedTotalCents)}</strong>
            </div>
          )}

          <div className="dashboard-grid">
            <BreakdownTable title="By Category" items={data.breakdowns.byCategory} nameFor={nameFor.category} />
            <BreakdownTable title="By Income Source" items={data.breakdowns.byIncomeSource} nameFor={nameFor.incomeSource} />
            <BreakdownTable title="By Payment Method" items={data.breakdowns.byPaymentMethod} nameFor={nameFor.paymentMethod} />
            <BreakdownTable title="By Tag" items={data.breakdowns.byTag} nameFor={nameFor.tag} />
          </div>

          <TopExpenses items={data.topExpenses} nameForCategory={nameFor.category} />
        </>
      )}
    </div>
  );
}
