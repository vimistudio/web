"use client";

import { useEffect } from "react";

export function SetLastVisited() {
  useEffect(() => {
    document.cookie = `portal_last_visited=${new Date().toISOString()};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax;Secure`;
  }, []);

  return null;
}
