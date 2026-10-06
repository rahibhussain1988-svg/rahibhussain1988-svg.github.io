import React, { useState, useEffect } from 'react';
import { Clock, Volume2, VolumeX, Maximize, Minimize, Lock, Download } from 'lucide-react';
import { useClinic } from '../../context/useClinic';
import { usePWAInstall } from '../../context/PWAInstallContext';
import { clinicAudio } from '../../utils/clinicAudio';

export const WorkstationHeaderControls = ({
  showClock = true,
  showSound = true,
  showFullscreen = true,
  showLock = true,
  showInstall = true,
  onLock,
  className = '',
  theme = 'light' // 'light' | 'dark'
}) => {
  const { soundEnabled, setSoundEnabled, lockScreen } = useClinic();
  const { isInstalled, deferredPrompt, promptInstall, setShowInstallModal } = usePWAInstall();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live Digital Clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Track Fullscreen state
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    clinicAudio.triggerHaptic(10);
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const toggleAudio = () => {
    const nextVal = !soundEnabled;
    clinicAudio.triggerHaptic(15);
    clinicAudio.chimeEnabled = nextVal;
    clinicAudio.speechEnabled = nextVal;
    setSoundEnabled(nextVal);
    if (nextVal) {
      clinicAudio.playChime();
    }
  };

  const handleLockClick = () => {
    clinicAudio.triggerHaptic(20);
    if (onLock) {
      onLock();
    } else {
      lockScreen();
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* 1. Real-Time Digital Clock */}
      {showClock && (
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
            isDark
              ? 'bg-slate-900/90 text-white border-slate-700/80 shadow-inner'
              : 'bg-blue-50/80 text-blue-950 border-blue-100'
          }`}
          title="Hospital Workstation Live Time"
        >
          <Clock className={`w-3.5 h-3.5 ${isDark ? 'text-teal-400' : 'text-blue-600'}`} />
          <span className="font-mono text-xs sm:text-sm font-black tracking-tight">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      )}

      {/* 2. Audio Chimes & Voice Alert Toggle */}
      {showSound && (
        <button
          type="button"
          onClick={toggleAudio}
          title={soundEnabled ? 'Mute Hospital Audio Chimes & Calling Voice' : 'Enable Hospital Audio Chimes & Calling Voice'}
          className={`p-2 rounded-xl border transition-all cursor-pointer shadow-2xs active:scale-95 ${
            soundEnabled
              ? isDark
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 hover:bg-teal-500/30'
                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              : isDark
                ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                : 'bg-slate-100 text-slate-400 border-slate-200 hover:text-slate-600'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      )}

      {/* 3. Fullscreen Touch Screen Toggle */}
      {showFullscreen && (
        <button
          type="button"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen Mode' : 'Enter Fullscreen Touch Mode'}
          className={`p-2 rounded-xl border transition-all cursor-pointer shadow-2xs active:scale-95 hidden sm:block ${
            isDark
              ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
              : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
          }`}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      )}

      {/* 4. Workstation Privacy Screen Lock */}
      {showLock && (
        <button
          type="button"
          onClick={handleLockClick}
          title="Lock Workstation (Staff PIN or Admin Authorization Required)"
          className={`p-2 rounded-xl border transition-all cursor-pointer shadow-2xs active:scale-95 ${
            isDark
              ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-500/40'
              : 'bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 border-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
        </button>
      )}

      {/* 5. PWA Install App Button */}
      {showInstall && !isInstalled && (
        <button
          type="button"
          onClick={() => {
            clinicAudio.triggerHaptic(15);
            if (deferredPrompt) {
              promptInstall();
            } else {
              setShowInstallModal(true);
            }
          }}
          title="Install Apex Clinic as a Progressive Web App (Desktop / Tablet)"
          className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 ${
            isDark
              ? 'bg-blue-600/25 hover:bg-blue-600/35 text-blue-300 border-blue-500/40'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
          }`}
        >
          <Download className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden xl:inline text-[11px] font-black">Install App</span>
        </button>
      )}
    </div>
  );
};
