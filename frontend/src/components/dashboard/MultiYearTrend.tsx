import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface YearTotals {
  year: number;
  totals: { incomeCents: number; expenseCents: number; netCents: number };
}

export function MultiYearTrend({ years }: { years: YearTotals[] }) {
  const data = years.map((y) => ({
    name: String(y.year),
    Income: y.totals.incomeCents / 100,
    Expenses: y.totals.expenseCents / 100,
    Net: y.totals.netCents / 100,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
        <XAxis dataKey="name" stroke="var(--text-secondary)" />
        <YAxis stroke="var(--text-secondary)" tickFormatter={(v) => `$${v}`} />
        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-panel-solid)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
        <Legend />
        <Line type="monotone" dataKey="Income" stroke="var(--accent-success)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Expenses" stroke="var(--accent-danger)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="Net" stroke="var(--accent-primary)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
