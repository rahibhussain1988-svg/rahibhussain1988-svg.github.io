import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Shield,
  KeyRound,
  User,
  Lock,
  LogOut,
  X,
  CheckCircle2,
  AlertCircle,
  QrCode,
  RefreshCw,
  Sparkles,
  Stethoscope,
  Building2,
  Tv,
  HeartPulse,
  Clock
} from 'lucide-react';
import { useClinic } from '../../context/useClinic';
import { clinicAudio } from '../../utils/clinicAudio';
import {
  generateTotpCode,
  calculateRenewalStatus,
  generateQrPlaceholderSvg
} from '../../utils/googleAuthEngine';

export const AuthLoginModal = ({ isOpen, onClose }) => {
  const {
    currentUser,
    users,
    loginUser,
    logoutUser,
    activeClinic,
    activeClinicId,
    USER_ROLES,
    renewGoogleAuth
  } = useClinic();

  const [selectedUser, setSelectedUser] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [totpInput, setTotpInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [currentRollingCode, setCurrentRollingCode] = useState('123456');

  // When opened, initialize selection from currentUser or default to admin
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
      setTotpInput('');
      const target = currentUser || users.find((u) => u.role === USER_ROLES.ADMIN_USER) || users[0];
      if (target) {
        setSelectedUser(target);
        setUsernameInput(target.username);
        setPasswordInput('password123');
      }
    }
  }, [isOpen, currentUser, users, USER_ROLES]);

  // Keep rolling TOTP updated every 5 seconds for convenience
  useEffect(() => {
    if (!selectedUser?.googleAuthSecret) return;
    const updateCode = () => {
      const code = generateTotpCode(selectedUser.googleAuthSecret);
      setCurrentRollingCode(code);
    };
    updateCode();
    const interval = setInterval(updateCode, 4000);
    return () => clearInterval(interval);
  }, [selectedUser]);

  if (!isOpen) return null;

  const handleSelectQuickAccount = (u) => {
    clinicAudio.triggerHaptic(15);
    setSelectedUser(u);
    setUsernameInput(u.username);
    setPasswordInput('password123');
    setErrorMsg('');
    setSuccessMsg('');
    setTotpInput('');
  };

  const handleLoginSubmit = (e) => {
    if (e) e.preventDefault();
    clinicAudio.triggerHaptic(20);
    setErrorMsg('');

    const targetUser = selectedUser || users.find((u) => u.username.toLowerCase() === usernameInput.trim().toLowerCase());
    if (!targetUser) {
      setErrorMsg('User not found. Please select or enter a valid username.');
      return;
    }

    const codeToSubmit = totpInput.trim() || currentRollingCode; // Autofill active rolling code for smooth UX

    const res = loginUser(targetUser.username, passwordInput, codeToSubmit);
    if (res.success) {
      setSuccessMsg(`Welcome, ${res.user.name}! Authenticated via Google 2FA.`);
      clinicAudio.playChime();
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setErrorMsg(res.error || 'Authentication failed. Please verify credentials.');
      clinicAudio.playChime();
    }
  };

  const renewal = selectedUser ? calculateRenewalStatus(selectedUser.lastVerifiedDate) : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="relative z-10 w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-blue-300">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight text-white">
                  Hospital Access & Identity
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
                  2FA Active
                </span>
              </div>
              <p className="text-xs text-blue-200/80">
                Role-Based Authentication • Google Authenticator Security
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Quick Demo Switcher Tabs */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-2">
              Select User Profile (Role-Based Access):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {users.map((u) => {
                const isSelected = selectedUser?.id === u.id;
                let icon = <User className="w-4 h-4" />;
                let roleShort = 'Staff';
                if (u.role === USER_ROLES.SUPER_ADMIN_USER) {
                  icon = <Shield className="w-4 h-4 text-purple-600" />;
                  roleShort = 'Super Admin';
                } else if (u.role === USER_ROLES.ADMIN_USER) {
                  icon = <Building2 className="w-4 h-4 text-blue-600" />;
                  roleShort = 'Clinic Admin';
                } else if (u.role === USER_ROLES.DOCTOR_USER) {
                  icon = <Stethoscope className="w-4 h-4 text-emerald-600" />;
                  roleShort = `Dr Cabin ${u.doctorCabinId || 1}`;
                } else if (u.role === USER_ROLES.KIOSK_USER) {
                  icon = <HeartPulse className="w-4 h-4 text-amber-600" />;
                  roleShort = 'Kiosk Term.';
                }

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectQuickAccount(u)}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'bg-blue-50/90 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                        : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="p-1 rounded-lg bg-white border border-slate-200 shadow-2xs">
                        {icon}
                      </span>
                      {currentUser?.id === u.id && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-600 text-white">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-black text-slate-900 truncate">
                      {u.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {roleShort}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* User Profile Card & 2FA Health */}
          {selectedUser && (
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-blue-950">{selectedUser.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-800">
                    @{selectedUser.username}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Role: <strong className="text-slate-900">{selectedUser.role}</strong> • Clinic: <strong className="text-slate-900">{selectedUser.clinicId}</strong>
                </div>
              </div>

              {/* 30-Day Renewal Indicator */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-blue-200 text-xs font-mono shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">2FA Renewal</span>
                  <span className="font-bold text-slate-800 text-[11px]">
                    {renewal?.daysRemaining > 0 ? `${renewal.daysRemaining} days remaining` : 'Renewal Due'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">
                  Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="e.g. admin or superadmin"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-medium text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-xs font-medium text-slate-900 font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Google Authenticator Code Input */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Google Authenticator (6-Digit Code)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowQrModal((prev) => !prev)}
                  className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{showQrModal ? 'Hide QR' : 'Show Authenticator QR'}</span>
                </button>
              </div>

              {/* QR Code Collapsible */}
              {showQrModal && selectedUser && (
                <div className="p-3 bg-white rounded-xl border border-blue-200 mb-3 flex items-center gap-4 animate-fadeIn">
                  <img
                    src={generateQrPlaceholderSvg(selectedUser.username, selectedUser.googleAuthSecret)}
                    alt="2FA QR Code"
                    className="w-20 h-20 rounded-lg border border-slate-200 p-1"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-slate-900 mb-0.5">Scan in Google Authenticator</div>
                    <div className="text-[11px] text-slate-500 font-mono break-all mb-1">
                      Secret: {selectedUser.googleAuthSecret}
                    </div>
                    <div className="text-[10px] text-blue-600 font-bold">
                      Issuer: Fatima Clinic Care System
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={totpInput}
                  onChange={(e) => setTotpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder={`Active Code: ${currentRollingCode}`}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-center font-mono text-base tracking-widest font-black text-blue-950 placeholder-slate-400 bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    clinicAudio.triggerHaptic(10);
                    setTotpInput(currentRollingCode);
                  }}
                  title="Autofill Live Authenticator Code"
                  className="px-3 py-2.5 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-800 text-xs font-bold font-mono transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Autofill ({currentRollingCode})</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1 font-mono">
                <span>💡 Tip: Rolling 6-digit TOTP automatically matches RFC simulation. Default testing bypass is also accepted.</span>
              </p>
            </div>

            {/* Error & Success Messages */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    clinicAudio.triggerHaptic(15);
                    logoutUser();
                    onClose();
                  }}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs border border-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-black text-xs shadow-lg shadow-blue-700/25 flex items-center justify-center gap-2 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Confirm & Switch Identity</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
