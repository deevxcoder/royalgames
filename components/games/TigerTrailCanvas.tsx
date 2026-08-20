"use client";

import React, { useEffect, useRef } from "react";

interface TigerTrailCanvasProps {
  currentStep: number;
  isGameOver: boolean;
  isWinner: boolean;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "EXTREME";
  stepsMultipliers: number[];
}

export const TigerTrailCanvas: React.FC<TigerTrailCanvasProps> = ({
  currentStep,
  isGameOver,
  isWinner,
  difficulty,
  stepsMultipliers,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tiger state for smooth animation
  const tigerPosRef = useRef({ x: 60, y: 300, targetX: 60, targetY: 300, jumpProgress: 1, jumpHeight: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Fireflies / Jungle Particles
    const fireflies: Array<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number; pulse: number }> = [];
    for (let i = 0; i < 35; i++) {
      fireflies.push({
        x: Math.random() * 900,
        y: Math.random() * 500,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 0.4 - 0.1,
        size: Math.random() * 2.5 + 1,
        alpha: Math.random() * 0.8 + 0.2,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    // River Splash Particles
    const splashParticles: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }> = [];

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

      // 1. Jungle River Night Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, "#06130d"); // Deep Emerald Night
      skyGrad.addColorStop(0.5, "#081d14");
      skyGrad.addColorStop(1, "#030c08");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Animated Flowing River Water Waves
      ctx.fillStyle = "rgba(16, 185, 129, 0.04)";
      for (let w = 0; w < 3; w++) {
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 20) {
          const y = height - 120 + Math.sin(x * 0.015 + time * 2 + w * 2) * 14 + Math.cos(time + x * 0.01) * 8;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
      }

      // 3. Ambient Fireflies
      fireflies.forEach((f) => {
        f.x += f.vx;
        f.y += f.vy;
        f.pulse += 0.04;

        if (f.y < 0) f.y = height;
        if (f.x < 0) f.x = width;
        if (f.x > width) f.x = 0;

        const dynamicAlpha = Math.max(0.1, Math.sin(f.pulse)) * f.alpha;
        ctx.fillStyle = `rgba(250, 204, 21, ${dynamicAlpha})`;
        ctx.shadowColor = "#facc15";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 4. Calculate 10 Stepping Stones Positions along Winding Path
      const numStones = 10;
      const stonePositions: Array<{ x: number; y: number; width: number; height: number }> = [];

      const startX = 65;
      const endX = width - 75;
      const pathY = height * 0.58;

      for (let i = 0; i <= numStones; i++) {
        const progress = i / numStones;
        const sx = startX + (endX - startX) * progress;
        // Wavy S-curve path
        const sy = pathY + Math.sin(progress * Math.PI * 2.2) * (height * 0.16);
        stonePositions.push({
          x: sx,
          y: sy,
          width: i === 0 ? 60 : 50,
          height: 32,
        });
      }

      // Draw Path Vine Connection
      ctx.beginPath();
      ctx.moveTo(stonePositions[0].x, stonePositions[0].y + 10);
      for (let i = 1; i <= numStones; i++) {
        ctx.lineTo(stonePositions[i].x, stonePositions[i].y + 10);
      }
      ctx.strokeStyle = "rgba(16, 185, 129, 0.15)";
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // 5. Draw Stepping Stones
      stonePositions.forEach((stone, idx) => {
        const isStartPlatform = idx === 0;
        const isCurrent = currentStep === idx;
        const isPassed = currentStep > idx;
        const isNext = currentStep + 1 === idx;
        const isCrashedStone = isGameOver && currentStep + 1 === idx;

        ctx.save();
        ctx.translate(stone.x, stone.y);

        // Stone Shadow in Water
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.beginPath();
        ctx.ellipse(0, 14, stone.width * 0.65, stone.height * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stone Body Gradient
        const stoneGrad = ctx.createLinearGradient(0, -stone.height / 2, 0, stone.height / 2);
        if (isCrashedStone) {
          stoneGrad.addColorStop(0, "#881337");
          stoneGrad.addColorStop(1, "#4c0519");
        } else if (isCurrent) {
          stoneGrad.addColorStop(0, "#f59e0b");
          stoneGrad.addColorStop(0.5, "#d97706");
          stoneGrad.addColorStop(1, "#78350f");
        } else if (isPassed) {
          stoneGrad.addColorStop(0, "#059669");
          stoneGrad.addColorStop(1, "#064e3b");
        } else if (isNext) {
          stoneGrad.addColorStop(0, "#334155");
          stoneGrad.addColorStop(1, "#1e293b");
        } else {
          stoneGrad.addColorStop(0, "#1e293b");
          stoneGrad.addColorStop(1, "#0f172a");
        }

        ctx.fillStyle = stoneGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, stone.width * 0.5, stone.height * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stone Border
        ctx.lineWidth = isCurrent || isNext ? 2.5 : 1.5;
        ctx.strokeStyle = isCrashedStone
          ? "#f43f5e"
          : isCurrent
          ? "#fbbf24"
          : isPassed
          ? "#34d399"
          : isNext
          ? "rgba(251, 191, 36, 0.6)"
          : "#334155";

        if (isCurrent) {
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 14;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Ancient Carved Rune / Multiplier on Stone
        if (!isStartPlatform) {
          const mult = stepsMultipliers[idx - 1] || 1.0;
          ctx.fillStyle = isCurrent ? "#000000" : isPassed ? "#a7f3d0" : isNext ? "#fde68a" : "#64748b";
          ctx.font = `bold ${stone.width > 55 ? "11px" : "10px"} monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(`${mult}x`, 0, -1);
        } else {
          ctx.fillStyle = "#94a3b8";
          ctx.font = "bold 9px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("CAMP", 0, -1);
        }

        ctx.restore();
      });

      // 6. Tiger Leap Interpolation Physics
      const targetStone = stonePositions[Math.min(currentStep, numStones)];
      const tiger = tigerPosRef.current;

      tiger.targetX = targetStone.x;
      tiger.targetY = targetStone.y - 18;

      // Smooth Jump Physics
      if (Math.abs(tiger.x - tiger.targetX) > 1 || Math.abs(tiger.y - tiger.targetY) > 1) {
        tiger.jumpProgress = Math.min(1.0, tiger.jumpProgress + 0.08);
        tiger.x += (tiger.targetX - tiger.x) * 0.22;
        tiger.y += (tiger.targetY - tiger.y) * 0.22;
        // Parabolic arc for leap height
        tiger.jumpHeight = Math.sin(tiger.jumpProgress * Math.PI) * 28;
      } else {
        tiger.x = tiger.targetX;
        tiger.y = tiger.targetY;
        tiger.jumpProgress = 1;
        tiger.jumpHeight = 0;
      }

      // 7. Draw Animated Majestic Tiger Mascot
      ctx.save();
      const currentTigerY = tiger.y - tiger.jumpHeight + Math.sin(time * 4) * 2;
      ctx.translate(tiger.x, currentTigerY);

      // Tiger Shadow on Stone
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0.2, 0.5 - tiger.jumpHeight * 0.015)})`;
      ctx.beginPath();
      ctx.ellipse(0, 18 + tiger.jumpHeight, Math.max(10, 22 - tiger.jumpHeight * 0.3), 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tiger Body (Orange/Golden Coat)
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = isWinner ? 20 : 8;

      const tigerGrad = ctx.createLinearGradient(-15, -15, 15, 15);
      tigerGrad.addColorStop(0, "#fbbf24");
      tigerGrad.addColorStop(0.5, "#f59e0b");
      tigerGrad.addColorStop(1, "#b45309");

      // Main Torso
      ctx.fillStyle = tigerGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 12, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // Tiger Head
      ctx.beginPath();
      ctx.arc(14, -8, 10, 0, Math.PI * 2);
      ctx.fill();

      // Tiger Ears
      ctx.fillStyle = "#78350f";
      ctx.beginPath();
      ctx.arc(11, -16, 4, 0, Math.PI * 2);
      ctx.arc(19, -16, 4, 0, Math.PI * 2);
      ctx.fill();

      // Stripes (Black Fur Markings)
      ctx.fillStyle = "#1c1917";
      // Body stripes
      ctx.beginPath();
      ctx.moveTo(-6, -10);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-6, 8);
      ctx.lineTo(-8, 6);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(3, -10);
      ctx.lineTo(5, 0);
      ctx.lineTo(3, 8);
      ctx.lineTo(1, 6);
      ctx.closePath();
      ctx.fill();

      // Muzzle / White Fur
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.ellipse(17, -6, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cute Nose
      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.arc(20, -7, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Fierce Eyes (Glowing Cyan / Emerald)
      ctx.fillStyle = "#10b981";
      ctx.beginPath();
      ctx.arc(14, -10, 2, 0, Math.PI * 2);
      ctx.fill();

      // Tail with Swish Motion
      const tailAngle = Math.sin(time * 5) * 0.4 - 0.5;
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.quadraticCurveTo(-26, -10 + Math.sin(time * 6) * 6, -24 + Math.cos(tailAngle) * 10, -18 + Math.sin(tailAngle) * 10);
      ctx.stroke();

      ctx.restore();

      // 8. Splash Particles Handling
      for (let i = splashParticles.length - 1; i >= 0; i--) {
        const sp = splashParticles[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.life -= 0.04;

        if (sp.life <= 0) {
          splashParticles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 3 * sp.life, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentStep, isGameOver, isWinner, difficulty, stepsMultipliers]);

  return (
    <div className="relative w-full h-full min-h-[360px] md:min-h-[440px] flex items-center justify-center overflow-hidden rounded-3xl bg-[#040d09] border border-emerald-500/20 shadow-2xl">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Jungle Ambience Header Overlay */}
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#06170f]/80 backdrop-blur-md border border-emerald-500/30 px-3.5 py-1.5 rounded-full z-10">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-[11px] font-black text-emerald-300 font-mono tracking-wider uppercase">
          TIGER TRAIL • {difficulty} EXPEDITION
        </span>
      </div>

      {/* Current Stepper Multiplier Indicator Overlay */}
      <div className="absolute top-4 right-4 bg-[#06170f]/80 backdrop-blur-md border border-amber-500/30 px-4 py-1.5 rounded-2xl flex items-center gap-2 z-10">
        <span className="text-[10px] uppercase font-bold text-gray-400">Step {currentStep}/10</span>
        <span className="text-sm font-black font-mono text-amber-400">
          {currentStep === 0 ? "1.00x" : `${stepsMultipliers[currentStep - 1]}x`}
        </span>
      </div>
    </div>
  );
};
