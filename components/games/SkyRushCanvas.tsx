"use client";

import React, { useEffect, useRef } from "react";

export interface JumpPassengerEvent {
  id: string;
  user: string;
  amount: number;
  multiplier: number;
  timestamp: number;
}

interface SkyRushCanvasProps {
  gameState: "COUNTDOWN" | "FLYING" | "CRASHED";
  multiplier: number;
  countdown: number;
  crashMultiplier?: number;
  cashoutEvents?: JumpPassengerEvent[];
}

interface Jumper {
  id: string;
  user: string;
  amount: number;
  multiplier: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  parachuteOpen: boolean;
  age: number;
  maxLife: number;
  canopyColor: string;
}

export const SkyRushCanvas: React.FC<SkyRushCanvasProps> = ({
  gameState,
  multiplier,
  countdown,
  crashMultiplier,
  cashoutEvents = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeJumpersRef = useRef<Jumper[]>([]);
  const handledEventIdsRef = useRef<Set<string>>(new Set());

  // Store current jet position in ref for jumper spawn
  const currentJetPosRef = useRef<{ x: number; y: number; angle: number }>({ x: 50, y: 300, angle: -0.35 });

  // Listen for new cashout events and spawn parachutists directly from the jet
  useEffect(() => {
    if (gameState !== "FLYING") {
      if (gameState === "COUNTDOWN") {
        activeJumpersRef.current = [];
        handledEventIdsRef.current.clear();
      }
      return;
    }

    const { x: jetX, y: jetY } = currentJetPosRef.current;
    const colors = ["#10b981", "#06b6d4", "#f59e0b", "#a855f7", "#ec4899", "#3b82f6"];

    cashoutEvents.forEach((ev) => {
      if (!handledEventIdsRef.current.has(ev.id)) {
        handledEventIdsRef.current.add(ev.id);

        // Spawn jumper from the back/side of the jet
        activeJumpersRef.current.push({
          id: ev.id,
          user: ev.user,
          amount: ev.amount,
          multiplier: ev.multiplier,
          x: jetX - 15 + (Math.random() - 0.5) * 10,
          y: jetY + (Math.random() - 0.5) * 8,
          vx: -(Math.random() * 2.0 + 2.0),
          vy: -(Math.random() * 2.0 + 1.2),
          parachuteOpen: false,
          age: 0,
          maxLife: 4.2, // 4.2 seconds on screen
          canopyColor: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    });
  }, [cashoutEvents, gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Starfield particles
    const stars: Array<{ x: number; y: number; size: number; speed: number; opacity: number }> = [];
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * 1000,
        y: Math.random() * 600,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 2 + 1,
        opacity: Math.random() * 0.7 + 0.3,
      });
    }

    // Exhaust particles
    const exhaustParticles: Array<{ x: number; y: number; size: number; life: number; color: string }> = [];

    // Crash explosion particles
    const crashParticles: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }> = [];
    let shockwaveRadius = 0;

    const render = () => {
      time += 0.02;

      // Handle Resize
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

      // 1. Background Sky Atmosphere Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      if (gameState === "CRASHED") {
        grad.addColorStop(0, "#1a080c");
        grad.addColorStop(0.6, "#120508");
        grad.addColorStop(1, "#080304");
      } else if (multiplier > 50) {
        grad.addColorStop(0, "#190e2b");
        grad.addColorStop(0.5, "#0e091a");
        grad.addColorStop(1, "#07050d");
      } else if (multiplier > 10) {
        grad.addColorStop(0, "#0c152e");
        grad.addColorStop(0.5, "#090d1f");
        grad.addColorStop(1, "#050711");
      } else {
        grad.addColorStop(0, "#091426");
        grad.addColorStop(0.6, "#070c17");
        grad.addColorStop(1, "#05070d");
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // 2. Parallax Stars / Cyber Grid
      const starSpeedMultiplier = gameState === "FLYING" ? Math.min(6, 1 + Math.log2(multiplier) * 1.2) : 0.5;

      stars.forEach((star) => {
        star.x -= star.speed * starSpeedMultiplier;
        star.y += star.speed * 0.4 * starSpeedMultiplier;

        if (star.x < 0) star.x = width;
        if (star.y > height) star.y = 0;

        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * (0.6 + Math.sin(time * 3 + star.x) * 0.3)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Cyber Coordinates Grid Lines
      ctx.strokeStyle = "rgba(56, 189, 248, 0.07)";
      ctx.lineWidth = 1;
      const gridSpacing = 60;
      const offsetX = (time * 40 * starSpeedMultiplier) % gridSpacing;
      const offsetY = (time * 20 * starSpeedMultiplier) % gridSpacing;

      for (let x = -gridSpacing + offsetX; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = offsetY; y < height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Origin Point
      const originX = 50;
      const originY = height - 50;

      // 4. Calculate Jet Flight Position along Exponential Curve
      let jetX = originX;
      let jetY = originY;
      let angle = -0.35; // radians

      if (gameState === "FLYING" || gameState === "CRASHED") {
        const progress = Math.min(1.0, (Math.log(multiplier) / Math.log(30)) * 0.85 + 0.1);
        const curveMaxX = width * 0.82;
        const curveMinY = height * 0.18;

        jetX = originX + (curveMaxX - originX) * Math.pow(progress, 0.75);
        jetY = originY - (originY - curveMinY) * Math.pow(progress, 1.25);

        const dx = 1;
        const dy = -1.25 * ((originY - curveMinY) / (curveMaxX - originX)) * Math.pow(progress, 0.25);
        angle = Math.atan2(dy, dx);

        currentJetPosRef.current = { x: jetX, y: jetY, angle };
      }

      // 5. Draw Flight Trajectory Curve & Altitude Area
      if (gameState === "FLYING" || gameState === "CRASHED") {
        ctx.beginPath();
        ctx.moveTo(originX, originY);

        const cp1x = originX + (jetX - originX) * 0.45;
        const cp1y = originY;
        const cp2x = originX + (jetX - originX) * 0.75;
        const cp2y = originY - (originY - jetY) * 0.4;

        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, jetX, jetY);
        ctx.lineTo(jetX, originY);
        ctx.closePath();

        const curveGrad = ctx.createLinearGradient(0, jetY, 0, originY);
        if (gameState === "CRASHED") {
          curveGrad.addColorStop(0, "rgba(225, 29, 72, 0.25)");
          curveGrad.addColorStop(1, "rgba(225, 29, 72, 0.01)");
        } else {
          curveGrad.addColorStop(0, "rgba(245, 158, 11, 0.35)");
          curveGrad.addColorStop(0.5, "rgba(234, 179, 8, 0.15)");
          curveGrad.addColorStop(1, "rgba(245, 158, 11, 0.01)");
        }
        ctx.fillStyle = curveGrad;
        ctx.fill();

        // Glowing Stroke
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, jetX, jetY);
        ctx.strokeStyle = gameState === "CRASHED" ? "#f43f5e" : "#fbbf24";
        ctx.lineWidth = 3.5;
        ctx.shadowColor = gameState === "CRASHED" ? "#e11d48" : "#f59e0b";
        ctx.shadowBlur = 16;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // 6. Draw Exhaust Particles (Jet Trail)
      if (gameState === "FLYING") {
        const tailX = jetX - Math.cos(angle) * 32;
        const tailY = jetY - Math.sin(angle) * 32;

        for (let i = 0; i < 3; i++) {
          exhaustParticles.push({
            x: tailX + (Math.random() - 0.5) * 6,
            y: tailY + (Math.random() - 0.5) * 6,
            size: Math.random() * 5 + 3,
            life: 1.0,
            color: Math.random() > 0.4 ? "rgba(251, 191, 36," : "rgba(56, 189, 248,",
          });
        }
      }

      for (let i = exhaustParticles.length - 1; i >= 0; i--) {
        const p = exhaustParticles[i];
        p.life -= 0.04;
        p.size *= 0.96;
        p.x -= 2;

        if (p.life <= 0) {
          exhaustParticles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = `${p.color} ${p.life})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 7. DRAW EJECTED PASSENGERS WITH PARACHUTES JUMPING FROM JET
      const jumpers = activeJumpersRef.current;
      for (let i = jumpers.length - 1; i >= 0; i--) {
        const j = jumpers[i];
        j.age += 0.02;

        // Open parachute after 0.25s jump delay
        if (j.age > 0.25) {
          j.parachuteOpen = true;
          // Apply parachute drag (gentle float down & drift with starfield)
          j.vy = Math.min(1.4, j.vy + 0.08);
          j.vx = - (1.6 + starSpeedMultiplier * 0.35);
        } else {
          // Freefall impulse
          j.vy += 0.25;
        }

        j.x += j.vx;
        j.y += j.vy;

        const lifeRatio = Math.max(0, 1 - j.age / j.maxLife);
        if (lifeRatio <= 0 || j.y > height + 50 || j.x < -100) {
          jumpers.splice(i, 1);
          continue;
        }

        // Draw Parachute and Passenger
        ctx.save();
        ctx.globalAlpha = Math.min(1, lifeRatio * 1.5);
        ctx.translate(j.x, j.y);

        // Subtle swaying motion
        const sway = Math.sin(time * 6 + j.x * 0.05) * 0.15;
        ctx.rotate(sway);

        if (j.parachuteOpen) {
          // Parachute Canopy Dome
          ctx.beginPath();
          ctx.arc(0, -22, 18, Math.PI, 0, false);
          ctx.closePath();

          const canopyGrad = ctx.createLinearGradient(0, -40, 0, -20);
          canopyGrad.addColorStop(0, j.canopyColor);
          canopyGrad.addColorStop(1, "rgba(16, 185, 129, 0.4)");
          ctx.fillStyle = canopyGrad;
          ctx.shadowColor = j.canopyColor;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Parachute Cords
          ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-16, -22);
          ctx.lineTo(0, -4);
          ctx.moveTo(16, -22);
          ctx.lineTo(0, -4);
          ctx.moveTo(0, -22);
          ctx.lineTo(0, -4);
          ctx.stroke();
        }

        // Passenger Character (Cyber Pilot Body)
        // Helmet / Head
        ctx.fillStyle = "#f8fafc";
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Visor
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(1.5, 0, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Suit Body
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(-3, 4, 6, 7);

        // Limbs
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-3, 6);
        ctx.lineTo(-6, 10);
        ctx.moveTo(3, 6);
        ctx.lineTo(6, 10);
        ctx.moveTo(-2, 11);
        ctx.lineTo(-4, 17);
        ctx.moveTo(2, 11);
        ctx.lineTo(4, 17);
        ctx.stroke();

        // Floating Cashout Bubble Badge above the parachute
        const badgeWidth = 96;
        const badgeHeight = 22;
        const badgeX = -badgeWidth / 2;
        const badgeY = j.parachuteOpen ? -54 : -32;

        // Bubble Background
        ctx.fillStyle = "rgba(6, 12, 24, 0.9)";
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 1.5;
        ctx.shadowColor = "#10b981";
        ctx.shadowBlur = 8;

        // Draw rounded rectangle
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 10);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // User Name text
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(j.user.slice(0, 8), badgeX + 7, badgeY + 14);

        // Multiplier / Win Amount in bright Emerald
        ctx.fillStyle = "#34d399";
        ctx.font = "bold 9.5px monospace";
        ctx.textAlign = "right";
        ctx.fillText(`${j.multiplier.toFixed(2)}x`, badgeX + badgeWidth - 6, badgeY + 14);

        ctx.restore();
      }

      // 8. Draw Cyber Supersonic Aircraft
      if (gameState !== "CRASHED") {
        ctx.save();
        ctx.translate(jetX, jetY);
        ctx.rotate(angle);

        // Engine Thruster Glow Flare
        if (gameState === "FLYING") {
          const flameLength = 22 + Math.sin(time * 25) * 8 + Math.min(20, Math.log2(multiplier) * 4);
          const flameGrad = ctx.createLinearGradient(-30, 0, -30 - flameLength, 0);
          flameGrad.addColorStop(0, "#ffffff");
          flameGrad.addColorStop(0.3, "#38bdf8");
          flameGrad.addColorStop(0.7, "#f59e0b");
          flameGrad.addColorStop(1, "transparent");

          ctx.fillStyle = flameGrad;
          ctx.beginPath();
          ctx.moveTo(-24, -4);
          ctx.lineTo(-24 - flameLength, 0);
          ctx.lineTo(-24, 4);
          ctx.closePath();
          ctx.fill();
        }

        // Aircraft Main Body
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 12;

        // Wings
        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-20, -18);
        ctx.lineTo(-12, -4);
        ctx.lineTo(-12, 4);
        ctx.lineTo(-20, 18);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#0ea5e9";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Fuselage
        const bodyGrad = ctx.createLinearGradient(24, 0, -24, 0);
        bodyGrad.addColorStop(0, "#f8fafc");
        bodyGrad.addColorStop(0.4, "#cbd5e1");
        bodyGrad.addColorStop(1, "#334155");

        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(28, 0);
        ctx.lineTo(-22, -7);
        ctx.lineTo(-26, 0);
        ctx.lineTo(-22, 7);
        ctx.closePath();
        ctx.fill();

        // Glowing Cockpit Glass
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.ellipse(4, 0, 7, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 9. Draw Crash Sonic Boom Explosion
      if (gameState === "CRASHED") {
        if (shockwaveRadius === 0) {
          for (let i = 0; i < 45; i++) {
            const speed = Math.random() * 8 + 2;
            const dir = Math.random() * Math.PI * 2;
            crashParticles.push({
              x: jetX,
              y: jetY,
              vx: Math.cos(dir) * speed,
              vy: Math.sin(dir) * speed,
              life: 1.0,
              color: ["#f43f5e", "#fb923c", "#facc15", "#ffffff"][Math.floor(Math.random() * 4)],
            });
          }
        }

        shockwaveRadius += 4;

        ctx.beginPath();
        ctx.arc(jetX, jetY, shockwaveRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(244, 63, 94, ${Math.max(0, 1 - shockwaveRadius / 120)})`;
        ctx.lineWidth = 3;
        ctx.stroke();

        for (let i = crashParticles.length - 1; i >= 0; i--) {
          const cp = crashParticles[i];
          cp.x += cp.vx;
          cp.y += cp.vy;
          cp.life -= 0.025;

          if (cp.life <= 0) {
            crashParticles.splice(i, 1);
            continue;
          }

          ctx.fillStyle = cp.color;
          ctx.beginPath();
          ctx.arc(cp.x, cp.y, Math.max(1, 4 * cp.life), 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        shockwaveRadius = 0;
        crashParticles.length = 0;
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, multiplier, countdown, crashMultiplier]);

  return (
    <div className="relative w-full h-full min-h-[300px] sm:min-h-[360px] md:min-h-[420px] flex items-center justify-center overflow-hidden rounded-2xl bg-[#06080e]">
      {/* HTML5 Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Dynamic Multiplier HUD Overlay */}
      {gameState === "FLYING" && (
        <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none select-none">
          <div className="text-6xl sm:text-7xl md:text-8xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-300 to-amber-500 drop-shadow-[0_10px_35px_rgba(245,158,11,0.4)] animate-pulse">
            {multiplier.toFixed(2)}x
          </div>
          <span className="text-xs font-mono font-black text-amber-300 uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 px-3 py-0.5 rounded-full mt-2">
            CURRENT FLIGHT ALTITUDE
          </span>
        </div>
      )}

      {/* Crash Banner Overlay */}
      {gameState === "CRASHED" && (
        <div className="relative z-10 flex flex-col items-center justify-center text-center p-4 space-y-2 pointer-events-none animate-bounce">
          <div className="text-xs font-mono font-bold text-rose-400 uppercase tracking-widest bg-rose-950/80 border border-rose-500/50 px-3 py-1 rounded-full">
            FLEW AWAY
          </div>
          <div className="text-6xl sm:text-7xl font-black font-mono text-rose-500 drop-shadow-[0_10px_30px_rgba(225,29,72,0.6)]">
            {(crashMultiplier || multiplier).toFixed(2)}x
          </div>
        </div>
      )}

      {/* Countdown Overlay with Concentric Perfectly Aligned Glow Ring */}
      {gameState === "COUNTDOWN" && (
        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-3 pointer-events-none">
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* SVG Animated Glow Progress Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                className="text-slate-800/80 stroke-current"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="#f59e0b"
                strokeWidth="4"
                strokeDasharray={276.46}
                strokeDashoffset={276.46 * (1 - Math.max(0, Math.min(10, countdown)) / 10.0)}
                strokeLinecap="round"
                fill="none"
                style={{
                  filter: "drop-shadow(0 0 8px rgba(245, 158, 11, 0.8))",
                  transition: "stroke-dashoffset 80ms linear",
                }}
              />
            </svg>

            {/* Perfectly Centered Badge */}
            <div className="w-20 h-20 rounded-full bg-[#0d1322]/90 border border-amber-500/40 flex flex-col items-center justify-center shadow-xl shadow-amber-500/20 backdrop-blur-md z-10">
              <span className="text-2xl font-black font-mono text-amber-400">{countdown.toFixed(1)}s</span>
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">PREPARING</span>
            </div>
          </div>

          <p className="text-xs font-bold text-gray-300 tracking-wide uppercase">
            Next Flight Departure In Progress
          </p>
        </div>
      )}
    </div>
  );
};
