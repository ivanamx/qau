'use client';

import type { DashboardStats } from '@/lib/api';
import { REPORT_STATUS_LABELS } from '@/lib/constants';
import type { DashboardRole } from '@/contexts/AuthContext';

type StatsCardsProps = {
  stats: DashboardStats;
  role: DashboardRole;
};

function Card({ label, value, sub, accent }: { label: string; value: number | string; sub?: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border border-[var(--border)] p-4 bg-[var(--bg-card)] transition-all duration-300 hover:border-[var(--accent)]/30 hover:shadow-lg ${
        accent ? 'ring-1 ring-[var(--accent)]/20' : ''
      }`}
    >
      <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-0.5">{sub}</p>}
    </div>
  );
}

export default function StatsCards({ stats, role }: StatsCardsProps) {
  const categoryEntries = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card label="Total reportes" value={stats.total} accent />
        {(role === 'superadmin' || role === 'admin') && (
          <>
            <Card label="Pendientes" value={stats.byStatus.PENDING ?? 0} sub={REPORT_STATUS_LABELS.PENDING} />
            <Card label="En proceso" value={(stats.byStatus.IN_PROGRESS ?? 0) + (stats.byStatus.CHANNELED ?? 0)} sub="Activos" />
            <Card label="Resueltos" value={stats.byStatus.RESOLVED ?? 0} sub={REPORT_STATUS_LABELS.RESOLVED} />
          </>
        )}
        {role === 'operator' && (
          <>
            <Card label="Pendientes" value={stats.byStatus.PENDING ?? 0} />
            <Card label="Resueltos" value={stats.byStatus.RESOLVED ?? 0} />
          </>
        )}
      </div>

      {(role === 'superadmin' || role === 'admin') && stats.byColonia && Object.keys(stats.byColonia).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Por colonia</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {Object.entries(stats.byColonia)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 12)
              .map(([colonia, count]) => (
                <div
                  key={colonia}
                  className="rounded-lg border border-[var(--border)] px-3 py-2 bg-[var(--bg-card)] transition-colors hover:border-[var(--accent)]/30"
                >
                  <p className="text-lg font-semibold text-[var(--text-primary)]">{count}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate" title={colonia}>{colonia}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {(role === 'superadmin' || role === 'admin') && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Por categoría</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {categoryEntries.slice(0, role === 'superadmin' ? 12 : 8).map(([cat, count]) => (
              <div
                key={cat}
                className="rounded-lg border border-[var(--border)] px-3 py-2 bg-[var(--bg-card)] transition-colors hover:border-[var(--accent)]/30"
              >
                <p className="text-lg font-semibold text-[var(--text-primary)]">{count}</p>
                <p className="text-xs text-[var(--text-muted)] truncate" title={cat}>{cat}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {role === 'superadmin' && stats.topVoted.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Reportes más apoyados</h3>
          <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--bg-card)]">
            <ul className="divide-y divide-[var(--border)]">
              {stats.topVoted.slice(0, 5).map((r, i) => (
                <li key={r.id} className="px-4 py-2 flex items-center justify-between gap-2 hover:bg-[var(--bg-elevated)] transition-colors">
                  <span className="text-xs text-[var(--text-muted)] w-6">#{i + 1}</span>
                  <span className="text-sm text-[var(--text-primary)] truncate flex-1">{r.description}</span>
                  <span className="text-xs font-medium text-[var(--accent)]">+{r.voteCount}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
