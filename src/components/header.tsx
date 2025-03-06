"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import { LanguageToggle } from "./language-toggle";

export function Header() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <motion.header
      className="sticky top-0 z-10 bg-[var(--bg-color)] shadow-sm"
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <nav className="container mx-auto px-4 py-2 sm:py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/vimistudio-logo-LWRIbdkb53uyy1SNL8LDs5bfAQ9WlM.svg"
            alt="Vimi Studio Logo"
            width={150}
            height={48}
            className="h-6 sm:h-8 md:h-12 w-auto"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-[#111111] hover:text-[hsl(var(--primary-accent))] transition-colors"
          >
            {t("home")}
          </Link>
          <Link
            href="/how-it-works"
            className="text-[#111111] hover:text-[hsl(var(--primary-accent))] transition-colors"
          >
            {t("howItWorks")}
          </Link>
          <Link
            href="/what-we-do"
            className="text-[#111111] hover:text-[hsl(var(--primary-accent))] transition-colors"
          >
            {t("whatWeDo")}
          </Link>

          {/* Language toggle */}
          <LanguageToggle />
        </div>

        {/* Mobile elements: Language toggle and CTA button */}
        <div className="md:hidden flex items-center gap-3">
          <LanguageToggle />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              className="bg-[#111111] text-white hover:bg-[hsl(var(--primary-accent))] transition-colors rounded-full px-3 py-1.5 text-xs"
              onClick={() => router.push("/start-project")}
            >
              {t("startProject")}
            </Button>
          </motion.div>
        </div>

        {/* Desktop CTA button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="hidden md:block"
        >
          <Button
            className="bg-[#111111] text-white hover:bg-[hsl(var(--primary-accent))] transition-colors rounded-full px-4 sm:px-6 text-sm sm:text-base"
            onClick={() => router.push("/start-project")}
          >
            {t("startProject")}
          </Button>
        </motion.div>
      </nav>
    </motion.header>
  );
}
