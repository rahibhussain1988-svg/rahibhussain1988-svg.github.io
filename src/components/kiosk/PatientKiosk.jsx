import React, { useState, useEffect, useMemo } from 'react';
import {
  Stethoscope,
  Heart,
  Activity,
  Users,
  Clock,
  Check,
  Calendar,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  Printer,
  Building2,
  Star,
  CheckCircle2,
  CreditCard,
  Banknote,
  QrCode,
  DollarSign,
  FileText,
  Thermometer,
  Plus,
  Minus,
  User,
  Lock,
  Unlock,
  ShieldAlert,
  KeyRound,
  RefreshCw,
  AlertTriangle,
  Download,
  ArrowRight,
  Search,
  Phone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useClinic } from '../../context/useClinic';
import { SYMPTOM_OPTIONS, getDoctorTheme, DOCTOR_CARD_COLORS } from '../../data/clinicData';
import { TouchNumpad, TouchKeyboard, VirtualKeyboardToggle } from '../common/TouchKeypad';
import { WorkstationHeaderControls } from '../common/WorkstationHeaderControls';
import { clinicAudio } from '../../utils/clinicAudio';
import { LaserMedicalInvoice } from '../printing/LaserMedicalInvoice';
import { AppointmentSlipModal } from '../printing/AppointmentSlipModal';
import { QueueTokenThermalSlipModal } from '../printing/QueueTokenThermalSlipModal';
import { useIdleTimer } from '../../hooks/useIdleTimer';
import { useDeviceInputMode } from '../../hooks/useDeviceInputMode';

class StepErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Kiosk Step Rendering Notice:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto my-auto">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-4 shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
            Workstation Step Recovery
          </span>
          <h3 className="text-xl font-black text-slate-900 mt-2 mb-1">
            Display Notice Encountered
          </h3>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            A temporary display notice occurred on this step ({this.state.error?.message || 'Display render issue'}). Your intake progress has been saved in draft.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onRetry) this.props.onRetry();
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all shadow-md active:scale-95"
            >
              Retry Step
            </button>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onGoBack) this.props.onGoBack();
              }}
              className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-all active:scale-95"
            >
              Return to Previous Step
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const maskPatientName = (name) => {
  if (!name) return 'Patient';
  const parts = name.trim().split(/\s+/);
  return parts.map((p) => {
    if (p.length <= 2) return p;
    return p[0] + '*'.repeat(Math.max(2, p.length - 2)) + p[p.length - 1];
  }).join(' ');
};

const maskPhone = (phoneStr) => {
  if (!phoneStr) return '';
  const clean = phoneStr.replace(/\D/g, '');
  if (clean.length < 4) return phoneStr;
  return `***-***-${clean.slice(-4)}`;
};

export const PatientKiosk = () => {
  const {
    cabins,
    services,
    symptoms,
    timeSlots,
    appointments,
    isSlotInFuture,
    emergencyProcedures,
    emergencySettings,
    registerEmergencyPatient,
    bookAppointment,
    checkInAppointment,
    searchAppointment,
    registerPatient,
    getEstimatedWaitTime,
    searchPatientHistoryByPhone,
    currencySymbol,
    currencyCode,
    formatCurrency,
    clinicSettings,
    kioskLockState,
    lockKiosk,
    autoLockKiosk,
    unlockKiosk,
    activeClinic,
    isCurrentClinicLocked
  } = useClinic();

  // Kiosk PIN Security & Unlock State
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [selectedKioskDeviceId, setSelectedKioskDeviceId] = useState(
    activeClinic?.kioskDevices?.[0]?.id || 'KIOSK-01'
  );

  // 5-Minute Inactivity Auto-Lock Hook
  useIdleTimer({
    timeoutMs: (activeClinic?.kioskSettings?.autoLockSeconds || 300) * 1000,
    onIdle: () => {
      autoLockKiosk();
    },
    enabled: !kioskLockState?.isLocked && !isCurrentClinicLocked
  });

  const handlePinDigit = (digit) => {
    clinicAudio.triggerHaptic(15);
    setPinError('');
    if (pinInput.length < 6) {
      const next = pinInput + digit;
      setPinInput(next);
      if (next.length === 4) {
        // Auto-attempt unlock on 4 digits
        const res = unlockKiosk(next, selectedKioskDeviceId);
        if (res.success) {
          setPinInput('');
          setPinError('');
        } else {
          setPinError(res.error || 'Incorrect PIN');
          setPinInput('');
        }
      }
    }
  };

  const handlePinBackspace = () => {
    clinicAudio.triggerHaptic(10);
    setPinInput((prev) => prev.slice(0, -1));
    setPinError('');
  };

  const handlePinClear = () => {
    clinicAudio.triggerHaptic(15);
    setPinInput('');
    setPinError('');
  };

  const handleManualUnlockSubmit = () => {
    clinicAudio.triggerHaptic(20);
    const res = unlockKiosk(pinInput, selectedKioskDeviceId);
    if (res.success) {
      setPinInput('');
      setPinError('');
    } else {
      setPinError(res.error || 'Incorrect PIN');
      setPinInput('');
    }
  };

  // Wizard Steps
  // 0: Attract / Welcome Screen (Walk-in vs Appointment Check-in)
  // 1: Specialty & Symptoms
  // 2: Doctor & Cabin Selection
  // 3: Walk-in vs Appointment Slot (Smart future slot filtering)
  // 4: Patient Demographics (Name, Age, Gender, Phone)
  // 5: RECORD PATIENT VITALS & TRIAGE (Walk-in & Arrived Appointment Patients)
  // 6: UPFRONT BILLING & PAYMENT (Walk-in & Arrived Appointment Patients)
  // 7: Token Slip Confirmation & Laser Invoice Printing
  // 8: Appointment Booked Slip Confirmation (No Vitals, No Payment)
  // 'CHECKIN_SEARCH': Patient Arrival Check-In for Existing Appointments
  const [currentStep, setCurrentStep] = useState(0);

  // Smart Appointment & Check-In States
  const [selectedDate, setSelectedDate] = useState('Today'); // 'Today' | 'Tomorrow'
  const [isAppointmentCheckIn, setIsAppointmentCheckIn] = useState(false);
  const [appointmentSearchQuery, setAppointmentSearchQuery] = useState('');
  const [matchedAppointment, setMatchedAppointment] = useState(null);
  const [bookedAppointmentSlip, setBookedAppointmentSlip] = useState(null);
  const [showAppointmentSlipModal, setShowAppointmentSlipModal] = useState(false);

  // Form State
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [selectedCabinId, setSelectedCabinId] = useState(1);
  const [bookingType, setBookingType] = useState('WALK_IN');
  const [selectedSlot, setSelectedSlot] = useState(timeSlots[0]);
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [inputField, setInputField] = useState('name'); // 'name' | 'age' | 'phone'

  // Appointment Form Validation States
  const [appointmentErrors, setAppointmentErrors] = useState({});
  const [showAppointmentErrorAlert, setShowAppointmentErrorAlert] = useState(false);

  // Emergency & Minor Procedures Workflow State
  const [selectedEmergencyProcedures, setSelectedEmergencyProcedures] = useState(['emg-proc-1']);
  const [emergencySeverity, setEmergencySeverity] = useState('URGENT'); // 'CRITICAL' | 'URGENT' | 'PRIORITY'
  const [emergencyQuickPass, setEmergencyQuickPass] = useState(false);
  const [procedureSiteInput, setProcedureSiteInput] = useState('Treatment Room / Cabin 1');

  const isAppointmentInfoComplete = useMemo(() => {
    const hasName = patientName.trim().length >= 2;
    const ageNum = parseInt(age, 10);
    const hasAge = Boolean(age && !isNaN(ageNum) && ageNum > 0 && ageNum <= 125);
    const hasGender = Boolean(gender);
    const hasPhone = phone.trim().length >= 5;
    return hasName && hasAge && hasGender && hasPhone;
  }, [patientName, age, gender, phone]);

  // Device Input Mode Hook: Auto-detects touch vs physical hardware workstation
  const {
    isTouchDevice,
    inputMode,
    showVirtualKeyboard,
    toggleVirtualKeyboard
  } = useDeviceInputMode();

  // Physical keyboard input element refs
  const nameInputRef = React.useRef(null);
  const ageInputRef = React.useRef(null);
  const phoneInputRef = React.useRef(null);
  const appointmentSearchInputRef = React.useRef(null);

  // Physical keyboard support for PIN Unlock Modal
  useEffect(() => {
    if (!kioskLockState?.isLocked && !isCurrentClinicLocked) return;

    const handlePinKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handlePinDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handlePinBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleManualUnlockSubmit();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        handlePinClear();
      }
    };

    window.addEventListener('keydown', handlePinKey);
    return () => window.removeEventListener('keydown', handlePinKey);
  }, [kioskLockState?.isLocked, isCurrentClinicLocked, pinInput, selectedKioskDeviceId]);

  // Autofocus physical keyboard into inputs on Step 4 and Arrival Check-in
  useEffect(() => {
    if (currentStep === 4) {
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    } else if (currentStep === 'CHECKIN_SEARCH') {
      const timer = setTimeout(() => {
        appointmentSearchInputRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);


  // Vitals Recording States (Triage Intake - 4-Screen Workflow)
  const [vitalsRecorded, setVitalsRecorded] = useState(false);
  const [vitalScreen, setVitalScreen] = useState(1); // 1: Temp, 2: BP, 3: Pulse, 4: SpO2
  const [tempRecorded, setTempRecorded] = useState(false); // Temperature is MANDATORY at kiosk counter
  const [bpRecorded, setBpRecorded] = useState(false); // Skipped by default unless updated
  const [pulseRecorded, setPulseRecorded] = useState(false); // Skipped by default unless updated
  const [spo2Recorded, setSpo2Recorded] = useState(false); // Skipped by default unless updated
  const [tempValidationAlert, setTempValidationAlert] = useState(false);
  const [temperature, setTemperature] = useState('98.6');
  const [bpSystolic, setBpSystolic] = useState('122');
  const [bpDiastolic, setBpDiastolic] = useState('72');
  const [pulseRate, setPulseRate] = useState('84');
  const [spo2, setSpo2] = useState('97');
  const [weight, setWeight] = useState('70');

  // Upfront Billing States (Default to Cash at Counter)
  const defaultMethod = clinicSettings?.paymentSettings?.defaultMethod || 'CASH';
  const [paymentMethod, setPaymentMethod] = useState(defaultMethod);
  const [insuranceCoPay, setInsuranceCoPay] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [cashTendered, setCashTendered] = useState(0);

  // Intake Draft Auto-Save & Recovery (Session Storage)
  const DRAFT_STORAGE_KEY = 'CLINIC_KIOSK_INTAKE_DRAFT';
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [draftInfo, setDraftInfo] = useState(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.currentStep === 'number' && parsed.currentStep > 0 && parsed.currentStep < 7) {
          setHasSavedDraft(true);
          setDraftInfo(parsed);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof currentStep === 'number' && currentStep > 0 && currentStep < 7) {
      try {
        const draft = {
          currentStep,
          vitalScreen,
          selectedDepartment,
          selectedSymptoms,
          selectedCabinId,
          bookingType,
          selectedSlot,
          selectedDate,
          patientName,
          age,
          gender,
          phone,
          temperature,
          bpSystolic,
          bpDiastolic,
          pulseRate,
          spo2,
          weight,
          vitalsRecorded,
          tempRecorded,
          bpRecorded,
          pulseRecorded,
          spo2Recorded,
          paymentMethod,
          savedAt: Date.now()
        };
        sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        setHasSavedDraft(true);
        setDraftInfo(draft);
      } catch {}
    }
  }, [
    currentStep,
    vitalScreen,
    selectedDepartment,
    selectedSymptoms,
    selectedCabinId,
    bookingType,
    selectedSlot,
    selectedDate,
    patientName,
    age,
    gender,
    phone,
    temperature,
    bpSystolic,
    bpDiastolic,
    pulseRate,
    spo2,
    weight,
    vitalsRecorded,
    tempRecorded,
    bpRecorded,
    pulseRecorded,
    spo2Recorded,
    paymentMethod
  ]);

  const restoreDraft = () => {
    clinicAudio.triggerHaptic(20);
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.selectedDepartment) setSelectedDepartment(d.selectedDepartment);
      if (d.selectedSymptoms) setSelectedSymptoms(d.selectedSymptoms);
      if (d.selectedCabinId) setSelectedCabinId(d.selectedCabinId);
      if (d.bookingType) setBookingType(d.bookingType);
      if (d.selectedSlot) setSelectedSlot(d.selectedSlot);
      if (d.selectedDate) setSelectedDate(d.selectedDate);
      if (d.patientName) setPatientName(d.patientName);
      if (d.age) setAge(d.age);
      if (d.gender) setGender(d.gender);
      if (d.phone) setPhone(d.phone);
      if (d.temperature) setTemperature(d.temperature);
      if (d.bpSystolic) setBpSystolic(d.bpSystolic);
      if (d.bpDiastolic) setBpDiastolic(d.bpDiastolic);
      if (d.pulseRate) setPulseRate(d.pulseRate);
      if (d.spo2) setSpo2(d.spo2);
      if (d.weight) setWeight(d.weight);
      if (d.vitalsRecorded !== undefined) setVitalsRecorded(d.vitalsRecorded);
      if (d.tempRecorded !== undefined) setTempRecorded(d.tempRecorded);
      if (d.bpRecorded !== undefined) setBpRecorded(d.bpRecorded);
      if (d.pulseRecorded !== undefined) setPulseRecorded(d.pulseRecorded);
      if (d.spo2Recorded !== undefined) setSpo2Recorded(d.spo2Recorded);
      if (d.vitalScreen) setVitalScreen(d.vitalScreen);
      if (d.paymentMethod) setPaymentMethod(d.paymentMethod);
      if (d.currentStep) setCurrentStep(d.currentStep);
    } catch {}
  };

  const discardDraft = () => {
    clinicAudio.triggerHaptic(15);
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}
    setHasSavedDraft(false);
    setDraftInfo(null);
  };

  // Confirmation & Print States
  const [issuedResult, setIssuedResult] = useState(null); // { patient, invoice }
  const [showLaserModal, setShowLaserModal] = useState(false);
  const [showQueueTokenModal, setShowQueueTokenModal] = useState(false);
  const [autoResetTimer, setAutoResetTimer] = useState(25);

  // Synchronize default payment method if changed in admin
  useEffect(() => {
    const adminDefault = clinicSettings?.paymentSettings?.defaultMethod || 'CASH';
    const enabled = clinicSettings?.paymentSettings?.enabledMethods || { CASH: true };
    if (!enabled[paymentMethod]) {
      setPaymentMethod(adminDefault);
    }
  }, [clinicSettings?.paymentSettings]);

  const targetCabin = cabins.find((c) => c.cabinId === selectedCabinId) || cabins[0];
  const consultationFee = targetCabin.consultationFee;
  const netPayable = Math.max(0, consultationFee - insuranceCoPay - discount);
  const changeDue = paymentMethod === 'CASH' && cashTendered > netPayable ? cashTendered - netPayable : 0;
  const isInsufficientCash = paymentMethod === 'CASH' && Number(cashTendered || 0) > 0 && Number(cashTendered || 0) < netPayable;

  const handleReset = () => {
    clinicAudio.triggerHaptic(20);
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}
    setHasSavedDraft(false);
    setDraftInfo(null);
    setCurrentStep(0);
    setVitalScreen(1);
    setSelectedDepartment('All');
    setSelectedSymptoms([]);
    setSelectedCabinId(1);
    setBookingType('WALK_IN');
    setSelectedSlot(timeSlots[0]);
    setPatientName('');
    setAge('');
    setGender('Male');
    setPhone('');
    setInputField('name');
    setVitalsRecorded(false);
    setTempRecorded(false);
    setBpRecorded(false);
    setPulseRecorded(false);
    setSpo2Recorded(false);
    setTempValidationAlert(false);
    setTemperature('98.6');
    setBpSystolic('122');
    setBpDiastolic('72');
    setPulseRate('84');
    setSpo2('97');
    setWeight('70');
    setPaymentMethod(defaultMethod);
    setInsuranceCoPay(0);
    setDiscount(0);
    setCashTendered(0);
    setIssuedResult(null);
    setShowLaserModal(false);
    setShowQueueTokenModal(false);
    setBookedAppointmentSlip(null);
    setShowAppointmentSlipModal(false);
    setAppointmentErrors({});
    setShowAppointmentErrorAlert(false);
    setAutoResetTimer(25);
  };

  // Auto reset countdown on confirmation screen (Step 7)
  useEffect(() => {
    if (currentStep === 7 || currentStep === 8) {
      try {
        confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      } catch {}

      const interval = setInterval(() => {
        setAutoResetTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleReset();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentStep]);

  const toggleSymptom = (item) => {
    clinicAudio.triggerHaptic(15);
    const symLabel = typeof item === 'string' ? item : item.label;
    setSelectedSymptoms((prev) =>
      prev.includes(symLabel) ? prev.filter((s) => s !== symLabel) : [...prev, symLabel]
    );
    if (typeof item === 'object' && item.cabinId) {
      setSelectedCabinId(item.cabinId);
    }
  };

  // Smart Filtered Future Time Slots (Never show past hours!)
  const isTomorrow = selectedDate === 'Tomorrow';
  const availableSlots = useMemo(() => {
    return (timeSlots || []).filter((slot) => isSlotInFuture(slot, isTomorrow));
  }, [timeSlots, isTomorrow, isSlotInFuture]);

  // Ensure selected slot is in available slots
  useEffect(() => {
    if (availableSlots.length > 0 && (!selectedSlot || !availableSlots.includes(selectedSlot))) {
      setSelectedSlot(availableSlots[0]);
    }
  }, [availableSlots, selectedSlot]);

  // Handle Future Appointment Booking (Strict Validation: Must NOT proceed until all info is entered!)
  const handleBookFutureAppointment = () => {
    clinicAudio.triggerHaptic(20);

    const nameValid = patientName.trim().length >= 2;
    const ageNum = parseInt(age, 10);
    const ageValid = Boolean(age && !isNaN(ageNum) && ageNum > 0 && ageNum <= 125);
    const phoneValid = phone.trim().length >= 5;

    const errors = {};
    if (!nameValid) errors.name = 'Patient Full Name is required (minimum 2 characters)';
    if (!ageValid) errors.age = 'Please enter a valid age (1-125 years)';
    if (!phoneValid) errors.phone = 'Contact Phone is required for SMS confirmation (minimum 5 digits)';

    if (Object.keys(errors).length > 0) {
      setAppointmentErrors(errors);
      setShowAppointmentErrorAlert(true);
      clinicAudio.triggerHaptic(30);

      // Focus first missing input
      if (!nameValid) {
        setInputField('name');
        nameInputRef.current?.focus();
      } else if (!ageValid) {
        setInputField('age');
        ageInputRef.current?.focus();
      } else if (!phoneValid) {
        setInputField('phone');
        phoneInputRef.current?.focus();
      }
      return; // CRITICAL: Stop execution - system does NOT proceed!
    }

    // All information entered: Proceed to book appointment!
    setAppointmentErrors({});
    setShowAppointmentErrorAlert(false);
    clinicAudio.triggerHaptic(30);

    const result = bookAppointment({
      patientName: patientName.trim(),
      age: parseInt(age, 10),
      gender,
      phone: phone.trim(),
      symptoms: selectedSymptoms,
      cabinId: selectedCabinId,
      date: selectedDate,
      timeSlot: selectedSlot
    });

    setBookedAppointmentSlip(result.appointment);
    setShowAppointmentSlipModal(true);
    setCurrentStep(8); // Step 8: Appointment Confirmation Slip
  };

  // Select Existing Appointment for Check-In
  const handleSelectAppointmentForCheckIn = (apt) => {
    clinicAudio.triggerHaptic(25);
    setMatchedAppointment(apt);
    setPatientName(apt.patientName);
    setAge(String(apt.age || 35));
    setGender(apt.gender || 'Male');
    setPhone(apt.phone || '');
    setSelectedCabinId(apt.cabinId);
    setSelectedSymptoms(apt.symptoms || []);
    setBookingType('APPOINTMENT');
    setSelectedSlot(apt.timeSlot);
    setIsAppointmentCheckIn(true);
    setVitalScreen(1);
    // Proceed directly to Vitals Intake!
    setCurrentStep(5);
  };

  // Toggle Emergency Procedure Selection
  const handleToggleEmergencyProcedure = (procId) => {
    clinicAudio.triggerHaptic(15);
    setSelectedEmergencyProcedures((prev) =>
      prev.includes(procId)
        ? (prev.length > 1 ? prev.filter((id) => id !== procId) : prev)
        : [...prev, procId]
    );
  };

  // Confirm Emergency Fast-Track Intake
  const handleConfirmEmergencyIntake = () => {
    clinicAudio.triggerHaptic(35);
    const finalName = emergencyQuickPass || !patientName.trim() ? 'Emergency Trauma Patient' : patientName.trim();
    const finalAge = age ? parseInt(age, 10) : 35;
    const finalGender = gender || 'Male';
    const finalPhone = phone || '';

    const selectedProcedureObjects = (emergencyProcedures || []).filter((p) =>
      selectedEmergencyProcedures.includes(p.id)
    );

    const billingData = {
      paymentMethod: 'CASH',
      cashTendered: 0,
      paymentLocation: 'DOCTOR_CABIN'
    };

    const result = registerEmergencyPatient(
      {
        patientName: finalName,
        age: finalAge,
        gender: finalGender,
        phone: finalPhone,
        cabinId: emergencySettings?.defaultCabinId || 1,
        severity: emergencySeverity,
        procedureSite: procedureSiteInput || `Treatment Room / Cabin ${emergencySettings?.defaultCabinId || 1}`,
        vitals: {
          temp: temperature || '98.6°F',
          bp: `${bpSystolic}/${bpDiastolic} mmHg`,
          pulse: `${pulseRate} bpm`,
          spo2: `${spo2}%`,
          weight: `${weight} kg`
        }
      },
      selectedProcedureObjects,
      billingData
    );

    if (result) {
      setIssuedResult(result);
      setCurrentStep(7);
    }
  };

  // Vitals Steppers & Helpers
  const adjustTemp = (delta) => {
    clinicAudio.triggerHaptic(15);
    setTempRecorded(true);
    setTempValidationAlert(false);
    setVitalsRecorded(true);
    setTemperature((prev) => {
      const val = parseFloat(prev) || 98.6;
      const next = Math.round((val + delta) * 10) / 10;
      return Math.min(106.0, Math.max(94.0, next)).toFixed(1);
    });
  };

  const adjustSystolic = (delta) => {
    clinicAudio.triggerHaptic(15);
    setBpRecorded(true);
    setVitalsRecorded(true);
    setBpSystolic((prev) => {
      const val = parseInt(prev, 10) || 120;
      return String(Math.min(220, Math.max(70, val + delta)));
    });
  };

  const adjustDiastolic = (delta) => {
    clinicAudio.triggerHaptic(15);
    setBpRecorded(true);
    setVitalsRecorded(true);
    setBpDiastolic((prev) => {
      const val = parseInt(prev, 10) || 80;
      return String(Math.min(130, Math.max(40, val + delta)));
    });
  };

  const adjustPulse = (delta) => {
    clinicAudio.triggerHaptic(15);
    setPulseRecorded(true);
    setVitalsRecorded(true);
    setPulseRate((prev) => {
      const val = parseInt(prev, 10) || 84;
      return String(Math.min(180, Math.max(40, val + delta)));
    });
  };

  const adjustSpo2 = (delta) => {
    clinicAudio.triggerHaptic(15);
    setSpo2Recorded(true);
    setVitalsRecorded(true);
    setSpo2((prev) => {
      const val = parseInt(prev, 10) || 97;
      return String(Math.min(100, Math.max(80, val + delta)));
    });
  };

  const setStandardVitals = () => {
    clinicAudio.triggerHaptic(20);
    setTempRecorded(true);
    setBpRecorded(true);
    setPulseRecorded(true);
    setSpo2Recorded(true);
    setTempValidationAlert(false);
    setVitalsRecorded(true);
    setTemperature('98.6');
    setBpSystolic('120');
    setBpDiastolic('80');
    setPulseRate('76');
    setSpo2('98');
    setWeight('70');
  };

  const skipRemainingVitals = () => {
    if (!tempRecorded) {
      clinicAudio.triggerHaptic(30);
      setTempValidationAlert(true);
      setVitalScreen(1);
      return;
    }
    clinicAudio.triggerHaptic(15);
    setBpRecorded(false);
    setPulseRecorded(false);
    setSpo2Recorded(false);
    setCurrentStep(6);
  };

  // Physical keyboard controls for Step 1 Chief Symptoms
  useEffect(() => {
    if (currentStep !== 1) return;

    const handleSymptomKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if ((e.key === 'Enter' || e.key === 'ArrowRight') && selectedSymptoms.length > 0) {
        e.preventDefault();
        clinicAudio.triggerHaptic(20);
        setCurrentStep(2);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        clinicAudio.triggerHaptic(15);
        setCurrentStep(0);
      }
    };

    window.addEventListener('keydown', handleSymptomKey);
    return () => window.removeEventListener('keydown', handleSymptomKey);
  }, [currentStep, selectedSymptoms]);

  // Physical keyboard controls for Step 5 Triage Vitals Intake
  useEffect(() => {
    if (currentStep !== 5) return;

    const handleVitalsKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowUp' || e.key === '+' || e.key === '=') {
        e.preventDefault();
        clinicAudio.triggerHaptic(10);
        if (vitalScreen === 1) adjustTemp(0.2);
        else if (vitalScreen === 2) adjustSystolic(2);
        else if (vitalScreen === 3) adjustPulse(2);
        else if (vitalScreen === 4) adjustSpo2(1);
      } else if (e.key === 'ArrowDown' || e.key === '-' || e.key === '_') {
        e.preventDefault();
        clinicAudio.triggerHaptic(10);
        if (vitalScreen === 1) adjustTemp(-0.2);
        else if (vitalScreen === 2) adjustSystolic(-2);
        else if (vitalScreen === 3) adjustPulse(-2);
        else if (vitalScreen === 4) adjustSpo2(-1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        clinicAudio.triggerHaptic(15);
        if (vitalScreen === 1) setCurrentStep(4);
        else setVitalScreen((prev) => Math.max(1, prev - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        clinicAudio.triggerHaptic(15);
        if (vitalScreen === 1) {
          if (!tempRecorded) {
            setTempRecorded(true);
            setTempValidationAlert(false);
            setVitalScreen(2);
          } else {
            setVitalScreen(2);
          }
        } else if (vitalScreen < 4) {
          setVitalScreen((prev) => Math.min(4, prev + 1));
        } else {
          if (!tempRecorded) {
            setTempValidationAlert(true);
            setVitalScreen(1);
          } else {
            setVitalsRecorded(true);
            setCurrentStep(6);
          }
        }
      } else if (e.key === '1') {
        setVitalScreen(1);
      } else if (e.key === '2') {
        setVitalScreen(2);
      } else if (e.key === '3') {
        setVitalScreen(3);
      } else if (e.key === '4') {
        setVitalScreen(4);
      } else if (e.key === 's' || e.key === 'S') {
        if (vitalScreen > 1) {
          e.preventDefault();
          clinicAudio.triggerHaptic(15);
          if (vitalScreen < 4) setVitalScreen((prev) => prev + 1);
          else setCurrentStep(6);
        }
      }
    };

    window.addEventListener('keydown', handleVitalsKey);
    return () => window.removeEventListener('keydown', handleVitalsKey);
  }, [currentStep, vitalScreen, tempRecorded, temperature, bpSystolic, bpDiastolic, pulseRate, spo2]);

  // Payment Counter Numbers Keyboard Handlers (Touch & Physical Keyboard)
  const handleKeypadDigit = (digit) => {
    clinicAudio.triggerHaptic(15);
    setCashTendered((prev) => {
      const prevStr = String(prev || 0);
      if (prevStr === '0') {
        return Number(digit);
      }
      const nextStr = prevStr + digit;
      if (nextStr.length > 7) return prev;
      return Number(nextStr);
    });
  };

  const handleKeypadBackspace = () => {
    clinicAudio.triggerHaptic(10);
    setCashTendered((prev) => {
      const prevStr = String(prev || 0);
      if (prevStr.length <= 1) return 0;
      return Number(prevStr.slice(0, -1));
    });
  };

  const handleKeypadClear = () => {
    clinicAudio.triggerHaptic(15);
    setCashTendered(0);
  };

  // Physical Keyboard Listener for Step 6 (Numbers Keyboard & Enter to Issue Token)
  useEffect(() => {
    if (currentStep !== 6) return;

    const handlePaymentKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleKeypadDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleKeypadBackspace();
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C' || e.key === 'Delete') {
        e.preventDefault();
        handleKeypadClear();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (isInsufficientCash) {
          clinicAudio.triggerHaptic(30);
          return;
        }
        handleCompletePaymentAndIssueToken();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        clinicAudio.triggerHaptic(15);
        setCurrentStep(5);
      }
    };

    window.addEventListener('keydown', handlePaymentKey);
    return () => window.removeEventListener('keydown', handlePaymentKey);
  }, [
    currentStep,
    cashTendered,
    netPayable,
    isInsufficientCash,
    paymentMethod,
    isAppointmentCheckIn,
    matchedAppointment,
    targetCabin,
    patientName,
    age,
    gender,
    phone,
    selectedSymptoms,
    selectedCabinId,
    bookingType,
    selectedSlot,
    temperature,
    bpRecorded,
    bpSystolic,
    bpDiastolic,
    pulseRecorded,
    pulseRate,
    spo2Recorded,
    spo2,
    weight,
    insuranceCoPay,
    discount
  ]);

  // Complete Upfront Billing & Generate Token (Walk-In or Appointment Check-In)
  const handleCompletePaymentAndIssueToken = () => {
    if (isInsufficientCash) {
      clinicAudio.triggerHaptic(35);
      return;
    }
    clinicAudio.triggerHaptic(30);

    const vitalsData = {
      temp: `${temperature}°F`,
      bp: bpRecorded ? `${bpSystolic}/${bpDiastolic} mmHg` : 'Deferred',
      pulse: pulseRecorded ? `${pulseRate} bpm` : 'Deferred',
      spo2: spo2Recorded ? `${spo2}%` : 'Deferred',
      weight: `${weight} kg`,
      recorded: true,
      isMeasured: true,
      tempRecorded: true,
      bpRecorded: Boolean(bpRecorded),
      pulseRecorded: Boolean(pulseRecorded),
      spo2Recorded: Boolean(spo2Recorded),
      deferredVitals: [
        !bpRecorded && 'Blood Pressure',
        !pulseRecorded && 'Pulse Rate',
        !spo2Recorded && 'SpO2 Oxygen'
      ].filter(Boolean)
    };

    const isPayInCabin = paymentMethod === 'CASH' && Number(cashTendered || 0) === 0;
    const isPaidUpfront = (
      netPayable === 0 ||
      paymentMethod === 'CARD' ||
      paymentMethod === 'ONLINE' ||
      paymentMethod === 'TOUCH_PAY_UPI' ||
      (paymentMethod === 'CASH' && Number(cashTendered || 0) >= netPayable)
    );

    const billingData = {
      paymentMethod,
      insuranceCoPay: Number(insuranceCoPay),
      discount: Number(discount),
      cashTendered: paymentMethod === 'CASH' ? Number(cashTendered || 0) : null,
      paymentLocation: isPayInCabin ? 'DOCTOR_CABIN' : (isPaidUpfront ? 'COUNTER' : 'CASHIER')
    };

    let result;
    if (isAppointmentCheckIn && matchedAppointment) {
      result = checkInAppointment(matchedAppointment.id, vitalsData, billingData);
    } else {
      result = registerPatient(
        {
          patientName: patientName.trim() || 'Anonymous Patient',
          age: age ? parseInt(age, 10) : 35,
          gender,
          phone: phone.trim(),
          symptoms: selectedSymptoms,
          cabinId: selectedCabinId,
          bookingType,
          timeSlot: bookingType === 'SLOT' ? selectedSlot : null,
          vitals: vitalsData,
          services: [
            {
              id: `srv-c${targetCabin.cabinId}`,
              name: `Specialist Consultation (${targetCabin.department})`,
              price: targetCabin.consultationFee,
              category: 'Consultation',
              code: `CON-0${targetCabin.cabinId}`
            }
          ]
        },
        billingData
      );
    }

    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}
    setHasSavedDraft(false);
    setDraftInfo(null);

    setIssuedResult(result);
    setCurrentStep(7);
    if (clinicSettings?.printerSettings?.autoPrintOnToken) {
      setShowQueueTokenModal(true);
    }
  };

  // Clinic Lock Suspension Gate
  if (isCurrentClinicLocked) {
    return (
      <div className="flex-1 min-h-[500px] bg-slate-950 text-white flex items-center justify-center p-6 select-none relative overflow-hidden">
        <div className="absolute inset-0 bg-radial from-rose-950/20 via-slate-950 to-slate-950"></div>
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

  // Kiosk PIN Security Lock Overlay
  if (kioskLockState?.isLocked) {
    const isCooldown = kioskLockState.lockoutUntil && Date.now() < kioskLockState.lockoutUntil;
    const currentDevice = activeClinic?.kioskDevices?.find((d) => d.id === selectedKioskDeviceId) || activeClinic?.kioskDevices?.[0];

    return (
      <div className="flex-1 min-h-[600px] bg-slate-900 text-white flex items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
        <div className="absolute inset-0 bg-radial from-slate-800/50 via-slate-900 to-slate-950"></div>
        <div className="relative z-10 max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mb-4 shadow-lg shadow-teal-900/20">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Kiosk Terminal Locked</h2>
          <p className="text-xs text-slate-400 mt-1 mb-4 text-center">
            {currentDevice?.name || 'Reception Main Kiosk'} ({currentDevice?.id || 'KIOSK-01'})
          </p>

          {/* Multi-Device Selector if multiple configured */}
          {activeClinic?.kioskDevices?.length > 1 && (
            <div className="flex gap-1.5 mb-4 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
              {activeClinic.kioskDevices.map((dev) => (
                <button
                  key={dev.id}
                  type="button"
                  onClick={() => {
                    clinicAudio.triggerHaptic(10);
                    setSelectedKioskDeviceId(dev.id);
                    setPinInput('');
                    setPinError('');
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    selectedKioskDeviceId === dev.id
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {dev.name.split(' ')[0]}
                </button>
              ))}
            </div>
          )}

          {/* Masked PIN Dots Display [ • • • • ] */}
          <div className="flex items-center justify-center gap-3 my-4">
            {[0, 1, 2, 3].map((idx) => {
              const hasDigit = pinInput.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                    hasDigit
                      ? 'border-teal-400 bg-teal-500/20 text-teal-300 scale-105'
                      : 'border-slate-700 bg-slate-900/60 text-slate-600'
                  }`}
                >
                  {hasDigit ? '•' : ''}
                </div>
              );
            })}
          </div>

          {/* Error or Lockout Alert */}
          {pinError && (
            <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 px-3 py-1.5 rounded-xl font-bold mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

          {/* Touch Numpad Grid */}
          <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px] my-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                disabled={isCooldown}
                onClick={() => handlePinDigit(String(num))}
                className="h-14 rounded-2xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 text-white text-xl font-black flex items-center justify-center active:scale-95 transition-all cursor-pointer disabled:opacity-40"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              disabled={isCooldown}
              onClick={handlePinClear}
              className="h-14 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-400 text-xs font-bold flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={isCooldown}
              onClick={() => handlePinDigit('0')}
              className="h-14 rounded-2xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 text-white text-xl font-black flex items-center justify-center active:scale-95 transition-all cursor-pointer disabled:opacity-40"
            >
              0
            </button>
            <button
              type="button"
              disabled={isCooldown}
              onClick={handlePinBackspace}
              className="h-14 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-400 text-xs font-bold flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            >
              ⌫
            </button>
          </div>

          <button
            type="button"
            disabled={pinInput.length < 4 || isCooldown}
            onClick={handleManualUnlockSubmit}
            className="w-full max-w-[280px] mt-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-black rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30 active:scale-95 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <KeyRound className="w-4 h-4" />
            <span>Unlock Terminal</span>
          </button>

          <p className="text-[10px] text-slate-500 mt-4 text-center">
            Authorized clinic staff access only. Enter assigned terminal PIN to unlock.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-100/70 text-slate-800 flex flex-col justify-between p-2 sm:p-2.5 md:p-3 select-none relative font-sans overflow-hidden min-h-0 h-full">
      {/* Top Professional Header Bar with Brand & Manual Lock Button */}
      <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          {clinicSettings?.displayLogo ? (
            <img src={clinicSettings.displayLogo} alt="Clinic Logo" className="h-8 max-w-[120px] object-contain rounded" />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
              <Heart className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className="text-xs font-black text-slate-900 tracking-tight leading-none">
              {activeClinic?.name || clinicSettings?.clinicName}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {activeClinic?.kioskDevices?.[0]?.name || 'Reception Kiosk Terminal'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Online
          </div>

          <WorkstationHeaderControls onLock={lockKiosk} />
        </div>
      </div>
      {/* =========================================================================
          STEP 0: HERO ATTRACT / TOUCH TO START SCREEN
          ========================================================================= */}
      
      {/* Dynamic Wizard Steps Wrapped in StepErrorBoundary for Fault-Tolerant Step Recovery */}
      <StepErrorBoundary onRetry={() => {}} onGoBack={() => setCurrentStep((prev) => prev === 'CHECKIN_SEARCH' ? 0 : Math.max(0, prev - 1))}>
      {/* =========================================================================
          STEP 'CHECKIN_SEARCH': APPOINTMENT ARRIVAL LOOKUP & CHECK-IN
          ========================================================================= */}
      {currentStep === 'CHECKIN_SEARCH' && (
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full min-h-0 overflow-y-auto">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-wider block">Arrival Desk</span>
                <VirtualKeyboardToggle inputMode={inputMode} onToggle={toggleVirtualKeyboard} isTouchDevice={isTouchDevice} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-blue-950 mt-0.5">Appointment Arrival Check-in</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {showVirtualKeyboard
                  ? 'Enter your phone number or appointment reference using touch keypad or physical keyboard.'
                  : 'Type your phone number or appointment reference directly with physical keyboard.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                clinicAudio.triggerHaptic(15);
                setCurrentStep(0);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Cancel / Back</span>
            </button>
          </div>

          <div className={showVirtualKeyboard ? "grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0" : "flex flex-col space-y-4 flex-1 min-h-0"}>
            {/* Search Input & Results */}
            <div className={`${showVirtualKeyboard ? 'lg:col-span-7' : 'w-full'} flex flex-col space-y-4 min-h-0`}>
              <div className="p-4 rounded-3xl bg-white border-2 border-indigo-100 shadow-xs space-y-2">
                <label htmlFor="appointment-search-input" className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">
                  Search By Phone Number or Reference:
                </label>
                <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-200 flex items-center justify-between gap-2">
                  <input
                    id="appointment-search-input"
                    ref={appointmentSearchInputRef}
                    type="text"
                    value={appointmentSearchQuery}
                    onChange={(e) => setAppointmentSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const matches = searchAppointment(appointmentSearchQuery.trim());
                        if (matches.length > 0) {
                          handleSelectAppointmentForCheckIn(matches[0]);
                        }
                      }
                    }}
                    placeholder="Type phone (e.g. 555-0199) or APT reference..."
                    className="w-full bg-transparent text-lg font-mono font-black text-indigo-950 tracking-wide focus:outline-none placeholder:text-slate-400 placeholder:font-normal placeholder:font-sans placeholder:text-xs"
                    autoFocus
                  />
                  {appointmentSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setAppointmentSearchQuery('');
                        appointmentSearchInputRef.current?.focus();
                      }}
                      className="px-2 py-1 rounded-lg bg-indigo-200 hover:bg-indigo-300 text-indigo-900 text-xs font-bold shrink-0 cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Populated & Matched Appointments List */}
              <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 overflow-y-auto space-y-3 min-h-[220px]">
                {(() => {
                  const filtered = searchAppointment(appointmentSearchQuery.trim());
                  const isSearching = Boolean(appointmentSearchQuery.trim());

                  return (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                            {isSearching ? 'Search Results' : "Today's Scheduled Appointments"}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-black">
                            {filtered.length} {filtered.length === 1 ? 'Visit' : 'Visits'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSearching ? (
                            <button
                              type="button"
                              onClick={() => {
                                setAppointmentSearchQuery('');
                                appointmentSearchInputRef.current?.focus();
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                            >
                              Show All Appointments
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-indigo-500" />
                              Touch or click appointment card to check in
                            </span>
                          )}
                        </div>
                      </div>

                      {filtered.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                          <AlertCircle className="w-9 h-9 mx-auto mb-2 text-slate-300" />
                          <p className="text-xs font-bold text-slate-700">
                            {isSearching
                              ? `No matching appointment records found for "${appointmentSearchQuery}".`
                              : 'No scheduled appointments registered for today.'}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {isSearching
                              ? 'Please verify your entered phone digits or reference number.'
                              : 'You can register directly as a walk-in patient from the main screen.'}
                          </p>
                          {isSearching ? (
                            <button
                              type="button"
                              onClick={() => {
                                setAppointmentSearchQuery('');
                                appointmentSearchInputRef.current?.focus();
                              }}
                              className="mt-3 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all cursor-pointer"
                            >
                              View All Scheduled Appointments
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setIsAppointmentCheckIn(false);
                                setCurrentStep(1);
                              }}
                              className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all cursor-pointer"
                            >
                              Register as Walk-in Patient
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filtered.map((apt) => {
                            const isCheckedIn = apt.status === 'CHECKED_IN';
                            const isOverdue = apt.status === 'OVERDUE';

                            return (
                              <div
                                key={apt.id || apt.appointmentNumber}
                                onClick={() => {
                                  if (!isCheckedIn) {
                                    handleSelectAppointmentForCheckIn(apt);
                                  }
                                }}
                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs ${
                                  isCheckedIn
                                    ? 'border-slate-200 bg-slate-50/70 opacity-75 cursor-default'
                                    : 'border-indigo-100 hover:border-indigo-500 bg-gradient-to-r from-white via-indigo-50/20 to-white hover:to-indigo-50/40 cursor-pointer group hover:shadow-md'
                                }`}
                              >
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                    <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white font-mono font-black text-xs tracking-wider shadow-2xs">
                                      {apt.appointmentNumber}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-[11px] font-bold">
                                      Cabin {apt.cabinId}: {apt.department}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                                      {apt.date || 'Today'}, {apt.timeSlot}
                                    </span>
                                    {isOverdue && (
                                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wide">
                                        Overdue - Priority
                                      </span>
                                    )}
                                    {isCheckedIn && (
                                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wide">
                                        Already Checked-in
                                      </span>
                                    )}
                                  </div>

                                  <div className="pt-0.5">
                                    <h4 className="font-black text-base sm:text-lg text-slate-900 group-hover:text-indigo-950 transition-colors">
                                      {apt.patientName}
                                    </h4>
                                    <p className="text-xs text-slate-600 font-medium">
                                      Doctor: <strong className="text-slate-800">{apt.doctorName}</strong>
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                    <span>
                                      {apt.gender || 'Patient'}
                                      {apt.age ? `, ${apt.age}y` : ''}
                                    </span>
                                    {apt.phone && (
                                      <>
                                        <span className="text-slate-300">•</span>
                                        <span className="font-mono text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-100 font-bold text-[11px]">
                                          📞 {apt.phone}
                                        </span>
                                      </>
                                    )}
                                    {apt.symptoms && (
                                      <>
                                        <span className="text-slate-300">•</span>
                                        <span className="text-slate-500 text-[11px] italic">
                                          {Array.isArray(apt.symptoms) ? apt.symptoms.join(', ') : apt.symptoms}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div className="w-full sm:w-auto shrink-0 flex items-center justify-end pt-2 sm:pt-0">
                                  {isCheckedIn ? (
                                    <span className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center gap-1.5">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                      <span>Checked In</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectAppointmentForCheckIn(apt);
                                      }}
                                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 group-hover:shadow-lg transition-all cursor-pointer"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span>Proceed to Check-in</span>
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Right: Touch Numpad for Phone / APT Input (Only shown on touch or when toggled ON) */}
            {showVirtualKeyboard && (
              <div className="lg:col-span-5 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center">
                <div className="text-xs font-bold text-slate-500 mb-3 text-center flex items-center justify-center gap-2">
                  <span>Touch Keypad:</span>
                  <span className="text-[10px] text-teal-600 font-medium">(Physical typing also active)</span>
                </div>
                <TouchNumpad
                  value={appointmentSearchQuery}
                  onChange={(val) => setAppointmentSearchQuery(val)}
                  onEnter={() => {
                    const matches = searchAppointment(appointmentSearchQuery);
                    if (matches.length > 0) {
                      handleSelectAppointmentForCheckIn(matches[0]);
                    }
                  }}
                  maxLength={15}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 'EMERGENCY_TRIAGE': EMERGENCY & MINOR PROCEDURES FAST-TRACK
          ========================================================================= */}
      {currentStep === 'EMERGENCY_TRIAGE' && (
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full min-h-0 overflow-y-auto pr-1">
          {/* Top Banner */}
          <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 pb-2.5 border-b border-rose-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white font-mono font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>Cabin {emergencySettings?.defaultCabinId || 1} • Treatment Room Priority</span>
                </span>
                <span className="text-xs font-black text-rose-700 uppercase tracking-wider">Emergency Fast-Track</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 flex items-center gap-2">
                <span>Emergency & Minor Procedures Triage</span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Select required procedure(s) for immediate clinical setup (Bandage, Foley Catheter, IV Cannula, Nebulization, Injections).
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                clinicAudio.triggerHaptic(15);
                setCurrentStep(0);
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Cancel / Back to Home</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
            {/* Left Column (7 cols): Minor Procedures Selection */}
            <div className="lg:col-span-7 flex flex-col space-y-3 min-h-0">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  Select Required Minor Procedure(s):
                </span>
                <span className="text-[11px] font-bold text-rose-700">
                  {selectedEmergencyProcedures.length} Selected
                </span>
              </div>

              {/* Procedure Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto max-h-[340px] sm:max-h-[420px] lg:max-h-[480px] p-1">
                {(emergencyProcedures || []).map((proc) => {
                  const isSelected = selectedEmergencyProcedures.includes(proc.id);
                  return (
                    <div
                      key={proc.id}
                      onClick={() => handleToggleEmergencyProcedure(proc.id)}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between text-left shadow-2xs ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50/50 shadow-md ring-2 ring-rose-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`px-2 py-0.5 rounded-md font-mono font-black text-[10px] ${
                            isSelected ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {proc.code}
                          </span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            proc.severity === 'CRITICAL'
                              ? 'bg-red-100 text-red-800'
                              : proc.severity === 'URGENT'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}>
                            {proc.severity}
                          </span>
                        </div>

                        <h4 className="font-black text-xs text-slate-900 leading-snug">
                          {proc.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">
                          {proc.description}
                        </p>

                        {/* Consumables preview */}
                        {proc.consumables && proc.consumables.length > 0 && (
                          <div className="mt-1.5 pt-1.5 border-t border-slate-100 text-[9px] text-slate-600 font-medium">
                            <span className="font-bold text-slate-700">Supplies: </span>
                            {proc.consumables.slice(0, 2).join(', ')}
                            {proc.consumables.length > 2 && ` +${proc.consumables.length - 2} more`}
                          </div>
                        )}
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-900">
                          {formatCurrency(proc.price)}
                        </span>
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-black ${
                          isSelected ? 'bg-rose-600 text-white' : 'border border-slate-300 text-transparent'
                        }`}>
                          ✓
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Anatomical Site / Treatment Room Note */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider block">
                  Procedure Site / Anatomical Target:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[`Treatment Room / Cabin ${emergencySettings?.defaultCabinId || 1}`, 'Right Forearm / Arm', 'Left Dorsal Hand', 'Urethral / Bladder', 'Chest / Lungs', 'Head / Laceration', 'Knee / Leg'].map((site) => (
                    <button
                      key={site}
                      type="button"
                      onClick={() => setProcedureSiteInput(site)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        procedureSiteInput === site
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {site}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Triage Priority, Patient Info & Dispatch */}
            <div className="lg:col-span-5 flex flex-col space-y-3 min-h-0">
              {/* Triage Severity Level */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider block">
                  Triage Severity Classification:
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  {[
                    { key: 'CRITICAL', label: 'Critical', sub: 'Immediate', color: 'bg-rose-600 text-white border-rose-600' },
                    { key: 'URGENT', label: 'Urgent', sub: 'Acute Care', color: 'bg-amber-600 text-white border-amber-600' },
                    { key: 'PRIORITY', label: 'Priority', sub: 'Elective Minor', color: 'bg-blue-600 text-white border-blue-600' }
                  ].map((lvl) => (
                    <button
                      key={lvl.key}
                      type="button"
                      onClick={() => {
                        clinicAudio.triggerHaptic(15);
                        setEmergencySeverity(lvl.key);
                      }}
                      className={`p-2 rounded-xl border-2 transition-all cursor-pointer text-left flex flex-col items-center justify-center ${
                        emergencySeverity === lvl.key
                          ? `${lvl.color} shadow-sm font-black`
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-[11px] font-black">{lvl.label}</span>
                      <span className="text-[9px] opacity-80">{lvl.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Patient Quick Demographics */}
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                    Patient Demographics:
                  </span>
                  {emergencySettings?.expressPassEnabled !== false && (
                    <button
                      type="button"
                      onClick={() => {
                        clinicAudio.triggerHaptic(15);
                        setEmergencyQuickPass(!emergencyQuickPass);
                        if (!emergencyQuickPass) {
                          setPatientName('Emergency Trauma Patient');
                          setAge('35');
                          setGender('Male');
                        } else {
                          setPatientName('');
                        }
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 cursor-pointer transition-colors ${
                        emergencyQuickPass ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>⚡ Trauma Express Pass</span>
                    </button>
                  )}
                </div>

                {!emergencyQuickPass ? (
                  <div className="space-y-2">
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Patient Name</label>
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="e.g. Arthur Pendelton"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Age</label>
                        <input
                          type="number"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          placeholder="e.g. 38"
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Gender</label>
                        <select
                          value={gender}
                          onChange={(e) => setGender(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-500"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Child">Child</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Contact Phone</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 0300-1234567"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                    <p className="font-bold">⚡ Trauma Express Active</p>
                    <p className="text-[10px] text-amber-700 mt-0.5">
                      Demographics bypassed to save critical seconds. Full details will be completed in Cabin {emergencySettings?.defaultCabinId || 1} Treatment Room.
                    </p>
                  </div>
                )}
              </div>

              {/* Order Summary & Dispatch Button */}
              <div className="p-3.5 bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl border-2 border-rose-200 space-y-3 mt-auto">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Total Procedure Fee:</span>
                  <span className="text-base font-black text-rose-700 font-mono">
                    {formatCurrency(
                      (emergencyProcedures || [])
                        .filter((p) => selectedEmergencyProcedures.includes(p.id))
                        .reduce((acc, p) => acc + p.price, 0)
                    )}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  Priority routing to <strong>Cabin {emergencySettings?.defaultCabinId || 1} ({cabins.find(c => c.cabinId === (emergencySettings?.defaultCabinId || 1))?.cabinName || 'Treatment Room'})</strong>. Payment can be settled in cabin or at cashier desk.
                </div>

                <button
                  type="button"
                  onClick={handleConfirmEmergencyIntake}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-700 hover:to-red-800 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30 active:scale-95 transition-all cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-300" />
                  <span>Issue Emergency Token (EMG) & Dispatch &gt;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-4xl mx-auto w-full px-2 sm:px-4 py-1 sm:py-2 min-h-0 overflow-y-auto no-scrollbar">
          {/* Unfinished Intake Draft Recovery Banner */}
          {hasSavedDraft && draftInfo && (
            <div className="w-full max-w-2xl mb-2 p-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-xs text-left shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-amber-950">
                    Unfinished Intake Draft Available
                  </div>
                  <div className="text-[10px] text-amber-800">
                    Saved intake data found for <strong>{draftInfo.patientName || 'Walk-in Patient'}</strong> (Step {draftInfo.currentStep} of 6).
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={restoreDraft}
                  className="flex-1 sm:flex-none px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all"
                >
                  Resume Intake
                </button>
                <button
                  type="button"
                  onClick={discardDraft}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl border border-amber-200 transition-all"
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          {/* Medical Icon Badge in AKUH Crimson */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#8B0029] via-[#A61238] to-[#68001F] text-white flex items-center justify-center shadow-md shadow-rose-950/20 mb-1 shrink-0">
            <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-50 border border-rose-200/80 text-[#8B0029] text-[10px] font-extrabold uppercase tracking-wider mb-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B0029] animate-pulse"></span>
            Patient Self-Service Medical Intake Terminal
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-0.5 leading-tight shrink-0">
            Welcome to <span className="text-[#8B0029]">{clinicSettings?.clinicName || 'Fatima Clinic & Diagnostic Center'}</span>
          </h1>

          <p className="text-xs text-slate-500 max-w-md mb-2 leading-tight font-normal shrink-0">
            {clinicSettings?.subtitle || 'Touch below for walk-in OPD token, pre-booked appointment, or fast-track emergency intake.'}
          </p>



          {/* Compact Doctor Cabin Availability Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 sm:gap-2 w-full max-w-3xl mb-2 sm:mb-2.5 shrink-0">
            {cabins.map((c) => (
              <div key={c.cabinId} className="bg-white border border-slate-200/80 rounded-xl p-1.5 shadow-2xs text-center flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                  {c.image ? (
                    <img src={c.image} alt={c.doctorName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs">👨‍⚕️</span>
                  )}
                </div>
                <div className="text-left min-w-0 flex-1">
                  <div className="text-[9px] font-black text-[#8B0029] uppercase tracking-wide truncate">{c.cabinName}</div>
                  <div className="text-[10px] font-bold text-slate-800 truncate leading-tight">{c.department}</div>
                  <div className="text-[8.5px] text-slate-500 font-semibold">{currencySymbol}{c.consultationFee}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Emergency & Minor Procedures Urgent Triage Banner */}
          {emergencySettings?.fastTrackKioskEnabled !== false && (
            <div className="w-full max-w-3xl mb-2 sm:mb-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(30);
                  if (emergencySettings?.soundAlertsEnabled !== false) {
                    clinicAudio.playEmergencyChime();
                  }
                  setIsAppointmentCheckIn(false);
                  setBookingType('EMERGENCY');
                  setSelectedEmergencyProcedures(['emg-proc-1']);
                  setCurrentStep('EMERGENCY_TRIAGE');
                }}
                className="w-full p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-[#8B0029] via-rose-700 to-[#68001F] hover:from-[#750022] hover:to-[#550019] text-white shadow-sm border border-rose-400/80 text-left transition-all transform active:scale-98 flex items-center justify-between gap-3 group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shrink-0 border border-white/30 shadow-inner group-hover:scale-105 transition-transform">
                    <AlertTriangle className="w-5 h-5 text-amber-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/25 text-white text-[9px] font-black uppercase tracking-wider mb-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                      <span>Urgent Care & Minor Procedures</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                      Fast-Track Emergency Triage
                    </h3>
                    <p className="text-[11px] text-rose-100 leading-tight truncate">
                      Immediate priority intake for <strong>Wound Dressing</strong>, <strong>Catheterization</strong>, <strong>IV Cannula</strong>, & <strong>Injections</strong>.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-[#8B0029] font-black text-xs shadow-xs group-hover:bg-rose-50 transition-colors">
                  <span>Emergency Triage</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            </div>
          )}

          {/* 2 Primary Medical Touch Workflows with Healthcare Pictures */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 w-full max-w-3xl shrink-0">
            {/* Option 1: Walk-In Touch Action */}
            <button
              type="button"
              onClick={() => {
                clinicAudio.triggerHaptic(25);
                setIsAppointmentCheckIn(false);
                setBookingType('WALK_IN');
                setCurrentStep(1);
              }}
              className="p-3 sm:p-3.5 rounded-2xl bg-white hover:bg-rose-50/40 border-2 border-rose-300 hover:border-[#8B0029] shadow-sm shadow-rose-950/5 text-left transition-all transform active:scale-98 flex items-center justify-between gap-3 group cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform">
                  <img
                    src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&auto=format&fit=crop&q=80"
                    alt="Walk-in Consultation"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="inline-block px-1.5 py-0.5 rounded-md bg-rose-100 text-[#8B0029] text-[9px] font-black uppercase tracking-wider mb-0.5">
                    Direct OPD Token
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight">
                    Immediate Walk-in
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                    No booking needed. Choose symptoms, doctor, vitals, and get your live token slip.
                  </p>
                </div>
              </div>
              <div className="shrink-0 w-8 h-8 rounded-xl bg-rose-50 text-[#8B0029] group-hover:bg-[#8B0029] group-hover:text-white flex items-center justify-center transition-colors">
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Option 2: Appointment Check-In Touch Action */}
            <button
              type="button"
              onClick={() => {
                clinicAudio.triggerHaptic(25);
                setIsAppointmentCheckIn(true);
                setCurrentStep('CHECKIN_SEARCH');
              }}
              className="p-3 sm:p-3.5 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-300 hover:border-slate-500 shadow-sm shadow-slate-900/5 text-left transition-all transform active:scale-98 flex items-center justify-between gap-3 group cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform">
                  <img
                    src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop&q=80"
                    alt="Appointment Check-in"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="inline-block px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[9px] font-black uppercase tracking-wider mb-0.5">
                    Pre-Booked Slot
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight">
                    Appointment Check-in
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                    Already have a booking? Tap with your mobile number for your priority queue token.
                  </p>
                </div>
              </div>
              <div className="shrink-0 w-8 h-8 rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-800 group-hover:text-white flex items-center justify-center transition-colors">
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 1: SYMPTOMS & TRIAGE CHECKLIST
          ========================================================================= */}
      {/* =========================================================================
          STEP 1: SYMPTOMS & TRIAGE CHECKLIST (AUTO-ADVANCE ON SELECTION)
          ========================================================================= */}
      {currentStep === 1 && (
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full min-h-0">
          <div className="mb-2.5 flex items-center justify-between gap-3 shrink-0">
            <div>
              <span className="text-[11px] font-black text-blue-600 uppercase tracking-wider block">Step 1 of 6 • Triage Checklist</span>
              <h2 className="text-xl sm:text-2xl font-black text-blue-950 leading-tight">Select Chief Symptoms or Concern</h2>
            </div>
            {selectedSymptoms.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(20);
                  setCurrentStep(2);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Add for Next Step ({selectedSymptoms.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-400 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 cursor-not-allowed opacity-75"
              >
                <span>Select Symptom to Add for Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Specialty Filter Chips */}
          <div className="mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0 no-scrollbar">
            {['All', 'Cardiology', 'Dermatology', 'Orthopedics', 'Pediatrics', 'Internal Medicine', 'Clinical OPD'].map((dept) => {
              const isActive = (selectedDepartment || 'All') === dept;
              return (
                <button
                  key={dept}
                  type="button"
                  onClick={() => {
                    clinicAudio.triggerHaptic(10);
                    setSelectedDepartment(dept);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#8B0029] to-[#9E1238] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {dept === 'All' ? '🌟 All Symptoms (12)' : dept}
                </button>
              );
            })}
          </div>

          {/* Symptom Cards Grid with Gemini 3D Energetic Images */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto flex-1 min-h-0 p-1">
            {(symptoms && symptoms.length > 0 ? symptoms : SYMPTOM_OPTIONS)
              .filter((item) => {
                if (!selectedDepartment || selectedDepartment === 'All') return true;
                return item.dept?.toLowerCase().includes(selectedDepartment.toLowerCase());
              })
              .map((item) => {
                const isSelected = selectedSymptoms.includes(item.label);
                // Resolve 3D energetic image from symptom object or fallback
                const symptomImage = item.image || SYMPTOM_OPTIONS.find((s) => s.id === item.id)?.image || null;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSymptom(item)}
                    className={`group rounded-3xl border-2 text-left transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'border-[#8B0029] bg-rose-50/70 shadow-lg ring-2 ring-rose-400/50 transform scale-[1.01]'
                        : 'border-slate-200 bg-white hover:border-rose-300 hover:shadow-md hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Energetic 3D Medical Illustration Header */}
                    <div className="relative w-full h-28 sm:h-32 bg-slate-100 overflow-hidden shrink-0">
                      {symptomImage ? (
                        <img
                          src={symptomImage}
                          alt={item.label}
                          className={`w-full h-full object-cover object-center transition-transform duration-500 ease-out ${
                            isSelected ? 'scale-105' : 'group-hover:scale-108'
                          }`}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-tr from-slate-100 to-slate-200">
                          {item.icon}
                        </div>
                      )}
                      
                      {/* Gradient Overlay for Text Legibility */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25 pointer-events-none" />

                      {/* Department Tag Pill */}
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[9.5px] font-black tracking-wide flex items-center gap-1.5 shadow-xs border border-white/20">
                        <span className="text-xs">{item.icon}</span>
                        <span>{item.dept}</span>
                      </div>

                      {/* Selected Badge or Status Pin */}
                      <div className="absolute top-2 right-2">
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-[#8B0029] text-white flex items-center justify-center font-black shadow-md border-2 border-white animate-in zoom-in-75">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-black/40 backdrop-blur-xs text-white/80 group-hover:text-white flex items-center justify-center text-xs font-black border border-white/20 shadow-xs">
                            +
                          </div>
                        )}
                      </div>

                      {/* Recommended Cabin Badge */}
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-[#8B0029] text-[9px] font-extrabold shadow-xs">
                        Cabin #{item.cabinId || 1} • {item.doctorName?.split(',')[0]}
                      </div>
                    </div>

                    {/* Text Details Area */}
                    <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className={`font-black text-xs sm:text-sm leading-snug tracking-tight ${
                          isSelected ? 'text-[#8B0029]' : 'text-slate-900 group-hover:text-[#8B0029]'
                        }`}>
                          {item.label}
                        </h3>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium line-clamp-2 mt-1 leading-snug">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                          Triage Match
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] transition-all ${
                          isSelected
                            ? 'bg-[#8B0029] text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-rose-100 group-hover:text-[#8B0029]'
                        }`}>
                          {isSelected ? 'Selected ✓' : 'Tap to Add +'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 2: SELECT SPECIALIST PHYSICIAN & CABIN (AUTO-ADVANCE ON SELECTION)
          ========================================================================= */}
      {currentStep === 2 && (
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full min-h-0">
          <div className="mb-2 flex items-center justify-between gap-2 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-teal-700 bg-teal-100/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Step 2 of 6 • Specialist Doctors
                </span>
                <span className="text-xs text-slate-500 font-medium">Tap any physician card to select and proceed</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">Select Doctor & Cabin</h2>
            </div>
          </div>

          {/* Responsive Visual Grid with Distinct Pastel Colors (Zero Dropdowns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 overflow-y-auto flex-1 min-h-0 p-1">
            {cabins.map((cabin) => {
              const isSelected = selectedCabinId === cabin.cabinId;
              const waitTime = getEstimatedWaitTime(cabin.cabinId);
              const theme = getDoctorTheme(cabin.cabinId);

              return (
                <button
                  key={cabin.cabinId}
                  type="button"
                  onClick={() => {
                    clinicAudio.triggerHaptic(20);
                    setSelectedCabinId(cabin.cabinId);
                    setTimeout(() => {
                      setCurrentStep(3);
                    }, 120);
                  }}
                  className={`p-3 rounded-2xl border-2 text-left transition-all duration-200 flex flex-col justify-between shadow-2xs cursor-pointer relative overflow-hidden group ${theme.bg} ${
                    isSelected
                      ? `border-slate-800 ring-2 ${theme.ring} shadow-md scale-[1.01]`
                      : `${theme.border} hover:border-slate-400 hover:shadow-2xs`
                  }`}
                >
                  {/* Selected Badge Banner */}
                  {isSelected && (
                    <div className="absolute top-0 right-0 bg-slate-900 text-white text-[9px] font-black px-2.5 py-0.5 rounded-bl-xl shadow-xs flex items-center gap-1 uppercase tracking-wider">
                      <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                      <span>Selected</span>
                    </div>
                  )}

                  <div>
                    {/* Header Row: Cabin Name & Live Status */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider border ${theme.tagBg}`}>
                        {cabin.cabinName}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs ${
                        cabin.status === 'IN_CONSULTATION'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}>
                        {cabin.status === 'IN_CONSULTATION' ? 'In Consultation' : 'Available'}
                      </span>
                    </div>

                    {/* Doctor Identity & Portrait */}
                    <div className="flex items-start gap-2.5 mb-2">
                      <div className="relative shrink-0">
                        {cabin.image ? (
                          <img
                            src={cabin.image}
                            alt={cabin.doctorName}
                            className="w-11 h-11 rounded-xl object-cover border border-white shadow-2xs"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-white/80 border border-white text-xl flex items-center justify-center shadow-2xs">
                            {cabin.avatar || '👨‍⚕️'}
                          </div>
                        )}
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center text-[7px] font-black ${
                          cabin.status === 'IN_CONSULTATION' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                        }`}>
                          ●
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-xs sm:text-sm text-slate-900 leading-tight truncate">
                          {cabin.doctorName}
                        </h3>
                        <div className={`text-[11px] font-black mt-0.5 truncate ${theme.text}`}>
                          {cabin.department}
                        </div>
                        <p className="text-[10px] text-slate-600 truncate mt-0.5 font-medium">
                          {cabin.qualifications || cabin.title}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Stats: Fee & Live Wait Time */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 text-[8px] uppercase font-bold tracking-wider block">Fee</span>
                      <span className="font-black text-slate-900 text-xs sm:text-sm">
                        {formatCurrency(cabin.consultationFee)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-500 text-[8px] uppercase font-bold tracking-wider block">Est. Wait</span>
                      <span className="inline-flex items-center gap-1 font-black text-[11px] text-slate-800 bg-white/90 px-2 py-0.5 rounded-lg border border-slate-200">
                        <Clock className="w-3 h-3 text-teal-600" />
                        <span>{waitTime} mins</span>
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 3: WALK-IN VS APPOINTMENT SLOT (AUTO-ADVANCE ON SELECTION)
          ========================================================================= */}
      {currentStep === 3 && (
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full min-h-0">
          <div className="mb-2.5 flex items-center justify-between shrink-0">
            <div>
              <span className="text-[11px] font-black text-blue-600 uppercase tracking-wider block">Step 3 of 6 • Visit Schedule</span>
              <h2 className="text-xl sm:text-2xl font-black text-blue-950 leading-tight">Choose Visit Type</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Tap an option to proceed</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                clinicAudio.triggerHaptic(20);
                setBookingType('WALK_IN');
                setTimeout(() => {
                  setCurrentStep(4);
                }, 120);
              }}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                bookingType === 'WALK_IN'
                  ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-400/30 shadow-xs scale-[1.01]'
                  : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-black text-blue-950">Immediate Walk-in Queue Token</h3>
                    <ChevronRight className="w-4 h-4 text-blue-600 shrink-0" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Join live waiting queue immediately. Receive a live token number (e.g. C-104).
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                clinicAudio.triggerHaptic(15);
                setBookingType('SLOT');
              }}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                bookingType === 'SLOT'
                  ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-400/30 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-black text-blue-950">Book Consultation Slot</h3>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md uppercase">Select Slot ↓</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Reserve a consultation slot with {targetCabin.doctorName.split(',')[0]}.
                  </p>
                </div>
              </div>
            </button>
          </div>

          {bookingType === 'SLOT' && (
            <div className="bg-white border border-blue-100 rounded-2xl p-3 shadow-2xs space-y-2.5 flex-1 min-h-0 overflow-y-auto">
              {/* Day Selector: Today vs Tomorrow */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-black text-blue-900 uppercase tracking-wider">
                  Select Consultation Date:
                </span>
                <div className="flex bg-blue-50 p-0.5 rounded-xl border border-blue-200">
                  {['Today', 'Tomorrow'].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        clinicAudio.triggerHaptic(15);
                        setSelectedDate(day);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        selectedDate === day
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'text-blue-800 hover:bg-blue-100'
                      }`}
                    >
                      {day === 'Today' ? '📅 Today' : '🌅 Tomorrow'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Smart Future Slots Notice */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600 text-[11px]">
                  Available Slots ({selectedDate}) — Tap any slot to proceed:
                </span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  ✓ Past hours filtered
                </span>
              </div>

              {availableSlots.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          clinicAudio.triggerHaptic(20);
                          setSelectedSlot(slot);
                          setTimeout(() => {
                            setCurrentStep(4);
                          }, 120);
                        }}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          selectedSlot === slot
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-102 font-black'
                            : 'bg-blue-50/60 text-slate-700 border-blue-100 hover:bg-blue-100 hover:border-blue-300'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>

                  {selectedSlot && (
                    <button
                      type="button"
                      onClick={() => {
                        clinicAudio.triggerHaptic(20);
                        setCurrentStep(4);
                      }}
                      className="w-full mt-1.5 py-2 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <span>Proceed with {selectedDate} Slot ({selectedSlot})</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-1">
                  <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
                  <div className="font-black text-amber-900 text-xs">
                    All consultation slots for Today have concluded.
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Switch to Tomorrow to choose from morning and evening available slots.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}


      {/* =========================================================================
          STEP 4: PATIENT DEMOGRAPHICS & ADAPTIVE TOUCH / PHYSICAL KEYBOARD
          ========================================================================= */}
      {currentStep === 4 && (
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full min-h-0">
          <div className="mb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-blue-600 uppercase tracking-wider block">Step 4 of 6 • Patient Demographics</span>
                <VirtualKeyboardToggle inputMode={inputMode} onToggle={toggleVirtualKeyboard} isTouchDevice={isTouchDevice} />
                {bookingType === 'SLOT' && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border tracking-wide transition-all ${
                    isAppointmentInfoComplete
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    {isAppointmentInfoComplete ? '✓ All Information Entered' : '⚠️ All Fields Required to Book'}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-blue-950 leading-tight">Enter Patient Details</h2>
            </div>
            {bookingType === 'SLOT' ? (
              <button
                type="button"
                onClick={handleBookFutureAppointment}
                className={`px-5 py-2.5 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all self-start sm:self-auto border cursor-pointer ${
                  isAppointmentInfoComplete
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md shadow-indigo-500/20 active:scale-95 border-indigo-500'
                    : 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-sm active:scale-95'
                }`}
                title={isAppointmentInfoComplete ? 'Confirm and print appointment slip' : 'Click to validate required fields'}
              >
                <Calendar className="w-4 h-4 shrink-0" />
                <span>{isAppointmentInfoComplete ? 'Confirm & Print Slip' : 'Fill All Info to Confirm'}</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(15);
                  setVitalScreen(1);
                  setCurrentStep(5);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
              >
                <span>Next: Record Vitals</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Validation Alert Banner for Appointment Workflow */}
          {showAppointmentErrorAlert && bookingType === 'SLOT' && (
            <div className="mb-2 p-2.5 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-center justify-between gap-2 text-xs text-rose-950 font-bold animate-in fade-in shrink-0">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Cannot proceed: Please enter patient Full Name, Age, and Contact Phone number before confirming your appointment.</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAppointmentErrorAlert(false)}
                className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>
          )}

          <div className={showVirtualKeyboard ? "grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0 overflow-y-auto" : "max-w-3xl mx-auto w-full flex-1 flex flex-col space-y-2.5 min-h-0 overflow-y-auto"}>
            {/* Demographic Inputs (5 cols if virtual keyboard shown, full width if hidden) */}
            <div className={`${showVirtualKeyboard ? 'lg:col-span-5' : 'w-full'} space-y-2.5 flex flex-col min-h-0`}>
              {/* Full Name Input */}
              <div
                onClick={() => {
                  setInputField('name');
                  nameInputRef.current?.focus();
                }}
                className={`p-2.5 sm:p-3 rounded-xl border-2 transition-all cursor-text ${
                  appointmentErrors.name && bookingType === 'SLOT'
                    ? 'bg-rose-50/40 border-rose-400 ring-2 ring-rose-200'
                    : inputField === 'name'
                      ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-400/20'
                      : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label htmlFor="patient-name-field" className="text-[10px] font-bold uppercase text-slate-500 block">
                    Patient Full Name <span className="text-rose-500 font-black">*</span>
                  </label>
                  {bookingType === 'SLOT' && (
                    <span className="text-[9px] font-black text-rose-600 uppercase tracking-wide">Required for Appointment</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <input
                    id="patient-name-field"
                    ref={nameInputRef}
                    type="text"
                    value={patientName}
                    onChange={(e) => {
                      setPatientName(e.target.value);
                      if (appointmentErrors.name) setAppointmentErrors((prev) => ({ ...prev, name: null }));
                    }}
                    onFocus={() => setInputField('name')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        ageInputRef.current?.focus();
                        setInputField('age');
                      }
                    }}
                    placeholder="Type full name (e.g. John Doe)..."
                    className="w-full bg-transparent text-sm sm:text-base font-black text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
                    autoFocus
                  />
                  {patientName && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPatientName('');
                        nameInputRef.current?.focus();
                      }}
                      className="text-slate-400 hover:text-slate-600 font-bold text-xs p-1 cursor-pointer"
                      title="Clear Name"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {appointmentErrors.name && bookingType === 'SLOT' && (
                  <div className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{appointmentErrors.name}</span>
                  </div>
                )}
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-2 gap-2.5">
                <div
                  onClick={() => {
                    setInputField('age');
                    ageInputRef.current?.focus();
                  }}
                  className={`p-2.5 sm:p-3 rounded-xl border-2 transition-all cursor-text ${
                    appointmentErrors.age && bookingType === 'SLOT'
                      ? 'bg-rose-50/40 border-rose-400 ring-2 ring-rose-200'
                      : inputField === 'age'
                        ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-400/20'
                        : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label htmlFor="patient-age-field" className="text-[10px] font-bold uppercase text-slate-500 block">
                      Age (Years) <span className="text-rose-500 font-black">*</span>
                    </label>
                    {bookingType === 'SLOT' && (
                      <span className="text-[8.5px] font-black text-rose-600 uppercase">Required</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <input
                      id="patient-age-field"
                      ref={ageInputRef}
                      type="text"
                      inputMode="numeric"
                      value={age}
                      onChange={(e) => {
                        setAge(e.target.value.replace(/\D/g, '').slice(0, 3));
                        if (appointmentErrors.age) setAppointmentErrors((prev) => ({ ...prev, age: null }));
                      }}
                      onFocus={() => setInputField('age')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          phoneInputRef.current?.focus();
                          setInputField('phone');
                        }
                      }}
                      placeholder="e.g. 35"
                      className="w-full bg-transparent text-sm sm:text-base font-black text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
                    />
                    {age && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAge('');
                          ageInputRef.current?.focus();
                        }}
                        className="text-slate-400 hover:text-slate-600 font-bold text-xs p-1 cursor-pointer"
                        title="Clear Age"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {appointmentErrors.age && bookingType === 'SLOT' && (
                    <div className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1 animate-in fade-in">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{appointmentErrors.age}</span>
                    </div>
                  )}
                </div>

                <div className="p-2.5 sm:p-3 rounded-xl border-2 bg-white border-slate-200">
                  <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Gender <span className="text-rose-500 font-black">*</span></div>
                  <div className="grid grid-cols-2 gap-1">
                    {['Male', 'Female'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          clinicAudio.triggerHaptic(15);
                          setGender(g);
                        }}
                        className={`py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          gender === g ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Phone Number */}
              <div
                onClick={() => {
                  setInputField('phone');
                  phoneInputRef.current?.focus();
                }}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-text ${
                  appointmentErrors.phone && bookingType === 'SLOT'
                    ? 'bg-rose-50/40 border-rose-400 ring-2 ring-rose-200'
                    : inputField === 'phone'
                      ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-400/20'
                      : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <label htmlFor="patient-phone-field" className="text-[10px] font-bold uppercase text-slate-500 block">
                    Contact / SMS Phone <span className="text-rose-500 font-black">*</span>
                  </label>
                  {bookingType === 'SLOT' && (
                    <span className="text-[9px] font-black text-rose-600 uppercase tracking-wide">Required for SMS Confirm</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <input
                    id="patient-phone-field"
                    ref={phoneInputRef}
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.slice(0, 15));
                      if (appointmentErrors.phone) setAppointmentErrors((prev) => ({ ...prev, phone: null }));
                    }}
                    onFocus={() => setInputField('phone')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (bookingType === 'SLOT') {
                          handleBookFutureAppointment();
                        } else {
                          clinicAudio.triggerHaptic(15);
                          setVitalScreen(1);
                          setCurrentStep(5);
                        }
                      }
                    }}
                    placeholder="e.g. 555-0199"
                    className="w-full bg-transparent text-base font-black text-slate-900 focus:outline-none placeholder:text-slate-400 placeholder:font-normal font-mono"
                  />
                  {phone && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPhone('');
                        phoneInputRef.current?.focus();
                      }}
                      className="text-slate-400 hover:text-slate-600 font-bold text-xs p-1 cursor-pointer"
                      title="Clear Phone"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {appointmentErrors.phone && bookingType === 'SLOT' && (
                  <div className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1 animate-in fade-in">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{appointmentErrors.phone}</span>
                  </div>
                )}
              </div>

              {/* Returning Patient Detection & Quick Demo Chips */}
              {(() => {
                const matches = phone && phone.length >= 3 ? searchPatientHistoryByPhone(phone) : [];
                if (matches.length > 0) {
                  const match = matches[0];
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        clinicAudio.triggerHaptic(20);
                        setPatientName(match.patientName);
                        setAge(String(match.age || 35));
                        setGender(match.gender || 'Male');
                        setPhone(match.phone || phone);
                        setAppointmentErrors({});
                        setShowAppointmentErrorAlert(false);
                      }}
                      className="w-full p-2.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-left text-xs hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Returning Patient: {maskPatientName(match.patientName)} ({match.gender}, {match.age}y)</span>
                      </div>
                      <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">
                        ⚡ Tap to auto-fill verified demographic profile
                      </div>
                    </button>
                  );
                }
                return (
                  <div className="p-2 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Returning Patient? Quick test lookup numbers:</span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { label: 'Sample: 555-0199', phone: '555-0199', name: 'Arthur Pendelton', age: '58', gender: 'Male' },
                        { label: 'Sample: 555-0284', phone: '555-0284', name: 'Jonathan Hayes', age: '42', gender: 'Male' },
                        { label: 'Sample: 555-0371', phone: '555-0371', name: 'Sophia Montgomery', age: '29', gender: 'Female' }
                      ].map((demo) => (
                        <button
                          key={demo.phone}
                          type="button"
                          onClick={() => {
                            clinicAudio.triggerHaptic(15);
                            setPhone(demo.phone);
                            setPatientName(demo.name);
                            setAge(demo.age);
                            setGender(demo.gender);
                            setAppointmentErrors({});
                            setShowAppointmentErrorAlert(false);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-blue-100/70 hover:bg-blue-200 text-blue-800 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          {demo.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Summary Card */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
                <div className="text-xs font-black text-blue-900">{targetCabin.cabinName}: {targetCabin.department}</div>
                <div className="text-xs text-slate-600">{targetCabin.doctorName}</div>
                <div className="text-xs font-bold text-blue-700 mt-1">Consultation Fee: {formatCurrency(consultationFee)}</div>
              </div>
            </div>

            {/* Right: Touch Keypad (Only rendered on touch devices or when virtual keyboard is toggled ON) */}
            {showVirtualKeyboard && (
              <div className="lg:col-span-7 flex flex-col justify-center overflow-y-auto">
                {inputField === 'name' ? (
                  <div className="bg-white p-3 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2 px-2">
                      <span>Touch QWERTY Keyboard:</span>
                      <span className="text-[10px] text-teal-600 font-medium">Physical typing also active</span>
                    </div>
                    <TouchKeyboard
                      value={patientName}
                      onChange={(val) => setPatientName(val)}
                      onEnter={() => {
                        ageInputRef.current?.focus();
                        setInputField('age');
                      }}
                    />
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm max-w-sm mx-auto w-full">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2 text-center">
                      <span>Enter {inputField === 'age' ? 'Age' : 'Phone Number'}:</span>
                      <span className="text-[10px] text-teal-600 font-medium">Physical typing active</span>
                    </div>
                    <TouchNumpad
                      value={inputField === 'age' ? age : phone}
                      onChange={(val) => {
                        if (inputField === 'age') setAge(val);
                        else setPhone(val);
                      }}
                      onEnter={() => {
                        if (inputField === 'age') {
                          phoneInputRef.current?.focus();
                          setInputField('phone');
                        } else {
                          if (bookingType === 'SLOT') handleBookFutureAppointment();
                          else {
                            clinicAudio.triggerHaptic(15);
                            setVitalScreen(1);
                            setCurrentStep(5);
                          }
                        }
                      }}
                      maxLength={inputField === 'age' ? 3 : 15}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 5: RECORD PATIENT VITALS & TRIAGE INTAKE
          ========================================================================= */}
      {currentStep === 5 && (
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full animate-in fade-in duration-200 min-h-0">
          {/* Header Strip */}
          <div className="mb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-blue-600 uppercase tracking-wider">
                  Step 5 of 6 • Receptionist / Triage Intake
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-black">
                  Screen {vitalScreen} of 4
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-blue-950 mt-0.5 leading-tight">
                {vitalScreen === 1 && 'Vital 1: Body Temperature (Forehead / Oral)'}
                {vitalScreen === 2 && 'Vital 2: Blood Pressure (Systolic / Diastolic)'}
                {vitalScreen === 3 && 'Vital 3: Pulse Rate (Heart Rate BPM)'}
                {vitalScreen === 4 && 'Vital 4: SpO2 Oxygen Saturation (Pulse Oximeter)'}
              </h2>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(20);
                  setStandardVitals();
                }}
                className={`px-3 py-1.5 border font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs ${
                  tempRecorded && bpRecorded && pulseRecorded && spo2Recorded
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'
                }`}
                title="Autofill standard normal healthy vitals across all 4 screens"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>{tempRecorded && bpRecorded && pulseRecorded && spo2Recorded ? '✓ All Standard Recorded' : '⚡ Record Standard Vitals'}</span>
              </button>

              <button
                type="button"
                onClick={skipRemainingVitals}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all active:scale-95 border border-slate-200 cursor-pointer"
                title="Temperature is mandatory at counter; remaining vitals (BP, Pulse, SpO2) deferred to cabin"
              >
                <span>Skip Remaining (BP/Pulse/SpO2)</span>
              </button>
            </div>
          </div>

          {/* Stepper Tabs Bar (Screens 1 to 4) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mb-2 shrink-0">
            {[
              {
                screen: 1,
                label: '1. Temperature',
                icon: Thermometer,
                val: `${temperature}°F`,
                badge: (() => {
                  if (!tempRecorded) return { text: 'Mandatory', color: 'bg-rose-100 text-rose-800 border-rose-300' };
                  const t = parseFloat(temperature) || 98.6;
                  if (t > 100.4) return { text: '🔥 Fever', color: 'bg-rose-100 text-rose-800 border-rose-300' };
                  if (t >= 99.6) return { text: 'Mild Fever', color: 'bg-amber-100 text-amber-800 border-amber-300' };
                  if (t < 97.0) return { text: 'Low Temp', color: 'bg-sky-100 text-sky-800 border-sky-300' };
                  return { text: '✓ Recorded', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
                })()
              },
              {
                screen: 2,
                label: '2. Blood Pressure',
                icon: Activity,
                val: bpRecorded ? `${bpSystolic}/${bpDiastolic}` : 'Deferred',
                badge: (() => {
                  if (!bpRecorded) return { text: '⏩ Skipped', color: 'bg-slate-100 text-slate-600 border-slate-200' };
                  const sys = parseInt(bpSystolic, 10) || 120;
                  const dia = parseInt(bpDiastolic, 10) || 80;
                  if (sys >= 140 || dia >= 90) return { text: 'Stage 2', color: 'bg-rose-100 text-rose-800 border-rose-300' };
                  if (sys >= 130 || dia >= 80) return { text: 'Stage 1', color: 'bg-amber-100 text-amber-800 border-amber-300' };
                  if (sys >= 120) return { text: 'Elevated', color: 'bg-blue-100 text-blue-800 border-blue-300' };
                  return { text: '✓ Optimal', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
                })()
              },
              {
                screen: 3,
                label: '3. Pulse Rate',
                icon: Heart,
                val: pulseRecorded ? `${pulseRate} bpm` : 'Deferred',
                badge: (() => {
                  if (!pulseRecorded) return { text: '⏩ Skipped', color: 'bg-slate-100 text-slate-600 border-slate-200' };
                  const p = parseInt(pulseRate, 10) || 84;
                  if (p > 100) return { text: 'Tachycardia', color: 'bg-rose-100 text-rose-800 border-rose-300' };
                  if (p < 60) return { text: 'Bradycardia', color: 'bg-amber-100 text-amber-800 border-amber-300' };
                  return { text: '✓ Normal', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
                })()
              },
              {
                screen: 4,
                label: '4. SpO2 Oxygen',
                icon: ShieldCheck,
                val: spo2Recorded ? `${spo2}%` : 'Deferred',
                badge: (() => {
                  if (!spo2Recorded) return { text: '⏩ Skipped', color: 'bg-slate-100 text-slate-600 border-slate-200' };
                  const s = parseInt(spo2, 10) || 97;
                  if (s < 90) return { text: 'Crit. Hypoxia', color: 'bg-rose-100 text-rose-800 border-rose-300' };
                  if (s <= 94) return { text: 'Mild Hypoxia', color: 'bg-amber-100 text-amber-800 border-amber-300' };
                  return { text: '✓ Optimal', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
                })()
              }
            ].map((tab) => {
              const IconComp = tab.icon;
              const isActive = vitalScreen === tab.screen;
              return (
                <button
                  key={tab.screen}
                  type="button"
                  onClick={() => {
                    clinicAudio.triggerHaptic(10);
                    setVitalScreen(tab.screen);
                  }}
                  className={`p-2 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-400/40'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300 hover:bg-blue-50/40'
                  }`}
                >
                  <div className="min-w-0 pr-1">
                    <div className="flex items-center gap-1.5">
                      <IconComp className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                      <span className={`text-[11px] font-black truncate ${isActive ? 'text-white' : 'text-slate-700'}`}>
                        {tab.label}
                      </span>
                    </div>
                    <div className={`text-xs font-mono font-black mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-900'}`}>
                      {tab.val}
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : `${tab.badge.color} border`
                  }`}>
                    {tab.badge.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Screen Content Area */}
          <div className="flex-1 flex flex-col justify-start sm:justify-center min-h-0 overflow-y-auto pr-0.5">
            {/* =========================================================================
                SCREEN 1: BODY TEMPERATURE
                ========================================================================= */}
            {vitalScreen === 1 && (
              <div className="bg-white border-2 border-rose-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between animate-in fade-in duration-200">
                {/* Screen Header Strip */}
                <div className="flex items-center justify-between pb-2 border-b border-rose-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold shadow-2xs">
                      <Thermometer className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">
                          Vital 1 • Forehead / Oral
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-rose-600 text-white">
                          Mandatory at Counter
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">Body Temperature</h3>
                    </div>
                  </div>

                  {/* Classification Badge */}
                  {(() => {
                    const t = parseFloat(temperature) || 98.6;
                    if (t > 100.4) {
                      return (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                          🔥 High Fever ({t}°F)
                        </span>
                      );
                    }
                    if (t >= 99.6) {
                      return (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          ⚠️ Mild Fever
                        </span>
                      );
                    }
                    if (t < 97.0) {
                      return (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                          ❄️ Low Temp
                        </span>
                      );
                    }
                    return (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ✓ Normal Afebrile
                      </span>
                    );
                  })()}
                </div>

                {/* Mandatory Temperature Alert */}
                {tempValidationAlert && (
                  <div className="mt-2 p-2 bg-rose-50 border border-rose-300 rounded-xl flex items-center gap-2 text-xs text-rose-950 font-bold animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="leading-tight">Body Temperature is mandatory at counter. Adjust steppers, tap a preset, or click &quot;Confirm&quot; below.</span>
                  </div>
                )}

                {/* 2-Column Responsive Dashboard Body */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch mt-2.5">
                  {/* Left Column: Readout & Inline Confirm (7 Cols) */}
                  <div className="md:col-span-7 flex flex-col justify-between space-y-2">
                    {/* Stepper Readout */}
                    <div className="py-3 px-4 flex items-center justify-center gap-4 sm:gap-6 bg-rose-50/50 rounded-2xl border border-rose-100">
                      <button
                        type="button"
                        onClick={() => adjustTemp(-0.2)}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 font-black text-xl flex items-center justify-center shadow-2xs active:scale-90 transition-transform cursor-pointer"
                        title="Decrease temperature (-0.2°F)"
                      >
                        <Minus className="w-5 h-5 stroke-[3]" />
                      </button>

                      <div className="text-4xl sm:text-5xl font-black font-mono text-slate-900 tracking-tight text-center select-none min-w-[150px]">
                        {temperature}<span className="text-xl sm:text-2xl text-rose-600 font-bold ml-1">°F</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => adjustTemp(0.2)}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 font-black text-xl flex items-center justify-center shadow-2xs active:scale-90 transition-transform cursor-pointer"
                        title="Increase temperature (+0.2°F)"
                      >
                        <Plus className="w-5 h-5 stroke-[3]" />
                      </button>
                    </div>

                    {/* Inline Status & Quick Confirm */}
                    {!tempRecorded ? (
                      <div className="p-2 sm:p-2.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between gap-2 animate-in fade-in">
                        <div className="flex items-center gap-1.5 text-xs text-amber-950 min-w-0">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <div className="text-[11px] leading-tight truncate">
                            <span className="font-black block text-amber-900">Mandatory — Unconfirmed</span>
                            <span className="text-slate-600">Tap preset chip or confirm</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            clinicAudio.triggerHaptic(20);
                            setTempRecorded(true);
                            setTempValidationAlert(false);
                          }}
                          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm {temperature}°F</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-2 sm:p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-2 animate-in fade-in">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-950 min-w-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="text-[11px] leading-tight truncate">
                            <span className="font-black block text-emerald-900">✓ Recorded: {temperature}°F</span>
                            <span className="text-emerald-700">Logged. Ready for next vital.</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            clinicAudio.triggerHaptic(10);
                            setTempRecorded(false);
                          }}
                          className="px-2.5 py-1 bg-white text-slate-600 hover:text-rose-600 border border-slate-200 font-bold text-[11px] rounded-lg cursor-pointer shrink-0"
                          title="Reset temperature to unconfirmed"
                        >
                          Re-measure
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Presets & Clinical Standard (5 Cols) */}
                  <div className="md:col-span-5 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                        TAP PRESET QUICK-SELECT:
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { label: '97.8°', val: '97.8' },
                          { label: '98.4°', val: '98.4' },
                          { label: '98.6° Norm', val: '98.6' },
                          { label: '99.2°', val: '99.2' },
                          { label: '100.4° Fever', val: '100.4' },
                          { label: '101.5° High', val: '101.5' }
                        ].map((chip) => (
                          <button
                            key={chip.val}
                            type="button"
                            onClick={() => {
                              clinicAudio.triggerHaptic(15);
                              setTempRecorded(true);
                              setTempValidationAlert(false);
                              setVitalsRecorded(true);
                              setTemperature(chip.val);
                            }}
                            className={`py-2 px-1 rounded-xl text-xs font-black border transition-all truncate cursor-pointer active:scale-95 text-center ${
                              tempRecorded && temperature === chip.val
                                ? 'bg-rose-600 text-white border-rose-600 shadow-2xs ring-2 ring-rose-300'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-rose-50 hover:border-rose-300'
                            }`}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clinical Standard Note */}
                    <div className="p-2 bg-rose-50/80 border border-rose-200 rounded-xl text-[11px] text-rose-950 flex items-center justify-between">
                      <span className="leading-tight">
                        <strong className="font-bold">Standard:</strong> Normal 97.0°–99.5°F • &ge;100.4°F Fever alert.
                      </span>
                      <span className="font-mono font-bold text-rose-700 bg-white px-1.5 py-0.5 rounded-lg border border-rose-200 shrink-0 text-[10px] ml-1">
                        Oral/Forehead
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                SCREEN 2: BLOOD PRESSURE (SYSTOLIC / DIASTOLIC)
                ========================================================================= */}
            {vitalScreen === 2 && (
              <div className="bg-white border-2 border-indigo-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between animate-in fade-in duration-200">
                {/* Screen Header Strip */}
                <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold shadow-2xs">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">
                          Vital 2 • Cuff NIBP
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                          bpRecorded ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {bpRecorded ? '✓ Measured at Counter' : '⏩ Skipped by Default'}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">Blood Pressure (Systolic / Diastolic)</h3>
                    </div>
                  </div>

                  {/* BP Classification Badge */}
                  {(() => {
                    const sys = parseInt(bpSystolic, 10) || 120;
                    const dia = parseInt(bpDiastolic, 10) || 80;
                    if (sys >= 140 || dia >= 90) {
                      return (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                          Stage 2 High BP
                        </span>
                      );
                    }
                    if (sys >= 130 || dia >= 80) {
                      return (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Stage 1 Hypertension
                        </span>
                      );
                    }
                    if (sys >= 120) {
                      return (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          Elevated BP
                        </span>
                      );
                    }
                    return (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ✓ Normal Optimal
                      </span>
                    );
                  })()}
                </div>

                {/* 2-Column Responsive Dashboard Body */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch mt-2.5">
                  {/* Left Column: Dual Steppers & Status (7 Cols) */}
                  <div className="md:col-span-7 flex flex-col justify-between space-y-2">
                    {/* Dual Stepper Readout */}
                    <div className="grid grid-cols-2 gap-2 bg-indigo-50/50 rounded-2xl p-2.5 border border-indigo-100">
                      {/* Systolic */}
                      <div className="text-center p-2 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">SYSTOLIC</span>
                        <div className="flex items-center justify-center gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => adjustSystolic(-2)}
                            className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-base flex items-center justify-center border border-indigo-200 active:scale-90 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 min-w-[55px]">{bpSystolic}</span>
                          <button
                            type="button"
                            onClick={() => adjustSystolic(2)}
                            className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-base flex items-center justify-center border border-indigo-200 active:scale-90 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Diastolic */}
                      <div className="text-center p-2 bg-white rounded-xl border border-indigo-100 shadow-2xs">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">DIASTOLIC</span>
                        <div className="flex items-center justify-center gap-2 mt-1">
                          <button
                            type="button"
                            onClick={() => adjustDiastolic(-2)}
                            className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-base flex items-center justify-center border border-indigo-200 active:scale-90 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 min-w-[55px]">{bpDiastolic}</span>
                          <button
                            type="button"
                            onClick={() => adjustDiastolic(2)}
                            className="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-base flex items-center justify-center border border-indigo-200 active:scale-90 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Status Banner */}
                    {bpRecorded ? (
                      <div className="p-2 sm:p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-950 font-bold animate-in fade-in">
                        <div className="flex items-center gap-1.5 truncate">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-[11px] truncate">BP Recorded: <strong>{bpSystolic}/{bpDiastolic} mmHg</strong></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            clinicAudio.triggerHaptic(10);
                            setBpRecorded(false);
                          }}
                          className="px-2 py-1 bg-white text-slate-600 hover:text-indigo-600 border border-slate-200 font-bold text-[10px] rounded-lg cursor-pointer shrink-0"
                        >
                          ↩ Skip BP (Cabin)
                        </button>
                      </div>
                    ) : (
                      <div className="p-2 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600 animate-in fade-in">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-sm">⏩</span>
                          <span><strong>Skipped by default:</strong> Measured in cabin.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            clinicAudio.triggerHaptic(15);
                            setBpRecorded(true);
                            setVitalsRecorded(true);
                          }}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg cursor-pointer shrink-0"
                        >
                          Measure Now
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Presets & Clinical Standard (5 Cols) */}
                  <div className="md:col-span-5 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                        TAP PRESET QUICK-SELECT:
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { label: '115/75 Opt', sys: '115', dia: '75' },
                          { label: '120/80 Norm', sys: '120', dia: '80' },
                          { label: '122/72 Std', sys: '122', dia: '72' },
                          { label: '130/85 Elev', sys: '130', dia: '85' },
                          { label: '135/85 Stg 1', sys: '135', dia: '85' },
                          { label: '145/95 Stg 2', sys: '145', dia: '95' }
                        ].map((chip) => (
                          <button
                            key={chip.label}
                            type="button"
                            onClick={() => {
                              clinicAudio.triggerHaptic(15);
                              setBpRecorded(true);
                              setVitalsRecorded(true);
                              setBpSystolic(chip.sys);
                              setBpDiastolic(chip.dia);
                            }}
                            className={`py-2 px-1 rounded-xl text-xs font-black border transition-all truncate cursor-pointer active:scale-95 text-center ${
                              bpRecorded && bpSystolic === chip.sys && bpDiastolic === chip.dia
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs ring-2 ring-indigo-300'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:border-indigo-300'
                            }`}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clinical Standard Note */}
                    <div className="p-2 bg-indigo-50/80 border border-indigo-200 rounded-xl text-[11px] text-indigo-950 flex items-center justify-between">
                      <span className="leading-tight">
                        <strong className="font-bold">Standard:</strong> Normal &lt;120/80 • Elevated 120-129 • Stage 1 &ge;130/80
                      </span>
                      <span className="font-mono font-bold text-indigo-700 bg-white px-1.5 py-0.5 rounded-lg border border-indigo-200 shrink-0 text-[10px] ml-1">
                        NIBP Cuff
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                SCREEN 3: PULSE RATE (HEART RATE BPM)
                ========================================================================= */}
            {vitalScreen === 3 && (
              <div className="bg-white border-2 border-pink-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between animate-in fade-in duration-200">
                {/* Screen Header Strip */}
                <div className="flex items-center justify-between pb-2 border-b border-pink-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 border border-pink-200 flex items-center justify-center font-bold shadow-2xs">
                      <Heart className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-pink-500">
                          Vital 3 • Heart Rate
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                          pulseRecorded ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {pulseRecorded ? '✓ Measured at Counter' : '⏩ Skipped by Default'}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">Pulse Rate (BPM)</h3>
                    </div>
                  </div>

                  {/* Pulse Status Badge */}
                  {(() => {
                    const p = parseInt(pulseRate, 10) || 84;
                    if (p > 100) {
                      return (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                          Tachycardia (&gt;100 bpm)
                        </span>
                      );
                    }
                    if (p < 60) {
                      return (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Bradycardia (&lt;60 bpm)
                        </span>
                      );
                    }
                    return (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ✓ Normal Resting
                      </span>
                    );
                  })()}
                </div>

                {/* 2-Column Responsive Dashboard Body */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch mt-2.5">
                  {/* Left Column: Readout & Status (7 Cols) */}
                  <div className="md:col-span-7 flex flex-col justify-between space-y-2">
                    {/* Stepper Readout */}
                    <div className="py-3 px-4 flex items-center justify-center gap-4 sm:gap-6 bg-pink-50/50 rounded-2xl border border-pink-100">
                      <button
                        type="button"
                        onClick={() => adjustPulse(-2)}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white border border-pink-200 text-pink-700 hover:bg-pink-100 font-black text-xl flex items-center justify-center shadow-2xs active:scale-90 transition-transform cursor-pointer"
                        title="Decrease pulse rate (-2 bpm)"
                      >
                        <Minus className="w-5 h-5 stroke-[3]" />
                      </button>

                      <div className="text-4xl sm:text-5xl font-black font-mono text-slate-900 tracking-tight text-center select-none min-w-[150px]">
                        {pulseRate}<span className="text-xl sm:text-2xl text-pink-600 font-bold ml-1">bpm</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => adjustPulse(2)}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white border border-pink-200 text-pink-700 hover:bg-pink-100 font-black text-xl flex items-center justify-center shadow-2xs active:scale-90 transition-transform cursor-pointer"
                        title="Increase pulse rate (+2 bpm)"
                      >
                        <Plus className="w-5 h-5 stroke-[3]" />
                      </button>
                    </div>

                    {/* Status Banner */}
                    {pulseRecorded ? (
                      <div className="p-2 sm:p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-950 font-bold animate-in fade-in">
                        <div className="flex items-center gap-1.5 truncate">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-[11px] truncate">Pulse Rate Recorded: <strong>{pulseRate} bpm</strong></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            clinicAudio.triggerHaptic(10);
                            setPulseRecorded(false);
                          }}
                          className="px-2 py-1 bg-white text-slate-600 hover:text-pink-600 border border-slate-200 font-bold text-[10px] rounded-lg cursor-pointer shrink-0"
                        >
                          ↩ Skip Pulse (Cabin)
                        </button>
                      </div>
                    ) : (
                      <div className="p-2 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600 animate-in fade-in">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-sm">⏩</span>
                          <span><strong>Skipped by default:</strong> Measured in cabin.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            clinicAudio.triggerHaptic(15);
                            setPulseRecorded(true);
                            setVitalsRecorded(true);
                          }}
                          className="px-2.5 py-1 bg-pink-600 hover:bg-pink-700 text-white font-bold text-[10px] rounded-lg cursor-pointer shrink-0"
                        >
                          Measure Now
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Presets & Clinical Standard (5 Cols) */}
                  <div className="md:col-span-5 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                        TAP PRESET QUICK-SELECT:
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {['68', '72', '76', '84', '92', '102'].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => {
                              clinicAudio.triggerHaptic(15);
                              setPulseRecorded(true);
                              setVitalsRecorded(true);
                              setPulseRate(val);
                            }}
                            className={`py-2 px-1 rounded-xl text-xs font-black border transition-all cursor-pointer active:scale-95 text-center ${
                              pulseRecorded && pulseRate === val
                                ? 'bg-pink-600 text-white border-pink-600 shadow-2xs ring-2 ring-pink-300'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-pink-50 hover:border-pink-300'
                            }`}
                          >
                            {val} bpm
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clinical Standard Note */}
                    <div className="p-2 bg-pink-50/80 border border-pink-200 rounded-xl text-[11px] text-pink-950 flex items-center justify-between">
                      <span className="leading-tight">
                        <strong className="font-bold">Standard:</strong> Normal 60 - 100 bpm • High &gt;100 bpm indicates tachycardia.
                      </span>
                      <span className="font-mono font-bold text-pink-700 bg-white px-1.5 py-0.5 rounded-lg border border-pink-200 shrink-0 text-[10px] ml-1">
                        Radial
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                SCREEN 4: SPO2 OXYGEN SATURATION (PULSE OXIMETER)
                ========================================================================= */}
            {vitalScreen === 4 && (
              <div className="bg-white border-2 border-sky-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col justify-between animate-in fade-in duration-200">
                {/* Screen Header Strip */}
                <div className="flex items-center justify-between pb-2 border-b border-sky-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center font-bold shadow-2xs">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-sky-500">
                          Vital 4 • Pulse Oximeter
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                          spo2Recorded ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {spo2Recorded ? '✓ Measured at Counter' : '⏩ Skipped by Default'}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">SpO2 Oxygen Saturation</h3>
                    </div>
                  </div>

                  {/* SpO2 Status Badge */}
                  {(() => {
                    const s = parseInt(spo2, 10) || 97;
                    if (s < 90) {
                      return (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                          Critical Hypoxia (&lt;90%)
                        </span>
                      );
                    }
                    if (s <= 94) {
                      return (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Mild Hypoxia (90-94%)
                        </span>
                      );
                    }
                    return (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ✓ Optimal (&ge;95%)
                      </span>
                    );
                  })()}
                </div>

                {/* 2-Column Responsive Dashboard Body */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch mt-2.5">
                  {/* Left Column: Readout & Status (7 Cols) */}
                  <div className="md:col-span-7 flex flex-col justify-between space-y-2">
                    {/* Stepper Readout */}
                    <div className="py-3 px-4 flex items-center justify-center gap-4 sm:gap-6 bg-sky-50/50 rounded-2xl border border-sky-100">
                      <button
                        type="button"
                        onClick={() => adjustSpo2(-1)}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white border border-sky-200 text-sky-700 hover:bg-sky-100 font-black text-xl flex items-center justify-center shadow-2xs active:scale-90 transition-transform cursor-pointer"
                        title="Decrease SpO2 (-1%)"
                      >
                        <Minus className="w-5 h-5 stroke-[3]" />
                      </button>

                      <div className="text-4xl sm:text-5xl font-black font-mono text-slate-900 tracking-tight text-center select-none min-w-[150px]">
                        {spo2}<span className="text-xl sm:text-2xl text-sky-600 font-bold ml-1">%</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => adjustSpo2(1)}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white border border-sky-200 text-sky-700 hover:bg-sky-100 font-black text-xl flex items-center justify-center shadow-2xs active:scale-90 transition-transform cursor-pointer"
                        title="Increase SpO2 (+1%)"
                      >
                        <Plus className="w-5 h-5 stroke-[3]" />
                      </button>
                    </div>

                    {/* Status Banner */}
                    {spo2Recorded ? (
                      <div className="p-2 sm:p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-950 font-bold animate-in fade-in">
                        <div className="flex items-center gap-1.5 truncate">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-[11px] truncate">SpO2 Recorded: <strong>{spo2}%</strong></span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            clinicAudio.triggerHaptic(10);
                            setSpo2Recorded(false);
                          }}
                          className="px-2 py-1 bg-white text-slate-600 hover:text-sky-600 border border-slate-200 font-bold text-[10px] rounded-lg cursor-pointer shrink-0"
                        >
                          ↩ Skip SpO2 (Cabin)
                        </button>
                      </div>
                    ) : (
                      <div className="p-2 sm:p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600 animate-in fade-in">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-sm">⏩</span>
                          <span><strong>Skipped by default:</strong> Measured in cabin.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            clinicAudio.triggerHaptic(15);
                            setSpo2Recorded(true);
                            setVitalsRecorded(true);
                          }}
                          className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] rounded-lg cursor-pointer shrink-0"
                        >
                          Measure Now
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Presets & Clinical Standard (5 Cols) */}
                  <div className="md:col-span-5 flex flex-col justify-between space-y-2">
                    <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                        TAP PRESET QUICK-SELECT:
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {['95', '96', '97', '98', '99', '100'].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => {
                              clinicAudio.triggerHaptic(15);
                              setSpo2Recorded(true);
                              setVitalsRecorded(true);
                              setSpo2(val);
                            }}
                            className={`py-2 px-1 rounded-xl text-xs font-black border transition-all cursor-pointer active:scale-95 text-center ${
                              spo2Recorded && spo2 === val
                                ? 'bg-sky-600 text-white border-sky-600 shadow-2xs ring-2 ring-sky-300'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-sky-50 hover:border-sky-300'
                            }`}
                          >
                            {val}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clinical Standard Note */}
                    <div className="p-2 bg-sky-50/80 border border-sky-200 rounded-xl text-[11px] text-sky-950 flex items-center justify-between">
                      <span className="leading-tight">
                        <strong className="font-bold">Standard:</strong> Normal SpO2 &ge; 95% • Below 90% is critical hypoxia.
                      </span>
                      <span className="font-mono font-bold text-sky-700 bg-white px-1.5 py-0.5 rounded-lg border border-sky-200 shrink-0 text-[10px] ml-1">
                        Pulse Ox
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation Bar */}
          <div className="mt-2.5 p-2.5 sm:p-3 rounded-2xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
            {/* Back Button */}
            {vitalScreen === 1 ? (
              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(15);
                  setCurrentStep(4);
                }}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Patient Details</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(15);
                  setVitalScreen((prev) => Math.max(1, prev - 1));
                }}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>
                  {vitalScreen === 2 && 'Back: Temperature'}
                  {vitalScreen === 3 && 'Back: Blood Pressure'}
                  {vitalScreen === 4 && 'Back: Pulse Rate'}
                </span>
              </button>
            )}

            {/* Patient Context Badge */}
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shadow-2xs text-[10px]">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="text-[11px] leading-tight">
                <span className="font-black text-slate-900">{patientName || 'Walk-in Patient'}</span>
                <span className="text-slate-400 mx-1">•</span>
                <span className="font-medium text-slate-600">{targetCabin.cabinName}</span>
              </div>
            </div>

            {/* Next / Complete Button */}
            {vitalScreen === 1 && (
              !tempRecorded ? (
                <button
                  type="button"
                  onClick={() => {
                    clinicAudio.triggerHaptic(30);
                    setTempValidationAlert(true);
                  }}
                  className="w-full sm:w-auto px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20 active:scale-95 transition-all cursor-pointer animate-pulse"
                  title="Temperature is mandatory at kiosk counter. Please confirm or update to proceed."
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Record Temperature to Proceed (Mandatory)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    clinicAudio.triggerHaptic(15);
                    setVitalScreen(2);
                  }}
                  className="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Next: Blood Pressure</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )
            )}

            {vitalScreen === 2 && (
              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(15);
                  setVitalScreen(3);
                }}
                className="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>{bpRecorded ? 'Next: Pulse Rate (BP Recorded)' : 'Next: Pulse Rate (Skip BP)'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {vitalScreen === 3 && (
              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(15);
                  setVitalScreen(4);
                }}
                className="w-full sm:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>{pulseRecorded ? 'Next: SpO2 Oxygen (Pulse Recorded)' : 'Next: SpO2 Oxygen (Skip Pulse)'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {vitalScreen === 4 && (
              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(20);
                  setCurrentStep(6);
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <span>
                  {spo2Recorded
                    ? `Complete Vitals & Settle Fee (${formatCurrency(consultationFee)})`
                    : `Complete Vitals (Skip SpO2) & Settle Fee (${formatCurrency(consultationFee)})`}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 6: MANDATORY UPFRONT BILLING & PAYMENT
          ========================================================================= */}
      {/* =========================================================================
          STEP 6: MANDATORY UPFRONT BILLING & PAYMENT
          ========================================================================= */}
      {currentStep === 6 && (
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full min-h-0 overflow-y-auto pr-0.5 justify-between">
          <div className="mb-2 sm:mb-2.5 flex items-center justify-between shrink-0">
            <div>
              <span className="text-[10px] sm:text-xs font-black text-blue-600 uppercase tracking-wider block">Step 6 of 6 • Upfront Payment</span>
              <h2 className="text-xl sm:text-2xl font-black text-blue-950">Settle Consultation & Issue Token</h2>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Per clinic policy, consultation fee is settled at token generation. Receive your A4 Laser Receipt immediately.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                clinicAudio.triggerHaptic(15);
                setCurrentStep(5);
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Vitals</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 min-h-0 items-stretch">
            {/* Left Column: Itemized Order & Vitals Summary (5 Cols) */}
            <div className="md:col-span-5 flex flex-col justify-between space-y-2 min-h-0">
              <div className="bg-white border-2 border-blue-100 rounded-2xl p-3 sm:p-3.5 shadow-2xs space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] sm:text-xs font-black text-blue-950 uppercase tracking-wider pb-1.5 border-b border-slate-100 flex items-center justify-between">
                    <span>Patient & Cabin Summary</span>
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {bookingType === 'WALK_IN' ? 'Immediate Walk-in' : `Slot: ${selectedSlot}`}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs mt-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Patient:</span>
                      <strong className="text-slate-900 truncate max-w-[150px]">{patientName || 'Anonymous Patient'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Age / Gender:</span>
                      <span>{age || 35}y / {gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cabin:</span>
                      <span className="font-bold text-blue-700 truncate max-w-[170px]">{targetCabin.cabinName} ({targetCabin.department})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Doctor:</span>
                      <span className="text-slate-700 truncate max-w-[170px]">{targetCabin.doctorName}</span>
                    </div>
                  </div>
                </div>

                {/* Triage Vitals Snippet */}
                <div className="pt-1.5 border-t border-slate-100">
                  <div className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Triage Vitals Status:</span>
                    <span className="text-[9px] text-emerald-600 font-bold">✓ Temp Recorded</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center">
                    <div className="p-1 bg-rose-50/80 border border-rose-200 rounded-lg">
                      <span className="text-[8px] text-slate-400 block font-sans font-bold">TEMP</span>
                      <span className="font-bold text-rose-700 text-[11px]">{temperature}°F</span>
                    </div>

                    <div className={`p-1 rounded-lg border ${
                      bpRecorded ? 'bg-indigo-50/80 border-indigo-200' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className="text-[8px] text-slate-400 block font-sans font-bold">BP</span>
                      <span className={`font-bold text-[10px] ${bpRecorded ? 'text-indigo-700' : 'text-slate-400 font-sans'}`}>
                        {bpRecorded ? `${bpSystolic}/${bpDiastolic}` : 'Cabin'}
                      </span>
                    </div>

                    <div className={`p-1 rounded-lg border ${
                      pulseRecorded ? 'bg-pink-50/80 border-pink-200' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className="text-[8px] text-slate-400 block font-sans font-bold">PULSE</span>
                      <span className={`font-bold text-[10px] ${pulseRecorded ? 'text-pink-700' : 'text-slate-400 font-sans'}`}>
                        {pulseRecorded ? `${pulseRate} bpm` : 'Cabin'}
                      </span>
                    </div>

                    <div className={`p-1 rounded-lg border ${
                      spo2Recorded ? 'bg-sky-50/80 border-sky-200' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className="text-[8px] text-slate-400 block font-sans font-bold">SPO2</span>
                      <span className={`font-bold text-[10px] ${spo2Recorded ? 'text-sky-700' : 'text-slate-400 font-sans'}`}>
                        {spo2Recorded ? `${spo2}%` : 'Cabin'}
                      </span>
                    </div>
                  </div>
                  {(!bpRecorded || !pulseRecorded || !spo2Recorded) && (
                    <div className="mt-1 text-[9px] text-slate-500 font-medium">
                      📋 Deferred vitals will be checked by specialist in {targetCabin.cabinName}.
                    </div>
                  )}
                </div>

                {/* Pricing Summary */}
                <div className="pt-1.5 border-t border-slate-100 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Consultation Fee</span>
                    <span className="font-bold">{currencySymbol}{consultationFee.toFixed(2)}</span>
                  </div>

                  {insuranceCoPay > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Insurance Co-Pay Cover</span>
                      <span>-{currencySymbol}{insuranceCoPay.toFixed(2)}</span>
                    </div>
                  )}

                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Special Privilege Waiver</span>
                      <span>-{currencySymbol}{discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="pt-1 border-t border-dashed border-slate-200 flex justify-between items-baseline">
                    <span className="font-black text-blue-950 text-xs sm:text-sm">Net Payable Now:</span>
                    <span className="text-xl sm:text-2xl font-black text-blue-600 font-mono">
                      {currencySymbol}{netPayable.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-2 bg-blue-50/60 rounded-xl border border-blue-100 text-[10px] text-slate-500 flex items-center gap-1.5">
                <span>⚡ Token slip & receipt prints immediately upon settlement.</span>
              </div>
            </div>

            {/* Right Column: Payment Methods & Cash Numpad (7 Cols) */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-2 min-h-0">
              <div className="bg-white border-2 border-blue-100 rounded-2xl p-2.5 sm:p-3 shadow-2xs space-y-2 flex-1 flex flex-col justify-between min-h-0">
                
                {/* 1. Payment Method Pills Header (Compact 1-row selector) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] sm:text-xs font-black text-blue-950 uppercase tracking-wider">
                      Payment Mode:
                    </span>
                    <span className="text-[9px] text-slate-400">
                      Standard: Cash at Counter
                    </span>
                  </div>

                  {(() => {
                    const enabled = clinicSettings?.paymentSettings?.enabledMethods || { CASH: true };
                    const options = [
                      { id: 'CASH', label: 'Cash at Counter', icon: Banknote },
                      { id: 'CARD', label: 'Credit / Debit Card', icon: CreditCard },
                      { id: 'TOUCH_PAY_UPI', label: 'Touch UPI / QR', icon: QrCode },
                      { id: 'INSURANCE_COPAY', label: 'Insurance Co-Pay', icon: ShieldCheck }
                    ].filter(opt => enabled[opt.id]);

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {options.map((m) => {
                          const Icon = m.icon;
                          const isSelected = paymentMethod === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                clinicAudio.triggerHaptic(15);
                                setPaymentMethod(m.id);
                                if (m.id === 'INSURANCE_COPAY') setInsuranceCoPay(20);
                                else setInsuranceCoPay(0);
                              }}
                              className={`py-1.5 px-2 rounded-xl border text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-extrabold ring-2 ring-blue-400/20'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-200 font-semibold text-xs'
                              }`}
                            >
                              <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                              <span className="text-[11px] truncate">{m.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* 2. CASH METHOD: Payment Counter Numbers Keyboard (Numpad) */}
                {paymentMethod === 'CASH' ? (
                  <div className="flex-1 flex flex-col justify-between space-y-1.5 min-h-0">
                    
                    {/* Tender Register LCD Box */}
                    <div className="p-2 sm:p-2.5 bg-slate-900 text-white rounded-xl shadow-inner flex flex-col justify-between gap-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                          Amount Received from Patient:
                        </span>
                        <span className="text-[9px] text-purple-300 font-mono">
                          (0 = Pay in Cabin)
                        </span>
                      </div>
                      
                      <div className="flex items-baseline justify-between">
                        <div className={`font-mono text-2xl sm:text-3xl font-black tracking-tight flex items-baseline gap-1 ${
                          isInsufficientCash ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          <span className={`text-sm sm:text-base font-bold ${
                            isInsufficientCash ? 'text-rose-500' : 'text-emerald-500'
                          }`}>{currencySymbol}</span>
                          <span>{Number(cashTendered || 0).toLocaleString()}</span>
                          <span className={`w-1.5 h-5 ml-0.5 inline-block ${
                            isInsufficientCash ? 'bg-rose-400/80 animate-pulse' : 'bg-emerald-400/80 animate-pulse'
                          }`}></span>
                        </div>
                        {Number(cashTendered || 0) > 0 && (
                          <button
                            type="button"
                            onClick={handleKeypadClear}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Routing Feedback Card */}
                    {Number(cashTendered || 0) === 0 ? (
                      <div className="px-2.5 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-purple-900 text-[11px] font-semibold flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-purple-700 shrink-0" />
                        <span className="truncate">
                          <strong>Amount: {currencySymbol}0.00</strong> — Settle consultation fee directly inside <strong>{targetCabin.cabinName}</strong>.
                        </span>
                      </div>
                    ) : Number(cashTendered || 0) >= netPayable ? (
                      <div className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-[11px] font-semibold flex items-center justify-between">
                        <span className="flex items-center gap-1.5 truncate">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Fee covered ({currencySymbol}{netPayable.toFixed(2)})</span>
                        </span>
                        <span className="font-black font-mono shrink-0 ml-1">
                          Change Due: {currencySymbol}{changeDue.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <div className="px-2.5 py-1.5 bg-rose-50 border-2 border-rose-300 rounded-lg text-rose-950 text-[11px] font-bold flex items-center justify-between animate-in fade-in">
                        <span className="flex items-center gap-1.5 truncate">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Amount less than Net Payable ({currencySymbol}{netPayable.toFixed(2)}) — Cannot proceed</span>
                        </span>
                        <span className="font-black font-mono text-rose-700 shrink-0 ml-1">
                          Short: {currencySymbol}{(netPayable - Number(cashTendered)).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Quick Presets Row */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          clinicAudio.triggerHaptic(15);
                          setCashTendered(netPayable);
                        }}
                        className="px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg font-bold text-[11px] cursor-pointer active:scale-95"
                      >
                        Exact ({currencySymbol}{netPayable.toFixed(0)})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          clinicAudio.triggerHaptic(15);
                          setCashTendered(0);
                        }}
                        className={`px-2 py-1 rounded-lg font-bold text-[11px] cursor-pointer active:scale-95 border ${
                          Number(cashTendered || 0) === 0
                            ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                            : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                        }`}
                      >
                        🩺 Cabin ({currencySymbol}0.00)
                      </button>
                      {(currencyCode === 'PKR' ? [500, 1000, 2000, 5000] : [20, 50, 100]).map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            clinicAudio.triggerHaptic(15);
                            setCashTendered(amt);
                          }}
                          className="px-2 py-1 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg font-bold text-[11px] font-mono cursor-pointer active:scale-95"
                        >
                          +{currencySymbol}{amt}
                        </button>
                      ))}
                    </div>

                    {/* Numbers Keyboard (3x4 POS Grid) */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => handleKeypadDigit(String(num))}
                          className="h-10 sm:h-11 bg-white hover:bg-blue-50/50 active:bg-blue-100 text-slate-800 border border-slate-200 rounded-xl font-mono font-black text-lg sm:text-xl shadow-2xs transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                        >
                          {num}
                        </button>
                      ))}

                      {/* Clear Button */}
                      <button
                        type="button"
                        onClick={handleKeypadClear}
                        className="h-10 sm:h-11 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs sm:text-sm shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                        title="Clear amount to 0 (Escape / C)"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>CLEAR</span>
                      </button>

                      {/* Zero Button */}
                      <button
                        type="button"
                        onClick={() => handleKeypadDigit('0')}
                        className="h-10 sm:h-11 bg-white hover:bg-blue-50/50 active:bg-blue-100 text-slate-800 border border-slate-200 rounded-xl font-mono font-black text-lg sm:text-xl shadow-2xs transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                      >
                        0
                      </button>

                      {/* Backspace Button */}
                      <button
                        type="button"
                        onClick={handleKeypadBackspace}
                        className="h-10 sm:h-11 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-bold text-xs sm:text-sm shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                        title="Delete last digit (Backspace)"
                      >
                        <span>⌫ DEL</span>
                      </button>
                    </div>
                  </div>
                ) : paymentMethod === 'CARD' ? (
                  /* CARD PAYMENT TERMINAL VIEW */
                  <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-slate-800">EMV Card Terminal Ready</div>
                      <div className="text-xs text-slate-500">Please tap contactless card or insert chip into counter POS reader.</div>
                    </div>
                    <div className="font-mono text-lg font-black text-blue-900">
                      Amount: {currencySymbol}{netPayable.toFixed(2)}
                    </div>
                  </div>
                ) : paymentMethod === 'TOUCH_PAY_UPI' ? (
                  /* UPI / QR SCAN VIEW */
                  <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-slate-800">Scan Touch QR on Screen</div>
                      <div className="text-xs text-slate-500">Scan with any mobile banking app to settle instantly.</div>
                    </div>
                    <div className="font-mono text-lg font-black text-indigo-900">
                      Amount: {currencySymbol}{netPayable.toFixed(2)}
                    </div>
                  </div>
                ) : (
                  /* INSURANCE CO-PAY VIEW */
                  <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-slate-800">Insurance Co-Pay Pre-Authorized</div>
                      <div className="text-xs text-slate-500">Co-pay waiver applied. Balance direct-billed to insurance provider.</div>
                    </div>
                    <div className="font-mono text-lg font-black text-emerald-900">
                      Patient Co-Pay: {currencySymbol}{netPayable.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Action / Issue Token Button */}
              <button
                type="button"
                disabled={isInsufficientCash}
                onClick={handleCompletePaymentAndIssueToken}
                className={`w-full py-3 sm:py-3.5 text-white font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 text-sm sm:text-base border shrink-0 ${
                  isInsufficientCash
                    ? 'bg-rose-600 border-rose-500 opacity-90 cursor-not-allowed shadow-rose-900/20'
                    : paymentMethod === 'CASH' && Number(cashTendered || 0) === 0
                      ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 border-purple-400 cursor-pointer active:scale-95'
                      : paymentMethod === 'CASH' && Number(cashTendered || 0) >= netPayable
                        ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 border-emerald-500 cursor-pointer active:scale-95'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-blue-500 cursor-pointer active:scale-95'
                }`}
              >
                {isInsufficientCash ? (
                  <>
                    <AlertTriangle className="w-5 h-5 shrink-0 text-white animate-bounce" />
                    <span>Insufficient Amount: Enter Full {currencySymbol}{netPayable.toFixed(2)} or 0 for Cabin Payment</span>
                  </>
                ) : paymentMethod === 'CASH' && Number(cashTendered || 0) === 0 ? (
                  <>
                    <Stethoscope className="w-5 h-5 shrink-0" />
                    <span>✓ Continue & Issue Token (Payment in Doctor Cabin)</span>
                  </>
                ) : paymentMethod === 'CASH' && Number(cashTendered || 0) >= netPayable ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>✓ Settle Fee & Issue Paid Token (Change: {currencySymbol}{changeDue.toFixed(2)})</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>Pay {currencySymbol}{netPayable.toFixed(2)} & Issue Token Slip</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 7: TOKEN ISSUED CONFIRMATION & QUEUE PASS (HOSPITAL STANDARD & TOUCH-FIRST)
          ========================================================================= */}
      {currentStep === 7 && issuedResult && (
        <div className="flex-1 flex flex-col items-center justify-start sm:justify-center max-w-2xl mx-auto my-auto text-center w-full py-2 px-2 min-h-0 overflow-y-auto">
          {/* Top Status Icon & Hospital Grade Clinical Beacon */}
          <div className="flex items-center justify-center gap-2.5 mb-2 shrink-0">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-white flex items-center justify-center shadow-md ${
              issuedResult.patient.isEmergency ? 'bg-rose-600 shadow-rose-600/30 animate-bounce' : 'bg-teal-600 shadow-teal-600/25'
            }`}>
              {issuedResult.patient.isEmergency ? <AlertTriangle className="w-5 h-5 text-amber-300 stroke-[3]" /> : <Check className="w-5 h-5 stroke-[3]" />}
            </div>
            <div className="text-left">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                issuedResult.patient.isEmergency
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-teal-50 text-teal-800 border-teal-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-ping ${issuedResult.patient.isEmergency ? 'bg-rose-600' : 'bg-teal-500'}`} />
                <span>{issuedResult.patient.isEmergency ? '🚨 Emergency Priority Token Active' : 'Token Active in Live Queue'}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                {issuedResult.patient.isEmergency ? 'Emergency Registration Confirmed' : 'Registration Confirmed'}
              </h2>
            </div>
          </div>

          {/* Hospital Standard Clinical Queue Pass Card */}
          <div className={`p-3.5 sm:p-4 rounded-2xl bg-white border-2 shadow-md w-full text-left space-y-2.5 max-w-xl ${
            issuedResult.patient.isEmergency ? 'border-rose-400 ring-4 ring-rose-500/10' : 'border-teal-200/80'
          }`}>
            {/* Header: Clinic Emblem & Estimated Wait */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-1.5">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold border ${
                  issuedResult.patient.isEmergency ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-teal-50 text-teal-700 border-teal-200'
                }`}>
                  <Stethoscope className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-extrabold text-xs text-slate-900 block leading-tight">
                    {clinicSettings?.clinicName || 'Apex Specialist Care'}
                  </span>
                  <span className={`text-[9px] font-bold ${issuedResult.patient.isEmergency ? 'text-rose-700 font-black' : 'text-teal-700'}`}>
                    {issuedResult.patient.isEmergency ? '🚨 Emergency & Minor Procedures Pass' : 'Official Outpatient Queue Pass'}
                  </span>
                </div>
              </div>

              <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[11px] font-bold ${
                issuedResult.patient.isEmergency ? 'bg-rose-50 border-rose-200 text-rose-800 font-black' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <Clock className={`w-3 h-3 ${issuedResult.patient.isEmergency ? 'text-rose-600' : 'text-teal-600'}`} />
                <span>
                  {issuedResult.patient.isEmergency ? (
                    'Est. Wait: IMMEDIATE ADMISSION'
                  ) : (
                    <>Est. Wait: <strong>~{getEstimatedWaitTime(issuedResult.patient.cabinId || 'any', issuedResult.patient.id)} Mins</strong></>
                  )}
                </span>
              </div>
            </div>

            {/* Giant Monospace Token Numeral */}
            <div className={`text-center py-2 rounded-xl border ${
              issuedResult.patient.isEmergency
                ? 'bg-gradient-to-b from-rose-50 via-red-50/50 to-rose-50 border-rose-200'
                : 'bg-gradient-to-b from-teal-50/50 via-slate-50/50 to-teal-50/30 border-teal-100'
            }`}>
              <span className={`text-[10px] font-black uppercase tracking-widest ${
                issuedResult.patient.isEmergency ? 'text-rose-700' : 'text-slate-500'
              }`}>
                {issuedResult.patient.isEmergency ? '🚨 Emergency Priority Token Number' : 'Your Priority Token Number'}
              </span>
              <div className={`text-4xl sm:text-5xl font-black font-mono tracking-tight my-0.5 ${
                issuedResult.patient.isEmergency ? 'text-rose-700' : 'text-teal-800'
              }`}>
                {issuedResult.patient.tokenNumber}
              </div>
              <div className="text-xs text-slate-600 font-medium">
                {issuedResult.patient.patientName} • {issuedResult.patient.gender}, {issuedResult.patient.age}y
              </div>
            </div>

            {/* Station, Specialist & Upfront Settlement Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-black tracking-wider">
                    Assigned Clinical Cabin
                  </span>
                  <div className="text-sm font-black text-slate-900 mt-0.5">
                    Cabin {issuedResult.patient.cabinId}
                  </div>
                  <div className="text-[11px] font-bold text-teal-700">
                    {issuedResult.patient.department}
                  </div>
                </div>
                <div className="mt-1 pt-1 border-t border-slate-200/60 text-[10px] text-slate-600 font-medium truncate">
                  Physician: <strong className="text-slate-900">{issuedResult.patient.doctorName}</strong>
                </div>
              </div>

              {issuedResult.invoice.status === 'PAID_UPFRONT' || issuedResult.invoice.status === 'SETTLED' ? (
                <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-200 flex flex-col justify-between">
                  <div>
                    <span className="text-teal-700 block text-[9px] uppercase font-black tracking-wider">
                      Consultation Fee Settled
                    </span>
                    <div className="text-sm font-black text-teal-900 mt-0.5">
                      PAID: {currencySymbol}{issuedResult.invoice.total.toFixed(2)}
                    </div>
                    <div className="text-[11px] font-semibold text-teal-800 capitalize">
                      Method: {issuedResult.invoice.paymentMethod.toLowerCase().replace('_', ' ')}
                    </div>
                  </div>
                  <div className="mt-1 pt-1 border-t border-teal-200/60 text-[10px] text-teal-800 font-mono">
                    Ref: {issuedResult.invoice.invoiceNumber}
                  </div>
                </div>
              ) : issuedResult.invoice.status === 'PAY_IN_CABIN' ? (
                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-300 flex flex-col justify-between text-left">
                  <div>
                    <div className="flex items-center gap-1.5 text-purple-800 text-[10px] uppercase font-black tracking-wider">
                      <Stethoscope className="w-3.5 h-3.5 text-purple-700" />
                      <span>Payment in Doctor Cabin</span>
                    </div>
                    <div className="text-sm font-black text-purple-950 mt-0.5">
                      FEE TO SETTLE: {currencySymbol}{issuedResult.invoice.total.toFixed(2)}
                    </div>
                    <div className="text-[10px] font-medium text-purple-900 mt-0.5">
                      Please settle consultation fee directly inside Cabin {issuedResult.patient.cabinId || 1} with {issuedResult.patient.doctorName}.
                    </div>
                  </div>
                  <div className="mt-1 pt-1 border-t border-purple-200 text-[10px] text-purple-800 font-mono">
                    Ref: {issuedResult.invoice.invoiceNumber} • Status: Pay in Cabin
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-300 flex flex-col justify-between">
                  <div>
                    <span className="text-amber-800 block text-[9px] uppercase font-black tracking-wider">
                      Fee Due at Cashier Counter
                    </span>
                    <div className="text-sm font-black text-amber-950 mt-0.5">
                      UNPAID: {currencySymbol}{issuedResult.invoice.total.toFixed(2)}
                    </div>
                    <div className="text-[10px] font-semibold text-amber-900 mt-0.5">
                      Please settle {currencySymbol}{issuedResult.invoice.total.toFixed(2)} at cashier counter
                    </div>
                  </div>
                  <div className="mt-1 pt-1 border-t border-amber-200/80 text-[10px] text-amber-800 font-mono">
                    Ref: {issuedResult.invoice.invoiceNumber}
                  </div>
                </div>
              )}
            </div>

            {/* Recorded Vitals Telemetry */}
            {issuedResult.patient.vitals && (
              <div className="pt-1.5 border-t border-dashed border-slate-200">
                <div className="text-[9px] font-black uppercase text-slate-500 tracking-wider mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-teal-600" />
                    Recorded Triage Telemetry:
                  </span>
                  <span className="text-[9px] text-teal-700 font-bold">✓ Logged to Cabin Console</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-center font-mono font-bold text-slate-800 text-xs">
                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                    <span className="text-[8px] text-slate-400 block font-sans font-bold">TEMP</span>
                    <span className="text-rose-600 font-black text-[11px]">{issuedResult.patient.vitals.temp}</span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                    <span className="text-[8px] text-slate-400 block font-sans font-bold">BP</span>
                    <span className={`font-black text-[11px] ${issuedResult.patient.vitals.bp === 'Deferred' ? 'text-amber-600 font-sans text-[10px]' : 'text-slate-900'}`}>
                      {issuedResult.patient.vitals.bp}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                    <span className="text-[8px] text-slate-400 block font-sans font-bold">PULSE</span>
                    <span className={`font-black text-[11px] ${issuedResult.patient.vitals.pulse === 'Deferred' ? 'text-amber-600 font-sans text-[10px]' : 'text-pink-700'}`}>
                      {issuedResult.patient.vitals.pulse}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                    <span className="text-[8px] text-slate-400 block font-sans font-bold">SPO2</span>
                    <span className={`font-black text-[11px] ${issuedResult.patient.vitals.spo2 === 'Deferred' ? 'text-amber-600 font-sans text-[10px]' : 'text-sky-700'}`}>
                      {issuedResult.patient.vitals.spo2}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Hardware Printer Auto-Routing Notice */}
            {(() => {
              const thermalDevice = clinicSettings?.printerSettings?.hardwareDevices?.find((d) => d.slot === 1) || {
                name: 'Front-Desk Thermal Slip Printer',
                status: 'CONNECTED'
              };
              const isThermalAttached = thermalDevice.status === 'CONNECTED';

              return (
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-600 flex items-center justify-between flex-wrap gap-1.5">
                  <div className="flex items-center gap-1 font-medium">
                    <Printer className="w-3 h-3 text-teal-600 shrink-0" />
                    <span>
                      Paper: <strong>{clinicSettings?.printerSettings?.thermalPaperWidth || '80mm'} POS Roll</strong> • Slot 1: {thermalDevice.name}
                    </span>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                    isThermalAttached
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : 'text-amber-800 bg-amber-50 border-amber-200'
                  }`}>
                    {isThermalAttached ? 'Hardware Attached (Silent)' : 'Direct PDF Fallback Active'}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Touch-Screen First Action Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-xl mt-3 shrink-0">
            {(() => {
              const thermalDevice = clinicSettings?.printerSettings?.hardwareDevices?.find((d) => d.slot === 1) || {
                name: 'Front-Desk Thermal Slip Printer',
                status: 'CONNECTED'
              };
              const isThermalAttached = thermalDevice.status === 'CONNECTED';

              return (
                <button
                  type="button"
                  onClick={() => {
                    clinicAudio.triggerHaptic(20);
                    setShowQueueTokenModal(true);
                  }}
                  className={`flex-1 w-full min-h-[44px] px-4 py-2.5 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer ${
                    isThermalAttached
                      ? 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-teal-700/25'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 shadow-emerald-700/25'
                  }`}
                >
                  {isThermalAttached ? (
                    <>
                      <Printer className="w-4 h-4 shrink-0" />
                      <span className="whitespace-nowrap">Print Queue Token Slip</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 shrink-0" />
                      <span className="whitespace-nowrap">Download Token Slip (PDF)</span>
                    </>
                  )}
                </button>
              );
            })()}

            <button
              type="button"
              onClick={() => {
                clinicAudio.triggerHaptic(20);
                setShowLaserModal(true);
              }}
              className="min-h-[44px] px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-2xs whitespace-nowrap cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>View Invoice</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="min-h-[44px] px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <span>Done ({autoResetTimer}s)</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          STEP 8: APPOINTMENT CONFIRMATION SLIP & DETAILS (SPECIALIST RESERVED)
          ========================================================================= */}
      {currentStep === 8 && bookedAppointmentSlip && (
        <div className="flex-1 flex flex-col items-center justify-start sm:justify-center max-w-2xl mx-auto my-auto text-center w-full py-2 px-2 min-h-0 overflow-y-auto animate-in fade-in duration-200">
          {/* Top Status Icon & Clinical Beacon */}
          <div className="flex items-center justify-center gap-2.5 mb-2 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/25">
              <Calendar className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                <span>Appointment Confirmed & Scheduled</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                Consultation Slot Reserved
              </h2>
            </div>
          </div>

          {/* Hospital Standard Appointment Pass Card */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border-2 border-indigo-200/80 shadow-md w-full text-left space-y-2.5 max-w-xl">
            {/* Header: Clinic Emblem */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold border border-indigo-200">
                  <Stethoscope className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-extrabold text-xs text-slate-900 block leading-tight">
                    {clinicSettings?.clinicName || 'Apex Specialist Care'}
                  </span>
                  <span className="text-[9px] text-indigo-700 font-bold">
                    Official Appointment Confirmation Slip
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-[11px] font-bold">
                <Clock className="w-3 h-3 text-indigo-600" />
                <span>{bookedAppointmentSlip.date}: {bookedAppointmentSlip.timeSlot}</span>
              </div>
            </div>

            {/* Giant Monospace Appointment Ref Numeral */}
            <div className="text-center py-2 bg-gradient-to-b from-indigo-50/50 via-slate-50/50 to-indigo-50/30 rounded-xl border border-indigo-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Appointment Reference Number
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono text-indigo-900 tracking-tight my-0.5">
                {bookedAppointmentSlip.appointmentNumber}
              </div>
              <div className="text-xs text-slate-600 font-medium">
                {bookedAppointmentSlip.patientName} • {bookedAppointmentSlip.gender}, {bookedAppointmentSlip.age}y
              </div>
            </div>

            {/* Specialist, Cabin & Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-black tracking-wider">
                    Assigned Specialist & Cabin
                  </span>
                  <div className="text-sm font-black text-slate-900 mt-0.5">
                    Cabin {bookedAppointmentSlip.cabinId}: {bookedAppointmentSlip.department}
                  </div>
                  <div className="text-[11px] font-bold text-indigo-700">
                    {bookedAppointmentSlip.doctorName}
                  </div>
                </div>
                <div className="mt-1 pt-1 border-t border-slate-200/60 text-[10px] text-slate-600 font-medium truncate">
                  Fee: <strong className="text-slate-900">{currencySymbol}{consultationFee}</strong> (Pay at cabin)
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-200 flex flex-col justify-between">
                <div>
                  <span className="text-indigo-700 block text-[9px] uppercase font-black tracking-wider">
                    Reserved Slot Details
                  </span>
                  <div className="text-sm font-black text-indigo-950 mt-0.5">
                    {bookedAppointmentSlip.date}
                  </div>
                  <div className="text-[11px] font-bold text-indigo-800">
                    Slot Time: {bookedAppointmentSlip.timeSlot}
                  </div>
                </div>
                <div className="mt-1 pt-1 border-t border-indigo-200/60 text-[10px] text-indigo-900 font-medium truncate">
                  SMS sent to: <strong className="font-mono text-slate-900">{bookedAppointmentSlip.phone}</strong>
                </div>
              </div>
            </div>

            {/* Hardware Printer Notice */}
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-600 flex items-center justify-between flex-wrap gap-1.5">
              <div className="flex items-center gap-1 font-medium">
                <Printer className="w-3 h-3 text-indigo-600 shrink-0" />
                <span>
                  Paper: <strong>{clinicSettings?.printerSettings?.thermalPaperWidth || '80mm'} POS Roll / A4</strong>
                </span>
              </div>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border text-emerald-700 bg-emerald-50 border-emerald-200">
                Ready for Print / PDF
              </span>
            </div>
          </div>

          {/* Touch-Screen First Action Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-xl mt-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                clinicAudio.triggerHaptic(20);
                setShowAppointmentSlipModal(true);
              }}
              className="flex-1 w-full min-h-[44px] px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Print Appointment Slip</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="min-h-[44px] px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <span>Done ({autoResetTimer}s)</span>
            </button>
          </div>
        </div>
      )}
      </StepErrorBoundary>

      {/* Appointment Slip Modal for Laser / Thermal Printing */}
      {showAppointmentSlipModal && bookedAppointmentSlip && (
        <AppointmentSlipModal
          appointment={bookedAppointmentSlip}
          onClose={() => setShowAppointmentSlipModal(false)}
        />
      )}

      {/* Pure Queue Token Slip Modal (Standard 80mm Thermal Paper Without Bill) */}
      {showQueueTokenModal && issuedResult && (
        <QueueTokenThermalSlipModal
          patient={issuedResult.patient}
          onClose={() => setShowQueueTokenModal(false)}
        />
      )}

      {/* Laser Medical Invoice Modal for Instant Printing */}
      {showLaserModal && issuedResult && (
        <LaserMedicalInvoice
          invoice={issuedResult.invoice}
          onClose={() => setShowLaserModal(false)}
        />
      )}

      {/* Bottom Back Button & Navigation Bar */}
      {currentStep !== 0 && currentStep !== 'EMERGENCY_TRIAGE' && currentStep !== 5 && currentStep !== 6 && currentStep !== 7 && currentStep !== 8 && (
        <div className="pt-2 sm:pt-3 border-t border-slate-200 flex items-center justify-between mt-2 sm:mt-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              clinicAudio.triggerHaptic(15);
              setCurrentStep((prev) => prev === 'CHECKIN_SEARCH' ? 0 : Math.max(0, prev - 1));
            }}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {currentStep === 1 && (
            <button
              type="button"
              disabled={selectedSymptoms.length === 0}
              onClick={() => {
                clinicAudio.triggerHaptic(20);
                setCurrentStep(2);
              }}
              className={`px-5 py-2.5 font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 ${
                selectedSymptoms.length > 0
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white cursor-pointer shadow-blue-500/25'
                  : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-75'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{selectedSymptoms.length > 0 ? `Add for Next Step (${selectedSymptoms.length})` : 'Select Symptom to Add for Next Step'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 font-bold text-xs flex items-center gap-2 hover:text-rose-600 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart</span>
          </button>
        </div>
      )}
    </div>
  );
};
