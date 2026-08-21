"use client";

import React, { useEffect, useRef } from "react";
import { sound } from "@/lib/soundFx";

interface DiceXCanvasProps {
  isRolling: boolean;
  diceResult: number | null;
  targetNumber: number;
  rollMode: "OVER" | "UNDER";
  isWin: boolean | null;
}

export const DiceXCanvas: React.FC<DiceXCanvasProps> = ({
  isRolling,
  diceResult,
  targetNumber,
  rollMode,
  isWin,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rollTimeRef = useRef(0);
  const displayNumRef = useRef(targetNumber);
  const landingBounceRef = useRef(0);

  useEffect(() => {
    if (isRolling) {
      rollTimeRef.current = 0;
    } else if (diceResult !== null) {
      landingBounceRef.current = 1.0;
    }
  }, [isRolling, diceResult]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Golden win celebration particles and shockwaves
    const sparks: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }> = [];
    const shockwaves: Array<{ x: number; y: number; radius: number; maxRadius: number; alpha: number; color: string }> = [];

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

      // 1. Velvet Casino Table Gradient Background
      const bgGrad = ctx.createRadialGradient(width / 2, height * 0.45, 20, width / 2, height * 0.5, width * 0.7);
      if (isWin === true) {
        bgGrad.addColorStop(0, "#062e1e");
        bgGrad.addColorStop(0.6, "#031c12");
        bgGrad.addColorStop(1, "#010c07");
      } else if (isWin === false) {
        bgGrad.addColorStop(0, "#2c0911");
        bgGrad.addColorStop(0.6, "#1a0409");
        bgGrad.addColorStop(1, "#090104");
      } else {
        bgGrad.addColorStop(0, "#0a1936");
        bgGrad.addColorStop(0.6, "#050e21");
        bgGrad.addColorStop(1, "#020713");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Ambient Cyber Grid Floor with Perspective
      ctx.strokeStyle = "rgba(56, 189, 248, 0.05)";
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

      // 3. Victory Radial Sunburst Rays
      if (isWin === true) {
        ctx.save();
        ctx.translate(width / 2, height * 0.44);
        ctx.rotate(time * 0.2);
        for (let i = 0; i < 12; i++) {
          ctx.rotate((Math.PI * 2) / 12);
          ctx.fillStyle = "rgba(52, 211, 153, 0.04)";
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, width * 0.6, -0.12, 0.12);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // 4. Calculate 3D Dice Physics & Motion Trajectory
      const diceCenterX = width / 2;
      const baseDiceY = height * 0.44;
      const diceRadius = Math.min(width * 0.16, height * 0.22, 64);

      let diceY = baseDiceY;
      let rotAngle = 0;
      let squashX = 1.0;
      let squashY = 1.0;

      if (isRolling) {
        rollTimeRef.current += 0.05;
        // Arc Trajectory (Jumps in the air and tumbles)
        const jumpArc = Math.abs(Math.sin(rollTimeRef.current * Math.PI * 3.5)) * 42;
        diceY = baseDiceY - jumpArc;
        rotAngle = rollTimeRef.current * 12;
        displayNumRef.current = Math.floor(Math.random() * 100) + 1;

        // Motion trail sparks
        if (Math.random() < 0.6) {
          sparks.push({
            x: diceCenterX + (Math.random() - 0.5) * 30,
            y: diceY + (Math.random() - 0.5) * 30,
            vx: (Math.random() - 0.5) * 2,
            vy: Math.random() * 2 + 1,
            life: 0.8,
            color: "#38bdf8",
          });
        }
      } else if (landingBounceRef.current > 0) {
        // Elastic squash & stretch bounce on table impact
        landingBounceRef.current = Math.max(0, landingBounceRef.current - 0.06);
        const bounce = landingBounceRef.current;
        squashX = 1 + Math.sin(bounce * Math.PI * 2) * 0.18;
        squashY = 1 - Math.sin(bounce * Math.PI * 2) * 0.18;
        displayNumRef.current = diceResult !== null ? diceResult : targetNumber;

        if (bounce > 0.85 && shockwaves.length === 0) {
          shockwaves.push({
            x: diceCenterX,
            y: baseDiceY + diceRadius * 0.7,
            radius: 10,
            maxRadius: diceRadius * 2.2,
            alpha: 1.0,
            color: isWin ? "#34d399" : "#f43f5e",
          });
        }
      } else {
        // Gentle idle levitation
        diceY = baseDiceY + Math.sin(time * 2) * 4;
        rotAngle = Math.sin(time * 1.2) * 0.08;
        displayNumRef.current = diceResult !== null ? diceResult : targetNumber;
      }

      // 5. Table Dynamic Shadow
      const shadowHeight = isRolling ? Math.max(0.3, 1 - (baseDiceY - diceY) / 60) : 1;
      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      ctx.beginPath();
      ctx.ellipse(diceCenterX, baseDiceY + diceRadius * 0.75, diceRadius * 0.85 * shadowHeight, diceRadius * 0.28 * shadowHeight, 0, 0, Math.PI * 2);
      ctx.fill();

      // 6. Draw Table Shockwave Rings on Impact
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += 3.5;
        sw.alpha -= 0.045;
        if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
          shockwaves.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 2.5 * sw.alpha;
        ctx.beginPath();
        ctx.ellipse(sw.x, sw.y, sw.radius, sw.radius * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 7. Render 3D Isometric Casino Dice
      ctx.save();
      ctx.translate(diceCenterX, diceY);
      ctx.rotate(rotAngle);
      ctx.scale(squashX, squashY);

      // Color Schemes based on State
      let glowColor = "#f59e0b"; // Golden Amber Default
      let topFaceColor1 = "#334155";
      let topFaceColor2 = "#1e293b";
      let leftFaceColor1 = "#1e293b";
      let leftFaceColor2 = "#0f172a";
      let rightFaceColor1 = "#0f172a";
      let rightFaceColor2 = "#020617";
      let borderColor = "#fbbf24";
      let numberColor = "#fbbf24";

      if (isWin === true) {
        glowColor = "#10b981";
        topFaceColor1 = "#059669";
        topFaceColor2 = "#047857";
        leftFaceColor1 = "#047857";
        leftFaceColor2 = "#064e3b";
        rightFaceColor1 = "#064e3b";
        rightFaceColor2 = "#022c22";
        borderColor = "#34d399";
        numberColor = "#ffffff";
      } else if (isWin === false) {
        glowColor = "#f43f5e";
        topFaceColor1 = "#e11d48";
        topFaceColor2 = "#be123c";
        leftFaceColor1 = "#be123c";
        leftFaceColor2 = "#881337";
        rightFaceColor1 = "#881337";
        rightFaceColor2 = "#4c0519";
        borderColor = "#fb7185";
        numberColor = "#ffffff";
      } else if (isRolling) {
        glowColor = "#38bdf8";
        topFaceColor1 = "#0284c7";
        topFaceColor2 = "#0369a1";
        leftFaceColor1 = "#0369a1";
        leftFaceColor2 = "#075985";
        rightFaceColor1 = "#075985";
        rightFaceColor2 = "#0c4a6e";
        borderColor = "#38bdf8";
        numberColor = "#ffffff";
      }

      // Glowing Ambient Halo
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = isWin ? 35 : isRolling ? 25 : 15;

      const s = diceRadius; // Isometric radius
      const cos30 = Math.cos(Math.PI / 6); // ~0.866
      const sin30 = Math.sin(Math.PI / 6); // 0.5

      // --- FACE 1: TOP ISOMETRIC FACE ---
      const topGrad = ctx.createLinearGradient(0, -s, 0, 0);
      topGrad.addColorStop(0, topFaceColor1);
      topGrad.addColorStop(1, topFaceColor2);
      ctx.fillStyle = topGrad;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * cos30, -s * sin30);
      ctx.lineTo(0, 0);
      ctx.lineTo(-s * cos30, -s * sin30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // --- FACE 2: LEFT ISOMETRIC FACE ---
      const leftGrad = ctx.createLinearGradient(-s * cos30, 0, 0, s);
      leftGrad.addColorStop(0, leftFaceColor1);
      leftGrad.addColorStop(1, leftFaceColor2);
      ctx.fillStyle = leftGrad;

      ctx.beginPath();
      ctx.moveTo(-s * cos30, -s * sin30);
      ctx.lineTo(0, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * cos30, s * (1 - sin30));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Left Face Pip Dots (3 Pips)
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      const lpx = -s * cos30 * 0.5;
      const lpy = s * 0.35;
      [
        { x: lpx - 8, y: lpy - 10 },
        { x: lpx, y: lpy },
        { x: lpx + 8, y: lpy + 10 },
      ].forEach((pip) => {
        ctx.beginPath();
        ctx.arc(pip.x, pip.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // --- FACE 3: RIGHT ISOMETRIC FACE ---
      const rightGrad = ctx.createLinearGradient(0, 0, s * cos30, s);
      rightGrad.addColorStop(0, rightFaceColor1);
      rightGrad.addColorStop(1, rightFaceColor2);
      ctx.fillStyle = rightGrad;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(s * cos30, -s * sin30);
      ctx.lineTo(s * cos30, s * (1 - sin30));
      ctx.lineTo(0, s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right Face Pip Dots (5 Pips)
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      const rpx = s * cos30 * 0.5;
      const rpy = s * 0.35;
      [
        { x: rpx - 8, y: rpy - 8 },
        { x: rpx + 8, y: rpy - 8 },
        { x: rpx, y: rpy },
        { x: rpx - 8, y: rpy + 8 },
        { x: rpx + 8, y: rpy + 8 },
      ].forEach((pip) => {
        ctx.beginPath();
        ctx.arc(pip.x, pip.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // --- TOP FACE GIANT OUTCOME DISPLAY NUMBER ---
      ctx.shadowBlur = 0;
      ctx.fillStyle = numberColor;
      ctx.font = `black ${Math.round(s * 0.55)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${displayNumRef.current}`, 0, -s * sin30);

      ctx.restore();

      // 8. Render Victory Sparks
      if (isWin === true && sparks.length < 40) {
        for (let i = 0; i < 2; i++) {
          const dir = Math.random() * Math.PI * 2;
          const spd = Math.random() * 5 + 2;
          sparks.push({
            x: diceCenterX,
            y: diceY,
            vx: Math.cos(dir) * spd,
            vy: Math.sin(dir) * spd - 1,
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
        ctx.arc(sp.x, sp.y, 2.8 * sp.life, 0, Math.PI * 2);
        ctx.fill();
      }

      // 9. Bottom Linear Probability Target Bar on Canvas
      const barW = Math.min(width * 0.90, 420);
      const barH = 12;
      const barX = (width - barW) / 2;
      const barY = height - 28;

      const targetPercent = targetNumber / 100;
      const splitX = barX + barW * targetPercent;

      // Left Segment
      ctx.fillStyle = rollMode === "UNDER" ? "#10b981" : "#f43f5e";
      ctx.beginPath();
      ctx.roundRect(barX, barY, splitX - barX, barH, [6, 0, 0, 6]);
      ctx.fill();

      // Right Segment
      ctx.fillStyle = rollMode === "OVER" ? "#10b981" : "#f43f5e";
      ctx.beginPath();
      ctx.roundRect(splitX, barY, barX + barW - splitX, barH, [0, 6, 6, 0]);
      ctx.fill();

      // Pointer Triangle at Target
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(splitX, barY - 3);
      ctx.lineTo(splitX - 6, barY - 11);
      ctx.lineTo(splitX + 6, barY - 11);
      ctx.closePath();
      ctx.fill();

      // Result Marker Pin
      if (diceResult !== null) {
        const resultX = barX + (barW * diceResult) / 100;
        ctx.fillStyle = isWin ? "#34d399" : "#f43f5e";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(resultX, barY + barH / 2, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRolling, diceResult, targetNumber, rollMode, isWin]);

  return (
    <div className="relative w-full h-full min-h-[250px] sm:min-h-[310px] md:min-h-[380px] flex items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl bg-[#030712] border border-amber-500/20 shadow-2xl">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Top Header Status Badges */}
      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-1.5 bg-[#061024]/85 backdrop-blur-md border border-amber-500/30 px-2.5 py-1 rounded-full z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
        <span className="text-[9px] sm:text-[10px] font-black text-amber-300 font-mono tracking-wider uppercase">
          DICE X • 99.0% RTP
        </span>
      </div>

      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[#061024]/85 backdrop-blur-md border border-cyan-500/30 px-2.5 py-1 rounded-xl flex items-center gap-1.5 z-10">
        <span className="text-[8px] sm:text-[9px] uppercase font-bold text-gray-400">Target:</span>
        <span className="text-xs sm:text-sm font-black font-mono text-cyan-400">
          {rollMode} {targetNumber}
        </span>
      </div>
    </div>
  );
};
