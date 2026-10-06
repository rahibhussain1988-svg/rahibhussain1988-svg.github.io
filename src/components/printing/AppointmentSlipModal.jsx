import React, { useState } from 'react';
import {
  Printer,
  X,
  FileText,
  CheckCircle2,
  Calendar,
  Clock,
  Building2,
  Stethoscope,
  User,
  Phone,
  QrCode,
  ShieldCheck,
  AlertCircle,
  Download
} from 'lucide-react';
import { useClinic } from '../../context/useClinic';
import { printMedicalDocument, generateDirectPdf } from '../../utils/printEngine';

export const AppointmentSlipModal = ({ appointment, onClose }) => {
  const { clinicSettings } = useClinic();
  const [printMode, setPrintMode] = useState('A4_SLIP'); // 'A4_SLIP' | 'THERMAL_SLIP'

  // Auto-close state after Print / PDF action (2 seconds)
  const [closingAction, setClosingAction] = useState(null); // 'print' | 'pdf' | null
  const closeTimerRef = React.useRef(null);

  React.useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  if (!appointment) return null;

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
    const paperFormat = printMode === 'A4_SLIP' ? 'A4' : 'THERMAL';
    printMedicalDocument('printable-appointment-slip-doc', paperFormat, {
      documentTitle: `Appointment_${appointment.appointmentNumber || 'Slip'}`,
      documentType: 'APPOINTMENT'
    });
    triggerAutoClose('print');
  };

  const handleDownloadPdf = async () => {
    const paperFormat = printMode === 'A4_SLIP' ? 'A4' : 'THERMAL';
    await generateDirectPdf('printable-appointment-slip-doc', `Appointment_${appointment.appointmentNumber || 'Slip'}`, paperFormat);
    triggerAutoClose('pdf');
  };

  const bookingDate = appointment.date || 'Today';
  const timeSlot = appointment.timeSlot || 'Pending Time';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 select-none font-sans">
      <div className="bg-white border border-blue-100 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        {/* Modal Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white gap-3">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Appointment Booked Successfully</span>
            {closingAction && (
              <span className="ml-2 text-xs bg-emerald-500/90 text-white px-2 py-0.5 rounded-lg font-bold animate-pulse">
                {closingAction === 'print' ? 'Sent to Printer • Closing in 2s...' : 'PDF Downloaded • Closing in 2s...'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white/10 p-1 rounded-xl border border-white/20 text-xs">
              <button
                type="button"
                onClick={() => setPrintMode('A4_SLIP')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  printMode === 'A4_SLIP'
                    ? 'bg-white text-blue-950 shadow font-black'
                    : 'text-blue-100 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A4 Document</span>
              </button>

              <button
                type="button"
                onClick={() => setPrintMode('THERMAL_SLIP')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  printMode === 'THERMAL_SLIP'
                    ? 'bg-white text-blue-950 shadow font-black'
                    : 'text-blue-100 hover:text-white'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>80mm Thermal Slip</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                closingAction === 'pdf' ? 'bg-emerald-500 text-white font-black' : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="Download vector PDF directly without OS print dialog"
            >
              <Download className="w-3.5 h-3.5 text-sky-300" />
              <span>{closingAction === 'pdf' ? 'Saved' : 'PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className={`px-4 py-2 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer ${
                closingAction === 'print' ? 'bg-emerald-600 ring-2 ring-emerald-300' : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>{closingAction === 'print' ? 'Printed ✓' : 'Print Slip'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-100/60 flex justify-center flex-1">
          {printMode === 'A4_SLIP' ? (
            /* A4 LASER FORMAT */
            <div
              id="printable-appointment-slip-doc"
              className="bg-white border border-slate-300 shadow-md rounded-2xl p-6 sm:p-8 max-w-xl w-full text-slate-800 text-xs"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b pb-4 mb-4 border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
                    ✚
                  </div>
                  <div>
                    <h2 className="text-base font-black text-blue-950 tracking-tight">
                      {clinicSettings?.clinicName || 'Apex Specialist Care Medical Pavilion'}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      {clinicSettings?.subtitle || 'Multi-Specialty Clinic • Diagnostic Laboratories • Pharmacy'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {clinicSettings?.address || '750 Healthcare Blvd, Suite 400'} • Tel: {clinicSettings?.phone || '(555) 740-9200'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-900 font-extrabold text-[10px] uppercase tracking-wider block">
                    Scheduled Booking
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono block mt-1">
                    {new Date(appointment.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Title & Ref Box */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 mb-5 text-center">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Official Appointment Confirmation Slip
                </div>
                <div className="text-4xl font-black font-mono text-blue-900 tracking-tight my-1">
                  {appointment.appointmentNumber}
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-blue-200 rounded-full text-xs font-bold text-blue-800 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>{bookingDate}</span>
                  <span>•</span>
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-extrabold">{timeSlot}</span>
                </div>
              </div>

              {/* 2 Column Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Patient Demographics
                  </span>
                  <div className="font-black text-sm text-slate-900">{appointment.patientName}</div>
                  <div className="text-slate-600 mt-0.5">
                    {appointment.age} Years • {appointment.gender}
                  </div>
                  {appointment.phone && (
                    <div className="text-slate-600 font-mono text-[11px] mt-0.5">
                      Phone: {appointment.phone}
                    </div>
                  )}
                  {appointment.symptoms && appointment.symptoms.length > 0 && (
                    <div className="mt-2 text-[11px] text-slate-600">
                      <span className="font-bold text-slate-700">Presenting: </span>
                      {Array.isArray(appointment.symptoms) ? appointment.symptoms.join(', ') : appointment.symptoms}
                    </div>
                  )}
                </div>

                <div className="border-l border-slate-200 pl-4">
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Consulting Physician & Cabin
                  </span>
                  <div className="font-black text-sm text-blue-950">
                    Cabin {appointment.cabinId}
                  </div>
                  <div className="font-bold text-blue-800 mt-0.5">
                    {appointment.doctorName}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    {appointment.department}
                  </div>
                  <div className="mt-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      Status: Confirmed / Scheduled
                    </span>
                  </div>
                </div>
              </div>

              {/* Instructions Callout */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 text-[11px] text-amber-950 leading-relaxed">
                <div className="font-black text-amber-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                  <span>Important Patient Arrival Instructions:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-amber-900/90 font-medium">
                  <li><strong>No upfront fee was charged</strong> at the time of booking.</li>
                  <li>Please arrive at the clinic <strong>15 minutes prior</strong> to your scheduled slot.</li>
                  <li>Upon arrival, present this slip or your phone number at the <strong>Self-Service Kiosk (Appointment Check-in)</strong> or the <strong>Reception Counter</strong>.</li>
                  <li>Our nursing and reception staff will record your vitals (Temp, BP, Pulse), process your consultation payment, and issue your live cabin queue token.</li>
                </ul>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                <span>Ref: {appointment.id} • Generated via {clinicSettings?.clinicName || 'Apex Medical System'}</span>
                <span className="font-mono">APEX-SLIP-{appointment.appointmentNumber}</span>
              </div>
            </div>
          ) : (
            /* 80MM THERMAL RECEIPT FORMAT */
            <div
              id="printable-appointment-slip-doc"
              className="bg-white border border-slate-300 shadow-md rounded-2xl p-5 max-w-xs w-full text-slate-900 font-mono text-[11px]"
            >
              <div className="text-center border-b pb-3 mb-3 border-dashed border-slate-300">
                <div className="font-black text-sm uppercase">
                  {clinicSettings?.clinicName || 'APEX MEDICAL PAVILION'}
                </div>
                <div className="text-[10px] text-slate-500">
                  APPOINTMENT CONFIRMATION
                </div>
                <div className="text-3xl font-black mt-2 tracking-tight">
                  {appointment.appointmentNumber}
                </div>
                <div className="text-xs font-bold mt-1 text-blue-800">
                  {bookingDate} • {timeSlot}
                </div>
              </div>

              <div className="space-y-1.5 mb-3 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">PATIENT:</span>
                  <span className="font-bold">{appointment.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PHONE:</span>
                  <span>{appointment.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">CABIN:</span>
                  <span className="font-bold">CABIN {appointment.cabinId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">DOCTOR:</span>
                  <span className="truncate max-w-[150px]">{appointment.doctorName?.split(',')[0]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">STATUS:</span>
                  <span className="font-bold text-emerald-700">SCHEDULED</span>
                </div>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-2.5 my-2 text-[9px] text-slate-600 leading-tight">
                * ARRIVE 15 MIN EARLY<br />
                * NO UPFRONT PAYMENT COLLECTED YET<br />
                * PRESENT SLIP AT KIOSK OR RECEPTION COUNTER FOR VITALS & LIVE QUEUE TOKEN
              </div>

              <div className="text-center text-[9px] text-slate-400 mt-2">
                Thank you for choosing {clinicSettings?.clinicName || 'Apex Health'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
