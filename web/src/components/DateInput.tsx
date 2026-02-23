'use client';

import { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('es', es);

const DATE_FORMAT = 'dd/MM/yyyy';

/** Convierte string yyyy-MM-dd a Date (mediodía UTC para evitar desfase por zona) */
function parseDate(s: string): Date | null {
  if (!s?.trim()) return null;
  const d = new Date(s + 'T12:00:00.000Z');
  return isNaN(d.getTime()) ? null : d;
}

/** Convierte Date a string yyyy-MM-dd */
function formatForValue(d: Date | null): string {
  if (!d) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type DateInputProps = {
  value: string;
  onChange: (value: string) => void;
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  className?: string;
  id?: string;
};

export default function DateInput({
  value,
  onChange,
  minDate,
  maxDate,
  placeholder = 'dd/mm/aaaa',
  className = '',
  id,
}: DateInputProps) {
  const date = parseDate(value);
  const min = minDate ? parseDate(minDate) : undefined;
  const max = maxDate ? parseDate(maxDate) : undefined;

  return (
    <DatePicker
      id={id}
      selected={date}
      onChange={(d: Date | null) => onChange(formatForValue(d))}
      dateFormat={DATE_FORMAT}
      locale="es"
      placeholderText={placeholder}
      minDate={min ?? undefined}
      maxDate={max ?? undefined}
      className={className}
      showMonthDropdown
      showYearDropdown
      dropdownMode="select"
    />
  );
}
