"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { t, type Locale } from "@/lib/portal-i18n";

export function NoAccess({ locale = "en" }: { locale?: Locale }) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/portal/login");
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0b14]">
      {/* Background gradient effects */}
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
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-white">
                {t("gate.noAccess.title", locale)}
              </h1>
              <p className="text-sm text-[#6B6F99] leading-relaxed">
                {t("gate.noAccess.body", locale)}
              </p>
              <a
                href="mailto:hello@vimistudio.com"
                className="inline-block text-sm text-[#909af7] hover:text-[#a5aef9] transition-colors"
              >
                hello@vimistudio.com
              </a>
            </div>

            <Button
              onClick={handleSignOut}
              className="w-full h-11 bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] text-white rounded-xl font-medium text-sm"
            >
              {t("profile.signOut", locale)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
