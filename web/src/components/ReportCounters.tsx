'use client';

type ReportCountersProps = {
  total: number;
  thisMonth: number;
};

export default function ReportCounters({ total, thisMonth }: ReportCountersProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="px-3 py-2 rounded-lg bg-[var(--counter-bg)] backdrop-blur border border-[var(--border)] shadow">
        <p className="text-[10px] sm:text-xs uppercase tracking-wider text-[var(--text-muted)]">Total reportes</p>
        <p className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">{total}</p>
      </div>
      <div className="px-3 py-2 rounded-lg bg-[var(--counter-bg)] backdrop-blur border border-[var(--border)] shadow">
        <p className="text-[10px] sm:text-xs uppercase tracking-wider text-[var(--text-muted)]">Este mes</p>
        <p className="text-lg sm:text-xl font-semibold text-[var(--accent)]">{thisMonth}</p>
      </div>
    </div>
  );
}
