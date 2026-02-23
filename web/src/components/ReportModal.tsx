'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { ReportCategory } from '@/lib/api';
import { createReport } from '@/lib/api';
import { MAP_CENTER } from '@/lib/constants';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { fetchAlcaldiaGeoJSON, isPointInAlcaldia } from '@/lib/alcaldiaGeo';
import { fetchColoniasGeoJSON, getColoniaForPoint } from '@/lib/coloniasGeo';

const MiniMap = dynamic(() => import('@/components/MiniMap'), { ssr: false, loading: () => <div className="h-[180px] rounded-lg bg-[var(--bg-elevated)] animate-pulse" /> });

type ReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  categories: ReportCategory[];
  onSuccess: () => void;
  accessToken: string | null;
  onOpenLogin?: () => void;
};

export default function ReportModal({
  isOpen,
  onClose,
  categories,
  onSuccess,
  accessToken,
  onOpenLogin,
}: ReportModalProps) {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(MAP_CENTER[0].toString());
  const [longitude, setLongitude] = useState(MAP_CENTER[1].toString());
  const [coloniaLabel, setColoniaLabel] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const hasValidLocation =
    latitude !== '' &&
    longitude !== '' &&
    !Number.isNaN(parseFloat(latitude)) &&
    !Number.isNaN(parseFloat(longitude));

  useEffect(() => {
    if (!hasValidLocation) {
      setColoniaLabel(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const colonias = await fetchColoniasGeoJSON();
      if (cancelled) return;
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const name = getColoniaForPoint(lat, lng, colonias);
      if (!cancelled) setColoniaLabel(name);
    })();
    return () => { cancelled = true; };
  }, [hasValidLocation, latitude, longitude]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!accessToken) {
      setError('Inicia sesión para poder reportar.');
      return;
    }
    if (!category || !description.trim()) {
      setError('Completa categoría y descripción.');
      return;
    }
    if (!photo) {
      setError('La foto es obligatoria.');
      return;
    }
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setError('Selecciona una dirección del autocompletado.');
      return;
    }

    const alcaldiaGeojson = await fetchAlcaldiaGeoJSON();
    if (!isPointInAlcaldia(lat, lng, alcaldiaGeojson)) {
      setError('La ubicación debe estar dentro de la Alcaldía Cuauhtémoc.');
      return;
    }

    const coloniasGeojson = await fetchColoniasGeoJSON();
    const coloniaNombre = getColoniaForPoint(lat, lng, coloniasGeojson);

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set('category', category);
      formData.set('description', description.trim());
      formData.set('latitude', String(lat));
      formData.set('longitude', String(lng));
      if (coloniaNombre) formData.set('colonia', coloniaNombre);
      formData.append('photo', photo);

      await createReport(formData, accessToken);
      setCategory('');
      setDescription('');
      setAddress('');
      setColoniaLabel(null);
      setPhoto(null);
      setLatitude(MAP_CENTER[0].toString());
      setLongitude(MAP_CENTER[1].toString());
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el reporte.');
    } finally {
      setSubmitting(false);
    }
  };

  const lat = hasValidLocation ? parseFloat(latitude) : 0;
  const lng = hasValidLocation ? parseFloat(longitude) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Nuevo reporte</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          {!accessToken && (
            <p className="mb-4 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              Inicia sesión para poder enviar reportes.{' '}
              <button
                type="button"
                onClick={() => { onOpenLogin?.(); onClose(); }}
                className="underline font-medium text-inherit"
              >
                Ir a iniciar sesión
              </button>
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <option value="">Selecciona</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Descripción</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                minLength={10}
                rows={3}
                placeholder="Describe el problema..."
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Foto (obligatoria)</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] text-sm"
                >
                  Elegir archivo
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] text-sm"
                >
                  Tomar foto
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                capture="environment"
                className="hidden"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              />
              {photo && <p className="mt-1 text-xs text-[var(--text-muted)]">{photo.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Ubicación del reporte</label>
              <p className="text-xs text-[var(--text-muted)] mb-1.5">Dirección dentro de la Alcaldía Cuauhtémoc</p>
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                onPlaceSelect={(addr, latVal, lngVal) => {
                  setAddress(addr);
                  setLatitude(String(latVal));
                  setLongitude(String(lngVal));
                }}
                placeholder="Escribe la dirección..."
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              {coloniaLabel && (
                <p className="mt-1.5 text-sm text-[var(--text-secondary)]">Colonia: {coloniaLabel}</p>
              )}
              {hasValidLocation && (
                <>
                  <div className="mt-2 flex gap-2 text-xs text-[var(--text-muted)]">
                    <span>Lat {latitude}</span>
                    <span>Lng {longitude}</span>
                  </div>
                  <div className="mt-2">
                    <MiniMap lat={lat} lng={lng} />
                  </div>
                </>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-2">{error}</p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {submitting ? 'Enviando…' : 'Enviar reporte'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
