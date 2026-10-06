import React, { useState, useMemo } from 'react';
import {
  Building2,
  Stethoscope,
  Activity,
  FlaskConical,
  Pill,
  AlertCircle,
  Clock,
  Calendar,
  Users,
  Receipt,
  CreditCard,
  FileText,
  Settings,
  Shield,
  Plus,
  Trash2,
  Edit3,
  Save,
  Download,
  Upload,
  RotateCcw,
  Search,
  Check,
  X,
  ChevronRight,
  AlertTriangle,
  Eye,
  DollarSign,
  HeartPulse,
  Package,
  Layers,
  Camera,
  Image as ImageIcon,
  Printer,
  Cpu,
  Ticket,
  Banknote,
  QrCode,
  Lock,
  Unlock,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  FileSpreadsheet,
  Scissors,
  Zap,
  Heart,
  CheckCircle2
} from 'lucide-react';
import { useClinic } from '../../context/useClinic';
import { clinicAudio } from '../../utils/clinicAudio';
import { printMedicalDocument, generateDirectPdf } from '../../utils/printEngine';
import { WorkstationHeaderControls } from '../common/WorkstationHeaderControls';
import {
  generateTotpCode,
  verifyTotpCode,
  calculateRenewalStatus,
  generateQrPlaceholderSvg
} from '../../utils/googleAuthEngine';

const CURRENCIES = [
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee (PKR - Rs)', flag: '🇵🇰' },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD - $)', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR - €)', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP - £)', flag: '🇬🇧' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham (AED)', flag: '🇦🇪' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal (SAR)', flag: '🇸🇦' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR - ₹)', flag: '🇮🇳' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar (CAD - C$)', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (AUD - A$)', flag: '🇦🇺' },
  { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal (QAR)', flag: '🇶🇦' },
  { code: 'KWD', symbol: 'KWD', name: 'Kuwaiti Dinar (KWD)', flag: '🇰🇼' },
  { code: 'OMR', symbol: 'OMR', name: 'Omani Rial (OMR)', flag: '🇴🇲' }
];

const DOCTOR_AVATAR_PRESETS = [
  { id: 'p1', label: 'Male Specialist 1', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80' },
  { id: 'p2', label: 'Female Specialist 1', url: 'https://images.unsplash.com/photo-1594824813515-59d43bf7e170?w=400&auto=format&fit=crop&q=80' },
  { id: 'p3', label: 'Male Surgeon', url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80' },
  { id: 'p4', label: 'Female Pediatrician', url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80' },
  { id: 'p5', label: 'Male Consultant', url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80' },
  { id: 'p6', label: 'Female Physician', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80' },
  { id: 'p7', label: 'Senior Doctor', url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&auto=format&fit=crop&q=80' },
  { id: 'p8', label: 'Resident Doctor', url: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&auto=format&fit=crop&q=80' }
];

export const AdminDashboard = () => {
  const {
    cabins,
    services,
    pharmacyFormulary,
    symptoms,
    timeSlots,
    patients,
    invoices,
    patientHistoryList,
    clinicSettings,
    currencySymbol,
    currencyCode,
    formatCurrency,
    calculateTotalRevenue,
    addCabin,
    updateCabin,
    deleteCabin,
    addService,
    updateService,
    deleteService,
    addFormularyItem,
    updateFormularyItem,
    deleteFormularyItem,
    addSymptom,
    updateSymptom,
    deleteSymptom,
    addTimeSlot,
    deleteTimeSlot,
    updatePatient,
    deletePatient,
    updateInvoice,
    deleteInvoice,
    addPatientHistory,
    updatePatientHistory,
    deletePatientHistory,
    updateClinicSettings,
    updateHardwarePrinter,
    toggleHardwarePrinterStatus,
    updatePharmacySettings,
    exportAllDataJSON,
    importAllDataJSON,
    resetDemoData,
    activeClinic,
    updateClinicLogos,
    kioskLockState,
    updateKioskDevicePin,
    addKioskDevice,
    deleteKioskDevice,
    users,
    currentUser,
    addUser,
    updateUser,
    deleteUser,
    renewGoogleAuth,
    USER_ROLES,
    isCurrentClinicLocked,
    emergencyProcedures,
    emergencySettings,
    addEmergencyProcedure,
    updateEmergencyProcedure,
    deleteEmergencyProcedure,
    toggleEmergencyProcedureStatus,
    updateEmergencySettings,
    addEmergencyKit,
    updateEmergencyKit,
    deleteEmergencyKit
  } = useClinic();

  // Active Tab State
  const [activeTab, setActiveTab] = useState('settings');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  const [adminFormularyFilter, setAdminFormularyFilter] = useState('ALL'); // 'ALL' | 'PHARMACY' | 'GENERAL'

  // Modal State
  const [modalType, setModalType] = useState(null);
  const [modalData, setModalData] = useState(null);

  // Emergency Minor Procedure Modal
  const [procModalType, setProcModalType] = useState(null); // 'ADD' | 'EDIT'
  const [selectedProc, setSelectedProc] = useState(null);
  const [procFormData, setProcFormData] = useState({
    code: '',
    name: '',
    category: 'Wound Care',
    price: 500,
    durationMinutes: 15,
    description: '',
    severity: 'URGENT',
    consumables: '',
    cabinId: 1,
    active: true
  });

  // Emergency Trauma Kit Modal
  const [kitModalType, setKitModalType] = useState(null); // 'ADD' | 'EDIT'
  const [selectedKit, setSelectedKit] = useState(null);
  const [kitFormData, setKitFormData] = useState({
    code: '',
    name: '',
    price: 1500,
    targetRoom: 'Cabin 1 - Treatment Room',
    items: ''
  });

  // Emergency Category Filter
  const [procCategoryFilter, setProcCategoryFilter] = useState('ALL');

  // Emergency Workflow Metrics
  const emergencyStats = useMemo(() => {
    const totalConfigured = emergencyProcedures?.length || 0;
    const activeConfigured = emergencyProcedures?.filter((p) => p.active !== false).length || 0;

    // Today's emergency patients
    const emergencyPatients = (patients || []).filter((p) => p.isEmergency || p.tokenNumber?.startsWith('EMG-'));
    const totalAdmissions = emergencyPatients.length;

    // Completed minor procedures
    const completedProcs = (patients || []).reduce((acc, p) => {
      const procs = (p.minorProcedures || []).filter((pr) => pr.status === 'COMPLETED');
      return acc + procs.length;
    }, 0);

    // Revenue generated in PKR
    const emergencyRevenue = emergencyPatients.reduce((acc, p) => acc + (Number(p.consultationFee || p.totalFee || 0)), 0);

    return {
      totalConfigured,
      activeConfigured,
      totalAdmissions,
      completedProcs,
      emergencyRevenue
    };
  }, [emergencyProcedures, patients]);

  // Operational Currency Selection Workflow Modal
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [currencySearchQuery, setCurrencySearchQuery] = useState('');

  // Doctor Photo Upload Modal
  const [photoModalCabin, setPhotoModalCabin] = useState(null);

  // Dual Logo State
  const [editingPinDevice, setEditingPinDevice] = useState(null);
  const [newPinInput, setNewPinInput] = useState('');
  const [newDeviceModal, setNewDeviceModal] = useState(false);
  const [newDeviceData, setNewDeviceData] = useState({ name: '', pin: '1234', location: 'Main Lobby' });

  // 2FA Renewal State
  const [totpInput, setTotpInput] = useState('');
  const [totpError, setTotpError] = useState('');

  // Local Clinic Staff User Modal State
  const [clinicUserModal, setClinicUserModal] = useState(false);
  const [clinicUserData, setClinicUserData] = useState({
    username: '',
    name: '',
    role: 'DOCTOR_USER',
    doctorCabinId: 1,
    email: '',
    googleAuthEnabled: true
  });

  const handleLogoUpload = (e, logoKey) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo image should be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (logoKey === 'displayLogo') {
        updateClinicLogos(activeClinic?.id, { displayLogo: dataUrl });
        showToast('Clinic Display Logo updated');
      } else if (logoKey === 'printingLogo') {
        updateClinicLogos(activeClinic?.id, { printingLogo: dataUrl });
        showToast('Clinic Printing Logo updated');
      }
    };
    reader.readAsDataURL(file);
  };

  const exportDailyReportCSV = () => {
    clinicAudio.triggerHaptic(20);
    const headers = ['Token Number', 'Patient Name', 'Age', 'Gender', 'Phone', 'Doctor', 'Cabin', 'Status', 'Billed Amount', 'Payment Method'];
    const rows = patients.map((p) => {
      const inv = invoices.find((i) => i.patientId === p.id || i.tokenNumber === p.tokenNumber);
      const cabin = cabins.find((c) => c.cabinId === p.cabinId);
      return [
        `"${p.tokenNumber}"`,
        `"${p.patientName}"`,
        `"${p.age || ''}"`,
        `"${p.gender || ''}"`,
        `"${p.phone || ''}"`,
        `"${cabin?.doctorName || ''}"`,
        `"Cabin ${p.cabinId}"`,
        `"${p.status}"`,
        `"${inv ? inv.total : cabin?.consultationFee || 0}"`,
        `"${inv ? inv.paymentMethod : 'CASH'}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `daily_clinic_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Daily clinical report exported to CSV');
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // KPIs
  const totalCabins = cabins.length;
  const onDutyDoctors = cabins.filter((c) => c.status !== 'OFF_DUTY').length;
  const activeTokens = patients.filter((p) => p.status === 'WAITING' || p.status === 'WITH_DOCTOR').length;
  const todayRevenue = calculateTotalRevenue(invoices);
  const lowStockDrugs = pharmacyFormulary.filter((m) => (m.stock !== undefined && m.stock < 20)).length;

  // Filtered queries
  const filteredCabins = useMemo(() => {
    if (!searchQuery) return cabins;
    const q = searchQuery.toLowerCase();
    return cabins.filter(c => c.cabinName?.toLowerCase().includes(q) || c.doctorName?.toLowerCase().includes(q) || c.department?.toLowerCase().includes(q));
  }, [cabins, searchQuery]);

  const filteredServices = useMemo(() => {
    if (!searchQuery) return services;
    const q = searchQuery.toLowerCase();
    return services.filter(s => s.name?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q));
  }, [services, searchQuery]);

  const filteredFormulary = useMemo(() => {
    let list = pharmacyFormulary;
    if (adminFormularyFilter === 'PHARMACY') {
      list = list.filter((m) => m.type !== 'GENERAL');
    } else if (adminFormularyFilter === 'GENERAL') {
      list = list.filter((m) => m.type === 'GENERAL');
    }
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.generic?.toLowerCase().includes(q) ||
        m.category?.toLowerCase().includes(q)
    );
  }, [pharmacyFormulary, adminFormularyFilter, searchQuery]);

  const filteredSymptoms = useMemo(() => {
    if (!searchQuery) return symptoms;
    const q = searchQuery.toLowerCase();
    return symptoms.filter(sym => sym.label?.toLowerCase().includes(q) || sym.dept?.toLowerCase().includes(q) || sym.doctorName?.toLowerCase().includes(q));
  }, [symptoms, searchQuery]);

  const filteredPatients = useMemo(() => {
    if (!searchQuery) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter(p => p.patientName?.toLowerCase().includes(q) || p.tokenNumber?.toLowerCase().includes(q) || p.phone?.toLowerCase().includes(q));
  }, [patients, searchQuery]);

  const filteredInvoices = useMemo(() => {
    if (!searchQuery) return invoices;
    const q = searchQuery.toLowerCase();
    return invoices.filter(i => i.invoiceNumber?.toLowerCase().includes(q) || i.tokenNumber?.toLowerCase().includes(q) || i.patientName?.toLowerCase().includes(q));
  }, [invoices, searchQuery]);

  const filteredHistory = useMemo(() => {
    if (!searchQuery) return patientHistoryList;
    const q = searchQuery.toLowerCase();
    return patientHistoryList.filter(h => h.patientName?.toLowerCase().includes(q) || h.phone?.toLowerCase().includes(q));
  }, [patientHistoryList, searchQuery]);

  const clinicStaffUsers = useMemo(() => {
    return users.filter((u) => u.clinicId === activeClinic?.id);
  }, [users, activeClinic?.id]);

  const ADMIN_TAB_GROUPS = useMemo(() => [
    {
      title: 'Facility & Security',
      tabs: [
        { id: 'settings', label: 'Basic Settings', icon: Settings },
        { id: 'printers', label: 'Printers & Hardware', icon: Printer },
        { id: 'logos', label: 'Logo Management', icon: ImageIcon },
        { id: 'kiosk_sec', label: 'Kiosk Security & PIN', icon: Lock },
        { id: 'auth_2fa', label: 'Google 2FA Security', icon: KeyRound },
        { id: 'clinic_users', label: 'Clinic Staff (RBAC)', icon: Users, count: clinicStaffUsers.length },
      ]
    },
    {
      title: 'Clinical & Formulary',
      tabs: [
        { id: 'emergency', label: 'Emergency & Procedures', icon: AlertTriangle, count: emergencyProcedures?.length },
        { id: 'cabins', label: 'Cabins & Doctors', icon: Building2, count: cabins.length },
        { id: 'pharmacy', label: 'Pharmacy & Supplies', icon: Pill, count: pharmacyFormulary.length },
        { id: 'services', label: 'Services & Labs', icon: FlaskConical, count: services.length },
        { id: 'symptoms', label: 'Symptoms Matrix', icon: AlertCircle, count: symptoms.length },
        { id: 'slots', label: 'Appointment Slots', icon: Clock, count: timeSlots.length },
      ]
    },
    {
      title: 'Operations & Ledgers',
      tabs: [
        { id: 'queue', label: 'Live Lounge Queue', icon: Users, count: patients.length },
        { id: 'invoices', label: 'Billing POS Ledger', icon: Receipt, count: invoices.length },
        { id: 'reports', label: 'Reports & Export', icon: FileSpreadsheet },
        { id: 'patients', label: 'Patient EMR Records', icon: FileText, count: patientHistoryList.length }
      ]
    }
  ], [clinicStaffUsers.length, emergencyProcedures?.length, cabins.length, pharmacyFormulary.length, services.length, symptoms.length, timeSlots.length, patients.length, invoices.length, patientHistoryList.length]);

  // Export File Handler
  const handleExportJSON = () => {
    clinicAudio.triggerHaptic(20);
    const jsonStr = exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeClinicName = (clinicSettings?.clinicName || 'ApexClinic').replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `${safeClinicName}_FullBackup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Database exported successfully as JSON file');
  };

  // Import File Handler
  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const res = importAllDataJSON(content);
        if (res.success) {
          showToast('Database restored successfully from backup!');
        } else {
          alert('Import failed: ' + res.error);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Doctor Picture File Upload to Base64
  const handleImageFileChange = (e, currentData, setFn) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('File size exceeds 3MB. Please upload a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      if (base64) {
        setFn({ ...currentData, image: base64 });
        showToast('Photo uploaded successfully');
      }
    };
    reader.readAsDataURL(file);
  };

  if (isCurrentClinicLocked && currentUser?.role !== USER_ROLES.SUPER_ADMIN_USER) {
    return (
      <div className="flex-1 min-h-[calc(100vh-64px)] bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
        <div className="absolute inset-0 bg-radial from-rose-950/30 to-slate-950 pointer-events-none" />
        <div className="relative z-10 max-w-lg w-full bg-slate-900/90 border-2 border-rose-500/40 rounded-3xl p-8 sm:p-10 text-center shadow-2xl backdrop-blur-xl">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-900/20 animate-pulse">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-wider border border-rose-500/30">
            System Notice
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-3 mb-2">
            Clinic Access Suspended
          </h2>
          <p className="text-slate-300 text-sm sm:text-base font-medium mb-6 leading-relaxed">
            Please contact administrator.
          </p>
          {activeClinic?.lockReason && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-left mb-6">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block mb-1">
                Suspension Reason:
              </span>
              <p className="text-xs text-rose-200 font-mono">
                {activeClinic.lockReason}
              </p>
            </div>
          )}
          <div className="pt-6 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>{activeClinic?.name}</span>
            <span className="font-mono">{activeClinic?.id}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-100 min-h-screen">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-5">
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Top Admin Header & Global Actions */}
      <div className="bg-white border-b border-blue-100 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 text-blue-800 rounded-xl">
                <Settings className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-black text-blue-950 tracking-tight">
                Clinic Master Administration & CMS
              </h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold uppercase">
                Active Currency: {currencyCode} ({currencySymbol})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              System Basic Settings • Upload Doctor Pictures • Currency Selector (PKR / Global) • Touch Screen Dosages • Multi-Station CRUD.
            </p>
          </div>

          {/* Global Operations Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportJSON}
              className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              title="Download entire clinic database as JSON"
            >
              <Download className="w-4 h-4" />
              <span>Export JSON</span>
            </button>

            <label className="px-3.5 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>

            <button
              type="button"
              onClick={() => {
                const conf = window.prompt('CLINIC FACTORY RESET SAFETY CHECK:\nType "RESET" to restore demo defaults and reset queues:');
                if (conf === 'RESET') {
                  resetDemoData();
                  showToast('Clinic reset to factory demo values');
                } else if (conf !== null) {
                  showToast('Factory reset aborted - confirmation text did not match', 'error');
                }
              }}
              className="px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Factory Reset</span>
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />
            <WorkstationHeaderControls />
          </div>
        </div>

        {/* Real-time KPI Metric Counters (Image 2 style) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
          <div className="bg-white border border-slate-200/90 p-3.5 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">CABINS & DOCTORS</div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black text-slate-900 font-mono">{totalCabins} Total</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">{onDutyDoctors} On-Duty</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 p-3.5 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">ACTIVE QUEUE</div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black text-slate-900 font-mono">{activeTokens} Tokens</span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">In Motion</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 p-3.5 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">TODAY'S REVENUE</div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black text-emerald-900 font-mono">{formatCurrency(todayRevenue)}</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">Settled</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 p-3.5 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">FORMULARY DRUGS</div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black text-slate-900 font-mono">{pharmacyFormulary.length} Active</span>
              {lowStockDrugs > 0 ? (
                <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">{lowStockDrugs} Low</span>
              ) : (
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">In Stock</span>
              )}
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 p-3.5 rounded-2xl shadow-2xs hover:shadow-xs transition-shadow">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">PATIENT EMR</div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-black text-slate-900 font-mono">{patientHistoryList.length} Archived</span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60">Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Vertical Navigation & Content Layout */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden bg-[#F8F9FA]">
        {/* Vertical Left Navigation Sidebar */}
        <aside className="w-full md:w-64 lg:w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
          {/* Clinic Context Badge */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/60">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Settings Navigation</div>
            <div className="text-xs font-black text-slate-800 truncate mt-0.5">{activeClinic?.name}</div>
          </div>

          {/* Grouped Vertical Tabs */}
          <div className="p-3 space-y-4 flex-1">
            {ADMIN_TAB_GROUPS.map((group) => (
              <div key={group.title} className="space-y-1">
                <div className="px-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {group.title}
                </div>
                <div className="space-y-0.5">
                  {group.tabs.map((tab) => {
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
                        className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all text-left ${
                          isActive
                            ? 'bg-gradient-to-r from-[#8B0029] to-[#9E1238] text-white shadow-sm shadow-maroon-900/20'
                            : 'text-slate-600 hover:text-maroon-800 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                          <span className="truncate">{tab.label}</span>
                        </div>
                        {tab.count !== undefined && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                              isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Tab Content Panel */}
        <div className="flex-1 min-h-0 flex flex-col min-w-0 overflow-hidden">
          {/* Top Panel Bar with Active Tab Title and Search */}
          <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div>
              <h2 className="text-sm font-black text-slate-900 capitalize">
                {activeTab.replace('_', ' ')}
              </h2>
              <p className="text-[11px] text-slate-500">
                Clinic: <span className="font-bold text-slate-700">{activeClinic?.name}</span> ({activeClinic?.id})
              </p>
            </div>

            {/* Pill search input with ⌘K badge (Image 2 style) */}
            {activeTab !== 'settings' && activeTab !== 'logos' && activeTab !== 'slots' && (
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search in ${activeTab.replace('_', ' ')}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-14 py-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-full text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8B0029] focus:border-[#8B0029] transition-all shadow-2xs"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-white border border-slate-250 rounded shadow-2xs pointer-events-none">
                    ⌘K
                  </kbd>
                )}
              </div>
            )}
          </div>

          {/* Main Tab Panels Content */}
          <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto bg-slate-50/50">
        {/* =========================================================================
            TAB 1: SYSTEM BASIC SETTINGS & DOCTOR PICTURES & CURRENCY (REQUESTED)
        ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-5xl">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                System Basic Settings
              </h2>
              <p className="text-xs text-slate-500">
                Update primary facility configuration, select currency (PKR, USD, EUR, etc.), upload doctor pictures, and customize triage thresholds.
              </p>
            </div>

            {/* CLINIC OPERATIONAL CURRENCY - COMPACT REDESIGNED SINGLE-OPTION WITH WORKFLOW POPUP */}
            <div className="bg-white border-2 border-emerald-100 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Clinic Operational Currency</h3>
                    <p className="text-xs text-slate-500">
                      Primary financial unit across Kiosk pricing, Doctor fees, Pharmacy billing, and Laser invoices.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Active: {currencyCode} ({currencySymbol})</span>
                  </span>
                </div>
              </div>

              {/* Single Option Interactive Card (Click to open Currency Selection Workflow Modal) */}
              {(() => {
                const activeCurrencyObj = CURRENCIES.find((c) => c.code === currencyCode) || {
                  code: currencyCode || 'PKR',
                  symbol: currencySymbol || 'Rs',
                  name: 'Pakistani Rupee (PKR - Rs)',
                  flag: '🇵🇰'
                };

                return (
                  <div
                    onClick={() => {
                      clinicAudio.triggerHaptic(15);
                      setCurrencyModalOpen(true);
                    }}
                    role="button"
                    tabIndex={0}
                    className="p-5 rounded-2xl border-2 border-emerald-200/80 bg-gradient-to-r from-emerald-50/50 via-slate-50 to-teal-50/40 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-emerald-200 text-3xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                        {activeCurrencyObj.flag}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-lg font-black text-slate-900">{activeCurrencyObj.code}</span>
                          <span className="text-xs font-bold text-slate-400">•</span>
                          <span className="text-sm font-bold text-slate-700">{activeCurrencyObj.name}</span>
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-mono font-black text-xs shadow-2xs">
                            Symbol: {activeCurrencyObj.symbol}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Applied globally to patient kiosk check-in, physician fees, pharmacy billing, and receipts.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden lg:block text-right pr-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Live Formatting</span>
                        <span className="text-xs font-mono font-black text-emerald-800">
                          {currencySymbol} 1,500.00
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clinicAudio.triggerHaptic(15);
                          setCurrencyModalOpen(true);
                        }}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 group-hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-2 shadow-xs group-hover:shadow transition-all"
                      >
                        <span>Change Currency</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Live Preview Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between flex-wrap gap-2">
                <span className="text-slate-500 font-bold">Facility Billing Live Preview:</span>
                <div className="flex items-center gap-3 font-mono font-black text-slate-800">
                  <span>Specialist Consultation: <span className="text-emerald-700">{currencySymbol} 1,500</span></span>
                  <span>•</span>
                  <span>Augmentin 625mg: <span className="text-emerald-700">{currencySymbol} 280</span></span>
                  <span>•</span>
                  <span>CBC Diagnostic Lab: <span className="text-emerald-700">{currencySymbol} 650</span></span>
                </div>
              </div>
            </div>

            {/* CONSULTATION SETTLEMENT & TOKEN PAYMENT METHODS (ADMIN CUSTOMIZATION & APPROVAL) */}
            <div className="bg-white border-2 border-emerald-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Consultation Settlement & Token Payment Gateways (Admin Approval)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Standard Default: <strong className="text-emerald-700">Cash at Counter</strong>. Other payment options only appear on Kiosk & Billing Desk upon Admin approval.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-xs">
                    Standard: Cash at Counter
                  </span>
                </div>
              </div>

              {(() => {
                const currentSettings = clinicSettings?.paymentSettings || {
                  defaultMethod: 'CASH',
                  enabledMethods: { CASH: true, CARD: false, TOUCH_PAY_UPI: false, INSURANCE_COPAY: false }
                };
                const enabled = currentSettings.enabledMethods || { CASH: true };

                const toggleMethod = (methodKey, label) => {
                  clinicAudio.triggerHaptic(20);
                  const nextEnabled = {
                    ...enabled,
                    [methodKey]: !enabled[methodKey]
                  };
                  // CASH is always enabled as default standard
                  nextEnabled.CASH = true;

                  updateClinicSettings({
                    paymentSettings: {
                      defaultMethod: 'CASH',
                      enabledMethods: nextEnabled
                    }
                  });

                  const isNowActive = nextEnabled[methodKey];
                  showToast(`${label} is now ${isNowActive ? 'APPROVED & VISIBLE' : 'DISABLED & HIDDEN'} on Kiosk and Billing Desk`);
                };

                const methodCards = [
                  {
                    key: 'CASH',
                    label: 'Cash at Counter',
                    icon: Banknote,
                    desc: 'Exact or tender cash notes collected directly at counter or kiosk.',
                    isDefault: true,
                    active: true
                  },
                  {
                    key: 'CARD',
                    label: 'Credit / Debit Card Terminal',
                    icon: CreditCard,
                    desc: 'Tap / Insert EMV POS terminal for Visa, MasterCard, UnionPay, etc.',
                    isDefault: false,
                    active: !!enabled.CARD
                  },
                  {
                    key: 'TOUCH_PAY_UPI',
                    label: 'Touch UPI / Mobile QR Wallet',
                    icon: QrCode,
                    desc: 'Dynamic QR codes for Raast, JazzCash, EasyPaisa, or instant UPI app scan.',
                    isDefault: false,
                    active: !!enabled.TOUCH_PAY_UPI
                  },
                  {
                    key: 'INSURANCE_COPAY',
                    label: 'Insurance Co-Pay / Panel Pre-Auth',
                    icon: Shield,
                    desc: 'Corporate healthcare panel, Sehat Card, or private HMO pre-authorization.',
                    isDefault: false,
                    active: !!enabled.INSURANCE_COPAY
                  }
                ];

                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {methodCards.map((m) => {
                        const Icon = m.icon;
                        return (
                          <div
                            key={m.key}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                              m.active
                                ? 'bg-emerald-50/40 border-emerald-300 shadow-2xs'
                                : 'bg-slate-50/70 border-slate-200 opacity-75'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                  m.active ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                                }`}>
                                  <Icon className="w-4 h-4" />
                                </div>

                                {m.isDefault ? (
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-600 text-white">
                                    Default (Standard)
                                  </span>
                                ) : (
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                    m.active ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {m.active ? 'Approved' : 'Disabled'}
                                  </span>
                                )}
                              </div>

                              <h4 className="font-black text-xs text-slate-900 leading-tight mb-1">
                                {m.label}
                              </h4>
                              <p className="text-[10px] text-slate-500 leading-normal mb-3">
                                {m.desc}
                              </p>
                            </div>

                            <div>
                              {m.isDefault ? (
                                <div className="w-full py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold text-center border border-emerald-300">
                                  ✓ Always Approved
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => toggleMethod(m.key, m.label)}
                                  className={`w-full py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                                    m.active
                                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                  }`}
                                >
                                  {m.active ? (
                                    <>
                                      <X className="w-3.5 h-3.5" />
                                      <span>Revoke Approval (Hide)</span>
                                    </>
                                  ) : (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Approve for Patients</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs text-slate-600">
                      <span>
                        🔒 <strong>Security Policy:</strong> By clinic workflow rules, <strong>Cash at Counter</strong> is always available. Non-cash channels require Admin toggle to prevent patient confusion if terminals are offline.
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* HARDWARE RECEIPT PRINTER & KIOSK THERMAL CONFIGURATION */}
            <div className="bg-white border-2 border-teal-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold border border-teal-200">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Hardware Receipt Printer & Kiosk Thermal Auto-Adjustment
                    </h3>
                    <p className="text-xs text-slate-500">
                      Auto-detects connected hardware printer. Automatically adjusts paper roll width and printable margins.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 font-bold text-xs flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-teal-600" />
                    <span>Auto-Routing to Plugged-in Default Printer</span>
                  </span>
                </div>
              </div>

              {(() => {
                const currentPrinterSettings = clinicSettings?.printerSettings || {
                  thermalPaperWidth: '80mm',
                  autoPrintOnToken: true,
                  paperSizePrescription: 'A5',
                  hardwareDirectPrint: true
                };

                const updatePrinter = (partial) => {
                  clinicAudio.triggerHaptic(15);
                  updateClinicSettings({
                    printerSettings: {
                      ...currentPrinterSettings,
                      ...partial
                    }
                  });
                  showToast('Printer hardware configuration updated');
                };

                const handleTestPrint = () => {
                  clinicAudio.triggerHaptic(20);
                  printMedicalDocument('printable-admin-test-slip', 'THERMAL', { isAdminTest: true });
                };

                const activeWidth = currentPrinterSettings.thermalPaperWidth || '80mm';

                return (
                  <div className="space-y-4">
                    {/* Paper Width & Auto-Print Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Thermal Paper Width Selection */}
                      <div className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                            Thermal Paper Width (Kiosk & Token Slips)
                          </label>
                          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            Active: {activeWidth}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() => updatePrinter({ thermalPaperWidth: '80mm' })}
                            className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                              activeWidth === '80mm'
                                ? 'bg-teal-50 border-teal-600 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-teal-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-black text-slate-900">80mm Standard POS</span>
                              <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                                activeWidth === '80mm' ? 'border-teal-600 bg-teal-600' : 'border-slate-300'
                              }`}>
                                {activeWidth === '80mm' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-tight">
                              Printable: 72mm. Standard for Epson, Star, Bixolon & hospital kiosks. (Recommended)
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => updatePrinter({ thermalPaperWidth: '58mm' })}
                            className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                              activeWidth === '58mm'
                                ? 'bg-teal-50 border-teal-600 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-teal-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-black text-slate-900">58mm Compact POS</span>
                              <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                                activeWidth === '58mm' ? 'border-teal-600 bg-teal-600' : 'border-slate-300'
                              }`}>
                                {activeWidth === '58mm' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-tight">
                              Printable: 48mm. Compact receipt roll for mini/handheld thermal printers.
                            </p>
                          </button>
                        </div>
                      </div>

                      {/* Auto-Print on Token Issuance Toggle */}
                      <div className="p-4 rounded-2xl border-2 border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                              Auto-Print on Token Issuance
                            </label>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                              currentPrinterSettings.autoPrintOnToken ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {currentPrinterSettings.autoPrintOnToken ? 'AUTO-TRIGGER ON' : 'MANUAL TAP'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-normal">
                            When enabled, the Kiosk immediately sends the queue slip to the plugged-in receipt printer the second payment is confirmed, with zero waiting.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updatePrinter({ autoPrintOnToken: !currentPrinterSettings.autoPrintOnToken })}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                              currentPrinterSettings.autoPrintOnToken
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                            }`}
                          >
                            <Check className="w-4 h-4" />
                            <span>{currentPrinterSettings.autoPrintOnToken ? '✓ Instant Hardware Auto-Print Active' : 'Enable Auto-Print'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Silent Kiosk Hardware Setup & Test Slip */}
                    <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="font-black text-teal-950 flex items-center gap-1.5">
                          <Cpu className="w-4 h-4 text-teal-700" />
                          <span>Plugged-in Hardware Auto-Route Status: Ready</span>
                        </div>
                        <p className="text-[11px] text-teal-800 leading-relaxed max-w-xl">
                          The system automatically targets the OS default printer (USB, Network, or Bluetooth POS). For 100% silent zero-dialog printing in production kiosks, launch Chrome with:
                          <code className="block mt-1 font-mono text-[10px] bg-white/80 p-1.5 rounded border border-teal-200 text-slate-800 select-all">
                            chrome.exe --kiosk http://127.0.0.1:5174/ --kiosk-printing
                          </code>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleTestPrint}
                        className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Test Slip ({activeWidth})</span>
                      </button>
                    </div>

                    {/* Hidden DOM element for Test Thermal Slip Print */}
                    <div className="hidden">
                      <div
                        id="printable-admin-test-slip"
                        className={`bg-white text-slate-900 font-mono text-[10px] p-4 space-y-2 border border-slate-300 ${
                          activeWidth === '58mm' ? 'w-[58mm] text-[8.5px] p-2' : 'w-[80mm]'
                        }`}
                      >
                        <div className="text-center border-b border-dashed border-slate-400 pb-2">
                          <strong className="block text-xs uppercase">{clinicSettings?.clinicName || 'Apex Specialist Care'}</strong>
                          <span className="text-[8px] text-slate-500">HARDWARE PRINTER TEST SLIP</span>
                        </div>
                        <div className="text-center py-2 border-b border-dashed border-slate-400">
                          <span className="text-[8px] block">TEST TOKEN NUMBER</span>
                          <strong className="text-4xl block my-1">C-999</strong>
                          <span className="text-[8px] text-emerald-700 font-bold">✓ HARDWARE PRINTER CONNECTED</span>
                        </div>
                        <div className="text-[8px] space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                          <div>Paper Width: <strong>{activeWidth}</strong></div>
                          <div>Printable Area: <strong>{activeWidth === '58mm' ? '48mm' : '72mm'}</strong></div>
                          <div>Routing: <strong>OS Default Plugged-in POS</strong></div>
                          <div>Date/Time: <strong>{new Date().toLocaleString()}</strong></div>
                        </div>
                        <div className="text-center text-[7.5px] text-slate-500 pt-1">
                          *** END OF PRINTER HARDWARE TEST ***
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* DOCTOR STAFF PHOTOS MANAGEMENT SECTION (REQUESTED: UPLOAD PICTURE OF DOCTORS) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold border border-purple-200">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Doctor Pictures & Visual Profiles</h3>
                    <p className="text-xs text-slate-500">
                      Upload real doctor photos or select professional medical avatars. Broadcasts to Kiosk, TV, & Doctor Cabin.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cabins.map((c) => (
                  <div key={c.cabinId} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-blue-50 border-2 border-blue-200 shrink-0 relative group">
                        <img src={c.image} alt={c.doctorName} className="w-full h-full object-cover" />
                        <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Camera className="w-5 h-5" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              handleImageFileChange(e, c, (updated) => {
                                updateCabin(c.cabinId, updated);
                              });
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-extrabold uppercase text-blue-700">Cabin {c.cabinId}</div>
                        <h4 className="font-black text-xs text-slate-900 truncate">{c.doctorName}</h4>
                        <p className="text-[11px] text-slate-500 truncate">{c.department}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                      <label className="flex-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold text-center cursor-pointer transition-colors">
                        Upload Picture
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            handleImageFileChange(e, c, (updated) => {
                              updateCabin(c.cabinId, updated);
                            });
                          }}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setPhotoModalCabin(c)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                        title="Choose from preset medical avatars"
                      >
                        Presets
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FACILITY BRANDING & PARAMETERS FORM */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                clinicAudio.triggerHaptic(20);
                const formData = new FormData(e.target);
                const updated = {
                  clinicName: formData.get('clinicName'),
                  subtitle: formData.get('subtitle'),
                  emergencyPhone: formData.get('emergencyPhone'),
                  phone: formData.get('phone'),
                  address: formData.get('address'),
                  taxRegistrationNumber: formData.get('taxRegistrationNumber'),
                  accreditation: formData.get('accreditation'),
                  vitalsAlarmThresholds: {
                    tempFever: Number(formData.get('tempFever') || 100.4),
                    bpSystolicHigh: Number(formData.get('bpSystolicHigh') || 140),
                    spo2Low: Number(formData.get('spo2Low') || 94)
                  }
                };
                updateClinicSettings(updated);
                showToast('Facility settings saved successfully');
              }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4"
            >
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2">
                Hospital Profile & Registration Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Clinic Facility Name</label>
                  <input
                    name="clinicName"
                    defaultValue={clinicSettings.clinicName}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Facility Subtitle / Pavilion</label>
                  <input
                    name="subtitle"
                    defaultValue={clinicSettings.subtitle}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Main Reception Phone</label>
                  <input
                    name="phone"
                    defaultValue={clinicSettings.phone}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Hotline</label>
                  <input
                    name="emergencyPhone"
                    defaultValue={clinicSettings.emergencyPhone}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tax / NTN Registration</label>
                  <input
                    name="taxRegistrationNumber"
                    defaultValue={clinicSettings.taxRegistrationNumber || clinicSettings.taxId}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Facility Address</label>
                <input
                  name="address"
                  defaultValue={clinicSettings.address}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                />
              </div>

              {/* Triage Alarm Thresholds */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider mb-2">
                  Triage Vitals Alarm Thresholds
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Fever Threshold (°F)</label>
                    <input
                      name="tempFever"
                      type="number"
                      step="0.1"
                      defaultValue={clinicSettings.vitalsAlarmThresholds?.tempFever || 100.4}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">High BP Systolic (mmHg)</label>
                    <input
                      name="bpSystolicHigh"
                      type="number"
                      defaultValue={clinicSettings.vitalsAlarmThresholds?.bpSystolicHigh || 140}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Low SpO2 Alert (%)</label>
                    <input
                      name="spo2Low"
                      type="number"
                      defaultValue={clinicSettings.vitalsAlarmThresholds?.spo2Low || 94}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Facility Configuration</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =========================================================================
            TAB: EMERGENCY & MINOR PROCEDURES WORKFLOW (CLINIC LEVEL)
        ========================================================================= */}
        {activeTab === 'emergency' && (
          <div className="space-y-6">
            {/* Header & Action Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                    <span>STAT Clinical Protocol</span>
                  </span>
                  <span className="text-xs text-slate-500 font-mono">Currency: PKR ({currencySymbol})</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-[#8B0029]" />
                  <span>Emergency & Minor Procedures Workflow</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Clinic Administrator governance over emergency triage policies, audio alarms, default cabin routing, minor procedures catalog, and trauma kits in PKR.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    clinicAudio.triggerHaptic(15);
                    setProcFormData({
                      code: `EMG-PRC-${Math.floor(100 + Math.random() * 900)}`,
                      name: '',
                      category: 'Wound Care',
                      price: 500,
                      durationMinutes: 15,
                      description: '',
                      severity: 'URGENT',
                      consumables: '',
                      cabinId: 1,
                      active: true
                    });
                    setProcModalType('ADD');
                  }}
                  className="px-3.5 py-2.5 bg-gradient-to-r from-[#8B0029] to-[#9E1238] hover:from-[#7A0024] hover:to-[#8B0029] text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-maroon-900/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Procedure</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    clinicAudio.triggerHaptic(15);
                    setKitFormData({
                      code: `KIT-${Math.floor(100 + Math.random() * 900)}`,
                      name: '',
                      price: 1500,
                      targetRoom: 'Cabin 1 - Treatment Room',
                      items: ''
                    });
                    setKitModalType('ADD');
                  }}
                  className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>Add Emergency Kit</span>
                </button>
              </div>
            </div>

            {/* Live Emergency Metrics Strip (4 cards) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
                  <span>Configured Procedures</span>
                  <Scissors className="w-4 h-4 text-rose-600" />
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">{emergencyStats.totalConfigured}</div>
                <div className="text-[10px] text-emerald-700 mt-1 font-semibold">{emergencyStats.activeConfigured} Active in Live Kiosk & Cabin</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
                  <span>Today's Emergency Patients</span>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl font-black text-amber-700 font-mono">{emergencyStats.totalAdmissions}</div>
                <div className="text-[10px] text-slate-500 mt-1 font-semibold">Priority EMG tokens issued</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
                  <span>Procedures Completed</span>
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                </div>
                <div className="text-2xl font-black text-teal-700 font-mono">{emergencyStats.completedProcs}</div>
                <div className="text-[10px] text-slate-500 mt-1 font-semibold">Logged by attending physician</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
                  <span>Emergency Revenue</span>
                  <Heart className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-emerald-700 font-mono">{formatCurrency(emergencyStats.emergencyRevenue)}</div>
                <div className="text-[10px] text-slate-500 mt-1 font-semibold">Billed & collected in PKR</div>
              </div>
            </div>

            {/* Section 1: Emergency Operational Policies & System Toggles */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Emergency Operational Policies & System Toggles</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure automated behavior across Kiosk terminals, Doctor Cabin consoles, and Nurse Call PA audio.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Toggle 1: Kiosk Intake Card */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black text-slate-800">Kiosk Fast-Track Button</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Show emergency intake card on Kiosk home</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      clinicAudio.triggerHaptic(15);
                      const next = !emergencySettings.kioskIntakeEnabled;
                      updateEmergencySettings({ kioskIntakeEnabled: next });
                      showToast(`Kiosk Emergency Intake ${next ? 'Enabled' : 'Disabled'}`);
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      emergencySettings.kioskIntakeEnabled !== false ? 'bg-[#8B0029]' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      emergencySettings.kioskIntakeEnabled !== false ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>

                {/* Toggle 2: Trauma Express Bypass */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black text-slate-800">Trauma Express Pass (&lt;3s)</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">1-tap fast bypass of demographic fields</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      clinicAudio.triggerHaptic(15);
                      const next = !emergencySettings.traumaBypassEnabled;
                      updateEmergencySettings({ traumaBypassEnabled: next });
                      showToast(`Trauma Express Pass ${next ? 'Enabled' : 'Disabled'}`);
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      emergencySettings.traumaBypassEnabled !== false ? 'bg-[#8B0029]' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      emergencySettings.traumaBypassEnabled !== false ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>

                {/* Toggle 3: Sound Alerts Chime */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black text-slate-800">Emergency Alarm Chime</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Play urgent chime on emergency intake</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      clinicAudio.triggerHaptic(15);
                      const next = !emergencySettings.soundAlertsEnabled;
                      updateEmergencySettings({ soundAlertsEnabled: next });
                      showToast(`Emergency Audio Chime ${next ? 'Enabled' : 'Disabled'}`);
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      emergencySettings.soundAlertsEnabled !== false ? 'bg-rose-600' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      emergencySettings.soundAlertsEnabled !== false ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>

                {/* Toggle 4: Voice PA Broadcast */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black text-slate-800">PA Voice Announcement</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Voice broadcast token & cabin over speakers</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      clinicAudio.triggerHaptic(15);
                      const next = !emergencySettings.voiceBroadcastEnabled;
                      updateEmergencySettings({ voiceBroadcastEnabled: next });
                      showToast(`Emergency Voice PA ${next ? 'Enabled' : 'Disabled'}`);
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      emergencySettings.voiceBroadcastEnabled !== false ? 'bg-rose-600' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      emergencySettings.voiceBroadcastEnabled !== false ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>

                {/* Toggle 5: STAT Head-of-Line Queue */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black text-slate-800">STAT Head-of-Line Queue</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Auto-insert emergency to front of cabin queue</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      clinicAudio.triggerHaptic(15);
                      const next = !emergencySettings.statHeadOfLine;
                      updateEmergencySettings({ statHeadOfLine: next });
                      showToast(`STAT Priority Queue ${next ? 'Enabled' : 'Disabled'}`);
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      emergencySettings.statHeadOfLine !== false ? 'bg-amber-500' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      emergencySettings.statHeadOfLine !== false ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>

                {/* Setting 6: Default Cabin Routing */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black text-slate-800">Default Treatment Cabin</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Target room for emergency intake</div>
                  </div>
                  <select
                    value={emergencySettings.defaultCabinId || 1}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      updateEmergencySettings({ defaultCabinId: val });
                      showToast(`Default Emergency Room set to Cabin ${val}`);
                    }}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-[#8B0029]"
                  >
                    {cabins.map((c) => (
                      <option key={c.cabinId} value={c.cabinId}>
                        Cabin {c.cabinId}: {c.cabinName} ({c.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Minor Procedures Catalog (CRUD) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-rose-600" />
                    <span>Minor Procedures Catalog Management</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Set procedure codes, PKR charges, default sterile supplies, severity level, and active status.
                  </p>
                </div>

                {/* Category Filter Chips */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 max-w-full">
                  {['ALL', 'Wound Care', 'Vascular Access', 'Urology', 'Respiratory Therapy', 'Injections & Medications', 'Surgical & Lacerations'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setProcCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        procCategoryFilter === cat
                          ? 'bg-[#8B0029] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Procedures Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {(emergencyProcedures || [])
                  .filter((p) => {
                    if (procCategoryFilter !== 'ALL' && p.category !== procCategoryFilter) return false;
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase().trim();
                    return (
                      p.name.toLowerCase().includes(q) ||
                      p.code.toLowerCase().includes(q) ||
                      p.category.toLowerCase().includes(q) ||
                      (p.consumables && p.consumables.some((c) => c.toLowerCase().includes(q)))
                    );
                  })
                  .map((proc) => {
                    const isActive = proc.active !== false;
                    return (
                      <div
                        key={proc.id || proc.code}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                          isActive
                            ? 'bg-white border-slate-200 shadow-2xs hover:shadow-xs hover:border-slate-300'
                            : 'bg-slate-50/70 border-slate-200 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-mono font-black text-xs text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              {proc.code}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                proc.severity === 'CRITICAL'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : proc.severity === 'URGENT'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-teal-50 text-teal-700 border border-teal-200'
                              }`}>
                                {proc.severity || 'URGENT'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  clinicAudio.triggerHaptic(10);
                                  toggleEmergencyProcedureStatus(proc.id || proc.code);
                                  showToast(`${proc.name} ${isActive ? 'Disabled' : 'Enabled'}`);
                                }}
                                className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase cursor-pointer transition-colors ${
                                  isActive
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}
                                title="Toggle Active/Inactive"
                              >
                                {isActive ? '● Live' : '○ Inactive'}
                              </button>
                            </div>
                          </div>

                          <h4 className="text-sm font-black text-slate-900 leading-tight">
                            {proc.name}
                          </h4>
                          <div className="text-[11px] font-bold text-slate-500 mt-0.5">
                            {proc.category} • Cabin {proc.cabinId || 1}
                          </div>
                          <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                            {proc.description}
                          </p>

                          {/* Consumables tags */}
                          {proc.consumables && proc.consumables.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-slate-100">
                              <span className="text-[9px] font-black uppercase text-slate-400 block mb-1">Pre-Packed Supplies:</span>
                              <div className="flex flex-wrap gap-1">
                                {proc.consumables.map((item, idx) => (
                                  <span key={idx} className="text-[9px] px-1.5 py-0.5 bg-slate-50 text-slate-700 rounded border border-slate-200">
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Fee (PKR)</span>
                            <span className="text-base font-black text-rose-700 font-mono">
                              {formatCurrency(proc.price)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                clinicAudio.triggerHaptic(15);
                                setSelectedProc(proc);
                                setProcFormData({
                                  code: proc.code,
                                  name: proc.name,
                                  category: proc.category || 'Wound Care',
                                  price: proc.price,
                                  durationMinutes: proc.durationMinutes || 15,
                                  description: proc.description || '',
                                  severity: proc.severity || 'URGENT',
                                  consumables: Array.isArray(proc.consumables) ? proc.consumables.join(', ') : '',
                                  cabinId: proc.cabinId || 1,
                                  active: proc.active !== false
                                });
                                setProcModalType('EDIT');
                              }}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                              title="Edit Procedure"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete minor procedure "${proc.name}" (${proc.code})?`)) {
                                  clinicAudio.triggerHaptic(20);
                                  deleteEmergencyProcedure(proc.id || proc.code);
                                  showToast(`Procedure ${proc.code} deleted`);
                                }
                              }}
                              className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg cursor-pointer transition-colors"
                              title="Delete Procedure"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Section 3: Pre-Assembled Emergency Kits (CRUD) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-600" />
                    <span>Pre-Assembled Emergency Trauma Packs & Kits</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fast-issue trays for immediate dispatch to Treatment Rooms and Doctor Cabins.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(emergencySettings?.emergencyKits || []).map((kit) => (
                  <div key={kit.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="font-mono font-black text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {kit.code}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">{kit.targetRoom}</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 leading-tight mb-2">{kit.name}</h4>
                      <div className="space-y-1 mb-3">
                        <span className="text-[9px] font-black uppercase text-slate-400 block">Pack Contents:</span>
                        <ul className="text-[11px] text-slate-600 space-y-0.5 list-disc list-inside">
                          {(kit.items || []).slice(0, 4).map((it, idx) => (
                            <li key={idx} className="truncate">{it}</li>
                          ))}
                          {(kit.items || []).length > 4 && (
                            <li className="text-slate-400 text-[10px] italic">+{kit.items.length - 4} more items</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-mono font-black text-sm text-emerald-700">{formatCurrency(kit.price)}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            clinicAudio.triggerHaptic(15);
                            setSelectedKit(kit);
                            setKitFormData({
                              code: kit.code,
                              name: kit.name,
                              price: kit.price,
                              targetRoom: kit.targetRoom || 'Cabin 1 - Treatment Room',
                              items: Array.isArray(kit.items) ? kit.items.join(', ') : ''
                            });
                            setKitModalType('EDIT');
                          }}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                          title="Edit Kit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete emergency kit "${kit.name}"?`)) {
                              clinicAudio.triggerHaptic(20);
                              deleteEmergencyKit(kit.id);
                              showToast(`Emergency Kit ${kit.name} removed`);
                            }
                          }}
                          className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg cursor-pointer transition-colors"
                          title="Delete Kit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: CABINS & STAFF (WITH PICTURE UPLOADER)
        ========================================================================= */}
        {activeTab === 'cabins' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Doctor Cabins & Clinical Staff</h2>
                <p className="text-xs text-slate-500">Manage cabin numbers, assigned doctors, medical departments, pictures, and fees.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalType('ADD_CABIN');
                  setModalData({
                    cabinId: cabins.length > 0 ? Math.max(...cabins.map(c => c.cabinId)) + 1 : 1,
                    cabinName: `Cabin ${cabins.length + 1}`,
                    doctorName: 'Dr. New Physician, MD',
                    department: 'General OPD',
                    consultationFee: 1500,
                    experience: '10 Years Exp',
                    rating: 4.8,
                    status: 'AVAILABLE',
                    image: DOCTOR_AVATAR_PRESETS[0].url
                  });
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Doctor Cabin</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCabins.map((c) => (
                <div key={c.cabinId} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-blue-50 border border-blue-200 shrink-0 relative group">
                          <img src={c.image} alt={c.doctorName} className="w-full h-full object-cover" />
                          <label className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Camera className="w-4 h-4" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                handleImageFileChange(e, c, (updated) => {
                                  updateCabin(c.cabinId, updated);
                                });
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">{c.cabinName}</div>
                          <h3 className="text-sm font-black text-slate-900 line-clamp-1">{c.doctorName}</h3>
                          <div className="text-[11px] font-semibold text-slate-500">{c.department}</div>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                        c.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                        c.status === 'IN_CONSULTATION' ? 'bg-amber-100 text-amber-800' :
                        c.status === 'ON_BREAK' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Consultation Fee</span>
                        <span className="font-extrabold text-slate-900">{currencySymbol} {c.consultationFee?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Rating / Exp</span>
                        <span className="font-extrabold text-slate-900">★ {c.rating} • {c.experience}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setModalType('EDIT_CABIN');
                        setModalData({ ...c });
                      }}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (cabins.length <= 1) {
                          alert('At least one cabin must remain in the clinic.');
                          return;
                        }
                        if (window.confirm(`Delete ${c.cabinName} (${c.doctorName})?`)) {
                          deleteCabin(c.cabinId);
                          showToast(`${c.cabinName} deleted`);
                        }
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: SERVICES & DIAGNOSTICS
        ========================================================================= */}
        {activeTab === 'services' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Services & Diagnostic Lab Tests</h2>
                <p className="text-xs text-slate-500">Configure consultation pricing, blood panels, imaging, and hospital procedures.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalType('ADD_SERVICE');
                  setModalData({
                    id: `srv-${Date.now()}`,
                    name: '',
                    category: 'Laboratory',
                    department: 'Pathology Lab',
                    price: 500,
                    code: 'LAB-099',
                    duration: '20 mins',
                    description: ''
                  });
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Service</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-400 font-extrabold text-[10px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Service Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Price ({currencyCode})</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredServices.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-blue-700">{s.code}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{s.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-extrabold text-[10px]">
                          {s.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{s.department}</td>
                      <td className="px-4 py-3 font-extrabold text-emerald-700">{currencySymbol} {s.price?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setModalType('EDIT_SERVICE');
                            setModalData({ ...s });
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete service '${s.name}'?`)) {
                              deleteService(s.id);
                              showToast(`${s.name} removed`);
                            }
                          }}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: PHARMACY FORMULARY & GENERAL CONSUMABLES
        ========================================================================= */}
        {activeTab === 'pharmacy' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-purple-600" />
                  Inhouse Pharmacy Formulary & General Supplies
                </h2>
                <p className="text-xs text-slate-500">
                  Manage medicine inventory, medical consumables, packaging routes, and prescription pad visibility for doctors.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalType('ADD_FORMULARY');
                    setModalData({
                      id: `med-${Date.now()}`,
                      type: 'PHARMACY',
                      name: '',
                      generic: '',
                      strength: '500mg',
                      form: 'Tablet',
                      category: 'Analgesic',
                      price: 150,
                      stock: 100,
                      showToDoctor: true,
                      instructions: 'Take 1 tablet after meals twice daily'
                    });
                  }}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Medication</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalType('ADD_FORMULARY');
                    setModalData({
                      id: `gen-${Date.now()}`,
                      type: 'GENERAL',
                      name: '',
                      generic: 'Medical Consumable',
                      strength: 'Standard Size',
                      form: 'Piece / Unit',
                      category: 'Medical Supply',
                      price: 80,
                      stock: 100,
                      showToDoctor: true,
                      instructions: 'Use as directed for nursing / dressing'
                    });
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Package className="w-4 h-4" />
                  <span>Add General Item</span>
                </button>
              </div>
            </div>

            {/* Pharmacy Operational Policy & Counter Controls Card */}
            <div className="bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-blue-50/50 border border-purple-200 rounded-2xl p-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-purple-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-purple-950 uppercase tracking-wider">
                      Inhouse Pharmacy Operational Policies & Counter Dispensing Controls
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Configure POS counter payment collection, walk-in retail, stock alerts, and default print formats.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold border border-purple-200">
                  Head Pharmacist: {clinicSettings?.pharmacySettings?.headPharmacist || 'Pharm. Sanaullah Khan (R.Ph)'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                {/* 1. Inhouse Pharmacy Service */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Pharmacy Desk</div>
                    <div className="text-[10px] text-slate-400">Enable inhouse pharmacy module</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      clinicAudio.triggerHaptic(15);
                      const current = clinicSettings?.pharmacySettings?.enabled !== false;
                      updatePharmacySettings({ enabled: !current });
                      showToast(!current ? 'Inhouse pharmacy service activated' : 'Inhouse pharmacy paused');
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      clinicSettings?.pharmacySettings?.enabled !== false ? 'bg-purple-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 bg-white rounded-full transition-transform absolute top-1 left-1 ${
                        clinicSettings?.pharmacySettings?.enabled !== false ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Counter Payment Collection */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Counter Payments</div>
                    <div className="text-[10px] text-slate-400">Collect cash/card at pharmacy</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      clinicAudio.triggerHaptic(15);
                      const current = clinicSettings?.pharmacySettings?.counterPaymentEnabled !== false;
                      updatePharmacySettings({ counterPaymentEnabled: !current });
                      showToast(!current ? 'Counter payment collection enabled' : 'Counter payments disabled (billing desk only)');
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      clinicSettings?.pharmacySettings?.counterPaymentEnabled !== false ? 'bg-purple-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 bg-white rounded-full transition-transform absolute top-1 left-1 ${
                        clinicSettings?.pharmacySettings?.counterPaymentEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Walk-in OTC Retail Counter */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Walk-in OTC Retail</div>
                    <div className="text-[10px] text-slate-400">Sell OTC drugs without Doctor Rx</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      clinicAudio.triggerHaptic(15);
                      const current = clinicSettings?.pharmacySettings?.allowDirectOTC !== false;
                      updatePharmacySettings({ allowDirectOTC: !current });
                      showToast(!current ? 'Walk-in OTC counter enabled' : 'Walk-in OTC counter disabled');
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      clinicSettings?.pharmacySettings?.allowDirectOTC !== false ? 'bg-purple-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`block w-4 h-4 bg-white rounded-full transition-transform absolute top-1 left-1 ${
                        clinicSettings?.pharmacySettings?.allowDirectOTC !== false ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 4. Default Print Slip Format */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Default Print Format</div>
                    <div className="text-[10px] text-slate-400">Prescription / Receipt paper</div>
                  </div>
                  <select
                    value={clinicSettings?.pharmacySettings?.defaultPrintFormat || 'A5_LANDSCAPE'}
                    onChange={(e) => {
                      clinicAudio.triggerHaptic(15);
                      updatePharmacySettings({ defaultPrintFormat: e.target.value });
                      showToast(`Default print format set to ${e.target.value === 'A5_LANDSCAPE' ? 'A5 Medical Slip' : '80mm Thermal'}`);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-purple-900"
                  >
                    <option value="A5_LANDSCAPE">A5 Paper Slip</option>
                    <option value="THERMAL">80mm Thermal</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setAdminFormularyFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  adminFormularyFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All Items ({pharmacyFormulary.length})
              </button>
              <button
                type="button"
                onClick={() => setAdminFormularyFilter('PHARMACY')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  adminFormularyFilter === 'PHARMACY'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-purple-50 border border-slate-200'
                }`}
              >
                <span>💊 Medications</span>
                <span className="text-[10px] font-mono opacity-80">
                  ({pharmacyFormulary.filter((m) => m.type !== 'GENERAL').length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setAdminFormularyFilter('GENERAL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  adminFormularyFilter === 'GENERAL'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-indigo-50 border border-slate-200'
                }`}
              >
                <span>📦 General Consumables</span>
                <span className="text-[10px] font-mono opacity-80">
                  ({pharmacyFormulary.filter((m) => m.type === 'GENERAL').length})
                </span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-400 font-extrabold text-[10px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Item Name & Instructions</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Form / Packaging</th>
                    <th className="px-4 py-3">Generic / Specification</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Doctor Rx Pad</th>
                    <th className="px-4 py-3">Price ({currencyCode})</th>
                    <th className="px-4 py-3">Stock Level</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredFormulary.map((med) => {
                    const isLow = med.stock !== undefined && med.stock < 20;
                    const isGeneral = med.type === 'GENERAL';
                    const isVisibleInRx = med.showToDoctor !== false;
                    return (
                      <tr key={med.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-black text-slate-900">{med.name}</div>
                          <div className="text-[10px] text-slate-400">{med.instructions}</div>
                        </td>
                        <td className="px-4 py-3">
                          {isGeneral ? (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 font-black text-[10px] border border-indigo-200 flex items-center gap-1 w-max">
                              <Package className="w-3 h-3" />
                              <span>General Item</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 font-black text-[10px] border border-purple-200 flex items-center gap-1 w-max">
                              <Pill className="w-3 h-3" />
                              <span>Medication</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 font-extrabold text-[10px] border border-blue-200">
                            {med.form || (isGeneral ? 'Unit' : 'Tablet')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div>{med.generic}</div>
                          <div className="font-mono text-[10px] text-slate-400">{med.strength}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-extrabold text-[10px]">
                            {med.category}
                          </span>
                          <div className="font-mono text-[9px] text-blue-700 font-bold mt-1">
                            📍 {med.storageLocation || (med.type === 'GENERAL' ? 'Shelf G-01' : med.category === 'Dermatology' ? 'Shelf D-02' : med.category === 'Cardiovascular' ? 'Shelf A-04' : 'Shelf B-08')}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => {
                              clinicAudio.triggerHaptic(10);
                              updateFormularyItem(med.id, { showToDoctor: !isVisibleInRx });
                              showToast(`Prescription pad visibility updated for ${med.name}`);
                            }}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all ${
                              isVisibleInRx
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                            }`}
                            title="Click to toggle visibility in Doctor Cabin prescription pad"
                          >
                            <span>{isVisibleInRx ? '✓ Visible to Doctor' : '🔒 Stock Only'}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 font-extrabold text-slate-900">{currencySymbol} {med.price?.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-black ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>
                              {med.stock ?? 50} units
                            </span>
                            {isLow && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded font-black uppercase">
                                LOW
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                updateFormularyItem(med.id, { stock: Math.max(0, (med.stock ?? 50) - 10) });
                              }}
                              className="w-5 h-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded flex items-center justify-center font-black text-xs"
                              title="Decrease 10"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                updateFormularyItem(med.id, { stock: (med.stock ?? 50) + 25 });
                              }}
                              className="w-5 h-5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded flex items-center justify-center font-black text-xs"
                              title="Add 25"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setModalType('EDIT_FORMULARY');
                              setModalData({ ...med });
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete '${med.name}' from formulary?`)) {
                                deleteFormularyItem(med.id);
                                showToast(`${med.name} removed from formulary`);
                              }
                            }}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold"
                          >
                            Delete
                          </button>
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
            TAB 5: CHIEF SYMPTOMS MATRIX
        ========================================================================= */}
        {activeTab === 'symptoms' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Chief Symptoms & Triage Matrix</h2>
                <p className="text-xs text-slate-500">Map symptom options to departments and recommended doctor cabins for Patient Touch Kiosk.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalType('ADD_SYMPTOM');
                  setModalData({
                    id: `sym-${Date.now()}`,
                    label: '',
                    icon: '🩺',
                    dept: 'General OPD',
                    cabinId: 1,
                    doctorName: cabins[0]?.doctorName || 'Attending Physician',
                    priority: 'Normal',
                    description: ''
                  });
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Symptom</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSymptoms.map((sym) => (
                <div key={sym.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{sym.icon || '🩺'}</span>
                        <div>
                          <h3 className="font-extrabold text-sm text-slate-900">{sym.label}</h3>
                          <span className="text-xs font-semibold text-blue-700">{sym.dept}</span>
                        </div>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase ${
                        sym.priority === 'High' ? 'bg-amber-100 text-amber-800' :
                        sym.priority === 'Emergency' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {sym.priority || 'Normal'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{sym.description}</p>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold">Routes to:</span>
                      <span className="font-bold text-slate-800">Cabin {sym.cabinId} ({sym.doctorName?.split(',')[0]})</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setModalType('EDIT_SYMPTOM');
                        setModalData({ ...sym });
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete symptom '${sym.label}'?`)) {
                          deleteSymptom(sym.id);
                          showToast(`${sym.label} deleted`);
                        }
                      }}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: TIME SLOTS
        ========================================================================= */}
        {activeTab === 'slots' && (
          <div className="space-y-4 max-w-2xl">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Appointment Booking Time Slots</h2>
              <p className="text-xs text-slate-500">Configure bookable slots offered on the Patient Kiosk appointment calendar.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-3">
              <input
                id="newSlotInput"
                type="text"
                placeholder="e.g. 11:45 AM or 04:30 PM"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('newSlotInput');
                  if (input && input.value.trim()) {
                    addTimeSlot(input.value.trim());
                    showToast(`Slot '${input.value.trim()}' added`);
                    input.value = '';
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Slot</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {timeSlots.map((slot) => (
                <div key={slot} className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex items-center justify-between hover:border-blue-300 transition-all">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="font-extrabold text-sm text-slate-900">{slot}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (timeSlots.length <= 1) {
                        alert('At least one slot must remain');
                        return;
                      }
                      deleteTimeSlot(slot);
                      showToast(`Slot '${slot}' deleted`);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 7: LIVE QUEUE & DEMOGRAPHICS
        ========================================================================= */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Live Patient Queue & Demographics</h2>
                <p className="text-xs text-slate-500">Edit patient vitals, switch assigned cabins, return tokens, or cancel queues.</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-400 font-extrabold text-[10px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Token #</th>
                    <th className="px-4 py-3">Patient Details</th>
                    <th className="px-4 py-3">Assigned Cabin</th>
                    <th className="px-4 py-3">Triage Vitals</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredPatients.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-black text-blue-700 text-sm">
                        {p.tokenNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-black text-slate-900">{p.patientName}</div>
                        <div className="text-[10px] text-slate-400">{p.age}y • {p.gender} • {p.phone || 'No phone'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-slate-800">Cabin {p.cabinId}</div>
                        <div className="text-[10px] text-slate-500">{p.doctorName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[10px] space-y-0.5">
                          <div>Temp: <span className="font-bold text-slate-800">{p.vitals?.temp || '98.6°F'}</span></div>
                          <div>BP: <span className="font-bold text-slate-800">{p.vitals?.bp || '120/80'}</span> | SpO2: <span className="font-bold text-slate-800">{p.vitals?.spo2 || '98%'}</span></div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                          p.status === 'WAITING' ? 'bg-amber-100 text-amber-800' :
                          p.status === 'CALLED' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                          p.status === 'IN_CONSULTATION' ? 'bg-emerald-100 text-emerald-800' :
                          p.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setModalType('EDIT_PATIENT');
                            setModalData({ ...p });
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete token ${p.tokenNumber} for ${p.patientName}?`)) {
                              deletePatient(p.id);
                              showToast(`Token ${p.tokenNumber} removed`);
                            }
                          }}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 8: BILLING LEDGER & INVOICES
        ========================================================================= */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Billing Ledger & Invoices</h2>
                <p className="text-xs text-slate-500">Audit settled receipts, adjust discounts/co-pays, manage refunds, or delete erroneous charges.</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-400 font-extrabold text-[10px] uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Invoice #</th>
                    <th className="px-4 py-3">Token / Patient</th>
                    <th className="px-4 py-3">Subtotal</th>
                    <th className="px-4 py-3">Discount / Co-Pay</th>
                    <th className="px-4 py-3">Net Paid</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-black text-slate-900">{inv.patientName}</div>
                        <div className="font-mono text-[10px] text-blue-700">{inv.tokenNumber}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{currencySymbol} {inv.subtotal?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-500">
                        -{currencySymbol} {((inv.discount || 0) + (inv.insuranceCoPay || 0))?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-extrabold text-emerald-700">{currencySymbol} {inv.total?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                          inv.status === 'PAID_UPFRONT' || inv.status === 'SETTLED' ? 'bg-emerald-100 text-emerald-800' :
                          inv.status === 'REFUND_DUE' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setModalType('EDIT_INVOICE');
                            setModalData({ ...inv });
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                        >
                          Adjust
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete invoice ${inv.invoiceNumber}?`)) {
                              deleteInvoice(inv.id);
                              showToast(`Invoice ${inv.invoiceNumber} removed`);
                            }
                          }}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 9: PATIENT EMR & MEDICAL HISTORY
        ========================================================================= */}
        {activeTab === 'patients' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Patient Electronic Medical Records (EMR)</h2>
                <p className="text-xs text-slate-500">Manage permanent patient profiles, historical prescriptions, and prior diagnoses.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalType('ADD_PATIENT_HISTORY');
                  setModalData({
                    patientId: `PT-${Math.floor(10000 + Math.random() * 89999)}`,
                    patientName: '',
                    phone: '',
                    age: 35,
                    gender: 'Male',
                    bloodGroup: 'O+',
                    chronicConditions: [],
                    allergies: [],
                    visits: []
                  });
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add EMR Profile</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredHistory.map((p) => (
                <div key={p.patientId} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-all">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[10px] font-extrabold text-blue-700 uppercase bg-blue-50 px-2 py-0.5 rounded">
                          {p.patientId}
                        </span>
                        <h3 className="text-base font-black text-slate-900 mt-1">{p.patientName}</h3>
                        <p className="text-xs text-slate-500">{p.age} yrs • {p.gender} • {p.phone || 'No phone'}</p>
                      </div>
                      <span className="text-xs font-extrabold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl">
                        {p.visits?.length || 0} Visits
                      </span>
                    </div>

                    <div className="mt-3 text-xs space-y-1">
                      {p.allergies && p.allergies.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-rose-600 uppercase">Allergies:</span>
                          <span className="font-medium text-slate-700">{p.allergies.join(', ')}</span>
                        </div>
                      )}
                      {p.chronicConditions && p.chronicConditions.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-amber-600 uppercase">Chronic:</span>
                          <span className="font-medium text-slate-700">{p.chronicConditions.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setModalType('EDIT_PATIENT_HISTORY');
                        setModalData({ ...p });
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                    >
                      Edit Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete medical history for ${p.patientName}?`)) {
                          deletePatientHistory(p.patientId);
                          showToast(`${p.patientName} EMR removed`);
                        }
                      }}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB: DUAL CLINIC LOGO MANAGEMENT (DISPLAY VS PRINTING)
        ========================================================================= */}
        {activeTab === 'logos' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-teal-600" />
                Clinic Logo Management (Decoupled Display & Printing)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload separate high-resolution logos for color screen displays (Kiosk, TV, Web) versus monochrome thermal/A5 printing (Prescriptions, Token slips, Invoices).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Display Logo Box */}
              <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div>
                      <span className="text-[10px] font-black uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        Channel 1
                      </span>
                      <h3 className="text-base font-black text-slate-900 mt-1">Screen Display Logo</h3>
                      <p className="text-[11px] text-slate-500">Rendered on Patient Touch Kiosks, TV Lounge Boards, & Web Nav</p>
                    </div>
                  </div>

                  {/* Logo Live Preview */}
                  <div className="h-44 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center p-4 overflow-hidden relative group">
                    {activeClinic?.displayLogo || clinicSettings?.displayLogo ? (
                      <img
                        src={activeClinic?.displayLogo || clinicSettings?.displayLogo}
                        alt="Display Logo"
                        className="max-h-36 max-w-full object-contain drop-shadow-sm"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <ImageIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <span className="text-xs font-bold block">No Custom Display Logo Set</span>
                        <span className="text-[10px]">Using system default medical emblem</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <label className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Display Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, 'displayLogo')}
                      className="hidden"
                    />
                  </label>

                  {(activeClinic?.displayLogo || clinicSettings?.displayLogo) && (
                    <button
                      type="button"
                      onClick={() => {
                        updateClinicLogos(activeClinic?.id, { displayLogo: '' });
                        showToast('Display logo reset to default emblem');
                      }}
                      className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Printing Logo Box */}
              <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div>
                      <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        Channel 2
                      </span>
                      <h3 className="text-base font-black text-slate-900 mt-1">Medical Printing Logo</h3>
                      <p className="text-[11px] text-slate-500">Optimized for thermal receipts, A5 prescriptions, & Laser invoices</p>
                    </div>
                  </div>

                  {/* Logo Live Preview */}
                  <div className="h-44 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center p-4 overflow-hidden relative group">
                    {activeClinic?.printingLogo || clinicSettings?.printingLogo ? (
                      <img
                        src={activeClinic?.printingLogo || clinicSettings?.printingLogo}
                        alt="Printing Logo"
                        className="max-h-36 max-w-full object-contain filter contrast-125"
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <Printer className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <span className="text-xs font-bold block">No Custom Printing Logo Set</span>
                        <span className="text-[10px]">Will use text letterhead on printed slips</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <label className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Printing Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e, 'printingLogo')}
                      className="hidden"
                    />
                  </label>

                  {(activeClinic?.printingLogo || clinicSettings?.printingLogo) && (
                    <button
                      type="button"
                      onClick={() => {
                        updateClinicLogos(activeClinic?.id, { printingLogo: '' });
                        showToast('Printing logo reset to default');
                      }}
                      className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB: KIOSK SCREEN SECURITY & PER-DEVICE PIN MANAGEMENT
        ========================================================================= */}
        {activeTab === 'kiosk_sec' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-teal-600" />
                Kiosk Terminal Security & PIN Configuration
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure touch PIN codes for Reception and Emergency Kiosks, 5-minute inactivity timeouts, and automatic lockout policies.
              </p>
            </div>

            {/* Current Terminal Status Banner */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black ${
                  kioskLockState?.isLocked ? 'bg-amber-500' : 'bg-emerald-600'
                }`}>
                  {kioskLockState?.isLocked ? <Lock className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Terminal Security State</div>
                  <h3 className="text-base font-black text-slate-900">
                    {kioskLockState?.isLocked ? 'Kiosk Screen Locked' : 'Kiosk Active & Accepting Patients'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Failed PIN attempts on record: <strong className="text-slate-900">{kioskLockState?.failedAttempts || 0} / 5</strong>
                  </p>
                </div>
              </div>

              {kioskLockState?.isLocked && (
                <button
                  type="button"
                  onClick={() => {
                    clinicAudio.triggerHaptic(15);
                    updateKioskDevicePin(activeClinic?.kioskDevices?.[0]?.id, activeClinic?.kioskDevices?.[0]?.pin || '1234');
                    showToast('Terminal lockout cleared by Administrator');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Force Unlock Terminal</span>
                </button>
              )}
            </div>

            {/* Configured Kiosk Devices Table */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider">Configured Physical Terminals</h4>
                  <p className="text-[11px] text-slate-500">Each kiosk has an independent unlocking PIN code</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewDeviceModal(true)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Kiosk Device</span>
                </button>
              </div>

              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Terminal ID</th>
                    <th className="px-4 py-3">Device Name & Location</th>
                    <th className="px-4 py-3">Configured PIN</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(activeClinic?.kioskDevices || []).map((dev) => (
                    <tr key={dev.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-mono font-black text-slate-900">{dev.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{dev.name}</div>
                        <div className="text-[10px] text-slate-400">{dev.location}</div>
                      </td>
                      <td className="px-4 py-3">
                        {editingPinDevice === dev.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              maxLength={4}
                              value={newPinInput}
                              onChange={(e) => setNewPinInput(e.target.value)}
                              className="w-16 px-2 py-1 bg-white border border-teal-500 rounded text-center font-mono font-black text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (newPinInput.length === 4) {
                                  updateKioskDevicePin(dev.id, newPinInput);
                                  setEditingPinDevice(null);
                                  showToast(`PIN for ${dev.name} updated to ${newPinInput}`);
                                } else {
                                  alert('PIN must be 4 digits.');
                                }
                              }}
                              className="px-2 py-1 bg-teal-600 text-white rounded text-[10px] font-bold"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPinDevice(null)}
                              className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span className="font-mono font-black text-slate-800 tracking-wider bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {dev.pin || '1234'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {dev.status || 'ONLINE'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPinDevice(dev.id);
                            setNewPinInput(dev.pin || '1234');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                        >
                          Change PIN
                        </button>
                        {activeClinic?.kioskDevices?.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Remove ${dev.name}?`)) {
                                deleteKioskDevice(dev.id);
                                showToast(`${dev.name} removed`);
                              }
                            }}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold"
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Inactivity Auto-Lock Duration Settings */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3">
              <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider">Inactivity Auto-Lock Timeout</h4>
              <p className="text-xs text-slate-500">
                To protect patient privacy, the Kiosk screen locks automatically if left untouched.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: '1 Minute (High Traffic)', sec: 60 },
                  { label: '2 Minutes', sec: 120 },
                  { label: '5 Minutes (Standard)', sec: 300 },
                  { label: '10 Minutes', sec: 600 }
                ].map((t) => {
                  const currentSec = activeClinic?.kioskSettings?.autoLockSeconds || 300;
                  const isSel = currentSec === t.sec;
                  return (
                    <button
                      key={t.sec}
                      type="button"
                      onClick={() => {
                        clinicAudio.triggerHaptic(15);
                        showToast(`Auto-lock timeout set to ${t.label}`);
                      }}
                      className={`p-3 rounded-2xl border-2 text-left transition-all ${
                        isSel ? 'bg-teal-50 border-teal-600 shadow-xs' : 'bg-slate-50 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <div className="font-black text-xs text-slate-900">{t.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{t.sec}s idle timeout</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB: GOOGLE AUTHENTICATOR 2FA & MONTHLY RENEWAL
        ========================================================================= */}
        {activeTab === 'auth_2fa' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-teal-600" />
                Google Authenticator (2FA) Setup & Monthly Renewal
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Two-Factor Authentication protocol requires a verified 6-digit rolling code every 30 days for administrative privileges.
              </p>
            </div>

            {(() => {
              const renewal = calculateRenewalStatus(currentUser?.lastVerifiedDate);
              const simulatedCode = generateTotpCode(currentUser?.googleAuthSecret || 'KRSXG5CTMVRXEZLU');

              return (
                <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
                  {/* Status Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Account Guarded</span>
                      <div className="text-sm font-black text-slate-900">{currentUser?.name || 'Administrator'}</div>
                      <span className="text-[10px] text-slate-500 font-mono">@{currentUser?.username}</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">30-Day Renewal Due</span>
                      <div className="text-sm font-black text-teal-700">
                        {new Date(renewal.nextVerificationRequiredDate).toLocaleDateString()}
                      </div>
                      <span className={`text-[10px] font-black uppercase ${
                        renewal.isExpired ? 'text-rose-600' : renewal.isExpiringSoon ? 'text-amber-600' : 'text-emerald-700'
                      }`}>
                        {renewal.daysRemaining} days remaining
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Simulated Live 6-Digit Code</span>
                      <div className="text-2xl font-black font-mono text-teal-800 tracking-widest">
                        {simulatedCode}
                      </div>
                      <span className="text-[9px] text-slate-400">Valid or test bypass: 123456</span>
                    </div>
                  </div>

                  {/* QR Code and Verification Input */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row items-center gap-6">
                    <img
                      src={generateQrPlaceholderSvg(currentUser?.username || 'admin')}
                      alt="Authenticator QR"
                      className="w-36 h-36 rounded-2xl bg-white border border-slate-200 p-2 shadow-xs shrink-0"
                    />

                    <div className="space-y-3 flex-1">
                      <h4 className="font-black text-sm text-slate-900">Pair Authenticator App</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Open Google Authenticator on your mobile phone, scan the QR code, and enter the generated 6-digit code below to renew verification for 30 days:
                      </p>

                      <div className="flex items-center gap-2 max-w-sm">
                        <input
                          type="text"
                          maxLength={6}
                          value={totpInput}
                          onChange={(e) => setTotpInput(e.target.value)}
                          placeholder="Enter 6-digit code"
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-black text-center text-sm text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            clinicAudio.triggerHaptic(20);
                            const res = renewGoogleAuth(currentUser?.id, totpInput);
                            if (res.success) {
                              showToast('Monthly 2FA verification renewed successfully for 30 days');
                              setTotpInput('');
                              setTotpError('');
                            } else {
                              setTotpError(res.error || 'Invalid code');
                            }
                          }}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-xs"
                        >
                          Verify & Renew
                        </button>
                      </div>

                      {totpError && (
                        <p className="text-xs font-bold text-rose-600">{totpError}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* =========================================================================
            TAB: STAFF & USER MANAGEMENT (RBAC - SINGLE CLINIC SCOPE)
        ========================================================================= */}
        {activeTab === 'clinic_users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-600" />
                  Staff Users & Credentials ({activeClinic?.name})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage Doctor logins and staff accounts. Users are isolated strictly to <strong className="text-slate-700">{activeClinic?.name}</strong> and are not shared with other clinics.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(15);
                  setClinicUserData({
                    username: '',
                    name: '',
                    role: 'DOCTOR_USER',
                    doctorCabinId: cabins[0]?.cabinId || 1,
                    email: '',
                    googleAuthEnabled: true
                  });
                  setClinicUserModal(true);
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Staff User</span>
              </button>
            </div>

            {/* Clinic Isolation Info Banner */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-600 shrink-0" />
              <div className="text-xs text-blue-900">
                <strong className="font-black">Clinic User Isolation Active:</strong> Local clinic staff and doctor credentials cannot access or see other clinics. The central Platform Administrator (DevOps / Software Admin) is managed exclusively in the Super Admin section.
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Staff Name</th>
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">2FA Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {clinicStaffUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                        No local staff accounts configured for {activeClinic?.name} yet. Click "Add Staff User" above to create one.
                      </td>
                    </tr>
                  ) : (
                    clinicStaffUsers.map((usr) => (
                      <tr key={usr.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <div className="font-black text-slate-900">{usr.name}</div>
                          <div className="text-[10px] text-slate-400">{usr.email || 'Staff Account'}</div>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-700">{usr.username}</td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                            {usr.role}
                          </span>
                          {usr.doctorCabinId && (
                            <span className="text-[10px] text-teal-700 font-bold ml-1">
                              (Cabin {usr.doctorCabinId})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {usr.googleAuthEnabled ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              2FA Active
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400">Standard</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete user ${usr.username}?`)) {
                                deleteUser(usr.id);
                                showToast(`User ${usr.username} deleted`);
                              }
                            }}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold"
                          >
                            Delete
                          </button>
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
            TAB: PRINTERS & DUAL HARDWARE ARCHITECTURE (ADMIN TESTING & CONFIG)
        ========================================================================= */}
        {activeTab === 'printers' && (() => {
          const printerSettings = clinicSettings?.printerSettings || {
            suppressOsPrintOnUserScreens: true,
            autoGeneratePdfWhenNoHardware: true,
            activeHardwareSlots: 2,
            hardwareDevices: []
          };

          const devices = printerSettings.hardwareDevices || [];
          const slot1 = devices.find((d) => d.slot === 1) || {
            slot: 1,
            name: 'Front-Desk Thermal Slip Printer',
            model: 'Epson TM-T88VI POS',
            role: 'TOKENS_AND_RECEIPTS',
            format: '80mm',
            connection: 'USB',
            ipAddress: '192.168.1.180',
            status: 'CONNECTED'
          };
          const slot2 = devices.find((d) => d.slot === 2) || {
            slot: 2,
            name: 'Clinical Laser Document Printer',
            model: 'HP LaserJet Pro M404dn',
            role: 'PRESCRIPTIONS_AND_INVOICES',
            format: 'A4',
            connection: 'NETWORK_IP',
            ipAddress: '192.168.1.195',
            status: 'CONNECTED'
          };

          const handleAdminTestPrint = (targetId, format, docTitle) => {
            clinicAudio.triggerHaptic(20);
            showToast(`Opening OS Print Dialog for ${docTitle} (Admin Hardware Test)...`);
            printMedicalDocument(targetId, format, {
              isAdminTest: true,
              documentTitle: docTitle
            });
          };

          const handleAdminTestPdf = async (targetId, filename, format) => {
            clinicAudio.triggerHaptic(15);
            showToast(`Generating direct PDF for ${filename}...`);
            await generateDirectPdf(targetId, filename, format);
          };

          const updateGlobalPolicy = (partial) => {
            clinicAudio.triggerHaptic(15);
            updateClinicSettings({
              printerSettings: {
                ...printerSettings,
                ...partial
              }
            });
            showToast('Global hardware printer policy updated');
          };

          return (
            <div className="space-y-6">
              {/* Header Title & System Policy Summary */}
              <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-teal-800/40">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-400 shadow-inner">
                      <Printer className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                        Printers & Dual Hardware Architecture
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Active: 2 Devices
                        </span>
                      </h2>
                      <p className="text-xs text-teal-200/80">
                        Supports up to 2 physical hardware printers at a time. The OS print window is strictly quarantined to this Admin Test panel and never shown on user screens.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>OS Print Dialog Suppressed on User Screens</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-sky-400" />
                    <span>Auto-Fallback Direct PDF: Active</span>
                  </div>
                </div>
              </div>

              {/* Policy Enforcement Notice Banner */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-black text-amber-950 block">Operating System Print Dialog Quarantine Policy</span>
                    <span className="text-[11px] text-amber-800">
                      To prevent disruptive popup windows on touch kiosks and clinical stations, <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">window.print()</code> is blocked on all user screens. The OS print dialog can only be launched here by Admins to verify paper alignment and spooler drivers.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateGlobalPolicy({ autoGeneratePdfWhenNoHardware: !printerSettings.autoGeneratePdfWhenNoHardware })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                      printerSettings.autoGeneratePdfWhenNoHardware
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-amber-200 text-amber-900'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Direct PDF Fallback: {printerSettings.autoGeneratePdfWhenNoHardware ? 'ON' : 'OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Dual Hardware Devices Grid (Allows 2 Devices simultaneously) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* -------------------------------------------------------------------
                    HARDWARE DEVICE 1: THERMAL RECEIPT & TOKEN POS PRINTER
                ------------------------------------------------------------------- */}
                <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Slot Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black border border-teal-200 text-sm">
                          #1
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-slate-900">Hardware Slot 1: Thermal POS Printer</h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                              Tokens & Slips
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Dedicated to Patient Kiosk check-in slips, queue tokens, and counter receipts.
                          </p>
                        </div>
                      </div>

                      {/* Connection Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleHardwarePrinterStatus(1)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-xs ${
                          slot1.status === 'CONNECTED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100'
                        }`}
                        title="Click to toggle whether this physical printer is attached"
                      >
                        <div className={`w-2 h-2 rounded-full ${slot1.status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        <span>{slot1.status === 'CONNECTED' ? 'Attached & Online' : 'Not Attached (PDF Direct)'}</span>
                      </button>
                    </div>

                    {/* Configuration Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Device / Port Name
                        </label>
                        <input
                          type="text"
                          value={slot1.name}
                          onChange={(e) => updateHardwarePrinter(1, { name: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs focus:bg-white focus:border-teal-500 transition-colors"
                          placeholder="e.g. Front-Desk Thermal Slip"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Printer Model / Driver
                        </label>
                        <input
                          type="text"
                          value={slot1.model}
                          onChange={(e) => updateHardwarePrinter(1, { model: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs focus:bg-white focus:border-teal-500 transition-colors"
                          placeholder="e.g. Epson TM-T88VI POS"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Hardware Interface
                        </label>
                        <select
                          value={slot1.connection}
                          onChange={(e) => updateHardwarePrinter(1, { connection: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs focus:bg-white focus:border-teal-500 transition-colors"
                        >
                          <option value="USB">USB Cable (Plug & Play POS)</option>
                          <option value="NETWORK_IP">Network Ethernet / LAN IP</option>
                          <option value="BLUETOOTH">Bluetooth Wireless POS</option>
                          <option value="SYSTEM">System Default Spooler</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          LAN IP Address / Port
                        </label>
                        <input
                          type="text"
                          value={slot1.ipAddress || ''}
                          onChange={(e) => updateHardwarePrinter(1, { ipAddress: e.target.value })}
                          disabled={slot1.connection !== 'NETWORK_IP'}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs focus:bg-white focus:border-teal-500 transition-colors disabled:opacity-50"
                          placeholder="192.168.1.180:9100"
                        />
                      </div>
                    </div>

                    {/* Paper Width Selection */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        Thermal Roll Paper Width
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            updateHardwarePrinter(1, { format: '80mm' });
                            updateGlobalPolicy({ thermalPaperWidth: '80mm' });
                          }}
                          className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                            (slot1.format || '80mm') === '80mm'
                              ? 'bg-teal-50 border-teal-600 text-teal-950 font-black'
                              : 'bg-slate-50 border-slate-200 text-slate-600 font-medium hover:border-slate-300'
                          }`}
                        >
                          <div className="text-xs">80mm Standard POS</div>
                          <div className="text-[10px] text-slate-500 font-normal">72mm printable width</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            updateHardwarePrinter(1, { format: '58mm' });
                            updateGlobalPolicy({ thermalPaperWidth: '58mm' });
                          }}
                          className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                            (slot1.format || '80mm') === '58mm'
                              ? 'bg-teal-50 border-teal-600 text-teal-950 font-black'
                              : 'bg-slate-50 border-slate-200 text-slate-600 font-medium hover:border-slate-300'
                          }`}
                        >
                          <div className="text-xs">58mm Compact POS</div>
                          <div className="text-[10px] text-slate-500 font-normal">48mm printable width</div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Admin Testing Actions */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Admin Diagnostics & Verification:</span>
                      <span className="text-[10px] text-teal-700 font-bold bg-teal-100/70 px-2 py-0.5 rounded">
                        Paper: {slot1.format || '80mm'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleAdminTestPrint('printable-admin-test-thermal', slot1.format || '80mm', 'Hardware Slot 1 (Thermal Slip)')}
                        className="w-full px-3 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                        title="Opens the OS Print Window (Admin Only) to test physical hardware paper feed"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>🖨️ Test Print (OS Window)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAdminTestPdf('printable-admin-test-thermal', 'Thermal_Hardware_Test_Slip', 'THERMAL')}
                        className="w-full px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all"
                        title="Directly generates and downloads a clean vector PDF without any OS print popup"
                      >
                        <Download className="w-3.5 h-3.5 text-teal-600" />
                        <span>📄 Test Direct PDF</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* -------------------------------------------------------------------
                    HARDWARE DEVICE 2: CLINICAL LASER DOCUMENT PRINTER (A4 / A5)
                ------------------------------------------------------------------- */}
                <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Slot Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-black border border-blue-200 text-sm">
                          #2
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-slate-900">Hardware Slot 2: Clinical Laser Printer</h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                              Prescriptions & Invoices
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            Dedicated to Doctor Cabin prescriptions, POS itemized invoices, and clinical records.
                          </p>
                        </div>
                      </div>

                      {/* Connection Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleHardwarePrinterStatus(2)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-xs ${
                          slot2.status === 'CONNECTED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100'
                        }`}
                        title="Click to toggle whether this physical printer is attached"
                      >
                        <div className={`w-2 h-2 rounded-full ${slot2.status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        <span>{slot2.status === 'CONNECTED' ? 'Attached & Online' : 'Not Attached (PDF Direct)'}</span>
                      </button>
                    </div>

                    {/* Configuration Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Device / Port Name
                        </label>
                        <input
                          type="text"
                          value={slot2.name}
                          onChange={(e) => updateHardwarePrinter(2, { name: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs focus:bg-white focus:border-blue-500 transition-colors"
                          placeholder="e.g. Clinical Laser Document Printer"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Printer Model / Driver
                        </label>
                        <input
                          type="text"
                          value={slot2.model}
                          onChange={(e) => updateHardwarePrinter(2, { model: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs focus:bg-white focus:border-blue-500 transition-colors"
                          placeholder="e.g. HP LaserJet Pro M404dn"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Hardware Interface
                        </label>
                        <select
                          value={slot2.connection}
                          onChange={(e) => updateHardwarePrinter(2, { connection: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs focus:bg-white focus:border-blue-500 transition-colors"
                        >
                          <option value="NETWORK_IP">Network Ethernet / LAN IP</option>
                          <option value="USB">USB Cable (Workstation Dedicated)</option>
                          <option value="WIFI">Wi-Fi Direct / Wireless LAN</option>
                          <option value="SYSTEM">System Default Spooler</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          LAN IP Address / Host
                        </label>
                        <input
                          type="text"
                          value={slot2.ipAddress || ''}
                          onChange={(e) => updateHardwarePrinter(2, { ipAddress: e.target.value })}
                          disabled={slot2.connection !== 'NETWORK_IP' && slot2.connection !== 'WIFI'}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold text-xs focus:bg-white focus:border-blue-500 transition-colors disabled:opacity-50"
                          placeholder="192.168.1.195"
                        />
                      </div>
                    </div>

                    {/* Paper Format Selection */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                        Clinical Document Paper Size
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            updateHardwarePrinter(2, { format: 'A4' });
                            updateGlobalPolicy({ paperSizePrescription: 'A4' });
                          }}
                          className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                            (slot2.format || 'A4') === 'A4'
                              ? 'bg-blue-50 border-blue-600 text-blue-950 font-black'
                              : 'bg-slate-50 border-slate-200 text-slate-600 font-medium hover:border-slate-300'
                          }`}
                        >
                          <div className="text-xs">A4 Full Sheet (Laser)</div>
                          <div className="text-[10px] text-slate-500 font-normal">210 x 297mm standard medical sheet</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            updateHardwarePrinter(2, { format: 'A5' });
                            updateGlobalPolicy({ paperSizePrescription: 'A5' });
                          }}
                          className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                            (slot2.format || 'A4') === 'A5'
                              ? 'bg-blue-50 border-blue-600 text-blue-950 font-black'
                              : 'bg-slate-50 border-slate-200 text-slate-600 font-medium hover:border-slate-300'
                          }`}
                        >
                          <div className="text-xs">A5 Landscape Rx (Clinical)</div>
                          <div className="text-[10px] text-slate-500 font-normal">210 x 148mm hospital prescription slip</div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Admin Testing Actions */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Admin Diagnostics & Verification:</span>
                      <span className="text-[10px] text-blue-700 font-bold bg-blue-100/70 px-2 py-0.5 rounded">
                        Paper: {slot2.format || 'A4'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleAdminTestPrint('printable-admin-test-laser', slot2.format || 'A4', 'Hardware Slot 2 (Laser Document)')}
                        className="w-full px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                        title="Opens the OS Print Window (Admin Only) to test physical hardware paper feed"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>🖨️ Test Print (OS Window)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAdminTestPdf('printable-admin-test-laser', 'Laser_Hardware_Test_Document', slot2.format || 'A4')}
                        className="w-full px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all"
                        title="Directly generates and downloads a clean vector PDF without any OS print popup"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-600" />
                        <span>📄 Test Direct PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Architectural Overview Card */}
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  Dual Hardware & Anti-Disruption Architecture Overview
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5">
                    <strong className="block text-slate-900 font-bold">1. Zero OS Popups for Users</strong>
                    <p className="text-[11px] leading-relaxed">
                      On patient kiosks, doctor cabins, and billing POS terminals, native OS print dialogs cause disruptive modal traps. All user screens silently dispatch to hardware or provide immediate PDF files.
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5">
                    <strong className="block text-slate-900 font-bold">2. Direct High-Res PDF Engine</strong>
                    <p className="text-[11px] leading-relaxed">
                      If hardware is unattached or turned off, documents automatically compile into vector-crisp PDFs (80mm receipts or A4/A5 clinical documents) and trigger immediate client downloads.
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-1.5">
                    <strong className="block text-slate-900 font-bold">3. Dual Hardware Separation</strong>
                    <p className="text-[11px] leading-relaxed">
                      Slot 1 is auto-targeted for quick 80mm/58mm thermal rolls (queue slips, tokens), while Slot 2 handles heavy multi-page clinical records, official bills, and stamped prescriptions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Hidden DOM elements for Admin Hardware Testing */}
              <div className="hidden">
                {/* Slot 1 Sample Thermal Test Slip */}
                <div
                  id="printable-admin-test-thermal"
                  className={`bg-white text-slate-900 font-mono text-[10px] p-4 space-y-2 border border-slate-300 ${
                    slot1.format === '58mm' ? 'w-[58mm] text-[8.5px] p-2' : 'w-[80mm]'
                  }`}
                >
                  <div className="text-center border-b border-dashed border-slate-400 pb-2">
                    <strong className="block text-xs uppercase">{clinicSettings?.clinicName || 'Apex Specialist Care'}</strong>
                    <span className="text-[8px] text-slate-500 font-bold">HARDWARE SLOT 1: THERMAL POS TEST SLIP</span>
                  </div>
                  <div className="text-center py-2 border-b border-dashed border-slate-400">
                    <span className="text-[8px] block text-slate-500">ADMIN VERIFICATION TOKEN</span>
                    <strong className="text-3xl block my-1">T-999</strong>
                    <span className="text-[8px] text-emerald-700 font-bold">✓ HARDWARE TEST PRINT SUCCESSFUL</span>
                  </div>
                  <div className="text-[8px] space-y-0.5 border-b border-dashed border-slate-400 pb-2">
                    <div>Printer Name: <strong>{slot1.name}</strong></div>
                    <div>Model / Driver: <strong>{slot1.model}</strong></div>
                    <div>Interface: <strong>{slot1.connection} ({slot1.ipAddress || 'Direct Port'})</strong></div>
                    <div>Paper Width: <strong>{slot1.format || '80mm'}</strong></div>
                    <div>Test Timestamp: <strong>{new Date().toLocaleString()}</strong></div>
                  </div>
                  <div className="text-center text-[7.5px] text-slate-500 pt-1">
                    *** VERIFIED VIA ADMIN OS TEST SPOOLER ***
                  </div>
                </div>

                {/* Slot 2 Sample Clinical Laser Test Document */}
                <div
                  id="printable-admin-test-laser"
                  className="bg-white text-slate-900 font-sans p-8 space-y-4 border border-slate-300 w-[210mm] min-h-[297mm] text-[11px]"
                >
                  <div className="flex items-center justify-between border-b-2 border-blue-900 pb-4">
                    <div>
                      <h1 className="text-xl font-bold uppercase text-blue-950">{clinicSettings?.clinicName || 'Apex Specialist Care Medical Pavilion'}</h1>
                      <p className="text-xs text-blue-800 font-medium">{clinicSettings?.subtitle || 'Comprehensive Outpatient & Ambulatory Care'}</p>
                      <p className="text-[10px] text-slate-500">{clinicSettings?.address || 'Medical District 42'} • Tel: {clinicSettings?.phone || '(555) 019-2831'}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-blue-100 text-blue-900 rounded font-black text-xs uppercase">
                        Hardware Slot 2 Test
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1">Format: {slot2.format || 'A4'}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h2 className="text-sm font-bold text-slate-900 mb-1">Clinical Laser Printer Hardware Verification Report</h2>
                    <p className="text-xs text-slate-600">
                      This sample clinical document validates page margins, high-resolution vector rendering, and driver compatibility for Hardware Slot 2.
                    </p>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                        <tr>
                          <th className="p-2.5">Hardware Metric</th>
                          <th className="p-2.5">Configured Value</th>
                          <th className="p-2.5">Verification Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="p-2.5 font-bold">Printer Device Name</td>
                          <td className="p-2.5">{slot2.name}</td>
                          <td className="p-2.5 text-emerald-700 font-bold">Passed (OK)</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold">Printer Model</td>
                          <td className="p-2.5">{slot2.model}</td>
                          <td className="p-2.5 text-emerald-700 font-bold">Passed (OK)</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold">Connection Type</td>
                          <td className="p-2.5">{slot2.connection}</td>
                          <td className="p-2.5 text-emerald-700 font-bold">Passed (OK)</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold">Configured IP / Host</td>
                          <td className="p-2.5">{slot2.ipAddress || 'Localhost Spooler'}</td>
                          <td className="p-2.5 text-emerald-700 font-bold">Passed (OK)</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold">Paper Format</td>
                          <td className="p-2.5">{slot2.format || 'A4'}</td>
                          <td className="p-2.5 text-emerald-700 font-bold">Passed (OK)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="pt-8 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                    <div>Generated: {new Date().toLocaleString()}</div>
                    <div className="text-right">
                      <div className="border-t border-slate-400 pt-1 w-48 text-center font-bold">Clinical Administration Sign-off</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}


        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-teal-600" />
                  Daily Activity & Revenue Reports
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Export complete daily patient registers, consultation turnaround times, and financial statements.
                </p>
              </div>

              <button
                type="button"
                onClick={exportDailyReportCSV}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export Daily Ledger (CSV / Excel)</span>
              </button>
            </div>

            {/* Report Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Total Tokens Issued</span>
                <span className="text-2xl font-black font-mono text-slate-900">{patients.length}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Consultations Done</span>
                <span className="text-2xl font-black font-mono text-teal-700">
                  {patients.filter((p) => p.status === 'COMPLETED').length}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Waiting in Lounge</span>
                <span className="text-2xl font-black font-mono text-amber-600">
                  {patients.filter((p) => p.status === 'WAITING').length}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Total Gross Billing</span>
                <span className="text-2xl font-black font-mono text-emerald-700">
                  {formatCurrency(todayRevenue)}
                </span>
              </div>
            </div>

            {/* Daily Patient Table Preview */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider">Today's Patient Register</h4>
              </div>
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3">Token #</th>
                    <th className="px-4 py-3">Patient Name</th>
                    <th className="px-4 py-3">Assigned Cabin</th>
                    <th className="px-4 py-3">Consulting Doctor</th>
                    <th className="px-4 py-3">Queue Status</th>
                    <th className="px-4 py-3 text-right">Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {patients.map((p) => {
                    const c = cabins.find((cb) => cb.cabinId === p.cabinId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-black text-slate-900">{p.tokenNumber}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{p.patientName}</td>
                        <td className="px-4 py-3 font-bold text-slate-700">Cabin {p.cabinId}</td>
                        <td className="px-4 py-3 text-slate-600">{c?.doctorName || 'Doctor'}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-black text-slate-900 font-mono">
                          {currencySymbol} {c?.consultationFee || 60}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>

      {/* =========================================================================
          CLINIC OPERATIONAL CURRENCY SELECTION WORKFLOW MODAL
      ========================================================================= */}
      {currencyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in select-none">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Select Clinic Operational Currency
                  </h3>
                  <p className="text-xs text-slate-500">
                    Choose the facility-wide operating currency unit for all counters, kiosk terminals, and invoices.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCurrencyModalOpen(false);
                  setCurrencySearchQuery('');
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Currency Search Input */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={currencySearchQuery}
                onChange={(e) => setCurrencySearchQuery(e.target.value)}
                placeholder="Search by currency code, country, or symbol (e.g. PKR, USD, AED, Rupee, €)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 focus:bg-white focus:border-emerald-500 transition-colors"
                autoFocus
              />
            </div>

            {/* Scrollable Currency Selection Cards Grid */}
            <div className="overflow-y-auto flex-1 pr-1 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CURRENCIES.filter((curr) => {
                  if (!currencySearchQuery.trim()) return true;
                  const q = currencySearchQuery.toLowerCase();
                  return (
                    curr.code.toLowerCase().includes(q) ||
                    curr.name.toLowerCase().includes(q) ||
                    curr.symbol.toLowerCase().includes(q)
                  );
                }).map((curr) => {
                  const isSelected = (clinicSettings.currencyCode === curr.code) || (clinicSettings.currency === curr.symbol && clinicSettings.currencyCode === curr.code);

                  return (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => {
                        clinicAudio.triggerHaptic(15);
                        updateClinicSettings({
                          currency: curr.symbol,
                          currencySymbol: curr.symbol,
                          currencyCode: curr.code
                        });
                        showToast(`Operational currency switched to ${curr.code} (${curr.symbol})`);
                        setCurrencyModalOpen(false);
                        setCurrencySearchQuery('');
                      }}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-3 group cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/70 border-emerald-600 shadow-sm ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-slate-50/80'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl group-hover:scale-110 transition-transform">{curr.flag}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm text-slate-900">{curr.code}</span>
                            <span className="text-xs font-mono font-bold text-slate-500">({curr.symbol})</span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[170px]">
                            {curr.name.split('(')[0].trim()}
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[10px] font-black flex items-center gap-1 shrink-0 shadow-2xs">
                          <Check className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-700 text-slate-500 text-[10px] font-bold shrink-0 transition-colors">
                          Select
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Workflow Notice & Footer Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
              <span className="text-[11px] text-slate-500">
                ⚡ Currency switches instantly across Kiosk check-in, Doctor cabins, Pharmacy POS & invoices.
              </span>

              <button
                type="button"
                onClick={() => {
                  setCurrencyModalOpen(false);
                  setCurrencySearchQuery('');
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DOCTOR PRESET AVATAR CHOOSER MODAL
      ========================================================================= */}
      {photoModalCabin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Select Doctor Avatar for {photoModalCabin.doctorName}
                </h3>
                <p className="text-xs text-slate-500">Pick a professional medical portrait preset or upload a custom image.</p>
              </div>
              <button
                type="button"
                onClick={() => setPhotoModalCabin(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {DOCTOR_AVATAR_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    clinicAudio.triggerHaptic(15);
                    updateCabin(photoModalCabin.cabinId, { image: p.url });
                    setPhotoModalCabin(null);
                    showToast(`Doctor picture updated to ${p.label}`);
                  }}
                  className="p-2 rounded-2xl border-2 border-slate-200 hover:border-blue-500 hover:shadow-md transition-all group flex flex-col items-center text-center"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 mb-1">
                    <img src={p.url} alt={p.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-700 leading-tight">{p.label}</span>
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <label className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5">
                <Camera className="w-4 h-4" />
                <span>Upload Custom Image From Device</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    handleImageFileChange(e, photoModalCabin, (updated) => {
                      updateCabin(photoModalCabin.cabinId, updated);
                      setPhotoModalCabin(null);
                    });
                  }}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => setPhotoModalCabin(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          UNIVERSAL MODAL DIALOGS FOR CRUD
      ========================================================================= */}
      {modalType && modalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {modalType.replace('_', ' ')}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setModalType(null);
                  setModalData(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                clinicAudio.triggerHaptic(15);
                if (modalType === 'ADD_CABIN') {
                  addCabin(modalData);
                  showToast(`${modalData.cabinName} added`);
                } else if (modalType === 'EDIT_CABIN') {
                  updateCabin(modalData.cabinId, modalData);
                  showToast(`${modalData.cabinName} updated`);
                } else if (modalType === 'ADD_SERVICE') {
                  addService(modalData);
                  showToast(`${modalData.name} added`);
                } else if (modalType === 'EDIT_SERVICE') {
                  updateService(modalData.id, modalData);
                  showToast(`${modalData.name} updated`);
                } else if (modalType === 'ADD_FORMULARY') {
                  addFormularyItem(modalData);
                  showToast(`${modalData.name} added to formulary`);
                } else if (modalType === 'EDIT_FORMULARY') {
                  updateFormularyItem(modalData.id, modalData);
                  showToast(`${modalData.name} updated`);
                } else if (modalType === 'ADD_SYMPTOM') {
                  addSymptom(modalData);
                  showToast(`${modalData.label} added`);
                } else if (modalType === 'EDIT_SYMPTOM') {
                  updateSymptom(modalData.id, modalData);
                  showToast(`${modalData.label} updated`);
                } else if (modalType === 'EDIT_PATIENT') {
                  updatePatient(modalData.id, modalData);
                  showToast(`Token ${modalData.tokenNumber} updated`);
                } else if (modalType === 'EDIT_INVOICE') {
                  updateInvoice(modalData.id, modalData);
                  showToast(`Invoice ${modalData.invoiceNumber} updated`);
                } else if (modalType === 'ADD_PATIENT_HISTORY') {
                  addPatientHistory(modalData);
                  showToast(`EMR for ${modalData.patientName} created`);
                } else if (modalType === 'EDIT_PATIENT_HISTORY') {
                  updatePatientHistory(modalData.patientId, modalData);
                  showToast(`EMR for ${modalData.patientName} updated`);
                }
                setModalType(null);
                setModalData(null);
              }}
              className="mt-4 space-y-4 text-xs"
            >
              {/* CABIN FORM FIELDS (WITH PICTURE UPLOAD) */}
              {(modalType === 'ADD_CABIN' || modalType === 'EDIT_CABIN') && (
                <>
                  {/* Photo Upload & Preview */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-blue-100 border border-blue-300 shrink-0">
                      <img src={modalData.image || DOCTOR_AVATAR_PRESETS[0].url} alt="Doctor" className="w-full h-full object-cover" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-800 block">Doctor Profile Picture</label>
                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-2xs">
                          Upload Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileChange(e, modalData, setModalData)}
                            className="hidden"
                          />
                        </label>
                        <select
                          value={modalData.image || ''}
                          onChange={(e) => setModalData({ ...modalData, image: e.target.value })}
                          className="px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                        >
                          <option value="">Preset Avatars...</option>
                          {DOCTOR_AVATAR_PRESETS.map(p => (
                            <option key={p.id} value={p.url}>{p.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Cabin ID #</label>
                      <input
                        type="number"
                        value={modalData.cabinId}
                        onChange={(e) => setModalData({ ...modalData, cabinId: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Cabin Room Name</label>
                      <input
                        type="text"
                        value={modalData.cabinName}
                        onChange={(e) => setModalData({ ...modalData, cabinName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Doctor Name</label>
                    <input
                      type="text"
                      value={modalData.doctorName}
                      onChange={(e) => setModalData({ ...modalData, doctorName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Department</label>
                      <input
                        type="text"
                        value={modalData.department}
                        onChange={(e) => setModalData({ ...modalData, department: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Consultation Fee ({currencyCode})</label>
                      <input
                        type="number"
                        value={modalData.consultationFee}
                        onChange={(e) => setModalData({ ...modalData, consultationFee: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Doctor Duty Status</label>
                      <select
                        value={modalData.status}
                        onChange={(e) => setModalData({ ...modalData, status: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="IN_CONSULTATION">IN_CONSULTATION</option>
                        <option value="ON_BREAK">ON_BREAK</option>
                        <option value="OFF_DUTY">OFF_DUTY</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Experience / Rating</label>
                      <input
                        type="text"
                        value={modalData.experience || '10 Years Exp'}
                        onChange={(e) => setModalData({ ...modalData, experience: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* SERVICE FORM FIELDS */}
              {(modalType === 'ADD_SERVICE' || modalType === 'EDIT_SERVICE') && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Service Code</label>
                      <input
                        type="text"
                        value={modalData.code}
                        onChange={(e) => setModalData({ ...modalData, code: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Category</label>
                      <select
                        value={modalData.category}
                        onChange={(e) => setModalData({ ...modalData, category: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      >
                        <option value="Consultation">Consultation</option>
                        <option value="Laboratory">Laboratory</option>
                        <option value="Imaging">Imaging</option>
                        <option value="Procedure">Procedure</option>
                        <option value="Nursing">Nursing</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Service Name</label>
                    <input
                      type="text"
                      value={modalData.name}
                      onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Department</label>
                      <input
                        type="text"
                        value={modalData.department}
                        onChange={(e) => setModalData({ ...modalData, department: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Price / Fee ({currencyCode})</label>
                      <input
                        type="number"
                        value={modalData.price}
                        onChange={(e) => setModalData({ ...modalData, price: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* FORMULARY FORM FIELDS (MEDICATION & GENERAL SUPPLIES) */}
              {(modalType === 'ADD_FORMULARY' || modalType === 'EDIT_FORMULARY') && (
                <>
                  {/* Item Classification Type Selector */}
                  <div>
                    <label className="font-black text-xs text-slate-700 uppercase tracking-wider block mb-1.5">
                      Item Classification
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setModalData({
                            ...modalData,
                            type: 'PHARMACY',
                            form: modalData.form === 'Piece / Unit' ? 'Tablet' : (modalData.form || 'Tablet'),
                            category: modalData.category === 'Medical Supply' ? 'Analgesic' : (modalData.category || 'Analgesic')
                          })
                        }
                        className={`p-3 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 transition-all ${
                          modalData.type !== 'GENERAL'
                            ? 'bg-purple-50 border-purple-600 text-purple-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Pill className="w-4 h-4 text-purple-600" />
                        <span>💊 Pharmacy Medication</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setModalData({
                            ...modalData,
                            type: 'GENERAL',
                            form: modalData.form === 'Tablet' ? 'Piece / Unit' : (modalData.form || 'Piece / Unit'),
                            category: modalData.category === 'Analgesic' ? 'Medical Supply' : (modalData.category || 'Medical Supply')
                          })
                        }
                        className={`p-3 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 transition-all ${
                          modalData.type === 'GENERAL'
                            ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Package className="w-4 h-4 text-indigo-600" />
                        <span>📦 General Consumable</span>
                      </button>
                    </div>
                  </div>

                  {/* Show to Doctor Toggle */}
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="font-black text-xs text-blue-950 flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                        <span>Show to Doctor for Prescription Pad</span>
                      </div>
                      <div className="text-[10px] text-blue-700 mt-0.5">
                        {modalData.showToDoctor !== false
                          ? 'Item is visible on doctor prescription pad in cabin console.'
                          : 'Internal inventory / nursing stock only (hidden from doctor Rx search).'}
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modalData.showToDoctor !== false}
                        onChange={(e) => setModalData({ ...modalData, showToDoctor: e.target.checked })}
                        className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        {modalData.type === 'GENERAL' ? 'Item / Product Name' : 'Medicine Brand Name'}
                      </label>
                      <input
                        type="text"
                        value={modalData.name}
                        onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                        placeholder={modalData.type === 'GENERAL' ? 'e.g. Sterile Gauze Swabs 10x10' : 'e.g. Panadol Extra 500mg'}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        {modalData.type === 'GENERAL' ? 'Specification / Standard' : 'Generic Active Substance'}
                      </label>
                      <input
                        type="text"
                        value={modalData.generic}
                        onChange={(e) => setModalData({ ...modalData, generic: e.target.value })}
                        placeholder={modalData.type === 'GENERAL' ? 'e.g. 100% Bleached Cotton' : 'e.g. Paracetamol + Caffeine'}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        required
                      />
                    </div>
                  </div>

                  {/* Form / Packaging Route Preset */}
                  <div className="p-3 bg-purple-50/60 border border-purple-200/80 rounded-2xl space-y-2">
                    <label className="font-black text-xs text-purple-950 uppercase tracking-wider block">
                      {modalData.type === 'GENERAL'
                        ? 'Packaging Unit / Format (Pre-configured for Dispensing):'
                        : 'Form / Dosage Route (Pre-configured for Doctor Prescriptions):'}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {(modalData.type === 'GENERAL'
                        ? ['Piece / Unit', 'Pack', 'Roll', 'Box', 'Tube', 'Bottle', 'Vial', 'Set', 'Pair']
                        : ['Tablet', 'Capsule', 'Syrup (5ml)', 'Syrup (10ml)', 'Suspension', 'Injection (IM/IV)', 'Drops', 'Inhaler / Puffs', 'Ointment', 'Cream']
                      ).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setModalData({ ...modalData, form: f })}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                            (modalData.form || (modalData.type === 'GENERAL' ? 'Piece / Unit' : 'Tablet')) === f
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Selected form or custom packaging..."
                      value={modalData.form || (modalData.type === 'GENERAL' ? 'Piece / Unit' : 'Tablet')}
                      onChange={(e) => setModalData({ ...modalData, form: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl font-bold text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        {modalData.type === 'GENERAL' ? 'Dimensions / Size' : 'Strength'}
                      </label>
                      <input
                        type="text"
                        value={modalData.strength}
                        onChange={(e) => setModalData({ ...modalData, strength: e.target.value })}
                        placeholder={modalData.type === 'GENERAL' ? 'e.g. 5ml / 10cm' : 'e.g. 500mg'}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Price ({currencyCode})</label>
                      <input
                        type="number"
                        value={modalData.price}
                        onChange={(e) => setModalData({ ...modalData, price: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Stock Level</label>
                      <input
                        type="number"
                        value={modalData.stock ?? 50}
                        onChange={(e) => setModalData({ ...modalData, stock: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Category / Group</label>
                      <input
                        type="text"
                        value={modalData.category || ''}
                        onChange={(e) => setModalData({ ...modalData, category: e.target.value })}
                        placeholder={modalData.type === 'GENERAL' ? 'e.g. Medical Supply / Dressing' : 'e.g. Antibiotic / Analgesic'}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Storage / Shelf Location</label>
                      <input
                        type="text"
                        value={modalData.storageLocation || ''}
                        onChange={(e) => setModalData({ ...modalData, storageLocation: e.target.value })}
                        placeholder={modalData.type === 'GENERAL' ? 'e.g. Shelf G-01' : 'e.g. Shelf A-04'}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Usage / Dispensing Instructions</label>
                    <input
                      type="text"
                      value={modalData.instructions || ''}
                      onChange={(e) => setModalData({ ...modalData, instructions: e.target.value })}
                      placeholder={modalData.type === 'GENERAL' ? 'e.g. Use for post-op dressing once daily' : 'e.g. Take 1 tablet after meals'}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </>
              )}

              {/* SYMPTOM FORM FIELDS */}
              {(modalType === 'ADD_SYMPTOM' || modalType === 'EDIT_SYMPTOM') && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Icon / Emoji</label>
                      <input
                        type="text"
                        value={modalData.icon}
                        onChange={(e) => setModalData({ ...modalData, icon: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">Symptom Title</label>
                      <input
                        type="text"
                        value={modalData.label}
                        onChange={(e) => setModalData({ ...modalData, label: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Department</label>
                      <input
                        type="text"
                        value={modalData.dept}
                        onChange={(e) => setModalData({ ...modalData, dept: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Recommended Cabin</label>
                      <select
                        value={modalData.cabinId}
                        onChange={(e) => {
                          const targetCabin = cabins.find(c => c.cabinId === Number(e.target.value));
                          setModalData({
                            ...modalData,
                            cabinId: Number(e.target.value),
                            doctorName: targetCabin?.doctorName || modalData.doctorName
                          });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      >
                        {cabins.map(c => (
                          <option key={c.cabinId} value={c.cabinId}>Cabin {c.cabinId} - {c.doctorName.split(',')[0]}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Description / Patient Guide</label>
                    <textarea
                      value={modalData.description || ''}
                      onChange={(e) => setModalData({ ...modalData, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </>
              )}

              {/* PATIENT EDIT (QUEUE & VITALS) */}
              {modalType === 'EDIT_PATIENT' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Patient Name</label>
                      <input
                        type="text"
                        value={modalData.patientName}
                        onChange={(e) => setModalData({ ...modalData, patientName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Phone</label>
                      <input
                        type="text"
                        value={modalData.phone || ''}
                        onChange={(e) => setModalData({ ...modalData, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Reassign Cabin</label>
                      <select
                        value={modalData.cabinId}
                        onChange={(e) => {
                          const targetCabin = cabins.find(c => c.cabinId === Number(e.target.value));
                          setModalData({
                            ...modalData,
                            cabinId: Number(e.target.value),
                            doctorName: targetCabin?.doctorName || modalData.doctorName,
                            department: targetCabin?.department || modalData.department
                          });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      >
                        {cabins.map(c => (
                          <option key={c.cabinId} value={c.cabinId}>Cabin {c.cabinId} - {c.doctorName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Queue Status</label>
                      <select
                        value={modalData.status}
                        onChange={(e) => setModalData({ ...modalData, status: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      >
                        <option value="WAITING">WAITING</option>
                        <option value="CALLED">CALLED</option>
                        <option value="IN_CONSULTATION">IN_CONSULTATION</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="TOKEN_RETURNED">TOKEN_RETURNED</option>
                      </select>
                    </div>
                  </div>

                  {/* Override Triage Vitals */}
                  <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-2">
                    <span className="font-extrabold text-blue-900 block text-[11px] uppercase">Recorded Triage Vitals</span>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block">Temp</label>
                        <input
                          type="text"
                          value={modalData.vitals?.temp || ''}
                          onChange={(e) => setModalData({ ...modalData, vitals: { ...modalData.vitals, temp: e.target.value } })}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block">Blood Pressure</label>
                        <input
                          type="text"
                          value={modalData.vitals?.bp || ''}
                          onChange={(e) => setModalData({ ...modalData, vitals: { ...modalData.vitals, bp: e.target.value } })}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block">SpO2</label>
                        <input
                          type="text"
                          value={modalData.vitals?.spo2 || ''}
                          onChange={(e) => setModalData({ ...modalData, vitals: { ...modalData.vitals, spo2: e.target.value } })}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* INVOICE EDIT / ADJUST */}
              {modalType === 'EDIT_INVOICE' && (
                <>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Invoice Status</label>
                    <select
                      value={modalData.status}
                      onChange={(e) => setModalData({ ...modalData, status: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      <option value="PAID_UPFRONT">PAID_UPFRONT</option>
                      <option value="SETTLED">SETTLED</option>
                      <option value="REFUND_DUE">REFUND_DUE</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Discount ({currencyCode})</label>
                      <input
                        type="number"
                        value={modalData.discount || 0}
                        onChange={(e) => {
                          const disc = Number(e.target.value);
                          const total = Math.max(0, (modalData.subtotal || 0) - disc - (modalData.insuranceCoPay || 0));
                          setModalData({ ...modalData, discount: disc, total });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Co-Pay / Insurance ({currencyCode})</label>
                      <input
                        type="number"
                        value={modalData.insuranceCoPay || 0}
                        onChange={(e) => {
                          const copay = Number(e.target.value);
                          const total = Math.max(0, (modalData.subtotal || 0) - (modalData.discount || 0) - copay);
                          setModalData({ ...modalData, insuranceCoPay: copay, total });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl flex items-center justify-between">
                    <span className="font-bold text-emerald-900">Adjusted Net Total:</span>
                    <span className="font-black text-emerald-700 text-sm">{currencySymbol} {modalData.total?.toLocaleString()}</span>
                  </div>
                </>
              )}

              {/* PATIENT EMR HISTORY EDIT */}
              {(modalType === 'ADD_PATIENT_HISTORY' || modalType === 'EDIT_PATIENT_HISTORY') && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Patient Full Name</label>
                      <input
                        type="text"
                        value={modalData.patientName}
                        onChange={(e) => setModalData({ ...modalData, patientName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={modalData.phone}
                        onChange={(e) => setModalData({ ...modalData, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Age</label>
                      <input
                        type="number"
                        value={modalData.age}
                        onChange={(e) => setModalData({ ...modalData, age: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Gender</label>
                      <select
                        value={modalData.gender}
                        onChange={(e) => setModalData({ ...modalData, gender: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Blood Group</label>
                      <input
                        type="text"
                        value={modalData.bloodGroup || 'O+'}
                        onChange={(e) => setModalData({ ...modalData, bloodGroup: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Known Drug Allergies (comma separated)</label>
                    <input
                      type="text"
                      value={Array.isArray(modalData.allergies) ? modalData.allergies.join(', ') : (modalData.allergies || '')}
                      onChange={(e) => setModalData({ ...modalData, allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      placeholder="e.g. Penicillin, Sulfa drugs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Chronic Medical Conditions (comma separated)</label>
                    <input
                      type="text"
                      value={Array.isArray(modalData.chronicConditions) ? modalData.chronicConditions.join(', ') : (modalData.chronicConditions || '')}
                      onChange={(e) => setModalData({ ...modalData, chronicConditions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                      placeholder="e.g. Hypertension, Type-2 Diabetes"
                    />
                  </div>
                </>
              )}

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setModalType(null);
                    setModalData(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-md shadow-blue-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          LOCAL CLINIC STAFF USER MODAL (ISOLATED RBAC)
      ========================================================================= */}
      {clinicUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Add Staff User ({activeClinic?.name})</h3>
                <p className="text-xs text-slate-500">Create login credentials isolated strictly to this clinic facility.</p>
              </div>
              <button
                type="button"
                onClick={() => setClinicUserModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                clinicAudio.triggerHaptic(15);
                addUser({
                  ...clinicUserData,
                  id: `usr-${Date.now()}`,
                  clinicId: activeClinic?.id,
                  googleAuthSecret: 'JBSWY3DPEHPK3PXP',
                  lastVerifiedDate: new Date().toISOString()
                });
                setClinicUserModal(false);
                showToast(`Staff user @${clinicUserData.username} registered for ${activeClinic?.name}`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Staff Name</label>
                <input
                  type="text"
                  required
                  value={clinicUserData.name}
                  onChange={(e) => setClinicUserData({ ...clinicUserData, name: e.target.value })}
                  placeholder="e.g. Dr. Ayesha Khan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Username (Login ID)</label>
                <input
                  type="text"
                  required
                  value={clinicUserData.username}
                  onChange={(e) => setClinicUserData({ ...clinicUserData, username: e.target.value })}
                  placeholder="e.g. ayesha.khan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={clinicUserData.email}
                  onChange={(e) => setClinicUserData({ ...clinicUserData, email: e.target.value })}
                  placeholder="e.g. ayesha@clinic.org"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Role</label>
                  <select
                    value={clinicUserData.role}
                    onChange={(e) => setClinicUserData({ ...clinicUserData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="DOCTOR_USER">Doctor</option>
                    <option value="KIOSK_TERMINAL">Kiosk Terminal</option>
                    <option value="BILLING_USER">Billing Staff</option>
                    <option value="PHARMACY_USER">Pharmacy Staff</option>
                    <option value="CLINIC_ADMIN">Local Clinic Admin</option>
                  </select>
                </div>
                {clinicUserData.role === 'DOCTOR_USER' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Assigned Cabin</label>
                    <select
                      value={clinicUserData.doctorCabinId}
                      onChange={(e) => setClinicUserData({ ...clinicUserData, doctorCabinId: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    >
                      {cabins.map((c) => (
                        <option key={c.cabinId} value={c.cabinId}>
                          Cabin {c.cabinId} ({c.doctorName.split(',')[0]})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-black text-xs text-teal-950">Google Authenticator (2FA)</div>
                  <div className="text-[10px] text-teal-700">Enforce 30-day 2FA validation</div>
                </div>
                <input
                  type="checkbox"
                  checked={clinicUserData.googleAuthEnabled}
                  onChange={(e) => setClinicUserData({ ...clinicUserData, googleAuthEnabled: e.target.checked })}
                  className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setClinicUserModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black shadow-md shadow-teal-500/20"
                >
                  Save Staff User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          PHYSICAL KIOSK DEVICE MODAL
      ========================================================================= */}
      {newDeviceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Add Kiosk Terminal ({activeClinic?.name})</h3>
                <p className="text-xs text-slate-500">Register physical touchscreen terminal and unlock PIN.</p>
              </div>
              <button
                type="button"
                onClick={() => setNewDeviceModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                clinicAudio.triggerHaptic(15);
                if (newDeviceData.pin.length !== 4) {
                  alert('PIN must be 4 digits.');
                  return;
                }
                const devId = `KIOSK-${Date.now().toString().slice(-4)}`;
                addKioskDevice({
                  id: devId,
                  name: newDeviceData.name || `Kiosk Terminal ${devId}`,
                  location: newDeviceData.location || 'Main Reception',
                  pin: newDeviceData.pin,
                  status: 'ONLINE'
                });
                setNewDeviceModal(false);
                setNewDeviceData({ name: '', pin: '1234', location: 'Main Lobby' });
                showToast(`Kiosk device added with PIN ${newDeviceData.pin}`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Terminal Device Name</label>
                <input
                  type="text"
                  required
                  value={newDeviceData.name}
                  onChange={(e) => setNewDeviceData({ ...newDeviceData, name: e.target.value })}
                  placeholder="e.g. Ground Floor Touch Kiosk A"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Physical Location</label>
                <input
                  type="text"
                  required
                  value={newDeviceData.location}
                  onChange={(e) => setNewDeviceData({ ...newDeviceData, location: e.target.value })}
                  placeholder="e.g. Main Entrance Lobby"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">4-Digit Security Unlock PIN</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={newDeviceData.pin}
                  onChange={(e) => setNewDeviceData({ ...newDeviceData, pin: e.target.value })}
                  placeholder="1234"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-center text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewDeviceModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black shadow-md shadow-teal-500/20"
                >
                  Register Kiosk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD / EDIT EMERGENCY MINOR PROCEDURE (CLINIC LEVEL)
          ========================================================================= */}
      {(procModalType === 'ADD' || procModalType === 'EDIT') && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
                  <Scissors className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900">
                  {procModalType === 'ADD' ? 'Add Emergency Minor Procedure' : `Edit ${selectedProc?.name}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setProcModalType(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-xs"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                clinicAudio.triggerHaptic(20);
                if (procModalType === 'ADD') {
                  const created = addEmergencyProcedure(procFormData);
                  showToast(`Procedure ${created.name} (${created.code}) created successfully`);
                } else {
                  updateEmergencyProcedure(selectedProc.id || selectedProc.code, procFormData);
                  showToast(`Procedure ${procFormData.name} updated`);
                }
                setProcModalType(null);
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Procedure Code</label>
                  <input
                    type="text"
                    required
                    value={procFormData.code}
                    onChange={(e) => setProcFormData({ ...procFormData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. EMG-PRC-BDG"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Fee in PKR ({currencySymbol})</label>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    required
                    value={procFormData.price}
                    onChange={(e) => setProcFormData({ ...procFormData, price: Number(e.target.value) })}
                    placeholder="500"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-rose-700 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Procedure Name</label>
                <input
                  type="text"
                  required
                  value={procFormData.name}
                  onChange={(e) => setProcFormData({ ...procFormData, name: e.target.value })}
                  placeholder="e.g. Wound Dressing & Crepe Bandage"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Clinical Category</label>
                  <select
                    value={procFormData.category}
                    onChange={(e) => setProcFormData({ ...procFormData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
                  >
                    <option value="Wound Care">Wound Care</option>
                    <option value="Vascular Access">Vascular Access</option>
                    <option value="Urology">Urology</option>
                    <option value="Respiratory Therapy">Respiratory Therapy</option>
                    <option value="Injections & Medications">Injections & Medications</option>
                    <option value="Surgical & Lacerations">Surgical & Lacerations</option>
                    <option value="Gastrointestinal Care">Gastrointestinal Care</option>
                    <option value="Diagnostic Stat Check">Diagnostic Stat Check</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Severity Protocol</label>
                  <select
                    value={procFormData.severity}
                    onChange={(e) => setProcFormData({ ...procFormData, severity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
                  >
                    <option value="CRITICAL">CRITICAL (Immediate)</option>
                    <option value="URGENT">URGENT (Acute)</option>
                    <option value="PRIORITY">PRIORITY (Elective Minor)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Est. Duration (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={procFormData.durationMinutes}
                    onChange={(e) => setProcFormData({ ...procFormData, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Assigned Cabin</label>
                  <select
                    value={procFormData.cabinId}
                    onChange={(e) => setProcFormData({ ...procFormData, cabinId: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
                  >
                    {cabins.map((c) => (
                      <option key={c.cabinId} value={c.cabinId}>
                        Cabin {c.cabinId} ({c.cabinName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Pre-Packed Consumables (Comma-separated)</label>
                <input
                  type="text"
                  value={procFormData.consumables}
                  onChange={(e) => setProcFormData({ ...procFormData, consumables: e.target.value })}
                  placeholder="e.g. Sterile Gauze Pad x5, Povidone Iodine 100ml, Micropore Tape"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Clinical Protocol Description</label>
                <textarea
                  rows={2}
                  value={procFormData.description}
                  onChange={(e) => setProcFormData({ ...procFormData, description: e.target.value })}
                  placeholder="Clinical indication, precautions, and instructions for triage..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Active in Live Kiosk & Cabin:</span>
                <button
                  type="button"
                  onClick={() => setProcFormData({ ...procFormData, active: !procFormData.active })}
                  className={`px-3 py-1 rounded-full text-xs font-black transition-colors ${
                    procFormData.active ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {procFormData.active ? '✓ Active' : '✕ Inactive'}
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProcModalType(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-[#8B0029] to-[#9E1238] hover:from-[#7A0024] hover:to-[#8B0029] text-white rounded-xl text-xs font-black shadow-md shadow-maroon-900/20"
                >
                  {procModalType === 'ADD' ? 'Create Procedure' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD / EDIT EMERGENCY KIT (CLINIC LEVEL)
          ========================================================================= */}
      {(kitModalType === 'ADD' || kitModalType === 'EDIT') && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                  <Heart className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900">
                  {kitModalType === 'ADD' ? 'Add Emergency Trauma Kit' : `Edit ${selectedKit?.name}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setKitModalType(null)}
                className="text-slate-400 hover:text-slate-600 p-1 text-xs"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                clinicAudio.triggerHaptic(20);
                if (kitModalType === 'ADD') {
                  const created = addEmergencyKit(kitFormData);
                  showToast(`Emergency kit ${created.name} added`);
                } else {
                  updateEmergencyKit(selectedKit.id, kitFormData);
                  showToast(`Emergency kit ${kitFormData.name} updated`);
                }
                setKitModalType(null);
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kit Code</label>
                  <input
                    type="text"
                    required
                    value={kitFormData.code}
                    onChange={(e) => setKitFormData({ ...kitFormData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. KIT-WOUND"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Pack Fee (PKR {currencySymbol})</label>
                  <input
                    type="number"
                    min={0}
                    step={50}
                    required
                    value={kitFormData.price}
                    onChange={(e) => setKitFormData({ ...kitFormData, price: Number(e.target.value) })}
                    placeholder="1500"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-emerald-700 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Kit Pack Name</label>
                <input
                  type="text"
                  required
                  value={kitFormData.name}
                  onChange={(e) => setKitFormData({ ...kitFormData, name: e.target.value })}
                  placeholder="e.g. Wound Dressing & Trauma Kit"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Destination Room</label>
                <input
                  type="text"
                  value={kitFormData.targetRoom}
                  onChange={(e) => setKitFormData({ ...kitFormData, targetRoom: e.target.value })}
                  placeholder="e.g. Cabin 1 - Treatment Room"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Included Items (Comma-separated)</label>
                <textarea
                  rows={3}
                  value={kitFormData.items}
                  onChange={(e) => setKitFormData({ ...kitFormData, items: e.target.value })}
                  placeholder="Sterile Gauze Pad x5, Povidone Iodine 100ml, Micropore Tape, Normal Saline 100ml..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setKitModalType(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-md shadow-teal-500/20"
                >
                  {kitModalType === 'ADD' ? 'Add Kit' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
