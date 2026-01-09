'use client';

import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/service-worker.js').catch(() => {
      // Keep the app usable even if SW registration fails.
    });
  }, []);

  return null;
}
