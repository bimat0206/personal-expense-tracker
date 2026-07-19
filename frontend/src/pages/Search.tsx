import { useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { useTaxonomyLookup } from '../hooks/useTaxonomyLookup';
import { TransactionList } from '../components/transactions/TransactionList';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { EmptyState } from '../components/shared/EmptyState';

export function Search() {
  const [input, setInput] = useState('');
  const { query, items, nextCursor, loading, error, search, loadMore } = useSearch();
  const { nameFor } = useTaxonomyLookup();

  return (
    <div className="page-stack">
      <div className="workspace-header">
        <div>
          <p className="eyebrow">Find anything</p>
          <h2>Search</h2>
          <p className="text-muted">Search notes, tags, categories, income sources, and payment methods across your full history.</p>
        </div>
      </div>

      <div className="glass-panel search-bar">
        <SearchIcon size={18} />
        <input
          className="input search-input"
          placeholder="Search by note, tag, category, income source, or payment method…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search(input)}
        />
        <button className="btn btn-primary" onClick={() => search(input)}>Search</button>
      </div>

      {loading && <LoadingSpinner />}
      {error && !loading && <EmptyState title="Search failed" description={error} />}

      {!loading && !error && query && items.length === 0 && (
        <EmptyState title={`No results for "${query}"`} description="Try a different word or check your spelling." />
      )}

      {!query && !loading && (
        <EmptyState icon={<SearchIcon size={32} />} title="Type to search" description="Find any past transaction across all time." />
      )}

      {items.length > 0 && (
        <>
          <TransactionList
            items={items}
            nameForCategory={nameFor.category}
            nameForIncomeSource={nameFor.incomeSource}
            nameForPaymentMethod={nameFor.paymentMethod}
          />
          {nextCursor !== null && (
            <button className="btn btn-secondary" onClick={loadMore}>Load more</button>
          )}
        </>
      )}
    </div>
  );
}
