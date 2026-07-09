"use client";

import { useCallback, useSyncExternalStore } from "react";

// Screen-share privacy: admins can mask all money amounts in admin surfaces as
// "•••". Persisted to localStorage and synced across every mounted instance
// (and across tabs) so one toggle flips the whole admin UI at once.
const KEY = "vimi_hide_prices";
export const PRICE_MASK = "•••";

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (typeof window !== "undefined") window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("storage", cb);
  };
}

function getSnapshot() {
  if (typeof window === "undefined") return false;
  // Safe-by-default for screen-share: with no stored preference, prices start
  // HIDDEN. Only an explicit reveal (persisted as "false") unmasks them.
  const stored = window.localStorage.getItem(KEY);
  return stored === null ? true : stored === "true";
}

function getServerSnapshot() {
  return false;
}

export function usePricePrivacy() {
  const hidden = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setHidden = useCallback((value: boolean) => {
    window.localStorage.setItem(KEY, String(value));
    emit();
  }, []);

  const toggle = useCallback(() => {
    setHidden(!getSnapshot());
  }, [setHidden]);

  return { hidden, setHidden, toggle };
}

/** Return the price string, or the mask when prices are hidden. */
export function maskPrice(text: string, hidden: boolean) {
  return hidden ? PRICE_MASK : text;
}
