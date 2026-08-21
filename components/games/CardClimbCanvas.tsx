"use client";

import React, { useEffect, useRef } from "react";
import { sound } from "@/lib/soundFx";

export interface PlayingCard {
  value: number; // 2 to 14 (Ace = 14)
  suit: "♠" | "♥" | "♦" | "♣";
  display: string;
  color: "red" | "black";
}

interface CardClimbCanvasProps {
  currentCard: PlayingCard;
  cardHistory: PlayingCard[];
  climbStreak: number;
  accumulatedMultiplier: number;
  isPlaying: boolean;
  isFlipping: boolean;
  isGameOver: boolean;
  isWin: boolean | null;
}

export const CardClimbCanvas: React.FC<CardClimbCanvasProps> = ({
  currentCard,
  cardHistory,
  climbStreak,
  accumulatedMultiplier,
  isPlaying,
  isFlipping,
  isGameOver,
  isWin,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const flipProgressRef = useRef(1.0);

  useEffect(() => {
    if (isFlipping) {
      flipProgressRef.current = 0.0;
    }
  }, [isFlipping, currentCard]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Victory celebration sparks
    const sparks: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }> = [];

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

      // 1. Velvet Casino Emerald Table Background
      const bgGrad = ctx.createRadialGradient(width / 2, height * 0.45, 10, width / 2, height * 0.5, width * 0.7);
      if (isWin) {
        bgGrad.addColorStop(0, "#083321");
        bgGrad.addColorStop(0.6, "#041f14");
        bgGrad.addColorStop(1, "#02100a");
      } else if (isGameOver) {
        bgGrad.addColorStop(0, "#2c0911");
        bgGrad.addColorStop(0.6, "#1a0409");
        bgGrad.addColorStop(1, "#090104");
      } else {
        bgGrad.addColorStop(0, "#062217");
        bgGrad.addColorStop(0.6, "#03140e");
        bgGrad.addColorStop(1, "#010906");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Ambient Table Watermark & Subtle Grid
      ctx.strokeStyle = "rgba(52, 211, 153, 0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 28) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 3. Multiplier Ladder Tower on the Right
      const ladderX = width - 48;
      const ladderTopY = 36;
      const ladderH = height - 72;
      const steps = 8;
      const stepH = ladderH / steps;

      for (let i = 0; i < steps; i++) {
        const stepY = ladderTopY + (steps - 1 - i) * stepH;
        const isActive = climbStreak >= i + 1;
        const isCurrent = climbStreak === i;

        ctx.save();
        // Step Background
        ctx.fillStyle = isActive
          ? "rgba(16, 185, 129, 0.25)"
          : isCurrent
          ? "rgba(245, 158, 11, 0.25)"
          : "rgba(15, 23, 42, 0.6)";
        ctx.strokeStyle = isActive
          ? "#10b981"
          : isCurrent
          ? "#f59e0b"
          : "rgba(51, 65, 85, 0.5)";
        ctx.lineWidth = isActive || isCurrent ? 2 : 1;

        ctx.beginPath();
        ctx.roundRect(ladderX - 44, stepY + 2, 42, stepH - 4, 6);
        ctx.fill();
        ctx.stroke();

        // Step Multiplier Text
        const stepMult = (1 + i * 0.75 + (i > 3 ? (i - 3) * 0.8 : 0)).toFixed(1);
        ctx.fillStyle = isActive ? "#34d399" : isCurrent ? "#fbbf24" : "#64748b";
        ctx.font = `bold 9px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${stepMult}x`, ladderX - 23, stepY + stepH / 2);
        ctx.restore();
      }

      // 4. Draw Deck Stack on the Left
      const deckX = 36;
      const deckY = height * 0.44;
      const cardW = Math.min(width * 0.32, 115);
      const cardH = cardW * 1.45;

      for (let d = 0; d < 3; d++) {
        ctx.save();
        ctx.translate(deckX + d * 2, deckY - d * 2);
        ctx.fillStyle = "#0f172a";
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-22, -32, 44, 64, 6);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // 5. Calculate 3D Card Flip Animation
      if (flipProgressRef.current < 1.0) {
        flipProgressRef.current = Math.min(1.0, flipProgressRef.current + 0.08);
      }
      const flip = flipProgressRef.current;
      const flipScaleX = Math.abs(Math.cos(flip * Math.PI));
      const showFront = flip >= 0.5;

      const cardCenterX = width * 0.44;
      const cardCenterY = height * 0.44 + Math.sin(time * 2) * 3;

      // Card Drop Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.beginPath();
      ctx.ellipse(cardCenterX, cardCenterY + cardH * 0.52, (cardW * 0.55) * flipScaleX, cardH * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw Main 3D Playing Card
      ctx.save();
      ctx.translate(cardCenterX, cardCenterY);
      ctx.scale(flipScaleX, 1.0);

      // Card Aura Glow
      let cardGlow = "#10b981";
      if (isGameOver) cardGlow = "#f43f5e";
      else if (climbStreak > 0) cardGlow = "#f59e0b";

      ctx.shadowColor = cardGlow;
      ctx.shadowBlur = isWin ? 30 : climbStreak > 0 ? 20 : 12;

      if (!showFront) {
        // Card Back (Royal Pattern)
        const backGrad = ctx.createLinearGradient(-cardW / 2, -cardH / 2, cardW / 2, cardH / 2);
        backGrad.addColorStop(0, "#1e1b4b");
        backGrad.addColorStop(0.5, "#312e81");
        backGrad.addColorStop(1, "#1e1b4b");
        ctx.fillStyle = backGrad;
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 14);
        ctx.fill();
        ctx.stroke();

        // Gold Emblem Center
        ctx.fillStyle = "#f59e0b";
        ctx.font = `bold ${Math.round(cardW * 0.3)}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⚜", 0, 0);
      } else {
        // Card Front (Royal Crystal Face)
        const frontGrad = ctx.createLinearGradient(-cardW / 2, -cardH / 2, cardW / 2, cardH / 2);
        frontGrad.addColorStop(0, "#ffffff");
        frontGrad.addColorStop(0.6, "#f8fafc");
        frontGrad.addColorStop(1, "#e2e8f0");
        ctx.fillStyle = frontGrad;
        ctx.strokeStyle = climbStreak > 0 ? "#f59e0b" : "#94a3b8";
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 14);
        ctx.fill();
        ctx.stroke();

        // Beveled Inner Border
        ctx.strokeStyle = currentCard.color === "red" ? "rgba(225, 29, 72, 0.2)" : "rgba(15, 23, 42, 0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(-cardW / 2 + 5, -cardH / 2 + 5, cardW - 10, cardH - 10, 10);
        ctx.stroke();

        ctx.shadowBlur = 0;
        const fontColor = currentCard.color === "red" ? "#e11d48" : "#0f172a";

        // Top-Left Pip & Value
        ctx.fillStyle = fontColor;
        ctx.font = `black ${Math.round(cardW * 0.18)}px sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(currentCard.display, -cardW / 2 + 8, -cardH / 2 + 8);

        // Center Giant Suit Symbol
        ctx.fillStyle = fontColor;
        ctx.font = `black ${Math.round(cardW * 0.42)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(currentCard.suit, 0, 2);

        // Bottom-Right Pip & Value
        ctx.font = `black ${Math.round(cardW * 0.18)}px sans-serif`;
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        ctx.fillText(currentCard.display, cardW / 2 - 8, cardH / 2 - 8);
      }

      ctx.restore();

      // 6. Spawn Win Celebration Sparks
      if (isWin && sparks.length < 35) {
        for (let i = 0; i < 2; i++) {
          const dir = Math.random() * Math.PI * 2;
          const spd = Math.random() * 4 + 2;
          sparks.push({
            x: cardCenterX,
            y: cardCenterY,
            vx: Math.cos(dir) * spd,
            vy: Math.sin(dir) * spd,
            life: 1.0,
            color: ["#fbbf24", "#34d399", "#38bdf8", "#ffffff"][Math.floor(Math.random() * 4)],
          });
        }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const sp = sparks[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.life -= 0.035;

        if (sp.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 2.5 * sp.life, 0, Math.PI * 2);
        ctx.fill();
      }

      // 7. Bottom History Card Strip
      const histY = height - 26;
      const histStartX = 24;
      cardHistory.slice(0, 5).forEach((c, idx) => {
        ctx.save();
        ctx.fillStyle = "#040d09";
        ctx.strokeStyle = c.color === "red" ? "#f43f5e" : "#38bdf8";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(histStartX + idx * 36, histY - 10, 32, 20, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = c.color === "red" ? "#fb7185" : "#e2e8f0";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(c.display, histStartX + idx * 36 + 16, histY);
        ctx.restore();
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentCard, cardHistory, climbStreak, accumulatedMultiplier, isPlaying, isFlipping, isGameOver, isWin]);

  return (
    <div className="relative w-full h-full min-h-[250px] sm:min-h-[310px] md:min-h-[380px] flex items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl bg-[#010906] border border-emerald-500/25 shadow-2xl">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Top Header Status Badges */}
      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-1.5 bg-[#040d09]/85 backdrop-blur-md border border-emerald-500/30 px-2.5 py-1 rounded-full z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-[9px] sm:text-[10px] font-black text-emerald-300 font-mono tracking-wider uppercase">
          CARD CLIMB • STREAK: {climbStreak}
        </span>
      </div>

      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[#040d09]/85 backdrop-blur-md border border-amber-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1.5 z-10">
        <span className="text-[8px] sm:text-[9px] uppercase font-bold text-gray-400">Multiplier:</span>
        <span className="text-xs sm:text-sm font-black font-mono text-amber-400">
          {accumulatedMultiplier.toFixed(2)}x
        </span>
      </div>
    </div>
  );
};
