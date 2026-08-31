"use client";

import React, { useEffect, useRef } from "react";
import { Card, AndarBaharPhase } from "@/lib/serverAndarBaharEngine";

interface AndarBaharCanvasProps {
  phase: AndarBaharPhase;
  countdownLeft: number;
  jokerCard: Card;
  andarCards: Card[];
  baharCards: Card[];
  winningSide: "ANDAR" | "BAHAR";
  winningCard: Card;
}

export const AndarBaharCanvas: React.FC<AndarBaharCanvasProps> = ({
  phase,
  countdownLeft,
  jokerCard,
  andarCards,
  baharCards,
  winningSide,
  winningCard,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

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

      // 1. VIP Casino Velvet Felt Background
      const feltGrad = ctx.createRadialGradient(
        width / 2,
        height * 0.4,
        20,
        width / 2,
        height * 0.5,
        width * 0.75
      );
      feltGrad.addColorStop(0, "#0a2618");
      feltGrad.addColorStop(0.65, "#04140b");
      feltGrad.addColorStop(1, "#020805");
      ctx.fillStyle = feltGrad;
      ctx.fillRect(0, 0, width, height);

      // Table Boundary Gold Ring
      ctx.strokeStyle = "rgba(234, 179, 8, 0.25)";
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      // 2. Top Golden Dealer Shoe & Center Joker Pedestal
      const cardW = Math.max(38, Math.min(54, width * 0.12));
      const cardH = cardW * 1.4;

      // Draw Center Joker Card Pedestal
      const jokerX = width / 2;
      const jokerY = Math.max(45, height * 0.2);

      // Joker Halo Glow
      ctx.save();
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 16 + Math.sin(time * 3) * 6;
      ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
      ctx.beginPath();
      ctx.arc(jokerX, jokerY + cardH / 2, cardW * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw Joker Label
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("⭐ JOKER CARD", jokerX, jokerY - 10);

      // Draw Joker Card Body
      drawPlayingCard(ctx, jokerCard, jokerX - cardW / 2, jokerY, cardW, cardH, true);

      // 3. Dual Card Runways: ANDAR (Left) vs BAHAR (Right)
      const runwayY = Math.max(jokerY + cardH + 28, height * 0.48);
      const runwayWidth = (width - 40) / 2;
      const andarStartX = 15;
      const baharStartX = width / 2 + 5;

      // ANDAR RUNWAY (Left Blue/Cyan)
      const isAndarWin = phase === "RESULT" && winningSide === "ANDAR";
      ctx.save();
      if (isAndarWin) {
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 24 + Math.sin(time * 6) * 10;
      }
      ctx.fillStyle = isAndarWin ? "rgba(56, 189, 248, 0.25)" : "rgba(3, 105, 161, 0.15)";
      ctx.strokeStyle = isAndarWin ? "#38bdf8" : "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = isAndarWin ? 2.5 : 1.2;
      ctx.beginPath();
      ctx.roundRect(andarStartX, runwayY, runwayWidth, height - runwayY - 14, 16);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // ANDAR Header Label
      ctx.fillStyle = isAndarWin ? "#7dd3fc" : "#38bdf8";
      ctx.font = "900 13px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("🔵 ANDAR", andarStartX + 14, runwayY + 22);

      ctx.fillStyle = "rgba(56, 189, 248, 0.7)";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`(${andarCards.length} Cards)`, andarStartX + runwayWidth - 14, runwayY + 22);

      // BAHAR RUNWAY (Right Orange/Gold)
      const isBaharWin = phase === "RESULT" && winningSide === "BAHAR";
      ctx.save();
      if (isBaharWin) {
        ctx.shadowColor = "#fb923c";
        ctx.shadowBlur = 24 + Math.sin(time * 6) * 10;
      }
      ctx.fillStyle = isBaharWin ? "rgba(251, 146, 60, 0.25)" : "rgba(194, 65, 12, 0.15)";
      ctx.strokeStyle = isBaharWin ? "#fb923c" : "rgba(251, 146, 60, 0.4)";
      ctx.lineWidth = isBaharWin ? 2.5 : 1.2;
      ctx.beginPath();
      ctx.roundRect(baharStartX, runwayY, runwayWidth, height - runwayY - 14, 16);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // BAHAR Header Label
      ctx.fillStyle = isBaharWin ? "#fed7aa" : "#fb923c";
      ctx.font = "900 13px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("🟠 BAHAR", baharStartX + 14, runwayY + 22);

      ctx.fillStyle = "rgba(251, 146, 60, 0.7)";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`(${baharCards.length} Cards)`, baharStartX + runwayWidth - 14, runwayY + 22);

      // 4. Render Dealt Cards inside Runways with Stagger / Stacking
      const cardSlotW = Math.max(30, Math.min(42, runwayWidth * 0.18));
      const cardSlotH = cardSlotW * 1.38;
      const cardStartY = runwayY + 36;
      const maxCols = Math.floor((runwayWidth - 20) / (cardSlotW + 4));

      // Draw Andar Dealt Cards
      andarCards.forEach((c, idx) => {
        const row = Math.floor(idx / maxCols);
        const col = idx % maxCols;
        const cx = andarStartX + 12 + col * (cardSlotW + 4);
        const cy = cardStartY + row * (cardSlotH + 6);
        const isMatch = phase === "RESULT" && isAndarWin && idx === andarCards.length - 1;
        drawPlayingCard(ctx, c, cx, cy, cardSlotW, cardSlotH, isMatch);
      });

      // Draw Bahar Dealt Cards
      baharCards.forEach((c, idx) => {
        const row = Math.floor(idx / maxCols);
        const col = idx % maxCols;
        const cx = baharStartX + 12 + col * (cardSlotW + 4);
        const cy = cardStartY + row * (cardSlotH + 6);
        const isMatch = phase === "RESULT" && isBaharWin && idx === baharCards.length - 1;
        drawPlayingCard(ctx, c, cx, cy, cardSlotW, cardSlotH, isMatch);
      });

      // 5. Phase Center Stage Indicator
      if (phase === "BETTING") {
        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.font = "black 14px monospace";
        ctx.textAlign = "center";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 10;
        ctx.fillText(`⏱️ BETTING CLOSING IN: ${countdownLeft.toFixed(1)}s`, width / 2, runwayY - 12);
        ctx.restore();
      } else if (phase === "DEALING") {
        ctx.save();
        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 10;
        ctx.fillText("🎴 DEALING CARDS LIVE...", width / 2, runwayY - 12);
        ctx.restore();
      } else if (phase === "RESULT") {
        ctx.save();
        const winTitle = winningSide === "ANDAR" ? "👑 ANDAR WINS!" : "👑 BAHAR WINS!";
        ctx.fillStyle = winningSide === "ANDAR" ? "#38bdf8" : "#fb923c";
        ctx.font = "black 16px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.shadowColor = winningSide === "ANDAR" ? "#38bdf8" : "#fb923c";
        ctx.shadowBlur = 18;
        ctx.fillText(winTitle, width / 2, runwayY - 12);
        ctx.restore();
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [phase, countdownLeft, jokerCard, andarCards, baharCards, winningSide, winningCard]);

  return (
    <div className="relative w-full h-full min-h-[290px] sm:min-h-[360px] md:min-h-[440px] flex items-center justify-center overflow-hidden rounded-3xl bg-[#030d07] border border-emerald-500/25 shadow-2xl">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
};

// Helper: Render realistic 3D Casino Card on Canvas
function drawPlayingCard(
  ctx: CanvasRenderingContext2D,
  card: Card,
  x: number,
  y: number,
  w: number,
  h: number,
  isHighlighted = false
) {
  ctx.save();

  // Card Shadow & Highlight
  if (isHighlighted) {
    ctx.shadowColor = "#fbbf24";
    ctx.shadowBlur = 16;
  } else {
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 6;
  }

  // Card Face Body
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.max(4, w * 0.1));
  ctx.fill();

  // Card Gold / Silver Border
  ctx.strokeStyle = isHighlighted ? "#f59e0b" : "rgba(0,0,0,0.15)";
  ctx.lineWidth = isHighlighted ? 2.5 : 1;
  ctx.stroke();

  // Rank & Suit Typography
  ctx.fillStyle = card.color === "red" ? "#dc2626" : "#0f172a";
  const fontSize = Math.max(9, Math.min(13, w * 0.3));
  ctx.font = `bold ${fontSize}px ui-monospace, SFMono-Regular, monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const displayRank = card.display.slice(0, -1);
  const displaySuit = card.suit;

  // Top Left Index
  ctx.fillText(displayRank, x + 3.5, y + 3);
  ctx.font = `${fontSize * 0.9}px system-ui`;
  ctx.fillText(displaySuit, x + 3.5, y + 3 + fontSize);

  // Center Big Suit
  ctx.font = `${w * 0.52}px system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(displaySuit, x + w / 2, y + h / 2 + 1);

  ctx.restore();
}
