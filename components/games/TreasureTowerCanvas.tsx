"use client";

import React, { useEffect, useRef } from "react";
import { sound } from "@/lib/soundFx";

interface TreasureTowerCanvasProps {
  currentFloor: number; // 0 to 8
  isPlaying: boolean;
  isGameOver: boolean;
  isWinner: boolean;
  difficulty: "EASY" | "MEDIUM" | "HARD" | "EXTREME";
  doorsCount: number;
  multipliers: number[];
  onPickDoor: (doorIdx: number) => void;
}

export const TreasureTowerCanvas: React.FC<TreasureTowerCanvasProps> = ({
  currentFloor,
  isPlaying,
  isGameOver,
  isWinner,
  difficulty,
  doorsCount,
  multipliers,
  onPickDoor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const openDoorAnimRef = useRef<{ floor: number; doorIdx: number; progress: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleCanvasClick = (e: MouseEvent | TouchEvent) => {
      if (!isPlaying || isGameOver || currentFloor >= 8) return;

      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const width = rect.width;
      const height = rect.height;

      // Check click on active floor's doors
      const totalFloors = 8;
      const floorH = (height - 30) / totalFloors;
      const activeFloorY = height - 16 - (currentFloor + 1) * floorH;

      if (y >= activeFloorY - 4 && y <= activeFloorY + floorH + 4) {
        const doorSpacing = Math.min(width * 0.16, 52);
        const startX = width / 2 - ((doorsCount - 1) * doorSpacing) / 2;

        for (let d = 0; d < doorsCount; d++) {
          const doorX = startX + d * doorSpacing;
          if (Math.abs(x - doorX) < doorSpacing * 0.45) {
            openDoorAnimRef.current = { floor: currentFloor, doorIdx: d, progress: 0 };
            onPickDoor(d);
            break;
          }
        }
      }
    };

    canvas.addEventListener("click", handleCanvasClick);
    return () => {
      canvas.removeEventListener("click", handleCanvasClick);
    };
  }, [isPlaying, isGameOver, currentFloor, doorsCount, onPickDoor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

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

      // 1. Egyptian Temple Midnight Vault Background
      const bgGrad = ctx.createRadialGradient(width / 2, height * 0.45, 10, width / 2, height * 0.5, width * 0.7);
      if (isWinner) {
        bgGrad.addColorStop(0, "#2d1a04");
        bgGrad.addColorStop(0.6, "#170c02");
        bgGrad.addColorStop(1, "#0a0501");
      } else if (isGameOver) {
        bgGrad.addColorStop(0, "#2c0911");
        bgGrad.addColorStop(0.6, "#1a0409");
        bgGrad.addColorStop(1, "#090104");
      } else {
        bgGrad.addColorStop(0, "#131728");
        bgGrad.addColorStop(0.6, "#0a0c16");
        bgGrad.addColorStop(1, "#04050a");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Temple Ambient Pillar Light Beams
      ctx.strokeStyle = "rgba(245, 158, 11, 0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // 3. Render 8 Ascending Pyramid Tower Floors
      const totalFloors = 8;
      const floorH = (height - 32) / totalFloors;
      const baseY = height - 16;

      for (let f = 0; f < totalFloors; f++) {
        const floorY = baseY - (f + 1) * floorH;
        const isPassed = currentFloor > f;
        const isCurrent = isPlaying && currentFloor === f;
        const mult = multipliers[f];

        // Floor Platform Tier (Pyramid taper)
        const taperRatio = 1 - (f / totalFloors) * 0.22;
        const tierW = width * 0.90 * taperRatio;
        const tierX = width / 2 - tierW / 2;

        ctx.save();

        // Floor Base Slab
        if (isCurrent) {
          ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 2;
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 12;
        } else if (isPassed) {
          ctx.fillStyle = "rgba(16, 185, 129, 0.12)";
          ctx.strokeStyle = "#10b981";
          ctx.lineWidth = 1.5;
        } else {
          ctx.fillStyle = "rgba(15, 23, 42, 0.5)";
          ctx.strokeStyle = "rgba(51, 65, 85, 0.4)";
          ctx.lineWidth = 1;
        }

        ctx.beginPath();
        ctx.roundRect(tierX, floorY, tierW, floorH - 3, 8);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Left Floor Multiplier Pill
        ctx.fillStyle = isCurrent ? "#fbbf24" : isPassed ? "#34d399" : "#64748b";
        ctx.font = `bold ${isCurrent ? "11px" : "9.5px"} monospace`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(`F${f + 1} • ${mult}x`, tierX + 8, floorY + floorH / 2);

        // Right Chest / Mystery Doors
        const doorSpacing = Math.min(width * 0.16, 48);
        const startX = width / 2 - ((doorsCount - 1) * doorSpacing) / 2;

        for (let d = 0; d < doorsCount; d++) {
          const doorX = startX + d * doorSpacing;
          const doorY = floorY + floorH / 2;
          const doorW = Math.min(doorSpacing * 0.85, 38);
          const doorH = floorH - 8;

          ctx.save();
          ctx.translate(doorX, doorY);

          if (isCurrent) {
            // Pulsing Interactive Gold Chest
            ctx.fillStyle = "#f59e0b";
            ctx.strokeStyle = "#fef08a";
            ctx.lineWidth = 1.5;
            ctx.shadowColor = "#fbbf24";
            ctx.shadowBlur = 8 + Math.sin(time * 6) * 4;

            ctx.beginPath();
            ctx.roundRect(-doorW / 2, -doorH / 2, doorW, doorH, 6);
            ctx.fill();
            ctx.stroke();

            // Chest Keyhole / Icon
            ctx.fillStyle = "#000000";
            ctx.font = `bold ${Math.round(doorH * 0.55)}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("📦", 0, 0);
          } else if (isPassed) {
            // Opened Safe Relic Chest
            ctx.fillStyle = "#064e3b";
            ctx.strokeStyle = "#34d399";
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.roundRect(-doorW / 2, -doorH / 2, doorW, doorH, 6);
            ctx.fill();
            ctx.stroke();

            ctx.font = `bold ${Math.round(doorH * 0.55)}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("💎", 0, 0);
          } else {
            // Locked Stone Sarcophagus
            ctx.fillStyle = "#0f172a";
            ctx.strokeStyle = "#334155";
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.roundRect(-doorW / 2, -doorH / 2, doorW, doorH, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#475569";
            ctx.font = `bold ${Math.round(doorH * 0.45)}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🔒", 0, 0);
          }

          ctx.restore();
        }

        ctx.restore();
      }

      // 4. Render Celebration Sparks on Victory
      if (isWinner && sparks.length < 35) {
        for (let i = 0; i < 2; i++) {
          const dir = Math.random() * Math.PI * 2;
          const spd = Math.random() * 4 + 2;
          sparks.push({
            x: width / 2,
            y: baseY - totalFloors * floorH,
            vx: Math.cos(dir) * spd,
            vy: Math.sin(dir) * spd,
            life: 1.0,
            color: ["#fbbf24", "#34d399", "#f59e0b", "#ffffff"][Math.floor(Math.random() * 4)],
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

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentFloor, isPlaying, isGameOver, isWinner, difficulty, doorsCount, multipliers]);

  return (
    <div className="relative w-full h-full min-h-[280px] sm:min-h-[350px] md:min-h-[420px] flex items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl bg-[#04050a] border border-amber-500/25 shadow-2xl">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block cursor-pointer" />

      {/* Top Header Status Badges */}
      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-1.5 bg-[#0a0c16]/85 backdrop-blur-md border border-amber-500/30 px-2.5 py-1 rounded-full z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
        <span className="text-[9px] sm:text-[10px] font-black text-amber-300 font-mono tracking-wider uppercase">
          TREASURE TOWER • {difficulty}
        </span>
      </div>

      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[#0a0c16]/85 backdrop-blur-md border border-emerald-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1.5 z-10">
        <span className="text-[8px] sm:text-[9px] uppercase font-bold text-gray-400">Floor:</span>
        <span className="text-xs sm:text-sm font-black font-mono text-emerald-400">
          {currentFloor}/8 ({currentFloor > 0 ? `${multipliers[currentFloor - 1]}x` : "1.00x"})
        </span>
      </div>
    </div>
  );
};
