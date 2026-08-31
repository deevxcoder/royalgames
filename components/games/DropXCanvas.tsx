"use client";

import React, { useEffect, useRef } from "react";
import { sound } from "@/lib/soundFx";

export interface PlinkoBall {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  betAmount: number;
  pathSteps: number[]; // 0 = Left, 1 = Right for each row
  targetBucketIndex: number;
  currentRow: number;
  isLanded: boolean;
  initialized?: boolean;
}

interface DropXCanvasProps {
  rows: number;
  risk: "LOW" | "MEDIUM" | "HIGH";
  multipliers: number[];
  balls: PlinkoBall[];
  onBallLanded: (ballId: string, bucketIndex: number, multiplier: number, betAmount: number) => void;
}

export const DropXCanvas: React.FC<DropXCanvasProps> = ({
  rows,
  risk,
  multipliers,
  balls,
  onBallLanded,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeBallsRef = useRef<PlinkoBall[]>([]);
  const bucketBounceRef = useRef<number[]>([]);

  useEffect(() => {
    // Synchronize incoming new balls
    activeBallsRef.current = balls.filter((b) => !b.isLanded);
  }, [balls]);

  useEffect(() => {
    bucketBounceRef.current = Array.from({ length: multipliers.length }, () => 0);
  }, [multipliers]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    // Pin hit light particles
    const pinFlashes: Array<{ x: number; y: number; alpha: number; color: string }> = [];

    const render = () => {
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

      // 1. Cosmic Glassmorphism Arena Background
      const bgGrad = ctx.createRadialGradient(width / 2, height * 0.35, 10, width / 2, height * 0.5, width * 0.7);
      bgGrad.addColorStop(0, "#08142c");
      bgGrad.addColorStop(0.6, "#050d1f");
      bgGrad.addColorStop(1, "#020610");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Compute Pin Pyramid Positions
      const pinRadius = rows >= 14 ? 2.5 : 3.5;
      const topY = Math.max(26, height * 0.06);
      const bottomY = height - 42;
      const rowSpacing = (bottomY - topY) / (rows + 0.5);

      const maxRowWidth = Math.min(width * 0.92, (rows + 2) * 38);
      const pinSpacing = maxRowWidth / (rows + 2);

      // 2a. Draw Sleek Top Neon Ball Dispenser Funnel
      ctx.save();
      ctx.fillStyle = "#0f172a";
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(width / 2 - 18, topY - 24, 36, 14, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(width / 2, topY - 17, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const pins: Array<{ x: number; y: number; row: number; col: number }> = [];

      for (let r = 0; r <= rows; r++) {
        const rowY = topY + r * rowSpacing;
        const pinsInRow = r + 3;
        const startX = width / 2 - ((pinsInRow - 1) * pinSpacing) / 2;

        for (let c = 0; c < pinsInRow; c++) {
          const pinX = startX + c * pinSpacing;
          pins.push({ x: pinX, y: rowY, row: r, col: c });
        }
      }

      // 3. Draw Metallic Neon Glowing Pins
      pins.forEach((pin) => {
        ctx.fillStyle = "#f1f5f9";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(pin.x, pin.y, pinRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 4. Draw Pin Hit Flashes
      for (let i = pinFlashes.length - 1; i >= 0; i--) {
        const pf = pinFlashes[i];
        pf.alpha -= 0.08;
        if (pf.alpha <= 0) {
          pinFlashes.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `rgba(56, 189, 248, ${pf.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pf.x, pf.y, 6 + (1 - pf.alpha) * 10, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 5. Draw Multiplier Landing Buckets at the Bottom (Stake-Style Symmetrical Rainbow Heatmap)
      const numBuckets = multipliers.length;
      const totalBucketWidth = Math.min(width * 0.94, numBuckets * (pinSpacing + 1));
      const bucketWidth = totalBucketWidth / numBuckets;
      const bucketStartX = width / 2 - totalBucketWidth / 2;
      const bucketY = height - 22;
      const centerIdx = (numBuckets - 1) / 2;

      multipliers.forEach((mult, idx) => {
        const bx = bucketStartX + idx * bucketWidth;
        const bounce = bucketBounceRef.current[idx] || 0;
        if (bucketBounceRef.current[idx] > 0) {
          bucketBounceRef.current[idx] = Math.max(0, bucketBounceRef.current[idx] - 0.08);
        }

        // Distance from center: 0.0 = center, 1.0 = outer edge
        const distFromCenter = centerIdx > 0 ? Math.abs(idx - centerIdx) / centerIdx : 0;

        // Premium Stake & BGaming Heatmap Palette
        let bucketBg = "#eab308";
        let glowColor = "#fde047";
        let textColor = "#000000";

        if (distFromCenter >= 0.85) {
          // Outermost Wing Jackpot (e.g. 22x, 76x, 1000x)
          bucketBg = "#ef4444"; // Crimson Red
          glowColor = "#f87171";
          textColor = "#ffffff";
        } else if (distFromCenter >= 0.65) {
          // High Multipliers (e.g. 5x, 10x, 26x)
          bucketBg = "#f97316"; // Fiery Tangerine
          glowColor = "#fb923c";
          textColor = "#ffffff";
        } else if (distFromCenter >= 0.45) {
          // Medium Multipliers (e.g. 2x, 3x, 4x)
          bucketBg = "#10b981"; // Emerald Green
          glowColor = "#34d399";
          textColor = "#ffffff";
        } else if (distFromCenter >= 0.25) {
          // Small Return (e.g. 1.4x, 1.3x)
          bucketBg = "#06b6d4"; // Electric Cyan
          glowColor = "#22d3ee";
          textColor = "#ffffff";
        } else if (distFromCenter > 0.05) {
          // Flanking Loss Buckets (e.g. 0.6x, 0.7x)
          bucketBg = "#fb923c"; // Warm Peach / Amber Orange
          glowColor = "#fdba74";
          textColor = "#1e293b";
        } else {
          // Dead Center Minimum (e.g. 0.4x, 0.2x)
          bucketBg = "#fbbf24"; // Radiant Gold Yellow
          glowColor = "#fef08a";
          textColor = "#0f172a";
        }

        ctx.save();
        ctx.translate(bx + bucketWidth / 2, bucketY - bounce * 7);

        // Active Bounce Glow Aura
        if (bounce > 0.05) {
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 20;
        } else {
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 4;
        }

        // Bucket Capsule Body
        ctx.fillStyle = bucketBg;
        ctx.beginPath();
        ctx.roundRect(-bucketWidth * 0.46, -11, bucketWidth * 0.92, 22, 5);
        ctx.fill();

        // Bucket Crisp Top Highlight Bevel
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // Multiplier Value Label
        ctx.fillStyle = textColor;
        const fontSize = Math.max(6.5, Math.min(9.5, bucketWidth * 0.38));
        ctx.font = `900 ${fontSize}px ui-monospace, SFMono-Regular, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${mult}x`, 0, 0);

        ctx.restore();
      });

      // 6. Physics & Guided Path Trajectory Simulation
      for (let i = activeBallsRef.current.length - 1; i >= 0; i--) {
        const ball = activeBallsRef.current[i];
        if (ball.isLanded) continue;

        // Initialize ball at top dispenser funnel
        if (!ball.initialized) {
          ball.x = width / 2;
          ball.y = topY - 14;
          ball.vx = (Math.random() - 0.5) * 0.3;
          ball.vy = 2.2;
          ball.currentRow = 0;
          ball.initialized = true;
        }

        // Physics step
        const gravity = 0.32;
        ball.vy += gravity;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Determine current target X based on path steps
        const currentR = Math.floor((ball.y - topY + rowSpacing * 0.5) / rowSpacing);
        const clampedRow = Math.max(0, Math.min(rows, currentR));

        // Calculate accumulated offset from center based on pathSteps
        let accumulatedDecisions = 0;
        for (let r = 0; r < Math.min(ball.pathSteps.length, clampedRow); r++) {
          accumulatedDecisions += ball.pathSteps[r] === 1 ? 0.5 : -0.5;
        }

        const targetX = width / 2 + accumulatedDecisions * pinSpacing;
        const dxToTarget = targetX - ball.x;

        // Subtle guiding force toward path decision
        ball.vx += dxToTarget * 0.04;
        ball.vx *= 0.94; // damping

        // Pin collision checks
        pins.forEach((pin) => {
          const dx = ball.x - pin.x;
          const dy = ball.y - pin.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = ball.radius + pinRadius;

          if (dist < minDist && dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;

            // Separate overlapping ball
            ball.x = pin.x + nx * minDist;
            ball.y = pin.y + ny * minDist;

            // Deflect with natural bounce
            ball.vy = Math.max(1.2, ball.vy * 0.65);
            const side = ball.x >= pin.x ? 1 : -1;
            ball.vx = side * (0.8 + Math.random() * 0.6);

            // Flash & sound
            pinFlashes.push({ x: pin.x, y: pin.y, alpha: 0.8, color: "#38bdf8" });
            sound.playChipBet();
          }
        });

        // Draw Ball with Glowing Neon Halo
        ctx.save();
        ctx.shadowColor = ball.color;
        ctx.shadowBlur = 12;

        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(ball.x - 1.2, ball.y - 1.2, ball.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Check Landing into Multiplier Bucket
        if (ball.y >= bucketY - 8) {
          ball.isLanded = true;

          // Target bucket from predetermined path
          const bucketIndex = Math.max(0, Math.min(numBuckets - 1, ball.targetBucketIndex));
          const wonMult = multipliers[bucketIndex] ?? 1.0;

          // Trigger bucket bounce animation
          bucketBounceRef.current[bucketIndex] = 1.0;

          // Notify Parent Game component
          onBallLanded(ball.id, bucketIndex, wonMult, ball.betAmount);
          activeBallsRef.current.splice(i, 1);
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [rows, risk, multipliers, onBallLanded]);

  return (
    <div className="relative w-full h-full min-h-[300px] sm:min-h-[380px] md:min-h-[460px] flex items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl bg-[#03060f] border border-cyan-500/20 shadow-2xl">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
};
