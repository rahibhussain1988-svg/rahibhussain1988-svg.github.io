// Service Worker Registration for Clinic Care PWA
export const registerServiceWorker = () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Log registration
          console.log('[PWA] Service Worker registered successfully:', registration.scope);

          // Check for worker updates
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New version of Clinic Care is ready for offline use.');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.warn('[PWA] Service Worker registration failed:', error);
        });
    });
  }
};
