"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import Image from "next/image";

interface Eye {
  id: number;
  src: string;
  x: number;
  y: number;
  rotation: number;
}

export function FloatingEyes() {
  const [eyes, setEyes] = useState<Eye[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const eyeRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Initialize eye positions
  useEffect(() => {
    const eyeImages = ["/eyes/eye-1.svg", "/eyes/eye-2.png", "/eyes/eye-3.png"];

    const initialEyes = eyeImages.map((src, index) => ({
      id: index,
      src,
      x: 20 + index * 30, // Space them out horizontally
      y: 30 + (index % 2) * 20, // Slight vertical variation
      rotation: Math.random() * 360,
    }));

    setEyes(initialEyes);
  }, []);

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Calculate repel offset based on mouse distance
  const calculateRepelOffset = (eyeIndex: number) => {
    const eyeRef = eyeRefs.current[eyeIndex];
    if (!eyeRef) return { x: 0, y: 0 };

    const eyeRect = eyeRef.getBoundingClientRect();
    const eyeCenterX = eyeRect.left + eyeRect.width / 2;
    const eyeCenterY = eyeRect.top + eyeRect.height / 2;

    const deltaX = eyeCenterX - mousePos.x;
    const deltaY = eyeCenterY - mousePos.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Repel if mouse is within 200px
    const repelRadius = 200;
    if (distance < repelRadius && distance > 0) {
      const force = (repelRadius - distance) / repelRadius;
      return {
        x: (deltaX / distance) * force * 80, // Push away
        y: (deltaY / distance) * force * 80,
      };
    }

    return { x: 0, y: 0 };
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {eyes.map((eye, index) => {
        const repelOffset = calculateRepelOffset(index);

        return (
          <motion.div
            key={eye.id}
            ref={(el) => {
              eyeRefs.current[index] = el;
            }}
            className="absolute"
            style={{
              left: `${eye.x}%`,
              top: `${eye.y}%`,
            }}
            initial={{ scale: 0, opacity: 0, rotate: eye.rotation }}
            animate={{
              scale: 1,
              opacity: 0.7,
              rotate: [
                eye.rotation,
                eye.rotation + 10,
                eye.rotation - 10,
                eye.rotation,
              ],
              x: repelOffset.x,
              y: repelOffset.y,
            }}
            transition={{
              scale: { duration: 0.8, delay: index * 0.2 },
              opacity: { duration: 0.8, delay: index * 0.2 },
              rotate: {
                duration: 8 + index * 2,
                repeat: Infinity,
                ease: "easeInOut",
              },
              x: { type: "spring", stiffness: 50, damping: 20 },
              y: { type: "spring", stiffness: 50, damping: 20 },
            }}
          >
            {/* Space gliding animation wrapper */}
            <motion.div
              animate={{
                x: [0, 30, -20, 0],
                y: [0, -40, 30, 0],
              }}
              transition={{
                duration: 20 + index * 5,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28">
                <Image
                  src={eye.src}
                  alt={`Eye ${eye.id + 1}`}
                  fill
                  className="object-contain filter drop-shadow-lg"
                  priority
                />
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}
