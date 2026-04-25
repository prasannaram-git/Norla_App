'use client';

import { useEffect } from 'react';

/**
 * PWA Service Worker Registration
 * - In DEVELOPMENT: Unregisters any stale SWs to prevent navigation issues
 * - In PRODUCTION: Registers the SW, detects updates, auto-refreshes
 */
export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // DEVELOPMENT: Unregister all service workers to prevent stale cache issues
    if (process.env.NODE_ENV === 'development') {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister().then(() => {
            console.log('[PWA] Unregistered stale service worker in dev mode');
          });
        }
      });
      // Also clear caches
      if ('caches' in window) {
        caches.keys().then((names) => {
          for (const name of names) {
            caches.delete(name);
          }
        });
      }
      return;
    }

    // PRODUCTION: Register service worker
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered');

        // Check for updates every 60 seconds
        setInterval(() => {
          registration.update();
        }, 60 * 1000);

        // When a new SW is found, activate it immediately
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              newWorker.postMessage('SKIP_WAITING');
              console.log('[PWA] New version available — refreshing...');
            }
          });
        });
      })
      .catch((err) => {
        console.warn('[PWA] SW registration failed:', err);
      });

    // When the new SW takes over, reload the page for latest code
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  return null;
}
