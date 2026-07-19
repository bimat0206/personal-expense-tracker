import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { formatDateDisplay } from '../../utils/date';

interface TopExpenseItem {
  id: number;
  date: string;
  amountCents: number;
  categoryId: number;
  note?: string | null;
}

interface TopExpensesProps {
  items: TopExpenseItem[];
  nameForCategory: (id: number) => string;
  /** How many to show before collapsing. Default: 5 */
  initialVisible?: number;
}

export function TopExpenses({ items, nameForCategory, initialVisible = 5 }: TopExpensesProps) {
  const { format } = useCurrencyFormatter();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, initialVisible);
  const hasMore = items.length > initialVisible;

  return (
    <div className="glass-panel top-expenses">
      <div className="breakdown-header">
        <h4>Top Expenses</h4>
        {items.length > 0 && (
          <span className="breakdown-total text-muted" style={{ fontSize: '0.85rem' }}>
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      {items.length === 0 && <p className="text-muted">No expenses this period</p>}
      {visible.map((item) => (
        <div key={item.id} className="top-expense-row">
          <div className="top-expense-info">
            <div className="top-expense-note" title={item.note ?? undefined}>
              {item.note || nameForCategory(item.categoryId)}
            </div>
            <div className="text-muted top-expense-date">
              {formatDateDisplay(item.date)} · {nameForCategory(item.categoryId)}
            </div>
          </div>
          <span className="top-expense-amount">{format(item.amountCents)}</span>
        </div>
      ))}
      {hasMore && (
        <button className="breakdown-expand-btn" onClick={() => setExpanded((e) => !e)}>
          {expanded ? (
            <><ChevronUp size={14} /> Show less</>
          ) : (
            <><ChevronDown size={14} /> Show {items.length - initialVisible} more</>
          )}
        </button>
      )}
    </div>
  );
}
