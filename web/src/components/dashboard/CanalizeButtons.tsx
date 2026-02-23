'use client';

import { useState } from 'react';
import type { Report } from '@/lib/api';

type CanalizeButtonsProps = {
  report: Report;
  onClose?: () => void;
};

export default function CanalizeButtons({ report, onClose }: CanalizeButtonsProps) {
  const [showModal, setShowModal] = useState(false);
  const [phone, setPhone] = useState(report.user?.phone ?? '');
  const [email, setEmail] = useState(report.user?.email ?? '');

  const handleCall = () => {
    const num = phone.replace(/\D/g, '');
    if (num.length >= 10) {
      window.location.href = `tel:+52${num}`;
      onClose?.();
    } else {
      setShowModal(true);
    }
  };

  const handleEmail = () => {
    if (email.includes('@')) {
      window.location.href = `mailto:${email}?subject=Reporte ${report.id}`;
      onClose?.();
    } else {
      setShowModal(true);
    }
  };

  if (showModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
        <div className="w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Canalizar reporte</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Teléfono</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="55 1234 5678"
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">Correo</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="responsable@ejemplo.gob.mx"
                className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 py-2 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] text-sm"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleCall}
              className="flex-1 py-2 rounded-lg bg-[var(--accent)] text-white text-sm hover:bg-[var(--accent-hover)]"
            >
              Llamar
            </button>
            <button
              type="button"
              onClick={handleEmail}
              className="flex-1 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm hover:bg-[var(--border)]"
            >
              Enviar email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={handleCall}
        title="Llamar al responsable"
        className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all duration-200"
      >
        📞
      </button>
      <button
        type="button"
        onClick={handleEmail}
        title="Enviar email"
        className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] transition-all duration-200"
      >
        ✉️
      </button>
      {(!report.user?.phone || !report.user?.email) && (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          title="Indicar teléfono y correo para canalizar"
          className="p-2 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent)]/40 text-[var(--accent)] text-xs hover:bg-[var(--accent)] hover:text-white transition-all duration-200"
        >
          +
        </button>
      )}
    </div>
  );
}
