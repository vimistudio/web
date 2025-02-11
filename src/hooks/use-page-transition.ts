import { useRouter } from "next/navigation";
import { useState } from "react";
import { TransitionAnimation } from "@/lib/transition-animation";

interface PageTransitionOptions {
  duration?: number;
  delay?: number;
  navbarHeight?: number;
}

export function usePageTransition(options: PageTransitionOptions = {}) {
  const { duration = 600, delay = 200, navbarHeight = 80 } = options;

  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const createTransition = async (path: string) => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    try {
      // Wait for button press animation
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Create and run animation
      const transition = new TransitionAnimation({ duration, navbarHeight });
      await transition.animate();

      // Navigate to the new page
      router.push(path);
    } catch (error) {
      console.error("Transition failed:", error);
      router.push(path);
    } finally {
      setIsTransitioning(false);
    }
  };

  return {
    isTransitioning,
    createTransition,
  };
}
