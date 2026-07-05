import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, CalendarDays } from 'lucide-react';
import { useTransactions, deleteTransaction } from '../hooks/useTransactions';
import { useTaxonomyLookup } from '../hooks/useTaxonomyLookup';
import { useMonthlyDashboard } from '../hooks/useDashboard';
import { useWishList } from '../hooks/useWishList';
import { MonthYearSwitcher } from '../components/shared/MonthYearSwitcher';
import { TransactionFilters } from '../components/transactions/TransactionFilters';
import type { TransactionFilterValues } from '../components/transactions/TransactionFilters';
import { TransactionList } from '../components/transactions/TransactionList';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { EmptyState } from '../components/shared/EmptyState';
import { TotalsCard } from '../components/dashboard/TotalsCard';
import { BreakdownTable } from '../components/dashboard/BreakdownTable';
import { TopExpenses } from '../components/dashboard/TopExpenses';
import { TransactionForm } from './TransactionForm';
import { currentYear, currentMonth } from '../utils/date';
import { centsToDisplay } from '../utils/currency';
import type { components } from '../../../contracts/generated/types';

type Transaction = components['schemas']['Transaction'];

export function Transactions() {
  const params = useParams();
  const navigate = useNavigate();
  const year = Number(params.year) || currentYear();
  const month = Number(params.month) || currentMonth();

  const [filters, setFilters] = useState<TransactionFilterValues>({});
  const [editing, setEditing] = useState<Transaction | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);

  const { items, total, loading, error, refetch } = useTransactions({ year, month, ...filters });
  const { data: monthData, loading: monthLoading, error: monthError } = useMonthlyDashboard(year, month);
  const { estimatedTotalCents } = useWishList(year, month);
  const { nameFor } = useTaxonomyLookup();

  function goTo(y: number, m: number) {
    navigate(`/transactions/${y}/${m}`);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await deleteTransaction(deleteTarget.id);
    setDeleteTarget(null);
    refetch();
  }

  return (
    <div className="page-stack">
      <div className="workspace-header">
        <div>
          <p className="eyebrow">Monthly workspace</p>
          <h2>Transactions</h2>
          <p className="text-muted">Review this month, adjust filters, and keep the ledger current.</p>
        </div>
        <div className="header-actions">
          <MonthYearSwitcher year={year} month={month} onChange={goTo} />
          <button className="btn btn-primary" onClick={() => setEditing('new')}>
            <Plus size={18} />
            New Transaction
          </button>
        </div>
      </div>

      {monthLoading && <LoadingSpinner label="Loading monthly status…" />}
      {monthError && !monthLoading && <EmptyState title="Couldn't load monthly status" description={monthError} />}

      {monthData && !monthLoading && (
        <>
          <section className="finance-summary">
            <TotalsCard label="Income" valueCents={monthData.totals.incomeCents} tone="income" />
            <TotalsCard label="Expenses" valueCents={monthData.totals.expenseCents} tone="expense" />
            <TotalsCard label="Net Savings" valueCents={monthData.totals.netCents} tone="net" />
            <div className="summary-tile planned-tile">
              <div className="summary-tile-icon"><CalendarDays size={18} /></div>
              <h4>Planned Wish List</h4>
              <p className="totals-value">{centsToDisplay(estimatedTotalCents)}</p>
            </div>
          </section>

          {monthData.isPartialPeriod && (
            <div className="status-strip">
              <span>Month-to-date figures</span>
              <strong>{total} transaction{total === 1 ? '' : 's'} recorded</strong>
            </div>
          )}

          <section className="monthly-insights">
            <BreakdownTable title="Category Spend" items={monthData.breakdowns.byCategory} nameFor={nameFor.category} />
            <BreakdownTable title="Payment Methods" items={monthData.breakdowns.byPaymentMethod} nameFor={nameFor.paymentMethod} />
            <TopExpenses items={monthData.topExpenses} nameForCategory={nameFor.category} />
          </section>
        </>
      )}

      <section className="ledger-section">
        <div className="section-heading">
          <div>
            <h3>Ledger</h3>
            <p className="text-muted">{total} transaction{total === 1 ? '' : 's'} match the current view</p>
          </div>
        </div>

        <div className="filters-panel">
          <TransactionFilters value={filters} onChange={setFilters} />
        </div>

        {loading && <LoadingSpinner />}
        {error && !loading && <EmptyState title="Couldn't load transactions" description={error} />}

        {!loading && !error && (
          <TransactionList
            items={items}
            nameForCategory={nameFor.category}
            nameForIncomeSource={nameFor.incomeSource}
            nameForPaymentMethod={nameFor.paymentMethod}
            onEdit={(t) => setEditing(t)}
            onDelete={(t) => setDeleteTarget(t)}
          />
        )}
      </section>

      {editing && (
        <TransactionForm
          transaction={editing === 'new' ? undefined : editing}
          defaultDate={`${year}-${String(month).padStart(2, '0')}-01`}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refetch();
          }}
        />
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <h3>Delete this transaction?</h3>
            <p className="text-muted">This can't be undone. If it was created from a Wish List purchase, that item will revert to planned.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
