'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { startOfMonth, endOfMonth, subHours } from 'date-fns';
import MapView from '@/components/Map';
import FilterBar from '@/components/FilterBar';
import ReportColumn from '@/components/ReportColumn';
import ReportModal from '@/components/ReportModal';
import RegisterModal from '@/components/RegisterModal';
import LoginModal from '@/components/LoginModal';
import DataBadges from '@/components/DataBadges';
import ReportCounters from '@/components/ReportCounters';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  fetchReports,
  fetchCategories,
  type Report,
  type ReportCategory,
} from '@/lib/api';
import { fetchColoniasGeoJSON, getColoniaNames, getColoniaForPoint, type ColoniasGeoJSON } from '@/lib/coloniasGeo';
import { MAP_CENTER_VIEW, MAP_CENTER_VIEW_MOBILE, MAP_ZOOM } from '@/lib/constants';

function HomePageContent() {
  const { accessToken, userProfile, setAccessToken, canAccessDashboard } = useAuth();
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [monthCount, setMonthCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const searchParams = useSearchParams();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState(() => {
    const start = startOfMonth(new Date());
    return start.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => {
    const today = new Date();
    const end = endOfMonth(today);
    const maxTo = end > today ? today : end;
    return `${maxTo.getFullYear()}-${String(maxTo.getMonth() + 1).padStart(2, '0')}-${String(maxTo.getDate()).padStart(2, '0')}`;
  });
  const [columnView, setColumnView] = useState<'live' | 'historial'>('historial');
  const [coloniasGeojson, setColoniasGeojson] = useState<ColoniasGeoJSON | null>(null);
  const [selectedColonia, setSelectedColonia] = useState<string | null>(null);
  /** Solo móvil: filtros colapsados por defecto para dar más espacio al mapa */
  const [filterBarOpen, setFilterBarOpen] = useState(false);
  /** Solo móvil: columna de reportes retraída por defecto; barra para deslizar arriba */
  const [mobileReportColumnOpen, setMobileReportColumnOpen] = useState(false);
  /** Al hacer clic en un reporte de la columna, el mapa centra en él. */
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  /** Popup del mapa abierto: subir z-index del mapa para que el popup se vea. */
  const [mapPopupOpen, setMapPopupOpen] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch {
      setCategories([]);
    }
  }, []);

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params: { status?: string; category?: string; since?: string; until?: string; limit: number; offset: number } = {
        limit: 100,
        offset: 0,
      };
      if (selectedCategory) params.category = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;
      if (columnView === 'live') {
        params.since = subHours(new Date(), 12).toISOString();
      } else {
        params.since = `${dateFrom}T00:00:00.000Z`;
        params.until = `${dateTo}T23:59:59.999Z`;
      }
      const res = await fetchReports(params);
      let data = res.data;
      if (columnView === 'historial' && data.length > 0) {
        const until = new Date(`${dateTo}T23:59:59.999Z`).getTime();
        data = data.filter((r) => new Date(r.createdAt).getTime() <= until);
      }
      setReports(data);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedStatus, columnView, dateFrom, dateTo]);

  const loadCounts = useCallback(async () => {
    try {
      const [allRes, monthRes] = await Promise.all([
        fetchReports({ limit: 1, offset: 0 }),
        fetchReports({
          since: startOfMonth(new Date()).toISOString(),
          limit: 1,
          offset: 0,
        }),
      ]);
      setTotalCount(allRes.meta.total);
      setMonthCount(monthRes.meta.total);
    } catch {
      setTotalCount(0);
      setMonthCount(0);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const geo = await fetchColoniasGeoJSON();
      if (!cancelled) setColoniasGeojson(geo);
    })();
    return () => { cancelled = true; };
  }, []);

  // Polling para vista Live cada 30 s
  useEffect(() => {
    if (columnView !== 'live') return;
    const t = setInterval(loadReports, 30000);
    return () => clearInterval(t);
  }, [columnView, loadReports]);

  const colonias = useMemo(() => getColoniaNames(coloniasGeojson), [coloniasGeojson]);

  useEffect(() => {
    if (searchParams.get('openLogin') === '1') setLoginModalOpen(true);
  }, [searchParams]);

  const filteredReports = useMemo(() => {
    if (!selectedColonia) return reports;
    return reports.filter((r) => r.colonia === selectedColonia || getColoniaForPoint(r.latitude, r.longitude, coloniasGeojson) === selectedColonia);
  }, [reports, selectedColonia, coloniasGeojson]);

  const isMobile = useIsMobile();
  const mapCenter = isMobile ? MAP_CENTER_VIEW_MOBILE : MAP_CENTER_VIEW;

  return (
    <div className="relative h-screen w-full overflow-hidden flex flex-col">
      <MapView
        reports={filteredReports}
        onVoteSuccess={loadReports}
        selectedReportId={selectedReportId}
        selectedColonia={selectedColonia}
        coloniasGeojson={coloniasGeojson}
        center={mapCenter}
        zoom={MAP_ZOOM}
        popupOpen={mapPopupOpen}
        onPopupOpenChange={setMapPopupOpen}
      />

      {/* Barra superior: título + auth | DataBadges (centro en escritorio; en móvil debajo) | Panel + Reportar */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-2 p-2 sm:p-4 max-sm:gap-1.5">
        <div className="flex items-center gap-3 shrink-0 max-sm:order-1">
          <h1 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] whitespace-nowrap">
            QAU
          </h1>
          <span className="h-4 w-px bg-[var(--border)]" aria-hidden />
          {accessToken ? (
            <>
              <span className="text-sm text-[var(--text-primary)]">
                Hola, {userProfile?.nombre || userProfile?.email || 'Usuario'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" aria-hidden />
              <button
                type="button"
                onClick={() => setAccessToken(null)}
                className="text-sm text-[var(--accent)] hover:underline font-medium"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setRegisterModalOpen(true)}
                className="text-sm text-[var(--accent)] hover:underline font-medium"
              >
                Regístrate
              </button>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" aria-hidden />
              <button
                type="button"
                onClick={() => setLoginModalOpen(true)}
                className="text-sm text-[var(--accent)] hover:underline font-medium"
              >
                Entrar
              </button>
            </>
          )}
        </div>
        <div className="flex items-center justify-center flex-1 min-w-0 px-1 sm:px-2 max-sm:min-w-0 max-sm:overflow-x-auto max-sm:order-3 max-sm:w-full max-sm:basis-full max-sm:justify-start">
          <DataBadges />
        </div>
        <div className="flex items-center gap-2 shrink-0 max-sm:order-2">
          {canAccessDashboard && (
            <a
              href="/dashboard"
              className="px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--border)] transition-colors"
            >
              Panel
            </a>
          )}
          {accessToken ? (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 text-gray-900 font-medium hover:bg-amber-600 shadow-lg transition-colors max-sm:px-3 max-sm:py-1.5 max-sm:text-sm text-center"
            >
              Reportar
            </button>
          ) : (
            <span title="Solo disponible para usuarios registrados" className="inline-block shrink-0">
              <button
                type="button"
                disabled
                className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed shadow-lg shrink-0 max-sm:px-3 max-sm:py-1.5 max-sm:text-sm text-center"
              >
                Reportar
              </button>
            </span>
          )}
        </div>
      </header>

      {/* Franja de filtros (z-20). En móvil retraíble para dar más espacio al mapa. */}
      <div className="relative z-20 px-2 sm:px-4 pb-2 max-sm:pb-1">
        <FilterBar
          categories={categories}
          selectedCategory={selectedCategory}
          selectedStatus={selectedStatus}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onCategoryChange={setSelectedCategory}
          onStatusChange={setSelectedStatus}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          colonias={colonias}
          selectedColonia={selectedColonia}
          onColoniaChange={setSelectedColonia}
          totalFiltered={filteredReports.length}
          mobileExpanded={filterBarOpen}
          onMobileToggle={() => setFilterBarOpen((v) => !v)}
        />
      </div>

      {/* Ver Mercado Local: oculto por ahora
      <div className="absolute left-3 sm:left-4 z-10 pt-[9rem] sm:pt-[10.5rem] pointer-events-none">
        <a
          href="/marketplace"
          className="pointer-events-auto inline-block px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--border)] transition-colors"
        >
          Ver Mercado Local
        </a>
      </div>
      */}

      {/* Columna derecha: en móvil abajo, retraíble (barra para deslizar arriba); en escritorio lateral */}
      <div
        className={`absolute top-0 right-0 bottom-0 z-10 flex flex-col items-end justify-start pt-[7rem] sm:pt-[10.5rem] px-2 sm:px-4 pb-4 pointer-events-none max-sm:top-auto max-sm:bottom-0 max-sm:pt-0 max-sm:px-0 max-sm:pb-[max(0.75rem,env(safe-area-inset-bottom))] max-sm:justify-end ${mobileReportColumnOpen ? 'max-sm:h-[50vh]' : 'max-sm:h-14'}`}
      >
        {/* Solo móvil: barra para abrir (cuando está retraída); en escritorio no se muestra */}
        <button
          type="button"
          onClick={() => setMobileReportColumnOpen(true)}
          className={`hidden max-sm:flex pointer-events-auto w-full items-center justify-between gap-2 px-4 py-3 bg-[var(--overlay-panel)] border border-[var(--border)] border-b-0 rounded-t-xl shadow-lg text-[var(--text-primary)] font-medium text-sm active:bg-[var(--bg-elevated)] ${mobileReportColumnOpen ? '!hidden' : ''}`}
        >
          <span>Reportes</span>
          <span className="text-[var(--text-muted)]">{filteredReports.length} {filteredReports.length === 1 ? 'reporte' : 'reportes'}</span>
          <span className="text-[var(--accent)]" aria-hidden>▲</span>
        </button>
        {/* Panel: en móvil solo cuando está abierto (max-sm:hidden si cerrado); en escritorio siempre visible */}
        <div
          className={`pointer-events-auto w-full max-w-[min(100%,22rem)] sm:max-w-md flex flex-col items-end gap-3 h-[42vh] sm:h-[34rem] sm:max-h-[34rem] min-h-0 max-sm:max-w-full max-sm:w-full max-sm:items-stretch max-sm:h-full max-sm:max-h-none overflow-hidden ${!mobileReportColumnOpen ? 'max-sm:hidden' : ''}`}
        >
          {/* Solo móvil: barra para cerrar (arriba del panel); en escritorio no se muestra */}
          <button
            type="button"
            onClick={() => setMobileReportColumnOpen(false)}
            className="hidden max-sm:flex w-full items-center justify-center gap-2 py-2 bg-[var(--bg-elevated)] border-b border-[var(--border)] text-[var(--text-secondary)] text-sm font-medium shrink-0"
          >
            <span aria-hidden>▼</span>
            Cerrar
          </button>
          <div className="flex-1 min-h-0 w-full flex flex-col sm:contents">
<ReportColumn
            reports={filteredReports}
            categories={categories}
            view={columnView}
            onViewChange={(view) => { setColumnView(view); setSelectedReportId(null); }}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            isLoading={loading}
            selectedReportId={selectedReportId}
            onReportSelect={setSelectedReportId}
          />
          </div>
        </div>
      </div>

      {/* Contadores sobre el mapa (esquina inferior izquierda); en móvil más compactos */}
      <div className="absolute bottom-3 left-2 sm:bottom-4 sm:left-4 z-10 pointer-events-none max-sm:left-2 max-sm:bottom-[max(0.75rem,env(safe-area-inset-bottom))] max-sm:hidden">
        <div className="pointer-events-auto">
          <ReportCounters total={totalCount} thisMonth={monthCount} />
        </div>
      </div>

      <ReportModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        categories={categories}
        onSuccess={() => {
          loadReports();
          loadCounts();
        }}
        accessToken={accessToken}
        onOpenLogin={() => {
          setModalOpen(false);
          setLoginModalOpen(true);
        }}
      />
      <RegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSuccess={(token, user) => {
          setAccessToken(token, user ?? null);
          setRegisterModalOpen(false);
        }}
        colonias={colonias}
      />
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={(token, user) => {
          setAccessToken(token, user ?? null);
          setLoginModalOpen(false);
        }}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-[var(--bg-base)] text-[var(--text-muted)]">Cargando…</div>}>
      <HomePageContent />
    </Suspense>
  );
}
