import { useEffect, useRef, useCallback } from 'react';

/**
 * useIdleTimer
 * Detects user inactivity and executes callback after timeout.
 * Default timeout is 5 minutes (300,000 ms).
 */
export function useIdleTimer({
  timeoutMs = 5 * 60 * 1000,
  onIdle,
  enabled = true
}) {
  const timerRef = useRef(null);
  const onIdleRef = useRef(onIdle);

  useEffect(() => {
    onIdleRef.current = onIdle;
  }, [onIdle]);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      if (onIdleRef.current) {
        onIdleRef.current();
      }
    }, timeoutMs);
  }, [enabled, timeoutMs]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    
    // Throttle event listeners to reduce CPU usage
    let lastReset = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastReset > 1000) {
        lastReset = now;
        resetTimer();
      }
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Start initial timer
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [enabled, resetTimer]);

  return { resetTimer };
}
