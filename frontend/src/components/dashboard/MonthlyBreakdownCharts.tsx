import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { paths } from '../../../../contracts/generated/types';
import { monthName } from '../../utils/date';
import { useTaxonomyLookup } from '../../hooks/useTaxonomyLookup';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

type MonthlyData = paths['/api/dashboard/annual']['get']['responses']['200']['content']['application/json']['monthly'];

const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

function getPaletteColor(id: number) {
  return PALETTE[id % PALETTE.length];
}

const tooltipStyle = {
  backgroundColor: 'var(--bg-panel-solid)',
  border: '1px solid var(--border-color)',
  borderRadius: 8,
  fontSize: '0.85rem',
};



interface MonthlyBreakdownChartsProps {
  monthly: MonthlyData;
}

export function MonthlyBreakdownCharts({ monthly }: MonthlyBreakdownChartsProps) {
  const { nameFor, colorFor } = useTaxonomyLookup();
  const { config, format, formatCompactAmount } = useCurrencyFormatter();

  // Extract unique IDs across all months for the keys
  const catIds = new Set<number>();
  const srcIds = new Set<number>();
  const pmIds = new Set<number>();

  (monthly || []).forEach(m => {
    (m.breakdowns?.byCategory || []).forEach(b => {
      if (b.id != null) catIds.add(b.id);
    });
    (m.breakdowns?.byIncomeSource || []).forEach(b => {
      if (b.id != null) srcIds.add(b.id);
    });
    (m.breakdowns?.byPaymentMethod || []).forEach(b => {
      if (b.id != null) pmIds.add(b.id);
    });
  });

  const catKeys = Array.from(catIds);
  const srcKeys = Array.from(srcIds);
  const pmKeys = Array.from(pmIds);

  const data = (monthly || []).map(m => {
    const row: any = { name: monthName(m.month!).slice(0, 3) };
    catKeys.forEach(id => {
      row[`cat_${id}`] = 0;
    });
    srcKeys.forEach(id => {
      row[`src_${id}`] = 0;
    });
    pmKeys.forEach(id => {
      row[`pm_${id}`] = 0;
    });
    (m.breakdowns?.byCategory || []).forEach(b => {
      if (b.id == null) return;
      row[`cat_${b.id}`] = (b.amountCents || 0) / config.multiplier;
    });
    (m.breakdowns?.byIncomeSource || []).forEach(b => {
      if (b.id == null) return;
      row[`src_${b.id}`] = (b.amountCents || 0) / config.multiplier;
    });
    (m.breakdowns?.byPaymentMethod || []).forEach(b => {
      if (b.id == null) return;
      row[`pm_${b.id}`] = (b.amountCents || 0) / config.multiplier;
    });
    return row;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', marginTop: '2rem' }}>
      
      {catKeys.length > 0 && (
        <div className="glass-panel chart-panel">
          <h3>Expenses by Category (Monthly)</h3>
          <div className="chart-container" style={{ height: '300px', padding: '1rem 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  {catKeys.map(id => {
                    const color = colorFor.category(id) || getPaletteColor(id);
                    return (
                      <linearGradient key={id} id={`colorCat${id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                <YAxis stroke="var(--text-secondary)" tickFormatter={(v) => formatCompactAmount(Number(v))} tick={{ fontSize: 11 }} width={64} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any, name: any) => [format(Math.round(Number(v) * config.multiplier)), nameFor.category(Number(String(name).replace('cat_', '')))]} />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} formatter={(v) => nameFor.category(Number(String(v).replace('cat_', '')))} />
                {catKeys.map(id => {
                  const color = colorFor.category(id) || getPaletteColor(id);
                  return (
                    <Area key={id} type="monotone" dataKey={`cat_${id}`} stackId="a" stroke={color} fillOpacity={1} fill={`url(#colorCat${id})`} />
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {srcKeys.length > 0 && (
        <div className="glass-panel chart-panel">
          <h3>Income by Source (Monthly)</h3>
          <div className="chart-container" style={{ height: '300px', padding: '1rem 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  {srcKeys.map(id => {
                    const color = colorFor.incomeSource(id) || getPaletteColor(id);
                    return (
                      <linearGradient key={id} id={`colorSrc${id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                <YAxis stroke="var(--text-secondary)" tickFormatter={(v) => formatCompactAmount(Number(v))} tick={{ fontSize: 11 }} width={64} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any, name: any) => [format(Math.round(Number(v) * config.multiplier)), nameFor.incomeSource(Number(String(name).replace('src_', '')))]} />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} formatter={(v) => nameFor.incomeSource(Number(String(v).replace('src_', '')))} />
                {srcKeys.map(id => {
                  const color = colorFor.incomeSource(id) || getPaletteColor(id);
                  return (
                    <Area key={id} type="monotone" dataKey={`src_${id}`} stackId="a" stroke={color} fillOpacity={1} fill={`url(#colorSrc${id})`} />
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {pmKeys.length > 0 && (
        <div className="glass-panel chart-panel">
          <h3>Spending by Payment Method (Monthly)</h3>
          <div className="chart-container" style={{ height: '300px', padding: '1rem 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  {pmKeys.map(id => {
                    const color = getPaletteColor(id);
                    return (
                      <linearGradient key={id} id={`colorPm${id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                <YAxis stroke="var(--text-secondary)" tickFormatter={(v) => formatCompactAmount(Number(v))} tick={{ fontSize: 11 }} width={64} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: any, name: any) => [format(Math.round(Number(v) * config.multiplier)), nameFor.paymentMethod(Number(String(name).replace('pm_', '')))]} />
                <Legend wrapperStyle={{ fontSize: '0.8rem' }} formatter={(v) => nameFor.paymentMethod(Number(String(v).replace('pm_', '')))} />
                {pmKeys.map(id => {
                  const color = getPaletteColor(id);
                  return (
                    <Area key={id} type="monotone" dataKey={`pm_${id}`} stackId="a" stroke={color} fillOpacity={1} fill={`url(#colorPm${id})`} />
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
}
