"use client";

import React, { useEffect, useRef } from "react";
import { sound } from "@/lib/soundFx";

interface CricketBlastCanvasProps {
  gameState: "PREPARING" | "AIRBORNE" | "CAUGHT";
  multiplier: number;
  countdown: number;
  crashMultiplier?: number;
}

export const CricketBlastCanvas: React.FC<CricketBlastCanvasProps> = ({
  gameState,
  multiplier,
  countdown,
  crashMultiplier,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const airborneStartTimeRef = useRef<number | null>(null);
  const batSoundTriggeredRef = useRef(false);

  useEffect(() => {
    if (gameState === "AIRBORNE") {
      if (!airborneStartTimeRef.current) {
        airborneStartTimeRef.current = Date.now();
        batSoundTriggeredRef.current = false;
      }
    } else {
      airborneStartTimeRef.current = null;
      batSoundTriggeredRef.current = false;
    }
  }, [gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Crowd flashbulbs
    const flashbulbs = Array.from({ length: 45 }, () => ({
      x: Math.random() * 900,
      y: 120 + Math.random() * 150,
      timer: Math.random() * 100,
    }));

    // Ball fire trail particles
    const ballTrail: Array<{ x: number; y: number; size: number; life: number; color: string }> = [];

    // Hit impact sparks
    const hitSparks: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }> = [];

    // Catch shockwave particles
    const catchParticles: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }> = [];

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

      // 1. Night Cricket Stadium Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (gameState === "CAUGHT") {
        skyGrad.addColorStop(0, "#1c070d");
        skyGrad.addColorStop(0.6, "#120509");
        skyGrad.addColorStop(1, "#080204");
      } else {
        skyGrad.addColorStop(0, "#050e1f"); // Night stadium dark blue
        skyGrad.addColorStop(0.5, "#081b36");
        skyGrad.addColorStop(1, "#030812");
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Stadium Floodlight Beams
      const floodlights = [
        { x: width * 0.12, y: 35 },
        { x: width * 0.38, y: 25 },
        { x: width * 0.62, y: 25 },
        { x: width * 0.88, y: 35 },
      ];

      floodlights.forEach((fl) => {
        // Floodlight Tower Mast
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(fl.x - 3, fl.y, 6, height * 0.4);

        // Floodlight Bank (Glowing Lamps)
        ctx.fillStyle = "#e2e8f0";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.roundRect(fl.x - 18, fl.y - 12, 36, 16, 4);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Floodlight Volumetric Beam Cone
        const beamGrad = ctx.createLinearGradient(fl.x, fl.y, fl.x + (fl.x > width / 2 ? -70 : 70), height);
        beamGrad.addColorStop(0, "rgba(56, 189, 248, 0.22)");
        beamGrad.addColorStop(0.4, "rgba(56, 189, 248, 0.06)");
        beamGrad.addColorStop(1, "transparent");

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(fl.x, fl.y);
        ctx.lineTo(fl.x - 90, height);
        ctx.lineTo(fl.x + 90, height);
        ctx.closePath();
        ctx.fill();
      });

      // 3. Cheering Crowd Stands & Random Camera Flashbulbs
      ctx.fillStyle = "#0c1527";
      ctx.beginPath();
      ctx.ellipse(width / 2, height - 20, width * 0.65, 90, 0, 0, Math.PI * 2);
      ctx.fill();

      flashbulbs.forEach((fb) => {
        fb.timer -= 1;
        if (fb.timer <= 0) {
          fb.timer = Math.random() * 80 + 20;
          ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(fb.x, fb.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // 4. Stadium Pitch Ground (Green Grass)
      const grassGrad = ctx.createLinearGradient(0, height - 70, 0, height);
      grassGrad.addColorStop(0, "#064e3b");
      grassGrad.addColorStop(0.5, "#047857");
      grassGrad.addColorStop(1, "#022c22");
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, height - 55, width, 55);

      // Pitch Strip (Brown/Clay)
      ctx.fillStyle = "#78350f";
      ctx.fillRect(width * 0.1, height - 42, 140, 18);

      // 5. Batter & Wickets at Crease
      const creaseX = width * 0.16;
      const creaseY = height - 45;

      // 3 Wickets Behind Batter
      ctx.fillStyle = "#fef08a";
      for (let s = -4; s <= 4; s += 4) {
        ctx.fillRect(creaseX - 22 + s, creaseY - 24, 2, 24);
      }

      // Calculate Strike Timeline
      const timeSinceAirborne = airborneStartTimeRef.current ? (Date.now() - airborneStartTimeRef.current) / 1000 : 0;
      const isDeliveryPhase = gameState === "AIRBORNE" && timeSinceAirborne < 0.35;
      const isHitMoment = gameState === "AIRBORNE" && timeSinceAirborne >= 0.35 && timeSinceAirborne < 0.45;
      const isFlightPhase = gameState === "AIRBORNE" && timeSinceAirborne >= 0.35;

      // Trigger bat crack sound at impact
      if (isHitMoment && !batSoundTriggeredRef.current) {
        batSoundTriggeredRef.current = true;
        sound.playBatCrack();

        // Spawn golden impact spark burst
        for (let i = 0; i < 25; i++) {
          const dir = Math.random() * Math.PI * 2;
          const spd = Math.random() * 7 + 3;
          hitSparks.push({
            x: creaseX + 14,
            y: creaseY - 18,
            vx: Math.cos(dir) * spd,
            vy: Math.sin(dir) * spd,
            life: 1.0,
            color: ["#ffffff", "#fbbf24", "#f59e0b", "#f43f5e"][Math.floor(Math.random() * 4)],
          });
        }
      }

      // 6. Draw Animated Batter
      ctx.save();
      ctx.translate(creaseX, creaseY);

      // Batter Head (Helmet)
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(0, -32, 6.5, 0, Math.PI * 2);
      ctx.fill();

      // Batter White Jersey Body
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.moveTo(-4, -26);
      ctx.lineTo(4, -26);
      ctx.lineTo(6, -10);
      ctx.lineTo(-6, -10);
      ctx.closePath();
      ctx.fill();

      // Batter Leg Pads
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(-5, -10, 4, 12);
      ctx.fillRect(1, -10, 4, 12);

      // Batter Bat Swing Motion
      let batAngle = 0.3; // Default stance
      if (gameState === "PREPARING") {
        // Tapping bat on ground
        batAngle = 0.3 + Math.sin(time * 8) * 0.12;
      } else if (isDeliveryPhase) {
        // Backswing loading power
        const swingProgress = timeSinceAirborne / 0.35;
        batAngle = 0.3 - swingProgress * 1.4; // Loads up to -1.1 rad
      } else if (isFlightPhase || gameState === "CAUGHT") {
        // Follow-through high finish
        batAngle = -1.2;
      }

      ctx.save();
      ctx.translate(6, -16);
      ctx.rotate(batAngle);
      ctx.fillStyle = "#b45309";
      ctx.fillRect(0, -22, 4.5, 26);
      ctx.restore();

      ctx.restore();

      // 7. Draw Ball Position & Motion
      let ballX = creaseX + 120;
      let ballY = creaseY - 20;

      if (gameState === "PREPARING") {
        // Bowler holding ball at run-up
        ballX = creaseX + 120;
        ballY = creaseY - 14;
      } else if (isDeliveryPhase) {
        // Bowler delivers ball in towards bat
        const deliveryProgress = Math.min(1.0, timeSinceAirborne / 0.35);
        ballX = (creaseX + 120) - ((creaseX + 120) - (creaseX + 14)) * deliveryProgress;
        // Pitch bounce curve
        ballY = (creaseY - 20) + Math.sin(deliveryProgress * Math.PI) * 12;
      } else if (isFlightPhase || gameState === "CAUGHT") {
        // Soaring into the sky from bat contact point!
        const flightTime = timeSinceAirborne - 0.35;
        const progress = Math.min(1.0, (Math.log(multiplier) / Math.log(25)) * 0.85 + 0.1);
        const curveMaxX = width * 0.85;
        const curveMinY = height * 0.16;

        ballX = (creaseX + 14) + (curveMaxX - (creaseX + 14)) * Math.pow(progress, 0.75);
        ballY = (creaseY - 20) - ((creaseY - 20) - curveMinY) * Math.pow(progress, 1.25);

        // Spawn golden fire tracer particles
        if (gameState === "AIRBORNE") {
          for (let i = 0; i < 3; i++) {
            ballTrail.push({
              x: ballX + (Math.random() - 0.5) * 4,
              y: ballY + (Math.random() - 0.5) * 4,
              size: Math.random() * 5 + 2,
              life: 1.0,
              color: Math.random() > 0.3 ? "#f59e0b" : "#f43f5e",
            });
          }
        }
      }

      // Draw Flight Parabolic Trajectory Arc
      if (isFlightPhase || gameState === "CAUGHT") {
        ctx.beginPath();
        ctx.moveTo(creaseX + 14, creaseY - 20);
        ctx.quadraticCurveTo((creaseX + ballX) / 2, ballY - 20, ballX, ballY);
        ctx.strokeStyle = gameState === "CAUGHT" ? "rgba(244, 63, 94, 0.6)" : "rgba(245, 158, 11, 0.7)";
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Ball Trail Particles
      for (let i = ballTrail.length - 1; i >= 0; i--) {
        const p = ballTrail[i];
        p.life -= 0.04;
        p.size *= 0.95;

        if (p.life <= 0) {
          ballTrail.splice(i, 1);
          continue;
        }

        ctx.fillStyle = `${p.color}`;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Draw Hit Impact Sparks
      for (let i = hitSparks.length - 1; i >= 0; i--) {
        const sp = hitSparks[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.life -= 0.04;

        if (sp.life <= 0) {
          hitSparks.splice(i, 1);
          continue;
        }

        ctx.fillStyle = sp.color;
        ctx.shadowColor = sp.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, Math.max(1, 4 * sp.life), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 8. Draw Cricket Ball (Red leather with spinning seam)
      if (gameState !== "CAUGHT") {
        ctx.save();
        ctx.translate(ballX, ballY);
        ctx.rotate(time * (isFlightPhase ? 20 : 8));

        ctx.shadowColor = isFlightPhase ? "#f59e0b" : "#f43f5e";
        ctx.shadowBlur = isFlightPhase ? 14 : 6;

        // Red Leather Ball
        ctx.fillStyle = "#e11d48";
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        // White Seam Stitch
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 7, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();

        ctx.restore();
      }

      // 9. Caught Out Event Particles
      if (gameState === "CAUGHT") {
        if (catchParticles.length === 0) {
          for (let i = 0; i < 35; i++) {
            const dir = Math.random() * Math.PI * 2;
            const speed = Math.random() * 6 + 2;
            catchParticles.push({
              x: ballX,
              y: ballY,
              vx: Math.cos(dir) * speed,
              vy: Math.sin(dir) * speed,
              life: 1.0,
              color: ["#f43f5e", "#fb923c", "#facc15"][Math.floor(Math.random() * 3)],
            });
          }
        }

        for (let i = catchParticles.length - 1; i >= 0; i--) {
          const cp = catchParticles[i];
          cp.x += cp.vx;
          cp.y += cp.vy;
          cp.life -= 0.03;

          if (cp.life <= 0) {
            catchParticles.splice(i, 1);
            continue;
          }

          ctx.fillStyle = cp.color;
          ctx.beginPath();
          ctx.arc(cp.x, cp.y, Math.max(1, 4 * cp.life), 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        catchParticles.length = 0;
      }

      // 10. Countdown Preparing Overlay
      if (gameState === "PREPARING") {
        ctx.save();
        ctx.translate(width / 2, height / 2);

        const progress = Math.max(0, Math.min(1.0, countdown / 10.0));
        ctx.beginPath();
        ctx.arc(0, 0, 50, -Math.PI / 2, -Math.PI / 2 + (1 - progress) * Math.PI * 2, false);
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 4;
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();
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
    <div className="relative w-full h-full min-h-[220px] sm:min-h-[280px] md:min-h-[360px] flex items-center justify-center overflow-hidden rounded-2xl sm:rounded-3xl bg-[#030712] border border-amber-500/20 shadow-2xl">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Multiplier Ascending HUD */}
      {gameState === "AIRBORNE" && (
        <div className="relative z-10 flex flex-col items-center justify-center pointer-events-none select-none">
          <div className="text-5xl sm:text-6xl md:text-7xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-300 to-amber-500 drop-shadow-[0_10px_35px_rgba(245,158,11,0.4)] animate-pulse">
            {multiplier.toFixed(2)}x
          </div>
          <span className="text-[10px] sm:text-xs font-mono font-black text-amber-300 uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 px-3 py-0.5 rounded-full mt-1.5 backdrop-blur-sm">
            🏏 LOFTED SHOT ALTITUDE
          </span>
        </div>
      )}

      {/* Caught Out Banner Overlay */}
      {gameState === "CAUGHT" && (
        <div className="relative z-10 flex flex-col items-center justify-center text-center p-3 space-y-1 pointer-events-none animate-bounce">
          <div className="text-[10px] sm:text-xs font-mono font-black text-rose-400 uppercase tracking-widest bg-rose-950/90 border border-rose-500/60 px-3.5 py-1 rounded-full shadow-lg">
            CAUGHT AT BOUNDARY
          </div>
          <div className="text-5xl sm:text-6xl font-black font-mono text-rose-500 drop-shadow-[0_10px_30px_rgba(225,29,72,0.6)]">
            {(crashMultiplier || multiplier).toFixed(2)}x
          </div>
        </div>
      )}

      {/* Countdown Preparing Overlay */}
      {gameState === "PREPARING" && (
        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-2 pointer-events-none">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#081224]/85 border border-amber-500/40 flex flex-col items-center justify-center shadow-xl shadow-amber-500/20 backdrop-blur-md">
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-400">{countdown.toFixed(1)}s</span>
            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">NEXT BALL</span>
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-gray-300 tracking-wide uppercase">
            Bowler Approaching Crease...
          </p>
        </div>
      )}
    </div>
  );
};
