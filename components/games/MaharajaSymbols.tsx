"use client";

import React from "react";

export type SymbolId =
  | "ganesha"
  | "peacock"
  | "diya"
  | "lotus"
  | "tajmahal"
  | "ring"
  | "ace"
  | "king"
  | "queen"
  | "jack";

export interface SymbolDef {
  id: SymbolId;
  name: string;
  payouts: { 3: number; 4: number; 5: number }; // multiplier of line bet
  isWild?: boolean;
  isScatter?: boolean;
  color: string;
  glowColor: string;
  badge?: string;
}

export const SYMBOLS_CONFIG: Record<SymbolId, SymbolDef> = {
  ganesha: {
    id: "ganesha",
    name: "Golden Ganesha",
    payouts: { 3: 30, 4: 100, 5: 300 },
    isWild: true,
    color: "#f59e0b",
    glowColor: "rgba(245, 158, 11, 0.8)",
    badge: "WILD 2X",
  },
  tajmahal: {
    id: "tajmahal",
    name: "Taj Mahal Palace",
    payouts: { 3: 2, 4: 15, 5: 30 },
    isScatter: true,
    color: "#38bdf8",
    glowColor: "rgba(56, 189, 248, 0.8)",
    badge: "SCATTER",
  },
  peacock: {
    id: "peacock",
    name: "Royal Peacock",
    payouts: { 3: 15, 4: 50, 5: 150 },
    color: "#06b6d4",
    glowColor: "rgba(6, 182, 212, 0.7)",
  },
  lotus: {
    id: "lotus",
    name: "Lotus Bloom",
    payouts: { 3: 10, 4: 30, 5: 100 },
    color: "#ec4899",
    glowColor: "rgba(236, 72, 153, 0.7)",
  },
  diya: {
    id: "diya",
    name: "Sacred Diya",
    payouts: { 3: 8, 4: 20, 5: 60 },
    color: "#f97316",
    glowColor: "rgba(249, 115, 22, 0.7)",
  },
  ring: {
    id: "ring",
    name: "Emerald Jewel",
    payouts: { 3: 5, 4: 15, 5: 40 },
    color: "#10b981",
    glowColor: "rgba(16, 185, 129, 0.7)",
  },
  ace: {
    id: "ace",
    name: "Ace of Gold",
    payouts: { 3: 3, 4: 8, 5: 25 },
    color: "#eab308",
    glowColor: "rgba(234, 179, 8, 0.5)",
  },
  king: {
    id: "king",
    name: "Royal King",
    payouts: { 3: 2.5, 4: 6, 5: 20 },
    color: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.5)",
  },
  queen: {
    id: "queen",
    name: "Royal Queen",
    payouts: { 3: 2, 4: 5, 5: 15 },
    color: "#f43f5e",
    glowColor: "rgba(244, 63, 94, 0.5)",
  },
  jack: {
    id: "jack",
    name: "Royal Jack",
    payouts: { 3: 1.5, 4: 4, 5: 10 },
    color: "#3b82f6",
    glowColor: "rgba(59, 130, 246, 0.5)",
  },
};

// SVG Symbol Renderer Component
export const MaharajaSymbolIcon: React.FC<{
  symbolId: SymbolId;
  className?: string;
  isWinning?: boolean;
}> = ({ symbolId, className = "w-full h-full", isWinning = false }) => {
  const glowStyle = isWinning
    ? {
        filter: "drop-shadow(0 0 12px rgba(245, 158, 11, 0.9)) drop-shadow(0 0 20px rgba(255, 215, 0, 0.6))",
        transform: "scale(1.06)",
        transition: "transform 0.3s ease, filter 0.3s ease",
      }
    : {};

  switch (symbolId) {
    case "ganesha":
      return (
        <div className={`relative flex items-center justify-center p-1.5 ${className}`} style={glowStyle}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="ganeshaGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF2A3" />
                <stop offset="30%" stopColor="#F59E0B" />
                <stop offset="70%" stopColor="#B45309" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>
              <linearGradient id="ganeshaRuby" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6B8B" />
                <stop offset="100%" stopColor="#990024" />
              </linearGradient>
              <linearGradient id="ganeshaEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6EE7B7" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
              <radialGradient id="ganeshaAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FDE047" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Glowing Halo */}
            <circle cx="50" cy="50" r="46" fill="url(#ganeshaAura)" />

            {/* Left Ear */}
            <path
              d="M 28 32 C 10 26 6 48 14 62 C 22 72 32 64 30 50 Z"
              fill="url(#ganeshaGold)"
              stroke="#FDE68A"
              strokeWidth="1.2"
            />
            {/* Right Ear */}
            <path
              d="M 72 32 C 90 26 94 48 86 62 C 78 72 68 64 70 50 Z"
              fill="url(#ganeshaGold)"
              stroke="#FDE68A"
              strokeWidth="1.2"
            />

            {/* Main Head */}
            <path
              d="M 32 36 C 32 20 68 20 68 36 C 70 48 64 64 56 68 C 54 78 58 88 50 94 C 44 98 42 86 46 76 C 36 66 30 50 32 36 Z"
              fill="url(#ganeshaGold)"
              stroke="#FEF08A"
              strokeWidth="1.5"
            />

            {/* Trunk Curved Tip with Golden Modak / Swirl */}
            <path
              d="M 47 70 Q 45 84 52 90 Q 56 94 52 96 Q 44 96 43 86 Q 44 74 47 70 Z"
              fill="url(#ganeshaGold)"
              stroke="#FEF08A"
              strokeWidth="1.2"
            />
            <circle cx="52" cy="94" r="3.5" fill="url(#ganeshaRuby)" stroke="#FFD700" strokeWidth="0.8" />

            {/* Tusks */}
            <path d="M 37 62 L 30 68 L 36 66 Z" fill="#FFFBEB" stroke="#D97706" strokeWidth="0.8" />
            <path d="M 63 62 L 70 68 L 64 66 Z" fill="#FFFBEB" stroke="#D97706" strokeWidth="0.8" />

            {/* Royal Crown / Mukut */}
            <path
              d="M 30 30 L 50 6 L 70 30 Q 50 25 30 30 Z"
              fill="url(#ganeshaGold)"
              stroke="#FFF"
              strokeWidth="1.5"
            />
            {/* Crown Gem */}
            <polygon points="50,12 55,20 50,28 45,20" fill="url(#ganeshaRuby)" stroke="#FFD700" strokeWidth="1" />
            <circle cx="38" cy="24" r="2.5" fill="url(#ganeshaEmerald)" />
            <circle cx="62" cy="24" r="2.5" fill="url(#ganeshaEmerald)" />

            {/* Forehead Tilak */}
            <path d="M 46 36 L 54 36 L 50 48 Z" fill="url(#ganeshaRuby)" />
            <line x1="43" y1="34" x2="57" y2="34" stroke="#FEF08A" strokeWidth="1.5" />
            <circle cx="50" cy="38" r="1.5" fill="#FEF08A" />

            {/* Eyes */}
            <path d="M 36 44 Q 42 42 44 46" stroke="#451A03" strokeWidth="1.8" fill="none" />
            <path d="M 64 44 Q 58 42 56 46" stroke="#451A03" strokeWidth="1.8" fill="none" />
          </svg>
          <span className="absolute bottom-0 text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black px-1.5 py-0.2 rounded-md shadow-md">
            WILD 2x
          </span>
        </div>
      );

    case "peacock":
      return (
        <div className={`relative flex items-center justify-center p-1.5 ${className}`} style={glowStyle}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="peacockBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="50%" stopColor="#0284C7" />
                <stop offset="100%" stopColor="#0C4A6E" />
              </linearGradient>
              <linearGradient id="peacockFeather" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="40%" stopColor="#059669" />
                <stop offset="80%" stopColor="#0284C7" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>

            {/* Feather Fan (Radial Arch) */}
            {[
              { angle: -65, x: 20, y: 32 },
              { angle: -45, x: 28, y: 22 },
              { angle: -25, x: 38, y: 16 },
              { angle: 0, x: 50, y: 12 },
              { angle: 25, x: 62, y: 16 },
              { angle: 45, x: 72, y: 22 },
              { angle: 65, x: 80, y: 32 },
            ].map((f, i) => (
              <g key={i}>
                <ellipse
                  cx={f.x}
                  cy={f.y}
                  rx="7"
                  ry="12"
                  transform={`rotate(${f.angle} ${f.x} ${f.y})`}
                  fill="url(#peacockFeather)"
                  stroke="#FDE047"
                  strokeWidth="1"
                />
                <circle cx={f.x} cy={f.y} r="3" fill="#0C4A6E" />
                <circle cx={f.x} cy={f.y} r="1.5" fill="#38BDF8" />
              </g>
            ))}

            {/* Inner Fan Layer */}
            {[
              { angle: -35, x: 35, y: 32 },
              { angle: -15, x: 44, y: 26 },
              { angle: 15, x: 56, y: 26 },
              { angle: 35, x: 65, y: 32 },
            ].map((f, i) => (
              <ellipse
                key={i}
                cx={f.x}
                cy={f.y}
                rx="6"
                ry="10"
                transform={`rotate(${f.angle} ${f.x} ${f.y})`}
                fill="url(#peacockFeather)"
                stroke="#67E8F9"
                strokeWidth="0.8"
              />
            ))}

            {/* Peacock Body */}
            <path
              d="M 44 45 Q 38 60 42 75 Q 50 82 58 75 Q 62 60 56 45 Z"
              fill="url(#peacockBlue)"
              stroke="#38BDF8"
              strokeWidth="1.2"
            />
            {/* Neck & Head */}
            <path
              d="M 48 50 Q 48 38 50 34 Q 54 38 52 50 Z"
              fill="url(#peacockBlue)"
              stroke="#7DD3FC"
              strokeWidth="1"
            />
            <circle cx="50" cy="32" r="4.5" fill="url(#peacockBlue)" stroke="#BAE6FD" strokeWidth="1" />
            <polygon points="50,32 54,34 50,36" fill="#F59E0B" />
            <circle cx="48.5" cy="31" r="1" fill="#FFF" />

            {/* Head Crest */}
            <line x1="50" y1="28" x2="46" y2="22" stroke="#38BDF8" strokeWidth="1" />
            <circle cx="46" cy="21" r="1.5" fill="#F59E0B" />
            <line x1="50" y1="28" x2="50" y2="20" stroke="#38BDF8" strokeWidth="1" />
            <circle cx="50" cy="19" r="1.5" fill="#F59E0B" />
            <line x1="50" y1="28" x2="54" y2="22" stroke="#38BDF8" strokeWidth="1" />
            <circle cx="54" cy="21" r="1.5" fill="#F59E0B" />

            {/* Legs */}
            <line x1="46" y1="78" x2="44" y2="90" stroke="#F59E0B" strokeWidth="1.5" />
            <line x1="54" y1="78" x2="56" y2="90" stroke="#F59E0B" strokeWidth="1.5" />
          </svg>
        </div>
      );

    case "diya":
      return (
        <div className={`relative flex items-center justify-center p-1.5 ${className}`} style={glowStyle}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="diyaGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>
              <linearGradient id="flameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#EA580C" />
                <stop offset="30%" stopColor="#F59E0B" />
                <stop offset="70%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </linearGradient>
              <radialGradient id="flameAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FDE047" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Flame Glow */}
            <circle cx="50" cy="30" r="28" fill="url(#flameAura)" />

            {/* Dancing Flame */}
            <path
              d="M 50 10 C 42 22 40 34 46 44 C 48 48 52 48 54 44 C 60 34 58 22 50 10 Z"
              fill="url(#flameGrad)"
              className="animate-pulse"
            />
            <path
              d="M 50 20 C 46 28 46 34 48 40 C 49 42 51 42 52 40 C 54 34 54 28 50 20 Z"
              fill="#FFFFFF"
            />

            {/* Golden Bowl / Diya Vessel */}
            <path
              d="M 16 52 Q 50 48 84 52 C 86 68 76 80 50 82 C 24 80 14 68 16 52 Z"
              fill="url(#diyaGold)"
              stroke="#FEF08A"
              strokeWidth="1.5"
            />

            {/* Base Stand */}
            <path
              d="M 38 80 L 32 92 Q 50 94 68 92 L 62 80 Z"
              fill="url(#diyaGold)"
              stroke="#FEF08A"
              strokeWidth="1.2"
            />

            {/* Vessel Filigree & Jewels */}
            <ellipse cx="50" cy="53" rx="32" ry="6" fill="#78350F" opacity="0.6" />
            <circle cx="50" cy="66" r="4.5" fill="#10B981" stroke="#FEF08A" strokeWidth="1" />
            <circle cx="34" cy="62" r="3" fill="#EC4899" stroke="#FEF08A" strokeWidth="0.8" />
            <circle cx="66" cy="62" r="3" fill="#EC4899" stroke="#FEF08A" strokeWidth="0.8" />
            <path d="M 22 56 Q 50 72 78 56" stroke="#FEF08A" strokeWidth="1.2" fill="none" />
          </svg>
        </div>
      );

    case "lotus":
      return (
        <div className={`relative flex items-center justify-center p-1.5 ${className}`} style={glowStyle}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="lotusPink" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#BE185D" />
                <stop offset="40%" stopColor="#EC4899" />
                <stop offset="80%" stopColor="#F472B6" />
                <stop offset="100%" stopColor="#FDF2F8" />
              </linearGradient>
              <linearGradient id="lotusCore" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>

            {/* Outer Petals */}
            <path
              d="M 50 82 C 20 84 8 68 10 52 C 24 50 36 64 50 82 Z"
              fill="url(#lotusPink)"
              stroke="#FCE7F3"
              strokeWidth="0.8"
            />
            <path
              d="M 50 82 C 80 84 92 68 90 52 C 76 50 64 64 50 82 Z"
              fill="url(#lotusPink)"
              stroke="#FCE7F3"
              strokeWidth="0.8"
            />

            {/* Mid Petals */}
            <path
              d="M 50 82 C 25 76 18 42 28 26 C 38 42 45 62 50 82 Z"
              fill="url(#lotusPink)"
              stroke="#FCE7F3"
              strokeWidth="1"
            />
            <path
              d="M 50 82 C 75 76 82 42 72 26 C 62 42 55 62 50 82 Z"
              fill="url(#lotusPink)"
              stroke="#FCE7F3"
              strokeWidth="1"
            />

            {/* Central High Petals */}
            <path
              d="M 50 82 C 34 68 34 32 44 14 C 48 36 50 60 50 82 Z"
              fill="url(#lotusPink)"
              stroke="#FFF"
              strokeWidth="1.2"
            />
            <path
              d="M 50 82 C 66 68 66 32 56 14 C 52 36 50 60 50 82 Z"
              fill="url(#lotusPink)"
              stroke="#FFF"
              strokeWidth="1.2"
            />
            <path
              d="M 50 82 C 40 58 40 26 50 10 C 60 26 60 58 50 82 Z"
              fill="url(#lotusPink)"
              stroke="#FFF"
              strokeWidth="1.5"
            />

            {/* Radiant Golden Core */}
            <circle cx="50" cy="54" r="9" fill="url(#lotusCore)" stroke="#FEF08A" strokeWidth="1.2" />
            <circle cx="50" cy="54" r="5" fill="#FFFBEB" className="animate-pulse" />
          </svg>
        </div>
      );

    case "tajmahal":
      return (
        <div className={`relative flex items-center justify-center p-1.5 ${className}`} style={glowStyle}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="tajMarble" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="60%" stopColor="#F1F5F9" />
                <stop offset="100%" stopColor="#CBD5E1" />
              </linearGradient>
              <linearGradient id="tajSun" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
              <radialGradient id="tajSky" cx="50%" cy="40%" r="50%">
                <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Glowing Golden Sunrise behind Dome */}
            <circle cx="50" cy="36" r="32" fill="url(#tajSky)" />

            {/* Main Center Dome */}
            <path
              d="M 50 14 C 44 26 40 32 40 44 L 60 44 C 60 32 56 26 50 14 Z"
              fill="url(#tajMarble)"
              stroke="#94A3B8"
              strokeWidth="1"
            />
            {/* Dome Spire */}
            <line x1="50" y1="8" x2="50" y2="15" stroke="#F59E0B" strokeWidth="1.5" />
            <circle cx="50" cy="7" r="1.5" fill="#F59E0B" />

            {/* Left Small Dome */}
            <path d="M 33 28 C 29 36 26 40 26 48 L 40 48 C 40 40 37 36 33 28 Z" fill="url(#tajMarble)" />
            {/* Right Small Dome */}
            <path d="M 67 28 C 63 36 60 40 60 48 L 74 48 C 74 40 71 36 67 28 Z" fill="url(#tajMarble)" />

            {/* Central Grand Arch Building */}
            <rect x="22" y="44" width="56" height="42" fill="url(#tajMarble)" stroke="#94A3B8" strokeWidth="1" />
            {/* Archway Portal */}
            <path
              d="M 40 86 L 40 62 C 40 54 60 54 60 62 L 60 86 Z"
              fill="#1E293B"
              stroke="#F59E0B"
              strokeWidth="1.2"
            />

            {/* Side Arch Windows */}
            <path d="M 26 60 L 26 52 C 26 48 34 48 34 52 L 34 60 Z" fill="#334155" />
            <path d="M 26 78 L 26 70 C 26 66 34 66 34 70 L 34 78 Z" fill="#334155" />
            <path d="M 66 60 L 66 52 C 66 48 74 48 74 52 L 74 60 Z" fill="#334155" />
            <path d="M 66 78 L 66 70 C 66 66 74 66 74 70 L 74 78 Z" fill="#334155" />

            {/* Minarets (Towers) Left & Right */}
            <rect x="8" y="32" width="6" height="54" fill="url(#tajMarble)" stroke="#94A3B8" strokeWidth="0.8" />
            <polygon points="8,32 11,24 14,32" fill="url(#tajMarble)" stroke="#F59E0B" strokeWidth="0.8" />
            <rect x="86" y="32" width="6" height="54" fill="url(#tajMarble)" stroke="#94A3B8" strokeWidth="0.8" />
            <polygon points="86,32 89,24 92,32" fill="url(#tajMarble)" stroke="#F59E0B" strokeWidth="0.8" />

            {/* Base Plinth */}
            <rect x="4" y="86" width="92" height="6" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1" />
          </svg>
          <span className="absolute bottom-0 text-[8px] sm:text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-sky-500 to-blue-600 text-white px-1.5 py-0.2 rounded-md shadow-md">
            SCATTER
          </span>
        </div>
      );

    case "ring":
      return (
        <div className={`relative flex items-center justify-center p-1.5 ${className}`} style={glowStyle}>
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A7F3D0" />
                <stop offset="40%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#064E3B" />
              </linearGradient>
              <linearGradient id="ringGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>
            </defs>
            {/* Gold Ring Band */}
            <ellipse
              cx="50"
              cy="62"
              rx="32"
              ry="24"
              fill="none"
              stroke="url(#ringGold)"
              strokeWidth="10"
            />
            {/* Center Royal Emerald Gem */}
            <polygon
              points="50,14 74,32 74,54 50,72 26,54 26,32"
              fill="url(#emeraldGrad)"
              stroke="#FEF08A"
              strokeWidth="2"
            />
            <polygon points="50,22 66,36 66,50 50,64 34,50 34,36" fill="#34D399" opacity="0.6" />
            <circle cx="50" cy="43" r="6" fill="#ECFDF5" />
          </svg>
        </div>
      );

    case "ace":
      return (
        <div className={`relative flex items-center justify-center p-1.5 ${className}`} style={glowStyle}>
          <div className="w-full h-full flex flex-col items-center justify-center font-black font-serif">
            <span className="text-4xl sm:text-5xl bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] leading-none">
              A
            </span>
            <span className="text-[10px] text-amber-300/80 font-mono tracking-widest mt-0.5">ROYAL</span>
          </div>
        </div>
      );

    case "king":
      return (
        <div className={`relative flex items-center justify-center p-1.5 ${className}`} style={glowStyle}>
          <div className="w-full h-full flex flex-col items-center justify-center font-black font-serif">
            <span className="text-4xl sm:text-5xl bg-gradient-to-b from-purple-300 via-purple-500 to-indigo-700 bg-clip-text text-transparent drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] leading-none">
              K
            </span>
            <span className="text-[10px] text-purple-300/80 font-mono tracking-widest mt-0.5">KING</span>
          </div>
        </div>
      );

    case "queen":
      return (
        <div className={`relative flex items-center justify-center p-1.5 ${className}`} style={glowStyle}>
          <div className="w-full h-full flex flex-col items-center justify-center font-black font-serif">
            <span className="text-4xl sm:text-5xl bg-gradient-to-b from-pink-300 via-rose-500 to-red-700 bg-clip-text text-transparent drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] leading-none">
              Q
            </span>
            <span className="text-[10px] text-rose-300/80 font-mono tracking-widest mt-0.5">QUEEN</span>
          </div>
        </div>
      );

    case "jack":
      return (
        <div className={`relative flex items-center justify-center p-1.5 ${className}`} style={glowStyle}>
          <div className="w-full h-full flex flex-col items-center justify-center font-black font-serif">
            <span className="text-4xl sm:text-5xl bg-gradient-to-b from-cyan-200 via-sky-500 to-blue-700 bg-clip-text text-transparent drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] leading-none">
              J
            </span>
            <span className="text-[10px] text-sky-300/80 font-mono tracking-widest mt-0.5">JACK</span>
          </div>
        </div>
      );
  }
};
