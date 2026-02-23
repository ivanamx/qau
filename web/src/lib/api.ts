const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export type AirQuality = {
  index?: string;
  contaminante?: string;
  riesgo?: string;
  temperature?: number;
  source?: string;
  alcaldia?: string;
};

export async function fetchAirQuality(): Promise<AirQuality> {
  // Usa la ruta de Next.js (mismo origen) para evitar CORS y no depender del backend
  const res = await fetch('/api/air-quality');
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error((json as { error?: string }).error || 'Error al cargar calidad del aire');
  }
  return res.json();
}

export type ReportCategory = { id: string; label: string };

export type Report = {
  id: string;
  category: string;
  description: string;
  photoUrl: string;
  latitude: number;
  longitude: number;
  colonia?: string | null;
  status: string;
  createdAt: string;
  voteCount?: number;
  updatedAt?: string;
  user?: { id: string; email?: string; phone?: string; colonia?: string; nombre?: string; apellidos?: string };
};

export type ReportsResponse = { data: Report[]; meta: { total: number; limit: number; offset: number } };
export type CategoriesResponse = { data: ReportCategory[] };

export async function fetchCategories(): Promise<ReportCategory[]> {
  const res = await fetch(`${API_URL}/api/v1/reports/categories`);
  if (!res.ok) throw new Error('Error al cargar categorías');
  const json: CategoriesResponse = await res.json();
  return json.data;
}

export type RegisterParams = {
  email?: string;
  phone?: string;
  password: string;
  nombre?: string;
  apellidos?: string;
  colonia?: string;
};

export type AuthUserProfile = { nombre?: string; apellidos?: string; email?: string };
export type AuthTokens = { accessToken: string; refreshToken?: string; expiresIn?: number; user?: AuthUserProfile };

export async function register(params: RegisterParams): Promise<AuthTokens> {
  const res = await fetch(`${API_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al registrarse');
  return json.data;
}

export type LoginParams = {
  email?: string;
  phone?: string;
  password: string;
};

export async function login(params: LoginParams): Promise<AuthTokens> {
  const res = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'Error al iniciar sesión');
  return json.data;
}

export type RequestPasswordResetParams = { email?: string; phone?: string };

export async function requestPasswordReset(params: RequestPasswordResetParams): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { message?: string }).message || 'Error al enviar instrucciones');
}

export type ListReportsParams = {
  status?: string;
  category?: string;
  since?: string;
  until?: string;
  limit?: number;
  offset?: number;
};

export async function fetchReports(params: ListReportsParams = {}): Promise<ReportsResponse> {
  const sp = new URLSearchParams();
  if (params.status) sp.set('status', params.status);
  if (params.category) sp.set('category', params.category);
  if (params.since) sp.set('since', params.since);
  if (params.until) sp.set('until', params.until);
  if (params.limit != null) sp.set('limit', String(params.limit));
  if (params.offset != null) sp.set('offset', String(params.offset));
  const url = `${API_URL}/api/v1/reports?${sp.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al cargar reportes');
  return res.json();
}

export function reportPhotoUrl(photoUrl: string): string {
  if (photoUrl.startsWith('http')) return photoUrl;
  return `${API_URL}/${photoUrl}`;
}

export async function createReport(formData: FormData, token: string): Promise<Report> {
  const res = await fetch(`${API_URL}/api/v1/reports`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Error al crear reporte');
  }
  const json = await res.json();
  return json.data;
}

export async function voteReport(reportId: string, token: string): Promise<{ voteCount: number }> {
  const res = await fetch(`${API_URL}/api/v1/reports/${reportId}/vote`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error((json as { message?: string }).message || 'Error al votar');
  }
  return json.data;
}

// ——— Dashboard (requiere token admin/operator/superadmin) ———

export type DashboardReport = Report;

export type DashboardReportsParams = {
  status?: string;
  category?: string;
  since?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'voteCount';
  order?: 'asc' | 'desc';
};

export type DashboardStats = {
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byColonia?: Record<string, number>;
  topVoted: Array<{ id: string; category: string; description: string; status: string; voteCount: number; createdAt: string }>;
  total: number;
};

export async function fetchDashboardReports(token: string, params: DashboardReportsParams = {}): Promise<{ data: DashboardReport[]; meta: { total: number; limit: number; offset: number } }> {
  const sp = new URLSearchParams();
  if (params.status) sp.set('status', params.status);
  if (params.category) sp.set('category', params.category);
  if (params.colonia) sp.set('colonia', params.colonia);
  if (params.since) sp.set('since', params.since);
  if (params.limit != null) sp.set('limit', String(params.limit));
  if (params.offset != null) sp.set('offset', String(params.offset));
  if (params.orderBy) sp.set('orderBy', params.orderBy);
  if (params.order) sp.set('order', params.order);
  const res = await fetch(`${API_URL}/api/v1/dashboard/reports?${sp.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error al cargar reportes');
  return res.json();
}

export async function fetchDashboardStats(token: string): Promise<DashboardStats> {
  const res = await fetch(`${API_URL}/api/v1/dashboard/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error al cargar estadísticas');
  const json = await res.json();
  return json.data;
}

export async function updateReportStatus(
  token: string,
  reportId: string,
  body: { status: string; comment?: string }
): Promise<{ id: string; status: string; updatedAt: string; voteCount: number }> {
  const res = await fetch(`${API_URL}/api/v1/dashboard/reports/${reportId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error((json as { message?: string }).message || 'Error al actualizar');
  return json.data;
}

export async function fetchReportHistory(token: string, reportId: string): Promise<Array<{ id: string; fromStatus: string; toStatus: string; comment: string | null; createdAt: string; changedBy: { id: string; email: string | null } | null }>> {
  const res = await fetch(`${API_URL}/api/v1/dashboard/reports/${reportId}/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Error al cargar historial');
  const json = await res.json();
  return json.data;
}

// ——— Marketplace (Fase 2) ———

export type Business = {
  id: string;
  placeId: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  category: string | null;
  photoUrl: string | null;
  cachedAt: string;
  offerCount: number;
};

export type Offer = {
  id: string;
  businessId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  validFrom: string;
  validUntil: string;
  conditions: string | null;
  createdAt?: string;
  business?: {
    id: string;
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
  };
};

export type ListBusinessesParams = {
  category?: string;
  hasOffer?: 'true' | 'false';
  limit?: number;
  offset?: number;
};

export type BusinessesResponse = {
  data: Business[];
  meta: { total: number; limit: number; offset: number };
};

export type OffersResponse = {
  data: Offer[];
  meta: { total: number; limit: number; offset: number };
};

export async function fetchBusinessCategories(): Promise<string[]> {
  const res = await fetch(`${API_URL}/api/v1/businesses/categories`);
  if (!res.ok) throw new Error('Error al cargar categorías de negocios');
  const json: { data: string[] } = await res.json();
  return json.data;
}

export async function fetchBusinesses(params: ListBusinessesParams = {}): Promise<BusinessesResponse> {
  const sp = new URLSearchParams();
  if (params.category) sp.set('category', params.category);
  if (params.hasOffer) sp.set('hasOffer', params.hasOffer);
  if (params.limit != null) sp.set('limit', String(params.limit));
  if (params.offset != null) sp.set('offset', String(params.offset));
  const url = `${API_URL}/api/v1/businesses?${sp.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al cargar negocios');
  return res.json();
}

export async function fetchBusiness(id: string): Promise<Business & { offers?: Offer[] }> {
  const res = await fetch(`${API_URL}/api/v1/businesses/${id}`);
  if (!res.ok) throw new Error('Negocio no encontrado');
  const json: { data: Business & { offers?: Offer[] } } = await res.json();
  return json.data;
}

export async function fetchOffers(params: {
  businessId?: string;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
} = {}): Promise<OffersResponse> {
  const sp = new URLSearchParams();
  if (params.businessId) sp.set('businessId', params.businessId);
  if (params.activeOnly !== undefined) sp.set('activeOnly', params.activeOnly ? 'true' : 'false');
  if (params.limit != null) sp.set('limit', String(params.limit));
  if (params.offset != null) sp.set('offset', String(params.offset));
  const url = `${API_URL}/api/v1/offers?${sp.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error al cargar ofertas');
  return res.json();
}

export async function fetchOffer(id: string): Promise<Offer> {
  const res = await fetch(`${API_URL}/api/v1/offers/${id}`);
  if (!res.ok) throw new Error('Oferta no encontrada');
  const json: { data: Offer } = await res.json();
  return json.data;
}

/** Sincronizar negocios desde Google Places (solo dashboard). Opcional: body con latitude, longitude, radiusMeters, includedTypes, maxResultCount. */
export async function syncBusinesses(
  token: string,
  body?: { latitude?: number; longitude?: number; radiusMeters?: number; includedTypes?: string[]; maxResultCount?: number }
): Promise<{ synced: number; results: Array<{ placeId: string; created: boolean }> }> {
  const res = await fetch(`${API_URL}/api/v1/businesses/sync`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const json = await res.json();
  if (!res.ok) throw new Error((json as { message?: string }).message || 'Error al sincronizar');
  return json.data;
}
