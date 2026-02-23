'use client';

import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Report } from '@/lib/api';
import { REPORT_STATUS_MARKER_FILL, REPORT_STATUS_MARKER_BORDER, MAP_CENTER_VIEW, MAP_ZOOM } from '@/lib/constants';
import ReportPopupContent from '@/components/ReportPopupContent';
import AlcaldiaBounds from '@/components/AlcaldiaBounds';
import ColoniaHighlight from '@/components/ColoniaHighlight';
import type { ColoniasGeoJSON } from '@/lib/coloniasGeo';
import 'leaflet/dist/leaflet.css';

function SetDefaultView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

/** Cuando se selecciona un reporte desde la columna, centra el mapa en su ubicación (sigue mostrando todos los marcadores). */
function CenterOnSelectedReport({ reports, selectedReportId }: { reports: Report[]; selectedReportId: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedReportId) return;
    const r = reports.find((x) => x.id === selectedReportId);
    if (r) map.setView([r.latitude, r.longitude], 16);
  }, [map, reports, selectedReportId]);
  return null;
}

/** Notifica cuando se abre/cierra un popup para subir el z-index del mapa y que el popup se vea. */
function PopupOpenNotifier({ onPopupOpenChange }: { onPopupOpenChange?: (open: boolean) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!onPopupOpenChange) return;
    const onOpen = () => onPopupOpenChange(true);
    const onClose = () => onPopupOpenChange(false);
    map.on('popupopen', onOpen);
    map.on('popupclose', onClose);
    return () => {
      map.off('popupopen', onOpen);
      map.off('popupclose', onClose);
    };
  }, [map, onPopupOpenChange]);
  return null;
}

const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}.png';

/** Marcadores con popup usando API de Leaflet (L.circleMarker + bindPopup) para que el popup abra seguro al clic. */
function ReportMarkersLeaflet({ reports, onVoteSuccess, onPopupOpenChange }: { reports: Report[]; onVoteSuccess?: () => void; onPopupOpenChange?: (open: boolean) => void }) {
  const map = useMap();
  const layersRef = useRef<{ layer: L.CircleMarker; root: ReturnType<typeof createRoot> }[]>([]);

  useEffect(() => {
    const list = layersRef.current;
    list.forEach(({ layer, root }) => {
      map.removeLayer(layer);
      root.unmount();
    });
    list.length = 0;

    reports.forEach((r) => {
      const div = document.createElement('div');
      const root = createRoot(div);
      root.render(<ReportPopupContent report={r} onVoteSuccess={onVoteSuccess} />);

      const layer = L.circleMarker([r.latitude, r.longitude], {
        radius: 5,
        fillColor: REPORT_STATUS_MARKER_FILL[r.status] || 'var(--map-fill-accent)',
        color: REPORT_STATUS_MARKER_BORDER[r.status] || 'var(--map-border-accent)',
        weight: 1.5,
        fillOpacity: 0.95,
      });

      layer.bindPopup(div, { className: 'report-popup-dark' });
      layer.on('click', () => onPopupOpenChange?.(true));
      layer.addTo(map);
      list.push({ layer, root });
    });

    return () => {
      list.forEach(({ layer, root }) => {
        try { map.removeLayer(layer); } catch { /* already removed */ }
        try { root.unmount(); } catch { /* ignore */ }
      });
      list.length = 0;
    };
  }, [map, reports, onVoteSuccess, onPopupOpenChange]);

  return null;
}

type Props = {
  reports: Report[];
  onVoteSuccess?: () => void;
  selectedColonia?: string | null;
  coloniasGeojson?: ColoniasGeoJSON | null;
  /** Centro y zoom del mapa (p. ej. distintos para móvil para centrar la delegación). */
  center?: [number, number];
  zoom?: number;
  /** Si está definido, el mapa se centra en ese reporte. */
  selectedReportId?: string | null;
  /** Para subir el z-index del contenedor del mapa cuando el popup está abierto. */
  onPopupOpenChange?: (open: boolean) => void;
};

export default function MapInner({ reports, onVoteSuccess, selectedColonia = null, coloniasGeojson = null, center = MAP_CENTER_VIEW, zoom = MAP_ZOOM, selectedReportId = null, onPopupOpenChange }: Props) {
  return (
    <MapContainer
      key="map-main"
      center={center}
      zoom={zoom}
      zoomControl={false}
      className="h-full w-full"
      scrollWheelZoom={true}
    >
      <TileLayer url={DARK_TILES} maxZoom={19} />
      <SetDefaultView center={center} zoom={zoom} />
      <CenterOnSelectedReport reports={reports} selectedReportId={selectedReportId} />
      <PopupOpenNotifier onPopupOpenChange={onPopupOpenChange} />
      <AlcaldiaBounds center={center} zoom={zoom} />
      <ColoniaHighlight selectedColonia={selectedColonia ?? null} coloniasGeojson={coloniasGeojson ?? null} />
      <ReportMarkersLeaflet reports={reports} onVoteSuccess={onVoteSuccess} onPopupOpenChange={onPopupOpenChange} />
    </MapContainer>
  );
}
