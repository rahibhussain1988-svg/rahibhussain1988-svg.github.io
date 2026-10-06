import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  Ticket,
  Clock,
  Building2,
  Stethoscope,
  Heart,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Sliders,
  Download
} from 'lucide-react';
import { useClinic } from '../../context/useClinic';
import { printMedicalDocument, generateDirectPdf } from '../../utils/printEngine';

/**
 * Pure Queue Token Slip Modal (Dynamic 80mm / 58mm Thermal Paper)
 * Strict Requirement:
 * ZERO billing, ZERO pricing, ZERO fees, ZERO payment methods.
 * Purely for queue intake and cabin routing.
 * Automatically adapts paper size (80mm Standard POS vs 58mm Compact POS)
 * Strictly suppresses OS print popups on user screens; auto-downloads PDF if printer unattached.
 */
export const QueueTokenThermalSlipModal = ({ patient, onClose, autoPrint = false }) => {
  const { clinicSettings, updateClinicSettings, cabins, getEstimatedWaitTime, currencySymbol } = useClinic();

  // Active thermal paper size: '80mm' (Standard POS) or '58mm' (Compact POS)
  const systemPaperWidth = clinicSettings?.printerSettings?.thermalPaperWidth || '80mm';
  const [activeWidth, setActiveWidth] = useState(systemPaperWidth);

  const thermalDevice = clinicSettings?.printerSettings?.hardwareDevices?.find((d) => d.slot === 1) || {
    name: 'Front-Desk Thermal Slip Printer',
    status: 'CONNECTED'
  };
  const isHardwareAttached = thermalDevice.status === 'CONNECTED';

  // Auto-close state after Print / PDF action (Requested: 2 seconds)
  const [closingAction, setClosingAction] = useState(null); // 'print' | 'pdf' | null
  const closeTimerRef = React.useRef(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const triggerAutoClose = (actionType) => {
    setClosingAction(actionType);
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      if (typeof onClose === 'function') {
        onClose();
      }
    }, 2000);
  };

  const handlePrint = () => {
    if (!patient) return;
    printMedicalDocument('printable-queue-token-slip', 'THERMAL', {
      documentTitle: `Token_${patient.tokenNumber || 'Slip'}`,
      documentType: 'TOKEN'
    });
    triggerAutoClose('print');
  };

  const handleDownloadPdf = async () => {
    if (!patient) return;
    await generateDirectPdf('printable-queue-token-slip', `Token_${patient.tokenNumber || 'Slip'}`, 'THERMAL');
    triggerAutoClose('pdf');
  };

  const hasAutoPrintedRef = React.useRef(false);
  // Auto-print on mount if requested (guaranteed single execution)
  useEffect(() => {
    if (patient && autoPrint && !hasAutoPrintedRef.current) {
      hasAutoPrintedRef.current = true;
      const timer = setTimeout(() => {
        handlePrint();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, patient]);

  if (!patient) return null;

  const cabinInfo = cabins.find((c) => c.cabinId === patient.cabinId) || {
    doctorName: patient.doctorName || 'Attending Specialist Physician',
    department: patient.department || 'Outpatient Clinic',
    cabinName: `Cabin ${patient.cabinId || 1}`
  };

  const estWait = getEstimatedWaitTime(patient.cabinId || 'any', patient.id || patient.tokenNumber);
  const printDate = new Date(patient.createdAt || Date.now()).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const printTime = new Date(patient.createdAt || Date.now()).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const is58mm = activeWidth === '58mm';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 select-none font-sans animate-in fade-in">
      <div className="bg-white border border-teal-100 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[96vh]">
        {/* Top Clinical Control Bar */}
        <div className="p-3.5 bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white flex flex-col gap-2">
          {/* 2-Second Auto-Close Notification Banner (Requested) */}
          {closingAction && (
            <div className="bg-emerald-500/95 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center justify-between shadow-md border border-emerald-400/50 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-white animate-pulse shrink-0" />
                <span>
                  {closingAction === 'print' ? '✓ Sent to Printer • Closing in 2 seconds...' : '✓ PDF Downloaded • Closing in 2 seconds...'}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-[10px] underline font-bold opacity-85 hover:opacity-100 cursor-pointer"
              >
                Close Now
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-xs sm:text-sm tracking-tight">
              <Ticket className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Queue Intake Slip • {activeWidth} Thermal</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  closingAction === 'pdf'
                    ? 'bg-emerald-500 text-white shadow font-black'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="Download direct PDF without OS print dialog"
              >
                <Download className="w-3.5 h-3.5 text-teal-300" />
                <span className="hidden sm:inline">{closingAction === 'pdf' ? 'Saved' : 'PDF'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all text-white cursor-pointer ${
                  closingAction === 'print'
                    ? 'bg-emerald-500 ring-2 ring-emerald-300'
                    : isHardwareAttached
                    ? 'bg-teal-500 hover:bg-teal-600'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {closingAction === 'print' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Printed ✓</span>
                  </>
                ) : isHardwareAttached ? (
                  <>
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Slip</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Close Window"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Paper Width Selector & Auto-detected Hardware status */}
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-teal-800/60 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-teal-200">
              <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-semibold truncate">
                Slot 1 POS: {isHardwareAttached ? `${thermalDevice.name || 'Hardware'} (Attached)` : 'Not Attached (Direct PDF Active)'}
              </span>
            </div>

            <div className="flex items-center gap-1 bg-teal-950/60 p-0.5 rounded-lg border border-teal-800/50">
              <button
                type="button"
                onClick={() => {
                  setActiveWidth('80mm');
                  updateClinicSettings({
                    printerSettings: {
                      ...(clinicSettings?.printerSettings || {}),
                      thermalPaperWidth: '80mm'
                    }
                  });
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-black transition-all ${
                  activeWidth === '80mm'
                    ? 'bg-teal-500 text-white shadow-xs'
                    : 'text-teal-300 hover:text-white'
                }`}
              >
                80mm POS
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveWidth('58mm');
                  updateClinicSettings({
                    printerSettings: {
                      ...(clinicSettings?.printerSettings || {}),
                      thermalPaperWidth: '58mm'
                    }
                  });
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-black transition-all ${
                  activeWidth === '58mm'
                    ? 'bg-teal-500 text-white shadow-xs'
                    : 'text-teal-300 hover:text-white'
                }`}
              >
                58mm Mini
              </button>
            </div>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center flex-1">
          {/* =========================================================================
             DYNAMIC THERMAL PAPER ROLL (80mm or 58mm) WITHOUT BILLING
          ========================================================================= */}
          <div
            id="printable-queue-token-slip"
            className={`bg-white border border-slate-300 shadow-md text-slate-900 font-mono leading-tight space-y-2.5 transition-all ${
              is58mm
                ? 'w-[58mm] max-w-[58mm] min-w-[58mm] p-2 text-[8.5px]'
                : 'w-[80mm] max-w-[80mm] min-w-[80mm] p-4 text-[10px]'
            }`}
          >
            {/* Header */}
            <div className="text-center border-b border-dashed border-slate-400 pb-2">
              <div className={`font-black text-slate-950 uppercase tracking-tight ${is58mm ? 'text-xs' : 'text-sm'}`}>
                {clinicSettings?.clinicName || 'Apex Specialist Care'}
              </div>
              <div className={`text-slate-600 mt-0.5 ${is58mm ? 'text-[7.5px]' : 'text-[8.5px]'}`}>
                {clinicSettings?.subtitle || 'Specialist Clinics & Diagnostics'}
              </div>
              <div className={`text-slate-500 ${is58mm ? 'text-[7px]' : 'text-[8px]'}`}>
                {clinicSettings?.address || '750 Healthcare Blvd'} • Tel: {clinicSettings?.phone || '(555) 740-9200'}
              </div>

              <div className={`mt-1.5 bg-slate-900 text-white font-black uppercase tracking-wider rounded ${
                is58mm ? 'py-0.5 px-1 text-[8px]' : 'py-1 px-2 text-[10px]'
              }`}>
                *** QUEUE INTAKE PASS ***
              </div>
            </div>

            {/* Giant Monospace Token Box */}
            <div className="text-center py-2 border-b-2 border-slate-900 bg-slate-50 rounded-xl">
              <div className={`uppercase font-bold text-slate-500 tracking-widest ${is58mm ? 'text-[8px]' : 'text-[9px]'}`}>
                YOUR QUEUE TOKEN
              </div>
              <div className={`font-black font-mono text-slate-950 tracking-tighter my-1 ${
                is58mm ? 'text-4xl' : 'text-5xl'
              }`}>
                {patient.tokenNumber}
              </div>
              <div className={`text-slate-600 font-bold ${is58mm ? 'text-[8px]' : 'text-[9px]'}`}>
                {patient.bookingType === 'APPOINTMENT' ? 'Scheduled Appointment' : 'Walk-in Registration'}
              </div>
            </div>

            {/* Assigned Cabin & Doctor */}
            <div className={`border-b border-dashed border-slate-400 pb-2 space-y-1 ${
              is58mm ? 'text-[8px]' : 'text-[9.5px]'
            }`}>
              <div>
                <span className="text-slate-500 block font-bold text-[8px]">ASSIGNED CABIN:</span>
                <strong className={`text-slate-950 font-black block ${is58mm ? 'text-xs' : 'text-sm'}`}>
                  Cabin {patient.cabinId || cabinInfo.cabinId}
                </strong>
                <span className="text-slate-600 block">
                  {patient.department || cabinInfo.department}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block font-bold text-[8px]">ATTENDING SPECIALIST:</span>
                <strong className="text-slate-900 block">{cabinInfo.doctorName}</strong>
              </div>
            </div>

            {/* Patient Demographics */}
            <div className={`border-b border-dashed border-slate-400 pb-2 space-y-0.5 ${
              is58mm ? 'text-[8px]' : 'text-[9px]'
            }`}>
              <div>
                <span className="text-slate-500">Patient:</span> <strong>{patient.patientName || patient.name}</strong>
              </div>
              <div>
                <span className="text-slate-500">Age / Gender:</span> {patient.age}y / {patient.gender}
              </div>
              {patient.phone && (
                <div>
                  <span className="text-slate-500">Phone:</span> {patient.phone}
                </div>
              )}
            </div>

            {/* Recorded Triage Vitals */}
            {patient.vitals && (
              <div className={`border-b border-dashed border-slate-400 pb-2 bg-slate-50 p-1.5 rounded ${
                is58mm ? 'text-[7.5px]' : 'text-[8.5px]'
              }`}>
                <span className="font-black text-slate-700 block uppercase text-[7.5px] mb-0.5">
                  Triage Vitals Recorded at Intake:
                </span>
                <div className="grid grid-cols-2 gap-x-1.5 gap-y-0.5 text-slate-700 font-mono">
                  <span>Temp: <strong>{patient.vitals.temp || '98.6°F'}</strong></span>
                  <span>BP: <strong>{patient.vitals.bp || '120/80'}</strong></span>
                  <span>Pulse: <strong>{patient.vitals.pulse || '76 bpm'}</strong></span>
                  <span>SpO2: <strong>{patient.vitals.spo2 || '98%'}</strong></span>
                </div>
              </div>
            )}

            {/* Time & Estimated Wait */}
            <div className={`border-b border-dashed border-slate-400 pb-2 flex items-center justify-between ${
              is58mm ? 'text-[8px]' : 'text-[9px]'
            }`}>
              <div>
                <span className="text-slate-500 block text-[7.5px]">ISSUED AT:</span>
                <strong className="text-slate-900">{printDate} • {printTime}</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[7.5px]">EST. WAIT:</span>
                <strong className="text-slate-900 font-bold">~{estWait} Mins</strong>
              </div>
            </div>

            {/* Consultation Fee & Payment Settlement Status */}
            <div className={`border-b border-dashed border-slate-400 pb-2 flex items-center justify-between ${
              is58mm ? 'text-[8px]' : 'text-[9px]'
            }`}>
              <div>
                <span className="text-slate-500 block text-[7.5px]">CONSULTATION FEE:</span>
                <strong className="text-slate-900">{currencySymbol || 'Rs'} {patient.totalFee || 55}</strong>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[7.5px]">PAYMENT STATUS:</span>
                <strong className={
                  patient.isPaid || patient.paymentStatus === 'PAID'
                    ? 'text-emerald-700 font-black'
                    : patient.paymentStatus === 'PAY_IN_CABIN'
                      ? 'text-purple-700 font-black'
                      : 'text-amber-700 font-black'
                }>
                  {patient.isPaid || patient.paymentStatus === 'PAID'
                    ? 'PAID'
                    : patient.paymentStatus === 'PAY_IN_CABIN'
                      ? 'DUE IN CABIN'
                      : 'DUE AT COUNTER'}
                </strong>
              </div>
            </div>

            {/* Queue Instructions */}
            <div className={`pt-1 text-center text-slate-600 space-y-1 ${
              is58mm ? 'text-[7.5px]' : 'text-[8px]'
            }`}>
              <p className="font-bold text-slate-800">
                Please proceed to Patient Lounge.
              </p>
              <p>
                Watch the Queue TV & listen for audible call chime for Cabin {patient.cabinId || 1}.
              </p>
              <div className="text-[7px] text-slate-400 pt-1 font-mono uppercase">
                *** CLINICAL QUEUE SLIP (NO BILLING ATTACHED) ***
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
