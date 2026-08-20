"use client";

import React, { useEffect, useRef } from "react";
import { sound } from "@/lib/soundFx";

interface LuckyWheelCanvasProps {
  isSpinning: boolean;
  targetAngle: number;
  onSpinComplete: (landedIndex: number) => void;
  segments: number[];
}

export const LuckyWheelCanvas: React.FC<LuckyWheelCanvasProps> = ({
  isSpinning,
  targetAngle,
  onSpinComplete,
  segments,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentAngleRef = useRef(0);
  const angularVelocityRef = useRef(0);
  const lastTickIndexRef = useRef(-1);

  useEffect(() => {
    if (isSpinning) {
      // Set initial high-speed spin velocity
      angularVelocityRef.current = 0.35 + Math.random() * 0.15;
    }
  }, [isSpinning]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const numSegments = segments.length;
    const arcSize = (Math.PI * 2) / numSegments;

    const render = () => {
      time += 0.03;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Cosmic Void Background
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.6);
      bgGrad.addColorStop(0, "#110b24");
      bgGrad.addColorStop(0.6, "#070512");
      bgGrad.addColorStop(1, "#030208");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Physics Deceleration
      if (isSpinning && angularVelocityRef.current > 0.001) {
        currentAngleRef.current += angularVelocityRef.current;
        angularVelocityRef.current *= 0.985; // Smooth ease-out friction

        // Tick sound on peg crossing
        const normalizedAngle = (currentAngleRef.current % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const currentPeg = Math.floor(normalizedAngle / arcSize);
        if (currentPeg !== lastTickIndexRef.current) {
          lastTickIndexRef.current = currentPeg;
          sound.playRouletteTick();
        }

        if (angularVelocityRef.current <= 0.001) {
          angularVelocityRef.current = 0;
          // Calculate landed segment
          const finalAngle = (Math.PI * 1.5 - currentAngleRef.current) % (Math.PI * 2);
          const positiveAngle = (finalAngle + Math.PI * 2) % (Math.PI * 2);
          const landedIdx = Math.floor(positiveAngle / arcSize);
          onSpinComplete(landedIdx);
        }
      }

      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.42;

      // 3. Outer Neon Chase Lights Ring
      ctx.save();
      ctx.translate(centerX, centerY);

      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 6;
      ctx.shadowColor = "#c084fc";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 4. Draw Rotating Wheel Segments
      ctx.rotate(currentAngleRef.current);

      segments.forEach((mult, idx) => {
        const startAngle = idx * arcSize;
        const endAngle = startAngle + arcSize;

        // Color based on Multiplier
        let segColor = "#1e1b4b"; // Indigo
        if (mult >= 50) segColor = "#e11d48"; // Ruby Jackpot
        else if (mult >= 20) segColor = "#f59e0b"; // Gold
        else if (mult >= 5) segColor = "#8b5cf6"; // Purple
        else if (mult >= 2) segColor = "#0284c7"; // Cyan
        else segColor = idx % 2 === 0 ? "#1e293b" : "#0f172a";

        ctx.fillStyle = segColor;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Peg Pins on Outer Perimeter
        const pegX = Math.cos(startAngle) * (radius - 2);
        const pegY = Math.sin(startAngle) * (radius - 2);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(pegX, pegY, 3, 0, Math.PI * 2);
        ctx.fill();

        // Segment Multiplier Text
        ctx.save();
        ctx.rotate(startAngle + arcSize / 2);
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${radius * 0.09}px monospace`;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(`${mult}x`, radius * 0.85, 0);
        ctx.restore();
      });

      // 5. Central Glowing Hub
      ctx.fillStyle = "#0f172a";
      ctx.shadowColor = "#a855f7";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#f59e0b";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("👑", 0, 0);

      ctx.restore();

      // 6. Top Indicator Pointer Arrow (Fixed at 12 O'Clock)
      ctx.save();
      ctx.translate(centerX, centerY - radius - 8);

      ctx.fillStyle = "#f59e0b";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.lineTo(-12, -8);
      ctx.lineTo(12, -8);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isSpinning, targetAngle, onSpinComplete, segments]);

  return (
    <div className="relative w-full h-full min-h-[380px] md:min-h-[460px] flex items-center justify-center overflow-hidden rounded-3xl bg-[#030208] border border-purple-500/20 shadow-2xl">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
};
