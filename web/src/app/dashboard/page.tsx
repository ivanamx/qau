'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchDashboardStats,
  fetchDashboardReports,
  syncBusinesses,
  type DashboardStats,
  type DashboardReport,
} from '@/lib/api';
import { REPORT_STATUS_LABELS, CATEGORY_LABELS } from '@/lib/constants';
import { fetchColoniasGeoJSON, getColoniaNames } from '@/lib/coloniasGeo';
import StatsCards from '@/components/dashboard/StatsCards';
import ReportsTable from '@/components/dashboard/ReportsTable';

export default function DashboardPage() {
  const { accessToken, dashboardRole } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reports, setReports] = useState<DashboardReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterColonia, setFilterColonia] = useState<string>('');
  const [coloniasList, setColoniasList] = useState<string[]>([]);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const geo = await fetchColoniasGeoJSON();
      if (!cancelled) setColoniasList(getColoniaNames(geo));
    })();
    return () => { cancelled = true; };
  }, []);

  const loadStats = useCallback(async () => {
    if (!accessToken) return;
    try {
      const data = await fetchDashboardStats(accessToken);
      setStats(data);
    } catch {
      setStats(null);
    }
  }, [accessToken]);

  const loadReports = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetchDashboardReports(accessToken, {
        limit: 100,
        offset: 0,
        ...(filterStatus && { status: filterStatus }),
        ...(filterCategory && { category: filterCategory }),
        ...(filterColonia && { colonia: filterColonia }),
        orderBy: 'createdAt',
        order: 'desc',
      });
      setReports(res.data);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filterStatus, filterCategory, filterColonia]);

  useEffect(() => {
    setLoading(true);
    loadStats();
    loadReports();
  }, [loadStats, loadReports]);

  // Live: refrescar cada 30 s
  useEffect(() => {
    const t = setInterval(() => {
      loadStats();
      loadReports();
    }, 30000);
    return () => clearInterval(t);
  }, [loadStats, loadReports]);

  const handleSyncBusinesses = useCallback(async () => {
    if (!accessToken) return;
    setSyncLoading(true);
    setSyncMessage(null);
    try {
      const result = await syncBusinesses(accessToken, {
        latitude: 19.4326,
        longitude: -99.1332,
        radiusMeters: 3000,
        maxResultCount: 20,
      });
      setSyncMessage(`Sincronizados ${result.synced} negocios (${result.results.filter((r) => r.created).length} nuevos).`);
    } catch (e) {
      setSyncMessage(e instanceof Error ? e.message : 'Error al sincronizar');
    } finally {
      setSyncLoading(false);
    }
  }, [accessToken]);

  if (!dashboardRole) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <header className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Dashboard
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Gestión de reportes en tiempo real · Actualización automática
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all shrink-0"
          >
            <span aria-hidden>🗺️</span>
            Mapa principal
          </Link>
        </div>
      </header>

      {stats && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Estadísticas</h2>
          <StatsCards stats={stats} role={dashboardRole} />
        </section>
      )}

      {/* Marketplace: sincronizar negocios y enlace al mapa */}
      <section className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Marketplace local</h2>
        <p className="text-sm text-[var(--text-muted)] mb-3">
          Sincroniza negocios desde Google Places (zona Cuauhtémoc) para mostrarlos en el mapa de ofertas.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSyncBusinesses}
            disabled={syncLoading}
            className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            {syncLoading ? 'Sincronizando…' : 'Sincronizar negocios'}
          </button>
          <Link
            href="/marketplace"
            className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--border)]"
          >
            Ver mapa de ofertas
          </Link>
        </div>
        {syncMessage && (
          <p className={`mt-2 text-sm ${syncMessage.startsWith('Error') ? 'text-red-400' : 'text-[var(--accent)]'}`}>
            {syncMessage}
          </p>
        )}
      </section>

      {/* Superuser: pendientes de mi acción (placeholder) */}
      {dashboardRole === 'superadmin' && (
        <section className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-all duration-300">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Pendientes de tu acción</h2>
          <p className="text-sm text-[var(--text-muted)] mb-3">
            Reportes que requieren atención directa. (Próximamente: filtro y asignación.)
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] text-sm font-medium border border-[var(--accent)]/30"
            >
              Ver pendientes
            </button>
          </div>
        </section>
      )}

      {/* Superuser: equipo / WhatsApp (placeholder) */}
      {dashboardRole === 'superadmin' && (
        <section className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-all duration-300">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Equipo y canalización</h2>
          <p className="text-sm text-[var(--text-muted)] mb-3">
            Llamar a miembros del equipo o crear grupos por WhatsApp. (Próximamente.)
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-muted)] text-sm border border-[var(--border)]">
              Llamada grupal
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-muted)] text-sm border border-[var(--border)]">
              WhatsApp grupo
            </span>
          </div>
        </section>
      )}

      {/* Gestión de reportes */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Reportes</h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="">Todos los estados</option>
              {Object.entries(REPORT_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="">Todas las categorías</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={filterColonia}
              onChange={(e) => setFilterColonia(e.target.value)}
              className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <option value="">Todas las colonias</option>
              {coloniasList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && !reports.length ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-12 text-center">
            <div className="inline-block w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            <p className="text-[var(--text-muted)] mt-3">Cargando reportes…</p>
          </div>
        ) : (
          <ReportsTable
            reports={reports}
            token={accessToken!}
            onUpdate={loadReports}
            role={dashboardRole}
          />
        )}

        {dashboardRole === 'operator' && (
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            Como equipo operativo puedes gestionar reportes y crear reportes en nombre de la ciudadanía.{' '}
            <Link href="/" className="text-[var(--accent)] hover:underline">Crear reporte desde el mapa</Link>.
          </p>
        )}
      </section>
    </div>
  );
}
