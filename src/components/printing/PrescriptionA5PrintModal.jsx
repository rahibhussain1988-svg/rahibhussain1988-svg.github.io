import React, { useState } from 'react';
import {
  Printer,
  X,
  FileText,
  Stethoscope,
  Heart,
  Calendar,
  Clock,
  ShieldCheck,
  Building2,
  Pill,
  Activity,
  AlertCircle,
  Receipt,
  CheckCircle2,
  DollarSign,
  Download
} from 'lucide-react';
import { useClinic } from '../../context/useClinic';
import { printMedicalDocument, generateDirectPdf } from '../../utils/printEngine';
import { clinicAudio } from '../../utils/clinicAudio';

/**
 * Universal Clinical Prescription & Pharmacy Dispensation Print Document
 * 
 * Supports both:
 * 1. "Just a Prescription" (Pure Medical Advice, ZERO billing, ZERO pricing)
 * 2. "Purchased with Price Mentioned" (Itemized medication pricing, taxes, payment mode, change due)
 * 
 * Print Formats:
 * - A5 Landscape (210mm x 148mm) - Hospital Standard
 * - 80mm Thermal Paper Roll (POS Printers)
 * - A4 Full Sheet Laser
 */
export const PrescriptionA5PrintModal = ({ patient, onClose, invoice = null, billingMode = false }) => {
  const { clinicSettings, cabins, currencySymbol, currencyCode, formatCurrency } = useClinic();

  const defaultFormat = clinicSettings?.pharmacySettings?.defaultPrintFormat || 'A5_LANDSCAPE';
  const [printMode, setPrintMode] = useState(defaultFormat); // 'A5_LANDSCAPE' | 'THERMAL' | 'A4'
  const [isBillingActive, setIsBillingActive] = useState(Boolean(billingMode || invoice));

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

  if (!patient) return null;

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
    clinicAudio.triggerHaptic(20);
    const paperFormat = printMode === 'A5_LANDSCAPE' ? 'A5_LANDSCAPE' : printMode === 'THERMAL' ? 'THERMAL' : 'A4';
    printMedicalDocument('printable-rx-doc', paperFormat, {
      documentTitle: `Rx_${(patient.patientName || 'Prescription').replace(/\s+/g, '_')}_${patient.tokenNumber || 'Doc'}`,
      documentType: 'PRESCRIPTION'
    });
    triggerAutoClose('print');
  };

  const handleDownloadPdf = async () => {
    clinicAudio.triggerHaptic(15);
    const paperFormat = printMode === 'A5_LANDSCAPE' ? 'A5' : printMode === 'THERMAL' ? 'THERMAL' : 'A4';
    await generateDirectPdf('printable-rx-doc', `Rx_${(patient.patientName || 'Prescription').replace(/\s+/g, '_')}_${patient.tokenNumber || 'Doc'}`, paperFormat);
    triggerAutoClose('pdf');
  };

  const cabinInfo = cabins.find((c) => c.cabinId === patient.cabinId) || {
    doctorName: patient.doctorName || 'Attending Specialist Physician',
    department: patient.department || 'Outpatient Clinic',
    cabinName: `Cabin ${patient.cabinId || 1}`,
    qualifications: 'MBBS, FCPS / Specialist Consultant'
  };

  const rxNumber = patient.prescriptionNumber || `RX-${(patient.tokenNumber || 'C100').replace('C-', '')}-${Math.floor(100 + Math.random() * 900)}`;
  const invoiceNumber = invoice?.invoiceNumber || patient.invoiceNumber || `APEX-RX-${(patient.tokenNumber || 'C100').replace('C-', '')}-${Math.floor(100 + Math.random() * 900)}`;
  
  const printDate = new Date(patient.createdAt || Date.now()).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const printTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const medications = patient.medications || patient.prescriptions || patient.items || invoice?.medications || [];
  const labOrders = (patient.services || patient.labOrders || []).filter(
    (s) => s.category !== 'Consultation' && s.category !== 'Pharmacy'
  );

  // Calculate financial totals if billing mode active
  const subtotal = invoice?.subtotal || medications.reduce((acc, m) => acc + (Number(m.price || 0) * (Number(m.quantity) || 1)), 0);
  const discount = Number(invoice?.discount || 0);
  const totalDue = invoice?.total !== undefined ? invoice.total : Math.max(0, subtotal - discount);
  const payMethod = invoice?.paymentMethod || patient.paymentMethod || 'CASH';
  const cashTendered = invoice?.cashTendered !== undefined ? invoice.cashTendered : totalDue;
  const changeDue = invoice?.changeDue !== undefined ? invoice.changeDue : 0;
  const headPharmacist = clinicSettings?.pharmacySettings?.headPharmacist || 'Pharm. Sanaullah Khan (R.Ph)';
  const pharmacyLicense = clinicSettings?.pharmacySettings?.licenseNumber || 'PHARM-REG-2026-8841';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 select-none font-sans">
      <div className="bg-white border border-blue-100 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[96vh]">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-gradient-to-r from-blue-950 via-indigo-950 to-purple-950 text-white gap-3">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
            {isBillingActive ? (
              <Receipt className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <FileText className="w-4 h-4 text-sky-400 shrink-0" />
            )}
            <span>
              {isBillingActive
                ? 'Official Pharmacy Dispensation Bill & Rx Guide'
                : 'Pure Clinical Prescription (No Billing)'}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle: Just a Prescription vs With Pricing / Bill */}
            <div className="flex bg-white/10 p-0.5 rounded-xl border border-white/20 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(10);
                  setIsBillingActive(false);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  !isBillingActive
                    ? 'bg-sky-400 text-slate-950 shadow font-black'
                    : 'text-slate-200 hover:text-white'
                }`}
                title="Prescription only without any prices"
              >
                Just Rx (No Billing)
              </button>
              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(10);
                  setIsBillingActive(true);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  isBillingActive
                    ? 'bg-emerald-400 text-slate-950 shadow font-black'
                    : 'text-slate-200 hover:text-white'
                }`}
                title="Include itemized prices and payment details"
              >
                With Pricing Bill
              </button>
            </div>

            {/* Paper Format Selector */}
            <div className="flex bg-white/10 p-0.5 rounded-xl border border-white/20 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(10);
                  setPrintMode('A5_LANDSCAPE');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  printMode === 'A5_LANDSCAPE'
                    ? 'bg-white text-blue-950 shadow font-black'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>A5 Paper</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(10);
                  setPrintMode('THERMAL');
                }}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  printMode === 'THERMAL'
                    ? 'bg-amber-400 text-slate-950 shadow font-black'
                    : 'text-slate-200 hover:text-white'
                }`}
              >
                <Printer className="w-3 h-3" />
                <span>80mm Thermal</span>
              </button>
            </div>

            {/* Direct PDF & Print Execution Buttons */}
            {closingAction && (
              <span className="text-[11px] bg-emerald-500 text-white px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span>{closingAction === 'print' ? 'Sent to printer • Closing in 2s...' : 'PDF downloaded • Closing in 2s...'}</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleDownloadPdf}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                closingAction === 'pdf'
                  ? 'bg-emerald-500 text-white font-black'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="Directly compile and download vector PDF (no OS print dialog)"
            >
              <Download className="w-3.5 h-3.5 text-sky-300" />
              <span>{closingAction === 'pdf' ? 'Saved' : 'PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className={`px-3.5 py-1.5 text-white rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer ${
                closingAction === 'print'
                  ? 'bg-emerald-600 ring-2 ring-emerald-300'
                  : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{closingAction === 'print' ? 'Printed ✓' : `Print ${printMode === 'A5_LANDSCAPE' ? 'A5' : 'Thermal'}`}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="overflow-y-auto p-3 sm:p-5 bg-slate-100/70 flex justify-center flex-1">
          {printMode === 'A5_LANDSCAPE' ? (
            /* =========================================================================
               A5 HORIZONTAL / LANDSCAPE FORMAT (210mm x 148mm)
            ========================================================================= */
            <div
              id="printable-rx-doc"
              className="bg-white border border-slate-300 shadow-md rounded-2xl p-4 sm:p-5 w-full max-w-[210mm] text-slate-800 text-[10px] font-sans flex flex-col justify-between min-h-[135mm] overflow-hidden"
            >
              {/* TOP HEADER STRIP: CLINIC LETTERHEAD & PHYSICIAN / PHARMACY INFO */}
              <div>
                <div className="flex items-start justify-between border-b-2 border-blue-900 pb-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center font-black text-base shrink-0">
                      ✚
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-blue-950 tracking-tight leading-tight">
                        {clinicSettings?.clinicName || 'Fatima Clinic & Diagnostic Center'}
                      </h2>
                      <p className="text-[9px] text-slate-500">
                        {clinicSettings?.subtitle || 'Ambulatory Care • Diagnostic Labs • Inhouse Clinical Pharmacy'}
                      </p>
                      <p className="text-[8.5px] text-slate-400">
                        {clinicSettings?.address || '42 Health Avenue, Medical District'} • Tel: {clinicSettings?.phone || '(555) 019-2831'}
                      </p>
                    </div>
                  </div>

                  {/* Doctor & Rx / Invoice Badge */}
                  <div className="flex items-center gap-3 text-right">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-left">
                      <span className="text-[7.5px] font-black uppercase text-blue-700 block">Attending Physician</span>
                      <strong className="text-[10.5px] text-slate-900 block font-black leading-tight">{cabinInfo.doctorName}</strong>
                      <span className="text-[8.5px] text-slate-500 block">{cabinInfo.department} • Cabin {patient.cabinId || cabinInfo.cabinId}</span>
                    </div>

                    <div>
                      <span className={`px-2 py-0.5 rounded font-extrabold text-[8px] uppercase tracking-wider block ${
                        isBillingActive ? 'bg-emerald-100 text-emerald-900' : 'bg-blue-100 text-blue-900'
                      }`}>
                        {isBillingActive ? 'Pharmacy Receipt' : 'Medical Prescription'}
                      </span>
                      <span className="font-mono font-black text-blue-950 text-xs block mt-0.5">
                        {isBillingActive ? invoiceNumber : rxNumber}
                      </span>
                      <span className="text-[8px] text-slate-400 block font-mono">Date: {printDate} {printTime}</span>
                    </div>
                  </div>
                </div>

                {/* 2-COLUMN HORIZONTAL BODY */}
                <div className="grid grid-cols-12 gap-3">
                  {/* LEFT COLUMN (4 COLS): PATIENT DEMOGRAPHICS, VITALS, DIAGNOSIS */}
                  <div className="col-span-12 md:col-span-4 space-y-1.5">
                    {/* Patient Demographics Box */}
                    <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-2 text-[9.5px]">
                      <div className="flex items-center justify-between border-b border-blue-200/60 pb-1 mb-1">
                        <div>
                          <span className="text-slate-400 block text-[7.5px] font-bold">PATIENT NAME</span>
                          <strong className="text-slate-900 font-black text-[11px]">{patient.patientName || patient.name}</strong>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[7.5px] font-bold">TOKEN</span>
                          <span className="font-mono font-black text-blue-900 text-xs">{patient.tokenNumber}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[8.5px] text-slate-700">
                        <span><strong>Age / Gender:</strong> {patient.age}y • {patient.gender}</span>
                        <span><strong>MRN:</strong> {patient.patientId || patient.mrn || 'PT-REG'}</span>
                      </div>
                      {patient.phone && (
                        <div className="text-[8.5px] text-slate-600 mt-0.5">
                          <strong>Contact:</strong> {patient.phone}
                        </div>
                      )}
                    </div>

                    {/* Recorded Triage Vitals */}
                    {patient.vitals && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-1.5 text-[8.5px] space-y-0.5">
                        <span className="font-black text-slate-700 uppercase text-[7.5px] tracking-wider block">
                          Triage Observations:
                        </span>
                        <div className="grid grid-cols-2 gap-x-2 text-slate-600">
                          <span><strong>Temp:</strong> {patient.vitals.temp || '98.6°F'}</span>
                          <span><strong>BP:</strong> {patient.vitals.bp || patient.vitals.bloodPressure || '120/80'}</span>
                          <span><strong>Pulse:</strong> {patient.vitals.pulse || '76 bpm'}</span>
                          <span><strong>SpO2:</strong> {patient.vitals.spo2 || '98%'}</span>
                        </div>
                      </div>
                    )}

                    {/* Patient Allergies / Clinical Warning */}
                    {patient.allergies && (
                      <div className="p-1.5 bg-rose-50 border border-rose-200 rounded-xl text-[8.5px] text-rose-900">
                        <strong className="block text-[7.5px] uppercase font-black text-rose-700">Drug Allergies:</strong>
                        <span>{Array.isArray(patient.allergies) ? patient.allergies.join(', ') : patient.allergies}</span>
                      </div>
                    )}

                    {/* Clinical Notes / Advice */}
                    {patient.clinicalNotes && (
                      <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[8.5px]">
                        <strong className="text-slate-700 block text-[7.5px] uppercase font-black">Physician Advice:</strong>
                        <p className="text-slate-600 italic line-clamp-2">{patient.clinicalNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN (8 COLS): PRESCRIBED MEDICATIONS & BILLING TABLE */}
                  <div className="col-span-12 md:col-span-8 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-1.5">
                        <div className="flex items-center gap-1 font-black text-sm text-blue-950 font-serif italic">
                          <span className="text-blue-800 text-base">℞</span>
                          <span className="text-[9.5px] font-sans font-black uppercase text-slate-700 not-italic ml-1">
                            {isBillingActive ? 'Dispensed Medications & Bill' : 'Prescribed Medications Schedule'}
                          </span>
                        </div>
                        {isBillingActive && (
                          <span className="text-[8.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full">
                            ✓ Paid via {payMethod}
                          </span>
                        )}
                      </div>

                      {medications.length === 0 ? (
                        <div className="p-3 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-[9.5px]">
                          No oral medications prescribed. Clinical advice only.
                        </div>
                      ) : (
                        <table className="w-full text-left text-[9px] border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase text-[7.5px]">
                              <th className="py-1 pr-1 w-4">#</th>
                              <th className="py-1 pr-2">Medication / Item</th>
                              <th className="py-1 pr-2">Dosage & Instructions</th>
                              <th className="py-1 pr-1 text-center">Qty</th>
                              {isBillingActive && (
                                <>
                                  <th className="py-1 pr-2 text-right">Price ({currencyCode})</th>
                                  <th className="py-1 text-right">Total ({currencyCode})</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {medications.map((med, idx) => {
                              const qty = Number(med.quantity) || 1;
                              const unitPrice = Number(med.price || 0);
                              const lineTotal = qty * unitPrice;
                              return (
                                <tr key={med.id || idx} className="hover:bg-slate-50/60">
                                  <td className="py-1 pr-1 font-mono text-slate-400">{idx + 1}</td>
                                  <td className="py-1 pr-2">
                                    <div className="font-black text-slate-900 leading-tight">
                                      {med.name}
                                    </div>
                                    <div className="text-[7.5px] text-slate-400 font-mono">
                                      📍 {med.storageLocation || 'Shelf B-08'} {med.batchNumber ? `• ${med.batchNumber}` : ''}
                                    </div>
                                  </td>
                                  <td className="py-1 pr-2">
                                    <div className="font-bold text-blue-900">
                                      {med.dosage || med.frequency || '1-0-1'} • {med.duration || '5 Days'}
                                    </div>
                                    {med.instructions && (
                                      <div className="text-[7.5px] text-slate-500 italic">
                                        {med.instructions}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-1 pr-1 text-center font-bold font-mono">
                                    {qty}
                                  </td>
                                  {isBillingActive && (
                                    <>
                                      <td className="py-1 pr-2 text-right font-mono">
                                        {formatCurrency(unitPrice)}
                                      </td>
                                      <td className="py-1 text-right font-black font-mono text-slate-900">
                                        {formatCurrency(lineTotal)}
                                      </td>
                                    </>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Financial Summary Box (When Purchased with price mentioned) */}
                    {isBillingActive && (
                      <div className="mt-2 pt-1.5 border-t border-slate-200 bg-slate-50/80 p-2 rounded-xl text-[9px] flex items-center justify-between">
                        <div className="text-[8px] text-slate-500">
                          <div><strong>Payment Method:</strong> {payMethod} {cashTendered ? `(Tendered: ${formatCurrency(cashTendered)})` : ''}</div>
                          {changeDue > 0 && <div className="text-emerald-700 font-bold">Change Due: {formatCurrency(changeDue)}</div>}
                        </div>
                        <div className="text-right space-y-0.5">
                          <div className="flex items-center gap-3 justify-end text-slate-600">
                            <span>Subtotal: {formatCurrency(subtotal)}</span>
                            {discount > 0 && <span className="text-rose-600">Discount: -{formatCurrency(discount)}</span>}
                          </div>
                          <div className="text-xs font-black text-slate-950 font-mono">
                            Total Paid: <span className="text-emerald-700">{formatCurrency(totalDue)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* FOOTER & SIGNATURE SECTION (A5) */}
              <div className="pt-2 border-t border-slate-200 mt-2 flex items-end justify-between text-[8px]">
                <div className="text-slate-400 max-w-sm">
                  <span className="block font-bold text-slate-600 uppercase text-[7px]">
                    {isBillingActive ? 'Official Pharmacy Tax Invoice' : 'Certified Clinical Prescription'}
                  </span>
                  <span>
                    {isBillingActive
                      ? `Dispensed by: ${headPharmacist} • License: ${pharmacyLicense}`
                      : 'Valid clinical electronic prescription. Take medicines strictly as directed.'}
                  </span>
                </div>

                <div className="flex items-end gap-6 text-right">
                  <div>
                    <div className="w-28 border-b border-slate-400 border-dashed mb-0.5 ml-auto" />
                    <span className="font-bold text-slate-800 text-[8.5px] block">{cabinInfo.doctorName}</span>
                    <span className="text-[7px] text-slate-400 uppercase tracking-wider block">Physician Sign</span>
                  </div>

                  <div>
                    <div className="w-28 border-b border-emerald-500 border-dashed mb-0.5 ml-auto" />
                    <span className="font-bold text-emerald-900 text-[8.5px] block">{headPharmacist.split('(')[0]}</span>
                    <span className="text-[7px] text-slate-400 uppercase tracking-wider block">Pharmacist Verification</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* =========================================================================
               80mm THERMAL STANDARD PAPER ROLL FORMAT
            ========================================================================= */
            <div
              id="printable-rx-doc"
              className="bg-white border border-slate-300 shadow-md p-3 w-[80mm] max-w-[80mm] text-slate-900 text-[9px] font-mono leading-tight space-y-2"
            >
              {/* Thermal Clinic Header */}
              <div className="text-center border-b border-dashed border-slate-400 pb-2">
                <div className="font-black text-xs text-slate-950 uppercase">
                  {clinicSettings?.clinicName || 'Fatima Clinic'}
                </div>
                <div className="text-[8px] text-slate-600">
                  {clinicSettings?.address || '42 Health Avenue, Medical District'}
                </div>
                <div className="text-[8px] text-slate-600">
                  Tel: {clinicSettings?.phone || '(555) 019-2831'}
                </div>
                <div className={`mt-1 font-black text-[9px] uppercase tracking-wider py-0.5 ${
                  isBillingActive ? 'bg-emerald-100 text-emerald-950' : 'bg-slate-100 text-slate-900'
                }`}>
                  *** {isBillingActive ? 'PHARMACY DISPENSE RECEIPT' : 'MEDICAL PRESCRIPTION'} ***
                </div>
                <div className="text-[8px] text-slate-500 mt-0.5">
                  {isBillingActive ? `INV #${invoiceNumber}` : `RX #${rxNumber}`} • {printDate} {printTime}
                </div>
              </div>

              {/* Patient & Doctor Details */}
              <div className="border-b border-dashed border-slate-400 pb-1.5 text-[8.5px] space-y-0.5">
                <div><strong>Patient:</strong> {patient.patientName || patient.name}</div>
                <div><strong>Token:</strong> {patient.tokenNumber} • <strong>MRN:</strong> {patient.patientId || 'PT-REG'}</div>
                <div><strong>Doctor:</strong> {cabinInfo.doctorName} (Cabin {patient.cabinId || 1})</div>
                {patient.allergies && (
                  <div className="text-rose-700 font-bold">⚠️ Allergies: {Array.isArray(patient.allergies) ? patient.allergies.join(', ') : patient.allergies}</div>
                )}
              </div>

              {/* Items List */}
              <div className="border-b border-dashed border-slate-400 pb-2">
                <div className="font-black text-[9px] uppercase mb-1">℞ Medications & Supplies:</div>
                <div className="space-y-1.5">
                  {medications.map((m, idx) => {
                    const qty = Number(m.quantity) || 1;
                    const price = Number(m.price || 0);
                    const lineTotal = qty * price;
                    return (
                      <div key={idx} className="border-b border-dotted border-slate-200 pb-1">
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-[8.5px]">{idx + 1}. {m.name}</span>
                          {isBillingActive && (
                            <span className="font-black font-mono">{formatCurrency(lineTotal)}</span>
                          )}
                        </div>
                        <div className="text-[7.5px] text-slate-700 pl-2">
                          Dosage: <strong>{m.dosage || m.frequency || '1-0-1'}</strong> • Qty: {qty}
                        </div>
                        {m.instructions && (
                          <div className="text-[7px] text-slate-500 pl-2 italic">
                            Dir: {m.instructions}
                          </div>
                        )}
                        <div className="text-[6.5px] text-slate-400 pl-2">
                          📍 {m.storageLocation || 'Shelf B-08'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financial Section (Thermal) */}
              {isBillingActive && (
                <div className="border-b border-dashed border-slate-400 pb-1.5 text-[8.5px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-rose-700">
                      <span>Discount:</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-[9.5px] pt-0.5 border-t border-slate-200">
                    <span>TOTAL PAID:</span>
                    <span>{formatCurrency(totalDue)}</span>
                  </div>
                  <div className="flex justify-between text-[7.5px] text-slate-500">
                    <span>Mode: {payMethod}</span>
                    {changeDue > 0 && <span>Change: {formatCurrency(changeDue)}</span>}
                  </div>
                </div>
              )}

              {/* Advice */}
              {patient.clinicalNotes && (
                <div className="border-b border-dashed border-slate-400 pb-1 text-[7.5px]">
                  <strong>Advice:</strong> {patient.clinicalNotes}
                </div>
              )}

              {/* Footer */}
              <div className="pt-1 text-center text-[7.5px] text-slate-600 space-y-0.5">
                <div>Dispensed by: {headPharmacist}</div>
                <div>License: {pharmacyLicense}</div>
                <div className="text-[7px] text-slate-400 pt-1">
                  *** THANK YOU • GET WELL SOON ***
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

