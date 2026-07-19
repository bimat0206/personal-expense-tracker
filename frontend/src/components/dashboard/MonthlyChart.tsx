import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { monthName } from '../../utils/date';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

interface MonthlyPoint {
  month: number;
  incomeCents: number;
  expenseCents: number;
}

function CashFlowTooltip({ active, payload, label, format, multiplier }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((entry: any) => (
        <div className="chart-tooltip-row" key={entry.dataKey}>
          <span><span className="chart-tooltip-dot" style={{ background: entry.color }} />{entry.name}</span>
          <strong>{format(Math.round(Number(entry.value) * multiplier))}</strong>
        </div>
      ))}
    </div>
  );
}

export function MonthlyChart({ monthly }: { monthly: MonthlyPoint[] }) {
  const { config, format, formatCompactAmount } = useCurrencyFormatter();
  const data = monthly.map((m) => ({
    name: monthName(m.month).slice(0, 3),
    Income: m.incomeCents / config.multiplier,
    Expenses: m.expenseCents / config.multiplier,
    Net: (m.incomeCents - m.expenseCents) / config.multiplier,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }} barGap={3}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} dy={8} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(value) => formatCompactAmount(Number(value))} width={60} />
        <Tooltip content={<CashFlowTooltip format={format} multiplier={config.multiplier} />} cursor={{ fill: 'var(--bg-subtle)', opacity: 0.7 }} />
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '12px', paddingTop: '18px' }} />
        <Bar dataKey="Income" fill="var(--accent-success)" radius={[4, 4, 0, 0]} maxBarSize={24} />
        <Bar dataKey="Expenses" fill="var(--accent-danger)" radius={[4, 4, 0, 0]} maxBarSize={24} />
        <Line type="monotone" dataKey="Net" stroke="var(--accent-secondary)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
