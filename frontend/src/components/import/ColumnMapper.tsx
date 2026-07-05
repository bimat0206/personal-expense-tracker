import { useEffect, useState } from 'react';
import { useTaxonomyLookup } from '../../hooks/useTaxonomyLookup';

export interface CsvMapping {
  date: string;
  note?: string;
  amount?: string;
  type?: string;
  signedAmount?: string;
}

export interface ImportDefaults {
  defaultCategoryId?: number;
  defaultIncomeSourceId?: number;
  defaultPaymentMethodId: number;
}

interface ColumnMapperProps {
  headers: string[];
  onConfirm: (mapping: CsvMapping, defaults: ImportDefaults) => void;
}

export function ColumnMapper({ headers, onConfirm }: ColumnMapperProps) {
  const { categories, incomeSources, paymentMethods } = useTaxonomyLookup();
  const [date, setDate] = useState(headers[0] ?? '');
  const [note, setNote] = useState('');
  const [useSignedAmount, setUseSignedAmount] = useState(false);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('');
  const [signedAmount, setSignedAmount] = useState('');
  const [defaultCategoryId, setDefaultCategoryId] = useState(categories[0]?.id);
  const [defaultIncomeSourceId, setDefaultIncomeSourceId] = useState(incomeSources[0]?.id);
  const [defaultPaymentMethodId, setDefaultPaymentMethodId] = useState(paymentMethods[0]?.id);

  useEffect(() => {
    setDefaultCategoryId((current) => current ?? categories[0]?.id);
  }, [categories]);
  useEffect(() => {
    setDefaultIncomeSourceId((current) => current ?? incomeSources[0]?.id);
  }, [incomeSources]);
  useEffect(() => {
    setDefaultPaymentMethodId((current) => current ?? paymentMethods[0]?.id);
  }, [paymentMethods]);

  function handleConfirm() {
    if (!defaultPaymentMethodId) return;
    const mapping: CsvMapping = useSignedAmount ? { date, note: note || undefined, signedAmount } : { date, note: note || undefined, amount, type };
    onConfirm(mapping, { defaultCategoryId, defaultIncomeSourceId, defaultPaymentMethodId });
  }

  const columnSelect = (value: string, onChange: (v: string) => void, allowNone = false) => (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      {allowNone && <option value="">(none)</option>}
      {headers.map((h) => (
        <option key={h} value={h}>{h}</option>
      ))}
    </select>
  );

  return (
    <div className="glass-panel form-stack">
      <label>
        Date column
        {columnSelect(date, setDate)}
      </label>
      <label>
        Note column
        {columnSelect(note, setNote, true)}
      </label>

      <label className="checkbox-row">
        <input type="checkbox" checked={useSignedAmount} onChange={(e) => setUseSignedAmount(e.target.checked)} />
        Single signed-amount column (positive = income, negative = expense)
      </label>

      {useSignedAmount ? (
        <label>
          Amount column
          {columnSelect(signedAmount, setSignedAmount)}
        </label>
      ) : (
        <>
          <label>
            Amount column
            {columnSelect(amount, setAmount)}
          </label>
          <label>
            Type column (values must read "expense" or "income")
            {columnSelect(type, setType)}
          </label>
        </>
      )}

      <label>
        Default category (for expense rows)
        <select className="input" value={defaultCategoryId ?? ''} onChange={(e) => setDefaultCategoryId(Number(e.target.value))}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label>
        Default income source (for income rows)
        <select className="input" value={defaultIncomeSourceId ?? ''} onChange={(e) => setDefaultIncomeSourceId(Number(e.target.value))}>
          {incomeSources.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label>
        Default payment method (applied to all rows)
        <select className="input" value={defaultPaymentMethodId ?? ''} onChange={(e) => setDefaultPaymentMethodId(Number(e.target.value))}>
          {paymentMethods.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>

      <button className="btn btn-primary" onClick={handleConfirm}>Import</button>
    </div>
  );
}
