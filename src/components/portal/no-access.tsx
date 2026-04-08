"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function NoAccess() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/portal/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0f1a] px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <Image
          src="/logo-vimi.png"
          alt="Vimi Studio"
          width={60}
          height={60}
          className="h-14 w-auto mx-auto"
        />

        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-white">
            You don&apos;t have access yet
          </h1>
          <p className="text-sm text-gray-400">
            This portal is invite-only. If you&apos;re a Vimi Studio client,
            contact your studio to get set up.
          </p>
        </div>

        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full rounded-full border-gray-700 text-gray-300 bg-transparent hover:bg-gray-800/50"
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
