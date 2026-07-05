import { todayIso } from '../../utils/date';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  max?: string;
}

export function DatePicker({ value, onChange, max = todayIso() }: DatePickerProps) {
  return <input type="date" className="input" value={value} max={max} onChange={(e) => onChange(e.target.value)} />;
}
