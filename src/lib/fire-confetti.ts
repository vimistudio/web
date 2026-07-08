/**
 * Shared confetti helper (Peak-End rule) that respects the user's
 * prefers-reduced-motion setting. All portal confetti should route through
 * this so reduced-motion users get no bursts, and we import canvas-confetti
 * lazily to keep it out of the initial bundle.
 */
type ConfettiOptions = {
  particleCount?: number;
  angle?: number;
  spread?: number;
  startVelocity?: number;
  origin?: { x?: number; y?: number };
  colors?: string[];
  scalar?: number;
  zIndex?: number;
};

const VIMI_CONFETTI_COLORS = [
  "#5B4BD6",
  "#DA5B34",
  "#2E8B57",
  "#C9821B",
  "#B03A5B",
];

export async function fireConfetti(options?: ConfettiOptions) {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  try {
    const confetti = (await import("canvas-confetti")).default;
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.7 },
      colors: VIMI_CONFETTI_COLORS,
      ...options,
    });
    if ("vibrate" in navigator) {
      (navigator as Navigator & { vibrate?: (ms: number) => void }).vibrate?.(50);
    }
  } catch {
    /* confetti is non-critical; ignore load/runtime errors */
  }
}
