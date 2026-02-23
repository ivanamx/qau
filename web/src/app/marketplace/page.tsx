'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import MarketplaceMap from '@/components/MarketplaceMap';
import {
  fetchBusinesses,
  fetchBusinessCategories,
  fetchBusiness,
  type Business,
} from '@/lib/api';
import { fetchAlcaldiaGeoJSON, isPointInAlcaldia } from '@/lib/alcaldiaGeo';
import { fetchColoniasGeoJSON, getColoniaNames, getColoniaForPoint, type ColoniasGeoJSON } from '@/lib/coloniasGeo';
import { useAuth } from '@/contexts/AuthContext';

export default function MarketplacePage() {
  const searchParams = useSearchParams();
  const { canAccessDashboard } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hasOffer, setHasOffer] = useState<'true' | 'false' | null>(null);
  const [centerFromUrl, setCenterFromUrl] = useState<[number, number] | null>(null);
  const [alcaldiaGeojson, setAlcaldiaGeojson] = useState<Awaited<ReturnType<typeof fetchAlcaldiaGeoJSON>>>(null);
  const [coloniasGeojson, setColoniasGeojson] = useState<ColoniasGeoJSON | null>(null);
  const [selectedColonia, setSelectedColonia] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchBusinessCategories();
      setCategories(data);
    } catch {
      setCategories([]);
    }
  }, []);

  const loadBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const params: { category?: string; hasOffer?: 'true' | 'false'; limit: number; offset: number } = {
        limit: 200,
        offset: 0,
      };
      if (selectedCategory) params.category = selectedCategory;
      if (hasOffer) params.hasOffer = hasOffer;
      const res = await fetchBusinesses(params);
      setBusinesses(res.data);
    } catch {
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, hasOffer]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  useEffect(() => {
    fetchAlcaldiaGeoJSON().then(setAlcaldiaGeojson);
  }, []);

  useEffect(() => {
    fetchColoniasGeoJSON().then(setColoniasGeojson);
  }, []);

  const colonias = useMemo(() => getColoniaNames(coloniasGeojson), [coloniasGeojson]);

  const businessesInAlcaldia = useMemo((): Business[] => {
    if (!alcaldiaGeojson) return [];
    let list = businesses.filter(
      (b) =>
        b.latitude != null &&
        b.longitude != null &&
        isPointInAlcaldia(b.latitude, b.longitude, alcaldiaGeojson)
    );
    if (selectedColonia && coloniasGeojson) {
      list = list.filter(
        (b) =>
          b.latitude != null &&
          b.longitude != null &&
          getColoniaForPoint(b.latitude, b.longitude, coloniasGeojson) === selectedColonia
      );
    }
    return list;
  }, [businesses, alcaldiaGeojson, selectedColonia, coloniasGeojson]);

  const businessId = searchParams.get('business');

  const centerOnBusiness = useMemo((): [number, number] | null => {
    if (!businessId) return centerFromUrl ?? null;
    const b = businesses.find((x) => x.id === businessId);
    if (b && b.latitude != null && b.longitude != null) return [b.latitude, b.longitude];
    return centerFromUrl;
  }, [businessId, businesses, centerFromUrl]);

  const showMap = !loading && (alcaldiaGeojson != null || businesses.length === 0);

  useEffect(() => {
    if (!businessId) {
      setCenterFromUrl(null);
      return;
    }
    const inList = businesses.some((x) => x.id === businessId);
    if (inList) return;
    fetchBusiness(businessId)
      .then((b) => {
        if (b.latitude != null && b.longitude != null)
          setCenterFromUrl([b.latitude, b.longitude]);
      })
      .catch(() => setCenterFromUrl(null));
  }, [businessId, businesses]);

  return (
    <div className="flex flex-col h-screen w-full bg-[var(--bg-base)]">
      <header className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm"
          >
            ← Mapa principal
          </Link>
          <span className="text-[var(--text-muted)]">|</span>
          <h1 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
            Marketplace local
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {canAccessDashboard && (
            <Link
              href="/dashboard"
              className="px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--border)]"
            >
              Panel
            </Link>
          )}
        </div>
      </header>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-[var(--border)] shrink-0">
        <span className="text-sm text-[var(--text-muted)]">Filtros:</span>
        <select
          value={selectedColonia ?? ''}
          onChange={(e) => setSelectedColonia(e.target.value || null)}
          className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] px-3 py-2 text-sm"
        >
          <option value="">Todas las colonias</option>
          {colonias.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={selectedCategory ?? ''}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
          className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] px-3 py-2 text-sm"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={hasOffer ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            setHasOffer(v === 'true' ? 'true' : v === 'false' ? 'false' : null);
          }}
          className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] px-3 py-2 text-sm"
        >
          <option value="">Todos los negocios</option>
          <option value="true">Con ofertas</option>
          <option value="false">Sin ofertas</option>
        </select>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Mapa */}
        <div className="flex-1 min-w-0 relative">
          {!showMap ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-base)]">
              <p className="text-[var(--text-muted)]">
                {loading ? 'Cargando negocios…' : 'Cargando límites de la alcaldía…'}
              </p>
            </div>
          ) : (
            <MarketplaceMap businesses={businessesInAlcaldia} centerOn={centerOnBusiness} />
          )}
        </div>
      </div>
    </div>
  );
}
