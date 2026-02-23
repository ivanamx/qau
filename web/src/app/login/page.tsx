'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/?openLogin=1');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-base)]">
      <p className="text-[var(--text-muted)]">Redirigiendo al inicio de sesión…</p>
    </div>
  );
}
