import { ChevronLeft, ChevronRight } from 'lucide-react';
import { monthName, shiftMonth, isCurrentMonth } from '../../utils/date';

interface MonthYearSwitcherProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

/** The primary way users move between months across Transactions, Monthly Dashboard, and Wish List. */
export function MonthYearSwitcher({ year, month, onChange }: MonthYearSwitcherProps) {
  const currentCalendarYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentCalendarYear - 5 + i);

  function go(delta: number) {
    const next = shiftMonth(year, month, delta);
    onChange(next.year, next.month);
  }

  return (
    <div className="month-switcher">
      <button type="button" className="icon-btn" aria-label="Previous month" onClick={() => go(-1)}>
        <ChevronLeft size={20} />
      </button>
      <div className="month-switcher-label" aria-label="Selected month and year">
        <select
          className="input month-select"
          aria-label="Month"
          value={month}
          onChange={(e) => onChange(year, Number(e.target.value))}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>{monthName(m)}</option>
          ))}
        </select>
        <select
          className="input year-select"
          aria-label="Year"
          value={year}
          onChange={(e) => onChange(Number(e.target.value), month)}
        >
          {!yearOptions.includes(year) && <option value={year}>{year}</option>}
          {yearOptions.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      <button type="button" className="icon-btn" aria-label="Next month" onClick={() => go(1)}>
        <ChevronRight size={20} />
      </button>
      {!isCurrentMonth(year, month) && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onChange(new Date().getFullYear(), new Date().getMonth() + 1)}
        >
          Today
        </button>
      )}
    </div>
  );
}
