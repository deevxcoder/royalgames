"use client";

import React, { useEffect, useRef } from "react";

interface InfinityXCanvasProps {
  isRolling: boolean;
  resultMultiplier: number | null;
  targetMultiplier: number;
  isWin: boolean | null;
}

export const InfinityXCanvas: React.FC<InfinityXCanvasProps> = ({
  isRolling,
  resultMultiplier,
  targetMultiplier,
  isWin,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Particles following the Lemniscate of Bernoulli (Infinity curve)
    const numParticles = 90;
    const infinityParticles = Array.from({ length: numParticles }, (_, i) => ({
      t: (i / numParticles) * Math.PI * 2,
      size: Math.random() * 3 + 1.5,
      color: i % 3 === 0 ? "#38bdf8" : i % 3 === 1 ? "#a855f7" : "#fbbf24",
      tail: [] as Array<{ x: number; y: number; alpha: number }>,
    }));

    // Ambient Space Warp Stars
    const stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * 800,
      y: Math.random() * 500,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 1.5 + 0.5,
    }));

    // Supernova burst particles
    const burstParticles: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }> = [];

    const render = () => {
      time += isRolling ? 0.08 : 0.025;

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

      // 1. Cosmic Void Background Gradient
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.7);
      if (isWin === true) {
        bgGrad.addColorStop(0, "#06281e");
        bgGrad.addColorStop(0.6, "#04140f");
        bgGrad.addColorStop(1, "#020806");
      } else if (isWin === false) {
        bgGrad.addColorStop(0, "#26060c");
        bgGrad.addColorStop(0.6, "#140306");
        bgGrad.addColorStop(1, "#080203");
      } else {
        bgGrad.addColorStop(0, "#0f172a");
        bgGrad.addColorStop(0.5, "#080c16");
        bgGrad.addColorStop(1, "#03060a");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Parallax Space Warp Stars
      stars.forEach((star) => {
        star.x -= star.speed * (isRolling ? 6 : 1);
        if (star.x < 0) star.x = width;

        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Infinity Symbol Mathematical Center
      const centerX = width / 2;
      const centerY = height / 2;
      const a = Math.min(width * 0.32, 160); // Scale factor for Lemniscate

      // Draw Glowing Neon Infinity Track
      ctx.save();
      ctx.translate(centerX, centerY);

      ctx.beginPath();
      for (let theta = 0; theta <= Math.PI * 2; theta += 0.05) {
        // Lemniscate of Bernoulli Parametric:
        // x = a * cos(t) / (1 + sin^2(t))
        // y = a * sin(t) * cos(t) / (1 + sin^2(t))
        const denom = 1 + Math.sin(theta) * Math.sin(theta);
        const x = (a * Math.cos(theta)) / denom;
        const y = (a * Math.sin(theta) * Math.cos(theta) * 1.6) / denom;

        if (theta === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      ctx.strokeStyle = isWin === true ? "rgba(16, 185, 129, 0.25)" : isWin === false ? "rgba(244, 63, 94, 0.25)" : "rgba(168, 85, 247, 0.2)";
      ctx.lineWidth = isRolling ? 6 : 3;
      ctx.shadowColor = isWin === true ? "#10b981" : isWin === false ? "#f43f5e" : "#a855f7";
      ctx.shadowBlur = isRolling ? 25 : 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 4. Draw Orbiting Infinity Quantum Particles with Motion Trails
      infinityParticles.forEach((p) => {
        p.t += isRolling ? 0.06 : 0.018;
        if (p.t > Math.PI * 2) p.t -= Math.PI * 2;

        const denom = 1 + Math.sin(p.t) * Math.sin(p.t);
        const px = (a * Math.cos(p.t)) / denom;
        const py = (a * Math.sin(p.t) * Math.cos(p.t) * 1.6) / denom;

        // Add tail point
        p.tail.unshift({ x: px, y: py, alpha: 1.0 });
        if (p.tail.length > (isRolling ? 14 : 7)) p.tail.pop();

        // Draw particle tail
        p.tail.forEach((pt, idx) => {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, 1 - idx / p.tail.length) * 0.6;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, Math.max(1, p.size * (1 - idx / p.tail.length)), 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        // Draw Particle Head
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 5. Central Quantum Core Reactor Glow
      const corePulse = Math.sin(time * 6) * 6;
      const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 45 + corePulse);
      coreGrad.addColorStop(0, isWin === true ? "rgba(16, 185, 129, 0.6)" : isWin === false ? "rgba(244, 63, 94, 0.6)" : "rgba(168, 85, 247, 0.5)");
      coreGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.2)");
      coreGrad.addColorStop(1, "transparent");

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 50 + corePulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 6. Supernova Win Burst Particles
      for (let i = burstParticles.length - 1; i >= 0; i--) {
        const bp = burstParticles[i];
        bp.x += bp.vx;
        bp.y += bp.vy;
        bp.life -= 0.03;

        if (bp.life <= 0) {
          burstParticles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = bp.color;
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, Math.max(1, 4 * bp.life), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRolling, resultMultiplier, targetMultiplier, isWin]);

  return (
    <div className="relative w-full h-full min-h-[360px] md:min-h-[440px] flex items-center justify-center overflow-hidden rounded-3xl bg-[#03060b] border border-purple-500/20 shadow-2xl">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Central Limbo Outcome HUD */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-2 pointer-events-none select-none">
        <span className="text-[11px] font-black tracking-widest text-purple-300 uppercase bg-purple-950/80 border border-purple-500/40 px-3.5 py-1 rounded-full backdrop-blur-md">
          {isRolling ? "CHARGING ENERGY PORTAL..." : "QUANTUM OUTCOME"}
        </span>

        {/* Big Animated Multiplier Display */}
        <div className="text-6xl sm:text-7xl md:text-8xl font-black font-mono tracking-tighter drop-shadow-[0_10px_35px_rgba(168,85,247,0.5)]">
          {isRolling ? (
            <span className="text-amber-400 animate-pulse">{(Math.random() * 20 + 1).toFixed(2)}x</span>
          ) : resultMultiplier !== null ? (
            <span
              className={
                isWin
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 animate-bounce"
                  : "text-rose-500"
              }
            >
              {resultMultiplier.toFixed(2)}x
            </span>
          ) : (
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300">
              {targetMultiplier.toFixed(2)}x
            </span>
          )}
        </div>

        {/* Target Multiplier Subtitle */}
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-gray-300 bg-[#070b14]/80 px-4 py-1 rounded-xl border border-slate-800 backdrop-blur-md">
          <span>TARGET: {targetMultiplier.toFixed(2)}x</span>
          <span>•</span>
          <span className={isWin ? "text-emerald-400" : isWin === false ? "text-rose-400" : "text-amber-400"}>
            {isWin === true ? "WINNER!" : isWin === false ? "MISSED TARGET" : "READY"}
          </span>
        </div>
      </div>
    </div>
  );
};
