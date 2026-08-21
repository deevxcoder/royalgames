import { SymbolId, SYMBOLS_CONFIG } from "./MaharajaSymbols";

// 20 Classic Paylines on 5x3 Matrix (row index 0=top, 1=mid, 2=bottom)
export const PAYLINES: number[][] = [
  [1, 1, 1, 1, 1], // Line 1: Middle
  [0, 0, 0, 0, 0], // Line 2: Top
  [2, 2, 2, 2, 2], // Line 3: Bottom
  [0, 1, 2, 1, 0], // Line 4: V-inverted
  [2, 1, 0, 1, 2], // Line 5: V-shape
  [0, 0, 1, 2, 2], // Line 6
  [2, 2, 1, 0, 0], // Line 7
  [1, 2, 2, 2, 1], // Line 8
  [1, 0, 0, 0, 1], // Line 9
  [0, 1, 1, 1, 0], // Line 10
  [2, 1, 1, 1, 2], // Line 11
  [0, 1, 0, 1, 0], // Line 12
  [2, 1, 2, 1, 2], // Line 13
  [1, 0, 1, 0, 1], // Line 14
  [1, 2, 1, 2, 1], // Line 15
  [0, 0, 1, 0, 0], // Line 16
  [2, 2, 1, 2, 2], // Line 17
  [1, 1, 0, 1, 1], // Line 18
  [1, 1, 2, 1, 1], // Line 19
  [0, 2, 0, 2, 0], // Line 20
];

// Natural Balanced Reel Strips (Base & Bonus)
export const REEL_STRIP_BASE: SymbolId[] = [
  "jack", "queen", "king", "ace", "diya", "jack", "queen", "lotus",
  "ace", "ring", "jack", "queen", "peacock", "diya", "king", "jack",
  "queen", "lotus", "queen", "ring", "ganesha", "ace", "king", "peacock",
  "diya", "jack", "queen", "lotus", "tajmahal", "ace", "ring", "jack",
  "king", "peacock", "jack", "queen", "lotus", "diya", "ring", "ace",
  "queen", "king", "jack", "diya", "ace", "peacock", "lotus", "ganesha"
];

export const REEL_STRIP = REEL_STRIP_BASE;

export const REEL_STRIP_BONUS: SymbolId[] = [
  "jack", "queen", "king", "ace", "diya", "ganesha", "queen", "lotus",
  "ace", "ring", "jack", "queen", "peacock", "diya", "king", "tajmahal",
  "queen", "lotus", "ganesha", "ring", "peacock", "ace", "king", "diya",
  "lotus", "jack", "queen", "lotus", "ganesha", "ace", "ring", "jack"
];

export interface LineWin {
  lineIndex: number;
  symbolId: SymbolId;
  count: number;
  payout: number;
  multiplier: number;
  hasWild: boolean;
  coords: { reel: number; row: number }[];
}

export interface SpinResult {
  grid: SymbolId[][];
  lineWins: LineWin[];
  scatterCount: number;
  scatterWin: number;
  totalWin: number;
  totalMultiplier: number;
  isFreeSpinsTriggered: boolean;
  freeSpinsAwarded: number;
}

// Session loss counter for anti-dry runs
let consecutiveLosses = 0;

/**
 * Balanced JILI Slot RNG Engine:
 * - Free Spins: Balanced, natural hits (avg total round payout ~20x-35x bet across 10 spins)
 * - Base Game: Steady recycling hits with balanced Big Wins
 */
export function generateRandomReels(isFreeSpins: boolean = false): SymbolId[][] {
  const rand = Math.random();
  const activeStrip = isFreeSpins ? REEL_STRIP_BONUS : REEL_STRIP_BASE;

  // 1. FREE SPINS TRIGGER (in Base Game only, ~4% chance, ~1 in 25 spins)
  if (!isFreeSpins && (rand < 0.04 || (consecutiveLosses >= 7 && Math.random() < 0.3))) {
    consecutiveLosses = 0;
    const grid: SymbolId[][] = [];
    const scatterCols = [0, 2, 4];

    for (let c = 0; c < 5; c++) {
      const reel: SymbolId[] = [];
      for (let r = 0; r < 3; r++) {
        if (scatterCols.includes(c) && r === 1) {
          reel.push("tajmahal");
        } else {
          reel.push(activeStrip[Math.floor(Math.random() * activeStrip.length)]);
        }
      }
      grid.push(reel);
    }
    return grid;
  }

  // 2. High-Pay Hit (~8% in base, ~15% in Free Spins)
  const bigWinThreshold = isFreeSpins ? 0.15 : 0.08;
  if (rand < bigWinThreshold || (!isFreeSpins && consecutiveLosses >= 4)) {
    consecutiveLosses = 0;
    const grid: SymbolId[][] = [];
    const highSymbols: SymbolId[] = ["peacock", "lotus", "diya", "ring"];
    const targetSym = highSymbols[Math.floor(Math.random() * highSymbols.length)];

    for (let c = 0; c < 5; c++) {
      const reel: SymbolId[] = [];
      for (let r = 0; r < 3; r++) {
        if (c <= 2 && Math.random() < 0.40) {
          reel.push(Math.random() < 0.25 ? "ganesha" : targetSym);
        } else {
          reel.push(activeStrip[Math.floor(Math.random() * activeStrip.length)]);
        }
      }
      grid.push(reel);
    }
    return grid;
  }

  // 3. Small / Medium Win (~22% chance)
  if (rand < (bigWinThreshold + 0.22)) {
    consecutiveLosses = 0;
    const grid: SymbolId[][] = [];
    const midSymbols: SymbolId[] = ["ace", "king", "queen", "diya"];
    const targetSym = midSymbols[Math.floor(Math.random() * midSymbols.length)];

    for (let c = 0; c < 5; c++) {
      const reel: SymbolId[] = [];
      for (let r = 0; r < 3; r++) {
        if (c <= 2 && r === 1) {
          reel.push(targetSym);
        } else {
          reel.push(activeStrip[Math.floor(Math.random() * activeStrip.length)]);
        }
      }
      grid.push(reel);
    }
    return grid;
  }

  // 4. Standard Spin (Loss / Blank)
  if (!isFreeSpins) consecutiveLosses++;
  const grid: SymbolId[][] = [];
  for (let c = 0; c < 5; c++) {
    const reel: SymbolId[] = [];
    for (let r = 0; r < 3; r++) {
      const randIdx = Math.floor(Math.random() * activeStrip.length);
      reel.push(activeStrip[randIdx]);
    }
    grid.push(reel);
  }
  return grid;
}

export function evaluateSpin(
  grid: SymbolId[][],
  totalBet: number,
  isFreeSpins: boolean = false
): SpinResult {
  const lineBet = totalBet / PAYLINES.length;
  const lineWins: LineWin[] = [];
  let totalLinePayout = 0;

  // 1. Evaluate 20 Paylines
  PAYLINES.forEach((linePattern, lineIdx) => {
    const symbolsOnLine: { symbol: SymbolId; reel: number; row: number }[] = [];
    for (let reel = 0; reel < 5; reel++) {
      const row = linePattern[reel];
      symbolsOnLine.push({ symbol: grid[reel][row], reel, row });
    }

    let targetSymbol: SymbolId | null = null;
    let hasWild = false;

    for (const item of symbolsOnLine) {
      if (item.symbol === "ganesha") {
        hasWild = true;
        continue;
      }
      if (item.symbol === "tajmahal") {
        break;
      }
      targetSymbol = item.symbol;
      break;
    }

    if (!targetSymbol && hasWild) {
      targetSymbol = "ganesha";
    }

    if (!targetSymbol) return;

    let matchCount = 0;
    const winningCoords: { reel: number; row: number }[] = [];

    for (let i = 0; i < 5; i++) {
      const current = symbolsOnLine[i].symbol;
      if (current === targetSymbol || (current === "ganesha" && targetSymbol !== "tajmahal")) {
        matchCount++;
        winningCoords.push({ reel: symbolsOnLine[i].reel, row: symbolsOnLine[i].row });
      } else {
        break;
      }
    }

    if (matchCount >= 3) {
      const config = SYMBOLS_CONFIG[targetSymbol];
      const baseMultiplier = (config.payouts as any)[matchCount] || 0;

      if (baseMultiplier > 0) {
        const wildMult = hasWild ? 2 : 1;
        // Free spins gives a balanced 2x multiplier boost
        const freeSpinMult = isFreeSpins ? 2 : 1;
        const totalMult = baseMultiplier * wildMult * freeSpinMult;
        const payout = lineBet * totalMult;

        lineWins.push({
          lineIndex: lineIdx,
          symbolId: targetSymbol,
          count: matchCount,
          payout,
          multiplier: totalMult,
          hasWild,
          coords: winningCoords,
        });

        totalLinePayout += payout;
      }
    }
  });

  // 2. Evaluate Scatters (Taj Mahal)
  let scatterCount = 0;
  for (let reel = 0; reel < 5; reel++) {
    for (let row = 0; row < 3; row++) {
      if (grid[reel][row] === "tajmahal") {
        scatterCount++;
      }
    }
  }

  let scatterWin = 0;
  let isFreeSpinsTriggered = false;
  let freeSpinsAwarded = 0;

  if (scatterCount >= 3) {
    isFreeSpinsTriggered = true;
    freeSpinsAwarded = 10;
    const scatterMult = scatterCount === 5 ? 50 : scatterCount === 4 ? 20 : 3;
    scatterWin = totalBet * scatterMult;
  }

  const totalWin = Number((totalLinePayout + scatterWin).toFixed(2));
  const totalMultiplier = totalBet > 0 ? Number((totalWin / totalBet).toFixed(2)) : 0;

  return {
    grid,
    lineWins,
    scatterCount,
    scatterWin,
    totalWin,
    totalMultiplier,
    isFreeSpinsTriggered,
    freeSpinsAwarded,
  };
}
