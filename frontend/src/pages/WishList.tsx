import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Heart } from 'lucide-react';
import { useWishList } from '../hooks/useWishList';
import { useTaxonomyLookup } from '../hooks/useTaxonomyLookup';
import { MonthYearSwitcher } from '../components/shared/MonthYearSwitcher';
import { WishListItem } from '../components/wishlist/WishListItem';
import { AmountInput } from '../components/shared/AmountInput';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { EmptyState } from '../components/shared/EmptyState';
import { useCurrencyFormatter } from '../hooks/useCurrencyFormatter';
import { currentYear, currentMonth } from '../utils/date';

export function WishList() {
  const params = useParams();
  const navigate = useNavigate();
  const year = Number(params.year) || currentYear();
  const month = Number(params.month) || currentMonth();

  const { items, estimatedTotalCents, loading: itemsLoading, error, create, updateItem, remove, purchase, copyToNextMonth } =
    useWishList(year, month);
  const { categories, nameFor } = useTaxonomyLookup();
  const { format, parseInput } = useCurrencyFormatter();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [amountValue, setAmountValue] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(categories[0]?.id);
  const [formError, setFormError] = useState<string | null>(null);

  // Categories load asynchronously; backfill the default once they arrive.
  useEffect(() => {
    setCategoryId((current) => current ?? categories[0]?.id);
  }, [categories]);

  function goTo(y: number, m: number) {
    navigate(`/wishlist/${y}/${m}`);
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const cents = parseInput(amountValue);
    if (!name.trim() || !cents || !categoryId) {
      setFormError('Fill in a name, a valid cost, and a category.');
      return;
    }
    setFormError(null);
    await create({ name, estimatedCostCents: cents, categoryId });
    setName('');
    setAmountValue('');
    setShowForm(false);
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <h2>Wish List</h2>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
          <Plus size={18} /> Add Item
        </button>
      </div>

      <div className="page-header">
        <MonthYearSwitcher year={year} month={month} onChange={goTo} />
        <span className="text-muted">Planned this month: {format(estimatedTotalCents)}</span>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="glass-panel form-inline">
          <input className="input" placeholder="What do you want to buy?" value={name} onChange={(e) => setName(e.target.value)} />
          <AmountInput value={amountValue} onChange={setAmountValue} placeholder="Estimated cost" />
          <select className="input" value={categoryId ?? ''} onChange={(e) => setCategoryId(Number(e.target.value))}>
            <option value="" disabled>Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">Save</button>
          {formError && <p className="field-error">{formError}</p>}
        </form>
      )}

      {itemsLoading && <LoadingSpinner />}
      {error && !itemsLoading && <EmptyState title="Couldn't load your wish list" description={error} />}

      {!itemsLoading && !error && items.length === 0 && (
        <EmptyState
          icon={<Heart size={32} />}
          title="Nothing planned for this month"
          description="Add something you're thinking about buying to plan ahead."
        />
      )}

      <div className="wishlist-grid">
        {items.map((item) => (
          <WishListItem
            key={item.id}
            item={item}
            nameForCategory={nameFor.category}
            onPurchase={(payload) => purchase(item.id, payload).then(() => {})}
            onAbandon={() => updateItem(item.id, { status: 'abandoned' })}
            onReopen={() => updateItem(item.id, { status: 'planned' })}
            onCopyToNextMonth={() => copyToNextMonth(item.id)}
            onDelete={() => remove(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
