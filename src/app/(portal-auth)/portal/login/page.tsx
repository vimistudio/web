import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/portal/login-form";

export default async function LoginPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/portal");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0f1a] px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <Image
            src="/logo-vimi.png"
            alt="Vimi Studio"
            width={60}
            height={60}
            className="h-14 w-auto"
          />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-white">
            Welcome to your studio
          </h2>
          <p className="text-sm text-gray-400">
            Sign in to manage your projects, track progress, and explore
            deliverables.
          </p>
        </div>

        <LoginForm />

        <p className="text-center text-xs text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
