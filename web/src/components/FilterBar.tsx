'use client';

import { REPORT_STATUS_LABELS } from '@/lib/constants';
import type { ReportCategory } from '@/lib/api';
import DateInput from '@/components/DateInput';

type FilterBarProps = {
  categories: ReportCategory[];
  selectedCategory: string | null;
  selectedStatus: string | null;
  dateFrom: string;
  dateTo: string;
  onCategoryChange: (id: string | null) => void;
  onStatusChange: (status: string | null) => void;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  colonias?: string[];
  selectedColonia?: string | null;
  onColoniaChange?: (colonia: string | null) => void;
  /** Total de reportes que coinciden con los filtros aplicados */
  totalFiltered?: number;
  /** Solo móvil: barra retraíble. Cuando false, se muestra solo el botón "Filtros". */
  mobileExpanded?: boolean;
  onMobileToggle?: () => void;
};

const STATUS_IDS = ['PENDING', 'CHANNELED', 'IN_PROGRESS', 'RESOLVED'] as const;

export default function FilterBar({
  categories,
  selectedCategory,
  selectedStatus,
  dateFrom,
  dateTo,
  onCategoryChange,
  onStatusChange,
  onDateFromChange,
  onDateToChange,
  colonias = [],
  selectedColonia = null,
  onColoniaChange,
  totalFiltered,
  mobileExpanded = false,
  onMobileToggle,
}: FilterBarProps) {
  const selectClass =
    'bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] min-w-0';

  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const totalText = totalFiltered !== undefined ? `${totalFiltered} ${totalFiltered === 1 ? 'reporte' : 'reportes'}` : '';

  return (
    <div className="bg-[var(--overlay-panel)] rounded-xl border border-[var(--border)] shadow-lg overflow-hidden">
      {/* Solo móvil: botón para abrir/cerrar filtros (en escritorio no se muestra) */}
      {onMobileToggle && (
        <button
          type="button"
          onClick={onMobileToggle}
          className="sm:hidden w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] active:bg-[var(--border)] transition-colors"
          aria-expanded={mobileExpanded}
        >
          <span className="flex items-center gap-2">
            <span aria-hidden className="text-[var(--accent)]">{mobileExpanded ? '▼' : '▶'}</span>
            Filtros
          </span>
          {totalText ? <span className="text-xs text-[var(--text-muted)]">{totalText}</span> : null}
        </button>
      )}
      {/* Contenido: en móvil colapsable, en escritorio siempre visible */}
      <div className={`flex flex-wrap items-center gap-3 sm:gap-4 p-3 sm:p-4 ${onMobileToggle && !mobileExpanded ? 'max-sm:hidden' : ''}`}>
      {/* Colonia */}
      {colonias.length > 0 && onColoniaChange && (
        <div className="flex items-center gap-1.5 max-sm:flex-col max-sm:items-stretch">
          <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">Colonia</span>
          <select
            value={selectedColonia ?? ''}
            onChange={(e) => onColoniaChange(e.target.value || null)}
            className={selectClass}
          >
            <option value="">Todas</option>
            {colonias.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}
      {/* Categoría y Estado: en móvil en la misma fila */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 max-sm:flex-nowrap max-sm:gap-2">
        <div className="flex items-center gap-1.5 max-sm:flex-col max-sm:items-stretch">
          <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">Categoría</span>
          <select
            value={selectedCategory ?? ''}
            onChange={(e) => onCategoryChange(e.target.value || null)}
            className={selectClass}
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5 max-sm:flex-col max-sm:items-stretch">
          <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">Estado</span>
          <select
            value={selectedStatus ?? ''}
            onChange={(e) => onStatusChange(e.target.value || null)}
            className={selectClass}
          >
            <option value="">Todos</option>
            {STATUS_IDS.map((s) => (
              <option key={s} value={s}>{REPORT_STATUS_LABELS[s] || s}</option>
            ))}
          </select>
        </div>
      </div>
      {/* Rango de fechas: en móvil en la misma fila */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 max-sm:flex-nowrap max-sm:gap-2">
        <label className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] max-sm:flex-col max-sm:items-stretch">
          <span className="whitespace-nowrap">Desde</span>
          <DateInput
            value={dateFrom}
            onChange={onDateFromChange}
            maxDate={dateTo || undefined}
            placeholder="dd/mm/aaaa"
            className={selectClass}
          />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] max-sm:flex-col max-sm:items-stretch">
          <span className="whitespace-nowrap">Hasta</span>
          <DateInput
            value={dateTo}
            onChange={onDateToChange}
            minDate={dateFrom || undefined}
            maxDate={today}
            placeholder="dd/mm/aaaa"
            className={selectClass}
          />
        </label>
      </div>
      {/* Total según filtros (en móvil ya se muestra en el botón cuando está colapsado) */}
      {totalFiltered !== undefined && (
        <span className="ml-auto text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">
          {totalFiltered} {totalFiltered === 1 ? 'reporte' : 'reportes'}
        </span>
      )}
      </div>
    </div>
  );
}
