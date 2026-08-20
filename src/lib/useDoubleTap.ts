import { useRef } from 'react';

const DOUBLE_TAP_DELAY_MS = 300;

/** Returns an onPress handler: fires onSingleTap immediately, or onDoubleTap instead if a second
 * tap lands within DOUBLE_TAP_DELAY_MS (used for the transactions list's tap/double-tap/long-press trio). */
export function useDoubleTap(onSingleTap: () => void, onDoubleTap: () => void) {
  const lastTapRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return () => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY_MS) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      lastTapRef.current = 0;
      onDoubleTap();
      return;
    }
    lastTapRef.current = now;
    timeoutRef.current = setTimeout(() => {
      onSingleTap();
    }, DOUBLE_TAP_DELAY_MS);
  };
}
