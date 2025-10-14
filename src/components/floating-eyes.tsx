"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
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
  const [clickedEye, setClickedEye] = useState<number | null>(null);
  const eyeRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Initialize eye positions
  useEffect(() => {
    const eyeImages = ["/eyes/eye-1.svg", "/eyes/eye-2.png", "/eyes/eye-3.png"];

    const initialEyes = eyeImages.map((src, index) => ({
      id: index,
      src,
      x: Math.random() * 80 + 10, // 10-90% of screen width
      y: Math.random() * 80 + 10, // 10-90% of screen height
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

  // Handle eye click/tap
  const handleEyeClick = (id: number) => {
    setClickedEye(id);
    setTimeout(() => setClickedEye(null), 600);
  };

  // Calculate pupil position based on cursor
  const calculatePupilOffset = (eyeIndex: number) => {
    const eyeRef = eyeRefs.current[eyeIndex];
    if (!eyeRef) return { x: 0, y: 0 };

    const eyeRect = eyeRef.getBoundingClientRect();
    const eyeCenterX = eyeRect.left + eyeRect.width / 2;
    const eyeCenterY = eyeRect.top + eyeRect.height / 2;

    const angle = Math.atan2(mousePos.y - eyeCenterY, mousePos.x - eyeCenterX);

    const distance = 8; // Max pupil movement distance
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    };
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {eyes.map((eye, index) => {
        const pupilOffset = calculatePupilOffset(index);
        const isClicked = clickedEye === eye.id;

        return (
          <motion.div
            key={eye.id}
            ref={(el) => {
              eyeRefs.current[index] = el;
            }}
            className="absolute pointer-events-auto cursor-pointer"
            style={{
              left: `${eye.x}%`,
              top: `${eye.y}%`,
            }}
            initial={{ scale: 0, rotate: eye.rotation }}
            animate={{
              scale: isClicked ? [1, 1.3, 0.9, 1.1, 1] : 1,
              rotate: isClicked
                ? [eye.rotation, eye.rotation + 360]
                : [
                    eye.rotation,
                    eye.rotation + 5,
                    eye.rotation - 5,
                    eye.rotation,
                  ],
              y: isClicked ? [0, -20, 0] : [0, -10, 0],
            }}
            transition={{
              scale: { duration: 0.6 },
              rotate: isClicked
                ? { duration: 0.6 }
                : { duration: 4, repeat: Infinity, ease: "easeInOut" },
              y: isClicked
                ? { duration: 0.6 }
                : { duration: 3, repeat: Infinity, ease: "easeInOut" },
            }}
            onClick={() => handleEyeClick(eye.id)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20">
              <Image
                src={eye.src}
                alt={`Eye ${eye.id + 1}`}
                fill
                className="object-contain"
                priority
              />

              {/* Pupil that follows cursor */}
              <motion.div
                className="absolute top-1/2 left-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-black rounded-full -translate-x-1/2 -translate-y-1/2"
                animate={{
                  x: pupilOffset.x,
                  y: pupilOffset.y,
                }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
