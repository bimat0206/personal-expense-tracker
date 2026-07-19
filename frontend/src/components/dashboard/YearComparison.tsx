import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';
import { formatPercentChange, percentChangeTone } from '../../utils/percentage';

interface YearData {
  totals: { incomeCents: number; expenseCents: number; netCents: number };
}

interface YearComparisonProps {
  yearA: number;
  yearB: number;
  dataA: YearData;
  dataB: YearData;
  delta: { incomePct: number | null; expensePct: number | null; netPct: number | null };
}

export function YearComparison({ yearA, yearB, dataA, dataB, delta }: YearComparisonProps) {
  const { format } = useCurrencyFormatter();

  function Row({
    label,
    a,
    b,
    pct,
    higherIsBetter,
  }: {
    label: string;
    a: number;
    b: number;
    pct: number | null;
    higherIsBetter: boolean;
  }) {
    return (
      <div className="comparison-row">
        <span className="comparison-label">{label}</span>
        <span>{format(a)}</span>
        <span>{format(b)}</span>
        <span className={`pct-change tone-${percentChangeTone(pct, higherIsBetter)}`}>{formatPercentChange(pct)}</span>
      </div>
    );
  }

  return (
    <div className="glass-panel comparison-table">
      <div className="comparison-row comparison-header">
        <span />
        <span>{yearA}</span>
        <span>{yearB}</span>
        <span>Change</span>
      </div>
      <Row label="Income" a={dataA.totals.incomeCents} b={dataB.totals.incomeCents} pct={delta.incomePct} higherIsBetter />
      <Row label="Expenses" a={dataA.totals.expenseCents} b={dataB.totals.expenseCents} pct={delta.expensePct} higherIsBetter={false} />
      <Row label="Net Savings" a={dataA.totals.netCents} b={dataB.totals.netCents} pct={delta.netPct} higherIsBetter />
    </div>
  );
}
