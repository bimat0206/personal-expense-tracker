import { ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

interface TotalsCardProps {
  label: string;
  valueCents: number;
  tone: 'income' | 'expense' | 'net';
}

const ICONS = {
  income: ArrowDownLeft,
  expense: ArrowUpRight,
  net: Scale,
};

export function TotalsCard({ label, valueCents, tone }: TotalsCardProps) {
  const { format } = useCurrencyFormatter();
  const Icon = ICONS[tone];

  return (
    <div className={`glass-panel totals-card tone-${tone}`}>
      <div className="totals-card-header">
        <h4>{label}</h4>
        <span className="totals-icon" aria-hidden="true"><Icon size={16} /></span>
      </div>
      <p className={`totals-value tone-${tone}`}>{format(valueCents)}</p>
    </div>
  );
}
