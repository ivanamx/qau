'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DASHBOARD_ROLE_LABELS } from '@/lib/constants';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, user, dashboardRole, canAccessDashboard, setAccessToken } = useAuth();

  useEffect(() => {
    if (accessToken === null) return;
    if (!canAccessDashboard) {
      router.replace('/?openLogin=1');
      return;
    }
  }, [accessToken, canAccessDashboard, router]);

  const handleLogout = () => {
    setAccessToken(null);
    router.push('/');
  };

  if (accessToken && !canAccessDashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <p className="text-[var(--text-muted)]">Sin acceso al dashboard. Redirigiendo…</p>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
        <p className="text-[var(--text-muted)]">Redirigiendo a inicio de sesión…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col sm:flex-row bg-[var(--bg-base)]">
      {/* Sidebar */}
      <aside className="w-full sm:w-56 lg:w-64 flex-shrink-0 border-b sm:border-b-0 sm:border-r border-[var(--border)] bg-[var(--bg-card)] flex flex-col min-h-screen sm:min-h-0">
        <div className="p-4 border-b border-[var(--border)]">
          <Link href="/" className="text-lg font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors">
            Cuauhtémoc
          </Link>
          <p className="text-xs text-[var(--text-muted)] mt-1">Panel de gestión</p>
        </div>
        <div className="p-3">
          <span
            className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent)]"
            title={user?.role}
          >
            {DASHBOARD_ROLE_LABELS[dashboardRole ?? ''] ?? dashboardRole}
          </span>
        </div>
        <nav className="p-2 space-y-1">
          <Link
            href="/dashboard"
            className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === '/dashboard'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
            }`}
          >
            Inicio
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--accent)] transition-colors border border-[var(--border)] border-dashed"
          >
            <span aria-hidden>🗺️</span>
            Mapa principal
          </Link>
        </nav>
        <div className="mt-auto p-3 border-t border-[var(--border)]">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)] transition-colors"
          >
            <span aria-hidden>🗺️</span>
            Ir al mapa principal
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full mt-1 px-3 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors text-left"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
