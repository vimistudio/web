"use client";

import { useRouter } from "next/navigation";
import { Cancel01Icon } from "@/components/ui/icons";

interface ImpersonateBannerProps {
  clientName: string;
}

export function ImpersonateBanner({ clientName }: ImpersonateBannerProps) {
  const router = useRouter();

  const handleExit = () => {
    document.cookie =
      "impersonate_client=; path=/; max-age=0";
    router.push("/portal/admin");
    router.refresh();
  };

  return (
    <div className="bg-amber-500 text-black text-center py-1.5 px-4 text-sm font-medium flex items-center justify-center gap-3 z-50">
      <span>
        Viewing as client &mdash; {clientName}
      </span>
      <button
        onClick={handleExit}
        className="flex items-center gap-1 bg-black/10 hover:bg-black/20 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors"
      >
        <Cancel01Icon size={12} />
        Exit
      </button>
    </div>
  );
}
