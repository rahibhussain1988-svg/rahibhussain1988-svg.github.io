import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'clinic_virtual_keyboard_mode';

/**
 * Detects whether the current device has touchscreen capability.
 */
export function checkIsTouchDevice() {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
    (typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches)
  );
}

/**
 * Detects whether the current device has a fine pointer (mouse / trackpad) typical of hardware desktop/laptop.
 */
export function checkHasFinePointer() {
  if (typeof window === 'undefined') return true;
  return typeof window.matchMedia === 'function' && window.matchMedia('(pointer: fine)').matches;
}

/**
 * useDeviceInputMode
 * Manages adaptive on-screen keyboard/keypad display based on physical hardware vs touch device,
 * with persistence and user manual override options.
 *
 * Requirements:
 * 1. If user attached physical screen with hardware (desktop/laptop), system does NOT show on-screen keyboard/keypad.
 * 2. If user is on tablet/mobile/touch device, system shows complete keyboard/keypad as per need of input.
 * 3. User can also use physical keyboard directly on all fields.
 * 4. User can toggle virtual keyboard mode (Auto / Always On / Off) if desired.
 */
export function useDeviceInputMode() {
  const [isTouch, setIsTouch] = useState(() => checkIsTouchDevice());
  const [hasFinePointer, setHasFinePointer] = useState(() => checkHasFinePointer());

  // Mode: 'AUTO' (default: adapt to device), 'ALWAYS_ON' (force on-screen keyboard), 'OFF' (force hide)
  const [mode, setMode] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ALWAYS_ON' || saved === 'OFF' || saved === 'AUTO') {
        return saved;
      }
    } catch {}
    return 'AUTO';
  });

  // Listen to pointer/media changes dynamically (e.g. tablet docked/undocked or orientation change)
  useEffect(() => {
    const updateDeviceInfo = () => {
      setIsTouch(checkIsTouchDevice());
      setHasFinePointer(checkHasFinePointer());
    };

    updateDeviceInfo();

    const coarseQuery = typeof window.matchMedia === 'function' ? window.matchMedia('(pointer: coarse)') : null;
    const fineQuery = typeof window.matchMedia === 'function' ? window.matchMedia('(pointer: fine)') : null;

    if (coarseQuery?.addEventListener) {
      coarseQuery.addEventListener('change', updateDeviceInfo);
      fineQuery?.addEventListener('change', updateDeviceInfo);
    }

    return () => {
      if (coarseQuery?.removeEventListener) {
        coarseQuery.removeEventListener('change', updateDeviceInfo);
        fineQuery?.removeEventListener('change', updateDeviceInfo);
      }
    };
  }, []);

  const setInputMode = useCallback((newMode) => {
    setMode(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {}
  }, []);

  const toggleVirtualKeyboard = useCallback(() => {
    setInputMode((prev) => {
      if (prev === 'AUTO') return 'ALWAYS_ON';
      if (prev === 'ALWAYS_ON') return 'OFF';
      return 'AUTO';
    });
  }, [setInputMode]);

  // Determine whether virtual keyboard should be visible
  const showVirtualKeyboard = (() => {
    if (mode === 'ALWAYS_ON') return true;
    if (mode === 'OFF') return false;
    // 'AUTO' mode:
    // If device is touch-capable AND (not fine pointer OR screen is mobile/tablet size <= 1024px), show keyboard
    // If device is a standard desktop/laptop workstation with mouse/keyboard, hide virtual keyboard
    if (isTouch) {
      // If it has touch and no mouse pointer, definitely show
      if (!hasFinePointer) return true;
      // If it's a mobile/tablet touch device width, show
      if (typeof window !== 'undefined' && window.innerWidth <= 1024) return true;
    }
    return false;
  })();

  return {
    isTouchDevice: isTouch,
    hasFinePointer,
    inputMode: mode,
    showVirtualKeyboard,
    setInputMode,
    toggleVirtualKeyboard
  };
}
