import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { paths } from '../../../../contracts/generated/types';
import { monthName } from '../../utils/date';
import { useTaxonomyLookup } from '../../hooks/useTaxonomyLookup';
import { useCurrencyFormatter } from '../../hooks/useCurrencyFormatter';

type MonthlyData = paths['/api/dashboard/annual']['get']['responses']['200']['content']['application/json']['monthly'];
type BreakdownKey = 'byCategory' | 'byPaymentMethod';

const PALETTE = [
  '#7c3aed', '#2563eb', '#0891b2', '#0d9488', '#16a34a', '#65a30d',
  '#ca8a04', '#ea580c', '#dc2626', '#db2777', '#9333ea', '#4f46e5',
];

const tooltipStyle = {
  backgroundColor: 'var(--bg-panel-solid)',
  border: '1px solid var(--border-color)',
  borderRadius: 10,
  boxShadow: 'var(--shadow-md)',
  fontSize: '0.8rem',
};

interface MonthlyBreakdownChartsProps {
  monthly: MonthlyData;
}

interface VerticalTrendProps {
  title: string;
  subtitle: string;
  ids: number[];
  monthly: MonthlyData;
  breakdownKey: BreakdownKey;
  nameFor: (id: number) => string;
  multiplier: number;
  format: (value: number) => string;
  formatCompactAmount: (value: number) => string;
}

function VerticalTrendChart({
  title,
  subtitle,
  ids,
  monthly,
  breakdownKey,
  nameFor,
  multiplier,
  format,
  formatCompactAmount,
}: VerticalTrendProps) {
  const monthSeries = (monthly || []).map((month) => ({
    key: `month_${month.month}`,
    label: monthName(month.month!).slice(0, 3),
    month: month.month!,
  }));

  const rows = ids
    .map((id) => {
      const row: Record<string, string | number> = { id, name: nameFor(id), total: 0 };
      monthSeries.forEach(({ key, month }) => {
        const monthlyPoint = monthly.find((item) => item.month === month);
        const amount = monthlyPoint?.breakdowns?.[breakdownKey]?.find((item) => item.id === id)?.amountCents ?? 0;
        row[key] = amount / multiplier;
        row.total = Number(row.total) + amount;
      });
      return row;
    })
    .sort((a, b) => Number(b.total) - Number(a.total));

  const chartHeight = Math.max(250, rows.length * 44 + 72);
  const labelWidth = Math.min(320, Math.max(150, ...rows.map((row) => String(row.name).length * 7.2 + 24)));

  return (
    <div className="glass-panel chart-panel">
      <div className="chart-panel-header">
        <div>
          <h3>{title}</h3>
          <p className="chart-subtitle">{subtitle}</p>
        </div>
        <span className="chart-count">{rows.length} items</span>
      </div>
      <div className="vertical-chart-scroll">
        <div className="vertical-chart-canvas" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={rows} margin={{ top: 8, right: 18, left: 8, bottom: 8 }} barCategoryGap="22%">
              <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                tickFormatter={(value) => formatCompactAmount(Number(value))}
              />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                interval={0}
                width={labelWidth}
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, label) => [format(Math.round(Number(value) * multiplier)), label]}
              />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '11px', paddingTop: '14px' }} />
              {monthSeries.map(({ key, label }, index) => (
                <Bar key={key} dataKey={key} name={label} stackId="months" fill={PALETTE[index % PALETTE.length]} maxBarSize={25} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export function MonthlyBreakdownCharts({ monthly }: MonthlyBreakdownChartsProps) {
  const { nameFor, colorFor } = useTaxonomyLookup();
  const { config, format, formatCompactAmount } = useCurrencyFormatter();

  const catIds = new Set<number>();
  const srcIds = new Set<number>();
  const pmIds = new Set<number>();

  (monthly || []).forEach((month) => {
    (month.breakdowns?.byCategory || []).forEach((item) => item.id != null && catIds.add(item.id));
    (month.breakdowns?.byIncomeSource || []).forEach((item) => item.id != null && srcIds.add(item.id));
    (month.breakdowns?.byPaymentMethod || []).forEach((item) => item.id != null && pmIds.add(item.id));
  });

  const catKeys = Array.from(catIds);
  const srcKeys = Array.from(srcIds);
  const pmKeys = Array.from(pmIds);

  const timelineData = (monthly || []).map((month) => {
    const row: Record<string, string | number> = { name: monthName(month.month!).slice(0, 3) };
    srcKeys.forEach((id) => { row[`src_${id}`] = 0; });
    (month.breakdowns?.byIncomeSource || []).forEach((item) => {
      if (item.id != null) row[`src_${item.id}`] = (item.amountCents || 0) / config.multiplier;
    });
    return row;
  });

  return (
    <div className="chart-stack">
      {catKeys.length > 0 && (
        <VerticalTrendChart
          title="Category trend"
          subtitle="Categories listed vertically; each bar is split by month. Scroll to see the full list."
          ids={catKeys}
          monthly={monthly}
          breakdownKey="byCategory"
          nameFor={nameFor.category}
          multiplier={config.multiplier}
          format={format}
          formatCompactAmount={formatCompactAmount}
        />
      )}

      {srcKeys.length > 0 && (
        <div className="glass-panel chart-panel">
          <div className="chart-panel-header"><div><h3>Income-source trend</h3><p className="chart-subtitle">Monthly income composition</p></div></div>
          <div className="chart-container compact">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }} barCategoryGap="20%">
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => formatCompactAmount(Number(value))} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={64} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [format(Math.round(Number(value) * config.multiplier)), nameFor.incomeSource(Number(String(name).replace('src_', '')))]} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '11px' }} formatter={(value) => nameFor.incomeSource(Number(String(value).replace('src_', '')))} />
                {srcKeys.map((id) => (
                  <Bar key={id} dataKey={`src_${id}`} stackId="source" fill={colorFor.incomeSource(id) || PALETTE[id % PALETTE.length]} maxBarSize={30} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {pmKeys.length > 0 && (
        <VerticalTrendChart
          title="Payment-method trend"
          subtitle="Payment methods listed vertically; each bar is split by month."
          ids={pmKeys}
          monthly={monthly}
          breakdownKey="byPaymentMethod"
          nameFor={nameFor.paymentMethod}
          multiplier={config.multiplier}
          format={format}
          formatCompactAmount={formatCompactAmount}
        />
      )}
    </div>
  );
}
