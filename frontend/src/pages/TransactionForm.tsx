import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import type { components } from '../../../contracts/generated/types';
import { apiClient } from '../api/client';
import { useTaxonomyLookup } from '../hooks/useTaxonomyLookup';
import { AmountInput } from '../components/shared/AmountInput';
import { DatePicker } from '../components/shared/DatePicker';
import { TagPicker } from '../components/shared/TagPicker';
import { AttachmentUpload } from '../components/shared/AttachmentUpload';
import { decimalToCents, centsToDecimalString } from '../utils/currency';
import { todayIso } from '../utils/date';

type Transaction = components['schemas']['Transaction'];

interface TransactionFormProps {
  transaction?: Transaction;
  defaultDate?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function TransactionForm({ transaction, defaultDate, onClose, onSaved }: TransactionFormProps) {
  const { categories, incomeSources, paymentMethods, tags } = useTaxonomyLookup();
  const [type, setType] = useState<'expense' | 'income'>(transaction?.type ?? 'expense');
  const [date, setDate] = useState(transaction?.date ?? defaultDate ?? todayIso());
  const [amount, setAmount] = useState(transaction ? centsToDecimalString(transaction.amountCents) : '');
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? categories[0]?.id);
  const [incomeSourceId, setIncomeSourceId] = useState(transaction?.incomeSourceId ?? incomeSources[0]?.id);
  const [paymentMethodId, setPaymentMethodId] = useState(transaction?.paymentMethodId ?? paymentMethods[0]?.id);
  const [note, setNote] = useState(transaction?.note ?? '');
  const [tagIds, setTagIds] = useState<number[]>(transaction?.tags?.map((t) => t.id) ?? []);
  const [attachmentId, setAttachmentId] = useState(transaction?.attachmentId ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Taxonomy lists load asynchronously after mount, so the picked-on-mount default above can
  // still be `undefined` the first time this renders — backfill it once the lists arrive.
  useEffect(() => {
    if (transaction) return;
    setCategoryId((current) => current ?? categories[0]?.id);
  }, [categories, transaction]);
  useEffect(() => {
    if (transaction) return;
    setIncomeSourceId((current) => current ?? incomeSources[0]?.id);
  }, [incomeSources, transaction]);
  useEffect(() => {
    if (transaction) return;
    setPaymentMethodId((current) => current ?? paymentMethods[0]?.id);
  }, [paymentMethods, transaction]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const amountCents = decimalToCents(amount);
    if (!amountCents) {
      setError('Enter a valid amount greater than zero.');
      return;
    }
    if (type === 'expense' && !categoryId) {
      setError('Pick a category, or add one in Settings first.');
      return;
    }
    if (type === 'income' && !incomeSourceId) {
      setError('Pick an income source, or add one in Settings first.');
      return;
    }
    if (!paymentMethodId) {
      setError('Pick a payment method, or add one in Settings first.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        type,
        date,
        amountCents,
        categoryId: type === 'expense' ? categoryId : undefined,
        incomeSourceId: type === 'income' ? incomeSourceId : undefined,
        paymentMethodId,
        note: note || undefined,
        tagIds,
      };
      const { error: apiError } = transaction
        ? await apiClient.PUT('/api/transactions/{id}', { params: { path: { id: transaction.id } }, body })
        : await apiClient.POST('/api/transactions', { body });
      if (apiError) throw new Error('Could not save this transaction. Check the fields and try again.');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this transaction.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{transaction ? 'Edit Transaction' : 'New Transaction'}</h3>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-stack">
          <div className="type-toggle">
            <button type="button" className={type === 'expense' ? 'active' : ''} onClick={() => setType('expense')}>
              Expense
            </button>
            <button type="button" className={type === 'income' ? 'active' : ''} onClick={() => setType('income')}>
              Income
            </button>
          </div>

          <div className="form-row">
            <label>
              Amount
              <AmountInput value={amount} onChange={setAmount} />
            </label>
            <label>
              Date
              <DatePicker value={date} onChange={setDate} />
            </label>
          </div>

          {type === 'expense' ? (
            <label>
              Category
              <select className="input" value={categoryId ?? ''} onChange={(e) => setCategoryId(Number(e.target.value))}>
                <option value="" disabled>Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              Income Source
              <select className="input" value={incomeSourceId ?? ''} onChange={(e) => setIncomeSourceId(Number(e.target.value))}>
                <option value="" disabled>Select an income source</option>
                {incomeSources.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
          )}

          <label>
            Payment Method
            <select className="input" value={paymentMethodId ?? ''} onChange={(e) => setPaymentMethodId(Number(e.target.value))}>
              <option value="" disabled>Select a payment method</option>
              {paymentMethods.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>

          <label>
            Note
            <input className="input" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
          </label>

          <div>
            <span className="field-label">Tags</span>
            <TagPicker allTags={tags} selectedIds={tagIds} onChange={setTagIds} />
          </div>

          {transaction && (
            <div>
              <span className="field-label">Receipt</span>
              <AttachmentUpload
                transactionId={transaction.id}
                attachmentId={attachmentId}
                onChanged={() => setAttachmentId(attachmentId ? null : 'uploaded')}
              />
            </div>
          )}

          {error && <p className="field-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
