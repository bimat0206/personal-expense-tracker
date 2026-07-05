import type { components } from '../../../../contracts/generated/types';
import { TransactionRow } from './TransactionRow';
import { EmptyState } from '../shared/EmptyState';
import { Receipt, TrendingDown, TrendingUp } from 'lucide-react';

type Transaction = components['schemas']['Transaction'];

interface TransactionListProps {
  items: Transaction[];
  nameForCategory: (id: number) => string;
  nameForIncomeSource: (id: number) => string;
  nameForPaymentMethod: (id: number) => string;
  onEdit?: (t: Transaction) => void;
  onDelete?: (t: Transaction) => void;
}

function formatAmount(cents: number): string {
  return (cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function TransactionList({ items, onEdit, onDelete, ...names }: TransactionListProps) {
  const expenses = items.filter((t) => t.type === 'expense');
  const incomes = items.filter((t) => t.type === 'income');

  const totalExpenseAmount = expenses.reduce((sum, t) => sum + t.amountCents, 0);
  const totalIncomeAmount = incomes.reduce((sum, t) => sum + t.amountCents, 0);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Receipt size={32} />}
        title="No transactions yet"
        description="Add your first income or expense for this month to see it here."
      />
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem', alignItems: 'start' }}>
      {/* Expenses Section */}
      <section>
        <div className="section-heading" style={{ marginBottom: '1rem' }}>
          <h4>Expenses <span className="tx-tab-badge" style={{ marginLeft: '0.5rem' }}>{expenses.length}</span></h4>
        </div>
        {expenses.length === 0 ? (
          <EmptyState
            icon={<TrendingDown size={32} />}
            title="No expenses this month"
            description="Add a new expense entry."
          />
        ) : (
          <div className="glass-panel transaction-table-wrap">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th className="align-right">Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((t) => (
                  <TransactionRow
                    key={t.id}
                    transaction={t}
                    nameForCategory={names.nameForCategory}
                    nameForIncomeSource={names.nameForIncomeSource}
                    nameForPaymentMethod={names.nameForPaymentMethod}
                    onEdit={onEdit ? () => onEdit(t) : undefined}
                    onDelete={onDelete ? () => onDelete(t) : undefined}
                  />
                ))}
              </tbody>
            </table>
            <div className="tx-subtotal">
              <span className="tx-subtotal-count">
                {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
              </span>
              <span className="tx-subtotal-amount" style={{ color: 'var(--accent-danger)' }}>
                Total: {formatAmount(totalExpenseAmount)}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Income Section */}
      <section>
        <div className="section-heading" style={{ marginBottom: '1rem' }}>
          <h4>Income <span className="tx-tab-badge" style={{ marginLeft: '0.5rem' }}>{incomes.length}</span></h4>
        </div>
        {incomes.length === 0 ? (
          <EmptyState
            icon={<TrendingUp size={32} />}
            title="No income this month"
            description="Add a new income entry."
          />
        ) : (
          <div className="glass-panel transaction-table-wrap">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Source</th>
                  <th className="align-right">Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((t) => (
                  <TransactionRow
                    key={t.id}
                    transaction={t}
                    nameForCategory={names.nameForCategory}
                    nameForIncomeSource={names.nameForIncomeSource}
                    nameForPaymentMethod={names.nameForPaymentMethod}
                    onEdit={onEdit ? () => onEdit(t) : undefined}
                    onDelete={onDelete ? () => onDelete(t) : undefined}
                  />
                ))}
              </tbody>
            </table>
            <div className="tx-subtotal">
              <span className="tx-subtotal-count">
                {incomes.length} {incomes.length === 1 ? 'income' : 'incomes'}
              </span>
              <span className="tx-subtotal-amount" style={{ color: 'var(--accent-success)' }}>
                Total: {formatAmount(totalIncomeAmount)}
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
