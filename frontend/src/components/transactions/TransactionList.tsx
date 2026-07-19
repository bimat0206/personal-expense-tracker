import type { components } from '../../../../contracts/generated/types';
import { TransactionRow } from './TransactionRow';
import { EmptyState } from '../shared/EmptyState';
import { Receipt } from 'lucide-react';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

type Transaction = components['schemas']['Transaction'];

interface TransactionListProps {
  items: Transaction[];
  nameForCategory: (id: number) => string;
  nameForIncomeSource: (id: number) => string;
  nameForPaymentMethod: (id: number) => string;
  onEdit?: (t: Transaction) => void;
  onDelete?: (t: Transaction) => void;
}

export function TransactionList({ items, onEdit, onDelete, ...names }: TransactionListProps) {
  const { format } = useCurrencyFormatter();
  const expenses = items.filter((t) => t.type === 'expense');
  const incomes = items.filter((t) => t.type === 'income');
  const hasExpenses = expenses.length > 0;
  const hasIncomes = incomes.length > 0;
  const ledgerGridClass = `ledger-grid ${hasExpenses && hasIncomes ? 'split' : 'single'}`;

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
    <div className={ledgerGridClass}>
      {/* Expenses Section */}
      {hasExpenses && (
      <section>
        <div className="section-heading" style={{ marginBottom: '1rem' }}>
          <h4>Expenses <span className="tx-tab-badge" style={{ marginLeft: '0.5rem' }}>{expenses.length}</span></h4>
        </div>
        <div className="glass-panel transaction-table-wrap">
          <table className="transaction-table">
            <thead>
              <tr>
                <th className="tx-date-col">Date</th>
                <th>Description</th>
                <th className="tx-category-col">Category</th>
                <th className="tx-amount-col align-right">Amount</th>
                <th className="tx-actions-col">Actions</th>
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
              Total: {format(totalExpenseAmount)}
            </span>
          </div>
        </div>
      </section>
      )}

      {/* Income Section */}
      {hasIncomes && (
      <section>
        <div className="section-heading" style={{ marginBottom: '1rem' }}>
          <h4>Income <span className="tx-tab-badge" style={{ marginLeft: '0.5rem' }}>{incomes.length}</span></h4>
        </div>
        <div className="glass-panel transaction-table-wrap">
          <table className="transaction-table">
            <thead>
              <tr>
                <th className="tx-date-col">Date</th>
                <th>Description</th>
                <th className="tx-category-col">Source</th>
                <th className="tx-amount-col align-right">Amount</th>
                <th className="tx-actions-col">Actions</th>
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
            <span className="tx-subtotal-amount tone-income">
              Total: {format(totalIncomeAmount)}
            </span>
          </div>
        </div>
      </section>
      )}
    </div>
  );
}
}
);
}
