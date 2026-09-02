import { getGameOverride } from "./gameControlManager";

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
}

export interface InternalABRoundSchedule {
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
}

export const AB_BETTING_DURATION_MS = 10000; // Exact 10.0 seconds betting window
export const AB_CARD_DEAL_INTERVAL_MS = 750; // 750ms per card deal
export const AB_RESULT_DURATION_MS = 4500;   // 4.5s post-round celebration

const SUITS: Array<"♠" | "♥" | "♦" | "♣"> = ["♠", "♥", "♦", "♣"];
const VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

function createCard(val: number, suitIdx: number): Card {
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

// Generates an authoritative, deterministic full 52-card deck & deals Andar Bahar
export function generateDeterministicABRound(hourIndex: number, roundInHour: number): {
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

  // Fisher-Yates deterministic shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  // 1. First card is the Center Joker Card
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

  return {
    jokerCard,
    andarCards,
    baharCards,
    winningSide,
    winningCard,
    totalCards,
  };
}

// In-memory cache per hour to make lookups virtually 0ms
const abHourScheduleCache: Record<number, InternalABRoundSchedule[]> = {};

export function computeABHourRounds(hourIndex: number): InternalABRoundSchedule[] {
  if (abHourScheduleCache[hourIndex]) {
    return abHourScheduleCache[hourIndex];
  }

  const hourStart = hourIndex * 3600000;
  const hourEnd = hourStart + 3600000;
  const rounds: InternalABRoundSchedule[] = [];

  let t = hourStart;
  let r = 0;

  while (t < hourEnd) {
    const roundData = generateDeterministicABRound(hourIndex, r);
    const dealingDurMs = roundData.totalCards * AB_CARD_DEAL_INTERVAL_MS;
    const countdownStart = t;
    const dealingStart = countdownStart + AB_BETTING_DURATION_MS;
    const resultStart = dealingStart + dealingDurMs;
    const roundEndTime = resultStart + AB_RESULT_DURATION_MS;
    const roundSequence = hourIndex * 1000 + r;

    rounds.push({
      roundSequence,
      roundId: `RND_AB_${countdownStart}_${roundSequence}`,
      ...roundData,
      countdownStart,
      dealingStart,
      resultStart,
      roundEndTime,
    });

    t = roundEndTime;
    r++;
  }

  abHourScheduleCache[hourIndex] = rounds;
  return rounds;
}

function applyForcedABWinner(round: InternalABRoundSchedule, forcedWinner: "ANDAR" | "BAHAR"): InternalABRoundSchedule {
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

    const totalCards = cleanAndar.length + cleanBahar.length;
    const dealingDurMs = totalCards * AB_CARD_DEAL_INTERVAL_MS;
    const resultStart = round.dealingStart + dealingDurMs;

    return {
      ...round,
      andarCards: cleanAndar,
      baharCards: cleanBahar,
      winningSide: "ANDAR",
      winningCard: winningMatchCard,
      totalCards,
      resultStart,
      roundEndTime: resultStart + AB_RESULT_DURATION_MS,
    };
  } else {
    const cleanAndar = round.andarCards.map((c) => (c.value === jokerVal ? nonMatchCard : c));
    const cleanBahar = round.baharCards.filter((c) => c.value !== jokerVal);
    cleanBahar.push(winningMatchCard);

    const totalCards = cleanAndar.length + cleanBahar.length;
    const dealingDurMs = totalCards * AB_CARD_DEAL_INTERVAL_MS;
    const resultStart = round.dealingStart + dealingDurMs;

    return {
      ...round,
      andarCards: cleanAndar,
      baharCards: cleanBahar,
      winningSide: "BAHAR",
      winningCard: winningMatchCard,
      totalCards,
      resultStart,
      roundEndTime: resultStart + AB_RESULT_DURATION_MS,
    };
  }
}

// Authoritative synchronized state tick based on real time
export function tickAndGetABState(targetTime?: number): AndarBaharRoundState {
  const now = targetTime ?? Date.now();
  const HOUR_MS = 3600000;
  const hourIndex = Math.floor(now / HOUR_MS);

  const curRounds = computeABHourRounds(hourIndex);
  let activeRoundIndex = curRounds.findIndex(
    (r) => now >= r.countdownStart && now < r.roundEndTime
  );

  let activeRound: InternalABRoundSchedule;
  if (activeRoundIndex !== -1) {
    activeRound = curRounds[activeRoundIndex];
  } else {
    if (now >= curRounds[curRounds.length - 1].roundEndTime) {
      const nextHourRounds = computeABHourRounds(hourIndex + 1);
      activeRound = nextHourRounds[0] || curRounds[curRounds.length - 1];
      activeRoundIndex = 0;
    } else {
      activeRound = curRounds[0];
      activeRoundIndex = 0;
    }
  }

  // Intercept with Studio Manual Outcome Override (God Mode)
  const abOverride = getGameOverride("royal_andarbahar");
  if (abOverride && abOverride.mode === "FORCED" && (abOverride as any).forcedWinner) {
    activeRound = applyForcedABWinner(activeRound, (abOverride as any).forcedWinner);
  }

  // Determine current lifecycle phase
  let phase: AndarBaharPhase = "BETTING";
  let countdownLeft = 0;
  let visibleAndarCards: Card[] = [];
  let visibleBaharCards: Card[] = [];

  if (now < activeRound.dealingStart) {
    // BETTING PHASE
    phase = "BETTING";
    countdownLeft = Math.max(0, Number(((activeRound.dealingStart - now) / 1000).toFixed(1)));
  } else if (now < activeRound.resultStart) {
    // DEALING PHASE
    phase = "DEALING";
    const elapsedDealingMs = now - activeRound.dealingStart;
    const cardsRevealedSoFar = Math.min(
      activeRound.totalCards,
      Math.floor(elapsedDealingMs / AB_CARD_DEAL_INTERVAL_MS) + 1
    );

    // Compute visible cards up to this exact millisecond
    for (let c = 1; c <= cardsRevealedSoFar; c++) {
      if (c % 2 === 1) {
        const andarIdx = Math.floor(c / 2);
        if (activeRound.andarCards[andarIdx]) {
          visibleAndarCards.push(activeRound.andarCards[andarIdx]);
        }
      } else {
        const baharIdx = Math.floor(c / 2) - 1;
        if (activeRound.baharCards[baharIdx]) {
          visibleBaharCards.push(activeRound.baharCards[baharIdx]);
        }
      }
    }
  } else {
    // RESULT PHASE
    phase = "RESULT";
    visibleAndarCards = [...activeRound.andarCards];
    visibleBaharCards = [...activeRound.baharCards];
  }

  // Generate recent 15 round road history
  const history: Array<{ roundId: string; winner: "ANDAR" | "BAHAR"; joker: string; count: number }> = [];
  const startIdx = Math.max(0, activeRoundIndex - 15);
  for (let i = startIdx; i < activeRoundIndex; i++) {
    const prev = curRounds[i];
    if (prev) {
      history.push({
        roundId: prev.roundId,
        winner: prev.winningSide,
        joker: prev.jokerCard.display,
        count: prev.totalCards,
      });
    }
  }

  // ZERO-LEAK SECURITY RULE:
  // While bets are still being placed in BETTING phase, NEVER leak the winner or card count to players!
  const isBettingWindow = phase === "BETTING";

  return {
    roundId: activeRound.roundId,
    roundSequence: activeRound.roundSequence,
    phase,
    countdownLeft,
    jokerCard: activeRound.jokerCard,
    andarCards: visibleAndarCards,
    baharCards: visibleBaharCards,
    winningSide: isBettingWindow ? (null as any) : activeRound.winningSide,
    winningCard: isBettingWindow ? (null as any) : activeRound.winningCard,
    predictedWinner: activeRound.winningSide,
    totalDealtCards: isBettingWindow ? 0 : activeRound.totalCards,
    serverTime: now,
    history: history.reverse(),
  };
}
