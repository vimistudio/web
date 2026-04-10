import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/portal/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(searchParams.next ?? "/portal");
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0b14]">
      {/* Background gradient effects */}
      <div className="absolute inset-0">
        {/* Top-right purple glow */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#909af7]/20 rounded-full blur-[128px]" />
        {/* Bottom-left subtle glow */}
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#909af7]/10 rounded-full blur-[128px]" />
        {/* Center mesh gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#909af7]/5 rounded-full blur-[200px]" />
      </div>

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-10">
          {/* Logo */}
          <div className="flex justify-center">
            <Image
              src="/vimi-logo-light.svg"
              alt="Vimi Studio"
              width={180}
              height={58}
              className="h-10 w-auto"
              priority
            />
          </div>

          {/* Card */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-8 space-y-8 shadow-2xl shadow-black/20">
            <div className="text-center space-y-2">
              <h1 className="text-xl font-semibold text-white tracking-tight">
                Welcome to your studio
              </h1>
              <p className="text-sm text-[#6B6F99]">
                Sign in to see your designs and collaborate with your studio
              </p>
            </div>

            <LoginForm error={searchParams.error} next={searchParams.next} />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/[0.06]" />
              </div>
            </div>

            <p className="text-center text-[11px] text-[#4a4d66] leading-relaxed">
              Invite-only access. Your studio will set up your account.
              <br />
              By signing in, you agree to our{" "}
              <span className="text-[#6B6F99] hover:text-[#909af7] cursor-pointer">
                Terms
              </span>{" "}
              and{" "}
              <span className="text-[#6B6F99] hover:text-[#909af7] cursor-pointer">
                Privacy Policy
              </span>
              .
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] text-[#2a2d46]">
            &copy; {new Date().getFullYear()} Vimi Studio
          </p>
        </div>
      </div>
    </div>
  );
}
