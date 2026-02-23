'use client';

import { useState } from 'react';
import { login as loginApi, requestPasswordReset } from '@/lib/api';

type View = 'login' | 'recover';

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (accessToken: string, user?: import('@/lib/api').AuthUserProfile) => void;
};

const inputClass =
  'w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]';
const labelClass = 'block text-sm font-medium text-[var(--text-secondary)] mb-1';

export default function LoginModal({
  isOpen,
  onClose,
  onSuccess,
}: LoginModalProps) {
  const [view, setView] = useState<View>('login');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recoverSent, setRecoverSent] = useState(false);
  const [recoverLoading, setRecoverLoading] = useState(false);
  const [recoverError, setRecoverError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const value = emailOrPhone.trim();
    const phoneOnly = value.replace(/\D/g, '');
    const isEmail = value.includes('@');
    if (!value) {
      setError('Indica tu correo o teléfono.');
      return;
    }
    if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Correo no válido.');
      return;
    }
    if (!isEmail && phoneOnly.length < 10) {
      setError('El teléfono debe tener al menos 10 dígitos.');
      return;
    }
    if (!password) {
      setError('La contraseña es obligatoria.');
      return;
    }

    setLoading(true);
    try {
      const data = await loginApi({
        ...(isEmail ? { email: value } : { phone: phoneOnly }),
        password,
      });
      onSuccess(data.accessToken, data.user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoverError(null);
    const value = emailOrPhone.trim();
    const phoneOnly = value.replace(/\D/g, '');
    const isEmail = value.includes('@');
    if (!value) {
      setRecoverError('Indica tu correo o teléfono.');
      return;
    }
    if (isEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setRecoverError('Correo no válido.');
      return;
    }
    if (!isEmail && phoneOnly.length < 10) {
      setRecoverError('El teléfono debe tener al menos 10 dígitos.');
      return;
    }

    setRecoverLoading(true);
    try {
      await requestPasswordReset(isEmail ? { email: value } : { phone: phoneOnly });
      setRecoverSent(true);
    } catch (err) {
      setRecoverError(err instanceof Error ? err.message : 'Error al enviar instrucciones');
    } finally {
      setRecoverLoading(false);
    }
  };

  const handleClose = () => {
    setView('login');
    setError(null);
    setRecoverSent(false);
    setRecoverError(null);
    setEmailOrPhone('');
    setPassword('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} aria-hidden />
      <div className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {view === 'login' ? 'Iniciar sesión' : 'Recuperar contraseña'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {view === 'login' ? (
          <>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Entra con tu correo o teléfono y contraseña.
            </p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={labelClass}>Correo o teléfono</label>
                <input
                  type="text"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="ejemplo@correo.com o 55 1234 5678"
                  className={inputClass}
                  autoComplete="username"
                />
              </div>
              <div>
                <label className={labelClass}>Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={inputClass}
                  autoComplete="current-password"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setView('recover')}
                  className="text-sm text-[var(--accent)] hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {loading ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
          </>
        ) : (
          <>
            {!recoverSent ? (
              <>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  Indica tu correo o teléfono y te enviaremos instrucciones para recuperar tu contraseña.
                </p>
                <form onSubmit={handleRecover} className="space-y-4">
                  <div>
                    <label className={labelClass}>Correo o teléfono</label>
                    <input
                      type="text"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      placeholder="ejemplo@correo.com o 55 1234 5678"
                      className={inputClass}
                      autoComplete="username"
                    />
                  </div>
                  {recoverError && (
                    <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                      {recoverError}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setView('login'); setRecoverError(null); }}
                      className="flex-1 py-2.5 rounded-lg border border-[var(--border)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-elevated)]"
                    >
                      Volver al inicio de sesión
                    </button>
                    <button
                      type="submit"
                      disabled={recoverLoading}
                      className="flex-1 py-2.5 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] disabled:opacity-50"
                    >
                      {recoverLoading ? 'Enviando…' : 'Enviar instrucciones'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-muted)]">
                  Si existe una cuenta con ese correo o teléfono, recibirás instrucciones para restablecer tu contraseña. Revisa tu bandeja de entrada o mensajes.
                </p>
                <button
                  type="button"
                  onClick={() => { setView('login'); setRecoverSent(false); }}
                  className="w-full py-2.5 rounded-lg border border-[var(--border)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-elevated)]"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
