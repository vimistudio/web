import { useRouter } from "next/navigation";
import { useState } from "react";

interface PageTransitionOptions {
  duration?: number;
  delay?: number;
  navbarHeight?: number;
}

export function usePageTransition(options: PageTransitionOptions = {}) {
  const {
    duration = 600,
    delay = 200,
    navbarHeight = 80
  } = options;
  
  const router = useRouter();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const createTransition = async (path: string) => {
    setIsTransitioning(true);
    
    // Wait for button press animation
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Create a container for the sliding effect
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = `${navbarHeight}px`;
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = `calc(100% - ${navbarHeight}px)`;
    container.style.pointerEvents = 'none';
    container.style.zIndex = '100';
    document.body.appendChild(container);

    // Create the sliding element
    const slider = document.createElement('div');
    slider.style.position = 'absolute';
    slider.style.top = '0';
    slider.style.right = '0';
    slider.style.width = '100%';
    slider.style.height = '100%';
    slider.style.backgroundColor = '#fbfafa';
    slider.style.transform = 'translateX(100%)';
    slider.style.transition = `transform ${duration/1000}s cubic-bezier(0.65, 0, 0.35, 1)`;
    container.appendChild(slider);

    // Trigger the slide animation
    requestAnimationFrame(() => {
      slider.style.transform = 'translateX(0%)';
    });

    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, duration/2));

    // Navigate to the next page
    router.push(path);

    // Clean up the animation elements
    setTimeout(() => {
      container.remove();
    }, 100);
  };

  return {
    isTransitioning,
    createTransition
  };
}
