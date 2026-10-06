import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Building2,
  Users,
  ShieldCheck,
  Lock,
  Unlock,
  Plus,
  Edit3,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  KeyRound,
  Download,
  QrCode,
  RefreshCw,
  LogOut,
  ChevronRight,
  Filter,
  FileSpreadsheet,
  FileText,
  Activity,
  Trash2,
  Monitor,
  Wifi,
  Power,
  XCircle,
  Smartphone,
  Check,
  Sliders,
  ToggleRight,
  ToggleLeft,
  Pill,
  Stethoscope,
  Tv,
  Receipt,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import { useClinic } from '../../context/useClinic';
import { clinicAudio } from '../../utils/clinicAudio';
import { WorkstationHeaderControls } from '../common/WorkstationHeaderControls';
import {
  generateTotpCode,
  verifyTotpCode,
  calculateRenewalStatus,
  generateQrPlaceholderSvg
} from '../../utils/googleAuthEngine';
import { AuthLoginModal } from '../common/AuthLoginModal';

export const SuperAdminDashboard = () => {
  const {
    clinics,
    activeClinicId,
    activeClinic,
    switchClinic,
    lockClinic,
    unlockClinic,
    addClinic,
    updateClinic,
    deleteClinic,
    setClinicFeature,
    toggleClinicFeature,
    bulkSetClinicFeatures,
    isClinicFeatureEnabled,
    CLINIC_FEATURE_MODULES,
    DEFAULT_CLINIC_FEATURES,
    users,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    renewGoogleAuth,
    auditLogs,
    logAuditEvent,
    USER_ROLES,
    setActiveRole
  } = useClinic();

  const [activeTab, setActiveTab] = useState('clinics'); // 'clinics' | 'features' | 'sessions' | 'security' | 'users' | 'audit'
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Clinic Modal
  const [clinicModalType, setClinicModalType] = useState(null); // 'ADD' | 'EDIT' | 'LOCK'
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [clinicFormData, setClinicFormData] = useState({
    name: '',
    tagline: '',
    code: '',
    address: '',
    phone: '',
    email: '',
    displayLogo: '',
    printingLogo: '',
    lockReason: ''
  });

  // User Modal
  const [userModalType, setUserModalType] = useState(null); // 'ADD' | 'EDIT'
  const [selectedUser, setSelectedUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    username: '',
    name: '',
    role: 'ADMIN_USER',
    clinicId: 'CLI-101',
    email: '',
    doctorCabinId: 1,
    googleAuthEnabled: true
  });

  // 2FA Renewal Modal
  const [totpVerificationInput, setTotpVerificationInput] = useState('');
  const [totpModalUser, setTotpModalUser] = useState(null);
  const [totpError, setTotpError] = useState('');

  // Audit Logs Filter
  const [severityFilter, setSeverityFilter] = useState('ALL');

  // Multi-Tenant Feature Management State (FR-01, FR-02, FR-03, FR-05)
  const [featureViewMode, setFeatureViewMode] = useState('cards'); // 'cards' | 'matrix'
  const [featureClinicFilter, setFeatureClinicFilter] = useState('ALL');
  const [featureStatusFilter, setFeatureStatusFilter] = useState('ALL'); // 'ALL' | 'FULL' | 'CUSTOM'
  const [featureAuditFilter, setFeatureAuditFilter] = useState('ALL');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Branch Session & Device Monitoring State
  const [branchSessions, setBranchSessions] = useState([
    {
      id: 'SES-CLI101-01',
      clinicId: 'CLI-101',
      clinicName: 'Fatima Outpatient Center',
      workstation: 'Main Lobby Touch Kiosk 1',
      deviceType: 'KIOSK',
      operator: 'Patient Self-Service (Kiosk Agent)',
      ipAddress: '192.168.10.15',
      sessionStart: '08:30 AM',
      durationMinutes: 58,
      lastHeartbeatSeconds: 3,
      status: 'ACTIVE'
    },
    {
      id: 'SES-CLI101-02',
      clinicId: 'CLI-101',
      clinicName: 'Fatima Outpatient Center',
      workstation: 'Doctor Cabin 1 Console',
      deviceType: 'DESKTOP',
      operator: 'Dr. Julian Harris, MD, FACC',
      ipAddress: '192.168.10.22',
      sessionStart: '07:45 AM',
      durationMinutes: 103,
      lastHeartbeatSeconds: 12,
      status: 'ACTIVE'
    },
    {
      id: 'SES-CLI101-03',
      clinicId: 'CLI-101',
      clinicName: 'Fatima Outpatient Center',
      workstation: 'Cashier & Billing POS Desk',
      deviceType: 'DESKTOP',
      operator: 'Tariq Mahmood (Cashier)',
      ipAddress: '192.168.10.35',
      sessionStart: '08:50 AM',
      durationMinutes: 38,
      lastHeartbeatSeconds: 7,
      status: 'ACTIVE'
    },
    {
      id: 'SES-CLI101-04',
      clinicId: 'CLI-101',
      clinicName: 'Fatima Outpatient Center',
      workstation: 'Inhouse Branch Pharmacy Desk',
      deviceType: 'DESKTOP',
      operator: 'Pharm. Sanaullah Khan (R.Ph)',
      ipAddress: '192.168.10.44',
      sessionStart: '07:30 AM',
      durationMinutes: 118,
      lastHeartbeatSeconds: 19,
      status: 'ACTIVE'
    },
    {
      id: 'SES-CLI102-01',
      clinicId: 'CLI-102',
      clinicName: 'Clifton Medical Complex',
      workstation: 'Entrance Kiosk Terminal 02',
      deviceType: 'KIOSK',
      operator: 'Patient Self-Service (Kiosk Agent)',
      ipAddress: '192.168.20.12',
      sessionStart: '09:05 AM',
      durationMinutes: 23,
      lastHeartbeatSeconds: 2,
      status: 'ACTIVE'
    },
    {
      id: 'SES-CLI102-02',
      clinicId: 'CLI-102',
      clinicName: 'Clifton Medical Complex',
      workstation: 'Doctor Cabin 2 (Pediatrics)',
      deviceType: 'DESKTOP',
      operator: 'Dr. Sarah Jenkins',
      ipAddress: '192.168.20.28',
      sessionStart: '08:15 AM',
      durationMinutes: 73,
      lastHeartbeatSeconds: 28,
      status: 'IDLE'
    }
  ]);

  const handleTerminateSession = (sessionId) => {
    clinicAudio.triggerHaptic(20);
    const target = branchSessions.find((s) => s.id === sessionId);
    setBranchSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: 'TERMINATED' } : s))
    );
    logAuditEvent(
      'SESSION_TERMINATED',
      `Super Admin terminated remote workstation session ${sessionId} (${target?.workstation || ''}) at ${target?.clinicName || ''}`,
      'WARNING'
    );
    showToast(`Workstation session ${sessionId} terminated successfully.`);
  };

  const handleLockSession = (sessionId) => {
    clinicAudio.triggerHaptic(20);
    const target = branchSessions.find((s) => s.id === sessionId);
    setBranchSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: s.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED' } : s))
    );
    logAuditEvent(
      'SESSION_REMOTE_LOCKED',
      `Super Admin ${target?.status === 'LOCKED' ? 'unlocked' : 'locked'} workstation session ${sessionId} (${target?.workstation || ''})`,
      'INFO'
    );
    showToast(`Workstation ${target?.workstation} ${target?.status === 'LOCKED' ? 'unlocked' : 'locked remotely'}.`);
  };

  const handleRefreshSessions = () => {
    clinicAudio.triggerHaptic(15);
    setBranchSessions((prev) =>
      prev.map((s) => ({
        ...s,
        lastHeartbeatSeconds: Math.floor(Math.random() * 5) + 1,
        durationMinutes: s.status !== 'TERMINATED' ? s.durationMinutes + 1 : s.durationMinutes
      }))
    );
    showToast('Branch workstation heartbeats refreshed across all clinics.');
  };

  // Filtered Clinics
  const filteredClinics = useMemo(() => {
    if (!searchQuery) return clinics;
    const q = searchQuery.toLowerCase();
    return clinics.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }, [clinics, searchQuery]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    let list = users;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q) ||
          u.clinicId.toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, searchQuery]);

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    let list = auditLogs;
    if (severityFilter !== 'ALL') {
      list = list.filter((l) => l.severity === severityFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q) ||
          l.user.toLowerCase().includes(q) ||
          (l.clinicName && l.clinicName.toLowerCase().includes(q))
      );
    }
    return list;
  }, [auditLogs, severityFilter, searchQuery]);

  // Export Audit Logs as CSV
  const exportAuditLogsCSV = () => {
    clinicAudio.triggerHaptic(20);
    const headers = ['Timestamp', 'Action', 'Severity', 'User', 'Role', 'Clinic ID', 'Clinic Name', 'Details'];
    const rows = filteredAuditLogs.map((l) => [
      `"${new Date(l.timestamp).toLocaleString()}"`,
      `"${l.action}"`,
      `"${l.severity}"`,
      `"${l.user}"`,
      `"${l.role}"`,
      `"${l.clinicId || ''}"`,
      `"${l.clinicName || ''}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `system_audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Audit logs exported successfully');
  };

  // =========================================================================
  // Multi-Tenant Feature Management Helpers & Memos (FR-01, FR-02, FR-03, FR-05, FR-06)
  // =========================================================================
  const getFeatureIcon = (iconName) => {
    switch (iconName) {
      case 'Pill': return Pill;
      case 'Stethoscope': return Stethoscope;
      case 'Smartphone': return Smartphone;
      case 'Receipt': return Receipt;
      case 'Tv': return Tv;
      default: return Layers;
    }
  };

  const featureMetrics = useMemo(() => {
    const totalClinics = clinics.length;
    const modulesPerClinic = (CLINIC_FEATURE_MODULES || []).length;
    const totalPossible = totalClinics * modulesPerClinic;
    let totalActive = 0;
    let fullyEnabledClinics = 0;

    clinics.forEach((clinic) => {
      const feats = clinic.features || DEFAULT_CLINIC_FEATURES;
      const activeCount = (CLINIC_FEATURE_MODULES || []).filter((m) => feats[m.key] !== false).length;
      totalActive += activeCount;
      if (activeCount === modulesPerClinic) {
        fullyEnabledClinics += 1;
      }
    });

    const totalDeactivated = Math.max(0, totalPossible - totalActive);
    const featureAuditEvents = auditLogs.filter((l) => l.action === 'CLINIC_FEATURE_FLAG_CHANGED').length;

    return {
      totalClinics,
      totalPossible,
      totalActive,
      totalDeactivated,
      fullyEnabledClinics,
      featureAuditEvents
    };
  }, [clinics, CLINIC_FEATURE_MODULES, DEFAULT_CLINIC_FEATURES, auditLogs]);

  const filteredFeatureClinics = useMemo(() => {
    return clinics.filter((c) => {
      if (featureClinicFilter !== 'ALL' && c.id !== featureClinicFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name?.toLowerCase().includes(q);
        const matchesCode = c.code?.toLowerCase().includes(q);
        const matchesCity = c.address?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesCity) return false;
      }
      if (featureStatusFilter === 'FULL') {
        const feats = c.features || DEFAULT_CLINIC_FEATURES;
        const activeCount = (CLINIC_FEATURE_MODULES || []).filter((m) => feats[m.key] !== false).length;
        if (activeCount !== (CLINIC_FEATURE_MODULES || []).length) return false;
      } else if (featureStatusFilter === 'CUSTOM') {
        const feats = c.features || DEFAULT_CLINIC_FEATURES;
        const activeCount = (CLINIC_FEATURE_MODULES || []).filter((m) => feats[m.key] !== false).length;
        if (activeCount === (CLINIC_FEATURE_MODULES || []).length) return false;
      }
      return true;
    });
  }, [clinics, featureClinicFilter, searchQuery, featureStatusFilter, CLINIC_FEATURE_MODULES, DEFAULT_CLINIC_FEATURES]);

  const featureAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (log.action !== 'CLINIC_FEATURE_FLAG_CHANGED') return false;
      if (featureAuditFilter !== 'ALL' && log.clinicId !== featureAuditFilter) return false;
      return true;
    });
  }, [auditLogs, featureAuditFilter]);

  const handleFeatureToggle = (clinicId, featureKey) => {
    clinicAudio.triggerHaptic(15);
    const targetClinic = clinics.find((c) => c.id === clinicId);
    const res = toggleClinicFeature(clinicId, featureKey);
    if (res?.success) {
      const mod = (CLINIC_FEATURE_MODULES || []).find((m) => m.key === featureKey);
      showToast(`${mod?.name || featureKey} is now ${res.newStatus} for ${targetClinic?.name}`);
    } else {
      showToast(res?.error || 'Failed to update feature flag');
    }
  };

  const handleBulkEnable = (clinicId) => {
    clinicAudio.triggerHaptic(20);
    const allEnabled = {};
    (CLINIC_FEATURE_MODULES || []).forEach((m) => {
      allEnabled[m.key] = true;
    });
    const res = bulkSetClinicFeatures(clinicId, allEnabled);
    if (res?.success) {
      const targetClinic = clinics.find((c) => c.id === clinicId);
      showToast(`All 5 modules activated for ${targetClinic?.name}`);
    } else {
      showToast(res?.error || 'Failed to update features');
    }
  };

  const handleBulkDisable = (clinicId) => {
    clinicAudio.triggerHaptic(20);
    const targetClinic = clinics.find((c) => c.id === clinicId);
    if (window.confirm(`Deactivate all 5 modules for "${targetClinic?.name}"? Clinical and patient workstation access will be suspended immediately.`)) {
      const allDisabled = {};
      (CLINIC_FEATURE_MODULES || []).forEach((m) => {
        allDisabled[m.key] = false;
      });
      const res = bulkSetClinicFeatures(clinicId, allDisabled);
      if (res?.success) {
        showToast(`All modules deactivated for ${targetClinic?.name}`);
      } else {
        showToast(res?.error || 'Failed to update features');
      }
    }
  };

  const handleResetDefaults = (clinicId) => {
    clinicAudio.triggerHaptic(15);
    const res = bulkSetClinicFeatures(clinicId, { ...DEFAULT_CLINIC_FEATURES });
    if (res?.success) {
      const targetClinic = clinics.find((c) => c.id === clinicId);
      showToast(`Reset features to default for ${targetClinic?.name}`);
    } else {
      showToast(res?.error || 'Failed to reset features');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans select-none">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-black animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Super Admin Navigation Banner */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-rose-900/30">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">Super Admin Platform Console</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Multi-Clinic Central Control
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Logged in as: <strong className="text-white">{currentUser?.name || 'System Administrator (Software Admin)'}</strong> • Software Administrator Platform Account
            </p>
          </div>
        </div>

        {/* Global Controls & Identity Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Hospital Identity & Switch User Button (Exclusive to Super Admin) */}
          <button
            type="button"
            onClick={() => {
              clinicAudio.triggerHaptic(10);
              setShowAuthModal(true);
            }}
            className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-blue-900/30 transition-all cursor-pointer"
            title="Hospital Identity & 2FA Account Switcher"
          >
            <KeyRound className="w-4 h-4 text-blue-200" />
            <span>Switch User / 2FA Identity</span>
          </button>

          <div className="px-3.5 py-1.5 rounded-2xl bg-slate-850 border border-slate-700/80 text-center">
            <span className="text-[9px] text-slate-400 uppercase font-bold block">Clinics</span>
            <span className="text-sm font-black text-teal-400 font-mono">{clinics.length} Centers</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-2xl bg-slate-850 border border-slate-700/80 text-center">
            <span className="text-[9px] text-slate-400 uppercase font-bold block">System Users</span>
            <span className="text-sm font-black text-amber-400 font-mono">{users.length} Users</span>
          </div>

          <button
            type="button"
            onClick={() => {
              clinicAudio.triggerHaptic(15);
              setActiveRole('PATIENT_KIOSK');
            }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            title="Return to Main Portal"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Exit Console</span>
          </button>

          <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />
          <WorkstationHeaderControls theme="dark" />
        </div>
      </header>

      {/* Content and Right Navigation Container */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Left: Main Tab Panels Content */}
        <main className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto max-w-7xl mx-auto w-full order-1">
        {/* =========================================================================
            TAB 1: MULTI-CLINIC DIRECTORY & CLINIC SUSPENSION / LOCK CONTROL
            ========================================================================= */}
        {activeTab === 'clinics' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-teal-400" />
                  Multi-Clinic Management Directory
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Super Admin control to add clinics, configure logos, manage terminals, and enforce instant clinic locks.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(15);
                  setClinicFormData({
                    name: '',
                    tagline: 'Outpatient Care & Medical Diagnostics',
                    code: '',
                    address: '',
                    phone: '',
                    email: '',
                    displayLogo: '',
                    printingLogo: '',
                    lockReason: ''
                  });
                  setClinicModalType('ADD');
                }}
                className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-teal-900/30 transition-all cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Clinic Facility</span>
              </button>
            </div>

            {/* Top 4 KPI Metrics in Image 2 Style */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">TOTAL FACILITIES</div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-black text-white font-mono">{clinics.length} Centers</span>
                  <span className="text-[10px] font-bold text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-800/60">100% Online</span>
                </div>
              </div>

              <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">ACTIVE SESSIONS</div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-black text-white font-mono">{branchSessions.filter(s => s.status !== 'TERMINATED').length} Live</span>
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-800/60">Heartbeat OK</span>
                </div>
              </div>

              <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">PLATFORM USERS</div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-black text-white font-mono">{users.length} Accounts</span>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/60">2FA Enforced</span>
                </div>
              </div>

              <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400">NETWORK AUDIT</div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-black text-white font-mono">{auditLogs.length} Events</span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">Live Compliance</span>
                </div>
              </div>
            </div>

            {/* Clinics Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredClinics.map((clinic) => {
                const isLocked = clinic.status === 'LOCKED' || clinic.status === 'SUSPENDED';
                const isActiveClinicContext = clinic.id === activeClinicId;

                return (
                  <div
                    key={clinic.id}
                    className={`rounded-3xl border-2 p-5 flex flex-col justify-between transition-all bg-slate-850 group ${
                      isLocked
                        ? 'border-rose-500/70 shadow-xl shadow-rose-950/40 ring-2 ring-rose-500/20'
                        : isActiveClinicContext
                        ? 'border-teal-400 ring-4 ring-teal-400/20 shadow-xl shadow-teal-950/30'
                        : 'border-slate-700/80 hover:border-slate-600 shadow-md'
                    }`}
                  >
                    <div>
                      {/* Facility Photo Banner with Status Overlay */}
                      <div className="relative h-28 -mx-5 -mt-5 mb-4 rounded-t-3xl overflow-hidden bg-slate-800">
                        <img
                          src={clinic.image || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&auto=format&fit=crop&q=80'}
                          alt={clinic.name}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-850 via-slate-850/40 to-transparent" />
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-lg bg-slate-900/80 backdrop-blur-xs text-slate-200 font-mono font-bold text-[11px] border border-white/10">
                            {clinic.code} • {clinic.id}
                          </span>

                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-xs flex items-center gap-1.5 shadow-sm ${
                              isLocked
                                ? 'bg-rose-500/90 text-white animate-pulse'
                                : 'bg-emerald-500/90 text-slate-950'
                            }`}
                          >
                            {isLocked ? <Lock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                            <span>{isLocked ? 'LOCKED / SUSPENDED' : 'OPERATIONAL'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Clinic Name & Tagline */}
                      <h3 className="text-base font-black text-white leading-tight">
                        {clinic.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {clinic.tagline}
                      </p>

                      {/* Suspension Reason Banner (if locked) */}
                      {isLocked && clinic.lockReason && (
                        <div className="mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-xs text-rose-200">
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block mb-0.5">
                            Lock Reason:
                          </span>
                          <span className="font-mono">{clinic.lockReason}</span>
                        </div>
                      )}

                      {/* Details Strip */}
                      <div className="mt-4 pt-3 border-t border-slate-750 space-y-1.5 text-xs text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Address:</span>
                          <span className="font-medium truncate max-w-[160px]">{clinic.address || 'Medical District'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Phone:</span>
                          <span className="font-mono text-[11px]">{clinic.phone || '+1 (555) 019-2831'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Terminals Configured:</span>
                          <span className="font-bold text-teal-300">
                            {clinic.kioskDevices?.length || 1} Kiosk(s)
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Logos Configured:</span>
                          <span className="text-[11px] font-bold text-slate-300">
                            {clinic.displayLogo ? 'Display Logo ✓' : 'Default Emblem'} • {clinic.printingLogo ? 'Print Logo ✓' : 'Default'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="mt-5 pt-3.5 border-t border-slate-750 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          clinicAudio.triggerHaptic(15);
                          switchClinic(clinic.id);
                          showToast(`Active clinic context set to "${clinic.name}"`);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isActiveClinicContext
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 cursor-default'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {isActiveClinicContext ? 'Active Context' : 'Select Clinic'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            clinicAudio.triggerHaptic(10);
                            setSelectedClinic(clinic);
                            setClinicFormData({
                              name: clinic.name,
                              tagline: clinic.tagline || '',
                              code: clinic.code,
                              address: clinic.address || '',
                              phone: clinic.phone || '',
                              email: clinic.email || '',
                              displayLogo: clinic.displayLogo || '',
                              printingLogo: clinic.printingLogo || '',
                              lockReason: clinic.lockReason || ''
                            });
                            setClinicModalType('EDIT');
                          }}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        {/* Lock / Unlock Toggle Button */}
                        {isLocked ? (
                          <button
                            type="button"
                            onClick={() => {
                              clinicAudio.triggerHaptic(20);
                              unlockClinic(clinic.id);
                              showToast(`Clinic "${clinic.name}" UNLOCKED and restored to active service`);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Unlock Clinic</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              clinicAudio.triggerHaptic(20);
                              setSelectedClinic(clinic);
                              setClinicFormData((prev) => ({
                                ...prev,
                                lockReason: 'Administrative Suspension. License verification or maintenance required.'
                              }));
                              setClinicModalType('LOCK');
                            }}
                            className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-rose-950/40"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Lock Clinic</span>
                          </button>
                        )}

                        {/* Delete Clinic Branch Button (Super Admin) */}
                        {clinics.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              clinicAudio.triggerHaptic(20);
                              if (window.confirm(`Permanently remove clinic branch "${clinic.name}" (${clinic.code})? All associated branch workstations will be unlinked.`)) {
                                const res = deleteClinic(clinic.id);
                                if (res.success) {
                                  showToast(`Clinic "${clinic.name}" deleted successfully.`);
                                } else {
                                  showToast(res.error || 'Failed to delete clinic branch');
                                }
                              }
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-rose-950/70 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800 rounded-xl transition-colors cursor-pointer"
                            title="Delete Clinic Branch"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* =========================================================================
            TAB: MULTI-TENANT CLINIC FEATURE MANAGEMENT (FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07)
            ========================================================================= */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Central Governance Policy
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-400 border border-teal-500/30">
                    FR-01 • Multi-Tenant
                  </span>
                </div>
                <h2 className="text-xl font-black text-white flex items-center gap-2 mt-1">
                  <Sliders className="w-5 h-5 text-rose-400" />
                  Clinic Feature Flags & Workstation Controls
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
                  Super Admin centralized control to activate or deactivate modules per clinic individually. Changes propagate in real-time across all tenant workstations without redeployment.
                </p>
              </div>

              {/* View Switcher & Global Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* View Mode: Cards vs Matrix */}
                <div className="bg-slate-850 p-1 rounded-2xl border border-slate-750 flex items-center shadow-xs">
                  <button
                    type="button"
                    onClick={() => {
                      clinicAudio.triggerHaptic(10);
                      setFeatureViewMode('cards');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                      featureViewMode === 'cards'
                        ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md shadow-rose-950/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Facility Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clinicAudio.triggerHaptic(10);
                      setFeatureViewMode('matrix');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                      featureViewMode === 'matrix'
                        ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-md shadow-rose-950/50'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Matrix View</span>
                  </button>
                </div>

                {/* Facility Filter */}
                <div className="relative">
                  <select
                    value={featureClinicFilter}
                    onChange={(e) => {
                      clinicAudio.triggerHaptic(10);
                      setFeatureClinicFilter(e.target.value);
                    }}
                    className="bg-slate-850 hover:bg-slate-800 border border-slate-750 text-xs font-bold text-slate-200 py-2 pl-3 pr-8 rounded-2xl focus:outline-none focus:border-rose-500 cursor-pointer shadow-xs appearance-none"
                  >
                    <option value="ALL">All Facilities ({clinics.length})</option>
                    {clinics.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Top 4 KPI Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">TOTAL FACILITIES</div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-black text-white font-mono">{featureMetrics.totalClinics} Centers</span>
                  <span className="text-[10px] font-bold text-teal-400 bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-800/60">
                    Isolated Tenants
                  </span>
                </div>
              </div>

              <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">ACTIVE MODULE LICENSES</div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-black text-white font-mono">
                    {featureMetrics.totalActive} / {featureMetrics.totalPossible}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                    {Math.round((featureMetrics.totalActive / (featureMetrics.totalPossible || 1)) * 100)}% Operational
                  </span>
                </div>
              </div>

              <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">DEACTIVATED MODULES</div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-black font-mono text-rose-400">
                    {featureMetrics.totalDeactivated} Inactive
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    featureMetrics.totalDeactivated > 0
                      ? 'text-amber-400 bg-amber-950/60 border-amber-800/60'
                      : 'text-slate-400 bg-slate-800/60 border-slate-700/60'
                  }`}>
                    {featureMetrics.totalDeactivated > 0 ? 'Policy Restricted' : 'All Modules Active'}
                  </span>
                </div>
              </div>

              <div className="bg-slate-850 p-4 rounded-2xl border border-slate-750 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400">GOVERNANCE AUDITS</div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-black text-white font-mono">
                    {featureMetrics.featureAuditEvents} Events
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                    FR-06 Compliant
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Filter Pill Bar */}
            <div className="flex items-center justify-between gap-3 bg-slate-850/80 p-3 rounded-2xl border border-slate-750 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  Filter Modules:
                </span>
                {[
                  { id: 'ALL', label: 'All Facilities' },
                  { id: 'FULL', label: '100% Fully Enabled' },
                  { id: 'CUSTOM', label: 'Custom Configuration' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      clinicAudio.triggerHaptic(10);
                      setFeatureStatusFilter(f.id);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      featureStatusFilter === f.id
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-slate-400 font-medium">
                Showing <strong className="text-white">{filteredFeatureClinics.length}</strong> of {clinics.length} facilities
              </div>
            </div>

            {/* VIEW MODE 1: FACILITY CARDS */}
            {featureViewMode === 'cards' && (
              <div className="space-y-6">
                {filteredFeatureClinics.map((clinic) => {
                  const feats = clinic.features || DEFAULT_CLINIC_FEATURES;
                  const activeCount = (CLINIC_FEATURE_MODULES || []).filter((m) => feats[m.key] !== false).length;
                  const totalCount = (CLINIC_FEATURE_MODULES || []).length;
                  const isAllActive = activeCount === totalCount;

                  return (
                    <div
                      key={clinic.id}
                      className="bg-slate-850 rounded-3xl border border-slate-750/90 shadow-xl overflow-hidden transition-all hover:border-slate-650"
                    >
                      {/* Clinic Card Header */}
                      <div className="bg-slate-900/90 px-5 py-4 border-b border-slate-750/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-black text-white">{clinic.name}</h3>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                {clinic.code}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                clinic.status === 'ACTIVE'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}>
                                {clinic.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {clinic.address || 'Central Healthcare Facility'} • Clinic ID: <span className="font-mono text-slate-300">{clinic.id}</span>
                            </p>
                          </div>
                        </div>

                        {/* Presets and Status Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 border ${
                            isAllActive
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                              : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${isAllActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                            <span>{activeCount} of {totalCount} Modules Active</span>
                          </div>

                          {/* Quick Presets */}
                          <div className="h-5 w-px bg-slate-750 mx-1 hidden sm:block" />

                          <button
                            type="button"
                            onClick={() => handleBulkEnable(clinic.id)}
                            className="px-2.5 py-1.5 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/70 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                            title="Activate all 5 modules for this clinic"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Enable All</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleBulkDisable(clinic.id)}
                            className="px-2.5 py-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/70 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                            title="Deactivate all modules for this clinic"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>Disable All</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleResetDefaults(clinic.id)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
                            title="Reset all modules to default enabled"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                            <span>Reset</span>
                          </button>
                        </div>
                      </div>

                      {/* 5 Modules Grid */}
                      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
                        {(CLINIC_FEATURE_MODULES || []).map((mod) => {
                          const isEnabled = feats[mod.key] !== false;
                          const IconComponent = getFeatureIcon(mod.iconName);

                          return (
                            <div
                              key={mod.key}
                              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                                isEnabled
                                  ? 'bg-slate-900/90 border-slate-750 hover:border-slate-650 shadow-sm'
                                  : 'bg-slate-950/60 border-slate-800/80 opacity-80 hover:opacity-100'
                              }`}
                            >
                              <div>
                                {/* Module Header with Icon & Status Tag */}
                                <div className="flex items-start justify-between gap-2 mb-3">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                    isEnabled
                                      ? 'bg-gradient-to-tr from-rose-500/20 to-indigo-500/20 text-rose-400 border border-rose-500/30'
                                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                                  }`}>
                                    <IconComponent className="w-4 h-4" />
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                    isEnabled
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  }`}>
                                    {isEnabled ? 'ENABLED' : 'DISABLED'}
                                  </span>
                                </div>

                                {/* Title & Role */}
                                <h4 className="text-sm font-black text-white">{mod.name}</h4>
                                <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                                  {mod.workstationRole}
                                </div>
                                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                                  {mod.description}
                                </p>
                              </div>

                              {/* Interactive Toggle Switch */}
                              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-300">
                                  Module Access
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleFeatureToggle(clinic.id, mod.key)}
                                  className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                                    isEnabled ? 'bg-emerald-600' : 'bg-slate-800'
                                  }`}
                                  role="switch"
                                  aria-checked={isEnabled}
                                  title={`Toggle ${mod.name} for ${clinic.name}`}
                                >
                                  <span
                                    aria-hidden="true"
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                      isEnabled ? 'translate-x-6' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* VIEW MODE 2: COMPARISON MATRIX TABLE */}
            {featureViewMode === 'matrix' && (
              <div className="bg-slate-850 rounded-3xl border border-slate-750 shadow-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-750 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-rose-400" />
                      Clinic Module Comparison Matrix
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Direct side-by-side workstation toggle table for all facilities. Changes update active workstations in real time.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {filteredFeatureClinics.length} Facilities in View
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-750 bg-slate-900/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-4">Facility / Branch</th>
                        {(CLINIC_FEATURE_MODULES || []).map((m) => (
                          <th key={m.key} className="py-3 px-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span>{m.name}</span>
                              <span className="text-[9px] font-mono text-slate-400 font-normal lowercase">{m.key}</span>
                            </div>
                          </th>
                        ))}
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Quick Presets</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-xs">
                      {filteredFeatureClinics.map((clinic) => {
                        const feats = clinic.features || DEFAULT_CLINIC_FEATURES;
                        const activeCount = (CLINIC_FEATURE_MODULES || []).filter((m) => feats[m.key] !== false).length;
                        const totalCount = (CLINIC_FEATURE_MODULES || []).length;

                        return (
                          <tr key={clinic.id} className="hover:bg-slate-800/40 transition-colors">
                            {/* Clinic Info */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-white text-sm">{clinic.name}</div>
                              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                                <span>{clinic.code}</span>
                                <span>•</span>
                                <span>{clinic.id}</span>
                              </div>
                            </td>

                            {/* Module Toggles */}
                            {(CLINIC_FEATURE_MODULES || []).map((mod) => {
                              const isEnabled = feats[mod.key] !== false;
                              return (
                                <td key={mod.key} className="py-3.5 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleFeatureToggle(clinic.id, mod.key)}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
                                      isEnabled
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30'
                                    }`}
                                    title={`Click to ${isEnabled ? 'deactivate' : 'activate'} ${mod.name}`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                    <span>{isEnabled ? 'ON' : 'OFF'}</span>
                                  </button>
                                </td>
                              );
                            })}

                            {/* Active Count Badge */}
                            <td className="py-3.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                activeCount === totalCount
                                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                                  : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                              }`}>
                                {activeCount}/{totalCount}
                              </span>
                            </td>

                            {/* Row Presets */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleBulkEnable(clinic.id)}
                                  className="px-2 py-1 bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-800 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                  title="Enable All"
                                >
                                  All ON
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleBulkDisable(clinic.id)}
                                  className="px-2 py-1 bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                  title="Disable All"
                                >
                                  All OFF
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* FEATURE AUDIT TRAIL LOGS (FR-06) */}
            <div className="bg-slate-850 rounded-3xl border border-slate-750 shadow-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-750 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-400" />
                    <h3 className="text-base font-black text-white">Feature Flag Governance Audit Trail</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-500/20 text-teal-400 border border-teal-500/30">
                      FR-06 Compliant
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Permanent chronological record of every clinic feature flag change: target clinic, module, previous status, updated status, admin user, and timestamp.
                  </p>
                </div>

                {/* Audit Filter */}
                <div className="relative">
                  <select
                    value={featureAuditFilter}
                    onChange={(e) => {
                      clinicAudio.triggerHaptic(10);
                      setFeatureAuditFilter(e.target.value);
                    }}
                    className="bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 py-1.5 pl-3 pr-8 rounded-xl focus:outline-none focus:border-rose-500 cursor-pointer shadow-xs appearance-none"
                  >
                    <option value="ALL">All Clinic Logs ({featureAuditLogs.length})</option>
                    {clinics.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                </div>
              </div>

              {/* Table of Audit Logs */}
              {featureAuditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-300">No feature flag changes logged yet</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Toggle any module feature above to generate real-time audit records.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-900 border-b border-slate-750 text-[10px] font-black uppercase tracking-wider text-slate-400 z-10">
                      <tr>
                        <th className="py-2.5 px-4">Date & Time</th>
                        <th className="py-2.5 px-3">Clinic Facility</th>
                        <th className="py-2.5 px-3">Audit Details</th>
                        <th className="py-2.5 px-3">Modified By</th>
                        <th className="py-2.5 px-3 text-right">Severity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-xs">
                      {featureAuditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition-colors font-mono">
                          <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-slate-200 font-bold whitespace-nowrap text-[11px]">
                            {log.clinicName || log.clinicId}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 text-[11px] font-sans">
                            {log.details}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap text-[11px]">
                            <span className="text-white font-bold">{log.user}</span> ({log.role})
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              log.severity === 'WARNING'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}>
                              {log.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}



        {/* =========================================================================
            TAB 2: GLOBAL USER ACCOUNTS & RBAC MANAGEMENT
            ========================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-400" />
                  Role-Based User Accounts (RBAC)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Super Admin, Single-Clinic Admin, Doctor User, and Kiosk User authentication credentials.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(15);
                  setUserFormData({
                    username: '',
                    name: '',
                    role: 'ADMIN_USER',
                    clinicId: activeClinicId,
                    email: '',
                    doctorCabinId: 1,
                    googleAuthEnabled: true
                  });
                  setUserModalType('ADD');
                }}
                className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-teal-900/30 transition-all cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create User Account</span>
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-slate-850 border border-slate-750 rounded-3xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">User Identity</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Clinic Scope</th>
                    <th className="px-5 py-3.5">Google 2FA Status</th>
                    <th className="px-5 py-3.5">Monthly Renewal Due</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {filteredUsers.map((usr) => {
                    const renewal = calculateRenewalStatus(usr.lastVerifiedDate);
                    return (
                      <tr key={usr.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-black text-white text-sm">{usr.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            username: <strong>{usr.username}</strong> {usr.email && `• ${usr.email}`}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            usr.role === USER_ROLES.SUPER_ADMIN_USER
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : usr.role === USER_ROLES.ADMIN_USER
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : usr.role === USER_ROLES.DOCTOR_USER
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                          }`}>
                            {usr.role.replace('_', ' ')}
                          </span>
                          {usr.doctorCabinId && (
                            <span className="text-[10px] text-slate-400 ml-1.5 font-bold">
                              (Cabin {usr.doctorCabinId})
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-slate-300 font-bold">
                            {usr.clinicId === 'ALL' ? 'All Clinics (Global)' : usr.clinicId}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {usr.googleAuthEnabled ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-max">
                              <CheckCircle2 className="w-3 h-3" />
                              2FA Enabled
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              Password Only
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {usr.googleAuthEnabled ? (
                            <div>
                              <div className="font-mono text-[11px] text-slate-200">
                                {new Date(renewal.nextVerificationRequiredDate).toLocaleDateString()}
                              </div>
                              <span className={`text-[10px] font-black uppercase ${
                                renewal.isExpired ? 'text-rose-400' : renewal.isExpiringSoon ? 'text-amber-400' : 'text-emerald-400'
                              }`}>
                                {renewal.daysRemaining} days remaining
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              clinicAudio.triggerHaptic(10);
                              setTotpModalUser(usr);
                              setTotpVerificationInput('');
                              setTotpError('');
                            }}
                            className="px-2.5 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-lg text-xs font-bold"
                          >
                            Verify 2FA
                          </button>
                          {usr.role !== USER_ROLES.SUPER_ADMIN_USER && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete user ${usr.username}?`)) {
                                  deleteUser(usr.id);
                                  showToast(`User ${usr.username} deleted`);
                                }
                              }}
                              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: BRANCH SECURITY & GOOGLE 2FA GOVERNANCE
            ========================================================================= */}
        {(activeTab === 'security' || activeTab === '2fa') && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-teal-400" />
                Google Authenticator (2FA) Security Architecture
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every doctor, clinic administrator, and master supervisor requires password + 6-digit Google Authenticator code with 30-day scheduled re-verification.
              </p>
            </div>

            {/* Current User 2FA Status Card */}
            <div className="bg-slate-850 border border-slate-750 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-750 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-black">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">{currentUser?.name}</h3>
                    <p className="text-xs text-slate-400">Role: {currentUser?.role} • Account: {currentUser?.username}</p>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-black text-xs">
                  Active TOTP Guarded
                </div>
              </div>

              {(() => {
                const status = calculateRenewalStatus(currentUser?.lastVerifiedDate);
                const currentTotp = generateTotpCode(currentUser?.googleAuthSecret || 'JBSWY3DPEHPK3PXP');

                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Last Verified</span>
                      <span className="text-sm font-black text-white">
                        {new Date(status.lastVerifiedDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Next 30-Day Renewal Due</span>
                      <span className="text-sm font-black text-teal-300">
                        {new Date(status.nextVerificationRequiredDate).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">({status.daysRemaining} days left)</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Simulated Rolling Code</span>
                        <span className="text-2xl font-black font-mono text-amber-400 tracking-wider">
                          {currentTotp}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">Updates 30s</span>
                    </div>
                  </div>
                );
              })()}

              {/* QR Code Simulation & Manual Pairing */}
              <div className="pt-4 border-t border-slate-750 flex flex-col sm:flex-row items-center gap-6">
                <img
                  src={generateQrPlaceholderSvg(currentUser?.username || 'admin')}
                  alt="2FA QR Code"
                  className="w-36 h-36 rounded-2xl bg-white p-2 border border-slate-700 shadow-md"
                />

                <div className="space-y-2 text-xs text-slate-300">
                  <h4 className="font-black text-white text-sm">Pair with Google Authenticator App</h4>
                  <p className="text-slate-400 leading-relaxed">
                    Open Google Authenticator on your smartphone (Android / iOS), tap <strong>+ Add Account</strong> and scan this QR code or enter the manual secret key below:
                  </p>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-amber-300 font-black tracking-wider text-xs">
                    SECRET: {currentUser?.googleAuthSecret || 'JBSWY3DPEHPK3PXP'}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    *For development testing, entering <strong>123456</strong> or the displayed simulated code will immediately verify.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: CENTRALIZED AUDIT & ACTIVITY LOGS
            ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-teal-400" />
                  Centralized Security & System Audit Logs
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time immutable records of user logins, failed attempts, clinic lock/unlock, user modifications, and tokens issued.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-850 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none"
                >
                  <option value="ALL">All Severities</option>
                  <option value="INFO">INFO Only</option>
                  <option value="SUCCESS">SUCCESS Only</option>
                  <option value="WARNING">WARNING Only</option>
                  <option value="ERROR">ERROR Only</option>
                </select>

                <button
                  type="button"
                  onClick={exportAuditLogsCSV}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-slate-850 border border-slate-750 rounded-3xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">Timestamp</th>
                    <th className="px-4 py-3.5">Action Event</th>
                    <th className="px-4 py-3.5">Severity</th>
                    <th className="px-4 py-3.5">User / Operator</th>
                    <th className="px-4 py-3.5">Clinic Scope</th>
                    <th className="px-4 py-3.5">Event Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-bold">
                        No audit records matched your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}{' '}
                          <span className="text-[10px] text-slate-500">
                            {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-black text-white text-[11px]">
                          {log.action}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            log.severity === 'ERROR'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : log.severity === 'WARNING'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : log.severity === 'SUCCESS'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                          }`}>
                            {log.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-200">
                          {log.user} <span className="text-[10px] text-slate-500">({log.role})</span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                          {log.clinicId}
                        </td>
                        <td className="px-4 py-3 text-slate-300 text-[11px]">
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: BRANCH SESSION TIME & WORKSTATION DEVICE MONITORING
            ========================================================================= */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-teal-400" />
                  Branch Session Time & Workstation Device Supervision
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Super Admin real-time supervision of active workstations, session run-time, idle timers, and remote session termination.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefreshSessions}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Ping and refresh all workstation heartbeats"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Heartbeats</span>
                </button>
              </div>
            </div>

            {/* Session KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Active Workstations</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {branchSessions.filter((s) => s.status === 'ACTIVE').length} / {branchSessions.length}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Monitor className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Monitored Branches</span>
                  <span className="text-2xl font-black text-teal-400 font-mono">
                    {clinics.length} Centers
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Idle Workstations</span>
                  <span className="text-2xl font-black text-amber-400 font-mono">
                    {branchSessions.filter((s) => s.status === 'IDLE').length} Terminals
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Max Active Session</span>
                  <span className="text-2xl font-black text-indigo-400 font-mono">
                    {Math.max(...branchSessions.map((s) => s.durationMinutes))} mins
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Live Branch Sessions Table */}
            <div className="bg-slate-850 border border-slate-750 rounded-3xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-teal-400 animate-pulse" />
                  <h3 className="text-sm font-black text-white">Live Connected Workstations Across Branches</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  Real-time heartbeat ping: &lt; 30s
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Branch Location</th>
                      <th className="px-5 py-3.5">Workstation Terminal</th>
                      <th className="px-5 py-3.5">Operator & Scope</th>
                      <th className="px-5 py-3.5">Session Start & Duration</th>
                      <th className="px-5 py-3.5">Heartbeat / IP</th>
                      <th className="px-5 py-3.5">Live Status</th>
                      <th className="px-5 py-3.5 text-right">Super Admin Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {branchSessions.map((s) => {
                      const isTerminated = s.status === 'TERMINATED';
                      const isLocked = s.status === 'LOCKED';
                      const isIdle = s.status === 'IDLE';

                      return (
                        <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                          {/* Branch */}
                          <td className="px-5 py-3.5">
                            <div className="font-black text-white">{s.clinicName}</div>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {s.clinicId}</span>
                          </td>

                          {/* Workstation */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              {s.deviceType === 'KIOSK' ? (
                                <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                              ) : (
                                <Monitor className="w-4 h-4 text-blue-400 shrink-0" />
                              )}
                              <div>
                                <span className="font-black text-slate-100 block">{s.workstation}</span>
                                <span className="text-[10px] text-slate-500 font-mono">Session ID: {s.id}</span>
                              </div>
                            </div>
                          </td>

                          {/* Operator */}
                          <td className="px-5 py-3.5">
                            <span className="font-bold text-slate-200 block">{s.operator}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{s.deviceType}</span>
                          </td>

                          {/* Session Duration */}
                          <td className="px-5 py-3.5 font-mono">
                            <div className="text-white font-bold">{s.sessionStart}</div>
                            <div className="text-[11px] text-teal-300 font-bold">
                              {isTerminated ? 'Session Closed' : `${s.durationMinutes} mins elapsed`}
                            </div>
                          </td>

                          {/* Heartbeat & IP */}
                          <td className="px-5 py-3.5 font-mono text-[11px]">
                            <div className="text-slate-300">{s.ipAddress}</div>
                            {!isTerminated && (
                              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                                <span>Ping {s.lastHeartbeatSeconds}s ago</span>
                              </div>
                            )}
                          </td>

                          {/* Live Status Badge */}
                          <td className="px-5 py-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isTerminated
                                  ? 'bg-slate-800 text-slate-500 border border-slate-700'
                                  : isLocked
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                                  : isIdle
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              }`}
                            >
                              {s.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right space-x-2">
                            {!isTerminated ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleLockSession(s.id)}
                                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                  title={isLocked ? 'Unlock Workstation' : 'Lock Workstation Remotely'}
                                >
                                  {isLocked ? 'Unlock' : 'Lock'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTerminateSession(s.id)}
                                  className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                  title="Force Terminate Session"
                                >
                                  Terminate
                                </button>
                              </>
                            ) : (
                              <span className="text-slate-500 text-[11px] font-mono">Terminated</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Session Security Policies Notice */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
                <span>
                  <strong>Branch Security Policy:</strong> Workstations automatically lock after 5 minutes of inactivity. Super Admin session termination immediately invalidates terminal auth tokens.
                </span>
              </div>
              <span className="text-teal-400 font-mono font-bold shrink-0">
                Auto-Enforce: ACTIVE
              </span>
            </div>
          </div>
        )}
      </main>

        {/* Right: Vertical Super Admin Navigation Sidebar */}
        <aside className="w-full lg:w-72 xl:w-80 bg-slate-950/95 border-t lg:border-t-0 lg:border-l border-slate-800/80 p-3.5 sm:p-4 flex flex-col shrink-0 order-2 overflow-y-auto z-10 space-y-4">
          {/* Aside Header */}
          <div className="pb-3 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-400">
                  Super Admin Navigation
                </span>
              </div>
              <h3 className="text-sm font-black text-white mt-0.5">Control Center</h3>
            </div>
            <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-850 px-2 py-0.5 rounded border border-slate-750">
              {activeClinic?.name || 'Active Clinic'}
            </span>
          </div>

          {/* Quick Context Pill Search Input (Image 2 style) */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Filter ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-12 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700/80 rounded-full text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors shadow-2xs"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
              >
                ✕
              </button>
            ) : (
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded shadow-2xs pointer-events-none">
                ⌘K
              </kbd>
            )}
          </div>

          {/* Vertical Menu Buttons */}
          <nav className="flex flex-col gap-1.5 flex-1">
            {[
              { id: 'clinics', label: 'Branch Supervision', sub: 'Multi-clinic directory & locks', icon: Building2, count: clinics.length },
              { id: 'features', label: 'Feature Flags', sub: 'Multi-tenant module control', icon: Sliders, badge: '5 Modules', highlight: true },
              { id: 'sessions', label: 'Terminal Sessions', sub: 'Kiosks & active terminals', icon: Clock, count: branchSessions.filter((s) => s.status !== 'TERMINATED').length },
              { id: 'security', label: 'Security & 2FA', sub: 'TOTP Google Auth rules', icon: ShieldCheck, badge: 'Enforced' },
              { id: 'users', label: 'User Accounts (RBAC)', sub: 'Roles & credentials', icon: Users, count: users.length },
              { id: 'audit', label: 'Security Audit Logs', sub: 'Tamper-proof compliance', icon: Activity, count: auditLogs.length }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    clinicAudio.triggerHaptic(10);
                    setActiveTab(tab.id);
                    setSearchQuery('');
                  }}
                  className={`p-3 rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between group ${
                    isActive
                      ? 'bg-gradient-to-r from-[#8B0029] via-[#9E1238] to-[#8B0029] text-white shadow-lg shadow-rose-950/60 font-black'
                      : tab.highlight
                        ? 'bg-rose-950/30 text-rose-300 hover:bg-rose-900/40 border border-rose-800/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : tab.highlight
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-slate-800 text-slate-300 group-hover:text-white'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className={`text-xs font-black truncate leading-tight ${isActive ? 'text-white' : 'text-slate-200'}`}>
                        {tab.label}
                      </div>
                      <div className={`text-[10px] truncate leading-none mt-0.5 ${isActive ? 'text-rose-100 font-semibold' : 'text-slate-500'}`}>
                        {tab.sub}
                      </div>
                    </div>
                  </div>

                  {tab.count !== undefined ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                      isActive
                        ? 'bg-slate-950/20 text-slate-950'
                        : tab.highlight
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                    }`}>
                      {tab.count}
                    </span>
                  ) : tab.badge ? (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 uppercase tracking-wider ${
                      isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                    }`}>
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          {/* Quick System Status & Telemetry Widget */}
          <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
              <span>Platform Telemetry</span>
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Network Online
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-[11px] font-mono">
              <div className="p-1.5 bg-slate-850 rounded-lg border border-slate-750">
                <span className="text-[9px] text-slate-400 block font-sans font-bold">FACILITIES</span>
                <span className="font-bold text-white">{clinics.length} Centers</span>
              </div>
              <div className="p-1.5 bg-slate-850 rounded-lg border border-slate-750">
                <span className="text-[9px] text-slate-400 block font-sans font-bold">TERMINALS</span>
                <span className="font-bold text-amber-400">{branchSessions.filter(s => s.status !== 'TERMINATED').length} Live</span>
              </div>
            </div>
            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>Platform Mode:</span>
              <strong className="text-teal-400">Multi-Clinic Enterprise</strong>
            </div>
          </div>
        </aside>
      </div>

      {/* =========================================================================
          MODAL: ADD / EDIT CLINIC
          ========================================================================= */}
      {(clinicModalType === 'ADD' || clinicModalType === 'EDIT') && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-750 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-white space-y-4 max-h-[92vh] overflow-y-auto">
            <h3 className="text-lg font-black">
              {clinicModalType === 'ADD' ? 'Add New Clinic Facility' : `Edit ${selectedClinic?.name}`}
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                clinicAudio.triggerHaptic(20);
                if (clinicModalType === 'ADD') {
                  const created = addClinic(clinicFormData);
                  showToast(`Clinic ${created.name} registered`);
                } else {
                  updateClinic(selectedClinic.id, clinicFormData);
                  showToast(`Clinic ${selectedClinic.name} updated`);
                }
                setClinicModalType(null);
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Clinic Name</label>
                <input
                  type="text"
                  required
                  value={clinicFormData.name}
                  onChange={(e) => setClinicFormData({ ...clinicFormData, name: e.target.value })}
                  placeholder="e.g. Fatima Clinic & Diagnostic Center"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-750 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Clinic Code</label>
                  <input
                    type="text"
                    required
                    value={clinicFormData.code}
                    onChange={(e) => setClinicFormData({ ...clinicFormData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. FATIMA"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-750 rounded-xl text-xs text-white uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={clinicFormData.phone}
                    onChange={(e) => setClinicFormData({ ...clinicFormData, phone: e.target.value })}
                    placeholder="+1 (555) 019-2831"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-750 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Tagline / Department Focus</label>
                <input
                  type="text"
                  value={clinicFormData.tagline}
                  onChange={(e) => setClinicFormData({ ...clinicFormData, tagline: e.target.value })}
                  placeholder="Comprehensive Outpatient Care & Diagnostics"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-750 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Physical Address</label>
                <input
                  type="text"
                  value={clinicFormData.address}
                  onChange={(e) => setClinicFormData({ ...clinicFormData, address: e.target.value })}
                  placeholder="42 Health Avenue, Medical District"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-750 rounded-xl text-xs text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setClinicModalType(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-black shadow-md"
                >
                  Save Clinic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: SUSPEND / LOCK CLINIC CONFIRMATION
          ========================================================================= */}
      {clinicModalType === 'LOCK' && selectedClinic && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border-2 border-rose-500/60 rounded-3xl max-w-md w-full p-6 shadow-2xl text-white space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto mb-2 animate-bounce">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-black text-center text-rose-400">
              Suspend / Lock {selectedClinic.name}?
            </h3>
            <p className="text-xs text-slate-300 text-center leading-relaxed">
              Locking this clinic will immediately block all Kiosk screens, Doctor consoles, and Admin panels for this location with:
              <br />
              <strong className="text-white">"Clinic Access Suspended. Please contact administrator."</strong>
            </p>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Reason for Lockout (Displayed to Staff)</label>
              <textarea
                rows={3}
                required
                value={clinicFormData.lockReason}
                onChange={(e) => setClinicFormData({ ...clinicFormData, lockReason: e.target.value })}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setClinicModalType(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(25);
                  lockClinic(selectedClinic.id, clinicFormData.lockReason);
                  showToast(`Clinic "${selectedClinic.name}" LOCKED & SUSPENDED`);
                  setClinicModalType(null);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-950/40"
              >
                Confirm Clinic Lockout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: VERIFY / RENEW 2FA
          ========================================================================= */}
      {totpModalUser && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-750 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-white space-y-4 text-center max-h-[92vh] overflow-y-auto">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto mb-1">
              <KeyRound className="w-7 h-7" />
            </div>

            <h3 className="text-base font-black text-white">
              Verify 2FA for {totpModalUser.name}
            </h3>
            <p className="text-xs text-slate-400">
              Enter the 6-digit Google Authenticator code (or test code <strong>123456</strong>):
            </p>

            <input
              type="text"
              maxLength={6}
              value={totpVerificationInput}
              onChange={(e) => setTotpVerificationInput(e.target.value)}
              placeholder="000000"
              className="w-full text-center text-2xl font-mono font-black tracking-widest px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white focus:outline-none focus:border-teal-400"
            />

            {totpError && (
              <p className="text-xs font-bold text-rose-400">{totpError}</p>
            )}

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setTotpModalUser(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(20);
                  const res = renewGoogleAuth(totpModalUser.id, totpVerificationInput);
                  if (res.success) {
                    showToast(`2FA renewed for 30 days on account ${totpModalUser.username}`);
                    setTotpModalUser(null);
                  } else {
                    setTotpError(res.error || 'Invalid code');
                  }
                }}
                className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs shadow-md"
              >
                Validate & Renew
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD USER (RBAC)
          ========================================================================= */}
      {userModalType === 'ADD' && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-750 rounded-3xl max-w-md w-full p-6 shadow-2xl text-white space-y-4 max-h-[92vh] overflow-y-auto">
            <h3 className="text-lg font-black">Create System User Account</h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                clinicAudio.triggerHaptic(20);
                addUser(userFormData);
                showToast(`User ${userFormData.username} created (${userFormData.role})`);
                setUserModalType(null);
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  placeholder="e.g. Dr. Julian Harris"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-750 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={userFormData.username}
                    onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                    placeholder="doctor1"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-750 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">User Role</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-750 rounded-xl text-xs text-white font-bold"
                  >
                    <option value="KIOSK_USER">Kiosk User (Terminal Only)</option>
                    <option value="DOCTOR_USER">Doctor User (Cabin Only)</option>
                    <option value="ADMIN_USER">Clinic Administrator</option>
                    <option value="SUPER_ADMIN_USER">Super Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Clinic Assignment</label>
                <select
                  value={userFormData.clinicId}
                  onChange={(e) => setUserFormData({ ...userFormData, clinicId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-750 rounded-xl text-xs text-white font-bold"
                >
                  <option value="ALL">All Clinics (Super Admin)</option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id})
                    </option>
                  ))}
                </select>
              </div>

              {userFormData.role === 'DOCTOR_USER' && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Assigned Doctor Cabin #</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={userFormData.doctorCabinId}
                    onChange={(e) => setUserFormData({ ...userFormData, doctorCabinId: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-750 rounded-xl text-xs text-white font-bold"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUserModalType(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-black shadow-md"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Hospital Identity & 2FA Auth Modal (Super Admin Exclusive) */}
      <AuthLoginModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};
