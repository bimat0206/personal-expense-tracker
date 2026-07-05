import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { monthName } from '../../utils/date';

interface MonthlyPoint {
  month: number;
  incomeCents: number;
  expenseCents: number;
}

const tooltipStyle = {
  backgroundColor: 'var(--bg-panel-solid)',
  border: '1px solid var(--border-color)',
  borderRadius: 8,
  fontSize: '0.85rem',
};

function formatK(v: number) {
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${v.toFixed(0)}`;
}

function NetTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const net = payload[0]?.value ?? 0;
  return (
    <div style={{ ...tooltipStyle, padding: '0.6rem 0.9rem' }}>
      <p style={{ fontWeight: 600, marginBottom: '0.3rem' }}>{label}</p>
      <p style={{ color: net >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
        Net: {net >= 0 ? '+' : ''}{formatK(net)}
      </p>
    </div>
  );
}

/** Side-by-side income / expense bar chart per month */
export function MonthBreakdownChart({ monthly }: { monthly: MonthlyPoint[] }) {
  const data = monthly.map((m) => ({
    name: monthName(m.month).slice(0, 3),
    Income: Math.round(m.incomeCents / 100),
    Expenses: Math.round(m.expenseCents / 100),
    Net: Math.round((m.incomeCents - m.expenseCents) / 100),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* --- Income vs Expenses grouped bars --- */}
      <div>
        <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Income vs Expenses — monthly
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }} barCategoryGap="30%" barGap={3}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
            <YAxis stroke="var(--text-secondary)" tickFormatter={formatK} tick={{ fontSize: 11 }} width={52} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, undefined]} />
            <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
            <Bar dataKey="Income" fill="var(--accent-success)" radius={[4, 4, 0, 0]} maxBarSize={32} />
            <Bar dataKey="Expenses" fill="var(--accent-danger)" radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* --- Net savings per month --- */}
      <div>
        <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Net savings — monthly
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
            <YAxis stroke="var(--text-secondary)" tickFormatter={formatK} tick={{ fontSize: 11 }} width={52} />
            <Tooltip content={<NetTooltip />} />
            <ReferenceLine y={0} stroke="var(--border-color)" strokeWidth={1.5} />
            <Bar dataKey="Net" radius={[4, 4, 0, 0]} maxBarSize={32}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.Net >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
