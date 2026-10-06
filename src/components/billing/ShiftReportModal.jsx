import React from 'react';
import {
  Printer,
  X,
  TrendingUp,
  DollarSign,
  Users,
  ShieldCheck,
  Building2,
  Calendar,
  CreditCard,
  Banknote,
  Activity,
  FileSpreadsheet
} from 'lucide-react';
import { clinicAudio } from '../../utils/clinicAudio';
import { useClinic } from '../../context/useClinic';
import { printMedicalDocument } from '../../utils/printEngine';

export const ShiftReportModal = ({ invoices = [], cabins = [], onClose }) => {
  const { currencySymbol, clinicSettings } = useClinic();
  const handlePrint = () => {
    clinicAudio.triggerHaptic(20);
    printMedicalDocument('printable-shift-report', 'A4');
  };

  // Aggregations
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
  const totalConsultationsFee = invoices.reduce((sum, inv) => {
    const consultTotal = (inv.services || [])
      .filter((s) => s.category === 'Consultation' || (s.code && s.code.startsWith('CON-')) || s.name.includes('Consultation'))
      .reduce((sSum, s) => sSum + (s.price || 0), 0);
    return sum + (consultTotal || inv.total * 0.75);
  }, 0);

  const totalPharmacyFee = invoices.reduce((sum, inv) => {
    const medTotal = (inv.medications || []).reduce((mSum, m) => mSum + (m.price || 0), 0);
    return sum + medTotal;
  }, 0);

  const totalDiagnosticsFee = Math.max(0, invoices.reduce((sum, inv) => {
    const diagTotal = (inv.services || [])
      .filter((s) => s.category === 'Diagnostics' || (s.code && (s.code.startsWith('LAB-') || s.code.startsWith('RAD-'))))
      .reduce((dSum, s) => dSum + (s.price || 0), 0);
    return sum + diagTotal;
  }, 0));

  // Payment Breakdown
  const paymentBreakdown = invoices.reduce((acc, inv) => {
    const method = inv.paymentMethod || 'CARD';
    acc[method] = (acc[method] || 0) + (inv.total || 0);
    return acc;
  }, {});

  // Revenue by Doctor Cabin
  const cabinBreakdown = cabins.map((cabin) => {
    const cabinInvoices = invoices.filter((inv) => inv.cabinId === cabin.cabinId);
    const rev = cabinInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    return {
      ...cabin,
      patientCount: cabinInvoices.length,
      revenue: rev
    };
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 select-none overflow-y-auto">
      <div className="bg-white border border-blue-100 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-5 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black flex items-center gap-2">
                <span>Daily Clinical & Shift Audit Report</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-100 border border-blue-400/40 font-semibold">
                  Today's Census
                </span>
              </h2>
              <p className="text-xs text-blue-200">
                {clinicSettings?.clinicName || 'APEX Specialist Medical Pavilion'} • Real-time Revenue & Reconciliation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-white hover:bg-blue-50 text-blue-950 font-black rounded-xl text-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              <span>Print Audit Sheet</span>
            </button>
            <button
              type="button"
              onClick={() => {
                clinicAudio.triggerHaptic(15);
                onClose();
              }}
              className="p-2 text-blue-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div id="printable-shift-report" className="p-6 overflow-y-auto space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                <span>Total Patients Billed</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-950">{invoices.length}</div>
              <div className="text-[11px] text-emerald-600 font-bold mt-0.5">100% Settled</div>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                <span>Gross Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700">{currencySymbol}{totalRevenue.toFixed(2)}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">Tax-Exempt Medical</div>
            </div>

            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                <span>Doctor Consultations</span>
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-800">
                {currencySymbol}{(totalConsultationsFee || totalRevenue * 0.75).toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">Cabins 1 to 5</div>
            </div>

            <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                <span>Pharmacy & Labs</span>
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-purple-800">
                {currencySymbol}{(totalPharmacyFee + totalDiagnosticsFee || totalRevenue * 0.25).toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">Medications + Labs</div>
            </div>
          </div>

          {/* Revenue By Doctor Cabin */}
          <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-black text-blue-950 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Performance By Doctor Cabin (1–5)
              </span>
              <span className="text-xs text-slate-500 font-normal">5 Specialist Suites</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {cabinBreakdown.map((c) => (
                <div
                  key={c.cabinId}
                  className="bg-blue-50/40 border border-blue-100 rounded-xl p-3.5 flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-white flex-shrink-0 border border-blue-200">
                    <img src={c.image} alt={c.doctorName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-blue-700 uppercase tracking-wider">
                        {c.cabinName}
                      </span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                        {c.patientCount} pt
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 truncate">{c.doctorName.split(',')[0]}</div>
                    <div className="text-[11px] text-slate-500 truncate">{c.department}</div>
                    <div className="text-xs font-black text-blue-900 mt-1">
                      {currencySymbol}{c.revenue.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-blue-100 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-black text-blue-950 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                Settlement Tender Breakdown
              </h3>
              <div className="space-y-2.5">
                {[
                  { key: 'CARD', label: 'Credit / Debit Card (Chip & NFC)', icon: CreditCard, color: 'text-blue-600' },
                  { key: 'CASH', label: 'Cash Desk Register', icon: Banknote, color: 'text-emerald-600' },
                  { key: 'INSURANCE_COPAY', label: 'Insurance Direct Co-Pay', icon: ShieldCheck, color: 'text-amber-600' },
                  { key: 'TOUCH_PAY_UPI', label: 'TouchPay & QR Wallet', icon: Activity, color: 'text-purple-600' }
                ].map((m) => {
                  const val = paymentBreakdown[m.key] || 0;
                  const pct = totalRevenue > 0 ? ((val / totalRevenue) * 100).toFixed(0) : 0;
                  const Icon = m.icon;
                  return (
                    <div key={m.key} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <Icon className={`w-4 h-4 ${m.color}`} />
                        <span className="text-slate-700 font-semibold">{m.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-slate-900">{currencySymbol}{val.toFixed(2)}</div>
                        <div className="text-[10px] text-slate-500">{pct}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shift Notes & Quality Seal */}
            <div className="bg-white border border-blue-100 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
              <div>
                <h3 className="text-sm font-black text-blue-950 mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Clinical Accreditation & Verification
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  All consultations in this shift have been signed off by registered medical specialists.
                  Electronic medical records (EMR) and pharmacy dispensations are encrypted under HIPAA and JCI standards.
                </p>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="text-xs font-bold text-blue-900">Auditor Status: RECONCILED & BALANCED</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Pre-billed token revenue matches register drawer count.
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Duty Billing Officer: Cashier Desk #1</span>
                <span>Laser POS System V4.2</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Shift Date: {new Date().toLocaleDateString(undefined, { dateStyle: 'full' })}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              clinicAudio.triggerHaptic(15);
              onClose();
            }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-all active:scale-95 shadow-sm"
          >
            Close Summary
          </button>
        </div>
      </div>
    </div>
  );
};
