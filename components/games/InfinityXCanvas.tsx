"use client";

import React, { useEffect, useRef } from "react";
import { sound } from "@/lib/soundFx";

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
  const displayMultRef = useRef(targetMultiplier);
  const rollTimeRef = useRef(0);

  useEffect(() => {
    if (isRolling) {
      rollTimeRef.current = 0;
    }
  }, [isRolling]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Particles following the Lemniscate of Bernoulli (Infinity curve)
    const numParticles = 80;
    const infinityParticles = Array.from({ length: numParticles }, (_, i) => ({
      t: (i / numParticles) * Math.PI * 2,
      size: Math.random() * 3 + 1.5,
      color: i % 3 === 0 ? "#38bdf8" : i % 3 === 1 ? "#a855f7" : "#fbbf24",
      tail: [] as Array<{ x: number; y: number; alpha: number }>,
    }));

    // Ambient Space Warp Stars
    const stars = Array.from({ length: 50 }, () => ({
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
        bgGrad.addColorStop(0, "#083321");
        bgGrad.addColorStop(0.6, "#041a11");
        bgGrad.addColorStop(1, "#020c08");
      } else if (isWin === false) {
        bgGrad.addColorStop(0, "#2c0911");
        bgGrad.addColorStop(0.6, "#18040a");
        bgGrad.addColorStop(1, "#090104");
      } else {
        bgGrad.addColorStop(0, "#150d2e");
        bgGrad.addColorStop(0.5, "#0a0717");
        bgGrad.addColorStop(1, "#04020a");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Parallax Space Warp Stars
      stars.forEach((star) => {
        star.x -= star.speed * (isRolling ? 7 : 1);
        if (star.x < 0) star.x = width;

        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Mathematical Infinity Lemniscate Geometry
      const centerX = width / 2;
      const centerY = height / 2;
      const a = Math.min(width * 0.32, height * 0.42, 135); // Scale factor for Lemniscate

      ctx.save();
      ctx.translate(centerX, centerY);

      // Outer Glowing Infinity Glow Track
      ctx.beginPath();
      for (let theta = 0; theta <= Math.PI * 2; theta += 0.05) {
        const denom = 1 + Math.sin(theta) * Math.sin(theta);
        const x = (a * Math.cos(theta)) / denom;
        const y = (a * Math.sin(theta) * Math.cos(theta) * 1.5) / denom;

        if (theta === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      ctx.strokeStyle = isWin === true ? "rgba(16, 185, 129, 0.35)" : isWin === false ? "rgba(244, 63, 94, 0.35)" : "rgba(168, 85, 247, 0.25)";
      ctx.lineWidth = isRolling ? 6 : 3.5;
      ctx.shadowColor = isWin === true ? "#10b981" : isWin === false ? "#f43f5e" : "#a855f7";
      ctx.shadowBlur = isRolling ? 25 : 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 4. Orbiting Quantum Plasma Particles
      infinityParticles.forEach((p) => {
        p.t += isRolling ? 0.07 : 0.018;
        if (p.t > Math.PI * 2) p.t -= Math.PI * 2;

        const denom = 1 + Math.sin(p.t) * Math.sin(p.t);
        const px = (a * Math.cos(p.t)) / denom;
        const py = (a * Math.sin(p.t) * Math.cos(p.t) * 1.5) / denom;

        p.tail.unshift({ x: px, y: py, alpha: 1.0 });
        if (p.tail.length > (isRolling ? 12 : 6)) p.tail.pop();

        p.tail.forEach((pt, idx) => {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, 1 - idx / p.tail.length) * 0.55;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, p.size * (1 - idx / p.tail.length), 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 5. Giant Center Multiplier Display
      if (isRolling) {
        rollTimeRef.current += 0.08;
        const randomMult = Number((1.0 + Math.pow(Math.random(), 3) * (targetMultiplier * 2.5)).toFixed(2));
        displayMultRef.current = randomMult;
      } else if (resultMultiplier !== null) {
        displayMultRef.current = resultMultiplier;
      } else {
        displayMultRef.current = targetMultiplier;
      }

      // Multiplier Color
      let multColor = "#a855f7";
      if (isWin === true) multColor = "#34d399";
      else if (isWin === false) multColor = "#f43f5e";
      else if (isRolling) multColor = "#38bdf8";

      ctx.shadowColor = multColor;
      ctx.shadowBlur = isWin ? 30 : isRolling ? 22 : 12;

      ctx.fillStyle = multColor;
      const fontSize = Math.min(width * 0.16, 56);
      ctx.font = `black ${fontSize}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${displayMultRef.current.toFixed(2)}x`, 0, -2);
      ctx.shadowBlur = 0;

      // Sub-label text under multiplier
      ctx.fillStyle = isWin === true ? "#a7f3d0" : isWin === false ? "#fecdd3" : "#94a3b8";
      ctx.font = `bold 10px monospace`;
      ctx.fillText(
        isRolling
          ? "QUANTUM WARP IN PROGRESS..."
          : isWin === true
          ? `TARGET ${targetMultiplier}x EXCEEDED!`
          : isWin === false
          ? `CRASHED AT ${resultMultiplier?.toFixed(2)}x`
          : `TARGET GOAL: ${targetMultiplier.toFixed(2)}x`,
        0,
        fontSize * 0.65
      );

      ctx.restore();

      // 6. Supernova Burst Sparks on Win
      if (isWin === true && burstParticles.length < 35) {
        for (let i = 0; i < 2; i++) {
          const dir = Math.random() * Math.PI * 2;
          const spd = Math.random() * 5 + 2;
          burstParticles.push({
            x: centerX,
            y: centerY,
            vx: Math.cos(dir) * spd,
            vy: Math.sin(dir) * spd,
            life: 1.0,
            color: ["#34d399", "#a855f7", "#38bdf8", "#fbbf24"][Math.floor(Math.random() * 4)],
          });
        }
      }

      for (let i = burstParticles.length - 1; i >= 0; i--) {
        const bp = burstParticles[i];
        bp.x += bp.vx;
        bp.y += bp.vy;
        bp.life -= 0.035;

        if (bp.life <= 0) {
          burstParticles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = bp.color;
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, 2.8 * bp.life, 0, Math.PI * 2);
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
    <div className="relative w-full h-full min-h-[260px] sm:min-h-[320px] md:min-h-[390px] flex items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl bg-[#04020a] border border-purple-500/25 shadow-2xl">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Top Status Header Badges */}
      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-1.5 bg-[#0b0718]/85 backdrop-blur-md border border-purple-500/30 px-2.5 py-1 rounded-full z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
        <span className="text-[9px] sm:text-[10px] font-black text-purple-300 font-mono tracking-wider uppercase">
          INFINITY X • 98.8% RTP
        </span>
      </div>

      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[#0b0718]/85 backdrop-blur-md border border-amber-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1.5 z-10">
        <span className="text-[8px] sm:text-[9px] uppercase font-bold text-gray-400">Target:</span>
        <span className="text-xs sm:text-sm font-black font-mono text-amber-400">
          {targetMultiplier.toFixed(2)}x
        </span>
      </div>
    </div>
  );
};
