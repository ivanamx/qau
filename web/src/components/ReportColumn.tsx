'use client';

import type { Report } from '@/lib/api';
import { reportPhotoUrl } from '@/lib/api';
import { REPORT_STATUS_LABELS, REPORT_STATUS_MARKER_FILL, REPORT_STATUS_MARKER_BORDER } from '@/lib/constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DateInput from '@/components/DateInput';

type ReportColumnProps = {
  reports: Report[];
  categories: { id: string; label: string }[];
  view: 'live' | 'historial';
  onViewChange: (v: 'live' | 'historial') => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (d: string) => void;
  onDateToChange: (d: string) => void;
  isLoading?: boolean;
  selectedReportId?: string | null;
  onReportSelect?: (id: string | null) => void;
};

function ReportCard({ report, categoryLabel, isSelected, onSelect }: { report: Report; categoryLabel: string; isSelected?: boolean; onSelect?: () => void }) {
  return (
    <article
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={onSelect ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } } : undefined}
      className={`bg-[var(--bg-card)]/95 backdrop-blur border rounded-xl overflow-hidden transition-colors ${isSelected ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]' : 'border-[var(--border)]'} ${onSelect ? 'cursor-pointer hover:border-[var(--text-muted)]' : ''}`}
    >
      <div className="flex gap-3 p-3">
        {report.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={reportPhotoUrl(report.photoUrl)}
            alt=""
            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-[var(--bg-elevated)] flex-shrink-0 flex items-center justify-center text-[var(--text-muted)] text-xs">
            Sin foto
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-[#a855f7]">
              {categoryLabel}
            </span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded border"
              style={{
                background: REPORT_STATUS_MARKER_FILL[report.status] || 'var(--map-fill-accent)',
                color: REPORT_STATUS_MARKER_BORDER[report.status] || 'var(--map-border-accent)',
                borderColor: REPORT_STATUS_MARKER_BORDER[report.status] || 'var(--map-border-accent)',
              }}
            >
              {REPORT_STATUS_LABELS[report.status] || report.status}
            </span>
          </div>
          <p className="text-sm text-[var(--text-primary)] mt-1 line-clamp-2">{report.description}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {report.user?.email || report.user?.phone || 'Ciudadano'} · {report.colonia || 'Sin colonia'}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {format(new Date(report.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
            {report.voteCount != null && report.voteCount > 0 && ` · +${report.voteCount} reportes`}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function ReportColumn({
  reports,
  categories,
  view,
  onViewChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  isLoading,
  selectedReportId = null,
  onReportSelect,
}: ReportColumnProps) {
  const getCategoryLabel = (id: string) => categories.find((c) => c.id === id)?.label || id;

  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  return (
    <div className="report-column w-full flex flex-col flex-1 min-h-0 bg-[var(--overlay-panel)] backdrop-blur rounded-xl border border-[var(--border)] shadow-xl overflow-hidden">
      {/* Tabs Live / Historial */}
      <div className="flex border-b border-[var(--border)] flex-shrink-0">
        <button
          type="button"
          onClick={() => onViewChange('live')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            view === 'live'
              ? 'bg-[var(--accent)] text-white'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
          }`}
        >
          Actuales (12 h)
        </button>
        <button
          type="button"
          onClick={() => onViewChange('historial')}
          className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
            view === 'historial'
              ? 'bg-[var(--accent)] text-white'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
          }`}
        >
          Historial
        </button>
      </div>

      {view === 'historial' && (
        <div className="p-2 border-b border-[var(--border)] flex-shrink-0 flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)] max-sm:gap-1.5 max-sm:p-1.5 max-sm:hidden">
          <label className="flex items-center gap-1.5">
            <span>Desde</span>
            <DateInput
              value={dateFrom}
              onChange={onDateFromChange}
              maxDate={dateTo || undefined}
              placeholder="dd/mm/aaaa"
              className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] min-w-0 text-xs w-28"
            />
          </label>
          <label className="flex items-center gap-1.5">
            <span>Hasta</span>
            <DateInput
              value={dateTo}
              onChange={onDateToChange}
              minDate={dateFrom || undefined}
              maxDate={today}
              placeholder="dd/mm/aaaa"
              className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] min-w-0 text-xs w-28"
            />
          </label>
        </div>
      )}

      <div className="report-column-scroll flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        {isLoading && (
          <div className="text-center py-8 text-[var(--text-muted)] text-sm">Cargando…</div>
        )}
        {!isLoading && reports.length === 0 && (
          <div className="text-center py-8 text-[var(--text-muted)] text-sm">
            No hay reportes con los filtros seleccionados.
          </div>
        )}
        {!isLoading && reports.length > 0 && reports.map((r) => (
          <ReportCard
            key={r.id}
            report={r}
            categoryLabel={getCategoryLabel(r.category)}
            isSelected={selectedReportId === r.id}
            onSelect={onReportSelect ? () => onReportSelect(selectedReportId === r.id ? null : r.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
