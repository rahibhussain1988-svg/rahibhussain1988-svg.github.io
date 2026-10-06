import React from 'react';
import {
  Banknote,
  RotateCcw,
  Delete,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  CreditCard,
  QrCode
} from 'lucide-react';
import { clinicAudio } from '../../utils/clinicAudio';

export const PosPaymentKeypad = ({
  value = 0,
  onChange,
  totalDue = 0,
  currencySymbol = 'Rs',
  allowCabinOption = false,
  cabinLabel = 'Cabin',
  paymentMode = 'CASH',
  onPaymentModeChange,
  availableModes = ['CASH', 'CARD', 'TOUCH_PAY'],
  className = ''
}) => {
  const numVal = Number(value || 0);
  const safeTotal = Number(totalDue || 0);
  const changeDue = Math.max(0, numVal - safeTotal);
  const isCovered = numVal >= safeTotal && safeTotal > 0;
  const isShort = numVal > 0 && numVal < safeTotal;
  const isZero = numVal === 0;

  const handleDigit = (digit) => {
    clinicAudio.triggerHaptic(10);
    const cur = String(numVal === 0 ? '' : numVal);
    const nextStr = cur + digit;
    if (Number(nextStr) <= 999999) {
      onChange(Number(nextStr));
    }
  };

  const handleClear = () => {
    clinicAudio.triggerHaptic(15);
    onChange(0);
  };

  const handleBackspace = () => {
    clinicAudio.triggerHaptic(10);
    const cur = String(numVal);
    if (cur.length <= 1) {
      onChange(0);
    } else {
      onChange(Number(cur.slice(0, -1)));
    }
  };

  const handleExact = () => {
    clinicAudio.triggerHaptic(15);
    onChange(Math.max(0, Math.round(safeTotal)));
  };

  const handleCabinZero = () => {
    clinicAudio.triggerHaptic(15);
    onChange(0);
  };

  const handleDenomination = (amt) => {
    clinicAudio.triggerHaptic(15);
    onChange(amt);
  };

  // Denominations based on currency
  const denominations =
    currencySymbol === 'Rs' || currencySymbol === 'PKR'
      ? [500, 1000, 2000, 5000]
      : [20, 50, 100];

  return (
    <div className={`p-2.5 sm:p-3 bg-white border border-slate-200/90 rounded-2xl space-y-2 shadow-2xs select-none ${className}`}>
      {/* 1. Header: Payment Mode Bar */}
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
            Payment Mode:
          </span>
          <span className="text-[10px] text-slate-400 font-medium ml-1.5 hidden sm:inline">
            Standard: Cash at Counter
          </span>
        </div>

        {onPaymentModeChange && (
          <div className="flex items-center gap-1">
            {availableModes.map((mode) => {
              const isActive = paymentMode === mode;
              const label =
                mode === 'CASH'
                  ? 'Cash at Counter'
                  : mode === 'CARD'
                  ? 'EMV Card'
                  : 'Touch QR';
              const IconComponent =
                mode === 'CASH' ? Banknote : mode === 'CARD' ? CreditCard : QrCode;

              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    clinicAudio.triggerHaptic(10);
                    onPaymentModeChange(mode);
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <IconComponent className="w-3 h-3" />
                  <span className="truncate max-w-[100px]">{label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Tender Register LCD Box (Navy Dark Display) */}
      <div className="p-2.5 bg-[#0B1120] text-white rounded-xl shadow-inner border border-slate-800 flex flex-col justify-between gap-1">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1 text-slate-400">
            <Banknote className="w-3.5 h-3.5 text-emerald-400" />
            AMOUNT RECEIVED FROM PATIENT:
          </span>
          <span className="text-[9px] text-purple-300 font-mono">
            {allowCabinOption ? '(0 = PAY IN CABIN)' : '(CASH TENDERED)'}
          </span>
        </div>

        <div className="flex items-baseline justify-between mt-0.5">
          <div
            className={`font-mono text-2xl sm:text-3xl font-black tracking-tight flex items-baseline gap-1 ${
              isShort ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            <span
              className={`text-sm sm:text-base font-bold ${
                isShort ? 'text-rose-500' : 'text-emerald-500'
              }`}
            >
              {currencySymbol}
            </span>
            <span>{numVal.toLocaleString()}</span>
            <span
              className={`w-1.5 h-5 ml-0.5 inline-block ${
                isShort ? 'bg-rose-400/80 animate-pulse' : 'bg-emerald-400/80 animate-pulse'
              }`}
            />
          </div>

          {numVal > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 3. Routing Feedback Card */}
      {isZero ? (
        allowCabinOption ? (
          <div className="px-2.5 py-1.5 bg-purple-50/90 border border-purple-200/90 rounded-xl text-purple-900 text-[11px] font-semibold flex items-center gap-2 shadow-2xs">
            <Stethoscope className="w-4 h-4 text-purple-700 shrink-0" />
            <span className="truncate">
              <strong>Amount: {currencySymbol}0.00</strong> — Settle consultation fee directly inside{' '}
              <strong>{cabinLabel}</strong>.
            </span>
          </div>
        ) : (
          <div className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-[11px] font-medium flex items-center gap-2 shadow-2xs">
            <Banknote className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="truncate">
              Enter cash received from customer or tap <strong>Exact ({currencySymbol}{safeTotal.toFixed(0)})</strong>.
            </span>
          </div>
        )
      ) : isCovered ? (
        <div className="px-2.5 py-1.5 bg-emerald-50/90 border border-emerald-200/90 rounded-xl text-emerald-950 text-[11px] font-semibold flex items-center justify-between shadow-2xs">
          <span className="flex items-center gap-1.5 truncate">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Fee covered ({currencySymbol}{safeTotal.toFixed(2)})</span>
          </span>
          <span className="font-black font-mono shrink-0 ml-1 text-emerald-800">
            Change Due: {currencySymbol}{changeDue.toFixed(2)}
          </span>
        </div>
      ) : (
        <div className="px-2.5 py-1.5 bg-rose-50 border-2 border-rose-300 rounded-xl text-rose-950 text-[11px] font-bold flex items-center justify-between shadow-2xs animate-in fade-in">
          <span className="flex items-center gap-1.5 truncate">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Amount less than Total ({currencySymbol}{safeTotal.toFixed(2)})</span>
          </span>
          <span className="font-black font-mono text-rose-700 shrink-0 ml-1">
            Short: {currencySymbol}{(safeTotal - numVal).toFixed(2)}
          </span>
        </div>
      )}

      {/* 4. Quick Denomination Presets Row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={handleExact}
          className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-2xs"
        >
          Exact ({currencySymbol}{safeTotal.toFixed(0)})
        </button>

        {allowCabinOption && (
          <button
            type="button"
            onClick={handleCabinZero}
            className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer active:scale-95 transition-all border ${
              numVal === 0
                ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
            }`}
          >
            🩺 Cabin ({currencySymbol}0.00)
          </button>
        )}

        {denominations.map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => handleDenomination(amt)}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg font-bold text-xs font-mono cursor-pointer active:scale-95 transition-all shadow-2xs"
          >
            +{currencySymbol}{amt}
          </button>
        ))}
      </div>

      {/* 5. Numbers Keyboard (3x4 POS Grid) */}
      <div className="grid grid-cols-3 gap-1.5 pt-0.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleDigit(String(num))}
            className="h-10 sm:h-11 bg-white hover:bg-blue-50/50 active:bg-blue-100 text-slate-800 border border-slate-200 rounded-xl font-mono font-black text-lg sm:text-xl shadow-2xs transition-all active:scale-95 flex items-center justify-center cursor-pointer"
          >
            {num}
          </button>
        ))}

        {/* Clear Button */}
        <button
          type="button"
          onClick={handleClear}
          className="h-10 sm:h-11 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs sm:text-sm shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
          title="Clear amount to 0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>CLEAR</span>
        </button>

        {/* Zero Button */}
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-10 sm:h-11 bg-white hover:bg-blue-50/50 active:bg-blue-100 text-slate-800 border border-slate-200 rounded-xl font-mono font-black text-lg sm:text-xl shadow-2xs transition-all active:scale-95 flex items-center justify-center cursor-pointer"
        >
          0
        </button>

        {/* Backspace Button */}
        <button
          type="button"
          onClick={handleBackspace}
          className="h-10 sm:h-11 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-bold text-xs sm:text-sm shadow-2xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          title="Delete last digit"
        >
          <Delete className="w-4 h-4 text-amber-700" />
          <span>DEL</span>
        </button>
      </div>
    </div>
  );
};
