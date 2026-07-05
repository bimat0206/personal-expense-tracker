import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Play, Pause } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useTaxonomyLookup } from '../../hooks/useTaxonomyLookup';
import { AmountInput } from '../../components/shared/AmountInput';
import { DatePicker } from '../../components/shared/DatePicker';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { EmptyState } from '../../components/shared/EmptyState';
import { centsToDisplay, decimalToCents } from '../../utils/currency';
import { todayIso } from '../../utils/date';
import type { components } from '../../../../contracts/generated/types';

type RecurringRule = components['schemas']['RecurringRule'];

export function RecurringRules() {
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { categories, incomeSources, paymentMethods, nameFor } = useTaxonomyLookup();

  async function refetch() {
    setLoading(true);
    const { data } = await apiClient.GET('/api/recurring-rules', { params: { query: { includeStopped: true } } });
    setRules(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refetch();
  }, []);

  async function toggle(rule: RecurringRule) {
    const path = rule.active ? '/api/recurring-rules/{id}/stop' : '/api/recurring-rules/{id}/resume';
    await apiClient.POST(path, { params: { path: { id: rule.id } } });
    refetch();
  }

  return (
    <div className="glass-panel config-list">
      <div className="page-header">
        <h3>Recurring Transactions</h3>
        <button className="btn btn-secondary btn-sm" onClick={() => setShowForm((s) => !s)}>
          <Plus size={16} /> Add
        </button>
      </div>

      {showForm && (
        <RuleForm
          categories={categories}
          incomeSources={incomeSources}
          paymentMethods={paymentMethods}
          onSaved={() => {
            setShowForm(false);
            refetch();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading && <LoadingSpinner />}
      {!loading && rules.length === 0 && <EmptyState title="No recurring rules yet" description="Automate bills like rent or subscriptions." />}

      <ul className="config-item-list">
        {rules.map((rule) => (
          <li key={rule.id} className={!rule.active ? 'archived' : ''}>
            <span className="config-item-name">
              {centsToDisplay(rule.amountCents)} · {rule.frequency} ·{' '}
              {rule.type === 'expense' ? nameFor.category(rule.categoryId!) : nameFor.incomeSource(rule.incomeSourceId!)}
            </span>
            <span className="text-muted">from {rule.startDate}</span>
            <div className="config-item-actions">
              <button type="button" className="icon-btn" title={rule.active ? 'Stop' : 'Resume'} onClick={() => toggle(rule)}>
                {rule.active ? <Pause size={16} /> : <Play size={16} />}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface RuleFormProps {
  categories: { id: number; name: string }[];
  incomeSources: { id: number; name: string }[];
  paymentMethods: { id: number; name: string }[];
  onSaved: () => void;
  onCancel: () => void;
}

function RuleForm({ categories, incomeSources, paymentMethods, onSaved, onCancel }: RuleFormProps) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id);
  const [incomeSourceId, setIncomeSourceId] = useState(incomeSources[0]?.id);
  const [paymentMethodId, setPaymentMethodId] = useState(paymentMethods[0]?.id);
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCategoryId((current) => current ?? categories[0]?.id);
  }, [categories]);
  useEffect(() => {
    setIncomeSourceId((current) => current ?? incomeSources[0]?.id);
  }, [incomeSources]);
  useEffect(() => {
    setPaymentMethodId((current) => current ?? paymentMethods[0]?.id);
  }, [paymentMethods]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const amountCents = decimalToCents(amount);
    if (!amountCents || !paymentMethodId) {
      setError('Fill in a valid amount and payment method.');
      return;
    }
    const { error: apiError } = await apiClient.POST('/api/recurring-rules', {
      body: {
        type,
        amountCents,
        categoryId: type === 'expense' ? categoryId : undefined,
        incomeSourceId: type === 'income' ? incomeSourceId : undefined,
        paymentMethodId,
        frequency,
        startDate,
      },
    });
    if (apiError) {
      setError('Could not save this rule.');
      return;
    }
    onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="config-item-form form-stack">
      <div className="type-toggle">
        <button type="button" className={type === 'expense' ? 'active' : ''} onClick={() => setType('expense')}>Expense</button>
        <button type="button" className={type === 'income' ? 'active' : ''} onClick={() => setType('income')}>Income</button>
      </div>
      <AmountInput value={amount} onChange={setAmount} />
      {type === 'expense' ? (
        <select className="input" value={categoryId ?? ''} onChange={(e) => setCategoryId(Number(e.target.value))}>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      ) : (
        <select className="input" value={incomeSourceId ?? ''} onChange={(e) => setIncomeSourceId(Number(e.target.value))}>
          {incomeSources.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}
      <select className="input" value={paymentMethodId ?? ''} onChange={(e) => setPaymentMethodId(Number(e.target.value))}>
        {paymentMethods.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select className="input" value={frequency} onChange={(e) => setFrequency(e.target.value as typeof frequency)}>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </select>
      <DatePicker value={startDate} onChange={setStartDate} max="2999-12-31" />
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary btn-sm">Save</button>
      </div>
      {error && <p className="field-error">{error}</p>}
    </form>
  );
}
