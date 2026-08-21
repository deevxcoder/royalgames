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
  targetBucketIndex?: number;
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
    let time = 0;

    // Pin hit light particles
    const pinFlashes: Array<{ x: number; y: number; alpha: number; color: string }> = [];

    const render = () => {
      time += 0.025;

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

      // 2. Compute Pin Pyramid Positions (Spacious & Tall)
      const pinRadius = rows >= 14 ? 2.5 : 3.5;
      const topY = Math.max(18, height * 0.045);
      const bottomY = height - 36;
      const rowSpacing = (bottomY - topY) / (rows + 0.6);

      const maxRowWidth = Math.min(width * 0.94, (rows + 3) * 36);
      const pinSpacing = maxRowWidth / (rows + 3);

      const pins: Array<{ x: number; y: number; row: number; col: number }> = [];

      for (let r = 0; r <= rows; r++) {
        const rowY = topY + r * rowSpacing;
        const pinsInRow = r + 3; // Row 0 has 3 pins, Row 1 has 4...
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
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(pin.x, pin.y, pinRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 4. Draw Pin Hit Flashes
      for (let i = pinFlashes.length - 1; i >= 0; i--) {
        const pf = pinFlashes[i];
        pf.alpha -= 0.06;
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
      const totalBucketWidth = Math.min(width * 0.96, numBuckets * (pinSpacing + 2));
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
        let bucketColor = "#0284c7"; // Cyan middle
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
        } else if (mult >= 1.5) {
          bucketColor = "#059669"; // Emerald
          glowColor = "#10b981";
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
        ctx.roundRect(-bucketWidth * 0.46, -10, bucketWidth * 0.92, 20, 5);
        ctx.fill();

        // Bucket Border
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Bucket Multiplier Text
        ctx.fillStyle = "#ffffff";
        const fontSize = Math.max(6.5, Math.min(9.5, bucketWidth * 0.38));
        ctx.font = `black ${fontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${mult}x`, 0, 0);

        ctx.restore();
      });

      // 6. Physics Simulation for Active Plinko Balls (True Centered Galton Physics)
      const gravity = 0.28;
      const restitution = 0.55;

      for (let i = activeBallsRef.current.length - 1; i >= 0; i--) {
        const ball = activeBallsRef.current[i];
        if (ball.isLanded) continue;

        // Initialize ball at exact top-center of pyramid
        if (!ball.initialized) {
          ball.x = width / 2 + (Math.random() - 0.5) * (pinSpacing * 0.3);
          ball.y = topY - 14;
          ball.vx = (Math.random() - 0.5) * 0.6;
          ball.vy = 0.8;
          ball.initialized = true;
        }

        // Apply Gravity
        ball.vy += gravity;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Air Resistance / Friction
        ball.vx *= 0.985;
        ball.vy *= 0.985;

        // Pin Collisions
        pins.forEach((pin) => {
          const dx = ball.x - pin.x;
          const dy = ball.y - pin.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = ball.radius + pinRadius;

          if (dist < minDist && dist > 0) {
            // Normal Vector
            const nx = dx / dist;
            const ny = dy / dist;

            // Separate overlapping ball from pin
            ball.x = pin.x + nx * minDist;
            ball.y = pin.y + ny * minDist;

            // Velocity Reflection
            const dot = ball.vx * nx + ball.vy * ny;
            if (dot < 0) {
              const jitter = (Math.random() - 0.5) * 0.5;
              ball.vx = (ball.vx - 2 * dot * nx) * restitution + jitter;
              ball.vy = (ball.vy - 2 * dot * ny) * restitution;
            }

            // Pin Hit Visual Flash
            pinFlashes.push({ x: pin.x, y: pin.y, alpha: 0.9, color: "#38bdf8" });
            sound.playChipBet();
          }
        });

        // Left / Right Arena Wall Bounds
        if (ball.x - ball.radius < 10) {
          ball.x = 10 + ball.radius;
          ball.vx = Math.abs(ball.vx) * 0.6;
        } else if (ball.x + ball.radius > width - 10) {
          ball.x = width - 10 - ball.radius;
          ball.vx = -Math.abs(ball.vx) * 0.6;
        }

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
        ctx.arc(ball.x - 1.5, ball.y - 1.5, ball.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Check Landing into Multiplier Bucket
        if (ball.y >= bucketY - 8) {
          ball.isLanded = true;
          // Determine landing bucket index accurately
          const bucketIndex = Math.max(
            0,
            Math.min(numBuckets - 1, Math.floor((ball.x - bucketStartX) / bucketWidth))
          );
          const wonMult = multipliers[bucketIndex] || 1.0;

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
