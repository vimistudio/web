import Image from "next/image";

/**
 * Transitional state shown when a user has just been invited and we're
 * waiting for the link-up to commit. Auto-refreshes after a short delay.
 *
 * This replaces what would otherwise be a NoAccess flash for users in the
 * middle of being claimed (e.g. invite was just sent, race between trigger
 * + claim_invite + profile read).
 */
export function LinkingAccount() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0b14]">
      {/* Auto-refresh after 1.5s — gives the DB a beat to commit then reloads
          the layout, which now sees the freshly-linked profile and renders
          the portal. */}
      <meta httpEquiv="refresh" content="1.5" />

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

          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 space-y-6 shadow-2xl shadow-black/20 text-center">
            {/* Pulsing dot animation — minimal, brand-coloured */}
            <div className="flex items-center justify-center gap-1.5 h-6">
              <span className="w-2 h-2 rounded-full bg-[#909af7] animate-pulse" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-[#909af7] animate-pulse" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-[#909af7] animate-pulse" style={{ animationDelay: "300ms" }} />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-white">
                Welcome — getting your project ready…
              </h1>
              <p className="text-sm text-[#6B6F99] leading-relaxed">
                Linking your account to your design portal. This usually takes a second.
              </p>
            </div>

            <p className="text-[11px] text-[#6B6F99]/60">
              Still here after a few seconds? Refresh the page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
