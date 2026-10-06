import React from 'react';
import { Delete, CornerDownLeft, Space, Keyboard } from 'lucide-react';
import { clinicAudio } from '../../utils/clinicAudio';

/**
 * TouchNumpad
 * Responsive on-screen number pad for touch devices (Mobile, Tablets, Kiosks).
 * Automatically hidden on desktop hardware setups unless toggled on.
 */
export const TouchNumpad = ({ value = '', onChange, onEnter, maxLength = 12 }) => {
  const handleDigit = (digit) => {
    clinicAudio.triggerHaptic(15);
    if (value.length < maxLength) {
      onChange(value + digit);
    }
  };

  const handleBackspace = () => {
    clinicAudio.triggerHaptic(15);
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    clinicAudio.triggerHaptic(20);
    onChange('');
  };

  return (
    <div className="w-full max-w-sm mx-auto select-none">
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5 p-2 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="h-12 sm:h-14 md:h-16 text-xl sm:text-2xl font-bold bg-slate-800 hover:bg-slate-700 active:bg-teal-500 active:text-slate-950 text-slate-100 rounded-xl transition-all duration-75 shadow-md flex items-center justify-center border border-slate-700/60 cursor-pointer"
          >
            {digit}
          </button>
        ))}

        <button
          type="button"
          onClick={handleClear}
          className="h-12 sm:h-14 md:h-16 text-xs sm:text-sm font-semibold tracking-wider bg-rose-950/40 hover:bg-rose-900/60 active:bg-rose-600 text-rose-300 rounded-xl transition-all duration-75 border border-rose-800/40 flex items-center justify-center uppercase cursor-pointer"
        >
          Clear
        </button>

        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-12 sm:h-14 md:h-16 text-xl sm:text-2xl font-bold bg-slate-800 hover:bg-slate-700 active:bg-teal-500 active:text-slate-950 text-slate-100 rounded-xl transition-all duration-75 shadow-md flex items-center justify-center border border-slate-700/60 cursor-pointer"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          className="h-12 sm:h-14 md:h-16 bg-slate-800 hover:bg-slate-700 active:bg-rose-600 active:text-white text-slate-300 rounded-xl transition-all duration-75 border border-slate-700/60 flex items-center justify-center shadow-md cursor-pointer"
        >
          <Delete className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      </div>

      {onEnter && (
        <button
          type="button"
          onClick={onEnter}
          className="w-full mt-2.5 sm:mt-3 py-3 sm:py-3.5 bg-gradient-to-r from-teal-500 to-teal-600 active:from-teal-600 active:to-teal-700 text-slate-950 font-bold text-base sm:text-lg rounded-xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
        >
          <span>Confirm / Next</span>
          <CornerDownLeft className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

/**
 * TouchKeyboard
 * Complete QWERTY touch keyboard for touch devices (Mobile, Tablets, Kiosks).
 * Automatically hidden on desktop hardware setups unless toggled on.
 */
export const TouchKeyboard = ({ value = '', onChange, onEnter }) => {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  const handleKey = (key) => {
    clinicAudio.triggerHaptic(12);
    onChange(value + key);
  };

  const handleBackspace = () => {
    clinicAudio.triggerHaptic(15);
    onChange(value.slice(0, -1));
  };

  const handleSpace = () => {
    clinicAudio.triggerHaptic(12);
    onChange(value + ' ');
  };

  const handleClear = () => {
    clinicAudio.triggerHaptic(20);
    onChange('');
  };

  return (
    <div className="w-full max-w-2xl mx-auto select-none bg-slate-900/95 p-2 sm:p-3 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col gap-1.5 sm:gap-2">
        {/* Row 1: Q - P */}
        <div className="flex justify-center gap-1 sm:gap-1.5">
          {rows[0].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleKey(key)}
              className="flex-1 min-w-[28px] max-w-[56px] h-10 sm:h-12 md:h-14 font-bold text-sm sm:text-base md:text-lg bg-slate-800 hover:bg-slate-700 active:bg-teal-500 active:text-slate-950 text-slate-100 rounded-lg border border-slate-700/60 shadow transition-all duration-75 flex items-center justify-center cursor-pointer"
            >
              {key}
            </button>
          ))}
        </div>

        {/* Row 2: A - L */}
        <div className="flex justify-center gap-1 sm:gap-1.5 px-2 sm:px-3">
          {rows[1].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleKey(key)}
              className="flex-1 min-w-[28px] max-w-[56px] h-10 sm:h-12 md:h-14 font-bold text-sm sm:text-base md:text-lg bg-slate-800 hover:bg-slate-700 active:bg-teal-500 active:text-slate-950 text-slate-100 rounded-lg border border-slate-700/60 shadow transition-all duration-75 flex items-center justify-center cursor-pointer"
            >
              {key}
            </button>
          ))}
        </div>

        {/* Row 3: Z - M + Backspace */}
        <div className="flex justify-center gap-1 sm:gap-1.5 px-3 sm:px-5">
          {rows[2].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handleKey(key)}
              className="flex-1 min-w-[28px] max-w-[56px] h-10 sm:h-12 md:h-14 font-bold text-sm sm:text-base md:text-lg bg-slate-800 hover:bg-slate-700 active:bg-teal-500 active:text-slate-950 text-slate-100 rounded-lg border border-slate-700/60 shadow transition-all duration-75 flex items-center justify-center cursor-pointer"
            >
              {key}
            </button>
          ))}
          <button
            type="button"
            onClick={handleBackspace}
            className="w-12 sm:w-16 h-10 sm:h-12 md:h-14 bg-slate-800 hover:bg-slate-700 active:bg-rose-600 active:text-white text-slate-300 rounded-lg border border-slate-700/60 shadow transition-all duration-75 flex items-center justify-center cursor-pointer"
            title="Backspace"
          >
            <Delete className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Row 4: Controls (Clear, Space, Next) */}
        <div className="flex justify-center items-center gap-1.5 sm:gap-2 mt-1">
          <button
            type="button"
            onClick={handleClear}
            className="px-2.5 sm:px-4 h-10 sm:h-12 text-[11px] sm:text-xs font-semibold uppercase bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 active:bg-rose-600 active:text-white rounded-lg border border-rose-800/40 transition-all duration-75 cursor-pointer"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleSpace}
            className="flex-1 max-w-sm h-10 sm:h-12 bg-slate-800 hover:bg-slate-700 active:bg-teal-500 active:text-slate-950 text-slate-300 rounded-lg border border-slate-700/60 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-75 cursor-pointer"
          >
            <Space className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>SPACE</span>
          </button>
          {onEnter && (
            <button
              type="button"
              onClick={onEnter}
              className="px-3 sm:px-6 h-10 sm:h-12 bg-gradient-to-r from-teal-500 to-teal-600 text-slate-950 font-bold text-xs sm:text-sm rounded-lg shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Next</span>
              <CornerDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * VirtualKeyboardToggle
 * Accessible interactive pill toggle allowing users to switch between
 * Auto (Touch-detected), Always On, and Off (Hardware Only).
 */
export const VirtualKeyboardToggle = ({ inputMode, onToggle, isTouchDevice }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
        inputMode === 'ALWAYS_ON'
          ? 'bg-teal-100 text-teal-900 border-teal-300 hover:bg-teal-200'
          : inputMode === 'OFF'
          ? 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
          : 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
      }`}
      title="Toggle On-Screen Keyboard Mode (Auto / Always On / Off)"
    >
      <Keyboard className="w-3.5 h-3.5" />
      <span>
        {inputMode === 'ALWAYS_ON' && 'On-Screen Keyboard: ON'}
        {inputMode === 'OFF' && 'On-Screen Keyboard: OFF (Physical Only)'}
        {inputMode === 'AUTO' && (isTouchDevice ? 'Keyboard: Auto (Touch Active)' : 'Keyboard: Auto (Hardware Detected)')}
      </span>
    </button>
  );
};

export const TouchKeypad = TouchNumpad;
