import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { centsToDisplay } from '../../utils/currency';

interface BreakdownItem {
  id: number;
  amountCents: number;
}

interface BreakdownTableProps {
  title: string;
  items: BreakdownItem[];
  nameFor: (id: number) => string;
  emptyLabel?: string;
  /** How many rows to show before collapsing. Default: 5 */
  initialVisible?: number;
}

export function BreakdownTable({ title, items, nameFor, emptyLabel = 'No data yet', initialVisible = 5 }: BreakdownTableProps) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...items].sort((a, b) => b.amountCents - a.amountCents);
  const max = sorted[0]?.amountCents ?? 0;
  const total = sorted.reduce((s, i) => s + i.amountCents, 0);
  const visible = expanded ? sorted : sorted.slice(0, initialVisible);
  const hasMore = sorted.length > initialVisible;

  return (
    <div className="glass-panel breakdown-table">
      <div className="breakdown-header">
        <h4>{title}</h4>
        {sorted.length > 0 && (
          <span className="breakdown-total">{centsToDisplay(total)}</span>
        )}
      </div>
      {sorted.length === 0 && <p className="text-muted">{emptyLabel}</p>}
      <div className="breakdown-list">
        {visible.map((item) => {
          const name = nameFor(item.id);
          const pct = max ? Math.round((item.amountCents / max) * 100) : 0;
          return (
            <div key={item.id} className="breakdown-row">
              <div className="breakdown-name" title={name}>{name}</div>
              <div className="breakdown-bar-track">
                <div className="breakdown-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="breakdown-amount">{centsToDisplay(item.amountCents)}</span>
            </div>
          );
        })}
      </div>
      {hasMore && (
        <button className="breakdown-expand-btn" onClick={() => setExpanded((e) => !e)}>
          {expanded ? (
            <><ChevronUp size={14} /> Show less</>
          ) : (
            <><ChevronDown size={14} /> Show {sorted.length - initialVisible} more</>
          )}
        </button>
      )}
    </div>
  );
}
