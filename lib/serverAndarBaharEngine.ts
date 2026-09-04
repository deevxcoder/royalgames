import { getGameOverride, consumeGameOverride } from "./gameControlManager";

export type AndarBaharPhase = "BETTING" | "DEALING" | "RESULT";

export interface Card {
  value: number; // 2..14 (14 = Ace)
  suit: "♠" | "♥" | "♦" | "♣";
  display: string;
  color: "red" | "black";
}

export interface AndarBaharRoundState {
  roundId: string;
  roundSequence: number;
  phase: AndarBaharPhase;
  countdownLeft: number;
  jokerCard: Card;
  andarCards: Card[];
  baharCards: Card[];
  winningSide: "ANDAR" | "BAHAR";
  winningCard: Card;
  totalDealtCards: number;
  serverTime: number;
  history: Array<{ roundId: string; winner: "ANDAR" | "BAHAR"; joker: string; count: number }>;
  predictedWinner?: "ANDAR" | "BAHAR";
  multiplayerPool?: {
    andarPool: number;
    baharPool: number;
    andarCount: number;
    baharCount: number;
  };
}

export interface LiveABRoundSchedule {
  roundSequence: number;
  roundId: string;
  jokerCard: Card;
  andarCards: Card[];
  baharCards: Card[];
  winningSide: "ANDAR" | "BAHAR";
  winningCard: Card;
  totalCards: number;
  countdownStart: number; // T0
  dealingStart: number;   // T0 + 10000
  resultStart: number;    // T0 + 10000 + dealingDurationMs
  roundEndTime: number;   // resultStart + 4500
  isOverrideApplied: boolean;
}

export const AB_BETTING_DURATION_MS = 10000; // Exact 10.0 seconds betting window
export const AB_CARD_DEAL_INTERVAL_MS = 750; // 750ms per card deal
export const AB_RESULT_DURATION_MS = 4500;   // 4.5s post-round celebration

const SUITS: Array<"♠" | "♥" | "♦" | "♣"> = ["♠", "♥", "♦", "♣"];
const VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export function createCard(val: number, suitIdx: number): Card {
  const suit = SUITS[suitIdx % 4];
  const displayVal = val === 14 ? "A" : val === 13 ? "K" : val === 12 ? "Q" : val === 11 ? "J" : `${val}`;
  const color = suit === "♥" || suit === "♦" ? "red" : "black";
  return { value: val, suit, display: `${displayVal}${suit}`, color };
}

// Fast deterministic 32-bit PRNG (Mulberry32)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getSeedForABRound(hourIndex: number, roundInHour: number): number {
  let hash = 0;
  const str = `royal_ab_h${hourIndex}_r${roundInHour}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 987654321;
}

// Generates an authoritative full 52-card deck & deals Andar Bahar
export function generateDeterministicABRound(hourIndex: number, roundInHour: number, forcedWinner?: "ANDAR" | "BAHAR"): {
  jokerCard: Card;
  andarCards: Card[];
  baharCards: Card[];
  winningSide: "ANDAR" | "BAHAR";
  winningCard: Card;
  totalCards: number;
} {
  const seed = getSeedForABRound(hourIndex, roundInHour);
  const rand = mulberry32(seed);

  // Full 52 card deck
  const deck: Card[] = [];
  for (const v of VALUES) {
    for (let s = 0; s < 4; s++) {
      deck.push(createCard(v, s));
    }
  }

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  // 1. Center Joker Card
  const jokerCard = deck.pop()!;

  // 2. Deal alternatively to Andar and Bahar until rank matches Joker
  const andarCards: Card[] = [];
  const baharCards: Card[] = [];
  let winningSide: "ANDAR" | "BAHAR" = "ANDAR";
  let winningCard: Card = jokerCard;
  let totalCards = 0;

  while (deck.length > 0) {
    totalCards++;
    const card = deck.pop()!;

    if (totalCards % 2 === 1) {
      // Dealt to ANDAR (1st, 3rd, 5th...)
      andarCards.push(card);
      if (card.value === jokerCard.value) {
        winningSide = "ANDAR";
        winningCard = card;
        break;
      }
    } else {
      // Dealt to BAHAR (2nd, 4th, 6th...)
      baharCards.push(card);
      if (card.value === jokerCard.value) {
        winningSide = "BAHAR";
        winningCard = card;
        break;
      }
    }
  }

  const rawRound = {
    jokerCard,
    andarCards,
    baharCards,
    winningSide,
    winningCard,
    totalCards,
  };

  if (forcedWinner && winningSide !== forcedWinner) {
    return applyForcedABWinnerClean(rawRound, forcedWinner);
  }

  return rawRound;
}

function applyForcedABWinnerClean(
  round: {
    jokerCard: Card;
    andarCards: Card[];
    baharCards: Card[];
    winningSide: "ANDAR" | "BAHAR";
    winningCard: Card;
    totalCards: number;
  },
  forcedWinner: "ANDAR" | "BAHAR"
) {
  if (round.winningSide === forcedWinner) return round;

  const jokerVal = round.jokerCard.value;
  const dummySuit: "♠" | "♥" = round.jokerCard.suit === "♠" ? "♥" : "♠";
  const nonMatchVal = jokerVal === 14 ? 2 : jokerVal + 1;
  const nonMatchCard: Card = {
    value: nonMatchVal,
    suit: dummySuit,
    display: `${nonMatchVal === 14 ? "A" : nonMatchVal}${dummySuit}`,
    color: dummySuit === "♥" ? "red" : "black",
  };
  const winningMatchCard: Card = {
    value: jokerVal,
    suit: round.jokerCard.suit === "♦" ? "♣" : "♦",
    display: `${round.jokerCard.display.slice(0, -1)}${round.jokerCard.suit === "♦" ? "♣" : "♦"}`,
    color: round.jokerCard.color === "red" ? "black" : "red",
  };

  if (forcedWinner === "ANDAR") {
    const cleanBahar = round.baharCards.map((c) => (c.value === jokerVal ? nonMatchCard : c));
    const cleanAndar = round.andarCards.filter((c) => c.value !== jokerVal);
    cleanAndar.push(winningMatchCard);

    return {
      jokerCard: round.jokerCard,
      andarCards: cleanAndar,
      baharCards: cleanBahar,
      winningSide: "ANDAR" as const,
      winningCard: winningMatchCard,
      totalCards: cleanAndar.length + cleanBahar.length,
    };
  } else {
    const cleanAndar = round.andarCards.map((c) => (c.value === jokerVal ? nonMatchCard : c));
    const cleanBahar = round.baharCards.filter((c) => c.value !== jokerVal);
    cleanBahar.push(winningMatchCard);

    return {
      jokerCard: round.jokerCard,
      andarCards: cleanAndar,
      baharCards: cleanBahar,
      winningSide: "BAHAR" as const,
      winningCard: winningMatchCard,
      totalCards: cleanAndar.length + cleanBahar.length,
    };
  }
}

// In-Memory Real-Time Store for Andar Bahar Engine
interface LiveABBetsPool {
  andarAmount: number;
  baharAmount: number;
  andarCount: number;
  baharCount: number;
  simulatedAndar: number;
  simulatedBahar: number;
  simulatedAndarCount: number;
  simulatedBaharCount: number;
  recentBets: Array<{
    id: string;
    username: string;
    side: "ANDAR" | "BAHAR";
    amount: number;
    timestamp: number;
  }>;
}

interface ABStoreState {
  currentRound: LiveABRoundSchedule | null;
  history: Array<{ roundId: string; winner: "ANDAR" | "BAHAR"; joker: string; count: number }>;
  lastConsumedRoundId: string | null;
  roundCounter: number;
  betsPool: LiveABBetsPool;
}

const abStoreKey = Symbol.for("royal_games_ab_engine_store_v2");
const abStore: ABStoreState = (globalThis as any)[abStoreKey] || {
  currentRound: null,
  history: [
    { roundId: "RND_AB_101", winner: "ANDAR", joker: "8♠", count: 7 },
    { roundId: "RND_AB_102", winner: "BAHAR", joker: "K♦", count: 4 },
    { roundId: "RND_AB_103", winner: "ANDAR", joker: "A♣", count: 3 },
    { roundId: "RND_AB_104", winner: "BAHAR", joker: "10♥", count: 6 },
    { roundId: "RND_AB_105", winner: "BAHAR", joker: "5♠", count: 8 },
    { roundId: "RND_AB_106", winner: "ANDAR", joker: "Q♥", count: 5 },
  ],
  lastConsumedRoundId: null,
  roundCounter: Math.floor(Date.now() / 25000),
  betsPool: {
    andarAmount: 0,
    baharAmount: 0,
    andarCount: 0,
    baharCount: 0,
    simulatedAndar: 28500,
    simulatedBahar: 34200,
    simulatedAndarCount: 112,
    simulatedBaharCount: 135,
    recentBets: [],
  },
};
(globalThis as any)[abStoreKey] = abStore;

export function recordABBet(side: "ANDAR" | "BAHAR", amount: number, username: string = "Player") {
  if (side === "ANDAR") {
    abStore.betsPool.andarAmount += amount;
    abStore.betsPool.andarCount += 1;
  } else {
    abStore.betsPool.baharAmount += amount;
    abStore.betsPool.baharCount += 1;
  }
  abStore.betsPool.recentBets.unshift({
    id: `bet_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    username,
    side,
    amount,
    timestamp: Date.now(),
  });
  if (abStore.betsPool.recentBets.length > 25) {
    abStore.betsPool.recentBets.pop();
  }
}

export function getABLiveBetStats() {
  const p = abStore.betsPool;
  const realAndar = p.andarAmount;
  const realBahar = p.baharAmount;
  const realAndarCount = p.andarCount;
  const realBaharCount = p.baharCount;

  // Real User Payout Liabilities
  const andarLiability = Math.round(realAndar * 1.80);
  const baharLiability = Math.round(realBahar * 1.90);

  // Net casino profit based strictly on real user funds
  const profitIfAndarWins = realBahar - Math.round(realAndar * 0.80);
  const profitIfBaharWins = realAndar - Math.round(realBahar * 0.90);

  let bestSideForCasino: "ANDAR" | "BAHAR" | null = null;
  if (realAndar > 0 || realBahar > 0) {
    bestSideForCasino = profitIfAndarWins >= profitIfBaharWins ? "ANDAR" : "BAHAR";
  }

  return {
    realAndar,
    realBahar,
    realAndarCount,
    realBaharCount,
    totalAndar: realAndar,
    totalBahar: realBahar,
    totalAndarCount: realAndarCount,
    totalBaharCount: realBaharCount,
    andarLiability,
    baharLiability,
    profitIfAndarWins,
    profitIfBaharWins,
    bestSideForCasino,
    recentBets: p.recentBets.slice(0, 10),
  };
}

// Authoritative synchronized state tick based on real time
export function tickAndGetABState(targetTime?: number): AndarBaharRoundState {
  const now = targetTime ?? Date.now();

  const startNewABRound = (startTime: number): LiveABRoundSchedule => {
    abStore.roundCounter += 1;
    const roundSeq = abStore.roundCounter;
    const hourIndex = Math.floor(startTime / 3600000);
    const roundInHour = roundSeq % 1000;

    const override = getGameOverride("royal_andarbahar");
    const forcedWinner = (override && override.mode === "FORCED" && (override as any).forcedWinner)
      ? ((override as any).forcedWinner as "ANDAR" | "BAHAR")
      : undefined;

    const roundData = generateDeterministicABRound(hourIndex, roundInHour, forcedWinner);
    const dealingDurMs = roundData.totalCards * AB_CARD_DEAL_INTERVAL_MS;
    const countdownStart = startTime;
    const dealingStart = countdownStart + AB_BETTING_DURATION_MS;
    const resultStart = dealingStart + dealingDurMs;
    const roundEndTime = resultStart + AB_RESULT_DURATION_MS;

    // Reset and initialize fresh simulated bets pool for the new round
    abStore.betsPool = {
      andarAmount: 0,
      baharAmount: 0,
      andarCount: 0,
      baharCount: 0,
      simulatedAndar: Math.floor(Math.random() * 15000) + 20000,
      simulatedBahar: Math.floor(Math.random() * 18000) + 22000,
      simulatedAndarCount: Math.floor(Math.random() * 40) + 90,
      simulatedBaharCount: Math.floor(Math.random() * 40) + 105,
      recentBets: [],
    };

    return {
      roundSequence: roundSeq,
      roundId: `RND_AB_${countdownStart}_${roundSeq}`,
      ...roundData,
      countdownStart,
      dealingStart,
      resultStart,
      roundEndTime,
      isOverrideApplied: Boolean(forcedWinner),
    };
  };

  if (!abStore.currentRound) {
    abStore.currentRound = startNewABRound(now);
  }

  // Advance completed rounds cleanly
  while (now >= abStore.currentRound.roundEndTime) {
    const finished = abStore.currentRound;
    if (abStore.lastConsumedRoundId !== finished.roundId) {
      abStore.lastConsumedRoundId = finished.roundId;
      abStore.history.unshift({
        roundId: finished.roundId,
        winner: finished.winningSide,
        joker: finished.jokerCard.display,
        count: finished.totalCards,
      });
      if (abStore.history.length > 25) abStore.history.pop();

      if (finished.isOverrideApplied) {
        consumeGameOverride("royal_andarbahar");
      }
    }

    let nextStartTime = finished.roundEndTime;
    if (now - nextStartTime > 30000) {
      nextStartTime = now;
    }
    abStore.currentRound = startNewABRound(nextStartTime);
  }

  // DYNAMIC OVERRIDE INTERCEPTOR (Applies during BETTING and DEALING before RESULT)
  const abOverride = getGameOverride("royal_andarbahar");
  const activeRound = abStore.currentRound;

  if (abOverride && abOverride.mode === "FORCED" && (abOverride as any).forcedWinner) {
    const desiredWinner = (abOverride as any).forcedWinner as "ANDAR" | "BAHAR";

    // 1. If in BETTING phase, clean apply
    if (now < activeRound.dealingStart && activeRound.winningSide !== desiredWinner) {
      const updated = applyForcedABWinnerClean(activeRound, desiredWinner);
      const dealingDurMs = updated.totalCards * AB_CARD_DEAL_INTERVAL_MS;
      const resultStart = activeRound.dealingStart + dealingDurMs;
      abStore.currentRound = {
        ...activeRound,
        ...updated,
        resultStart,
        roundEndTime: resultStart + AB_RESULT_DURATION_MS,
        isOverrideApplied: true,
      };
    }
    // 2. If in DEALING phase (before result is reached), adjust future un-dealt cards
    else if (now >= activeRound.dealingStart && now < activeRound.resultStart && activeRound.winningSide !== desiredWinner) {
      const elapsedDealingMs = now - activeRound.dealingStart;
      const cardsDealtSoFar = Math.min(
        activeRound.totalCards,
        Math.floor(elapsedDealingMs / AB_CARD_DEAL_INTERVAL_MS) + 1
      );

      // Preserve cards already revealed
      const visibleAndar = activeRound.andarCards.slice(0, Math.ceil(cardsDealtSoFar / 2));
      const visibleBahar = activeRound.baharCards.slice(0, Math.floor(cardsDealtSoFar / 2));

      const jokerVal = activeRound.jokerCard.value;
      const winningMatchCard: Card = {
        value: jokerVal,
        suit: activeRound.jokerCard.suit === "♦" ? "♣" : "♦",
        display: `${activeRound.jokerCard.display.slice(0, -1)}${activeRound.jokerCard.suit === "♦" ? "♣" : "♦"}`,
        color: activeRound.jokerCard.color === "red" ? "black" : "red",
      };
      const dummySuit: "♠" | "♥" = activeRound.jokerCard.suit === "♠" ? "♥" : "♠";
      const nonMatchVal = jokerVal === 14 ? 2 : jokerVal + 1;
      const nonMatchCard: Card = {
        value: nonMatchVal,
        suit: dummySuit,
        display: `${nonMatchVal === 14 ? "A" : nonMatchVal}${dummySuit}`,
        color: dummySuit === "♥" ? "red" : "black",
      };

      let newAndar = [...visibleAndar];
      let newBahar = [...visibleBahar];

      if (desiredWinner === "ANDAR") {
        // Next Andar deal should win
        if (newAndar.length <= newBahar.length) {
          newAndar.push(winningMatchCard);
        } else {
          newBahar.push(nonMatchCard);
          newAndar.push(winningMatchCard);
        }
      } else {
        // Next Bahar deal should win
        if (newBahar.length < newAndar.length) {
          newBahar.push(winningMatchCard);
        } else {
          newAndar.push(nonMatchCard);
          newBahar.push(winningMatchCard);
        }
      }

      const newTotalCards = newAndar.length + newBahar.length;
      const newResultStart = activeRound.dealingStart + newTotalCards * AB_CARD_DEAL_INTERVAL_MS;

      abStore.currentRound = {
        ...activeRound,
        andarCards: newAndar,
        baharCards: newBahar,
        winningSide: desiredWinner,
        winningCard: winningMatchCard,
        totalCards: newTotalCards,
        resultStart: newResultStart,
        roundEndTime: newResultStart + AB_RESULT_DURATION_MS,
        isOverrideApplied: true,
      };
    }
  }

  // Determine current lifecycle phase
  const cur = abStore.currentRound;
  let phase: AndarBaharPhase = "BETTING";
  let countdownLeft = 0;
  let visibleAndarCards: Card[] = [];
  let visibleBaharCards: Card[] = [];

  if (now < cur.dealingStart) {
    // BETTING PHASE
    phase = "BETTING";
    countdownLeft = Math.max(0, Number(((cur.dealingStart - now) / 1000).toFixed(1)));
  } else if (now < cur.resultStart) {
    // DEALING PHASE
    phase = "DEALING";
    const elapsedDealingMs = now - cur.dealingStart;
    const cardsRevealedSoFar = Math.min(
      cur.totalCards,
      Math.floor(elapsedDealingMs / AB_CARD_DEAL_INTERVAL_MS) + 1
    );

    // Compute visible cards up to this exact millisecond
    for (let c = 1; c <= cardsRevealedSoFar; c++) {
      if (c % 2 === 1) {
        const andarIdx = Math.floor(c / 2);
        if (cur.andarCards[andarIdx]) {
          visibleAndarCards.push(cur.andarCards[andarIdx]);
        }
      } else {
        const baharIdx = Math.floor(c / 2) - 1;
        if (cur.baharCards[baharIdx]) {
          visibleBaharCards.push(cur.baharCards[baharIdx]);
        }
      }
    }
  } else {
    // RESULT PHASE
    phase = "RESULT";
    visibleAndarCards = [...cur.andarCards];
    visibleBaharCards = [...cur.baharCards];
  }

  // ZERO-LEAK SECURITY RULE:
  // While bets are still being placed in BETTING phase, NEVER leak the winner or final card count to players!
  const isBettingWindow = phase === "BETTING";

  const stats = getABLiveBetStats();

  return {
    roundId: cur.roundId,
    roundSequence: cur.roundSequence,
    phase,
    countdownLeft,
    jokerCard: cur.jokerCard,
    andarCards: visibleAndarCards,
    baharCards: visibleBaharCards,
    winningSide: isBettingWindow ? (null as any) : cur.winningSide,
    winningCard: isBettingWindow ? (null as any) : cur.winningCard,
    predictedWinner: cur.winningSide,
    totalDealtCards: isBettingWindow ? 0 : cur.totalCards,
    serverTime: now,
    history: abStore.history,
    multiplayerPool: {
      andarPool: stats.totalAndar,
      baharPool: stats.totalBahar,
      andarCount: stats.totalAndarCount,
      baharCount: stats.totalBaharCount,
    },
  };
}
