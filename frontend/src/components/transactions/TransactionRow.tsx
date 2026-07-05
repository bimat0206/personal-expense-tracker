import { Paperclip, Pencil, Trash2 } from 'lucide-react';
import type { components } from '../../../../contracts/generated/types';
import { signedCentsToDisplay } from '../../utils/currency';
import { formatDateDisplay } from '../../utils/date';

type Transaction = components['schemas']['Transaction'];

interface TransactionRowProps {
  transaction: Transaction;
  nameForCategory: (id: number) => string;
  nameForIncomeSource: (id: number) => string;
  nameForPaymentMethod: (id: number) => string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TransactionRow({
  transaction: t,
  nameForCategory,
  nameForIncomeSource,
  nameForPaymentMethod,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  const categoryLabel = t.type === 'expense' ? nameForCategory(t.categoryId!) : nameForIncomeSource(t.incomeSourceId!);

  return (
    <tr className="transaction-row">
      <td>{formatDateDisplay(t.date)}</td>
      <td>
        <div className="transaction-note">{t.note || '—'}</div>
        <div className="text-muted transaction-meta">
          {nameForPaymentMethod(t.paymentMethodId)}
          {t.attachmentId && <Paperclip size={12} />}
        </div>
        {t.tags && t.tags.length > 0 && (
          <div className="transaction-tags">
            {t.tags.map((tag) => (
              <span key={tag.id} className="tag-chip small">
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </td>
      <td>
        <span className={`badge badge-${t.type}`}>{categoryLabel}</span>
      </td>
      <td className={`transaction-amount tone-${t.type}`}>{signedCentsToDisplay(t.amountCents, t.type)}</td>
      <td className="transaction-actions">
        {onEdit && (
          <button type="button" className="icon-btn" aria-label="Edit" onClick={onEdit}>
            <Pencil size={16} />
          </button>
        )}
        {onDelete && (
          <button type="button" className="icon-btn" aria-label="Delete" onClick={onDelete}>
            <Trash2 size={16} />
          </button>
        )}
      </td>
    </tr>
  );
}
