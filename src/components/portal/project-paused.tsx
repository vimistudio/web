"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface ProjectPausedProps {
  clientName: string;
  pausedUntil?: string | null;
  reasonShownToClient?: string | null; // pre-formatted human-readable text, admin's call
  contactEmail?: string;
}

const REASON_LABELS_EN: Record<string, string> = {
  billing: "Billing on hold",
  client_on_hold: "On hold from your side",
  scope_paused: "Scope paused",
  studio_on_hold: "Studio on hold",
  other: "Paused",
};

/**
 * Shown to a client member when their project's `is_active` is false.
 *
 * Designed for warmth + reassurance. UX laws applied:
 *  - Loss Aversion: lead with "your work is safe" — dampens panic
 *  - Framing: "paused" not "suspended"; soft language
 *  - Jakob's Law: matches Stripe/Substack/Netflix paused-account patterns
 *  - Zeigarnik: resume date (if set) creates a pleasant mental bookmark
 *  - Serial Position: reassurance first, contact path last
 */
export function ProjectPaused({
  clientName,
  pausedUntil,
  reasonShownToClient,
  contactEmail = "hello@vimistudio.com",
}: ProjectPausedProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/portal/login");
  };

  const formattedResume = pausedUntil
    ? new Date(pausedUntil).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const reasonLabel = reasonShownToClient
    ? REASON_LABELS_EN[reasonShownToClient] || reasonShownToClient
    : null;

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0b14]">
      <div className="absolute inset-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#909af7]/15 rounded-full blur-[128px]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#909af7]/10 rounded-full blur-[128px]" />
      </div>

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-10">
          <div className="flex justify-center">
            <Image
              src="/vimi-logo-light.svg"
              alt="Vimi Studio"
              width={180}
              height={58}
              className="h-10 w-auto"
            />
          </div>

          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 space-y-6 shadow-2xl shadow-black/20">
            {/* Pause icon — muted, not alarming */}
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-[#909af7]"
                  aria-hidden="true"
                >
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              </div>
            </div>

            <div className="space-y-3 text-center">
              <h1 className="text-xl font-semibold text-white">
                {clientName} is paused right now
              </h1>
              {/* Loss Aversion lead — reassurance about data safety */}
              <p className="text-sm text-[#a8acd0] leading-relaxed">
                Your work — designs, comments, and files — is safe and
                waiting for you. We&apos;ll let you know as soon as we resume.
              </p>
            </div>

            {/* Reason (if admin chose to share) + resume date — Zeigarnik bookmark */}
            {(reasonLabel || formattedResume) && (
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                {reasonLabel && (
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-[#6B6F99]">Reason</span>
                    <span className="text-white">{reasonLabel}</span>
                  </div>
                )}
                {formattedResume && (
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-[#6B6F99]">Resumes</span>
                    <span className="text-white">{formattedResume}</span>
                  </div>
                )}
              </div>
            )}

            {/* Contact path — Serial Position last-position */}
            <div className="space-y-2 text-center pt-2 border-t border-white/[0.06]">
              <p className="text-[11px] text-[#6B6F99]">
                Questions or want to resume earlier?
              </p>
              <a
                href={`mailto:${contactEmail}`}
                className="inline-block text-sm text-[#909af7] hover:text-[#a5aef9] transition-colors"
              >
                {contactEmail}
              </a>
            </div>

            <Button
              onClick={handleSignOut}
              className="w-full h-11 bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] text-white rounded-xl font-medium text-sm"
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
