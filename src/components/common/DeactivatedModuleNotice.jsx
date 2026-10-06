import React from 'react';
import {
  ShieldAlert,
  Building2,
  Sliders,
  Tv,
  RotateCcw,
  ExternalLink,
  Lock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useClinic } from '../../context/useClinic';
import { clinicAudio } from '../../utils/clinicAudio';

export const DeactivatedModuleNotice = ({ moduleInfo }) => {
  const {
    activeClinic,
    clinics,
    switchClinic,
    setActiveRole,
    currentUser,
    USER_ROLES,
    setClinicFeature,
    isClinicFeatureEnabled
  } = useClinic();

  const isSuperAdmin = currentUser?.role === USER_ROLES?.SUPER_ADMIN_USER;

  const handleReactivate = () => {
    clinicAudio.triggerHaptic(20);
    if (activeClinic && moduleInfo?.key) {
      setClinicFeature(activeClinic.id, moduleInfo.key, true);
    }
  };

  // Find another clinic where this module is enabled
  const otherClinicsWithFeature = clinics.filter(
    (c) => c.id !== activeClinic?.id && (c.features?.[moduleInfo?.key] !== false)
  );

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-slate-100 min-h-full font-sans select-none overflow-y-auto">
      <div className="max-w-xl w-full bg-slate-850/95 border border-rose-800/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/40 text-center relative overflow-hidden backdrop-blur-md">
        {/* Top Glow Ribbon */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600" />

        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-950/50">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Badges */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
            Workstation Deactivated
          </span>
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
            FR-07 Policy Guard
          </span>
        </div>

        {/* Heading */}
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {moduleInfo?.name || 'Workstation Module'} is Disabled
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
          Access to the <strong className="text-white">{moduleInfo?.name}</strong> workstation has been deactivated for <strong className="text-rose-300">{activeClinic?.name}</strong> by Super Admin central governance policy.
        </p>

        {/* Tenant Details Box */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-900/90 border border-slate-750 text-left space-y-2">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="text-slate-400">Target Facility:</span>
            <span className="font-bold text-white flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-teal-400" />
              {activeClinic?.name} ({activeClinic?.code})
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="text-slate-400">Workstation Role:</span>
            <span className="font-mono text-amber-300 font-bold">{moduleInfo?.role || 'UNKNOWN_STATION'}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Governance Status:</span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
              DEACTIVATED
            </span>
          </div>
        </div>

        {/* Interactive Action Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* Quick Reactivate for Super Admin */}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={handleReactivate}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Reactivate Module Now</span>
            </button>
          )}

          {/* Jump to Super Admin Console (if Admin) or TV Queue */}
          {isSuperAdmin ? (
            <button
              type="button"
              onClick={() => {
                clinicAudio.triggerHaptic(15);
                setActiveRole('SUPER_ADMIN_DASHBOARD');
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-rose-400" />
              <span>Feature Flags Console</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                clinicAudio.triggerHaptic(15);
                setActiveRole('CABIN_QUEUE_TV');
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-950/50 transition-all cursor-pointer"
            >
              <Tv className="w-4 h-4" />
              <span>View Lounge Queue TV</span>
            </button>
          )}
        </div>

        {/* Alternative Clinics with feature enabled */}
        {otherClinicsWithFeature.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800/80 text-left">
            <p className="text-[11px] text-slate-400 mb-2">
              This module is currently active at other branches:
            </p>
            <div className="flex flex-wrap gap-2">
              {otherClinicsWithFeature.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    clinicAudio.triggerHaptic(15);
                    switchClinic(c.id);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Building2 className="w-3 h-3 text-teal-400" />
                  <span>Switch to {c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
