import React, { useState } from 'react';
import {
  Printer,
  X,
  FileText,
  CheckCircle2,
  Stethoscope,
  Heart,
  Calendar,
  Clock,
  ShieldCheck,
  Building2,
  Pill,
  DollarSign,
  Download
} from 'lucide-react';
import { clinicAudio } from '../../utils/clinicAudio';
import { useClinic } from '../../context/useClinic';
import { printMedicalDocument, generateDirectPdf } from '../../utils/printEngine';

export const LaserMedicalInvoice = ({ invoice, onClose }) => {
  const { currencySymbol, currencyCode, clinicSettings } = useClinic();

  // Print mode: 'A4_LASER' (Default, matches desktop laser printers) vs 'THERMAL_SLIP' (80mm)
  const [printMode, setPrintMode] = useState('A4_LASER');

  const laserDevice = clinicSettings?.printerSettings?.hardwareDevices?.find((d) => d.slot === 2) || {
    name: 'Clinical Laser Document Printer',
    status: 'CONNECTED'
  };
  const isHardwareAttached = laserDevice.status === 'CONNECTED';

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

  if (!invoice) return null;

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
    const paperFormat = printMode === 'A4_LASER' ? 'A4' : 'THERMAL';
    printMedicalDocument('printable-laser-doc', paperFormat, {
      documentTitle: `Invoice_${invoice.invoiceNumber || 'Medical'}`,
      documentType: 'INVOICE'
    });
    triggerAutoClose('print');
  };

  const handleDownloadPdf = async () => {
    clinicAudio.triggerHaptic(15);
    const paperFormat = printMode === 'A4_LASER' ? 'A4' : 'THERMAL';
    await generateDirectPdf('printable-laser-doc', `Invoice_${invoice.invoiceNumber || 'Medical'}`, paperFormat);
    triggerAutoClose('pdf');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 select-none font-sans">
      <div className="bg-white border border-blue-100 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        {/* Modal Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white gap-3">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Consultation & Medical Bill Finalized</span>
          </div>

          {/* Print Mode Selector */}
          <div className="flex items-center gap-2">
            <div className="flex bg-white/10 p-1 rounded-xl border border-white/20 text-xs">
              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(15);
                  setPrintMode('A4_LASER');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  printMode === 'A4_LASER'
                    ? 'bg-white text-blue-950 shadow font-black'
                    : 'text-blue-100 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A4 Laser Printer (Standard Letterhead)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  clinicAudio.triggerHaptic(15);
                  setPrintMode('THERMAL_SLIP');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  printMode === 'THERMAL_SLIP'
                    ? 'bg-amber-400 text-slate-950 shadow font-black'
                    : 'text-blue-100 hover:text-white'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>80mm Thermal Slip</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-blue-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 flex justify-center">
          {/* =========================================================================
              A4 LASER PRINTER SHEET (Formatted to standard A4/Letter specs: 210mm width)
              ========================================================================= */}
          {printMode === 'A4_LASER' ? (
            <div
              id="printable-laser-doc"
              className="w-full max-w-[210mm] bg-white text-slate-900 font-sans p-5 sm:p-6 rounded-xl shadow-2xl border border-slate-200 text-[11px] leading-relaxed"
            >
              {/* Header Letterhead */}
              <div className="flex items-start justify-between pb-4 border-b-2 border-blue-900">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-bold shadow-md">
                    <Stethoscope className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-xl font-serif font-black tracking-wide text-blue-950 uppercase">
                      {clinicSettings?.clinicName || 'Apex Specialist Care Medical Pavilion'}
                    </h1>
                    <p className="text-[11px] font-bold text-blue-700 tracking-wider uppercase">
                      {clinicSettings?.subtitle || 'Multi-Specialty Clinic • Diagnostic Laboratories • Pharmacy'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {clinicSettings?.address || '750 Healthcare Blvd, Suite 400'} • Tel: {clinicSettings?.phone || '(555) 740-9200'} • Emergency: {clinicSettings?.emergencyPhone || '(555) 740-9999'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-900 font-bold text-[10px] uppercase tracking-wider">
                    {clinicSettings?.accreditation || 'JCI Accredited Facility'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    REG: {clinicSettings?.taxRegistrationNumber || clinicSettings?.taxId || 'MED-PK-2026-9912'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    VAT ID: EXEMPT (Healthcare Art. 4)
                  </div>
                </div>
              </div>

              {/* Title & Document Meta Bar */}
              <div className="flex items-center justify-between py-3 border-b border-slate-200 my-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Document Type
                  </span>
                  <span className="text-sm font-black text-slate-900 uppercase tracking-wide">
                    Official Medical Invoice & Prescription (Rx)
                  </span>
                </div>

                <div className="text-right flex items-center gap-4 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Invoice Number:</span>
                    <strong className="text-blue-900 font-bold">{invoice.invoiceNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Date & Time:</span>
                    <span>{new Date(invoice.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Patient Demographics & Vitals Table (Two Columns) */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100 my-3 text-[11px]">
                {/* Left: Patient Info */}
                <div className="space-y-1">
                  <div className="flex">
                    <span className="w-24 text-slate-500 font-semibold">Patient Name:</span>
                    <strong className="text-slate-900 font-bold">{invoice.patientName}</strong>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-500 font-semibold">Medical Record #:</span>
                    <span className="font-mono font-bold text-blue-800">{invoice.patientId}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-500 font-semibold">Age / Gender:</span>
                    <span>{invoice.age} Years / {invoice.gender}</span>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-500 font-semibold">Token Number:</span>
                    <span className="font-mono font-black text-blue-800">{invoice.tokenNumber}</span>
                  </div>
                </div>

                {/* Right: Attending Doctor & Vitals */}
                <div className="space-y-1 border-l border-blue-200 pl-4">
                  <div className="flex">
                    <span className="w-24 text-slate-500 font-semibold">Attending Doctor:</span>
                    <strong className="text-blue-950 font-bold">{invoice.doctorName}</strong>
                  </div>
                  <div className="flex">
                    <span className="w-24 text-slate-500 font-semibold">Department:</span>
                    <span>{invoice.department} (Cabin {invoice.cabinId})</span>
                  </div>
                  {invoice.vitals && (
                    <div className="flex text-[10px] text-slate-600 pt-0.5">
                      <span className="w-24 text-slate-500 font-semibold">Triage Vitals:</span>
                      <span className="font-mono">
                        Temp: {invoice.vitals.temp || '98.6°F'} | BP: {invoice.vitals.bp} | HR: {invoice.vitals.pulse} | SpO2: {invoice.vitals.spo2}
                      </span>
                    </div>
                  )}
                  <div className="flex">
                    <span className="w-24 text-slate-500 font-semibold">Payment Status:</span>
                    <span className="font-bold text-emerald-700 uppercase">BILLED & SETTLED</span>
                  </div>
                </div>
              </div>

              {/* Clinical Services & Lab Tests Table */}
              <div className="my-4">
                <div className="text-[11px] font-black text-blue-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-700" />
                  1. Clinical Consultation & Diagnostic Procedures
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-blue-900 text-white text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-2 px-3">Item #</th>
                      <th className="py-2 px-3">Code</th>
                      <th className="py-2 px-3">Service / Procedure Description</th>
                      <th className="py-2 px-3">Category</th>
                      <th className="py-2 px-3 text-right">Fee ({currencyCode || 'PKR'})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 border-b border-slate-200 text-[11px]">
                    {invoice.services?.map((srv, index) => (
                      <tr key={index} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono text-slate-500">{index + 1}</td>
                        <td className="py-2 px-3 font-mono text-blue-800 font-semibold">{srv.code || 'SVC-01'}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{srv.name}</td>
                        <td className="py-2 px-3 text-slate-600">{srv.category || 'Consultation'}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">{currencySymbol}{srv.price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Electronic Prescription (Rx) Section */}
              {invoice.medications && invoice.medications.length > 0 && (
                <div className="my-4 pt-2 border-t border-slate-200">
                  <div className="text-[11px] font-black text-blue-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-purple-700" />
                    2. Electronic Medical Prescription (Rx)
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800 text-white text-[10px] uppercase font-bold tracking-wider">
                        <th className="py-1.5 px-3">Rx #</th>
                        <th className="py-1.5 px-3">Medication & Strength</th>
                        <th className="py-1.5 px-3">Dosage & Frequency</th>
                        <th className="py-1.5 px-3">Course Duration</th>
                        <th className="py-1.5 px-3 text-right">Amount ({currencyCode || 'PKR'})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 border-b border-slate-200 text-[11px]">
                      {invoice.medications.map((med, index) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono text-purple-800 font-bold">Rx-{index + 1}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{med.name}</td>
                          <td className="py-2 px-3 text-purple-900 font-mono font-semibold">{med.dosage}</td>
                          <td className="py-2 px-3 text-slate-600">{med.duration}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold">{currencySymbol}{(med.price || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Doctor Clinical Notes */}
              {invoice.clinicalNotes && (
                <div className="my-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-700">
                  <span className="font-bold text-slate-900 block uppercase tracking-wider mb-0.5">
                    Attending Physician Impressions & Instructions:
                  </span>
                  <p className="italic">{invoice.clinicalNotes}</p>
                </div>
              )}

              {/* Financial Settlement & Signatures (Page Bottom) */}
              <div className="mt-4 pt-3 border-t-2 border-slate-300 grid grid-cols-12 gap-4">
                {/* Left: Stamp & Signature Box (7 cols) */}
                <div className="col-span-7 flex flex-col justify-between">
                  <div className="space-y-1 text-[10px] text-slate-500">
                    <p>• Medical fees are exempt from local sales tax under Healthcare Regulation Act.</p>
                    <p>• Medications once dispensed cannot be returned without pharmacist inspection.</p>
                    <p>• For medical emergencies, proceed to the 24/7 {clinicSettings?.clinicName || 'Apex Emergency Pavilion'}.</p>
                  </div>

                  <div className="pt-8 flex items-end justify-between pr-6">
                    <div className="text-center">
                      <div className="w-28 border-b border-slate-400 mb-1"></div>
                      <span className="text-[10px] text-slate-500 block">Duty Cashier Signature</span>
                    </div>

                    <div className="text-center">
                      <div className="w-28 border-b border-slate-400 mb-1"></div>
                      <span className="text-[10px] text-slate-500 block">Patient / Attendant</span>
                    </div>
                  </div>
                </div>

                {/* Right: Financial Ledger Totals (5 cols) */}
                <div className="col-span-5 bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col justify-between">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Services Gross:</span>
                      <span className="font-mono font-semibold">{currencySymbol}{invoice.subtotal.toFixed(2)}</span>
                    </div>

                    {invoice.insuranceCoPay > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Insurance Co-Pay:</span>
                        <span className="font-mono">-{currencySymbol}{invoice.insuranceCoPay.toFixed(2)}</span>
                      </div>
                    )}

                    {invoice.discount > 0 && (
                      <div className="flex justify-between text-blue-700">
                        <span>Clinic Subsidy / Promo:</span>
                        <span className="font-mono">-{currencySymbol}{invoice.discount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-300 flex justify-between font-black text-sm text-slate-900">
                      <span>{invoice.status === 'PAID_UPFRONT' || invoice.status === 'SETTLED' ? 'Total Paid Upfront:' : (invoice.status === 'PAY_IN_CABIN' ? 'Payable in Doctor Cabin:' : 'Total Payable (Due at Counter):')}</span>
                      <span className={`font-mono text-base ${invoice.status === 'PAID_UPFRONT' || invoice.status === 'SETTLED' ? 'text-blue-800' : (invoice.status === 'PAY_IN_CABIN' ? 'text-purple-800' : 'text-amber-800')}`}>
                        {currencySymbol}{invoice.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-dashed border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Payment Status & Method:</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                        invoice.status === 'PAID_UPFRONT' || invoice.status === 'SETTLED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : invoice.status === 'PAY_IN_CABIN'
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : 'bg-amber-100 text-amber-900'
                      }`}>
                        {invoice.status === 'PAID_UPFRONT' || invoice.status === 'SETTLED' ? 'PAID' : (invoice.status === 'PAY_IN_CABIN' ? 'PAY IN CABIN' : 'DUE AT COUNTER')}
                      </span>
                      <span className="font-bold uppercase text-slate-800">({invoice.paymentMethod})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sheet Bottom Footer Bar */}
              <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[9px] text-slate-400">
                {clinicSettings?.clinicName || 'Apex Specialist Care Pavilion'} • System Generated Laser Document • Valid Without Physical Seal
              </div>
            </div>
          ) : (
            /* =========================================================================
                80mm THERMAL SLIP MODE (Alternative roll printer)
                ========================================================================= */
            <div
              id="printable-laser-doc"
              className="w-[80mm] max-w-[80mm] bg-white text-slate-900 font-mono p-4 rounded shadow-2xl border border-slate-300 text-[11px] leading-tight"
            >
              <div className="text-center pb-2 border-b border-dashed border-slate-400">
                <h2 className="font-bold text-sm uppercase">{clinicSettings?.clinicName || 'APEX CLINIC'}</h2>
                <p className="text-[10px]">{clinicSettings?.address || '750 Healthcare Blvd'}</p>
                <p className="text-[10px]">Tel: {clinicSettings?.phone || '(555) 740-9200'}</p>
                <div className="font-black text-xl my-2 border-y border-slate-300 py-1">
                  TOKEN {invoice.tokenNumber}
                </div>
                <div className="text-[10px] font-bold">CABIN {invoice.cabinId} ({invoice.department})</div>
                <div className="text-[10px]">{invoice.doctorName}</div>
              </div>

              {/* Patient Info */}
              <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                <div>PT: {invoice.patientName}</div>
                <div>MRN: {invoice.patientId}</div>
                <div>DATE: {new Date(invoice.timestamp).toLocaleString()}</div>
                <div>INV: {invoice.invoiceNumber}</div>
                {invoice.vitals && (
                  <div className="text-slate-600 font-mono text-[9px] pt-0.5">
                    VITALS: T:{invoice.vitals.temp || '98.6°F'} BP:{invoice.vitals.bp} HR:{invoice.vitals.pulse} SpO2:{invoice.vitals.spo2}
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[10px]">
                {invoice.services?.map((srv, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="truncate max-w-[190px]">{srv.name}</span>
                    <span className="font-semibold">{currencySymbol}{srv.price.toFixed(2)}</span>
                  </div>
                ))}
                {invoice.medications?.map((m, i) => (
                  <div key={i} className="flex justify-between text-slate-600">
                    <span className="truncate max-w-[190px]">Rx: {m.name}</span>
                    <span className="font-semibold">{currencySymbol}{(m.price || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
                <div className="flex justify-between font-bold text-sm">
                  <span>{invoice.status === 'PAID_UPFRONT' || invoice.status === 'SETTLED' ? 'TOTAL PAID:' : (invoice.status === 'PAY_IN_CABIN' ? 'CABIN TOTAL:' : 'TOTAL DUE AT COUNTER:')}</span>
                  <span className={invoice.status === 'PAID_UPFRONT' || invoice.status === 'SETTLED' ? 'text-slate-900' : (invoice.status === 'PAY_IN_CABIN' ? 'text-purple-900' : 'text-amber-800')}>
                    {currencySymbol}{invoice.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>PAYMENT:</span>
                  <span className="uppercase font-bold">{invoice.status === 'PAID_UPFRONT' || invoice.status === 'SETTLED' ? `PAID (${invoice.paymentMethod})` : (invoice.status === 'PAY_IN_CABIN' ? 'PAY IN CABIN' : `UNPAID (${invoice.paymentMethod})`)}</span>
                </div>
              </div>

              <div className="pt-3 text-center text-[10px] text-slate-500">
                WISHING YOU GOOD HEALTH!
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-500 font-medium">
            {printMode === 'A4_LASER'
              ? '✓ Formatted for A4 / US Letter Desktop Laser Printers (No clipping)'
              : 'Formatted for 80mm Roll Thermal Printers'}
          </span>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {closingAction && (
              <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {closingAction === 'print' ? 'Sent to printer • Closing in 2s...' : 'PDF downloaded • Closing in 2s...'}
              </span>
            )}

            <button
              type="button"
              onClick={handleDownloadPdf}
              className={`py-3 px-5 border-2 font-bold rounded-xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xs cursor-pointer ${
                closingAction === 'pdf'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-400 font-black'
                  : 'bg-white hover:bg-slate-100 text-blue-900 border-blue-200'
              }`}
              title="Download crisp vector PDF without OS print dialog"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>{closingAction === 'pdf' ? 'PDF Saved' : 'Download PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className={`flex-1 sm:flex-initial py-3 px-6 text-white font-black text-sm rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer ${
                closingAction === 'print'
                  ? 'bg-emerald-600 ring-2 ring-emerald-300'
                  : isHardwareAttached
                  ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-500/25'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25'
              }`}
            >
              {closingAction === 'print' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Printed ✓</span>
                </>
              ) : isHardwareAttached ? (
                <>
                  <Printer className="w-4 h-4" />
                  <span>Print {printMode === 'A4_LASER' ? 'A4 Document' : 'Thermal Slip'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Generate PDF Document</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-3 px-5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-xl text-sm active:scale-95 transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
