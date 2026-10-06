import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { clinicAudio } from '../utils/clinicAudio';

const PWAInstallContext = createContext(null);

export const PWAInstallProvider = ({ children }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [platform, setPlatform] = useState('unknown'); // 'windows' | 'android' | 'ios' | 'macos' | 'chromeos' | 'other'

  // Detect platform and standalone mode
  useEffect(() => {
    // Check if already in standalone / installed mode
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = window.navigator.standalone === true;
      const isDocumentFullscreen = document.referrer.includes('android-app://');
      const installed = isStandaloneMedia || isIOSStandalone || isDocumentFullscreen;
      setIsInstalled(installed);
    };

    checkStandalone();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e) => setIsInstalled(e.matches);
    mediaQuery.addEventListener('change', handleMediaChange);

    // Detect OS / Platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
      // On iOS, if not standalone, it can be added to home screen
      if (!window.navigator.standalone) {
        setIsInstallable(true);
      }
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else if (/windows/.test(userAgent)) {
      setPlatform('windows');
    } else if (/macintosh|mac os x/.test(userAgent)) {
      setPlatform('macos');
    } else if (/cros/.test(userAgent)) {
      setPlatform('chromeos');
    } else {
      setPlatform('other');
    }

    // Listen for the Chrome/Edge/Android beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser's default automatic mini-infobar
      e.preventDefault();
      // Stash the event so it can be triggered on user action
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('[PWA] beforeinstallprompt event captured and ready.');
    };

    const handleAppInstalled = () => {
      console.log('[PWA] Application successfully installed.');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowInstallModal(false);
      try {
        clinicAudio.playChime();
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Trigger the native browser install prompt
  const promptInstall = useCallback(async () => {
    clinicAudio.triggerHaptic(20);

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] User response to installation prompt:', outcome);

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        setShowInstallModal(false);
      }
    } else {
      // If no deferred prompt (e.g. iOS or manual), open the guidance modal
      setShowInstallModal(true);
    }
  }, [deferredPrompt]);

  return (
    <PWAInstallContext.Provider
      value={{
        isInstallable,
        isInstalled,
        deferredPrompt,
        platform,
        showInstallModal,
        setShowInstallModal,
        promptInstall
      }}
    >
      {children}
    </PWAInstallContext.Provider>
  );
};

export const usePWAInstall = () => {
  const context = useContext(PWAInstallContext);
  if (!context) {
    throw new Error('usePWAInstall must be used within a PWAInstallProvider');
  }
  return context;
};
