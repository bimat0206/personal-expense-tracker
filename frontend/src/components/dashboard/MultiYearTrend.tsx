import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

interface YearTotals {
  year: number;
  totals: { incomeCents: number; expenseCents: number; netCents: number };
}

export function MultiYearTrend({ years }: { years: YearTotals[] }) {
  const { config, format, formatCompactAmount } = useCurrencyFormatter();
  const data = years.map((year) => ({
    name: String(year.year),
    Income: year.totals.incomeCents / config.multiplier,
    Expenses: year.totals.expenseCents / config.multiplier,
    Net: year.totals.netCents / config.multiplier,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 12, right: 14, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} dy={8} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(value) => formatCompactAmount(Number(value))} width={60} />
        <Tooltip formatter={(value) => format(Math.round(Number(value) * config.multiplier))} contentStyle={{ background: 'var(--bg-panel-solid)', border: '1px solid var(--border-color)', borderRadius: 8, boxShadow: 'var(--shadow-md)' }} />
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '12px', paddingTop: '18px' }} />
        <Line type="monotone" dataKey="Income" stroke="var(--accent-success)" strokeWidth={2.5} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="Expenses" stroke="var(--accent-danger)" strokeWidth={2.5} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="Net" stroke="var(--accent-secondary)" strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
