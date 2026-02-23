/**
 * Decodifica el payload de un JWT sin verificar (solo para leer rol en cliente).
 * La verificación real la hace la API.
 */
export function decodeJwtPayload(token: string): { sub?: string; role?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json) as { sub?: string; role?: string };
  } catch {
    return null;
  }
}
