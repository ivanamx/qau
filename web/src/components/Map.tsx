'use client';

import dynamic from 'next/dynamic';
import type { Report } from '@/lib/api';
import type { ColoniasGeoJSON } from '@/lib/coloniasGeo';

const MapInner = dynamic(() => import('./MapInner'), { ssr: false });

type MapViewProps = {
  reports: Report[];
  onVoteSuccess?: () => void;
  selectedColonia?: string | null;
  coloniasGeojson?: ColoniasGeoJSON | null;
  center?: [number, number];
  zoom?: number;
  /** Si está definido, el mapa se centra en ese reporte (pero sigue mostrando todos los marcadores). */
  selectedReportId?: string | null;
  /** Cuando true, el contenedor sube de z-index para que el popup se vea por encima del header/filtros. */
  popupOpen?: boolean;
  onPopupOpenChange?: (open: boolean) => void;
};

export default function MapView({ reports, onVoteSuccess, selectedColonia = null, coloniasGeojson = null, center, zoom, selectedReportId = null, popupOpen = false, onPopupOpenChange }: MapViewProps) {
  return (
    <div className={`absolute inset-0 ${popupOpen ? 'z-[100] overflow-visible' : 'z-0 overflow-hidden'}`}>
      <MapInner
        reports={reports}
        onVoteSuccess={onVoteSuccess}
        selectedColonia={selectedColonia}
        coloniasGeojson={coloniasGeojson}
        center={center}
        zoom={zoom}
        selectedReportId={selectedReportId}
        onPopupOpenChange={onPopupOpenChange}
      />
    </div>
  );
}
