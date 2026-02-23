'use client';

import { useState } from 'react';
import type { Report } from '@/lib/api';
import { voteReport } from '@/lib/api';
import { REPORT_STATUS_LABELS, REPORT_STATUS_COLORS } from '@/lib/constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';

type ReportPopupContentProps = {
  report: Report;
  onVoteSuccess?: () => void;
};

export default function ReportPopupContent({ report, onVoteSuccess }: ReportPopupContentProps) {
  const { accessToken } = useAuth();
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  const handleVote = async () => {
    if (!accessToken || report.status !== 'PENDING') return;
    setVoteError(null);
    setVoting(true);
    try {
      await voteReport(report.id, accessToken);
      onVoteSuccess?.();
    } catch (err) {
      setVoteError(err instanceof Error ? err.message : 'Error al apoyar');
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="min-w-[200px] max-w-[280px] text-left text-[var(--text-primary)] bg-[var(--bg-card)] rounded-lg">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded"
          style={{
            background: REPORT_STATUS_COLORS[report.status]
              ? `${REPORT_STATUS_COLORS[report.status]}33`
              : 'var(--accent-soft)',
            color: REPORT_STATUS_COLORS[report.status] || 'var(--accent)',
          }}
        >
          {REPORT_STATUS_LABELS[report.status] || report.status}
        </span>
        <span className="text-xs text-[var(--text-muted)]">
          {format(new Date(report.createdAt), 'd MMM yyyy, HH:mm', { locale: es })}
        </span>
      </div>
      <p className="text-sm text-[var(--text-secondary)] mb-2 line-clamp-2">{report.description}</p>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs text-[var(--text-muted)]">
          {report.colonia ? `${report.colonia} · ` : ''}
          {report.voteCount != null && report.voteCount > 0 ? `+${report.voteCount} reportes` : 'Sin reportes'}
        </span>
        {report.status === 'PENDING' && accessToken && (
          <button
            type="button"
            onClick={handleVote}
            disabled={voting}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {voting ? '…' : '+1 Apoyar reporte'}
          </button>
        )}
      </div>
      {voteError && (
        <p className="text-xs text-red-400 mt-1.5">{voteError}</p>
      )}
    </div>
  );
}
