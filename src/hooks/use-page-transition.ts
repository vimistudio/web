import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { TransitionAnimation } from "@/lib/transition-animation";

interface PageTransitionOptions {
  duration?: number;
  delay?: number;
  navbarHeight?: number;
}

export function usePageTransition(options: PageTransitionOptions = {}) {
  const {
    duration = 400, // Reduced duration for smoother feel
    delay = 100,    // Reduced delay for more immediate response
    navbarHeight = 80
  } = options;
  
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const createTransition = useCallback(async (path: string) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    try {
      const transition = new TransitionAnimation({ duration, navbarHeight });
      
      // Shorter delay for button press feedback
      await new Promise(resolve => setTimeout(resolve, delay));

      // Run animation and navigation concurrently
      await Promise.all([
        transition.animate(),
        new Promise(resolve => setTimeout(resolve, duration/2))
          .then(() => router.push(path))
      ]);
      
    } catch (error) {
      console.error('Transition failed:', error);
      router.push(path);
    } finally {
      setIsTransitioning(false);
    }
  }, [duration, delay, navbarHeight, router, isTransitioning]);

  return {
    isTransitioning,
    createTransition
  };
}
