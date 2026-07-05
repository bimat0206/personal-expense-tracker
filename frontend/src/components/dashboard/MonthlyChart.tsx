import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { monthName } from '../../utils/date';

interface MonthlyPoint {
  month: number;
  incomeCents: number;
  expenseCents: number;
}

export function MonthlyChart({ monthly }: { monthly: MonthlyPoint[] }) {
  const data = monthly.map((m) => ({
    name: monthName(m.month).slice(0, 3),
    Income: m.incomeCents / 100,
    Expenses: m.expenseCents / 100,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--accent-success)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--accent-success)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--accent-danger)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--accent-danger)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
        <XAxis dataKey="name" stroke="var(--text-secondary)" />
        <YAxis stroke="var(--text-secondary)" tickFormatter={(v) => `$${v}`} />
        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-panel-solid)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
        <Area type="monotone" dataKey="Income" stroke="var(--accent-success)" fillOpacity={1} fill="url(#colorIncome)" />
        <Area type="monotone" dataKey="Expenses" stroke="var(--accent-danger)" fillOpacity={1} fill="url(#colorExpense)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
