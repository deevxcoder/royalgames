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
  const pointerFlickRef = useRef(0);

  useEffect(() => {
    if (isSpinning) {
      // Set initial high-speed spin velocity
      angularVelocityRef.current = 0.38 + Math.random() * 0.12;
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

      // 1. Cosmic Velvet Background
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.6);
      bgGrad.addColorStop(0, "#150d2e");
      bgGrad.addColorStop(0.6, "#090517");
      bgGrad.addColorStop(1, "#04020a");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Physics Deceleration
      if (isSpinning && angularVelocityRef.current > 0.0008) {
        currentAngleRef.current += angularVelocityRef.current;
        angularVelocityRef.current *= 0.986; // Smooth ease-out deceleration

        // Peg Tick Collision
        const normalizedAngle = (currentAngleRef.current % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const currentPeg = Math.floor(normalizedAngle / arcSize);
        if (currentPeg !== lastTickIndexRef.current) {
          lastTickIndexRef.current = currentPeg;
          pointerFlickRef.current = 1.0;
          sound.playRouletteTick();
        }

        if (angularVelocityRef.current <= 0.0008) {
          angularVelocityRef.current = 0;
          // Calculate landed segment at top 12 o'clock pointer position
          const finalAngle = (Math.PI * 1.5 - currentAngleRef.current) % (Math.PI * 2);
          const positiveAngle = (finalAngle + Math.PI * 2) % (Math.PI * 2);
          const landedIdx = Math.floor(positiveAngle / arcSize);
          onSpinComplete(landedIdx);
        }
      }

      if (pointerFlickRef.current > 0) {
        pointerFlickRef.current = Math.max(0, pointerFlickRef.current - 0.12);
      }

      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.43;

      // 3. Outer Golden Rim with Chasing LED Lights
      ctx.save();
      ctx.translate(centerX, centerY);

      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 8;
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Chasing LED Bulbs
      const totalBulbs = 24;
      for (let b = 0; b < totalBulbs; b++) {
        const bulbAngle = (b / totalBulbs) * Math.PI * 2 + time * 1.5;
        const bx = Math.cos(bulbAngle) * (radius + 8);
        const by = Math.sin(bulbAngle) * (radius + 8);
        ctx.fillStyle = b % 2 === 0 ? "#ffffff" : "#fbbf24";
        ctx.beginPath();
        ctx.arc(bx, by, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Draw Rotating Wheel Segments
      ctx.rotate(currentAngleRef.current);

      segments.forEach((mult, idx) => {
        const startAngle = idx * arcSize;
        const endAngle = startAngle + arcSize;

        // Color based on Multiplier
        let segColor = "#1e1b4b"; // Standard Blue/Indigo
        let textColor = "#ffffff";

        if (mult === 0) {
          segColor = "#3f0a14"; // Crimson Loss/Miss
          textColor = "#fb7185";
        } else if (mult >= 100) {
          segColor = "#b91c1c"; // Grand 100x Royal Ruby Red
          textColor = "#fde047";
        } else if (mult >= 50) {
          segColor = "#ea580c"; // Fiery Orange
          textColor = "#ffffff";
        } else if (mult >= 20) {
          segColor = "#d97706"; // Amber
          textColor = "#ffffff";
        } else if (mult >= 5) {
          segColor = "#ca8a04"; // Gold
          textColor = "#ffffff";
        } else if (mult >= 2) {
          segColor = "#059669"; // Emerald
          textColor = "#ffffff";
        } else {
          segColor = idx % 2 === 0 ? "#1e293b" : "#0f172a";
        }

        ctx.fillStyle = segColor;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = mult >= 100 ? "#fde047" : "rgba(255, 255, 255, 0.12)";
        ctx.lineWidth = mult >= 100 ? 2.5 : 1.5;
        ctx.stroke();

        // Peg Pins on Outer Rim
        const pegX = Math.cos(startAngle) * (radius - 2);
        const pegY = Math.sin(startAngle) * (radius - 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = mult >= 100 ? "#f59e0b" : "#38bdf8";
        ctx.shadowBlur = mult >= 100 ? 8 : 4;
        ctx.beginPath();
        ctx.arc(pegX, pegY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Text Multiplier Label inside slice
        ctx.save();
        ctx.rotate(startAngle + arcSize / 2);
        ctx.fillStyle = textColor;
        if (mult >= 100) {
          ctx.font = `black ${radius > 140 ? "13px" : "11px"} monospace`;
          ctx.fillText(`👑100x`, radius - 14, 0);
        } else {
          ctx.font = `bold ${radius > 140 ? "13px" : "11px"} monospace`;
          ctx.fillText(mult === 0 ? "0x" : `${mult}x`, radius - 16, 0);
        }
        ctx.restore();
      });

      // 5. Center Golden Hub & Logo Cap
      ctx.restore(); // Exit rotation

      ctx.save();
      ctx.translate(centerX, centerY);

      // Outer Hub Rim
      ctx.fillStyle = "#1e1b4b";
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 4;
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Center Crown Emblem
      ctx.fillStyle = "#fbbf24";
      ctx.font = `bold ${Math.round(radius * 0.12)}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("👑", 0, 1);

      ctx.restore();

      // 6. Top Mechanical Indicator Pointer (At 12 o'clock)
      ctx.save();
      ctx.translate(centerX, centerY - radius - 6);

      const flickAngle = pointerFlickRef.current * 0.25;
      ctx.rotate(flickAngle);

      ctx.fillStyle = "#f43f5e";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#f43f5e";
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.moveTo(0, 18);
      ctx.lineTo(-12, -8);
      ctx.lineTo(12, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pointer Pin Pivot
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, -6, 3.5, 0, Math.PI * 2);
      ctx.fill();

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
    <div className="relative w-full h-full min-h-[260px] sm:min-h-[320px] md:min-h-[390px] flex items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl bg-[#04020a] border border-purple-500/25 shadow-2xl">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Top Status Header Badge */}
      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-1.5 bg-[#0b0718]/85 backdrop-blur-md border border-purple-500/30 px-2.5 py-1 rounded-full z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
        <span className="text-[9px] sm:text-[10px] font-black text-purple-300 font-mono tracking-wider uppercase">
          LUCKY WHEEL • 97.0% RTP
        </span>
      </div>

      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[#0b0718]/85 backdrop-blur-md border border-amber-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1.5 z-10">
        <span className="text-[8px] sm:text-[9px] uppercase font-bold text-gray-400">Jackpot:</span>
        <span className="text-xs sm:text-sm font-black font-mono text-amber-400">
          {Math.max(...segments)}x
        </span>
      </div>
    </div>
  );
};
