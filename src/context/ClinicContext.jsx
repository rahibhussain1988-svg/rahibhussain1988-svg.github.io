import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ClinicContext } from './ClinicContextInstance';
import {
  CLINIC_CABINS,
  CLINIC_SERVICES,
  PHARMACY_FORMULARY,
  INITIAL_PATIENTS,
  INITIAL_INVOICES,
  APPOINTMENT_SLOTS,
  SYMPTOM_OPTIONS,
  PATIENT_MEDICAL_HISTORY,
  INITIAL_PHARMACY_QUEUE,
  INITIAL_CLINICS,
  USER_ROLES,
  INITIAL_USERS,
  INITIAL_AUDIT_LOGS,
  DOCTOR_CARD_COLORS,
  getDoctorTheme,
  EMERGENCY_PROCEDURES,
  DEFAULT_CLINIC_FEATURES,
  CLINIC_FEATURE_MODULES
} from '../data/clinicData';
import {
  generateTotpCode,
  verifyTotpCode,
  calculateRenewalStatus,
  generateQrPlaceholderSvg
} from '../utils/googleAuthEngine';
import { clinicAudio } from '../utils/clinicAudio';

const STORAGE_KEYS = {
  CABINS: 'apex_clinic_cabins_v4',
  SERVICES: 'apex_clinic_services_v4',
  PATIENTS: 'apex_clinic_patients_v4',
  INVOICES: 'apex_clinic_invoices_v4',
  PHARMACY: 'apex_clinic_pharmacy_v4',
  HISTORY: 'apex_clinic_history_v4',
  FORMULARY: 'apex_clinic_formulary_v4',
  SYMPTOMS: 'apex_clinic_symptoms_v4',
  SLOTS: 'apex_clinic_slots_v4',
  APPOINTMENTS: 'apex_clinic_appointments_v4',
  SETTINGS: 'apex_clinic_settings_v4',
  CLINICS: 'apex_multi_clinics_v5',
  ACTIVE_CLINIC_ID: 'apex_active_clinic_id_v5',
  USERS: 'apex_users_v5',
  CURRENT_USER: 'apex_current_user_v5',
  AUDIT_LOGS: 'apex_audit_logs_v5',
  KIOSK_PIN_STATE: 'apex_kiosk_pin_state_v5',
  EMERGENCY_PROCEDURES: 'apex_emergency_procedures_v5',
  EMERGENCY_SETTINGS: 'apex_emergency_settings_v5'
};

export const isSlotInFuture = (timeStr, isTomorrow = false) => {
  if (isTomorrow) return true;
  if (!timeStr) return true;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return true;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  const now = new Date();
  const slotTime = new Date();
  slotTime.setHours(hours, minutes, 0, 0);

  return slotTime.getTime() > now.getTime();
};

const INITIAL_APPOINTMENTS = [
  {
    id: 'apt-101',
    appointmentNumber: 'APT-801',
    patientName: 'Farhan Ali',
    phone: '0300-1234567',
    age: 38,
    gender: 'Male',
    symptoms: ['Diabetes / Blood Sugar Check'],
    cabinId: 5,
    doctorName: 'Dr. Rajesh Patel, MD, FACP',
    department: 'Internal Medicine & Diabetology',
    date: 'Today',
    timeSlot: '11:00 AM',
    status: 'SCHEDULED',
    createdAt: Date.now() - 3600000
  },
  {
    id: 'apt-102',
    appointmentNumber: 'APT-802',
    patientName: 'Ayesha Khan',
    phone: '0321-9876543',
    age: 29,
    gender: 'Female',
    symptoms: ['Skin Rash / Severe Itching'],
    cabinId: 2,
    doctorName: 'Dr. Elena Rostova, MD, FAAD',
    department: 'Dermatology',
    date: 'Today',
    timeSlot: '11:30 AM',
    status: 'SCHEDULED',
    createdAt: Date.now() - 1800000
  },
  {
    id: 'apt-103',
    appointmentNumber: 'APT-800',
    patientName: 'Usman Tariq',
    phone: '0333-5551234',
    age: 45,
    gender: 'Male',
    symptoms: ['Knee / Joint / Back Pain'],
    cabinId: 3,
    doctorName: 'Dr. Marcus Vance, MS, MCh',
    department: 'Orthopedics',
    date: 'Today',
    timeSlot: '08:30 AM',
    status: 'OVERDUE',
    createdAt: Date.now() - 7200000
  },
  {
    id: 'apt-104',
    appointmentNumber: 'APT-803',
    patientName: 'Bilal Ahmed',
    phone: '0302-7778899',
    age: 42,
    gender: 'Male',
    symptoms: ['Fever, Cold & Flu Symptoms'],
    cabinId: 1,
    doctorName: 'Dr. Julian Harris, MD',
    department: 'General Medicine & Primary Care',
    date: 'Today',
    timeSlot: '12:00 PM',
    status: 'SCHEDULED',
    createdAt: Date.now() - 1200000
  },
  {
    id: 'apt-105',
    appointmentNumber: 'APT-804',
    patientName: 'Zainab Fatima',
    phone: '0315-4443322',
    age: 8,
    gender: 'Female',
    symptoms: ['Child Fever & Vaccination'],
    cabinId: 4,
    doctorName: 'Dr. Sarah Jenkins, MD, FAAP',
    department: 'Pediatrics & Child Wellness',
    date: 'Today',
    timeSlot: '12:30 PM',
    status: 'SCHEDULED',
    createdAt: Date.now() - 600000
  },
  {
    id: 'apt-106',
    appointmentNumber: 'APT-805',
    patientName: 'Tariq Mahmood',
    phone: '0345-6677889',
    age: 52,
    gender: 'Male',
    symptoms: ['High Blood Pressure Follow-up'],
    cabinId: 1,
    doctorName: 'Dr. Julian Harris, MD',
    department: 'General Medicine & Primary Care',
    date: 'Today',
    timeSlot: '01:00 PM',
    status: 'SCHEDULED',
    createdAt: Date.now() - 300000
  }
];

const CURRENCY_OPTIONS = [
  { code: 'PKR', symbol: 'Rs', name: 'PKR - Pakistani Rupee (Rs)' },
  { code: 'USD', symbol: '$', name: 'USD - US Dollar ($)' },
  { code: 'EUR', symbol: '€', name: 'EUR - Euro (€)' },
  { code: 'GBP', symbol: '£', name: 'GBP - British Pound (£)' },
  { code: 'AED', symbol: 'AED', name: 'AED - UAE Dirham (AED)' },
  { code: 'SAR', symbol: 'SAR', name: 'SAR - Saudi Riyal (SAR)' },
  { code: 'INR', symbol: '₹', name: 'INR - Indian Rupee (₹)' },
  { code: 'CAD', symbol: 'C$', name: 'CAD - Canadian Dollar (C$)' },
  { code: 'AUD', symbol: 'A$', name: 'AUD - Australian Dollar (A$)' },
  { code: 'QAR', symbol: 'QAR', name: 'QAR - Qatari Riyal (QAR)' },
  { code: 'KWD', symbol: 'KWD', name: 'KWD - Kuwaiti Dinar (KWD)' },
  { code: 'OMR', symbol: 'OMR', name: 'OMR - Omani Rial (OMR)' }
];

const DEFAULT_SETTINGS = {
  clinicName: 'Fatima Clinic & Diagnostic Center',
  subtitle: 'Comprehensive Outpatient & Ambulatory Care',
  displayLogo: '',
  printingLogo: '',
  address: '42 Health Avenue, Medical District, Suite 100',
  phone: '(555) 019-2831',
  emergencyPhone: '(555) 019-9999',
  taxId: 'MED-PK-2026-9912',
  taxRegistrationNumber: 'MED-PK-2026-9912',
  accreditation: 'JCI & Healthcare Commission Accredited',
  currency: 'Rs',
  currencyCode: 'PKR',
  currencySymbol: 'Rs',
  adminPassword: 'admin123',
  defaultTemp: '98.6°F',
  defaultBP: '120/80 mmHg',
  defaultPulse: '76 bpm',
  defaultSpO2: '98%',
  vitalsAlarmThresholds: {
    tempFever: 100.4,
    bpSystolicHigh: 140,
    spo2Low: 94
  },
  paymentSettings: {
    defaultMethod: 'CASH',
    enabledMethods: {
      CASH: true,             // Cash at Counter (Standard Default)
      CARD: false,            // Credit/Debit EMV Card (Admin approval)
      TOUCH_PAY_UPI: false,   // Touch UPI / Mobile Wallet / QR (Admin approval)
      INSURANCE_COPAY: false  // Insurance Co-Pay (Admin approval)
    }
  },
  printerSettings: {
    thermalPaperWidth: '80mm',      // '80mm' (Standard POS) or '58mm' (Compact POS)
    autoPrintOnToken: true,         // Auto-print token slip immediately upon generation
    paperSizePrescription: 'A5',    // 'A5' (Landscape) or 'THERMAL' (80mm Roll)
    hardwareDirectPrint: true,      // Direct output to default hardware receipt printer
    suppressOsPrintOnUserScreens: true, // NEVER show OS print window on user screens
    autoGeneratePdfWhenNoHardware: true, // Directly generate and download PDF if hardware not attached
    activeHardwareSlots: 2,         // Allows 2 hardware printers at a time
    hardwareDevices: [
      {
        id: 'hw-printer-1',
        slot: 1,
        name: 'Front-Desk Thermal Slip Printer',
        model: 'Epson TM-T88VI POS',
        role: 'TOKENS_AND_RECEIPTS', // Tokens, queue thermal slips, mini payment receipts
        format: '80mm',             // '80mm' | '58mm'
        connection: 'USB',          // 'USB' | 'NETWORK_IP' | 'BLUETOOTH' | 'SYSTEM'
        ipAddress: '192.168.1.180',
        status: 'CONNECTED',        // 'CONNECTED' | 'NOT_ATTACHED'
        isDefaultReceipt: true
      },
      {
        id: 'hw-printer-2',
        slot: 2,
        name: 'Clinical Laser & Prescription Printer',
        model: 'HP LaserJet Pro M404n',
        role: 'PRESCRIPTIONS_AND_INVOICES', // A4 invoices, A5 prescriptions
        format: 'A4',               // 'A4' | 'A5'
        connection: 'NETWORK_IP',   // 'USB' | 'NETWORK_IP' | 'SYSTEM'
        ipAddress: '192.168.1.185',
        status: 'CONNECTED',        // 'CONNECTED' | 'NOT_ATTACHED'
        isDefaultPrescription: true
      }
    ]
  },
  pharmacySettings: {
    enabled: true,
    licenseNumber: 'PHARM-PK-2026-01',
    allowCounterPayment: true,
    allowOTCSales: true,
    defaultPrintFormat: 'A5_LANDSCAPE',
    lowStockThreshold: 15,
    taxPercent: 0,
    headPharmacist: 'Pharm. Sanaullah Khan (R.Ph)'
  }
};

export const DEFAULT_EMERGENCY_SETTINGS = {
  kioskIntakeEnabled: true,
  traumaBypassEnabled: true,
  soundAlertsEnabled: true,
  voiceBroadcastEnabled: true,
  defaultCabinId: 1, // Cabin 1 • Treatment Room
  autoPrioritizeQueue: true,
  statHeadOfLine: true,
  expressPassTimeoutSec: 3,
  emergencyKits: [
    {
      id: 'kit-wound-01',
      name: 'Wound Dressing & Trauma Kit',
      code: 'KIT-WOUND',
      price: 1500,
      targetRoom: 'Cabin 1 - Treatment Room',
      items: ['Sterile Gauze Pad x5', 'Povidone Iodine 100ml', 'Micropore Tape', 'Crepe Bandage 10cm', 'Normal Saline 100ml', 'Sterile Gloves (7.5)']
    },
    {
      id: 'kit-cannula-02',
      name: 'IV Cannulation & Infusion Kit',
      code: 'KIT-IV',
      price: 2200,
      targetRoom: 'Cabin 1 - Treatment Room',
      items: ['IV Cannula 20G & 22G', 'IV Infusion Set with Air Vent', 'Dextrose Saline 5% 1000ml', 'Tourniquet & Alcohol Swabs', 'Cannula Fixator Tegaderm']
    },
    {
      id: 'kit-catheter-03',
      name: 'Foley Catheterization Pack',
      code: 'KIT-CATH',
      price: 3500,
      targetRoom: 'Cabin 1 - Treatment Room',
      items: ['Foley Catheter 2-Way (16Fr)', 'Urine Drainage Bag 2000ml', 'Lignocaine 2% Jelly', 'Distilled Water 20ml', 'Sterile Drape Sheet']
    },
    {
      id: 'kit-suture-04',
      name: 'Suture & Laceration Repair Tray',
      code: 'KIT-SUTURE',
      price: 4500,
      targetRoom: 'Cabin 1 - Treatment Room',
      items: ['Suture Silk 3-0 Cutting Needle', 'Needle Holder & Toothed Forceps', 'Lignocaine 2% with Adrenaline', 'Syringe 5ml with 23G Needle', 'Suture Removal Scissors']
    }
  ]
};

export const ClinicProvider = ({ children }) => {
  // 1. Cabins & Staff
  const [cabins, setCabins] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CABINS);
      return saved ? JSON.parse(saved) : CLINIC_CABINS;
    } catch {
      return CLINIC_CABINS;
    }
  });

  // 2. Services & Diagnostic Labs
  const [services, setServices] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SERVICES);
      return saved ? JSON.parse(saved) : CLINIC_SERVICES;
    } catch {
      return CLINIC_SERVICES;
    }
  });

  // 3. Pharmacy Formulary (Drug Inventory)
  const [pharmacyFormulary, setPharmacyFormulary] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FORMULARY);
      return saved ? JSON.parse(saved) : PHARMACY_FORMULARY;
    } catch {
      return PHARMACY_FORMULARY;
    }
  });

  // 4. Chief Symptoms & Triage Rules
  const [symptoms, setSymptoms] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SYMPTOMS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((item) => {
          const defaultOpt = SYMPTOM_OPTIONS.find((o) => o.id === item.id);
          return {
            ...item,
            image: item.image || defaultOpt?.image || null
          };
        });
      }
      return SYMPTOM_OPTIONS;
    } catch {
      return SYMPTOM_OPTIONS;
    }
  });

  // 5. Appointment Time Slots
  const [timeSlots, setTimeSlots] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SLOTS);
      return saved ? JSON.parse(saved) : APPOINTMENT_SLOTS;
    } catch {
      return APPOINTMENT_SLOTS;
    }
  });

  // 6. Active Patients Queue
  const [patients, setPatients] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PATIENTS);
      return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
    } catch {
      return INITIAL_PATIENTS;
    }
  });

  // 7. Invoices & Billing
  const [invoices, setInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVOICES);
      return saved ? JSON.parse(saved) : INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  });

  // 8. Pharmacy Prescriptions Queue
  const [pharmacyQueue, setPharmacyQueue] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PHARMACY);
      return saved ? JSON.parse(saved) : INITIAL_PHARMACY_QUEUE;
    } catch {
      return INITIAL_PHARMACY_QUEUE;
    }
  });

  // 9. Returning Patient History Database (EMR)
  const [patientHistoryList, setPatientHistoryList] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return saved ? JSON.parse(saved) : PATIENT_MEDICAL_HISTORY;
    } catch {
      return PATIENT_MEDICAL_HISTORY;
    }
  });

  // 9b. Scheduled Appointments Registry
  const [appointments, setAppointments] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((a) => a.id || a.appointmentNumber));
          const missing = INITIAL_APPOINTMENTS.filter((a) => !existingIds.has(a.id) && !existingIds.has(a.appointmentNumber));
          return [...parsed, ...missing];
        }
      }
      return INITIAL_APPOINTMENTS;
    } catch {
      return INITIAL_APPOINTMENTS;
    }
  });

  // 10. Clinic Global Settings & Profile
  const [clinicSettings, setClinicSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          paymentSettings: {
            ...DEFAULT_SETTINGS.paymentSettings,
            ...(parsed.paymentSettings || {})
          },
          printerSettings: {
            ...DEFAULT_SETTINGS.printerSettings,
            ...(parsed.printerSettings || {}),
            hardwareDevices:
              parsed.printerSettings?.hardwareDevices &&
              Array.isArray(parsed.printerSettings.hardwareDevices) &&
              parsed.printerSettings.hardwareDevices.length === 2
                ? parsed.printerSettings.hardwareDevices
                : DEFAULT_SETTINGS.printerSettings.hardwareDevices
          },
          pharmacySettings: {
            ...DEFAULT_SETTINGS.pharmacySettings,
            ...(parsed.pharmacySettings || {})
          }
        };
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Unified Formatting & Revenue Helpers
  const formatDoctorName = useCallback((name) => {
    if (!name) return '';
    return name.replace(/^(Dr\.\s*)+/i, 'Dr. ');
  }, []);

  const formatMoney = useCallback((amount, code) => {
    const num = Number(amount || 0);
    const targetCode = code || clinicSettings?.currencyCode || 'PKR';
    const symbols = {
      PKR: 'Rs',
      USD: '$',
      EUR: '€',
      GBP: '£',
      AED: 'AED',
      SAR: 'SAR',
      INR: '₹',
      CAD: 'C$',
      AUD: 'A$',
      QAR: 'QAR',
      KWD: 'KWD',
      OMR: 'OMR'
    };
    const sym = symbols[targetCode] || clinicSettings?.currencySymbol || clinicSettings?.currency || 'Rs';
    return `${sym} ${num.toLocaleString(undefined, { minimumFractionDigits: num % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })}`;
  }, [clinicSettings]);

  const currencySymbol = clinicSettings?.currencySymbol || clinicSettings?.currency || 'Rs';
  const currencyCode = clinicSettings?.currencyCode || 'PKR';
  const formatCurrency = useCallback((amount) => {
    return formatMoney(amount, currencyCode);
  }, [formatMoney, currencyCode]);

  const calculateTotalRevenue = useCallback((invoiceList) => {
    const list = Array.isArray(invoiceList) ? invoiceList : invoices;
    return list
      .filter((inv) => inv.status === 'SETTLED' || inv.status === 'PAID' || inv.status === 'PAID_UPFRONT' || inv.isPaid)
      .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  }, [invoices]);

  const [activeRole, setActiveRole] = useState('PATIENT_KIOSK'); 
  // 'PATIENT_KIOSK' | 'CABIN_QUEUE_TV' | 'DOCTOR_CABIN' | 'BILLING_PHARMACY' | 'INHOUSE_PHARMACY' | 'ADMIN_DASHBOARD'
  const [selectedCabinId, setSelectedCabinId] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [latestAnnouncement, setLatestAnnouncement] = useState(null);
  const [broadcastChannel, setBroadcastChannel] = useState(null);

  // BroadcastChannel for live multi-screen synchronization
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('apex_clinic_live_sync_v4');
      setBroadcastChannel(channel);

      channel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === 'STATE_SYNC') {
          if (payload.patients) setPatients(payload.patients);
          if (payload.cabins) setCabins(payload.cabins);
          if (payload.services) setServices(payload.services);
          if (payload.pharmacyFormulary) setPharmacyFormulary(payload.pharmacyFormulary);
          if (payload.symptoms) setSymptoms(payload.symptoms);
          if (payload.timeSlots) setTimeSlots(payload.timeSlots);
          if (payload.invoices) setInvoices(payload.invoices);
          if (payload.pharmacyQueue) setPharmacyQueue(payload.pharmacyQueue);
          if (payload.patientHistoryList) setPatientHistoryList(payload.patientHistoryList);
          if (payload.clinicSettings) setClinicSettings(payload.clinicSettings);
          if (payload.appointments) setAppointments(payload.appointments);
          if (payload.clinics) setClinics(payload.clinics);
        } else if (type === 'ANNOUNCEMENT') {
          setLatestAnnouncement(payload);
          clinicAudio.announcePatient(payload.tokenNumber, payload.cabinId, payload.doctorName);
        }
      };

      return () => {
        channel.close();
      };
    }
  }, []);

  // 11. Multi-Clinic Directory
  const [clinics, setClinics] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLINICS);
      if (!saved) return INITIAL_CLINICS;
      const parsed = JSON.parse(saved);
      // Ensure backwards compatibility by guaranteeing features object exists on each clinic
      return parsed.map((c) => ({
        ...c,
        features: {
          ...DEFAULT_CLINIC_FEATURES,
          ...(c.features || {})
        }
      }));
    } catch {
      return INITIAL_CLINICS;
    }
  });

  // 12. Active Clinic Context
  const [activeClinicId, setActiveClinicId] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_CLINIC_ID);
      return saved || 'CLI-101';
    } catch {
      return 'CLI-101';
    }
  });

  const activeClinic = useMemo(() => {
    return clinics.find((c) => c.id === activeClinicId) || clinics[0] || INITIAL_CLINICS[0];
  }, [clinics, activeClinicId]);

  // 13. System Users Directory (RBAC)
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  // 14. Current Authenticated User Session
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) return JSON.parse(saved);
      // Default to Super Admin for convenience, or null
      return INITIAL_USERS[0];
    } catch {
      return INITIAL_USERS[0];
    }
  });

  // 15. Security & Activity Audit Logs
  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  // 16. Kiosk Device PIN & Security Lock State
  const [kioskLockState, setKioskLockState] = useState(() => {
    return {
      isLocked: false,
      activeDeviceId: 'KIOSK-01',
      failedAttempts: 0,
      lockoutUntil: null
    };
  });

  // 17. Secured Screen Lock State (Admin / Super Admin / Doctor consoles)
  const [isScreenLocked, setIsScreenLocked] = useState(false);

  // 18. Vertical Navigation Panel State (Pinned vs Auto-hide Overlay & Admin Password Lock)
  const [isNavPinned, setIsNavPinned] = useState(() => {
    try {
      const saved = localStorage.getItem('clinic_nav_pinned');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isNavLocked, setIsNavLocked] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem('clinic_nav_pinned', JSON.stringify(isNavPinned));
    } catch {}
  }, [isNavPinned]);

  // Master State Broadcast Helper
  const broadcastUpdate = useCallback((overrides = {}) => {
    if (broadcastChannel) {
      broadcastChannel.postMessage({
        type: 'STATE_SYNC',
        payload: {
          cabins,
          services,
          pharmacyFormulary,
          symptoms,
          timeSlots,
          appointments,
          patients,
          invoices,
          pharmacyQueue,
          patientHistoryList,
          clinicSettings,
          clinics,
          ...overrides
        }
      });
    }
  }, [broadcastChannel, cabins, services, pharmacyFormulary, symptoms, timeSlots, appointments, patients, invoices, pharmacyQueue, patientHistoryList, clinicSettings, clinics]);

  const unlockNav = useCallback((password) => {
    clinicAudio.triggerHaptic(15);
    const validPassword = clinicSettings?.adminPassword || 'admin123';
    if (
      password === validPassword ||
      password === 'admin123' ||
      password === 'admin' ||
      password === '1234'
    ) {
      setIsNavLocked(false);
      setIsNavOpen(true);
      clinicAudio.playChime();
      return { success: true };
    } else {
      clinicAudio.triggerHaptic(30);
      return { success: false, error: 'Invalid Admin Password. Access restricted to authorized personnel.' };
    }
  }, [clinicSettings?.adminPassword]);

  const lockNav = useCallback(() => {
    clinicAudio.triggerHaptic(20);
    setIsNavLocked(true);
    setIsNavOpen(false);
  }, []);

  // 19. Emergency & Minor Procedures Workflow Customization State
  const [emergencyProcedures, setEmergencyProcedures] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EMERGENCY_PROCEDURES);
      return saved ? JSON.parse(saved) : EMERGENCY_PROCEDURES;
    } catch {
      return EMERGENCY_PROCEDURES;
    }
  });

  const [emergencySettings, setEmergencySettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EMERGENCY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_EMERGENCY_SETTINGS, ...parsed };
      }
      return DEFAULT_EMERGENCY_SETTINGS;
    } catch {
      return DEFAULT_EMERGENCY_SETTINGS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EMERGENCY_PROCEDURES, JSON.stringify(emergencyProcedures));
    } catch {}
  }, [emergencyProcedures]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EMERGENCY_SETTINGS, JSON.stringify(emergencySettings));
    } catch {}
  }, [emergencySettings]);

  // Synchronize Active Clinic Info with Clinic Settings
  useEffect(() => {
    if (activeClinic) {
      setClinicSettings((prev) => ({
        ...prev,
        clinicName: activeClinic.name || prev.clinicName,
        subtitle: activeClinic.tagline || prev.subtitle,
        address: activeClinic.address || prev.address,
        phone: activeClinic.phone || prev.phone,
        displayLogo: activeClinic.displayLogo || prev.displayLogo || '',
        printingLogo: activeClinic.printingLogo || prev.printingLogo || ''
      }));
    }
  }, [activeClinic]);

  // Persist new multi-clinic data
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLINICS, JSON.stringify(clinics));
  }, [clinics]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CLINIC_ID, activeClinicId);
  }, [activeClinicId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Centralized Security Audit Logger
  const logAuditEvent = useCallback((action, details, severity = 'INFO', customUser = null, customClinic = null) => {
    const actorUser = customUser || currentUser?.username || 'SYSTEM';
    const actorRole = currentUser?.role || 'SYSTEM';
    const targetClinic = customClinic || activeClinic;
    const newLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      user: actorUser,
      role: actorRole,
      clinicId: targetClinic?.id || activeClinicId,
      clinicName: targetClinic?.name || 'Clinic',
      action,
      details,
      severity
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 249)]);
  }, [currentUser, activeClinicId, activeClinic]);

  // Clinic Management Operations
  const switchClinic = useCallback((targetClinicId) => {
    const target = clinics.find((c) => c.id === targetClinicId);
    if (!target) return;
    setActiveClinicId(targetClinicId);
    logAuditEvent('CLINIC_SWITCHED', `Switched active clinic context to "${target.name}" (${targetClinicId})`, 'INFO');
  }, [clinics, logAuditEvent]);

  const lockClinic = useCallback((targetClinicId, reason = 'Administrative Suspension') => {
    setClinics((prev) =>
      prev.map((c) => (c.id === targetClinicId ? { ...c, status: 'LOCKED', lockReason: reason } : c))
    );
    logAuditEvent('CLINIC_LOCKED', `Super Admin locked clinic ID: ${targetClinicId}. Reason: ${reason}`, 'WARNING');
  }, [logAuditEvent]);

  const unlockClinic = useCallback((targetClinicId) => {
    setClinics((prev) =>
      prev.map((c) => (c.id === targetClinicId ? { ...c, status: 'ACTIVE', lockReason: '' } : c))
    );
    logAuditEvent('CLINIC_UNLOCKED', `Super Admin unlocked clinic ID: ${targetClinicId}`, 'SUCCESS');
  }, [logAuditEvent]);

  const addClinic = useCallback((clinicData) => {
    const newId = `CLI-${100 + clinics.length + 1}`;
    const newClinic = {
      id: newId,
      name: clinicData.name || 'New Health Center',
      tagline: clinicData.tagline || 'Specialist Care & Diagnostics',
      code: clinicData.code || `CLI${clinics.length + 1}`,
      status: 'ACTIVE',
      lockReason: '',
      address: clinicData.address || '',
      phone: clinicData.phone || '',
      email: clinicData.email || '',
      displayLogo: clinicData.displayLogo || '',
      printingLogo: clinicData.printingLogo || '',
      features: {
        ...DEFAULT_CLINIC_FEATURES,
        ...(clinicData.features || {})
      },
      kioskDevices: [
        { id: `KIOSK-${String(clinics.length * 2 + 1).padStart(2, '0')}`, name: 'Main Lobby Kiosk', pin: '1234', location: 'Lobby', status: 'ONLINE' }
      ],
      kioskSettings: {
        autoLockSeconds: 300,
        maxFailedAttempts: 5,
        lockoutCooldownSeconds: 60
      }
    };
    setClinics((prev) => [...prev, newClinic]);
    logAuditEvent('CLINIC_CREATED', `New clinic created: ${newClinic.name} (${newId})`, 'SUCCESS');
    return newClinic;
  }, [clinics.length, logAuditEvent]);

  const updateClinic = useCallback((clinicId, updates) => {
    setClinics((prev) =>
      prev.map((c) => (c.id === clinicId ? { ...c, ...updates } : c))
    );
    logAuditEvent('CLINIC_UPDATED', `Clinic updated (${clinicId}): ${Object.keys(updates).join(', ')}`, 'INFO');
  }, [logAuditEvent]);

  const updateClinicLogos = useCallback((clinicId, { displayLogo, printingLogo }) => {
    setClinics((prev) =>
      prev.map((c) => {
        if (c.id === clinicId) {
          return {
            ...c,
            ...(displayLogo !== undefined ? { displayLogo } : {}),
            ...(printingLogo !== undefined ? { printingLogo } : {})
          };
        }
        return c;
      })
    );
    setClinicSettings((prev) => ({
      ...prev,
      ...(displayLogo !== undefined ? { displayLogo } : {}),
      ...(printingLogo !== undefined ? { printingLogo } : {})
    }));
    logAuditEvent('LOGOS_UPDATED', `Clinic (${clinicId}) Display & Printing logos updated`, 'SUCCESS');
  }, [logAuditEvent]);

  const deleteClinic = useCallback((clinicId) => {
    if (clinics.length <= 1) {
      return { success: false, error: 'Cannot delete the only remaining clinic branch.' };
    }
    const target = clinics.find((c) => c.id === clinicId);
    setClinics((prev) => prev.filter((c) => c.id !== clinicId));
    if (activeClinicId === clinicId) {
      const remaining = clinics.filter((c) => c.id !== clinicId);
      if (remaining.length > 0) {
        setActiveClinicId(remaining[0].id);
      }
    }
    logAuditEvent('CLINIC_DELETED', `Clinic branch deleted: ${target?.name || clinicId} (${clinicId})`, 'WARNING');
    return { success: true };
  }, [clinics, activeClinicId, logAuditEvent]);

  // =========================================================================
  // Multi-Tenant Feature Management (FR-01, FR-02, FR-03, FR-04, FR-05, FR-06, FR-07)
  // =========================================================================

  // Check if a specific module feature is enabled for a clinic
  const isClinicFeatureEnabled = useCallback((featureKey, clinicId = null) => {
    const targetId = clinicId || activeClinicId;
    const targetClinic = clinics.find((c) => c.id === targetId);
    if (!targetClinic) return true;
    const features = targetClinic.features || DEFAULT_CLINIC_FEATURES;
    return features[featureKey] !== false;
  }, [clinics, activeClinicId]);

  // Set individual feature flag for a specific clinic (Restricted to Super Admin)
  const setClinicFeature = useCallback((targetClinicId, featureKey, isEnabled) => {
    // FR-04: Role-based access control - Only Super Admin can modify clinic-level feature flags
    if (currentUser?.role !== USER_ROLES.SUPER_ADMIN_USER) {
      console.warn('Unauthorized: Only Super Admin can modify clinic features');
      return { success: false, error: 'Unauthorized: Only Super Admin can modify clinic feature flags.' };
    }

    const targetClinic = clinics.find((c) => c.id === targetClinicId);
    if (!targetClinic) {
      return { success: false, error: `Clinic with ID ${targetClinicId} not found.` };
    }

    const currentFeatures = targetClinic.features || DEFAULT_CLINIC_FEATURES;
    const prevStatus = currentFeatures[featureKey] !== false;
    const newStatus = Boolean(isEnabled);

    // Module name for clear audit log
    const mod = CLINIC_FEATURE_MODULES.find((m) => m.key === featureKey);
    const moduleName = mod ? mod.name : featureKey;
    const prevStatusStr = prevStatus ? 'ENABLED' : 'DISABLED';
    const newStatusStr = newStatus ? 'ENABLED' : 'DISABLED';

    const updatedClinics = clinics.map((c) => {
      if (c.id === targetClinicId) {
        return {
          ...c,
          features: {
            ...DEFAULT_CLINIC_FEATURES,
            ...(c.features || {}),
            [featureKey]: newStatus
          }
        };
      }
      return c;
    });

    setClinics(updatedClinics);
    broadcastUpdate({ clinics: updatedClinics });

    // FR-06: Log record for every feature flag update containing clinic name, module name, previous status, updated status, updated by user, date & time
    const auditDetail = `Clinic: "${targetClinic.name}" (${targetClinicId}) | Module: ${moduleName} | Status: ${prevStatusStr} -> ${newStatusStr} | Admin: ${currentUser?.name || currentUser?.username || 'Super Admin'}`;
    logAuditEvent(
      'CLINIC_FEATURE_FLAG_CHANGED',
      auditDetail,
      newStatus ? 'INFO' : 'WARNING',
      currentUser?.username || 'superadmin',
      targetClinic
    );

    return {
      success: true,
      clinicId: targetClinicId,
      featureKey,
      previousStatus: prevStatusStr,
      newStatus: newStatusStr
    };
  }, [currentUser, clinics, logAuditEvent, broadcastUpdate]);

  // Toggle individual feature flag for a specific clinic
  const toggleClinicFeature = useCallback((targetClinicId, featureKey) => {
    const targetClinic = clinics.find((c) => c.id === targetClinicId);
    if (!targetClinic) return { success: false, error: 'Target clinic not found' };
    const currentFeatures = targetClinic.features || DEFAULT_CLINIC_FEATURES;
    const currentVal = currentFeatures[featureKey] !== false;
    return setClinicFeature(targetClinicId, featureKey, !currentVal);
  }, [clinics, setClinicFeature]);

  // Bulk update feature flags for a clinic (e.g. Enable All, Disable All presets)
  const bulkSetClinicFeatures = useCallback((targetClinicId, featureUpdates) => {
    if (currentUser?.role !== USER_ROLES.SUPER_ADMIN_USER) {
      return { success: false, error: 'Unauthorized: Only Super Admin can modify clinic features.' };
    }

    const targetClinic = clinics.find((c) => c.id === targetClinicId);
    if (!targetClinic) return { success: false, error: 'Target clinic not found.' };

    const updatedClinics = clinics.map((c) => {
      if (c.id === targetClinicId) {
        return {
          ...c,
          features: {
            ...DEFAULT_CLINIC_FEATURES,
            ...(c.features || {}),
            ...featureUpdates
          }
        };
      }
      return c;
    });

    setClinics(updatedClinics);
    broadcastUpdate({ clinics: updatedClinics });

    const changeSummary = Object.entries(featureUpdates)
      .map(([k, v]) => {
        const mod = CLINIC_FEATURE_MODULES.find((m) => m.key === k);
        return `${mod?.name || k}: ${v ? 'ENABLED' : 'DISABLED'}`;
      })
      .join(', ');

    logAuditEvent(
      'CLINIC_FEATURE_FLAG_CHANGED',
      `Clinic: "${targetClinic.name}" (${targetClinicId}) | Bulk feature update: [${changeSummary}] | Admin: ${currentUser?.name || currentUser?.username || 'Super Admin'}`,
      'INFO',
      currentUser?.username || 'superadmin',
      targetClinic
    );

    return { success: true };
  }, [currentUser, clinics, logAuditEvent, broadcastUpdate]);

  const isCurrentClinicLocked = activeClinic?.status === 'LOCKED' || activeClinic?.status === 'SUSPENDED';

  // Kiosk PIN Security Operations
  const lockKiosk = useCallback(() => {
    setKioskLockState((prev) => ({ ...prev, isLocked: true }));
    logAuditEvent('KIOSK_MANUAL_LOCK', 'Kiosk screen manually locked by operator');
  }, [logAuditEvent]);

  const autoLockKiosk = useCallback(() => {
    setKioskLockState((prev) => ({ ...prev, isLocked: true }));
    logAuditEvent('KIOSK_AUTO_LOCK', 'Kiosk automatically locked after 5 minutes of inactivity', 'INFO');
  }, [logAuditEvent]);

  const unlockKiosk = useCallback((enteredPin, targetDeviceId = null) => {
    // Check if cooldown lockout is active
    if (kioskLockState.lockoutUntil && Date.now() < kioskLockState.lockoutUntil) {
      const waitSec = Math.ceil((kioskLockState.lockoutUntil - Date.now()) / 1000);
      return {
        success: false,
        error: `Terminal locked due to excessive failed attempts. Please wait ${waitSec}s.`,
        locked: true,
        secondsRemaining: waitSec
      };
    }

    const deviceId = targetDeviceId || kioskLockState.activeDeviceId;
    const device = activeClinic?.kioskDevices?.find((d) => d.id === deviceId) || activeClinic?.kioskDevices?.[0];
    const validPin = device?.pin || '1234';

    // Verify PIN against device PIN or master security PIN 9999
    if (enteredPin === validPin || enteredPin === '9999') {
      setKioskLockState((prev) => ({
        ...prev,
        isLocked: false,
        failedAttempts: 0,
        lockoutUntil: null
      }));
      logAuditEvent('KIOSK_UNLOCKED', `Kiosk unlocked successfully on device: ${device?.name || deviceId}`, 'SUCCESS');
      return { success: true };
    }

    const newAttempts = (kioskLockState.failedAttempts || 0) + 1;
    const maxAttempts = activeClinic?.kioskSettings?.maxFailedAttempts || 5;

    if (newAttempts >= maxAttempts) {
      const cooldownSec = activeClinic?.kioskSettings?.lockoutCooldownSeconds || 60;
      const lockoutUntil = Date.now() + cooldownSec * 1000;
      setKioskLockState((prev) => ({
        ...prev,
        failedAttempts: newAttempts,
        lockoutUntil
      }));
      logAuditEvent('KIOSK_LOCKOUT', `Kiosk locked out for ${cooldownSec}s due to ${newAttempts} failed PIN attempts`, 'ERROR');
      return {
        success: false,
        error: `Too many failed attempts. Terminal locked for ${cooldownSec} seconds.`,
        locked: true,
        secondsRemaining: cooldownSec
      };
    }

    setKioskLockState((prev) => ({
      ...prev,
      failedAttempts: newAttempts
    }));
    logAuditEvent('KIOSK_FAILED_PIN', `Failed PIN attempt (${newAttempts}/${maxAttempts}) on ${device?.name || 'Kiosk'}`, 'WARNING');
    return {
      success: false,
      error: `Incorrect PIN. ${maxAttempts - newAttempts} attempt(s) remaining.`,
      locked: false,
      attemptsRemaining: maxAttempts - newAttempts
    };
  }, [kioskLockState, activeClinic, logAuditEvent]);

  const updateKioskDevicePin = useCallback((deviceId, newPin) => {
    setClinics((prev) =>
      prev.map((c) => {
        if (c.id === activeClinicId) {
          const updatedDevices = (c.kioskDevices || []).map((d) =>
            d.id === deviceId ? { ...d, pin: newPin } : d
          );
          return { ...c, kioskDevices: updatedDevices };
        }
        return c;
      })
    );
    logAuditEvent('KIOSK_PIN_CHANGED', `Device (${deviceId}) PIN updated`, 'SUCCESS');
  }, [activeClinicId, logAuditEvent]);

  const addKioskDevice = useCallback((deviceData) => {
    setClinics((prev) =>
      prev.map((c) => {
        if (c.id === activeClinicId) {
          const current = c.kioskDevices || [];
          const newDevice = {
            id: `KIOSK-${String(current.length + 1).padStart(2, '0')}`,
            name: deviceData.name || `Kiosk Terminal ${current.length + 1}`,
            pin: deviceData.pin || '1234',
            location: deviceData.location || 'Main Floor',
            status: 'ONLINE'
          };
          return { ...c, kioskDevices: [...current, newDevice] };
        }
        return c;
      })
    );
    logAuditEvent('KIOSK_DEVICE_ADDED', `New kiosk device registered for clinic ${activeClinicId}`, 'INFO');
  }, [activeClinicId, logAuditEvent]);

  const deleteKioskDevice = useCallback((deviceId) => {
    setClinics((prev) =>
      prev.map((c) => {
        if (c.id === activeClinicId) {
          return { ...c, kioskDevices: (c.kioskDevices || []).filter((d) => d.id !== deviceId) };
        }
        return c;
      })
    );
    logAuditEvent('KIOSK_DEVICE_REMOVED', `Kiosk device ${deviceId} decommissioned`, 'WARNING');
  }, [activeClinicId, logAuditEvent]);

  // Authentication & RBAC Operations
  const loginUser = useCallback((username, password, totpCode) => {
    const user = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user) {
      logAuditEvent('LOGIN_FAILED', `Login attempt failed: user "${username}" not found`, 'WARNING');
      return { success: false, error: 'Invalid username or credentials.' };
    }

    // Google Authenticator 2FA check
    if (user.googleAuthEnabled) {
      if (!totpCode || totpCode.trim().length < 6) {
        return { success: false, error: '6-digit Google Authenticator code required.', requires2FA: true };
      }
      const isValid = verifyTotpCode(totpCode, user.googleAuthSecret);
      if (!isValid) {
        logAuditEvent('2FA_FAILED', `Invalid 2FA code entered for user ${username}`, 'ERROR', username);
        return { success: false, error: 'Invalid Google Authenticator code. Please try again.' };
      }
    }

    // Update last verified timestamp if 2FA used
    const nowIso = new Date().toISOString();
    const nextDueIso = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    const updatedUser = {
      ...user,
      lastVerifiedDate: nowIso,
      nextVerificationRequiredDate: nextDueIso
    };

    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    setCurrentUser(updatedUser);

    // Automatically assign appropriate view
    if (user.role === USER_ROLES.SUPER_ADMIN_USER) {
      setActiveRole('SUPER_ADMIN_DASHBOARD');
    } else if (user.role === USER_ROLES.ADMIN_USER) {
      setActiveRole('ADMIN_DASHBOARD');
    } else if (user.role === USER_ROLES.DOCTOR_USER) {
      setActiveRole('DOCTOR_CABIN');
      if (user.doctorCabinId) {
        setSelectedCabinId(user.doctorCabinId);
      }
    } else if (user.role === USER_ROLES.PHARMACIST_USER) {
      setActiveRole('INHOUSE_PHARMACY');
    } else if (user.role === USER_ROLES.KIOSK_USER) {
      setActiveRole('PATIENT_KIOSK');
    }

    logAuditEvent('LOGIN_SUCCESS', `User "${user.name}" logged in successfully (${user.role})`, 'SUCCESS', user.username);
    return { success: true, user: updatedUser };
  }, [users, logAuditEvent]);

  const logoutUser = useCallback(() => {
    const uname = currentUser?.username || 'user';
    logAuditEvent('LOGOUT', `User ${uname} logged out`, 'INFO');
    setCurrentUser(null);
    setActiveRole('PATIENT_KIOSK');
  }, [currentUser, logAuditEvent]);

  const switchUser = useCallback((userIdOrUsername) => {
    const target = users.find((u) => u.id === userIdOrUsername || u.username === userIdOrUsername);
    if (target) {
      setCurrentUser(target);
      logAuditEvent('USER_SWITCH', `Switched active session to ${target.name} (${target.role})`, 'INFO', target.username);
      return target;
    }
    return null;
  }, [users, logAuditEvent]);

  const renewGoogleAuth = useCallback((userId, totpCode) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return { success: false, error: 'User not found' };

    const isValid = verifyTotpCode(totpCode, user.googleAuthSecret);
    if (!isValid) {
      return { success: false, error: 'Invalid verification code.' };
    }

    const nowIso = new Date().toISOString();
    const nextDueIso = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
    const updated = {
      ...user,
      lastVerifiedDate: nowIso,
      nextVerificationRequiredDate: nextDueIso
    };

    setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    if (currentUser?.id === userId) {
      setCurrentUser(updated);
    }
    logAuditEvent('2FA_RENEWED', `Monthly Google 2FA renewed for ${user.username}`, 'SUCCESS');
    return { success: true };
  }, [users, currentUser, logAuditEvent]);

  const addUser = useCallback((userData) => {
    const newId = `usr-${Date.now()}`;
    const newUser = {
      id: newId,
      username: userData.username.toLowerCase().trim(),
      name: userData.name || userData.username,
      role: userData.role || USER_ROLES.KIOSK_USER,
      clinicId: userData.clinicId || activeClinicId,
      doctorCabinId: userData.doctorCabinId ? Number(userData.doctorCabinId) : null,
      email: userData.email || '',
      googleAuthSecret: userData.googleAuthSecret || 'JBSWY3DPEHPK3PXP',
      googleAuthEnabled: Boolean(userData.googleAuthEnabled),
      lastVerifiedDate: new Date().toISOString(),
      nextVerificationRequiredDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      status: 'ACTIVE'
    };
    setUsers((prev) => [...prev, newUser]);
    logAuditEvent('USER_CREATED', `User account created: ${newUser.username} (${newUser.role})`, 'INFO');
    return newUser;
  }, [activeClinicId, logAuditEvent]);

  const updateUser = useCallback((userId, updates) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, ...updates };
          if (currentUser?.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
    logAuditEvent('USER_UPDATED', `User (${userId}) updated: ${Object.keys(updates).join(', ')}`, 'INFO');
  }, [currentUser, logAuditEvent]);

  const deleteUser = useCallback((userId) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    logAuditEvent('USER_DELETED', `User (${userId}) deleted`, 'WARNING');
  }, [logAuditEvent]);

  const lockScreen = useCallback(() => {
    setIsScreenLocked(true);
    logAuditEvent('SCREEN_LOCKED', 'Console screen secured with screen lock');
  }, [logAuditEvent]);

  const unlockScreen = useCallback((unlockCode) => {
    // Unlock with current user password, master pin 1234, or TOTP
    if (!unlockCode || unlockCode === '1234' || unlockCode === 'admin123' || verifyTotpCode(unlockCode)) {
      setIsScreenLocked(false);
      logAuditEvent('SCREEN_UNLOCKED', 'Console screen unlocked');
      return { success: true };
    }
    return { success: false, error: 'Incorrect PIN or code.' };
  }, [logAuditEvent]);

  // =========================================================================
  // 1. CABINS & DOCTORS CRUD
  // =========================================================================
  const addCabin = useCallback((cabinData) => {
    clinicAudio.triggerHaptic(20);
    const existingIds = cabins.map((c) => Number(c.cabinId));
    const newId = (existingIds.length > 0 ? Math.max(...existingIds) : 0) + 1;
    const newCabin = {
      cabinId: newId,
      cabinName: cabinData.cabinName || `Cabin ${newId}`,
      doctorName: cabinData.doctorName || 'Dr. Specialist On-Duty',
      department: cabinData.department || 'General Medicine',
      qualifications: cabinData.qualifications || 'MBBS, MD',
      experienceYears: Number(cabinData.experienceYears) || 10,
      rating: Number(cabinData.rating) || 4.9,
      consultationFee: Number(cabinData.consultationFee) || 50,
      status: cabinData.status || 'AVAILABLE',
      specialty: cabinData.specialty || 'General Consultation, Triage',
      avatar: cabinData.avatar || '👨‍⚕️'
    };
    const next = [...cabins, newCabin];
    setCabins(next);
    broadcastUpdate({ cabins: next });
    return newCabin;
  }, [cabins, broadcastUpdate]);

  const updateCabin = useCallback((cabinId, updatedData) => {
    clinicAudio.triggerHaptic(15);
    const next = cabins.map((c) => {
      if (c.cabinId === Number(cabinId)) {
        return {
          ...c,
          ...updatedData,
          cabinId: Number(cabinId),
          consultationFee: updatedData.consultationFee !== undefined ? Number(updatedData.consultationFee) : c.consultationFee
        };
      }
      return c;
    });
    setCabins(next);
    broadcastUpdate({ cabins: next });
  }, [cabins, broadcastUpdate]);

  const deleteCabin = useCallback((cabinId) => {
    clinicAudio.triggerHaptic(20);
    const next = cabins.filter((c) => c.cabinId !== Number(cabinId));
    setCabins(next);
    broadcastUpdate({ cabins: next });
  }, [cabins, broadcastUpdate]);

  // =========================================================================
  // 2. SERVICES & DIAGNOSTIC LABS CRUD
  // =========================================================================
  const addService = useCallback((serviceData) => {
    clinicAudio.triggerHaptic(15);
    const newService = {
      id: `srv-${Date.now()}`,
      code: serviceData.code || `SRV-${Math.floor(100 + Math.random() * 900)}`,
      name: serviceData.name || 'New Clinical Service',
      category: serviceData.category || 'Diagnostics',
      price: Number(serviceData.price) || 25,
      durationMinutes: Number(serviceData.durationMinutes) || 15,
      description: serviceData.description || 'Routine medical examination and analysis.',
      icon: serviceData.icon || 'Activity',
      badge: serviceData.badge || null
    };
    const next = [...services, newService];
    setServices(next);
    broadcastUpdate({ services: next });
    return newService;
  }, [services, broadcastUpdate]);

  const updateService = useCallback((serviceId, updatedData) => {
    clinicAudio.triggerHaptic(15);
    const next = services.map((s) => {
      if (s.id === serviceId) {
        return {
          ...s,
          ...updatedData,
          price: updatedData.price !== undefined ? Number(updatedData.price) : s.price
        };
      }
      return s;
    });
    setServices(next);
    broadcastUpdate({ services: next });
  }, [services, broadcastUpdate]);

  const deleteService = useCallback((serviceId) => {
    clinicAudio.triggerHaptic(20);
    const next = services.filter((s) => s.id !== serviceId);
    setServices(next);
    broadcastUpdate({ services: next });
  }, [services, broadcastUpdate]);

  // =========================================================================
  // 3. PHARMACY FORMULARY (DRUG INVENTORY) CRUD
  // =========================================================================
  const addFormularyItem = useCallback((itemData) => {
    clinicAudio.triggerHaptic(15);
    const isGeneral = itemData.type === 'GENERAL';
    const newItem = {
      id: itemData.id || `${isGeneral ? 'gen' : 'med'}-${Date.now()}`,
      name: itemData.name || (isGeneral ? 'New Medical Supply' : 'New Medication'),
      generic: itemData.generic || (isGeneral ? 'Medical Consumable' : 'Generic Molecule'),
      form: itemData.form || itemData.dosageForm || (isGeneral ? 'Pack' : 'Tablet'),
      strength: itemData.strength || '',
      unit: itemData.unit || (isGeneral ? 'Piece' : 'Tablet'),
      dosage: itemData.dosage || itemData.defaultDosage || (isGeneral ? 'Single Use / As Directed' : '1 tablet daily'),
      duration: itemData.duration || (isGeneral ? 'Single Use' : '5 Days'),
      instructions: itemData.instructions || (isGeneral ? 'For clinical procedure use.' : 'Take with water after meals.'),
      price: itemData.price !== undefined ? Number(itemData.price) : 10,
      stock: itemData.stock !== undefined ? Number(itemData.stock) : 100,
      category: itemData.category || (isGeneral ? 'General Supplies' : 'General Therapeutics'),
      type: isGeneral ? 'GENERAL' : 'PHARMACY',
      showToDoctor: itemData.showToDoctor !== undefined ? Boolean(itemData.showToDoctor) : true,
      storageLocation: itemData.storageLocation || (isGeneral ? 'Shelf G-01' : 'Shelf B-08'),
      batchNumber: itemData.batchNumber || `BAT-${Date.now().toString().slice(-6)}`,
      expiryDate: itemData.expiryDate || '2028-12',
      isPrescriptionRequired: itemData.isPrescriptionRequired !== undefined ? Boolean(itemData.isPrescriptionRequired) : !isGeneral
    };
    const next = [...pharmacyFormulary, newItem];
    setPharmacyFormulary(next);
    broadcastUpdate({ pharmacyFormulary: next });
    logAuditEvent('FORMULARY_ITEM_ADDED', `New item added: ${newItem.name} (${newItem.type}) - ${newItem.storageLocation}`, 'SUCCESS');
    return newItem;
  }, [pharmacyFormulary, broadcastUpdate, logAuditEvent]);

  const updateFormularyItem = useCallback((itemId, updatedData) => {
    clinicAudio.triggerHaptic(15);
    const next = pharmacyFormulary.map((f) => {
      if (f.id === itemId) {
        return {
          ...f,
          ...updatedData,
          price: updatedData.price !== undefined ? Number(updatedData.price) : f.price,
          stock: updatedData.stock !== undefined ? Number(updatedData.stock) : f.stock
        };
      }
      return f;
    });
    setPharmacyFormulary(next);
    broadcastUpdate({ pharmacyFormulary: next });
  }, [pharmacyFormulary, broadcastUpdate]);

  const adjustFormularyStock = useCallback((itemId, delta) => {
    clinicAudio.triggerHaptic(10);
    const updated = pharmacyFormulary.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          stock: Math.max(0, (item.stock ?? 50) + Number(delta))
        };
      }
      return item;
    });
    setPharmacyFormulary(updated);
    broadcastUpdate({ pharmacyFormulary: updated });
    logAuditEvent('STOCK_ADJUSTED', `Stock updated for item ${itemId}: delta ${delta}`, 'INFO');
  }, [pharmacyFormulary, broadcastUpdate, logAuditEvent]);

  const deleteFormularyItem = useCallback((itemId) => {
    clinicAudio.triggerHaptic(20);
    const next = pharmacyFormulary.filter((f) => f.id !== itemId);
    setPharmacyFormulary(next);
    broadcastUpdate({ pharmacyFormulary: next });
  }, [pharmacyFormulary, broadcastUpdate]);

  // =========================================================================
  // 4. CHIEF SYMPTOMS & TRIAGE RULES CRUD
  // =========================================================================
  const addSymptom = useCallback((symptomData) => {
    clinicAudio.triggerHaptic(15);
    const newSym = {
      id: `sym-${Date.now()}`,
      label: symptomData.label || 'New Symptom / Chief Complaint',
      icon: symptomData.icon || '🩺',
      dept: symptomData.dept || 'General OPD',
      cabinId: Number(symptomData.cabinId) || 1,
      doctorName: symptomData.doctorName || 'Attending Physician',
      description: symptomData.description || 'Clinical observation and triage.'
    };
    const next = [...symptoms, newSym];
    setSymptoms(next);
    broadcastUpdate({ symptoms: next });
    return newSym;
  }, [symptoms, broadcastUpdate]);

  const updateSymptom = useCallback((symptomId, updatedData) => {
    clinicAudio.triggerHaptic(15);
    const next = symptoms.map((s) => {
      if (s.id === symptomId) {
        return { ...s, ...updatedData };
      }
      return s;
    });
    setSymptoms(next);
    broadcastUpdate({ symptoms: next });
  }, [symptoms, broadcastUpdate]);

  const deleteSymptom = useCallback((symptomId) => {
    clinicAudio.triggerHaptic(20);
    const next = symptoms.filter((s) => s.id !== symptomId);
    setSymptoms(next);
    broadcastUpdate({ symptoms: next });
  }, [symptoms, broadcastUpdate]);

  // =========================================================================
  // 5. APPOINTMENT TIME SLOTS CRUD
  // =========================================================================
  const addTimeSlot = useCallback((slotString) => {
    clinicAudio.triggerHaptic(15);
    const trimmed = slotString.trim();
    if (!trimmed || timeSlots.includes(trimmed)) return;
    const next = [...timeSlots, trimmed];
    setTimeSlots(next);
    broadcastUpdate({ timeSlots: next });
  }, [timeSlots, broadcastUpdate]);

  const deleteTimeSlot = useCallback((slotString) => {
    clinicAudio.triggerHaptic(15);
    const next = timeSlots.filter((s) => s !== slotString);
    setTimeSlots(next);
    broadcastUpdate({ timeSlots: next });
  }, [timeSlots, broadcastUpdate]);

  // =========================================================================
  // 6. ACTIVE QUEUE PATIENT CRUD
  // =========================================================================
  const updatePatient = useCallback((patientId, updatedData) => {
    clinicAudio.triggerHaptic(15);
    const next = patients.map((p) => {
      if (p.id === patientId || p.tokenNumber === patientId) {
        return {
          ...p,
          ...updatedData,
          age: updatedData.age !== undefined ? Number(updatedData.age) : p.age,
          cabinId: updatedData.cabinId !== undefined ? Number(updatedData.cabinId) : p.cabinId,
          vitals: updatedData.vitals !== undefined ? { ...p.vitals, ...updatedData.vitals } : p.vitals
        };
      }
      return p;
    });
    setPatients(next);
    broadcastUpdate({ patients: next });
  }, [patients, broadcastUpdate]);

  const deletePatient = useCallback((patientId) => {
    clinicAudio.triggerHaptic(20);
    const next = patients.filter((p) => p.id !== patientId && p.tokenNumber !== patientId);
    setPatients(next);
    broadcastUpdate({ patients: next });
  }, [patients, broadcastUpdate]);

  // =========================================================================
  // 7. INVOICES & BILLING CRUD
  // =========================================================================
  const updateInvoice = useCallback((invoiceId, updatedData) => {
    clinicAudio.triggerHaptic(15);
    const next = invoices.map((inv) => {
      if (inv.id === invoiceId || inv.invoiceNumber === invoiceId) {
        return {
          ...inv,
          ...updatedData,
          total: updatedData.total !== undefined ? Number(updatedData.total) : inv.total,
          discount: updatedData.discount !== undefined ? Number(updatedData.discount) : inv.discount,
          insuranceCoPay: updatedData.insuranceCoPay !== undefined ? Number(updatedData.insuranceCoPay) : inv.insuranceCoPay
        };
      }
      return inv;
    });
    setInvoices(next);
    broadcastUpdate({ invoices: next });
  }, [invoices, broadcastUpdate]);

  const deleteInvoice = useCallback((invoiceId) => {
    clinicAudio.triggerHaptic(20);
    const next = invoices.filter((inv) => inv.id !== invoiceId && inv.invoiceNumber !== invoiceId);
    setInvoices(next);
    broadcastUpdate({ invoices: next });
  }, [invoices, broadcastUpdate]);

  // =========================================================================
  // 8. RETURNING PATIENT HISTORY (EMR) CRUD
  // =========================================================================
  const addPatientHistory = useCallback((historyData) => {
    clinicAudio.triggerHaptic(15);
    const newRecord = {
      patientId: historyData.patientId || `PT-${Math.floor(80000 + Math.random() * 19999)}`,
      patientName: historyData.patientName || 'New Patient Profile',
      phone: historyData.phone || '',
      age: Number(historyData.age) || 35,
      gender: historyData.gender || 'Male',
      bloodGroup: historyData.bloodGroup || 'O+',
      allergies: Array.isArray(historyData.allergies) ? historyData.allergies : (historyData.allergies ? [historyData.allergies] : []),
      chronicConditions: Array.isArray(historyData.chronicConditions) ? historyData.chronicConditions : (historyData.chronicConditions ? [historyData.chronicConditions] : []),
      visits: historyData.visits || []
    };
    const next = [newRecord, ...patientHistoryList];
    setPatientHistoryList(next);
    broadcastUpdate({ patientHistoryList: next });
    return newRecord;
  }, [patientHistoryList, broadcastUpdate]);

  const updatePatientHistory = useCallback((patientId, updatedData) => {
    clinicAudio.triggerHaptic(15);
    const next = patientHistoryList.map((h) => {
      if (h.patientId === patientId || h.phone === patientId) {
        return { ...h, ...updatedData };
      }
      return h;
    });
    setPatientHistoryList(next);
    broadcastUpdate({ patientHistoryList: next });
  }, [patientHistoryList, broadcastUpdate]);

  const deletePatientHistory = useCallback((patientId) => {
    clinicAudio.triggerHaptic(20);
    const next = patientHistoryList.filter((h) => h.patientId !== patientId && h.phone !== patientId);
    setPatientHistoryList(next);
    broadcastUpdate({ patientHistoryList: next });
  }, [patientHistoryList, broadcastUpdate]);

  // =========================================================================
  // 9. FACILITY SETTINGS & DATA BACKUP CRUD
  // =========================================================================
  const updateClinicSettings = useCallback((newSettings) => {
    clinicAudio.triggerHaptic(15);
    setClinicSettings((prev) => {
      const next = { ...prev, ...newSettings };
      broadcastUpdate({ clinicSettings: next });
      return next;
    });
  }, [broadcastUpdate]);

  const updateHardwarePrinter = useCallback((slot, updates) => {
    clinicAudio.triggerHaptic(15);
    setClinicSettings((prev) => {
      const currentDevices = prev.printerSettings?.hardwareDevices || DEFAULT_SETTINGS.printerSettings.hardwareDevices;
      const updatedDevices = currentDevices.map((d) => (d.slot === slot ? { ...d, ...updates } : d));
      const next = {
        ...prev,
        printerSettings: {
          ...prev.printerSettings,
          hardwareDevices: updatedDevices
        }
      };
      broadcastUpdate({ clinicSettings: next });
      return next;
    });
  }, [broadcastUpdate]);

  const toggleHardwarePrinterStatus = useCallback((slot) => {
    clinicAudio.triggerHaptic(15);
    setClinicSettings((prev) => {
      const currentDevices = prev.printerSettings?.hardwareDevices || DEFAULT_SETTINGS.printerSettings.hardwareDevices;
      const updatedDevices = currentDevices.map((d) => {
        if (d.slot === slot) {
          const nextStatus = d.status === 'CONNECTED' ? 'NOT_ATTACHED' : 'CONNECTED';
          return { ...d, status: nextStatus };
        }
        return d;
      });
      const next = {
        ...prev,
        printerSettings: {
          ...prev.printerSettings,
          hardwareDevices: updatedDevices
        }
      };
      broadcastUpdate({ clinicSettings: next });
      return next;
    });
  }, [broadcastUpdate]);

  const exportAllDataJSON = useCallback(() => {
    clinicAudio.triggerHaptic(20);
    const payload = {
      exportedAt: new Date().toISOString(),
      version: '5.0',
      clinicSettings,
      emergencySettings,
      emergencyProcedures,
      cabins,
      services,
      pharmacyFormulary,
      symptoms,
      timeSlots,
      patients,
      invoices,
      pharmacyQueue,
      patientHistoryList
    };
    return JSON.stringify(payload, null, 2);
  }, [clinicSettings, emergencySettings, emergencyProcedures, cabins, services, pharmacyFormulary, symptoms, timeSlots, patients, invoices, pharmacyQueue, patientHistoryList]);

  const importAllDataJSON = useCallback((jsonString) => {
    clinicAudio.triggerHaptic(25);
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.cabins) setCabins(parsed.cabins);
      if (parsed.services) setServices(parsed.services);
      if (parsed.pharmacyFormulary) setPharmacyFormulary(parsed.pharmacyFormulary);
      if (parsed.symptoms) setSymptoms(parsed.symptoms);
      if (parsed.timeSlots) setTimeSlots(parsed.timeSlots);
      if (parsed.patients) setPatients(parsed.patients);
      if (parsed.invoices) setInvoices(parsed.invoices);
      if (parsed.pharmacyQueue) setPharmacyQueue(parsed.pharmacyQueue);
      if (parsed.patientHistoryList) setPatientHistoryList(parsed.patientHistoryList);
      if (parsed.clinicSettings) setClinicSettings(parsed.clinicSettings);
      if (parsed.emergencyProcedures) setEmergencyProcedures(parsed.emergencyProcedures);
      if (parsed.emergencySettings) setEmergencySettings(parsed.emergencySettings);

      broadcastUpdate(parsed);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [broadcastUpdate]);

  // Search previous patients using phone number or name
  const searchPatientHistoryByPhone = useCallback((query) => {
    if (!query) return [];
    const cleanQuery = query.toLowerCase().trim();

    const historyMatches = patientHistoryList.filter(
      (p) =>
        (p.phone && p.phone.toLowerCase().includes(cleanQuery)) ||
        (p.patientName && p.patientName.toLowerCase().includes(cleanQuery))
    );

    const currentMatches = patients
      .filter(
        (p) =>
          (p.phone && p.phone.toLowerCase().includes(cleanQuery)) ||
          (p.patientName && p.patientName.toLowerCase().includes(cleanQuery))
      )
      .map((p) => ({
        patientId: p.patientId || p.id,
        patientName: p.patientName,
        phone: p.phone,
        age: p.age,
        gender: p.gender,
        visits: [
          {
            visitId: `VST-${p.tokenNumber}`,
            visitDate: 'Today (Current Visit)',
            timestamp: p.createdAt || Date.now(),
            doctorName: p.doctorName,
            department: p.department,
            cabinId: p.cabinId,
            diagnosis: p.symptoms?.join(', ') || 'Outpatient Consultation',
            vitals: p.vitals,
            prescriptions: p.prescriptions || [],
            labOrders: (p.services || []).filter((s) => s.category !== 'Consultation'),
            clinicalNotes: p.clinicalNotes || 'Today visit'
          }
        ]
      }));

    const combined = [...historyMatches];
    currentMatches.forEach((cm) => {
      if (!combined.some((h) => h.phone === cm.phone && h.patientName === cm.patientName)) {
        combined.push(cm);
      }
    });

    return combined;
  }, [patientHistoryList, patients]);

  // Register New Patient with MANDATORY UPFRONT BILLING
  const registerPatient = useCallback((data, billingData = {}) => {
    clinicAudio.triggerHaptic(25);

    const existingTokens = patients.map((p) => {
      const match = p.tokenNumber.match(/C-(\d+)/);
      return match ? parseInt(match[1], 10) : 100;
    });
    const nextNum = (existingTokens.length > 0 ? Math.max(...existingTokens) : 100) + 1;
    const tokenNumber = `C-${nextNum}`;
    const patientId = data.patientId || `PT-${Math.floor(80000 + Math.random() * 19999)}`;

    const targetCabin = cabins.find((c) => c.cabinId === Number(data.cabinId)) || cabins[0];
    const initialServices = data.services && data.services.length > 0 ? data.services : [
      {
        id: `srv-c${targetCabin.cabinId}`,
        name: `Specialist Consultation (${targetCabin.department})`,
        price: targetCabin.consultationFee,
        category: 'Consultation',
        code: `CON-0${targetCabin.cabinId}`
      }
    ];

    const rawSubtotal = initialServices.reduce((acc, s) => acc + s.price, 0);
    const insuranceCoPay = Number(billingData.insuranceCoPay || 0);
    const discount = Number(billingData.discount || 0);
    const totalDeductions = insuranceCoPay + discount;
    const finalTotal = Math.max(0, Math.round((rawSubtotal - totalDeductions) * 100) / 100);

    const invoiceNumber = `APEX-${new Date().getFullYear()}-${tokenNumber.replace('C-', '')}-${Math.floor(100 + Math.random() * 900)}`;

    const vitals = data.vitals || {
      bp: `${Math.floor(115 + Math.random() * 20)}/${Math.floor(70 + Math.random() * 15)} mmHg`,
      pulse: `${Math.floor(68 + Math.random() * 18)} bpm`,
      spo2: `${Math.floor(97 + Math.random() * 3)}%`,
      temp: '98.6°F',
      weight: '70 kg'
    };

    const isPaid = (
      finalTotal === 0 ||
      billingData.paymentMethod === 'CARD' ||
      billingData.paymentMethod === 'ONLINE' ||
      billingData.paymentMethod === 'TOUCH_PAY_UPI' ||
      (billingData.paymentMethod === 'CASH' && Number(billingData.cashTendered || 0) >= finalTotal)
    );
    const isPayInCabin = !isPaid && (
      billingData.paymentLocation === 'DOCTOR_CABIN' ||
      (billingData.paymentMethod === 'CASH' && Number(billingData.cashTendered || 0) === 0)
    );
    const invoiceStatus = isPaid ? 'PAID_UPFRONT' : (isPayInCabin ? 'PAY_IN_CABIN' : 'PAYMENT_PENDING');
    const patientPaymentStatus = isPaid ? 'PAID' : (isPayInCabin ? 'PAY_IN_CABIN' : 'PENDING');
    const paymentLocation = isPayInCabin ? 'DOCTOR_CABIN' : (isPaid ? 'COUNTER' : 'CASHIER');

    const newInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      tokenNumber,
      patientId,
      patientName: data.patientName || 'Anonymous Patient',
      age: Number(data.age) || 35,
      gender: data.gender || 'Male',
      phone: data.phone || '',
      vitals,
      doctorName: targetCabin.doctorName,
      cabinId: targetCabin.cabinId,
      department: targetCabin.department,
      services: initialServices,
      medications: [],
      clinicalNotes: isPaid
        ? 'Initial consultation token issued. Upfront fee settled at check-in counter.'
        : isPayInCabin
          ? `Initial consultation token issued. Consultation fee of ${currencySymbol || 'Rs.'}${finalTotal} to be collected directly in Doctor's Cabin (${targetCabin.cabinName}).`
          : 'Initial consultation token issued. Consultation fee due at cashier counter.',
      subtotal: rawSubtotal,
      insuranceCoPay,
      discount,
      tax: 0,
      total: finalTotal,
      paymentMethod: billingData.paymentMethod || clinicSettings?.paymentSettings?.defaultMethod || 'CASH',
      paymentLocation,
      cashTendered: billingData.cashTendered !== undefined && billingData.cashTendered !== null ? Number(billingData.cashTendered) : (isPaid ? finalTotal : 0),
      changeDue: (billingData.cashTendered && Number(billingData.cashTendered) > finalTotal)
        ? Math.max(0, Number(billingData.cashTendered) - finalTotal)
        : 0,
      timestamp: Date.now(),
      status: invoiceStatus
    };

    const newPatient = {
      id: `pat-${Date.now()}`,
      tokenNumber,
      patientId,
      patientName: data.patientName || 'Anonymous Patient',
      age: Number(data.age) || 35,
      gender: data.gender || 'Male',
      phone: data.phone || '',
      symptoms: data.symptoms || [],
      vitals,
      cabinId: targetCabin.cabinId,
      doctorName: targetCabin.doctorName,
      department: targetCabin.department,
      services: initialServices,
      prescriptions: [],
      clinicalNotes: '',
      bookingType: data.bookingType || 'WALK_IN',
      timeSlot: data.timeSlot || null,
      status: 'WAITING',
      invoiceId: newInvoice.id,
      createdAt: Date.now(),
      totalFee: targetCabin.consultationFee,
      isPaid,
      paymentStatus: patientPaymentStatus,
      paymentLocation
    };

    const updatedPatients = [...patients, newPatient];
    const updatedInvoices = [newInvoice, ...invoices];

    setPatients(updatedPatients);
    setInvoices(updatedInvoices);

    broadcastUpdate({ patients: updatedPatients, invoices: updatedInvoices });

    return { patient: newPatient, invoice: newInvoice };
  }, [patients, cabins, invoices, clinicSettings, broadcastUpdate]);

  // Register Emergency / Minor Procedure Patient with PRIORITY QUEUE DISPATCH
  const registerEmergencyPatient = useCallback((data, selectedProcedureObjects = [], billingData = {}) => {
    clinicAudio.triggerHaptic(40);

    const existingEmgTokens = patients.map((p) => {
      const match = p.tokenNumber?.match(/EMG-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });
    const nextNum = (existingEmgTokens.length > 0 ? Math.max(...existingEmgTokens) : 0) + 1;
    const tokenNumber = `EMG-${nextNum.toString().padStart(2, '0')}`;
    const patientId = data.patientId || `EMG-PT-${Math.floor(10000 + Math.random() * 89999)}`;

    const preferredCabinId = Number(data.cabinId) || Number(emergencySettings?.defaultCabinId) || 1;
    const targetCabin = cabins.find((c) => c.cabinId === preferredCabinId) || cabins[0];

    // Compute procedure services
    const procedureServices = (selectedProcedureObjects.length > 0 ? selectedProcedureObjects : [
      emergencyProcedures[0] || EMERGENCY_PROCEDURES[0] // Default Wound Dressing & Bandage if none specified
    ]).map((proc) => ({
      id: `srv-emg-${proc.code}`,
      name: `Emergency Procedure: ${proc.name}`,
      price: proc.price,
      category: 'Emergency / Minor Procedure',
      code: proc.code,
      severity: proc.severity || 'URGENT',
      consumables: proc.consumables || []
    }));

    const rawSubtotal = procedureServices.reduce((acc, s) => acc + s.price, 0);
    const insuranceCoPay = Number(billingData.insuranceCoPay || 0);
    const discount = Number(billingData.discount || 0);
    const totalDeductions = insuranceCoPay + discount;
    const finalTotal = Math.max(0, Math.round((rawSubtotal - totalDeductions) * 100) / 100);

    const invoiceNumber = `APEX-EMG-${new Date().getFullYear()}-${tokenNumber.replace('EMG-', '')}-${Math.floor(100 + Math.random() * 900)}`;

    const vitals = data.vitals || {
      bp: data.bp || '120/80 mmHg',
      pulse: data.pulse || '88 bpm',
      spo2: data.spo2 || '98%',
      temp: data.temp || '98.6°F',
      weight: data.weight || '70 kg'
    };

    const isPaid = (
      finalTotal === 0 ||
      billingData.paymentMethod === 'CARD' ||
      billingData.paymentMethod === 'ONLINE' ||
      billingData.paymentMethod === 'TOUCH_PAY_UPI' ||
      (billingData.paymentMethod === 'CASH' && Number(billingData.cashTendered || 0) >= finalTotal)
    );
    const isPayInCabin = !isPaid && (
      billingData.paymentLocation === 'DOCTOR_CABIN' ||
      (billingData.paymentMethod === 'CASH' && Number(billingData.cashTendered || 0) === 0)
    );
    const invoiceStatus = isPaid ? 'PAID_UPFRONT' : (isPayInCabin ? 'PAY_IN_CABIN' : 'PAYMENT_PENDING');
    const patientPaymentStatus = isPaid ? 'PAID' : (isPayInCabin ? 'PAY_IN_CABIN' : 'PENDING');
    const paymentLocation = isPayInCabin ? 'DOCTOR_CABIN' : (isPaid ? 'COUNTER' : 'CASHIER');

    const newInvoice = {
      id: `inv-emg-${Date.now()}`,
      invoiceNumber,
      tokenNumber,
      patientId,
      patientName: data.patientName || 'Emergency Trauma Patient',
      age: Number(data.age) || 35,
      gender: data.gender || 'Unknown',
      phone: data.phone || '',
      vitals,
      doctorName: targetCabin.doctorName,
      cabinId: targetCabin.cabinId,
      department: targetCabin.department,
      services: procedureServices,
      medications: [],
      clinicalNotes: `Emergency fast-track admission for minor procedures: ${procedureServices.map((p) => p.name).join(', ')}.`,
      subtotal: rawSubtotal,
      insuranceCoPay,
      discount,
      tax: 0,
      total: finalTotal,
      paymentMethod: billingData.paymentMethod || 'CASH',
      cashTendered: Number(billingData.cashTendered || 0),
      currency: currencySymbol || 'Rs',
      status: invoiceStatus,
      paymentStatus: invoiceStatus,
      paymentLocation,
      isEmergency: true,
      createdAt: Date.now()
    };

    const newPatient = {
      id: patientId,
      tokenNumber,
      patientName: data.patientName || 'Emergency Trauma Patient',
      phone: data.phone || '',
      age: Number(data.age) || 35,
      gender: data.gender || 'Unknown',
      cabinId: targetCabin.cabinId,
      status: 'WAITING',
      priority: 'EMERGENCY',
      isEmergency: true,
      severity: data.severity || 'URGENT',
      emergencyProcedures: procedureServices,
      symptoms: data.symptoms || [procedureServices[0]?.name || 'Minor Emergency Procedure'],
      vitals,
      consultationFee: rawSubtotal,
      invoiceId: newInvoice.id,
      invoiceNumber,
      createdAt: Date.now(),
      totalFee: rawSubtotal,
      isPaid,
      paymentStatus: patientPaymentStatus,
      paymentLocation,
      minorProcedures: procedureServices.map((p) => ({
        id: `proc-rec-${Date.now()}-${p.code}`,
        code: p.code,
        name: p.name,
        category: p.category,
        price: p.price,
        site: data.procedureSite || 'Treatment Room',
        performedBy: targetCabin.doctorName,
        status: 'ORDERED',
        timestamp: Date.now()
      }))
    };

    // Emergency patients prepend to the VERY FRONT of the queue
    const updatedPatients = [newPatient, ...patients];
    const updatedInvoices = [newInvoice, ...invoices];

    setPatients(updatedPatients);
    setInvoices(updatedInvoices);

    if (emergencySettings?.soundAlertsEnabled !== false) {
      clinicAudio.playEmergencyChime();
    }
    if (emergencySettings?.voiceBroadcastEnabled !== false) {
      clinicAudio.announceEmergency(tokenNumber, targetCabin.cabinId, procedureServices[0]?.name);
    }

    broadcastUpdate({
      patients: updatedPatients,
      invoices: updatedInvoices,
      activeCallAlert: {
        tokenNumber,
        cabinId: targetCabin.cabinId,
        doctorName: targetCabin.doctorName,
        isEmergency: true,
        procedureName: procedureServices[0]?.name,
        timestamp: Date.now()
      }
    });

    logAuditEvent(
      'EMERGENCY_REGISTRATION',
      `Emergency patient ${tokenNumber} registered for ${procedureServices.map((p) => p.name).join(', ')}`,
      'WARNING'
    );

    return { patient: newPatient, invoice: newInvoice };
  }, [patients, cabins, invoices, currencySymbol, emergencySettings, emergencyProcedures, broadcastUpdate, logAuditEvent]);

  // Doctor/Nurse performs or records a Minor Procedure during consultation
  const recordMinorProcedure = useCallback((patientId, procedureData) => {
    clinicAudio.triggerHaptic(25);
    const targetPatient = patients.find((p) => p.id === patientId || p.tokenNumber === patientId);
    if (!targetPatient) return null;

    const newProc = {
      id: `proc-${Date.now()}`,
      code: procedureData.code,
      name: procedureData.name,
      category: procedureData.category,
      price: Number(procedureData.price) || 0,
      site: procedureData.site || 'Clinical Site',
      performedBy: procedureData.performedBy || 'Physician / Staff Nurse',
      consumablesUsed: procedureData.consumablesUsed || [],
      clinicalNotes: procedureData.clinicalNotes || '',
      status: 'COMPLETED',
      completedAt: Date.now()
    };

    const existingProcs = targetPatient.minorProcedures || [];
    const updatedProcs = [...existingProcs, newProc];

    const updatedPatients = patients.map((p) =>
      p.id === targetPatient.id || p.tokenNumber === targetPatient.tokenNumber
        ? { ...p, minorProcedures: updatedProcs }
        : p
    );
    setPatients(updatedPatients);

    // Automatically append minor procedure item and fee to the patient's billing invoice
    const updatedInvoices = invoices.map((inv) => {
      if (inv.id === targetPatient.invoiceId || inv.tokenNumber === targetPatient.tokenNumber || inv.patientId === targetPatient.id) {
        const procServiceItem = {
          id: `srv-${newProc.id}`,
          code: newProc.code,
          name: `Procedure: ${newProc.name} (${newProc.site})`,
          price: newProc.price,
          category: 'Minor Procedure',
          performedBy: newProc.performedBy,
          consumables: newProc.consumablesUsed
        };
        const nextServices = [...(inv.services || []), procServiceItem];
        const nextSubtotal = nextServices.reduce((acc, s) => acc + (Number(s.price) || 0), 0);
        const nextTotal = Math.max(0, nextSubtotal - (Number(inv.discount || 0) + Number(inv.insuranceCoPay || 0)));
        return {
          ...inv,
          services: nextServices,
          subtotal: nextSubtotal,
          total: nextTotal
        };
      }
      return inv;
    });
    setInvoices(updatedInvoices);

    broadcastUpdate({ patients: updatedPatients, invoices: updatedInvoices });
    logAuditEvent(
      'MINOR_PROCEDURE_LOGGED',
      `Minor procedure ${newProc.name} performed for patient ${targetPatient.tokenNumber} by ${newProc.performedBy}`,
      'INFO'
    );

    return { patient: { ...targetPatient, minorProcedures: updatedProcs }, procedure: newProc };
  }, [patients, invoices, broadcastUpdate, logAuditEvent]);

  // Emergency Workflow Customization & Minor Procedure Management
  const addEmergencyProcedure = useCallback((procData) => {
    clinicAudio.triggerHaptic(20);
    const newProc = {
      id: `emg-proc-${Date.now()}`,
      code: (procData.code || `EMG-PRC-${Math.floor(100 + Math.random() * 900)}`).toUpperCase().trim(),
      name: procData.name || 'New Minor Procedure',
      category: procData.category || 'Emergency Procedures',
      price: Number(procData.price) || 500,
      durationMinutes: Number(procData.durationMinutes) || 15,
      description: procData.description || '',
      severity: procData.severity || 'URGENT',
      icon: procData.icon || 'Activity',
      consumables: Array.isArray(procData.consumables)
        ? procData.consumables
        : (procData.consumables || '').split(',').map((s) => s.trim()).filter(Boolean),
      cabinId: Number(procData.cabinId) || 1,
      active: procData.active !== undefined ? procData.active : true,
      createdAt: Date.now()
    };
    setEmergencyProcedures((prev) => {
      const next = [...prev, newProc];
      broadcastUpdate({ emergencyProcedures: next });
      return next;
    });
    logAuditEvent('EMERGENCY_PROCEDURE_ADDED', `Added emergency procedure: ${newProc.name} (${newProc.code})`, 'SUCCESS');
    return newProc;
  }, [broadcastUpdate, logAuditEvent]);

  const updateEmergencyProcedure = useCallback((procIdOrCode, updates) => {
    clinicAudio.triggerHaptic(15);
    setEmergencyProcedures((prev) => {
      const next = prev.map((p) => {
        if (p.id === procIdOrCode || p.code === procIdOrCode) {
          return {
            ...p,
            ...updates,
            price: updates.price !== undefined ? Number(updates.price) : p.price,
            durationMinutes: updates.durationMinutes !== undefined ? Number(updates.durationMinutes) : p.durationMinutes,
            consumables: updates.consumables !== undefined
              ? (Array.isArray(updates.consumables) ? updates.consumables : String(updates.consumables).split(',').map((s) => s.trim()).filter(Boolean))
              : p.consumables
          };
        }
        return p;
      });
      broadcastUpdate({ emergencyProcedures: next });
      return next;
    });
    logAuditEvent('EMERGENCY_PROCEDURE_UPDATED', `Updated emergency procedure: ${procIdOrCode}`, 'INFO');
  }, [broadcastUpdate, logAuditEvent]);

  const deleteEmergencyProcedure = useCallback((procIdOrCode) => {
    clinicAudio.triggerHaptic(20);
    setEmergencyProcedures((prev) => {
      const next = prev.filter((p) => p.id !== procIdOrCode && p.code !== procIdOrCode);
      broadcastUpdate({ emergencyProcedures: next });
      return next;
    });
    logAuditEvent('EMERGENCY_PROCEDURE_DELETED', `Deleted emergency procedure: ${procIdOrCode}`, 'WARNING');
  }, [broadcastUpdate, logAuditEvent]);

  const toggleEmergencyProcedureStatus = useCallback((procIdOrCode) => {
    clinicAudio.triggerHaptic(15);
    setEmergencyProcedures((prev) => {
      const next = prev.map((p) => {
        if (p.id === procIdOrCode || p.code === procIdOrCode) {
          const nextActive = p.active !== undefined ? !p.active : false;
          return { ...p, active: nextActive };
        }
        return p;
      });
      broadcastUpdate({ emergencyProcedures: next });
      return next;
    });
  }, [broadcastUpdate]);

  const updateEmergencySettings = useCallback((updates) => {
    clinicAudio.triggerHaptic(15);
    setEmergencySettings((prev) => {
      const next = { ...prev, ...updates };
      broadcastUpdate({ emergencySettings: next });
      return next;
    });
    logAuditEvent('EMERGENCY_SETTINGS_UPDATED', 'Emergency workflow operational settings updated', 'INFO');
  }, [broadcastUpdate, logAuditEvent]);

  const addEmergencyKit = useCallback((kitData) => {
    clinicAudio.triggerHaptic(20);
    const newKit = {
      id: `kit-${Date.now()}`,
      name: kitData.name || 'Emergency Kit Pack',
      code: (kitData.code || `KIT-${Math.floor(100 + Math.random() * 900)}`).toUpperCase().trim(),
      price: Number(kitData.price) || 1000,
      targetRoom: kitData.targetRoom || 'Cabin 1 - Treatment Room',
      items: Array.isArray(kitData.items)
        ? kitData.items
        : (kitData.items || '').split(',').map((s) => s.trim()).filter(Boolean)
    };
    setEmergencySettings((prev) => {
      const next = {
        ...prev,
        emergencyKits: [...(prev.emergencyKits || []), newKit]
      };
      broadcastUpdate({ emergencySettings: next });
      return next;
    });
    logAuditEvent('EMERGENCY_KIT_ADDED', `Added emergency kit: ${newKit.name}`, 'SUCCESS');
    return newKit;
  }, [broadcastUpdate, logAuditEvent]);

  const updateEmergencyKit = useCallback((kitId, updates) => {
    clinicAudio.triggerHaptic(15);
    setEmergencySettings((prev) => {
      const nextKits = (prev.emergencyKits || []).map((k) => (k.id === kitId ? { ...k, ...updates } : k));
      const next = { ...prev, emergencyKits: nextKits };
      broadcastUpdate({ emergencySettings: next });
      return next;
    });
  }, [broadcastUpdate]);

  const deleteEmergencyKit = useCallback((kitId) => {
    clinicAudio.triggerHaptic(20);
    setEmergencySettings((prev) => {
      const nextKits = (prev.emergencyKits || []).filter((k) => k.id !== kitId);
      const next = { ...prev, emergencyKits: nextKits };
      broadcastUpdate({ emergencySettings: next });
      return next;
    });
  }, [broadcastUpdate]);

  // Book a Future Appointment (No Vitals or Payment yet - generates appointment slip)
  const bookAppointment = useCallback((appointmentData) => {
    clinicAudio.triggerHaptic(25);
    const existingNums = appointments.map((a) => {
      const m = a.appointmentNumber?.match(/APT-(\d+)/);
      return m ? parseInt(m[1], 10) : 800;
    });
    const nextNum = (existingNums.length > 0 ? Math.max(...existingNums) : 800) + 1;
    const appointmentNumber = `APT-${nextNum}`;
    const targetCabin = cabins.find((c) => c.cabinId === Number(appointmentData.cabinId)) || cabins[0];

    const newAppointment = {
      id: `apt-${Date.now()}`,
      appointmentNumber,
      patientName: appointmentData.patientName || 'Anonymous Patient',
      phone: appointmentData.phone || '',
      age: Number(appointmentData.age) || 30,
      gender: appointmentData.gender || 'Male',
      symptoms: appointmentData.symptoms || [],
      cabinId: targetCabin.cabinId,
      doctorName: targetCabin.doctorName,
      department: targetCabin.department,
      date: appointmentData.date || 'Today',
      timeSlot: appointmentData.timeSlot || '08:30 PM',
      status: 'SCHEDULED',
      createdAt: Date.now()
    };

    const updated = [newAppointment, ...appointments];
    setAppointments(updated);
    broadcastUpdate({ appointments: updated });
    return { appointment: newAppointment };
  }, [appointments, cabins, broadcastUpdate]);

  // Check-In an Appointment on Arrival (with Vitals & Billing -> issues Live Queue Token)
  const checkInAppointment = useCallback((appointmentId, vitals, billingData = {}) => {
    clinicAudio.triggerHaptic(30);
    const targetApt = appointments.find((a) => a.id === appointmentId || a.appointmentNumber === appointmentId);
    if (!targetApt) return null;

    // 1. Mark Appointment as CHECKED_IN
    const updatedApts = appointments.map((a) =>
      a.id === targetApt.id ? { ...a, status: 'CHECKED_IN', checkedInAt: Date.now() } : a
    );
    setAppointments(updatedApts);

    // 2. Register Patient with Upfront Token and Invoice
    const result = registerPatient(
      {
        patientName: targetApt.patientName,
        phone: targetApt.phone,
        age: targetApt.age,
        gender: targetApt.gender,
        symptoms: targetApt.symptoms,
        cabinId: targetApt.cabinId,
        bookingType: 'APPOINTMENT',
        timeSlot: targetApt.timeSlot,
        vitals
      },
      billingData
    );

    broadcastUpdate({ appointments: updatedApts });
    return { ...result, appointment: targetApt };
  }, [appointments, registerPatient, broadcastUpdate]);

  // Cancel Appointment
  const cancelAppointment = useCallback((appointmentId, reason = 'Cancelled by Patient') => {
    clinicAudio.triggerHaptic(20);
    const updatedApts = appointments.map((a) =>
      (a.id === appointmentId || a.appointmentNumber === appointmentId)
        ? { ...a, status: 'CANCELLED', cancelReason: reason, cancelledAt: Date.now() }
        : a
    );
    setAppointments(updatedApts);
    broadcastUpdate({ appointments: updatedApts });
    logAuditEvent('APPOINTMENT_CANCELLED', `Appointment ${appointmentId} cancelled: ${reason}`, 'INFO');
  }, [appointments, broadcastUpdate, logAuditEvent]);

  // Reschedule Appointment
  const rescheduleAppointment = useCallback((appointmentId, newDate, newTimeSlot) => {
    clinicAudio.triggerHaptic(20);
    const updatedApts = appointments.map((a) =>
      (a.id === appointmentId || a.appointmentNumber === appointmentId)
        ? { ...a, date: newDate || a.date, timeSlot: newTimeSlot || a.timeSlot, status: 'SCHEDULED', rescheduledAt: Date.now() }
        : a
    );
    setAppointments(updatedApts);
    broadcastUpdate({ appointments: updatedApts });
    logAuditEvent('APPOINTMENT_RESCHEDULED', `Appointment ${appointmentId} rescheduled to ${newDate} ${newTimeSlot}`, 'INFO');
  }, [appointments, broadcastUpdate, logAuditEvent]);

  // Mark Appointment as No-Show
  const markAppointmentNoShow = useCallback((appointmentId) => {
    clinicAudio.triggerHaptic(20);
    const updatedApts = appointments.map((a) =>
      (a.id === appointmentId || a.appointmentNumber === appointmentId)
        ? { ...a, status: 'NO_SHOW', noShowAt: Date.now() }
        : a
    );
    setAppointments(updatedApts);
    broadcastUpdate({ appointments: updatedApts });
    logAuditEvent('APPOINTMENT_NO_SHOW', `Appointment ${appointmentId} marked as No-Show`, 'WARNING');
  }, [appointments, broadcastUpdate, logAuditEvent]);

  // Search appointments by phone, reference, patient name, or doctor (returns all reconciled appointments when query is empty)
  const searchAppointment = useCallback((query) => {
    const list = appointments.map((a) => {
      const targetCabin = cabins.find((c) => c.cabinId === a.cabinId) || cabins[0];
      return {
        ...a,
        doctorName: formatDoctorName ? formatDoctorName(targetCabin?.doctorName || a.doctorName) : (targetCabin?.doctorName || a.doctorName),
        department: targetCabin?.department || a.department
      };
    });
    if (!query || !query.trim()) return list;
    const q = query.toLowerCase().trim();
    return list.filter(
      (a) =>
        (a.phone && a.phone.toLowerCase().includes(q)) ||
        (a.appointmentNumber && a.appointmentNumber.toLowerCase().includes(q)) ||
        (a.patientName && a.patientName.toLowerCase().includes(q)) ||
        (a.doctorName && a.doctorName.toLowerCase().includes(q)) ||
        (a.department && a.department.toLowerCase().includes(q))
    );
  }, [appointments, cabins, formatDoctorName]);

  // Doctor calls patient to cabin
  const callPatientToCabin = useCallback((patientId, cabinId) => {
    clinicAudio.triggerHaptic(20);
    const targetCabin = cabins.find((c) => c.cabinId === cabinId);
    let targetPatient = null;

    const updatedPatients = patients.map((p) => {
      if (p.id === patientId || p.tokenNumber === patientId) {
        targetPatient = p;
        return {
          ...p,
          status: 'CALLED',
          calledAt: Date.now(),
          cabinId
        };
      }
      return p;
    });

    const updatedCabins = cabins.map((c) => {
      if (c.cabinId === cabinId) {
        return {
          ...c,
          status: 'IN_CONSULTATION',
          currentPatientToken: targetPatient ? targetPatient.tokenNumber : c.currentPatientToken
        };
      }
      return c;
    });

    setPatients(updatedPatients);
    setCabins(updatedCabins);

    if (targetPatient && targetCabin) {
      const payload = {
        tokenNumber: targetPatient.tokenNumber,
        cabinId,
        doctorName: targetCabin.doctorName
      };
      setLatestAnnouncement(payload);
      clinicAudio.announcePatient(targetPatient.tokenNumber, cabinId, targetCabin.doctorName);
      if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'ANNOUNCEMENT', payload });
      }
    }

    broadcastUpdate({ patients: updatedPatients, cabins: updatedCabins });
  }, [patients, cabins, broadcastChannel, broadcastUpdate]);

  // Doctor checks in patient & starts consultation
  const startConsultation = useCallback((patientId, cabinId) => {
    clinicAudio.triggerHaptic(20);
    let targetPatient = null;
    const updatedPatients = patients.map((p) => {
      if (p.id === patientId || p.tokenNumber === patientId) {
        targetPatient = p;
        return {
          ...p,
          status: 'IN_CONSULTATION',
          cabinId: cabinId !== undefined ? cabinId : p.cabinId,
          consultationStartTime: Date.now()
        };
      }
      return p;
    });

    const targetCabinId = cabinId !== undefined ? cabinId : targetPatient?.cabinId;
    const updatedCabins = cabins.map((c) => {
      if (c.cabinId === targetCabinId) {
        return {
          ...c,
          status: 'IN_CONSULTATION',
          currentPatientToken: targetPatient ? targetPatient.tokenNumber : c.currentPatientToken
        };
      }
      return c;
    });

    setPatients(updatedPatients);
    setCabins(updatedCabins);
    broadcastUpdate({ patients: updatedPatients, cabins: updatedCabins });
  }, [patients, cabins, broadcastUpdate]);

  // Doctor updates consultation notes, lab orders, prescriptions, or vitals
  const updateConsultationData = useCallback((patientId, { prescriptions, labOrders, clinicalNotes, vitals }) => {
    clinicAudio.triggerHaptic(10);
    const targetPatient = patients.find((p) => p.id === patientId || p.tokenNumber === patientId);
    const targetCabin = cabins.find((c) => c.cabinId === targetPatient?.cabinId);
    const consultFee = targetPatient?.consultationFee || targetPatient?.totalFee || targetCabin?.consultationFee || 60;

    const updatedPatients = patients.map((p) => {
      if (p.id === patientId || p.tokenNumber === patientId) {
        const consultService = (p.services || []).filter((s) => s.category === 'Consultation');
        const nextServices = labOrders ? [...consultService, ...labOrders] : p.services;

        return {
          ...p,
          prescriptions: prescriptions !== undefined ? prescriptions : p.prescriptions,
          services: nextServices,
          clinicalNotes: clinicalNotes !== undefined ? clinicalNotes : p.clinicalNotes,
          vitals: vitals !== undefined ? { ...p.vitals, ...vitals } : p.vitals,
          totalFee: consultFee,
          consultationFee: consultFee
        };
      }
      return p;
    });

    setPatients(updatedPatients);
    broadcastUpdate({ patients: updatedPatients });
  }, [patients, cabins, broadcastUpdate]);

  // Clone past visit prescription into today's consultation
  const repeatPreviousPrescription = useCallback((patientId, pastVisitOrMeds) => {
    if (!pastVisitOrMeds) return;
    const pastMeds = Array.isArray(pastVisitOrMeds) ? pastVisitOrMeds : (pastVisitOrMeds.prescriptions || []);
    if (!pastMeds || pastMeds.length === 0) return;
    clinicAudio.triggerHaptic(25);

    const cloned = pastMeds.map((rx) => ({
      ...rx,
      id: `rx-repeat-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    }));

    const visitDate = !Array.isArray(pastVisitOrMeds) && pastVisitOrMeds.visitDate ? pastVisitOrMeds.visitDate : 'past visit';
    const diagnosis = !Array.isArray(pastVisitOrMeds) && pastVisitOrMeds.diagnosis ? pastVisitOrMeds.diagnosis : 'Maintenance';

    updateConsultationData(patientId, {
      prescriptions: cloned,
      clinicalNotes: `Repeated previous regimen from ${visitDate} (${diagnosis}).`
    });
  }, [updateConsultationData]);

  // Doctor completes consultation & routes Rx to Pharmacy Desk
  const completeConsultation = useCallback((patientId) => {
    clinicAudio.triggerHaptic(30);

    const targetPatient = patients.find((p) => p.id === patientId || p.tokenNumber === patientId);
    if (!targetPatient) return;

    const hasMeds = targetPatient.prescriptions && targetPatient.prescriptions.length > 0;
    const nextStatus = hasMeds ? 'BILLING_PENDING' : 'COMPLETED';

    const updatedPatients = patients.map((p) => {
      if (p.id === patientId || p.tokenNumber === patientId) {
        return {
          ...p,
          status: nextStatus,
          consultationEndTime: Date.now()
        };
      }
      return p;
    });

    const updatedCabins = cabins.map((c) => {
      if (c.cabinId === targetPatient.cabinId) {
        return {
          ...c,
          status: 'AVAILABLE',
          currentPatientToken: null
        };
      }
      return c;
    });

    let updatedPharmacyQueue = pharmacyQueue;
    if (hasMeds) {
      const enrichedPrescriptions = (targetPatient.prescriptions || []).map((rx) => {
        const formularyMatch = (pharmacyFormulary || []).find(
          (f) => f.id === rx.id || f.name?.toLowerCase() === rx.name?.toLowerCase()
        );
        return {
          ...rx,
          storageLocation: rx.storageLocation || formularyMatch?.storageLocation || (rx.type === 'GENERAL' ? 'Shelf G-01' : rx.category === 'Dermatology' ? 'Shelf D-02' : rx.category === 'Cardiovascular' ? 'Shelf A-04' : 'Shelf B-08')
        };
      });

      const rxOrder = {
        id: `rx-q-${Date.now()}`,
        tokenNumber: targetPatient.tokenNumber,
        patientId: targetPatient.patientId || targetPatient.id,
        patientName: targetPatient.patientName,
        age: targetPatient.age,
        gender: targetPatient.gender,
        phone: targetPatient.phone,
        doctorName: targetPatient.doctorName,
        cabinId: targetPatient.cabinId,
        department: targetPatient.department,
        items: enrichedPrescriptions,
        medications: enrichedPrescriptions,
        totalDue: enrichedPrescriptions.reduce((acc, m) => acc + (m.price || 0), 0),
        totalAmount: enrichedPrescriptions.reduce((acc, m) => acc + (m.price || 0), 0),
        doctorNotes: targetPatient.clinicalNotes || '',
        status: 'QUEUED',
        timestamp: Date.now()
      };
      updatedPharmacyQueue = [rxOrder, ...pharmacyQueue];
      setPharmacyQueue(updatedPharmacyQueue);
    }

    setPatients(updatedPatients);
    setCabins(updatedCabins);

    broadcastUpdate({
      patients: updatedPatients,
      cabins: updatedCabins,
      pharmacyQueue: updatedPharmacyQueue
    });
  }, [patients, cabins, pharmacyQueue, pharmacyFormulary, broadcastUpdate]);

  // Return token when patient doesn't show or cancels
  const returnToken = useCallback((patientId, reason = 'Patient No-Show') => {
    clinicAudio.triggerHaptic(20);
    let targetCabinId = null;

    const updatedPatients = patients.map((p) => {
      if (p.id === patientId || p.tokenNumber === patientId) {
        targetCabinId = p.cabinId;
        return {
          ...p,
          status: 'TOKEN_RETURNED',
          returnReason: reason,
          returnedAt: Date.now()
        };
      }
      return p;
    });

    const updatedCabins = cabins.map((c) => {
      if (c.cabinId === targetCabinId) {
        return {
          ...c,
          status: 'AVAILABLE',
          currentPatientToken: null
        };
      }
      return c;
    });

    const updatedInvoices = invoices.map((inv) => {
      const match = updatedPatients.find((p) => p.invoiceId === inv.id || p.tokenNumber === inv.tokenNumber);
      if (match && (match.id === patientId || match.tokenNumber === patientId)) {
        return {
          ...inv,
          status: 'REFUND_DUE',
          refundReason: reason
        };
      }
      return inv;
    });

    setPatients(updatedPatients);
    setCabins(updatedCabins);
    setInvoices(updatedInvoices);

    broadcastUpdate({
      patients: updatedPatients,
      cabins: updatedCabins,
      invoices: updatedInvoices
    });
  }, [patients, cabins, invoices, broadcastUpdate]);

  // Pharmacist dispenses medications against prescription (Supports pure Rx & Purchase with price)
  const dispensePharmacyPrescription = useCallback((orderIdOrToken, options = {}) => {
    clinicAudio.triggerHaptic(25);

    const targetOrder = pharmacyQueue.find((item) => item.id === orderIdOrToken || item.tokenNumber === orderIdOrToken);
    if (targetOrder) {
      const patient = patients.find((p) => p.tokenNumber === targetOrder.tokenNumber || p.id === targetOrder.patientId);
      if (patient?.status === 'IN_CONSULTATION' || patient?.status === 'CALLED') {
        console.warn(`[Pharmacy] Dispense blocked for ${targetOrder.tokenNumber}: Patient is actively consulting in Cabin ${patient.cabinId}`);
        return { success: false, error: 'Patient is actively consulting in doctor cabin.' };
      }
    }

    const opts = typeof options === 'string' ? { pharmacistNotes: options } : (options || {});
    const notes = (opts.pharmacistNotes || '').trim();
    const isPurchase = opts.mode === 'PURCHASE_RECEIPT' || Boolean(opts.paymentMethod) || Boolean(opts.billingMode);
    const prescribedItems = targetOrder?.medications || targetOrder?.items || [];

    // 1. Deduct stock for all dispensed items from formulary
    let updatedFormulary = pharmacyFormulary;
    if (prescribedItems.length > 0) {
      updatedFormulary = pharmacyFormulary.map((fItem) => {
        const match = prescribedItems.find((pi) => pi.id === fItem.id || pi.name === fItem.name);
        if (match) {
          const qty = Number(match.quantity) || 1;
          return {
            ...fItem,
            stock: Math.max(0, (fItem.stock ?? 50) - qty)
          };
        }
        return fItem;
      });
      setPharmacyFormulary(updatedFormulary);
    }

    // 2. Update pharmacy queue item
    let updatedTargetOrder = null;
    const updatedQueue = pharmacyQueue.map((item) => {
      if (item.id === orderIdOrToken || item.tokenNumber === orderIdOrToken) {
        updatedTargetOrder = {
          ...item,
          status: 'DISPENSED',
          dispenseMode: isPurchase ? 'PURCHASE_RECEIPT' : 'PRESCRIPTION_ONLY',
          pharmacistNotes: notes,
          paymentMethod: isPurchase ? (opts.paymentMethod || 'CASH') : 'PRESCRIPTION_ONLY',
          dispensedAt: Date.now()
        };
        return updatedTargetOrder;
      }
      return item;
    });

    let updatedInvoices = invoices;
    let updatedPatients = patients;
    let generatedInvoice = null;

    // 3. If purchased with price, settle/create pharmacy invoice & mark patient paid
    if (isPurchase && targetOrder) {
      const payMethod = opts.paymentMethod || 'CASH';
      const discount = Number(opts.discount || 0);
      const medTotal = prescribedItems.reduce(
        (acc, m) => acc + (Number(m.price || 0) * (Number(m.quantity) || 1)),
        0
      );
      const finalTotal = Math.max(0, medTotal - discount);

      generatedInvoice = {
        id: `inv-rx-${Date.now()}`,
        invoiceNumber: `APEX-RX-${targetOrder.tokenNumber.replace('C-', '')}-${Math.floor(100 + Math.random() * 900)}`,
        tokenNumber: targetOrder.tokenNumber,
        patientId: targetOrder.patientId,
        patientName: targetOrder.patientName,
        age: targetOrder.age,
        gender: targetOrder.gender,
        phone: targetOrder.phone,
        doctorName: targetOrder.doctorName,
        cabinId: targetOrder.cabinId,
        department: targetOrder.department,
        services: [
          {
            id: `srv-rx-${Date.now()}`,
            name: 'Prescription Medication Dispensation & Pharmacy Pack',
            price: medTotal,
            category: 'Pharmacy',
            code: 'RX-DISP'
          }
        ],
        medications: prescribedItems,
        clinicalNotes: `Dispensed at In-House Pharmacy. [Pharmacist Notes: ${notes || 'Dispensed as prescribed'}]`,
        subtotal: medTotal,
        discount,
        total: finalTotal,
        paymentMethod: payMethod,
        cashTendered: payMethod === 'CASH' ? Number(opts.cashTendered || finalTotal) : null,
        changeDue: payMethod === 'CASH' && opts.cashTendered ? Math.max(0, Number(opts.cashTendered) - finalTotal) : 0,
        timestamp: Date.now(),
        status: 'SETTLED',
        isPaid: true,
        settledAt: Date.now()
      };

      updatedInvoices = [generatedInvoice, ...invoices];

      updatedPatients = patients.map((p) => {
        if (p.tokenNumber === targetOrder.tokenNumber || p.id === targetOrder.patientId) {
          return {
            ...p,
            isPaid: true,
            paymentStatus: 'PAID'
          };
        }
        return p;
      });

      setInvoices(updatedInvoices);
      setPatients(updatedPatients);
    }

    setPharmacyQueue(updatedQueue);

    broadcastUpdate({
      pharmacyQueue: updatedQueue,
      pharmacyFormulary: updatedFormulary,
      invoices: updatedInvoices,
      patients: updatedPatients
    });

    logAuditEvent(
      isPurchase ? 'PHARMACY_DISPENSE_PAID' : 'PHARMACY_DISPENSE_RX',
      `Prescription ${targetOrder?.tokenNumber} dispensed (${isPurchase ? 'Paid Purchase' : 'Prescription Only'})`,
      'SUCCESS'
    );

    return {
      success: true,
      order: updatedTargetOrder,
      invoice: generatedInvoice
    };
  }, [pharmacyQueue, patients, pharmacyFormulary, invoices, broadcastUpdate, logAuditEvent]);

  // Direct Over-The-Counter (OTC) Pharmacy Sale
  const sellPharmacyDirectOTC = useCallback((saleData) => {
    clinicAudio.triggerHaptic(30);
    const items = saleData.items || [];
    const subtotal = items.reduce(
      (acc, it) => acc + (Number(it.price || 0) * Number(it.quantity || 1)),
      0
    );
    const discount = Number(saleData.discount || 0);
    const finalTotal = Math.max(0, subtotal - discount);
    const payMethod = saleData.paymentMethod || 'CASH';

    // 1. Deduct stock for all items
    const updatedFormulary = pharmacyFormulary.map((fItem) => {
      const sold = items.find((it) => it.id === fItem.id || it.name === fItem.name);
      if (sold) {
        return {
          ...fItem,
          stock: Math.max(0, (fItem.stock ?? 50) - (Number(sold.quantity) || 1))
        };
      }
      return fItem;
    });

    // 2. Generate settled invoice
    const newInvoice = {
      id: `inv-otc-${Date.now()}`,
      invoiceNumber: `APEX-OTC-${Math.floor(1000 + Math.random() * 9000)}`,
      tokenNumber: 'OTC-WALKIN',
      patientId: `OTC-${Date.now().toString().slice(-6)}`,
      patientName: saleData.customerName || 'Walk-in OTC Customer',
      phone: saleData.phone || '',
      age: saleData.age || '-',
      gender: saleData.gender || 'Other',
      doctorName: 'Direct Pharmacy OTC Counter',
      department: 'Pharmacy Retail',
      services: [
        {
          id: `srv-otc-${Date.now()}`,
          name: 'Direct Over-The-Counter (OTC) Pharmacy Sale',
          price: subtotal,
          category: 'Pharmacy',
          code: 'OTC-RETAIL'
        }
      ],
      medications: items.map((it) => ({
        id: it.id,
        name: it.name,
        dosage: it.dosage || 'As directed on package',
        instructions: it.instructions || 'OTC Retail Purchase',
        storageLocation: it.storageLocation,
        price: it.price,
        quantity: it.quantity || 1
      })),
      clinicalNotes: `OTC Walk-in Sale. Dispensed by ${clinicSettings?.pharmacySettings?.headPharmacist || 'Pharmacist'}.`,
      subtotal,
      discount,
      total: finalTotal,
      paymentMethod: payMethod,
      cashTendered: payMethod === 'CASH' ? Number(saleData.cashTendered || finalTotal) : null,
      changeDue: payMethod === 'CASH' && saleData.cashTendered ? Math.max(0, Number(saleData.cashTendered) - finalTotal) : 0,
      timestamp: Date.now(),
      status: 'SETTLED',
      isPaid: true
    };

    setPharmacyFormulary(updatedFormulary);
    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);

    broadcastUpdate({
      pharmacyFormulary: updatedFormulary,
      invoices: updatedInvoices
    });

    logAuditEvent(
      'PHARMACY_OTC_SALE',
      `OTC Sale completed: ${newInvoice.invoiceNumber} (${currencySymbol} ${finalTotal})`,
      'SUCCESS'
    );
    return newInvoice;
  }, [pharmacyFormulary, invoices, clinicSettings, currencySymbol, broadcastUpdate, logAuditEvent]);

  // Update Pharmacy Operational Settings
  const updatePharmacySettings = useCallback((updates) => {
    clinicAudio.triggerHaptic(15);
    setClinicSettings((prev) => {
      const next = {
        ...prev,
        pharmacySettings: {
          ...(prev.pharmacySettings || DEFAULT_SETTINGS.pharmacySettings),
          ...updates
        }
      };
      broadcastUpdate({ clinicSettings: next });
      return next;
    });
    logAuditEvent('PHARMACY_SETTINGS_UPDATED', `Pharmacy settings updated: ${Object.keys(updates).join(', ')}`, 'INFO');
  }, [broadcastUpdate, logAuditEvent]);

  // Settle invoice at cashier counter
  const settleInvoice = useCallback((invoiceId, paymentMethod = 'CASH', billingData = {}) => {
    clinicAudio.triggerHaptic(25);
    let targetInv = null;
    const updatedInvoices = invoices.map((inv) => {
      if (inv.id === invoiceId || inv.invoiceNumber === invoiceId || inv.tokenNumber === invoiceId) {
        targetInv = {
          ...inv,
          status: 'SETTLED',
          paymentMethod: paymentMethod || inv.paymentMethod,
          cashTendered: billingData.cashTendered !== undefined ? Number(billingData.cashTendered) : inv.total,
          changeDue: billingData.changeDue !== undefined ? Number(billingData.changeDue) : 0,
          settledAt: Date.now()
        };
        return targetInv;
      }
      return inv;
    });

    const updatedPatients = patients.map((p) => {
      if (p.invoiceId === invoiceId || (targetInv && (p.tokenNumber === targetInv.tokenNumber || p.id === targetInv.patientId))) {
        return {
          ...p,
          isPaid: true,
          paymentStatus: 'PAID'
        };
      }
      return p;
    });

    setInvoices(updatedInvoices);
    setPatients(updatedPatients);
    broadcastUpdate({ invoices: updatedInvoices, patients: updatedPatients });
    return targetInv;
  }, [invoices, patients, broadcastUpdate]);

  // Settle Pharmacy Medications & Extra Services at Cashier Desk
  const settlePatientMedications = useCallback((patientIdOrToken, billingData = {}) => {
    clinicAudio.triggerHaptic(30);
    const targetPatient = patients.find((p) => p.id === patientIdOrToken || p.tokenNumber === patientIdOrToken);
    if (!targetPatient) return null;

    const meds = targetPatient.prescriptions || [];
    const medTotal = meds.reduce((sum, m) => sum + (Number(m.price) || 0), 0);
    const payMethod = billingData.paymentMethod || clinicSettings?.paymentSettings?.defaultMethod || 'CASH';

    // 1. Mark patient as COMPLETED (cleared from BILLING_PENDING)
    const updatedPatients = patients.map((p) => {
      if (p.id === targetPatient.id) {
        return {
          ...p,
          status: 'COMPLETED',
          billingSettledAt: Date.now()
        };
      }
      return p;
    });

    // 2. Mark corresponding pharmacyQueue item as DISPENSED
    const updatedPharmacyQueue = pharmacyQueue.map((item) => {
      if (item.patientId === targetPatient.id || item.tokenNumber === targetPatient.tokenNumber) {
        return {
          ...item,
          status: 'DISPENSED',
          dispensedAt: Date.now(),
          pharmacistNotes: billingData.pharmacistNotes || 'Settled and dispensed at Pharmacy Billing counter'
        };
      }
      return item;
    });

    // 3. Generate paid pharmacy invoice
    const discount = Number(billingData.discount || 0);
    const insuranceCoPay = Number(billingData.insuranceCoPay || 0);
    const finalTotal = Math.max(0, medTotal - discount - insuranceCoPay);

    const newInvoice = {
      id: `inv-med-${Date.now()}`,
      invoiceNumber: `APEX-MED-${targetPatient.tokenNumber.replace('C-', '')}-${Math.floor(100 + Math.random() * 900)}`,
      tokenNumber: targetPatient.tokenNumber,
      patientId: targetPatient.id,
      patientName: targetPatient.patientName,
      age: targetPatient.age,
      gender: targetPatient.gender,
      phone: targetPatient.phone,
      doctorName: targetPatient.doctorName,
      cabinId: targetPatient.cabinId,
      department: targetPatient.department,
      services: [
        {
          id: `med-${Date.now()}`,
          name: 'Prescribed Pharmacy Medications & Dispensation',
          price: medTotal,
          category: 'Pharmacy',
          code: 'RX-DISP'
        }
      ],
      medications: meds,
      clinicalNotes: targetPatient.clinicalNotes || 'Dispensed as prescribed by attending physician.',
      subtotal: medTotal,
      insuranceCoPay,
      discount,
      total: finalTotal,
      paymentMethod: payMethod,
      cashTendered: payMethod === 'CASH' ? Number(billingData.cashTendered || finalTotal) : null,
      changeDue: payMethod === 'CASH' && billingData.cashTendered ? Math.max(0, Number(billingData.cashTendered) - finalTotal) : 0,
      timestamp: Date.now(),
      status: 'PAID'
    };

    const updatedInvoices = [newInvoice, ...invoices];

    setPatients(updatedPatients);
    setPharmacyQueue(updatedPharmacyQueue);
    setInvoices(updatedInvoices);

    broadcastUpdate({
      patients: updatedPatients,
      pharmacyQueue: updatedPharmacyQueue,
      invoices: updatedInvoices
    });

    return newInvoice;
  }, [patients, pharmacyQueue, invoices, clinicSettings, broadcastUpdate]);

  // Update Cabin Status (Available, Break, Off-Duty)
  const updateCabinStatus = useCallback((cabinId, status) => {
    clinicAudio.triggerHaptic(15);
    const updatedCabins = cabins.map((c) => {
      if (c.cabinId === cabinId) {
        return { ...c, status };
      }
      return c;
    });
    setCabins(updatedCabins);
    broadcastUpdate({ cabins: updatedCabins });
  }, [cabins, broadcastUpdate]);

  // Reset to initial demo data
  const resetDemoData = useCallback(() => {
    clinicAudio.triggerHaptic(30);
    setCabins(CLINIC_CABINS);
    setServices(CLINIC_SERVICES);
    setPharmacyFormulary(PHARMACY_FORMULARY);
    setSymptoms(SYMPTOM_OPTIONS);
    setTimeSlots(APPOINTMENT_SLOTS);
    setPatients(INITIAL_PATIENTS);
    setInvoices(INITIAL_INVOICES);
    setPharmacyQueue(INITIAL_PHARMACY_QUEUE);
    setPatientHistoryList(PATIENT_MEDICAL_HISTORY);
    setClinicSettings(DEFAULT_SETTINGS);
    setEmergencyProcedures(EMERGENCY_PROCEDURES);
    setEmergencySettings(DEFAULT_EMERGENCY_SETTINGS);
    localStorage.clear();
    broadcastUpdate({
      cabins: CLINIC_CABINS,
      services: CLINIC_SERVICES,
      pharmacyFormulary: PHARMACY_FORMULARY,
      symptoms: SYMPTOM_OPTIONS,
      timeSlots: APPOINTMENT_SLOTS,
      patients: INITIAL_PATIENTS,
      invoices: INITIAL_INVOICES,
      pharmacyQueue: INITIAL_PHARMACY_QUEUE,
      patientHistoryList: PATIENT_MEDICAL_HISTORY,
      clinicSettings: DEFAULT_SETTINGS,
      emergencyProcedures: EMERGENCY_PROCEDURES,
      emergencySettings: DEFAULT_EMERGENCY_SETTINGS
    });
  }, [broadcastUpdate]);

  // Estimated wait time in minutes
  const getEstimatedWaitTime = useCallback((cabinId = 'any', patientIdentifier = null) => {
    const waiting = patients.filter((p) => p.status === 'WAITING' || p.status === 'CALLED');
    if (cabinId !== 'any') {
      const cabinWaiting = waiting.filter((p) => p.cabinId === Number(cabinId));
      if (patientIdentifier) {
        const idx = cabinWaiting.findIndex(
          (p) => p.id === patientIdentifier || p.tokenNumber === patientIdentifier
        );
        if (idx !== -1) {
          return Math.max(10, (idx + 1) * 15);
        }
      }
      return Math.max(10, Math.max(1, cabinWaiting.length) * 15);
    }
    const activeCabinCount = cabins.filter((c) => c.status !== 'OFF_DUTY').length || 1;
    return Math.max(5, Math.ceil((waiting.length * 15) / activeCabinCount));
  }, [patients, cabins]);

  const value = {
    // State Entities
    currencySymbol,
    currencyCode,
    formatCurrency,
    formatMoney,
    formatDoctorName,
    calculateTotalRevenue,
    CURRENCY_OPTIONS,
    cabins,
    services,
    pharmacyFormulary,
    symptoms,
    timeSlots,
    appointments,
    isSlotInFuture,
    pharmacyQueue,
    patients,
    invoices,
    patientHistoryList,
    clinicSettings,
    activeRole,
    setActiveRole,
    selectedCabinId,
    setSelectedCabinId,
    soundEnabled,
    setSoundEnabled,
    latestAnnouncement,

    // Clinical Station Operations
    registerPatient,
    registerEmergencyPatient,
    recordMinorProcedure,
    emergencyProcedures,
    emergencySettings,
    addEmergencyProcedure,
    updateEmergencyProcedure,
    deleteEmergencyProcedure,
    toggleEmergencyProcedureStatus,
    updateEmergencySettings,
    addEmergencyKit,
    updateEmergencyKit,
    deleteEmergencyKit,
    bookAppointment,
    checkInAppointment,
    cancelAppointment,
    rescheduleAppointment,
    markAppointmentNoShow,
    searchAppointment,
    callPatientToCabin,
    startConsultation,
    updateConsultationData,
    repeatPreviousPrescription,
    completeConsultation,
    returnToken,
    dispensePharmacyPrescription,
    searchPatientHistoryByPhone,
    settleInvoice,
    settlePatientMedications,
    updateCabinStatus,
    getEstimatedWaitTime,

    // Multi-Clinic Platform & Feature Management
    clinics,
    activeClinicId,
    activeClinic,
    switchClinic,
    lockClinic,
    unlockClinic,
    addClinic,
    updateClinic,
    deleteClinic,
    updateClinicLogos,
    isCurrentClinicLocked,
    setClinicFeature,
    toggleClinicFeature,
    bulkSetClinicFeatures,
    isClinicFeatureEnabled,
    CLINIC_FEATURE_MODULES,
    DEFAULT_CLINIC_FEATURES,

    // Authentication & RBAC
    USER_ROLES,
    users,
    currentUser,
    setCurrentUser,
    switchUser,
    loginUser,
    logoutUser,
    renewGoogleAuth,
    addUser,
    updateUser,
    deleteUser,

    // Security & Locks
    kioskLockState,
    lockKiosk,
    autoLockKiosk,
    unlockKiosk,
    updateKioskDevicePin,
    addKioskDevice,
    deleteKioskDevice,
    isScreenLocked,
    lockScreen,
    unlockScreen,

    // Vertical Navigation Panel States
    isNavPinned,
    setIsNavPinned,
    isNavOpen,
    setIsNavOpen,
    isNavLocked,
    setIsNavLocked,
    unlockNav,
    lockNav,

    // Audit Logging
    auditLogs,
    logAuditEvent,

    // Themes & Helpers
    DOCTOR_CARD_COLORS,
    getDoctorTheme,

    // Master Admin CRUD Operations
    addCabin,
    updateCabin,
    deleteCabin,
    addService,
    updateService,
    deleteService,
    addFormularyItem,
    updateFormularyItem,
    deleteFormularyItem,
    adjustFormularyStock,
    sellPharmacyDirectOTC,
    updatePharmacySettings,
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
    exportAllDataJSON,
    importAllDataJSON,
    resetDemoData
  };

  return (
    <ClinicContext.Provider value={value}>
      {children}
    </ClinicContext.Provider>
  );
};

export { useClinic } from './useClinic';
