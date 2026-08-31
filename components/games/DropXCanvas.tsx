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
      const topY = Math.max(22, height * 0.05);
      const bottomY = height - 42;
      const rowSpacing = (bottomY - topY) / (rows + 0.5);

      const maxRowWidth = Math.min(width * 0.92, (rows + 2) * 38);
      const pinSpacing = maxRowWidth / (rows + 2);

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
        ctx.fillStyle = "#e2e8f0";
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

      // 5. Draw Multiplier Landing Buckets at the Bottom
      const numBuckets = multipliers.length;
      const totalBucketWidth = Math.min(width * 0.94, numBuckets * (pinSpacing + 1));
      const bucketWidth = totalBucketWidth / numBuckets;
      const bucketStartX = width / 2 - totalBucketWidth / 2;
      const bucketY = height - 22;

      multipliers.forEach((mult, idx) => {
        const bx = bucketStartX + idx * bucketWidth;
        const bounce = bucketBounceRef.current[idx] || 0;
        if (bucketBounceRef.current[idx] > 0) {
          bucketBounceRef.current[idx] = Math.max(0, bucketBounceRef.current[idx] - 0.08);
        }

        // Color Gradient based on Multiplier Magnitude
        let bucketColor = "#0284c7"; // Cyan
        let glowColor = "#38bdf8";
        if (mult >= 100) {
          bucketColor = "#e11d48"; // Ruby red jackpot
          glowColor = "#f43f5e";
        } else if (mult >= 20) {
          bucketColor = "#ea580c"; // Fiery orange
          glowColor = "#f97316";
        } else if (mult >= 4) {
          bucketColor = "#ca8a04"; // Gold
          glowColor = "#eab308";
        } else if (mult >= 1.4) {
          bucketColor = "#059669"; // Emerald
          glowColor = "#10b981";
        } else if (mult <= 0.6) {
          bucketColor = "#334155"; // Slate / Dark for loss buckets
          glowColor = "#64748b";
        }

        ctx.save();
        ctx.translate(bx + bucketWidth / 2, bucketY - bounce * 6);

        // Bucket Shadow / Glow
        if (bounce > 0.05) {
          ctx.shadowColor = glowColor;
          ctx.shadowBlur = 16;
        }

        // Bucket Body
        ctx.fillStyle = bucketColor;
        ctx.beginPath();
        ctx.roundRect(-bucketWidth * 0.46, -11, bucketWidth * 0.92, 22, 5);
        ctx.fill();

        // Bucket Border
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Bucket Multiplier Text
        ctx.fillStyle = mult <= 0.6 ? "#cbd5e1" : "#ffffff";
        const fontSize = Math.max(6.5, Math.min(9.5, bucketWidth * 0.38));
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${mult}x`, 0, 0);

        ctx.restore();
      });

      // 6. Physics & Guided Path Trajectory Simulation
      for (let i = activeBallsRef.current.length - 1; i >= 0; i--) {
        const ball = activeBallsRef.current[i];
        if (ball.isLanded) continue;

        // Initialize ball above top center
        if (!ball.initialized) {
          ball.x = width / 2;
          ball.y = topY - 16;
          ball.vx = (Math.random() - 0.5) * 0.4;
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
        // Ball descends row by row
        const currentR = Math.floor((ball.y - topY + rowSpacing * 0.5) / rowSpacing);
        const clampedRow = Math.max(0, Math.min(rows, currentR));

        // Calculate accumulated offset from center based on pathSteps
        let accumulatedDecisions = 0;
        for (let r = 0; r < Math.min(ball.pathSteps.length, clampedRow); r++) {
          accumulatedDecisions += ball.pathSteps[r] === 1 ? 0.5 : -0.5;
        }

        const targetX = width / 2 + accumulatedDecisions * pinSpacing;
        const dxToTarget = targetX - ball.x;

        // Subtle guiding magnetic force toward path decision
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
