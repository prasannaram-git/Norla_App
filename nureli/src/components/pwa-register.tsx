'use client';

import { useEffect } from 'react';

/**
 * PWA Service Worker Registration
 * - Registers the SW on first load
 * - Detects updates and auto-refreshes
 * - Shows update notification to users
 */
export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Register service worker
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
              // New version available — tell SW to skip waiting
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
