"use client";

import React, { useEffect, useState, useRef } from "react";
import confetti from "canvas-confetti";
import { Sparkles, Trophy, Crown, Flame, Gem, Zap } from "lucide-react";
import { sound } from "@/lib/soundFx";

interface MaharajaBigWinModalProps {
  winAmount: number;
  betAmount: number;
  multiplier: number;
  onClose: () => void;
}

export const MaharajaBigWinModal: React.FC<MaharajaBigWinModalProps> = ({
  winAmount,
  betAmount,
  multiplier,
  onClose,
}) => {
  const [displayedWin, setDisplayedWin] = useState<number>(0);
  const [currentTier, setCurrentTier] = useState<"BIG" | "MEGA" | "SUPER" | "MAHARAJA">("BIG");
  const [isDone, setIsDone] = useState<boolean>(false);
  const animRef = useRef<number | null>(null);

  // Determine final tier (8x+ triggers Big Win celebration modal)
  const targetTier: "BIG" | "MEGA" | "SUPER" | "MAHARAJA" =
    multiplier >= 70 ? "MAHARAJA" : multiplier >= 35 ? "SUPER" : multiplier >= 18 ? "MEGA" : "BIG";

  useEffect(() => {
    // Play initial fanfare
    sound.playBigWinFanfare(targetTier);

    // Trigger explosive confetti burst
    const duration = targetTier === "MAHARAJA" ? 5000 : 3500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: targetTier === "MAHARAJA" ? 7 : 4,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.7 },
        colors: ["#FFD700", "#FFA500", "#FF4500", "#00FFFF", "#FF1493"],
      });
      confetti({
        particleCount: targetTier === "MAHARAJA" ? 7 : 4,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.7 },
        colors: ["#FFD700", "#FFA500", "#FF4500", "#00FFFF", "#FF1493"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Animate the rolling number counter from 0 to winAmount
    const startTime = performance.now();
    const countDuration = targetTier === "MAHARAJA" ? 3500 : 2500;

    let lastSoundTick = 0;

    const updateCounter = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / countDuration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(winAmount * easeProgress);

      setDisplayedWin(currentVal);

      // Sound tally ticks
      if (now - lastSoundTick > 70) {
        const pitchMod = 1 + progress * 0.8;
        sound.playCoinTally(pitchMod);
        lastSoundTick = now;
      }

      // Dynamic tier upgrade as number increases
      const currentMult = (currentVal / betAmount) || 0;
      if (currentMult >= 100) setCurrentTier("MAHARAJA");
      else if (currentMult >= 50) setCurrentTier("SUPER");
      else if (currentMult >= 30) setCurrentTier("MEGA");
      else setCurrentTier("BIG");

      if (progress < 1) {
        animRef.current = requestAnimationFrame(updateCounter);
      } else {
        setIsDone(true);
        sound.playWin();
      }
    };

    animRef.current = requestAnimationFrame(updateCounter);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [winAmount, betAmount, targetTier, multiplier]);

  // Quick skip / collect
  const handleCollect = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    onClose();
  };

  const getTierDetails = () => {
    switch (currentTier) {
      case "MAHARAJA":
        return {
          title: "MAHARAJA JACKPOT",
          subtitle: "ROYAL TREASURY UNLOCKED",
          badgeColor: "from-amber-400 via-yellow-200 to-amber-500",
          glowColor: "rgba(255, 215, 0, 0.9)",
          icon: <Crown className="w-12 h-12 text-yellow-300 animate-bounce" />,
          borderGrad: "from-yellow-400 via-amber-300 to-yellow-600",
        };
      case "SUPER":
        return {
          title: "SUPER WIN",
          subtitle: "MAGNIFICENT FORTUNE",
          badgeColor: "from-pink-500 via-rose-400 to-red-500",
          glowColor: "rgba(244, 63, 94, 0.9)",
          icon: <Gem className="w-12 h-12 text-pink-300 animate-pulse" />,
          borderGrad: "from-pink-500 via-rose-300 to-red-600",
        };
      case "MEGA":
        return {
          title: "MEGA WIN",
          subtitle: "ROYAL BOUNTY",
          badgeColor: "from-purple-500 via-fuchsia-400 to-indigo-600",
          glowColor: "rgba(168, 85, 247, 0.9)",
          icon: <Flame className="w-12 h-12 text-purple-300 animate-pulse" />,
          borderGrad: "from-purple-500 via-fuchsia-300 to-indigo-600",
        };
      default:
        return {
          title: "BIG WIN",
          subtitle: "EXCELLENT HIT",
          badgeColor: "from-amber-500 via-yellow-400 to-amber-600",
          glowColor: "rgba(245, 158, 11, 0.8)",
          icon: <Trophy className="w-12 h-12 text-amber-300 animate-pulse" />,
          borderGrad: "from-amber-400 via-yellow-300 to-amber-600",
        };
    }
  };

  const tierInfo = getTierDetails();

  return (
    <div
      onClick={handleCollect}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md cursor-pointer animate-in fade-in zoom-in-95 duration-200 select-none p-4"
    >
      {/* 3D Radiant Golden Aura Background Rays */}
      <div className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none">
        <div
          className="w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] rounded-full opacity-60 blur-3xl animate-pulse"
          style={{ background: `radial-gradient(circle, ${tierInfo.glowColor} 0%, transparent 70%)` }}
        />
        {/* Rotating Sunburst Rays */}
        <div
          className="absolute w-[800px] h-[800px] opacity-20 animate-spin pointer-events-none"
          style={{
            animationDuration: "25s",
            background:
              "conic-gradient(from 0deg, transparent 0deg 20deg, #FFD700 20deg 40deg, transparent 40deg 60deg, #FFD700 60deg 80deg, transparent 80deg 100deg, #FFD700 100deg 120deg, transparent 120deg 140deg, #FFD700 140deg 160deg, transparent 160deg 180deg, #FFD700 180deg 200deg, transparent 200deg 220deg, #FFD700 220deg 240deg, transparent 240deg 260deg, #FFD700 260deg 280deg, transparent 280deg 300deg, #FFD700 300deg 320deg, transparent 320deg 340deg, #FFD700 340deg 360deg)",
          }}
        />
      </div>

      {/* Floating 3D Gold Coins Layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="absolute text-2xl sm:text-3xl animate-bounce pointer-events-none opacity-80"
            style={{
              left: `${(i * 17 + 8) % 92}%`,
              top: `${(i * 23 + 12) % 85}%`,
              animationDuration: `${1.2 + (i % 5) * 0.3}s`,
              animationDelay: `${(i % 6) * 0.15}s`,
            }}
          >
            🪙
          </div>
        ))}
      </div>

      {/* Main Grand Trophy Card */}
      <div
        className="relative max-w-lg w-full bg-gradient-to-b from-[#1c1208] via-[#100b06] to-[#0a0704] border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_60px_rgba(245,158,11,0.6)] flex flex-col items-center gap-4 z-10"
        style={{
          boxShadow: `0 0 80px ${tierInfo.glowColor}, inset 0 0 30px rgba(255,215,0,0.2)`,
        }}
      >
        {/* Top Gold Corner Ornaments */}
        <div className="absolute top-2 left-3 text-amber-400 text-xs font-serif">⚜️</div>
        <div className="absolute top-2 right-3 text-amber-400 text-xs font-serif">⚜️</div>
        <div className="absolute bottom-2 left-3 text-amber-400 text-xs font-serif">⚜️</div>
        <div className="absolute bottom-2 right-3 text-amber-400 text-xs font-serif">⚜️</div>

        {/* Icon & Crown */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-amber-500/30 to-yellow-300/30 border border-amber-300/60 flex items-center justify-center shadow-lg">
          {tierInfo.icon}
        </div>

        {/* Dynamic Title Header */}
        <div className="space-y-1">
          <h2
            className={`text-3xl sm:text-5xl font-black uppercase tracking-wider bg-gradient-to-r ${tierInfo.badgeColor} bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] animate-pulse`}
          >
            {tierInfo.title}
          </h2>
          <p className="text-xs sm:text-sm font-bold tracking-widest text-amber-300/80 uppercase font-mono">
            {tierInfo.subtitle} • {multiplier.toFixed(1)}x
          </p>
        </div>

        {/* Massive Rolling Win Amount Display */}
        <div className="w-full bg-black/60 border border-amber-500/40 rounded-2xl py-4 sm:py-6 px-4 shadow-inner">
          <span className="text-xs sm:text-sm text-amber-400 uppercase font-bold tracking-wider block mb-1">
            Total Payout
          </span>
          <span className="text-4xl sm:text-6xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500 drop-shadow-[0_2px_15px_rgba(255,215,0,0.8)]">
            ₹{displayedWin.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Collect Button / Tap to Continue */}
        <button
          onClick={handleCollect}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/40 transition-transform active:scale-95 cursor-pointer border border-amber-200"
        >
          {isDone ? "COLLECT WIN ✨" : "TAP TO SKIP ⏩"}
        </button>
      </div>
    </div>
  );
};
