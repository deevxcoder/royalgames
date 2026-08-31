"use client";

import React, { useEffect, useRef } from "react";
import { RoosterCorner } from "@/lib/serverCockFightEngine";

interface FeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  rot: number;
  vRot: number;
}

interface TorchEmber {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

interface CockFightCanvasProps {
  isFighting: boolean;
  isGameOver: boolean;
  winner: RoosterCorner | null;
  redHp: number;
  blueHp: number;
  currentActionText: string;
  combatStage: number; // 0=idle, 1=clashing, 2=ko
}

export const CockFightCanvas: React.FC<CockFightCanvasProps> = ({
  isFighting,
  isGameOver,
  winner,
  redHp,
  blueHp,
  currentActionText,
  combatStage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const feathersRef = useRef<FeatherParticle[]>([]);
  const embersRef = useRef<TorchEmber[]>([]);
  const clashOffsetRef = useRef({ redX: 0, redY: 0, blueX: 0, blueY: 0 });

  // Spawn feather burst on hit
  useEffect(() => {
    if (isFighting && combatStage === 1) {
      const colors = ["#ef4444", "#f87171", "#3b82f6", "#60a5fa", "#ffffff", "#f59e0b"];
      for (let i = 0; i < 20; i++) {
        feathersRef.current.push({
          x: 200 + (Math.random() - 0.5) * 80,
          y: 180 + (Math.random() - 0.5) * 40,
          vx: (Math.random() - 0.5) * 6,
          vy: -Math.random() * 5 - 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 5 + 3,
          life: 1.0,
          maxLife: 1.0,
          rot: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.2,
        });
      }
    }
  }, [isFighting, combatStage, redHp, blueHp]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.04;

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

      // 1. Colosseum Sand Arena Background
      const bgGrad = ctx.createRadialGradient(width / 2, height * 0.55, 30, width / 2, height * 0.5, width * 0.7);
      bgGrad.addColorStop(0, "#2c150b");
      bgGrad.addColorStop(0.5, "#170803");
      bgGrad.addColorStop(1, "#080201");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Sand Battle Pit Ring
      const pitCenterX = width / 2;
      const pitCenterY = height * 0.62;
      const pitRadiusX = width * 0.42;
      const pitRadiusY = height * 0.26;

      ctx.save();
      ctx.beginPath();
      ctx.ellipse(pitCenterX, pitCenterY, pitRadiusX, pitRadiusY, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#3f1e0f";
      ctx.fill();
      ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.restore();

      // 2. Flaming Braziers & Embers
      const torchLeftX = width * 0.12;
      const torchRightX = width * 0.88;
      const torchY = height * 0.35;

      drawTorch(ctx, torchLeftX, torchY, time);
      drawTorch(ctx, torchRightX, torchY, time + 2);

      // Spawn and update embers
      if (Math.random() < 0.3) {
        embersRef.current.push({
          x: (Math.random() < 0.5 ? torchLeftX : torchRightX) + (Math.random() - 0.5) * 12,
          y: torchY - 10,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -Math.random() * 2 - 1,
          size: Math.random() * 3 + 1,
          alpha: 1.0,
        });
      }

      embersRef.current.forEach((emb, i) => {
        emb.x += emb.vx;
        emb.y += emb.vy;
        emb.alpha -= 0.02;
        if (emb.alpha <= 0) {
          embersRef.current.splice(i, 1);
          return;
        }
        ctx.fillStyle = `rgba(251, 146, 60, ${emb.alpha})`;
        ctx.beginPath();
        ctx.arc(emb.x, emb.y, emb.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Health Bars on Top HUD
      const barW = Math.min(140, width * 0.32);
      const barH = 12;
      const hudY = 24;

      // RED GARUDA HUD (Left)
      drawHealthBar(ctx, 20, hudY, barW, barH, redHp, "#ef4444", "🔴 GARUDA (RED)");

      // BLUE SHAMO HUD (Right)
      drawHealthBar(ctx, width - barW - 20, hudY, barW, barH, blueHp, "#3b82f6", "🔵 SHAMO (BLUE)");

      // VS Badge in Center Top
      ctx.save();
      ctx.fillStyle = "#f59e0b";
      ctx.font = "900 13px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("⚔️ VS", width / 2, hudY + 10);
      ctx.restore();

      // 4. Compute Rooster Positions & Jump / Strike Animations
      let redBaseX = width * 0.32;
      let blueBaseX = width * 0.68;
      let redBaseY = pitCenterY - 10;
      let blueBaseY = pitCenterY - 10;

      if (isFighting) {
        if (combatStage === 1) {
          // Lunging strike towards center
          const lunge = Math.sin(time * 12) * 28;
          redBaseX += Math.max(0, lunge);
          blueBaseX -= Math.max(0, -lunge);
          redBaseY -= Math.abs(Math.sin(time * 12)) * 18;
          blueBaseY -= Math.abs(Math.cos(time * 12)) * 18;
        }
      }

      if (isGameOver) {
        if (winner === "RED") {
          blueBaseY += 22; // Knocked down
        } else if (winner === "BLUE") {
          redBaseY += 22; // Knocked down
        }
      }

      // Draw Roosters
      drawRooster(ctx, redBaseX, redBaseY, "RED", isGameOver && winner !== "RED", time);
      drawRooster(ctx, blueBaseX, blueBaseY, "BLUE", isGameOver && winner !== "BLUE", time);

      // 5. Update & Render Flying Feathers
      feathersRef.current.forEach((f, i) => {
        f.x += f.vx;
        f.y += f.vy;
        f.vy += 0.12; // gravity
        f.rot += f.vRot;
        f.life -= 0.02;

        if (f.life <= 0) {
          feathersRef.current.splice(i, 1);
          return;
        }

        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        ctx.fillStyle = f.color;
        ctx.globalAlpha = f.life;
        ctx.beginPath();
        ctx.ellipse(0, 0, f.size * 1.8, f.size * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 6. Action Banner HUD at Bottom of Arena
      if (currentActionText) {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.65)";
        ctx.roundRect(width * 0.15, height - 42, width * 0.7, 30, 15);
        ctx.fill();
        ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
        ctx.stroke();

        ctx.fillStyle = "#fef08a";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText(currentActionText, width / 2, height - 23);
        ctx.restore();
      }

      // 7. Victory Banner on KO
      if (isGameOver && winner) {
        ctx.save();
        const winTitle = winner === "RED" ? "👑 GARUDA (RED) VICTORIOUS!" : "👑 SHAMO (BLUE) VICTORIOUS!";
        ctx.fillStyle = winner === "RED" ? "#ef4444" : "#3b82f6";
        ctx.font = "900 16px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = winner === "RED" ? "#ef4444" : "#3b82f6";
        ctx.shadowBlur = 18;
        ctx.fillText(winTitle, width / 2, height * 0.42);
        ctx.restore();
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isFighting, isGameOver, winner, redHp, blueHp, currentActionText, combatStage]);

  return (
    <div className="relative w-full h-full min-h-[300px] sm:min-h-[370px] md:min-h-[440px] flex items-center justify-center overflow-hidden rounded-3xl bg-[#0a0402] border border-amber-500/30 shadow-2xl">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
};

// Helper: Render Health Bar HUD
function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  hp: number,
  fillColor: string,
  label: string
) {
  ctx.save();
  // Label
  ctx.fillStyle = fillColor;
  ctx.font = "bold 11px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(label, x, y - 6);

  // Background
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Progress
  const fillW = Math.max(0, (hp / 100) * (w - 2));
  ctx.fillStyle = fillColor;
  ctx.roundRect(x + 1, y + 1, fillW, h - 2, 4);
  ctx.fill();

  // HP Text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "right";
  ctx.fillText(`${hp} HP`, x + w, y - 6);
  ctx.restore();
}

// Helper: Render Flaming Torch Brazier
function drawTorch(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  ctx.save();
  // Brazier stand
  ctx.fillStyle = "#78350f";
  ctx.fillRect(x - 4, y, 8, 30);
  ctx.beginPath();
  ctx.ellipse(x, y, 14, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#451a03";
  ctx.fill();

  // Flame glow
  ctx.shadowColor = "#ea580c";
  ctx.shadowBlur = 16 + Math.sin(time * 8) * 6;
  ctx.fillStyle = "#f97316";
  ctx.beginPath();
  ctx.ellipse(x, y - 8 + Math.sin(time * 6) * 3, 10, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fef08a";
  ctx.beginPath();
  ctx.ellipse(x, y - 6, 5, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Helper: Render Animated 2D Fighting Rooster
function drawRooster(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  corner: RoosterCorner,
  isKnockedDown: boolean,
  time: number
) {
  ctx.save();
  ctx.translate(x, y);

  if (isKnockedDown) {
    ctx.rotate(corner === "RED" ? -Math.PI / 2.2 : Math.PI / 2.2);
    ctx.globalAlpha = 0.65;
  }

  const isRed = corner === "RED";
  const facing = isRed ? 1 : -1;

  // Shadow under feet
  ctx.beginPath();
  ctx.ellipse(0, 24, 22, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fill();

  // Tail Feathers (Plumage)
  ctx.save();
  ctx.fillStyle = isRed ? "#991b1b" : "#1e3a8a";
  for (let t = 0; t < 3; t++) {
    ctx.beginPath();
    const tailOffset = (t - 1) * 8 + Math.sin(time * 5 + t) * 3;
    ctx.ellipse(-facing * (24 + t * 4), -8 + tailOffset, 16, 6, -facing * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Body
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 16, 0, 0, Math.PI * 2);
  ctx.fillStyle = isRed ? "#dc2626" : "#2563eb";
  ctx.fill();
  ctx.strokeStyle = isRed ? "#f87171" : "#60a5fa";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Wing
  ctx.beginPath();
  ctx.ellipse(-facing * 4, 2 + Math.sin(time * 8) * 3, 14, 9, facing * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = isRed ? "#b91c1c" : "#1d4ed8";
  ctx.fill();

  // Head & Neck
  ctx.beginPath();
  ctx.ellipse(facing * 14, -14, 10, 12, facing * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = isRed ? "#ef4444" : "#3b82f6";
  ctx.fill();

  // Red Comb on Top of Head
  ctx.fillStyle = "#dc2626";
  ctx.beginPath();
  ctx.ellipse(facing * 14, -26, 6, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(facing * 18, -24, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Beak
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.moveTo(facing * 22, -16);
  ctx.lineTo(facing * 32, -12);
  ctx.lineTo(facing * 22, -8);
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(facing * 16, -16, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(facing * 17, -16, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Golden Spurs & Claws
  ctx.strokeStyle = "#eab308";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-4, 12);
  ctx.lineTo(-6, 22);
  ctx.moveTo(4, 12);
  ctx.lineTo(6, 22);
  ctx.stroke();

  ctx.restore();
}
