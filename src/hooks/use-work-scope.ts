"use client";

import { useCallback, useSyncExternalStore } from "react";

// "My work" scope: admins can focus on what's theirs (assigned to them, plus
// anything unassigned so nothing falls through the cracks) vs. everyone's work.
// Persisted to localStorage and synced across every mounted instance (and tabs),
// so the queue pill and the dashboard strip share one setting. Default "mine".
const KEY = "vimi_work_scope";

export type WorkScope = "mine" | "everyone";

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

function getSnapshot(): WorkScope {
  if (typeof window === "undefined") return "mine";
  return window.localStorage.getItem(KEY) === "everyone" ? "everyone" : "mine";
}

function getServerSnapshot(): WorkScope {
  return "mine";
}

export function useWorkScope() {
  const scope = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setScope = useCallback((value: WorkScope) => {
    window.localStorage.setItem(KEY, value);
    emit();
  }, []);

  const toggle = useCallback(() => {
    setScope(getSnapshot() === "mine" ? "everyone" : "mine");
  }, [setScope]);

  return { scope, setScope, toggle };
}
