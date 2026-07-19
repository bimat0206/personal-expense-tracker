import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import { useTaxonomyLookup } from '../../hooks/useTaxonomyLookup';
import { AmountInput } from '../shared/AmountInput';
import { DatePicker } from '../shared/DatePicker';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { todayIso } from '../../utils/date';

interface PurchaseModalProps {
  itemName: string;
  estimatedCostCents: number;
  onClose: () => void;
  onConfirm: (payload: { paymentMethodId: number; amountCents: number; date: string }) => Promise<void>;
}

export function PurchaseModal({ itemName, estimatedCostCents, onClose, onConfirm }: PurchaseModalProps) {
  const { paymentMethods } = useTaxonomyLookup();
  const { parseInput, toDecimalString, loading: currencyLoading } = useCurrencyFormatter();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIso());
  const [paymentMethodId, setPaymentMethodId] = useState<number | undefined>(paymentMethods[0]?.id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPaymentMethodId((current) => current ?? paymentMethods[0]?.id);
  }, [paymentMethods]);
  useEffect(() => {
    if (currencyLoading) return;
    setAmount(toDecimalString(estimatedCostCents));
  }, [currencyLoading, estimatedCostCents, toDecimalString]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!paymentMethodId) {
      setError('Choose a payment method to complete the purchase.');
      return;
    }
    const amountCents = parseInput(amount);
    if (!amountCents) {
      setError('Enter a valid amount.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onConfirm({ paymentMethodId, amountCents, date });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete purchase');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Mark "{itemName}" as purchased</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="form-stack">
          <label>
            Actual amount paid
            <AmountInput value={amount} onChange={setAmount} />
          </label>
          <label>
            Purchase date
            <DatePicker value={date} onChange={setDate} />
          </label>
          <label>
            Payment method
            <select className="input" value={paymentMethodId ?? ''} onChange={(e) => setPaymentMethodId(Number(e.target.value))}>
              <option value="" disabled>Select a payment method</option>
              {paymentMethods.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          {error && <p className="field-error">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Confirm Purchase'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
