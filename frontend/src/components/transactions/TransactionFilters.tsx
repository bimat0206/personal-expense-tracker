import { useTaxonomyLookup } from '../../hooks/useTaxonomyLookup';

export interface TransactionFilterValues {
  categoryId?: number;
  incomeSourceId?: number;
  paymentMethodId?: number;
  tagId?: number;
}

interface TransactionFiltersProps {
  value: TransactionFilterValues;
  onChange: (value: TransactionFilterValues) => void;
}

export function TransactionFilters({ value, onChange }: TransactionFiltersProps) {
  const { categories, incomeSources, paymentMethods, tags } = useTaxonomyLookup();

  function set(field: keyof TransactionFilterValues, raw: string) {
    onChange({ ...value, [field]: raw ? Number(raw) : undefined });
  }

  return (
    <div className="filters-row">
      <select className="input" value={value.categoryId ?? ''} onChange={(e) => set('categoryId', e.target.value)}>
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <select className="input" value={value.incomeSourceId ?? ''} onChange={(e) => set('incomeSourceId', e.target.value)}>
        <option value="">All income sources</option>
        {incomeSources.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <select className="input" value={value.paymentMethodId ?? ''} onChange={(e) => set('paymentMethodId', e.target.value)}>
        <option value="">All payment methods</option>
        {paymentMethods.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <select className="input" value={value.tagId ?? ''} onChange={(e) => set('tagId', e.target.value)}>
        <option value="">All tags</option>
        {tags.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}
