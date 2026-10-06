import React, { useState, useMemo, useEffect } from 'react';
import {
  CreditCard,
  Calendar,
  Banknote,
  ShieldCheck,
  QrCode,
  Printer,
  Receipt,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Pill,
  Stethoscope,
  Building2,
  DollarSign,
  FileSpreadsheet,
  Clock,
  UserPlus,
  UserX,
  RefreshCw,
  X,
  Thermometer,
  Activity,
  Heart
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useClinic } from '../../context/useClinic';
import { clinicAudio } from '../../utils/clinicAudio';
import { WorkstationHeaderControls } from '../common/WorkstationHeaderControls';
import { LaserMedicalInvoice } from '../printing/LaserMedicalInvoice';
import { ShiftReportModal } from './ShiftReportModal';
import { QueueTokenThermalSlipModal } from '../printing/QueueTokenThermalSlipModal';

export const BillingPharmacyPOS = () => {
  const {
    patients,
    invoices,
    cabins,
    appointments,
    timeSlots,
    checkInAppointment,
    cancelAppointment,
    rescheduleAppointment,
    markAppointmentNoShow,
    settleInvoice,
    settlePatientMedications,
    registerPatient,
    pharmacyFormulary,
    pharmacyQueue,
    currencySymbol,
    formatCurrency,
    clinicSettings
  } = useClinic();

  const [activeTab, setActiveTab] = useState('ALL_INVOICES'); // 'ALL_INVOICES' | 'APPOINTMENTS_CHECKIN' | 'PHARMACY_PENDING'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLaserInvoice, setActiveLaserInvoice] = useState(null);
  const [activeQueueTokenPatient, setActiveQueueTokenPatient] = useState(null);
  const [showShiftReport, setShowShiftReport] = useState(false);

  const defaultMethod = clinicSettings?.paymentSettings?.defaultMethod || 'CASH';

  // Appointment Check-In Modal States (Reception Desk Intake)
  const [selectedAppointmentForCheckIn, setSelectedAppointmentForCheckIn] = useState(null);
  const [aptCheckInTemp, setAptCheckInTemp] = useState('98.6');
  const [aptCheckInBP, setAptCheckInBP] = useState('120/80');
  const [aptCheckInPulse, setAptCheckInPulse] = useState('76');
  const [aptCheckInSpO2, setAptCheckInSpO2] = useState('98');
  const [aptCheckInWeight, setAptCheckInWeight] = useState('70');
  const [aptPaymentMethod, setAptPaymentMethod] = useState(defaultMethod);
  const [aptInsuranceCoPay, setAptInsuranceCoPay] = useState(0);
  const [aptDiscount, setAptDiscount] = useState(0);
  const [aptCashTendered, setAptCashTendered] = useState(0);

  // Reschedule Modal State
  const [rescheduleAppointmentTarget, setRescheduleAppointmentTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('Today');
  const [rescheduleSlot, setRescheduleSlot] = useState(timeSlots?.[0] || '10:00 AM');

  // Quick Issue Walk-in Token & Bill Modal
  const [showNewTokenModal, setShowNewTokenModal] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState('35');
  const [newPatientGender, setNewPatientGender] = useState('Male');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientCabinId, setNewPatientCabinId] = useState(1);
  const [newPaymentMethod, setNewPaymentMethod] = useState(defaultMethod);
  const [newInsuranceCoPay, setNewInsuranceCoPay] = useState(0);

  // Triage Vitals for Quick Token Issuance
  const [newPatientTemp, setNewPatientTemp] = useState('98.6');
  const [newPatientBP, setNewPatientBP] = useState('122/72');
  const [newPatientPulse, setNewPatientPulse] = useState('84');
  const [newPatientSpO2, setNewPatientSpO2] = useState('97');

  // Pharmacy Medication Settlement States
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [pharmacyPaymentMethod, setPharmacyPaymentMethod] = useState(defaultMethod);

  // Patients who have pending pharmacy medications
  const pharmacyPendingPatients = useMemo(() => {
    return patients.filter((p) => p.status === 'BILLING_PENDING');
  }, [patients]);

  const selectedPatient = useMemo(() => {
    if (selectedPatientId) {
      return patients.find((p) => p.id === selectedPatientId) || null;
    }
    return pharmacyPendingPatients[0] || null;
  }, [selectedPatientId, patients, pharmacyPendingPatients]);

  // Handle Quick Walk-in Token & Upfront Bill Issuance from Billing Desk
  const handleQuickIssueToken = (e) => {
    e.preventDefault();
    clinicAudio.triggerHaptic(30);

    const selectedCabin = cabins.find((c) => c.cabinId === Number(newPatientCabinId)) || cabins[0];

    const result = registerPatient(
      {
        patientName: newPatientName.trim() || 'Walk-in Patient',
        age: parseInt(newPatientAge, 10) || 35,
        gender: newPatientGender,
        phone: newPatientPhone.trim(),
        cabinId: selectedCabin.cabinId,
        bookingType: 'WALK_IN',
        vitals: {
          temp: `${newPatientTemp}°F`,
          bp: `${newPatientBP.includes('mmHg') ? newPatientBP : newPatientBP + ' mmHg'}`,
          pulse: `${newPatientPulse.includes('bpm') ? newPatientPulse : newPatientPulse + ' bpm'}`,
          spo2: `${newPatientSpO2.includes('%') ? newPatientSpO2 : newPatientSpO2 + '%'}`
        },
        services: [
          {
            id: `srv-c${selectedCabin.cabinId}`,
            name: `Specialist Consultation (${selectedCabin.department})`,
            price: selectedCabin.consultationFee,
            category: 'Consultation',
            code: `CON-0${selectedCabin.cabinId}`
          }
        ]
      },
      {
        paymentMethod: newPaymentMethod,
        insuranceCoPay: Number(newInsuranceCoPay),
        discount: 0
      }
    );

    // Reset Form
    setNewPatientName('');
    setNewPatientPhone('');
    setNewPatientTemp('98.6');
    setNewPatientBP('122/72');
    setNewPatientPulse('84');
    setNewPatientSpO2('97');
    setNewInsuranceCoPay(0);
    setShowNewTokenModal(false);

    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });

    // Offer Queue Token Thermal Slip (Without Bill) and Invoice
    if (result?.patient) {
      setActiveQueueTokenPatient(result.patient);
    }
    if (result?.invoice) {
      setActiveLaserInvoice(result.invoice);
    }
  };

  // Handle Appointment Check-in & Intake at Reception Counter
  const handleOpenAppointmentCheckIn = (apt) => {
    clinicAudio.triggerHaptic(20);
    setSelectedAppointmentForCheckIn(apt);
    setAptCheckInTemp('98.6');
    setAptCheckInBP('120/80');
    setAptCheckInPulse('76');
    setAptCheckInSpO2('98');
    setAptCheckInWeight('70');
    setAptPaymentMethod('CARD');
    setAptInsuranceCoPay(0);
    setAptDiscount(0);
    setAptCashTendered(0);
  };

  const handleConfirmAppointmentCheckIn = (e) => {
    e.preventDefault();
    if (!selectedAppointmentForCheckIn) return;
    clinicAudio.triggerHaptic(30);

    const vitalsData = {
      temp: `${aptCheckInTemp}°F`,
      bp: aptCheckInBP.includes('mmHg') ? aptCheckInBP : `${aptCheckInBP} mmHg`,
      pulse: aptCheckInPulse.includes('bpm') ? aptCheckInPulse : `${aptCheckInPulse} bpm`,
      spo2: aptCheckInSpO2.includes('%') ? aptCheckInSpO2 : `${aptCheckInSpO2}%`,
      weight: aptCheckInWeight.includes('kg') ? aptCheckInWeight : `${aptCheckInWeight} kg`
    };

    const billingData = {
      paymentMethod: aptPaymentMethod,
      insuranceCoPay: Number(aptInsuranceCoPay),
      discount: Number(aptDiscount),
      cashTendered: aptPaymentMethod === 'CASH' ? Number(aptCashTendered) : null
    };

    const result = checkInAppointment(selectedAppointmentForCheckIn.id, vitalsData, billingData);

    if (result) {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      setSelectedAppointmentForCheckIn(null);
      if (result.patient) {
        setActiveQueueTokenPatient(result.patient);
      }
      if (result.invoice) {
        setActiveLaserInvoice(result.invoice);
      }
    }
  };

  // Handle Pharmacy Post-Consultation Settlement (Fixed: transitions to COMPLETED, creates paid invoice, dispenses rx)
  const handleSettlePharmacyMedications = () => {
    if (!selectedPatient) return;
    clinicAudio.triggerHaptic(30);

    const inv = settlePatientMedications(selectedPatient.id, {
      paymentMethod: pharmacyPaymentMethod,
      insuranceCoPay: 0,
      discount: 0
    });

    if (inv) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      setActiveLaserInvoice(inv);
      setSelectedPatientId(null);
    }
  };

  const selectedCabinForNewToken = cabins.find((c) => c.cabinId === Number(newPatientCabinId)) || cabins[0];
  const netUpfrontPayable = Math.max(0, selectedCabinForNewToken.consultationFee - Number(newInsuranceCoPay));

  // Image 2 SaaS Dashboard Metric KPIs
  const totalCollections = useMemo(() => {
    return invoices
      .filter((inv) => inv.status === 'PAID_UPFRONT' || inv.status === 'SETTLED' || inv.status === 'PAID')
      .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  }, [invoices]);

  const pendingInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.status !== 'PAID_UPFRONT' && inv.status !== 'SETTLED' && inv.status !== 'PAID');
  }, [invoices]);

  const pendingTotal = useMemo(() => {
    return pendingInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  }, [pendingInvoices]);

  const clearanceRate = useMemo(() => {
    if (invoices.length === 0) return 100;
    const paidCount = invoices.length - pendingInvoices.length;
    return Math.round((paidCount / invoices.length) * 100);
  }, [invoices, pendingInvoices]);

  // Hardware Keyboard Shortcuts for POS Billing Terminal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showNewTokenModal || selectedAppointmentForCheckIn || rescheduleAppointmentTarget || showShiftReport || activeLaserInvoice || activeQueueTokenPatient) {
        if (e.key === 'Escape') {
          setShowNewTokenModal(false);
          setSelectedAppointmentForCheckIn(null);
          setRescheduleAppointmentTarget(null);
          setShowShiftReport(false);
          setActiveLaserInvoice(null);
          setActiveQueueTokenPatient(null);
        }
        return;
      }

      if (e.key === 'F2') {
        e.preventDefault();
        setShowNewTokenModal(true);
      } else if (e.key === 'Escape') {
        if (searchQuery) {
          setSearchQuery('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showNewTokenModal, selectedAppointmentForCheckIn, rescheduleAppointmentTarget, showShiftReport, activeLaserInvoice, activeQueueTokenPatient, searchQuery]);

  return (
    <div className="flex-1 min-h-0 bg-[#F8F9FA] text-slate-800 flex flex-col overflow-hidden select-none font-sans h-full">
      {/* Top Status Bar (Image 2 Style) */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 shadow-2xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#8B0029] text-white flex items-center justify-center shadow-xs shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                Billing Counter & Patient Invoices
              </h1>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold uppercase">
                Laser POS Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Manage, track, and settle incoming patient tokens and prescriptions.
            </p>
          </div>
        </div>

        {/* Action Buttons with Image 2 Red CTA Style */}
        <div className="flex items-center gap-2">
          {/* Issue Token & Bill Button (Vibrant Crimson CTA Button from Image 2) */}
          <button
            type="button"
            onClick={() => {
              clinicAudio.triggerHaptic(20);
              setShowNewTokenModal(true);
            }}
            className="btn-crimson px-3.5 py-2 text-xs flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer font-bold"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Issue Token (F2)</span>
          </button>

          {/* Shift Report Button */}
          <button
            type="button"
            onClick={() => {
              clinicAudio.triggerHaptic(15);
              setShowShiftReport(true);
            }}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#8B0029]" />
            <span>Shift Audit</span>
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />
          <WorkstationHeaderControls />
        </div>
      </div>

      {/* 4 KPI Stat Metric Cards (Directly Matching Image 2) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 px-3 sm:px-4 pt-2.5 pb-1 shrink-0">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-2xs">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
            TOTAL INVOICES
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {invoices.length}
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-2xs">
          <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600 mb-0.5">
            CONVERSION RATE
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
            {clearanceRate}%
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-2xs">
          <div className="text-[10px] font-black uppercase tracking-wider text-blue-600 mb-0.5">
            ACTIVE PIPELINE
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-700 font-mono">
            {currencySymbol} {pendingTotal.toLocaleString()}
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-2xs">
          <div className="text-[10px] font-black uppercase tracking-wider text-rose-600 mb-0.5">
            ACTION NEEDED
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-700 font-mono">
            {pendingInvoices.length + (pharmacyPendingPatients?.length || 0)}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-2.5 p-2 sm:p-2.5 md:p-3 overflow-hidden h-full">
        {/* Left Column: List of Paid Invoices (7 Cols) */}
        <div className="md:col-span-7 bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 flex flex-col shadow-2xs min-h-0 overflow-hidden h-full">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2 flex-wrap gap-2 shrink-0">
            {/* View Tabs Toggle (Image 2 Segmented Style) */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(15);
                  setActiveTab('ALL_INVOICES');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'ALL_INVOICES'
                    ? 'bg-[#8B0029] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Invoices ({invoices.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(15);
                  setActiveTab('APPOINTMENTS_CHECKIN');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'APPOINTMENTS_CHECKIN'
                    ? 'bg-[#8B0029] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Appointments ({appointments.filter(a => a.status === 'SCHEDULED').length} Due)</span>
                {appointments.filter(a => a.status === 'SCHEDULED').length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            </div>

            {/* Pill Search Box (Image 2 Style with ⌘K Badge) */}
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search token, patient, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-full pl-9 pr-10 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#8B0029] shadow-2xs transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono font-bold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">
                ⌘K
              </span>
            </div>
          </div>

          {/* Invoices List OR Scheduled Appointments Check-in List */}
          {activeTab === 'APPOINTMENTS_CHECKIN' ? (
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2 text-indigo-950 font-bold">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Scheduled Appointment Arrival Desk</span>
                </div>
                <span className="text-[11px] text-indigo-700">Click Check-in to record vitals, collect fee & issue token</span>
              </div>

              {(() => {
                const filteredApts = (appointments || []).filter((a) => {
                  const q = searchQuery.toLowerCase();
                  return (
                    (a.patientName && a.patientName.toLowerCase().includes(q)) ||
                    (a.appointmentNumber && a.appointmentNumber.toLowerCase().includes(q)) ||
                    (a.phone && a.phone.toLowerCase().includes(q))
                  );
                });

                if (filteredApts.length === 0) {
                  return (
                    <div className="p-10 text-center text-slate-400">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-bold">No appointments found matching search.</p>
                    </div>
                  );
                }

                return filteredApts.map((apt) => {
                  const isScheduled = apt.status === 'SCHEDULED';
                  const aptCabin = cabins.find((c) => c.cabinId === apt.cabinId) || cabins[0];

                  return (
                    <div
                      key={apt.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isScheduled
                          ? 'bg-white border-indigo-100 hover:border-indigo-300 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-xs ${
                          isScheduled ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {apt.appointmentNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900">{apt.patientName}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isScheduled
                                ? 'bg-emerald-100 text-emerald-800'
                                : apt.status === 'CHECKED_IN'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {apt.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Cabin {apt.cabinId} • {apt.doctorName?.split(',')[0]} • <span className="font-bold text-indigo-700">{apt.date || 'Today'}, {apt.timeSlot}</span>
                          </div>
                          {apt.phone && <div className="text-[11px] text-slate-400 font-mono">Tel: {apt.phone}</div>}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isScheduled ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenAppointmentCheckIn(apt)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Check-In</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRescheduleAppointmentTarget(apt);
                                setRescheduleDate(apt.date || 'Today');
                                setRescheduleSlot(apt.timeSlot || timeSlots?.[0] || '10:00 AM');
                              }}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Reschedule Appointment Time"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Reschedule</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Mark appointment ${apt.appointmentNumber} for ${apt.patientName} as NO-SHOW?`)) {
                                  markAppointmentNoShow(apt.id);
                                }
                              }}
                              className="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Mark Patient as No-Show"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>No-Show</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Cancel appointment ${apt.appointmentNumber} for ${apt.patientName}?`)) {
                                  cancelAppointment(apt.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Cancel Appointment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : apt.status === 'NO_SHOW' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-rose-700 px-2 py-1 bg-rose-50 border border-rose-200 rounded-xl">
                              Missed / No-Show
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setRescheduleAppointmentTarget(apt);
                                setRescheduleDate('Tomorrow');
                                setRescheduleSlot(timeSlots?.[0] || '10:00 AM');
                              }}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Reschedule</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-500 px-2.5 py-1 bg-slate-100 rounded-xl">
                            {apt.status === 'CHECKED_IN' ? '✓ Token Issued' : 'Cancelled'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
          /* Invoices List */
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {invoices.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Receipt className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold">No invoices generated yet.</p>
              </div>
            ) : (
              invoices
                .filter(
                  (inv) =>
                    inv.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    inv.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3.5 rounded-2xl bg-blue-50/40 hover:bg-blue-50 border border-blue-100 flex items-center justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black font-mono text-blue-800">{inv.tokenNumber}</span>
                        <span className="text-xs font-black text-slate-900">{inv.patientName}</span>
                        {inv.status === 'REFUND_DUE' ? (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                            Token Returned (Refund Due)
                          </span>
                        ) : (inv.status === 'PAID_UPFRONT' || inv.status === 'SETTLED') ? (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                            Paid
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-300 animate-pulse">
                            Fee Due at Counter
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Cabin {inv.cabinId} ({inv.department}) • {inv.invoiceNumber}
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                      <div className="text-sm font-black text-blue-900">{currencySymbol}{inv.total.toFixed(2)}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {inv.status !== 'PAID_UPFRONT' && inv.status !== 'SETTLED' && (
                          <button
                            type="button"
                            onClick={() => {
                              clinicAudio.triggerHaptic(20);
                              settleInvoice(inv.id, 'CASH');
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                            title="Collect cash consultation fee at counter"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>Collect Fee</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            clinicAudio.triggerHaptic(15);
                            setActiveLaserInvoice(inv);
                          }}
                          className="px-3 py-1 bg-white hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print Laser A4</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
          )}
        </div>

        {/* Right Column: Pharmacy Prescription Dispensation (5 Cols) */}
        <div className="md:col-span-5 bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-2xs min-h-0 overflow-hidden h-full">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2 shrink-0">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-purple-600" />
              Prescription Dispensation & Extra Labs
            </h2>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 font-extrabold">
              {pharmacyPendingPatients.length} Waiting
            </span>
          </div>

          {pharmacyPendingPatients.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <CheckCircle2 className="w-10 h-10 mb-2 text-emerald-500" />
              <h3 className="text-xs font-bold text-slate-800">Pharmacy Counter Clear</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs">
                Patients who receive additional prescriptions during their cabin consultation will appear here for medication collection.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between overflow-hidden min-h-0">
              <div className="space-y-1.5 overflow-y-auto pr-0.5 flex-1 min-h-0">
                {pharmacyPendingPatients.map((p) => {
                  const isSelected = selectedPatient?.id === p.id;
                  const medsCount = (p.prescriptions || []).length;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        clinicAudio.triggerHaptic(15);
                        setSelectedPatientId(p.id);
                      }}
                      className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-purple-50/80 border-purple-500 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 hover:border-purple-200 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-900">{p.tokenNumber}</span>
                          <span className="text-xs font-black text-slate-900 truncate max-w-[130px]">{p.patientName}</span>
                        </div>
                        <span className="text-[9px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded">
                          {medsCount} Meds
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Cabin {p.cabinId} • {p.doctorName.split(',')[0]}
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedPatient && (() => {
                const rxQueueItem = (pharmacyQueue || []).find(
                  (q) => q.tokenNumber === selectedPatient.tokenNumber || q.patientId === selectedPatient.id || q.patientId === selectedPatient.patientId
                );
                const isDispensed = rxQueueItem?.status === 'DISPENSED';
                const totalMedPrice = (selectedPatient.prescriptions || []).reduce((acc, rx) => acc + (rx.price || 0), 0);

                return (
                  <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5 shrink-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Prescription Itemized Ledger:</span>
                      {isDispensed ? (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ✓ Dispensed by Pharmacy Desk
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          ⏳ Awaiting Pharmacy Dispense
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 max-h-28 overflow-y-auto">
                      {(selectedPatient.prescriptions || []).map((rx) => (
                        <div key={rx.id} className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-900 text-xs">{rx.name}</span>
                            <span className="text-[9px] text-slate-500 block">{rx.dosage} • {rx.duration}</span>
                          </div>
                          <span className="font-mono font-bold text-xs text-slate-800">{formatCurrency(rx.price || 15)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-500 leading-snug">
                      ℹ️ Physical medication dispensation is exclusively conducted by the In-house Pharmacy Desk. Billing desk settles financial charges and prints laser invoices.
                    </div>

                    <button
                      type="button"
                      onClick={handleSettlePharmacyMedications}
                      className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20 transition-all active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Settle Medication Charges ({formatCurrency(totalMedPrice)}) & Print Invoice</span>
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Quick Issue Walk-in Token & Upfront Bill Modal */}
      
      {/* Appointment Check-In Modal (Reception Desk Intake) */}
      {selectedAppointmentForCheckIn && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmAppointmentCheckIn}
            className="bg-white border border-indigo-100 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-blue-950">Patient Arrival Check-In</h3>
                  <p className="text-xs text-slate-500">
                    {selectedAppointmentForCheckIn.appointmentNumber} • {selectedAppointmentForCheckIn.patientName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAppointmentForCheckIn(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Appointment Summary Box */}
            <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="font-extrabold text-indigo-950 block">
                  Cabin {selectedAppointmentForCheckIn.cabinId} • {selectedAppointmentForCheckIn.doctorName}
                </span>
                <span className="text-slate-500 text-[11px]">
                  {selectedAppointmentForCheckIn.department} • Slot: {selectedAppointmentForCheckIn.timeSlot}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Consultation Fee</span>
                <span className="font-black text-indigo-900 text-sm">
                  {currencySymbol}
                  {(cabins.find(c => c.cabinId === selectedAppointmentForCheckIn.cabinId) || cabins[0]).consultationFee}
                </span>
              </div>
            </div>

            {/* SECTION 1: Triage Vitals Recording */}
            <div className="p-4 bg-rose-50/40 border border-rose-200/80 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-rose-950 uppercase tracking-wider">
                  <Thermometer className="w-4 h-4 text-rose-600" />
                  <span>Step 1: Record Triage Vitals</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAptCheckInTemp('98.6');
                    setAptCheckInBP('120/80');
                    setAptCheckInPulse('76');
                    setAptCheckInSpO2('98');
                    setAptCheckInWeight('70');
                  }}
                  className="text-[10px] text-rose-700 hover:underline font-bold"
                >
                  ⚡ Standard Baseline
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Temp (°F)</label>
                  <input
                    type="text"
                    value={aptCheckInTemp}
                    onChange={(e) => setAptCheckInTemp(e.target.value)}
                    className="w-full bg-white border border-rose-200 rounded-xl px-2 py-1.5 font-mono font-bold text-center text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">BP (mmHg)</label>
                  <input
                    type="text"
                    value={aptCheckInBP}
                    onChange={(e) => setAptCheckInBP(e.target.value)}
                    className="w-full bg-white border border-rose-200 rounded-xl px-2 py-1.5 font-mono font-bold text-center text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Pulse (bpm)</label>
                  <input
                    type="text"
                    value={aptCheckInPulse}
                    onChange={(e) => setAptCheckInPulse(e.target.value)}
                    className="w-full bg-white border border-rose-200 rounded-xl px-2 py-1.5 font-mono font-bold text-center text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">SpO2 (%)</label>
                  <input
                    type="text"
                    value={aptCheckInSpO2}
                    onChange={(e) => setAptCheckInSpO2(e.target.value)}
                    className="w-full bg-white border border-rose-200 rounded-xl px-2 py-1.5 font-mono font-bold text-center text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Weight (kg)</label>
                  <input
                    type="text"
                    value={aptCheckInWeight}
                    onChange={(e) => setAptCheckInWeight(e.target.value)}
                    className="w-full bg-white border border-rose-200 rounded-xl px-2 py-1.5 font-mono font-bold text-center text-slate-900 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Payment Collection */}
            {(() => {
              const cabinFee = (cabins.find(c => c.cabinId === selectedAppointmentForCheckIn.cabinId) || cabins[0]).consultationFee;
              const netFee = Math.max(0, cabinFee - Number(aptInsuranceCoPay) - Number(aptDiscount));
              const changeAmt = aptPaymentMethod === 'CASH' && aptCashTendered > netFee ? aptCashTendered - netFee : 0;

              return (
                <div className="p-4 bg-emerald-50/40 border border-emerald-200/80 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950 uppercase tracking-wider">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>Step 2: Upfront Fee Collection</span>
                    </div>
                    <span className="font-mono font-black text-base text-emerald-800">
                      Net: {currencySymbol}{netFee.toFixed(2)}
                    </span>
                  </div>

                  {/* Payment Methods (Filtered by Admin Approval) */}
                  {(() => {
                    const enabled = clinicSettings?.paymentSettings?.enabledMethods || { CASH: true };
                    const aptOptions = [
                      { id: 'CASH', label: 'Cash (Default)' },
                      { id: 'CARD', label: 'Card' },
                      { id: 'TOUCH_PAY_UPI', label: 'UPI / QR' },
                      { id: 'INSURANCE_COPAY', label: 'Co-Pay' }
                    ].filter(opt => enabled[opt.id]);

                    return (
                      <div className={`grid gap-1.5 ${aptOptions.length <= 2 ? 'grid-cols-2' : 'grid-cols-4'}`}>
                        {aptOptions.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setAptPaymentMethod(m.id);
                              if (m.id === 'INSURANCE_COPAY') setAptInsuranceCoPay(20);
                              else setAptInsuranceCoPay(0);
                            }}
                            className={`py-2 rounded-xl text-xs font-black border transition-all ${
                              aptPaymentMethod === m.id
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    );
                  })()}

                  {aptPaymentMethod === 'CASH' && (
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Cash Tendered</label>
                        <input
                          type="number"
                          value={aptCashTendered}
                          onChange={(e) => setAptCashTendered(Number(e.target.value))}
                          placeholder={`${netFee}`}
                          className="w-full bg-white border border-emerald-200 rounded-xl px-2 py-1.5 font-mono font-bold text-slate-900"
                        />
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="text-[10px] text-slate-400 block font-bold">Change Due:</span>
                        <span className="font-mono font-black text-emerald-700 text-sm">
                          {currencySymbol}{changeAmt.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedAppointmentForCheckIn(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white font-black text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Check-In & Issue Token</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {showNewTokenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleQuickIssueToken}
            className="bg-white border border-blue-100 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-blue-950">Issue Token & Upfront Bill</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewTokenModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Miller"
                  value={newPatientName}
                  onChange={(e) => setNewPatientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Age</label>
                  <input
                    type="number"
                    value={newPatientAge}
                    onChange={(e) => setNewPatientAge(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Gender</label>
                  <select
                    value={newPatientGender}
                    onChange={(e) => setNewPatientGender(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="555-0100"
                    value={newPatientPhone}
                    onChange={(e) => setNewPatientPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Assign Doctor Cabin</label>
                <select
                  value={newPatientCabinId}
                  onChange={(e) => setNewPatientCabinId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                >
                  {cabins.map((c) => (
                    <option key={c.cabinId} value={c.cabinId}>
                      {c.cabinName}: {c.doctorName.split(',')[0]} ({c.department}) — {formatCurrency(c.consultationFee)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Triage Vitals Recording at Reception */}
              <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-blue-950 uppercase tracking-wider">
                    <Thermometer className="w-3.5 h-3.5 text-rose-600" />
                    <span>Reception Triage Vitals (Transmitted to Doctor)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPatientTemp('98.6');
                      setNewPatientBP('122/72');
                      setNewPatientPulse('84');
                      setNewPatientSpO2('97');
                    }}
                    className="text-[10px] text-blue-700 hover:underline font-bold"
                  >
                    ⚡ Standard Baseline
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Temp (°F)</label>
                    <input
                      type="text"
                      value={newPatientTemp}
                      onChange={(e) => setNewPatientTemp(e.target.value)}
                      className="w-full bg-white border border-rose-200 rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-rose-500"
                      placeholder="98.6"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">BP (mmHg)</label>
                    <input
                      type="text"
                      value={newPatientBP}
                      onChange={(e) => setNewPatientBP(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      placeholder="122/72"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Pulse (bpm)</label>
                    <input
                      type="text"
                      value={newPatientPulse}
                      onChange={(e) => setNewPatientPulse(e.target.value)}
                      className="w-full bg-white border border-pink-200 rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-pink-500"
                      placeholder="84"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">SpO2 (%)</label>
                    <input
                      type="text"
                      value={newPatientSpO2}
                      onChange={(e) => setNewPatientSpO2(e.target.value)}
                      className="w-full bg-white border border-sky-200 rounded-xl px-2 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500"
                      placeholder="97"
                    />
                  </div>
                </div>

                {/* Quick Fever & Normal Preset Chips */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-400 font-bold">Presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPatientTemp('98.6');
                      setNewPatientBP('120/80');
                      setNewPatientPulse('76');
                      setNewPatientSpO2('98');
                    }}
                    className="px-2 py-0.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-bold hover:bg-emerald-50"
                  >
                    ✓ Normal (98.6°F)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPatientTemp('100.4');
                      setNewPatientBP('124/82');
                      setNewPatientPulse('94');
                      setNewPatientSpO2('97');
                    }}
                    className="px-2 py-0.5 bg-white border border-rose-200 text-rose-700 rounded-lg text-[10px] font-bold hover:bg-rose-50"
                  >
                    🔥 Mild Fever (100.4°F)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewPatientTemp('101.8');
                      setNewPatientBP('130/85');
                      setNewPatientPulse('102');
                      setNewPatientSpO2('96');
                    }}
                    className="px-2 py-0.5 bg-white border border-rose-300 text-rose-800 rounded-lg text-[10px] font-bold hover:bg-rose-50"
                  >
                    🚨 High Fever (101.8°F)
                  </button>
                </div>
              </div>

              {/* Payment Method Selector (Filtered by Admin Approval) */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Payment Method</label>
                {(() => {
                  const enabled = clinicSettings?.paymentSettings?.enabledMethods || { CASH: true };
                  const options = ['CASH', 'CARD', 'TOUCH_PAY_UPI', 'INSURANCE_COPAY'].filter(m => enabled[m]);
                  return (
                    <div className={`grid gap-1.5 ${options.length <= 2 ? 'grid-cols-2' : 'grid-cols-4'}`}>
                      {options.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setNewPaymentMethod(m)}
                          className={`py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                            newPaymentMethod === m
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {m === 'CASH' ? 'Cash (Default)' : m.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Summary Bar */}
              <div className="p-3 bg-blue-50 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">Amount to Collect:</span>
                  <span className="text-xl font-black text-blue-900">{currencySymbol}{netUpfrontPayable.toFixed(2)}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  Billed Immediately
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Issue Token & Print Laser Receipt</span>
            </button>
          </form>
        </div>
      )}

      {/* Queue Token Thermal Slip Modal (Without Bill) */}
      {activeQueueTokenPatient && (
        <QueueTokenThermalSlipModal
          patient={activeQueueTokenPatient}
          onClose={() => setActiveQueueTokenPatient(null)}
        />
      )}

      {/* Laser Medical Invoice Modal */}
      {activeLaserInvoice && (
        <LaserMedicalInvoice
          invoice={activeLaserInvoice}
          onClose={() => setActiveLaserInvoice(null)}
        />
      )}

      {/* Shift Audit Sheet Modal */}
      {showShiftReport && (
        <ShiftReportModal
          invoices={invoices}
          cabins={cabins}
          onClose={() => setShowShiftReport(false)}
        />
      )}

      {/* Reschedule Appointment Modal */}
      {rescheduleAppointmentTarget && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Reschedule Appointment</h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {rescheduleAppointmentTarget.appointmentNumber} • {rescheduleAppointmentTarget.patientName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleAppointmentTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Select Rescheduled Date</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Today', 'Tomorrow'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setRescheduleDate(d)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        rescheduleDate === d
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Select Available Time Slot</label>
                <select
                  value={rescheduleSlot}
                  onChange={(e) => setRescheduleSlot(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  {(timeSlots || []).map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-900">
                Rescheduling will restore appointment status to <strong>SCHEDULED</strong> and update cabin queues.
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRescheduleAppointmentTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(20);
                  rescheduleAppointment(rescheduleAppointmentTarget.id, rescheduleDate, rescheduleSlot);
                  setRescheduleAppointmentTarget(null);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
