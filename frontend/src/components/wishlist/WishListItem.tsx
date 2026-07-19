import { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, CalendarPlus, Trash2 } from 'lucide-react';
import type { components } from '../../../../contracts/generated/types';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { PurchaseModal } from './PurchaseModal';

type WishListItemType = components['schemas']['WishListItem'];

interface WishListItemProps {
  item: WishListItemType;
  nameForCategory: (id: number) => string;
  onPurchase: (payload: { paymentMethodId: number; amountCents: number; date: string }) => Promise<void>;
  onAbandon: () => void;
  onReopen: () => void;
  onCopyToNextMonth: () => void;
  onDelete: () => void;
}

export function WishListItem({
  item,
  nameForCategory,
  onPurchase,
  onAbandon,
  onReopen,
  onCopyToNextMonth,
  onDelete,
}: WishListItemProps) {
  const { format } = useCurrencyFormatter();
  const [purchasing, setPurchasing] = useState(false);

  return (
    <div className={`glass-panel wishlist-card status-${item.status}`}>
      <div className="wishlist-card-main">
        <h4>{item.name}</h4>
        <p className="text-muted">
          {nameForCategory(item.categoryId)}
          {item.priority && ` · ${item.priority} priority`}
        </p>
        {item.note && <p className="text-muted">{item.note}</p>}
      </div>
      <div className="wishlist-card-amount">{format(item.estimatedCostCents)}</div>
      <div className="wishlist-card-actions">
        {item.status === 'planned' && (
          <>
            <button className="btn btn-primary btn-sm" onClick={() => setPurchasing(true)}>
              <CheckCircle2 size={16} /> Mark Purchased
            </button>
            <button className="icon-btn" title="Abandon" onClick={onAbandon}>
              <XCircle size={16} />
            </button>
            <button className="icon-btn" title="Copy to next month" onClick={onCopyToNextMonth}>
              <CalendarPlus size={16} />
            </button>
            <button className="icon-btn" title="Delete" onClick={onDelete}>
              <Trash2 size={16} />
            </button>
          </>
        )}
        {item.status === 'abandoned' && (
          <button className="btn btn-secondary btn-sm" onClick={onReopen}>
            <RotateCcw size={16} /> Reopen
          </button>
        )}
        {item.status === 'purchased' && <span className="badge badge-success">Purchased</span>}
      </div>

      {purchasing && (
        <PurchaseModal
          itemName={item.name}
          estimatedCostCents={item.estimatedCostCents}
          onClose={() => setPurchasing(false)}
          onConfirm={async (payload) => {
            await onPurchase(payload);
            setPurchasing(false);
          }}
        />
      )}
    </div>
  );
}
