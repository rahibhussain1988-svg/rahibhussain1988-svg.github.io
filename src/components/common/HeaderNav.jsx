import React, { useState, useEffect, useRef } from 'react';
import {
  HeartPulse,
  Tv,
  Stethoscope,
  Receipt,
  Pill,
  RotateCcw,
  ChevronDown,
  ChevronLeft,
  Settings,
  Shield,
  Lock,
  Unlock,
  Building2,
  User,
  AlertTriangle,
  Volume2,
  VolumeX,
  Download,
  Pin,
  PinOff,
  PanelLeft,
  X,
  Sparkles,
  Eye,
  EyeOff,
  KeyRound,
  FileText
} from 'lucide-react';
import { useClinic } from '../../context/useClinic';
import { usePWAInstall } from '../../context/PWAInstallContext';
import { clinicAudio } from '../../utils/clinicAudio';

export const HeaderNav = () => {
  const {
    activeRole,
    setActiveRole,
    selectedCabinId,
    setSelectedCabinId,
    currencySymbol,
    clinicSettings,
    cabins,
    patients,
    pharmacyQueue,
    soundEnabled,
    setSoundEnabled,
    resetDemoData,

    // Multi-Clinic & RBAC
    clinics,
    activeClinicId,
    activeClinic,
    switchClinic,
    users,
    currentUser,
    switchUser,
    USER_ROLES,
    lockScreen,
    isCurrentClinicLocked,
    isClinicFeatureEnabled,

    // Navigation State
    isNavPinned,
    setIsNavPinned,
    isNavOpen,
    setIsNavOpen,
    isNavLocked,
    setIsNavLocked,
    unlockNav,
    lockNav
  } = useClinic();

  const { isInstalled, deferredPrompt, promptInstall, setShowInstallModal } = usePWAInstall();

  const [showClinicDropdown, setShowClinicDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const closeTimeoutRef = useRef(null);

  // Fullscreen trigger on first user gesture
  useEffect(() => {
    const triggerFullscreenOnGesture = () => {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    };

    window.addEventListener('click', triggerFullscreenOnGesture, { once: true });
    window.addEventListener('keydown', triggerFullscreenOnGesture, { once: true });
    window.addEventListener('touchstart', triggerFullscreenOnGesture, { once: true });

    return () => {
      window.removeEventListener('click', triggerFullscreenOnGesture);
      window.removeEventListener('keydown', triggerFullscreenOnGesture);
      window.removeEventListener('touchstart', triggerFullscreenOnGesture);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  // Mouse Enter/Leave handlers for Auto-Hide Overlay (When Unpinned)
  const handleMouseEnterPanel = () => {
    if (isNavLocked) return;
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleMouseLeavePanel = () => {
    if (!isNavPinned && !isNavLocked) {
      closeTimeoutRef.current = setTimeout(() => {
        setIsNavOpen(false);
      }, 350);
    }
  };

  const handleOpenNav = () => {
    if (isNavLocked) {
      clinicAudio.triggerHaptic(10);
      setShowAdminPasswordModal(true);
      return;
    }
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    clinicAudio.triggerHaptic(10);
    setIsNavOpen(true);
  };

  const handleCloseNav = () => {
    clinicAudio.triggerHaptic(10);
    setIsNavOpen(false);
    setShowClinicDropdown(false);
  };

  const handleVerifyAdminPassword = (e) => {
    if (e) e.preventDefault();
    const res = unlockNav(adminPasswordInput.trim());
    if (res.success) {
      setShowAdminPasswordModal(false);
      setAdminPasswordInput('');
      setAdminPasswordError('');
    } else {
      setAdminPasswordError(res.error || 'Invalid Admin Password. Access restricted to authorized personnel.');
    }
  };

  const handleLockNavigation = () => {
    lockNav();
  };

  const togglePin = () => {
    clinicAudio.triggerHaptic(20);
    setIsNavPinned((prev) => {
      const next = !prev;
      if (next && !isNavLocked) {
        setIsNavOpen(true);
      }
      return next;
    });
  };

  const handleSelectRole = (role) => {
    clinicAudio.triggerHaptic(15);
    setActiveRole(role);
    if (!isNavPinned) {
      setIsNavOpen(false);
      setShowClinicDropdown(false);
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

  const waitingCount = patients.filter((p) => p.status === 'WAITING' || p.status === 'CALLED').length;
  const pendingBillingCount = patients.filter((p) => p.status === 'BILLING_PENDING').length;
  const queuedRxCount = (pharmacyQueue || []).filter((rx) => rx.status === 'QUEUED').length;

  const ROLE_TO_FEATURE_KEY = {
    PATIENT_KIOSK: 'kiosk',
    CABIN_QUEUE_TV: 'queueTv',
    DOCTOR_CABIN: 'doctorCabin',
    BILLING_PHARMACY: 'billingDesk',
    INHOUSE_PHARMACY: 'pharmacy'
  };

  // Station Items Configuration (All 7 hospital stations permanently visible and accessible)
  const stationItems = [
    {
      id: 'PATIENT_KIOSK',
      title: 'Patient Kiosk',
      subtitle: 'Self-Service Intake & Check-in',
      icon: HeartPulse,
      badge: null,
      visible: true,
      activeColor: 'from-teal-600 to-teal-700'
    },
    {
      id: 'CABIN_QUEUE_TV',
      title: 'Lounge Queue TV',
      subtitle: 'Live Waiting Hall Display',
      icon: Tv,
      badge: waitingCount > 0 ? `${waitingCount} Waiting` : null,
      badgeClass: 'bg-teal-500 text-white animate-pulse',
      visible: true,
      activeColor: 'from-blue-600 to-indigo-600'
    },
    {
      id: 'DOCTOR_CABIN',
      title: 'Doctor Cabin',
      subtitle: `Clinical Console (Cabin #${selectedCabinId})`,
      icon: Stethoscope,
      badge: `#${selectedCabinId}`,
      badgeClass: 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold',
      visible: true,
      activeColor: 'from-indigo-600 to-blue-700'
    },
    {
      id: 'BILLING_PHARMACY',
      title: 'Billing Desk POS',
      subtitle: 'Cash Counter & Laser Receipt',
      icon: Receipt,
      badge: pendingBillingCount > 0 ? `${pendingBillingCount} Pending` : null,
      badgeClass: 'bg-amber-500 text-white animate-bounce font-bold',
      visible: true,
      activeColor: 'from-amber-600 to-orange-600'
    },
    {
      id: 'INHOUSE_PHARMACY',
      title: 'In-House Pharmacy',
      subtitle: 'Electronic Rx & Dispensary',
      icon: Pill,
      badge: queuedRxCount > 0 ? `${queuedRxCount} Rx Orders` : null,
      badgeClass: 'bg-purple-600 text-white animate-pulse font-bold',
      visible: true,
      activeColor: 'from-purple-600 to-indigo-700'
    },
    {
      id: 'ADMIN_DASHBOARD',
      title: 'Clinic Management',
      subtitle: 'Formulary, Doctors & Staff',
      icon: Settings,
      badge: null,
      visible: true,
      activeColor: 'from-slate-800 to-slate-900'
    },
    {
      id: 'SUPER_ADMIN_DASHBOARD',
      title: 'Super Admin Console',
      subtitle: 'Multi-Clinic Infrastructure',
      icon: Shield,
      badge: 'DevOps',
      badgeClass: 'bg-purple-200 text-purple-900 border border-purple-300 font-bold',
      visible: true,
      activeColor: 'from-purple-800 to-indigo-900'
    }
  ];

  return (
    <>
      {/* =========================================================================
          1. FLOATING LEFT-EDGE TRIGGER TAB & HOVER ZONE (When Closed or Locked)
          ========================================================================= */}
      {(isNavLocked || !isNavPinned || !isNavOpen) && (
        <>
          {/* Invisible Left Edge Hover Strip (Only active when already unlocked) */}
          {!isNavLocked && !isNavPinned && (
            <div
              onMouseEnter={handleOpenNav}
              className="fixed left-0 top-0 w-3 h-screen z-40 pointer-events-auto print:hidden"
              title="Move cursor here to reveal navigation"
            />
          )}

          {/* Floating Vertical Trigger Tab */}
          <div
            onMouseEnter={() => {
              if (!isNavLocked) handleOpenNav();
            }}
            className="fixed left-0 top-1/2 -translate-y-1/2 z-40 print:hidden transition-transform duration-200"
          >
            <button
              type="button"
              onClick={handleOpenNav}
              className={`flex flex-col items-center gap-1.5 py-3.5 px-1.5 rounded-r-2xl border-y border-r shadow-2xl backdrop-blur-md transition-all hover:pl-2.5 group cursor-pointer ${
                isNavLocked
                  ? 'bg-slate-950/95 hover:bg-slate-900 border-amber-500/40 text-amber-400'
                  : 'bg-slate-900/95 hover:bg-slate-900 border-slate-700 text-white'
              }`}
              title={
                isNavLocked
                  ? 'Unlock Hospital Navigation (Admin Password Required)'
                  : 'Open Navigation Panel (Hover or Click)'
              }
            >
              {isNavLocked ? (
                <>
                  <Lock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-black tracking-widest uppercase text-amber-300 group-hover:text-amber-200">
                    Admin Nav
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mt-0.5" />
                </>
              ) : (
                <>
                  <PanelLeft className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
                  <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-black tracking-widest uppercase text-slate-300 group-hover:text-white">
                    Navigation
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse mt-0.5" />
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* =========================================================================
          2. BACKDROP OVERLAY (When Unpinned & Open - Closes on Click)
          ========================================================================= */}
      {!isNavPinned && !isNavLocked && isNavOpen && (
        <div
          onClick={handleCloseNav}
          className="fixed inset-0 bg-slate-950/25 backdrop-blur-[1px] z-45 transition-opacity duration-200 print:hidden"
        />
      )}

      {/* =========================================================================
          3. VERTICAL LEFT-SIDE NAVIGATION PANEL (Pinned vs Overlay Drawer)
          ========================================================================= */}
      <aside
        onMouseEnter={handleMouseEnterPanel}
        onMouseLeave={handleMouseLeavePanel}
        className={`bg-white border-r border-slate-200/90 flex flex-col select-none font-sans print:hidden transition-all duration-300 ease-out ${
          isNavPinned && !isNavLocked
            ? 'relative shrink-0 w-64 lg:w-72 h-screen z-30 shadow-xs'
            : `fixed top-0 left-0 h-screen w-64 lg:w-72 z-50 shadow-2xl ${
                isNavOpen && !isNavLocked ? 'translate-x-0' : '-translate-x-full'
              }`
        }`}
      >
        {/* Panel Top Header: Brand & Pin/Lock/Close Controls */}
        <div className="p-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-blue-50/40 shrink-0">
          <div className="flex items-center justify-between gap-2">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 p-0.5 shadow-md shadow-blue-500/20 flex items-center justify-center text-white shrink-0">
                <HeartPulse className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block leading-tight">
                  Hospital Navigation
                </span>
                <h1 className="text-xs font-black text-slate-900 truncate tracking-tight">
                  {activeClinic?.name || clinicSettings?.clinicName || 'Apex Care Clinic'}
                </h1>
              </div>
            </div>

            {/* Pin Toggle, Lock Action & Close Action Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={togglePin}
                className={`p-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isNavPinned
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
                title={
                  isNavPinned
                    ? 'Navigation is Pinned (Screen layout adjusted) • Click to Unpin & Auto-hide'
                    : 'Pin Navigation Panel (Adjusts screen side-by-side)'
                }
              >
                {isNavPinned ? (
                  <>
                    <Pin className="w-3.5 h-3.5 text-white" />
                    <span className="text-[10px] font-black">Pinned</span>
                  </>
                ) : (
                  <>
                    <PinOff className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[10px] font-black">Pin</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleLockNavigation}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Lock Navigation Panel (Admin Password Required to Reopen)"
              >
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] font-black">Lock</span>
              </button>

              {!isNavPinned && (
                <button
                  type="button"
                  onClick={handleCloseNav}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Close Navigation"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Multi-Clinic Center Switcher Dropdown */}
          <div className="relative mt-2.5">
            <button
              type="button"
              onClick={() => {
                clinicAudio.triggerHaptic(10);
                setShowClinicDropdown((prev) => !prev);
              }}
              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-left text-xs font-bold text-slate-800 flex items-center justify-between transition-colors cursor-pointer group"
              title="Switch Medical Center"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate text-[11px] font-bold">
                  {activeClinic?.name || 'Main Medical Center'}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className={`w-2 h-2 rounded-full ${isCurrentClinicLocked ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-transform" />
              </div>
            </button>

            {/* Dropdown Menu */}
            {showClinicDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-blue-200 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in duration-150">
                <div className="text-[9px] uppercase tracking-wider font-black text-blue-800 px-2 py-1 border-b border-blue-100 flex items-center justify-between">
                  <span>Switch Clinic Center</span>
                  <span className="font-mono text-slate-400">{clinics.length} Centers</span>
                </div>
                <div className="space-y-1 mt-1 max-h-48 overflow-y-auto">
                  {clinics.map((c) => {
                    const isSelected = c.id === activeClinicId;
                    const isLocked = c.status === 'LOCKED' || c.status === 'SUSPENDED';
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          clinicAudio.triggerHaptic(15);
                          switchClinic(c.id);
                          setShowClinicDropdown(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200 shadow-2xs'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="truncate pr-1">
                          <div className="font-bold text-[11px] truncate flex items-center gap-1">
                            <span>{c.name}</span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                          </div>
                          <div className="text-[9px] text-slate-400 truncate">
                            {c.city} • ID: {c.id}
                          </div>
                        </div>
                        <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          isLocked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isLocked ? 'Suspended' : 'Active'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Station Navigation List (Vertical Tiles) */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 min-h-0">
          <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center justify-between">
            <span>Workstation Screens</span>
            <span className="text-[8.5px] text-blue-600 lowercase font-medium">touch ready</span>
          </div>

          {stationItems.filter((item) => item.visible).map((item) => {
            const isActive = activeRole === item.id;
            const Icon = item.icon;
            const featureKey = ROLE_TO_FEATURE_KEY[item.id];
            const isDeactivated = featureKey ? !isClinicFeatureEnabled(featureKey, activeClinic?.id) : false;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectRole(item.id)}
                className={`w-full p-2.5 rounded-2xl text-left transition-all duration-150 flex items-center gap-3 cursor-pointer group relative overflow-hidden ${
                  isActive
                    ? `bg-gradient-to-r ${item.activeColor} text-white shadow-md shadow-blue-900/15 scale-[1.01]`
                    : isDeactivated
                      ? 'hover:bg-rose-50/70 text-slate-500 border border-dashed border-rose-200/80 opacity-80'
                      : 'hover:bg-slate-100/80 text-slate-700 border border-transparent'
                }`}
              >
                {/* Active Indicator Bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-white shadow-xs" />
                )}

                {/* Station Icon Container */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : isDeactivated
                      ? 'bg-rose-50 text-rose-500 border border-rose-200'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Station Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-xs font-black truncate ${isActive ? 'text-white' : isDeactivated ? 'text-slate-700' : 'text-slate-900'}`}>
                      {item.title}
                    </span>
                    {isDeactivated ? (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full shrink-0 font-bold ${
                        isActive ? 'bg-rose-950 text-rose-200 border border-rose-700' : 'bg-rose-100 text-rose-700 border border-rose-300'
                      }`}>
                        Disabled
                      </span>
                    ) : item.badge ? (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full shrink-0 font-mono ${
                        item.badgeClass || (isActive ? 'bg-white/25 text-white font-bold' : 'bg-slate-200 text-slate-800')
                      }`}>
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className={`text-[10px] truncate mt-0.5 ${isActive ? 'text-blue-100' : isDeactivated ? 'text-rose-400 font-semibold' : 'text-slate-500'}`}>
                    {isDeactivated ? 'Deactivated by Super Admin' : item.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Panel Footer: User Info & Utility Actions */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 shrink-0 space-y-2">
          {/* User Profile Bar with Quick Persona Switcher */}
          <div className="relative">
            <div className="flex items-center justify-between gap-1.5 p-1.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(15);
                  setShowUserDropdown((prev) => !prev);
                }}
                className="flex items-center gap-2 min-w-0 flex-1 p-1 rounded-lg hover:bg-slate-50 transition-all text-left cursor-pointer group"
                title="Click to Switch Staff User Account"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-black text-slate-900 block truncate leading-tight">
                      {currentUser?.name || 'Administrator'}
                    </span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-transform shrink-0 ${showUserDropdown ? 'rotate-180' : ''}`} />
                  </div>
                  <span className="text-[9px] text-slate-400 font-medium block truncate">
                    {currentUser?.role || 'Authorized Session'}
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(20);
                  handleLockNavigation();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors shrink-0 cursor-pointer"
                title="Lock Navigation Panel (Admin Password Required to Reopen)"
              >
                <Lock className="w-3.5 h-3.5 text-amber-500" />
              </button>
            </div>

            {/* User Switcher Dropdown */}
            {showUserDropdown && (
              <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-2xl z-50 animate-in fade-in duration-150">
                <div className="text-[9px] uppercase tracking-wider font-black text-slate-400 px-2 py-1 border-b border-slate-100 flex items-center justify-between">
                  <span>Switch Staff Persona</span>
                  <span className="font-mono text-slate-400">{users?.length || 0} Staff</span>
                </div>
                <div className="space-y-1 mt-1 max-h-52 overflow-y-auto">
                  {(users || []).map((u) => {
                    const isSelected = u.id === currentUser?.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          clinicAudio.triggerHaptic(15);
                          if (switchUser) switchUser(u.id);
                          if (u.doctorCabinId && setSelectedCabinId) {
                            setSelectedCabinId(Number(u.doctorCabinId));
                          }
                          setShowUserDropdown(false);
                        }}
                        className={`w-full text-left p-1.5 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200 shadow-2xs'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="truncate pr-1">
                          <div className="font-bold text-[11px] truncate flex items-center gap-1">
                            <span>{u.name}</span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                          </div>
                          <div className="text-[9px] text-slate-400 truncate">
                            {u.role} {u.doctorCabinId ? `• Cabin #${u.doctorCabinId}` : ''}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Promotion Brochure PDF Download Link */}
          <a
            href="/Apex_Clinic_Healthcare_OS_Promotion_Document.pdf"
            target="_blank"
            rel="noopener noreferrer"
            download="Apex_Clinic_Healthcare_OS_Promotion_Document.pdf"
            className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-800 hover:to-indigo-800 text-white flex items-center justify-center gap-2 font-black text-[10.5px] shadow-sm shadow-blue-900/20 cursor-pointer transition-all active:scale-98 group"
            title="Download Local Clinic Promotion Document (PDF Brochure)"
          >
            <FileText className="w-3.5 h-3.5 text-blue-200 group-hover:scale-110 transition-transform" />
            <span>Promotion Brochure (PDF)</span>
            <Download className="w-3 h-3 text-blue-200 ml-auto opacity-75 group-hover:opacity-100" />
          </a>

          {/* Quick Utility Buttons */}
          <div className="grid grid-cols-3 gap-1 text-[10px]">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={toggleAudio}
              className={`p-1.5 rounded-xl border flex items-center justify-center gap-1 font-bold transition-all cursor-pointer ${
                soundEnabled
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-white text-slate-500 border-slate-200'
              }`}
              title={soundEnabled ? 'Hospital Audio Chimes Active' : 'Audio Muted'}
            >
              {soundEnabled ? <Volume2 className="w-3 h-3 text-blue-600" /> : <VolumeX className="w-3 h-3" />}
              <span>{soundEnabled ? 'Sound' : 'Mute'}</span>
            </button>

            {/* PWA Install */}
            {!isInstalled ? (
              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(15);
                  if (deferredPrompt) promptInstall();
                  else setShowInstallModal(true);
                }}
                className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center gap-1 font-bold transition-all cursor-pointer"
                title="Install Apex Clinic as App"
              >
                <Download className="w-3 h-3 text-emerald-600" />
                <span>PWA</span>
              </button>
            ) : (
              <div className="p-1.5 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center gap-1 font-bold">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>App</span>
              </div>
            )}

            {/* Reset Demo Data */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset clinic simulation data to default demo state?')) {
                  resetDemoData();
                }
              }}
              className="p-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 flex items-center justify-center gap-1 font-bold transition-all cursor-pointer"
              title="Reset Demo Data"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          4. ADMIN PASSWORD UNLOCK MODAL (Secures Station Navigation)
          ========================================================================= */}
      {showAdminPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 shadow-2xl text-white text-center">
            <button
              type="button"
              onClick={() => {
                setShowAdminPasswordModal(false);
                setAdminPasswordInput('');
                setAdminPasswordError('');
              }}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-black text-white">Unlock Hospital Navigation</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
              Enter the administrator password to reveal the workstation switcher and management tools.
            </p>

            <form onSubmit={handleVerifyAdminPassword} className="space-y-3">
              <div className="relative">
                <input
                  type={showPasswordText ? 'text' : 'password'}
                  autoFocus
                  required
                  value={adminPasswordInput}
                  onChange={(e) => {
                    setAdminPasswordInput(e.target.value);
                    setAdminPasswordError('');
                  }}
                  placeholder="Enter Admin Password (admin123)"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl py-2.5 pl-3.5 pr-10 text-sm font-mono text-white placeholder-slate-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {adminPasswordError && (
                <div className="text-rose-400 text-xs font-bold text-left px-1 flex items-center gap-1.5 animate-in fade-in">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{adminPasswordError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminPasswordModal(false);
                    setAdminPasswordInput('');
                    setAdminPasswordError('');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-md shadow-amber-900/30 cursor-pointer transition-all active:scale-95"
                >
                  Unlock Navigation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
