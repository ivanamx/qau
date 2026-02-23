'use client';

import { useState } from 'react';
import type { Report } from '@/lib/api';
import { reportPhotoUrl } from '@/lib/api';
import { updateReportStatus } from '@/lib/api';
import { REPORT_STATUS_LABELS, REPORT_STATUS_COLORS, CATEGORY_LABELS } from '@/lib/constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CanalizeButtons from './CanalizeButtons';
import type { DashboardRole } from '@/contexts/AuthContext';

const STATUS_OPTIONS = ['PENDING', 'CHANNELED', 'IN_PROGRESS', 'RESOLVED'] as const;

type ReportsTableProps = {
  reports: Report[];
  token: string;
  onUpdate: () => void;
  role: DashboardRole;
};

export default function ReportsTable({ reports, token, onUpdate, role }: ReportsTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (reportId: string, status: string) => {
    setUpdatingId(reportId);
    try {
      await updateReportStatus(token, reportId, { status });
      onUpdate();
    } catch {
      // could toast error
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--bg-card)]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
              <th className="text-left p-3 text-[var(--text-muted)] font-medium">Reporte</th>
              <th className="text-left p-3 text-[var(--text-muted)] font-medium hidden sm:table-cell">Categoría</th>
              <th className="text-left p-3 text-[var(--text-muted)] font-medium">Estado</th>
              <th className="text-left p-3 text-[var(--text-muted)] font-medium hidden md:table-cell">Fecha</th>
              <th className="text-left p-3 text-[var(--text-muted)] font-medium">Votos</th>
              {(role === 'superadmin' || role === 'admin') && (
                <th className="text-right p-3 text-[var(--text-muted)] font-medium">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-[var(--bg-elevated)]/50 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {r.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={reportPhotoUrl(r.photoUrl)}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-[var(--text-primary)] line-clamp-2">{r.description}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {r.user?.email || r.user?.phone || '—'}
                        {r.colonia && ` · Colonia: ${r.colonia}`}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-3 hidden sm:table-cell text-[var(--text-secondary)]">
                  {CATEGORY_LABELS[r.category] ?? r.category}
                </td>
                <td className="p-3">
                  <select
                    value={r.status}
                    onChange={(e) => handleStatusChange(r.id, e.target.value)}
                    disabled={updatingId === r.id}
                    className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-50"
                    style={{
                      color: REPORT_STATUS_COLORS[r.status] || 'var(--text-primary)',
                    }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {REPORT_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-3 hidden md:table-cell text-[var(--text-muted)]">
                  {format(new Date(r.createdAt), 'd MMM HH:mm', { locale: es })}
                </td>
                <td className="p-3">
                  <span className="font-medium text-[var(--accent)]">+{r.voteCount ?? 0}</span>
                </td>
                {(role === 'superadmin' || role === 'admin') && (
                  <td className="p-3 text-right">
                    <CanalizeButtons report={r} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
