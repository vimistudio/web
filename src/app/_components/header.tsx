"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();

  return (
    <motion.header
      className="sticky top-0 z-10 bg-[#fbfafa] shadow-sm"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/vimistudio-logo-LWRIbdkb53uyy1SNL8LDs5bfAQ9WlM.svg"
            alt="Vimi Studio Logo"
            width={150}
            height={48}
            className="h-8 sm:h-12 w-auto"
            priority
          />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-[#111111] hover:text-[#777EF0] transition-colors"
          >
            Home
          </Link>
          <Link
            href="/how-it-works"
            className="text-[#111111] hover:text-[#777EF0] transition-colors"
          >
            How it works
          </Link>
          <Link
            href="/what-we-do"
            className="text-[#111111] hover:text-[#777EF0] transition-colors"
          >
            What we do
          </Link>
        </div>

        <Button
          className="bg-[#111111] text-white hover:bg-[#403696] transition-colors rounded-full px-4 sm:px-6 text-sm sm:text-base"
          onClick={() => router.push("/start-project")}
        >
          Start A Project
        </Button>
      </nav>
    </motion.header>
  );
}
