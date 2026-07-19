import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

interface TotalsCardProps {
  label: string;
  valueCents: number;
  tone: 'income' | 'expense' | 'net';
}

export function TotalsCard({ label, valueCents, tone }: TotalsCardProps) {
  const { format } = useCurrencyFormatter();
  return (
    <div className="glass-panel totals-card">
      <h4>{label}</h4>
      <p className={`totals-value tone-${tone}`}>{format(valueCents)}</p>
    </div>
  );
}
