import React from 'react';
import {
  Download,
  Smartphone,
  Monitor,
  CheckCircle2,
  X,
  Sparkles,
  WifiOff,
  Maximize,
  ShieldCheck,
  Share,
  PlusSquare
} from 'lucide-react';
import { usePWAInstall } from '../../context/PWAInstallContext';
import { clinicAudio } from '../../utils/clinicAudio';

export const PWAInstallModal = () => {
  const {
    showInstallModal,
    setShowInstallModal,
    isInstalled,
    deferredPrompt,
    platform,
    promptInstall
  } = usePWAInstall();

  if (!showInstallModal) return null;

  const handleClose = () => {
    clinicAudio.triggerHaptic(10);
    setShowInstallModal(false);
  };

  const handleInstallClick = () => {
    if (deferredPrompt) {
      promptInstall();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border-2 border-blue-200/80 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-800 overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Brand */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-teal-500 p-0.5 shadow-lg shadow-blue-500/25 flex items-center justify-center shrink-0">
            <img src="/pwa-icon.svg" alt="Apex Clinic Icon" className="w-14 h-14 object-contain rounded-xl" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-black uppercase tracking-wider">
                Progressive Web App (PWA)
              </span>
              {isInstalled && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Installed
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-blue-950 mt-1">Install Apex Clinic Workstation</h2>
            <p className="text-xs text-slate-500 font-medium">
              Run as a standalone native app on Windows, macOS, Android, or iOS
            </p>
          </div>
        </div>

        {/* Workstation Advantages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5 text-left">
          <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0 mt-0.5">
              <Maximize className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-black text-blue-950">Full-Screen Kiosk</div>
              <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                Runs borderless without browser address bar or tabs.
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-100 flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-teal-600 text-white shrink-0 mt-0.5">
              <WifiOff className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-black text-teal-950">Offline Resilience</div>
              <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                Instant startup & asset caching during Wi-Fi drops.
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-purple-600 text-white shrink-0 mt-0.5">
              <Monitor className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-black text-purple-950">Desktop Shortcut</div>
              <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                Launches directly from Taskbar or Home Screen.
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-600 text-white shrink-0 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-black text-amber-950">Station Lock</div>
              <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                Prevents accidental window closures by patients.
              </div>
            </div>
          </div>
        </div>

        {/* Platform-Specific Guidance */}
        {platform === 'ios' ? (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-left mb-5">
            <div className="text-xs font-black text-slate-800 mb-1 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span>How to Install on iPad / iPhone (Safari):</span>
            </div>
            <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside font-medium">
              <li>Tap the <span className="font-bold text-slate-900 inline-flex items-center gap-1"><Share className="w-3.5 h-3.5 text-blue-600 inline" /> Share</span> button in Safari's toolbar.</li>
              <li>Scroll down and tap <span className="font-bold text-slate-900 inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 text-blue-600 inline" /> Add to Home Screen</span>.</li>
              <li>Tap <strong className="text-blue-700">Add</strong> to launch Apex Clinic as a fullscreen app.</li>
            </ol>
          </div>
        ) : !deferredPrompt && !isInstalled ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-left mb-5">
            <p className="text-xs text-amber-900 font-medium">
              To install in Chrome or Edge, click the <strong>Install</strong> icon (💻 or ⊕) in the browser address bar, or use the button below.
            </p>
          </div>
        ) : null}

        {/* Bottom Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            {isInstalled ? 'Close' : 'Maybe Later'}
          </button>

          {!isInstalled && deferredPrompt && (
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Install Workstation App</span>
            </button>
          )}

          {!isInstalled && !deferredPrompt && platform !== 'ios' && (
            <button
              type="button"
              onClick={() => {
                alert('PWA Ready: Click the Install icon (⊕ or 💻) in your browser address bar to install Apex Clinic onto your desktop.');
              }}
              className="flex-1 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Install via Address Bar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
