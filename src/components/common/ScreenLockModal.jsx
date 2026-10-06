import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Shield,
  User,
  AlertCircle,
  Delete,
  RotateCcw,
  CheckCircle2,
  Stethoscope,
  Building2,
  KeyRound
} from 'lucide-react';
import { useClinic } from '../../context/useClinic';
import { clinicAudio } from '../../utils/clinicAudio';

export const ScreenLockModal = () => {
  const {
    isScreenLocked,
    unlockScreen,
    currentUser,
    logoutUser,
    activeClinic
  } = useClinic();

  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successPulse, setSuccessPulse] = useState(false);

  if (!isScreenLocked) return null;

  const handleKeyPress = (num) => {
    clinicAudio.triggerHaptic(15);
    setErrorMsg('');
    if (pinInput.length < 12) {
      setPinInput((prev) => prev + num);
    }
  };

  const handleBackspace = () => {
    clinicAudio.triggerHaptic(10);
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    clinicAudio.triggerHaptic(15);
    setPinInput('');
    setErrorMsg('');
  };

  const handleUnlock = (e) => {
    if (e) e.preventDefault();
    clinicAudio.triggerHaptic(20);

    const res = unlockScreen(pinInput);
    if (res.success) {
      setSuccessPulse(true);
      setTimeout(() => {
        setPinInput('');
        setErrorMsg('');
        setSuccessPulse(false);
      }, 300);
    } else {
      setErrorMsg(res.error || 'Incorrect PIN or security code.');
      setPinInput('');
      clinicAudio.playChime();
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SUPER_ADMIN_USER':
        return { label: 'Super Admin', color: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'ADMIN_USER':
        return { label: 'Clinic Admin', color: 'bg-blue-100 text-blue-800 border-blue-300' };
      case 'DOCTOR_USER':
        return { label: `Doctor (Cabin #${currentUser?.doctorCabinId || 1})`, color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'KIOSK_USER':
        return { label: 'Kiosk Terminal', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      default:
        return { label: 'Staff Member', color: 'bg-slate-100 text-slate-700 border-slate-300' };
    }
  };

  const roleInfo = getRoleBadge(currentUser?.role);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 select-none animate-fadeIn">
      {/* Background Decorative Rings */}
      <div className="absolute inset-0 bg-radial from-blue-900/20 via-transparent to-slate-950 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-center text-white backdrop-blur-2xl">
        {/* Top Lock Icon Badge */}
        <div className={`w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center transition-all ${
          successPulse
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/20 scale-110'
            : 'bg-blue-500/10 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10 animate-pulse'
        }`}>
          {successPulse ? <Unlock className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
        </div>

        {/* Heading */}
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-1">
          Workstation Secured
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          Enter PIN or credentials to unlock this terminal
        </p>

        {/* Current Active Staff Card */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3.5 mb-5 flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300 font-black">
              {currentUser?.name ? currentUser.name.charAt(0) : <User className="w-5 h-5" />}
            </div>
            <div>
              <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                {currentUser?.name || 'Authorized Staff'}
              </div>
              <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                {activeClinic?.name || 'Main Clinic'}
              </div>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${roleInfo.color}`}>
            {roleInfo.label}
          </span>
        </div>

        {/* PIN / Password Display */}
        <form onSubmit={handleUnlock} className="mb-5">
          <div className="relative">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Enter Security PIN / Password"
              autoFocus
              className="w-full bg-slate-950/80 border-2 border-slate-700 focus:border-blue-500 rounded-2xl py-3 px-4 text-center font-mono text-xl tracking-widest text-white placeholder-slate-600 focus:outline-hidden transition-all"
            />
            {pinInput.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1.5"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="mt-2 text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 animate-shake">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </form>

        {/* Touch Numpad Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mb-5 max-w-xs mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-12 sm:h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:bg-blue-600 text-white font-bold text-lg sm:text-xl border border-slate-700/60 shadow-sm transition-all flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 sm:h-14 rounded-2xl bg-slate-800/50 hover:bg-slate-700/70 text-slate-400 hover:text-white font-bold text-xs border border-slate-700/40 transition-all flex items-center justify-center uppercase tracking-wider"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress(0)}
            className="h-12 sm:h-14 rounded-2xl bg-slate-800/90 hover:bg-slate-700 active:bg-blue-600 text-white font-bold text-lg sm:text-xl border border-slate-700/60 shadow-sm transition-all flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 sm:h-14 rounded-2xl bg-slate-800/50 hover:bg-slate-700/70 text-slate-400 hover:text-white font-bold border border-slate-700/40 transition-all flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              clinicAudio.triggerHaptic(15);
              unlockScreen('1234'); // Quick bypass / logout
              logoutUser();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition-colors"
          >
            Switch User / Logout
          </button>
          <button
            type="button"
            onClick={handleUnlock}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Unlock className="w-4 h-4" />
            <span>Unlock Terminal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
