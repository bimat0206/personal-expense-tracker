interface YearOption {
  year: number;
  hasData: boolean;
}

interface YearPickerProps {
  years: YearOption[];
  selected: number;
  onChange: (year: number) => void;
}

export function YearPicker({ years, selected, onChange }: YearPickerProps) {
  return (
    <div className="year-picker">
      {years.map((y) => (
        <button
          key={y.year}
          type="button"
          className={`year-chip ${y.year === selected ? 'selected' : ''} ${!y.hasData ? 'no-data' : ''}`}
          onClick={() => onChange(y.year)}
          title={y.hasData ? undefined : 'No data logged this year'}
        >
          {y.year}
        </button>
      ))}
    </div>
  );
}
