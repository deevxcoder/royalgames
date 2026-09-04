import { getGameOverride, consumeGameOverride } from "./gameControlManager";

export type CrashPhase = "COUNTDOWN" | "FLYING" | "CRASHED";

export interface GlobalCrashState {
  gameUid: string;
  roundId: string;
  phase: CrashPhase;
  currentMultiplier: number;
  crashMultiplier: number;
  countdownLeft: number;
  flightStartTime: number | null;
  phaseStartTime: number;
  serverTime: number;
  countdownTotalMs: number;
  crashedTotalMs: number;
  flightDurationMs: number;
  flightStart: number;
  crashTime: number;
  crashedEndTime: number;
  history: number[];
}

export interface InternalRoundSchedule {
  roundSequence: number;
  roundId: string;
  crashMultiplier: number;
  flightDurationMs: number;
  countdownStart: number; // T0
  flightStart: number;    // T0 + 10000
  crashTime: number;      // T0 + 10000 + flightDurationMs
  crashedEndTime: number; // crashTime + 3500
}

export const COUNTDOWN_DURATION_MS = 10000; // Exact 10.0 seconds bet window
export const CRASHED_DURATION_MS = 3500;    // Exact 3.5 seconds post-crash cooldown

// Dynamic RTP configuration storage
const rtpConfigKey = Symbol.for("royal_games_rtp_config");
const rtpContainer: Record<string, number> = (globalThis as any)[rtpConfigKey] || {};
(globalThis as any)[rtpConfigKey] = rtpContainer;

export function setGameRtpConfig(gameUid: string, rtp: number) {
  rtpContainer[gameUid] = rtp;
}

export function getGameRtpConfig(gameUid: string): number {
  return rtpContainer[gameUid] || (gameUid === "royal_cricketblast" ? 97.6 : 97.5);
}

// Multiplier ascent curve function
export function calculateAscentMultiplier(elapsedSeconds: number): number {
  if (elapsedSeconds <= 0) return 1.0;
  const mult = Math.exp(0.065 * Math.pow(elapsedSeconds * 1.5, 1.25));
  return Number(Math.max(1.0, mult).toFixed(2));
}

// Exact mathematical inverse: calculate flight duration in seconds for a given crash multiplier
export function calculateFlightDurationSeconds(targetMultiplier: number): number {
  if (targetMultiplier <= 1.01) return 0.25;
  const lnM = Math.log(Math.max(1.0001, targetMultiplier));
  const inner = lnM / 0.065;
  const elapsed = Math.pow(inner, 0.8) / 1.5;
  return Math.max(0.25, Number(elapsed.toFixed(3)));
}

// Fast, deterministic 32-bit PRNG (Mulberry32)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getSeedForRound(gameUid: string, hourIndex: number, roundInHour: number): number {
  let hash = 0;
  const str = `${gameUid}_h${hourIndex}_r${roundInHour}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 123456789;
}

// Deterministic Provably Fair crash generator for any round sequence
export function generateDeterministicCrash(
  gameUid: string,
  hourIndex: number,
  roundInHour: number,
  customRtp?: number
): number {
  const currentRtp = customRtp ?? getGameRtpConfig(gameUid);
  const houseEdgeFraction = Math.max(0.01, (100 - currentRtp) / 100);
  const seed = getSeedForRound(gameUid, hourIndex, roundInHour);
  const rand = mulberry32(seed)();

  // Instant crash based on house edge fraction
  if (rand < houseEdgeFraction) return 1.0;

  // Standard Pareto Inverse Distribution calibrated to target RTP
  const rtpFraction = Math.max(0.8, currentRtp / 100);
  const raw = (rtpFraction - 0.005) / (1 - rand);
  const mult = Math.floor(raw * 100) / 100;
  return Number(Math.min(1000.0, Math.max(1.01, mult)).toFixed(2));
}

// In-memory cache per hour to make lookups virtually 0ms
const hourScheduleCache: Map<string, InternalRoundSchedule[]> = new Map();

export function computeHourRounds(gameUid: string, hourIndex: number, rtp?: number): InternalRoundSchedule[] {
  const effectiveRtp = rtp ?? getGameRtpConfig(gameUid);
  const cacheKey = `${gameUid}_${effectiveRtp}_h${hourIndex}`;
  const cached = hourScheduleCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const hourStart = hourIndex * 3600000;
  const hourEnd = hourStart + 3600000;
  const rounds: InternalRoundSchedule[] = [];

  let t = hourStart;
  let r = 0;

  while (t < hourEnd) {
    const crashM = generateDeterministicCrash(gameUid, hourIndex, r, rtp);
    const flightDurMs = Math.round(calculateFlightDurationSeconds(crashM) * 1000);
    const countdownStart = t;
    const flightStart = countdownStart + COUNTDOWN_DURATION_MS;
    const crashTime = flightStart + flightDurMs;
    const crashedEndTime = crashTime + CRASHED_DURATION_MS;
    const roundSequence = hourIndex * 1000 + r;

    rounds.push({
      roundSequence,
      roundId: `RND_${gameUid.toUpperCase()}_${countdownStart}_${roundSequence}`,
      crashMultiplier: crashM,
      flightDurationMs: flightDurMs,
      countdownStart,
      flightStart,
      crashTime,
      crashedEndTime,
    });

    t = crashedEndTime;
    r++;
  }

  hourScheduleCache.set(cacheKey, rounds);

  // Keep cache bounded (retain up to 30 hour segments)
  if (hourScheduleCache.size > 30) {
    const oldestKey = hourScheduleCache.keys().next().value;
    if (oldestKey) hourScheduleCache.delete(oldestKey);
  }

  return rounds;
}

interface LiveRoundState {
  roundSequence: number;
  roundId: string;
  crashMultiplier: number;
  flightDurationMs: number;
  countdownStart: number;
  flightStart: number;
  crashTime: number;
  crashedEndTime: number;
  isOverrideApplied: boolean;
}

const engineStoreKey = Symbol.for("royal_games_crash_engine_store_v3");
const engineStore: Record<
  string,
  {
    currentRound: LiveRoundState | null;
    history: number[];
    lastConsumedRoundId: string | null;
    roundCounter: number;
  }
> = (globalThis as any)[engineStoreKey] || {};
(globalThis as any)[engineStoreKey] = engineStore;

function getOrCreateStore(gameUid: string) {
  if (!engineStore[gameUid]) {
    engineStore[gameUid] = {
      currentRound: null,
      history: [1.84, 2.12, 1.05, 4.5, 12.8, 1.95, 3.2, 8.45, 1.45, 24.18],
      lastConsumedRoundId: null,
      roundCounter: Math.floor(Date.now() / 30000),
    };
  }
  return engineStore[gameUid];
}

// Advance game clock authoritatively and deterministically based on absolute real-time clock
export function tickAndGetState(gameUid: string = "royal_skyrush", targetTime?: number): GlobalCrashState {
  const now = targetTime ?? Date.now();
  const store = getOrCreateStore(gameUid);

  const startNewRound = (startTime: number): LiveRoundState => {
    store.roundCounter += 1;
    const roundSeq = store.roundCounter;
    const hourIndex = Math.floor(startTime / 3600000);
    const roundInHour = roundSeq % 1000;

    const override = getGameOverride(gameUid);
    let crashM: number;
    let isOverride = false;

    if (override && override.mode === "FORCED" && (override as any).forcedMultiplier) {
      crashM = (override as any).forcedMultiplier as number;
      isOverride = true;
    } else {
      crashM = generateDeterministicCrash(gameUid, hourIndex, roundInHour);
    }

    const flightDurMs = Math.round(calculateFlightDurationSeconds(crashM) * 1000);
    const countdownStart = startTime;
    const flightStart = countdownStart + COUNTDOWN_DURATION_MS;
    const crashTime = flightStart + flightDurMs;
    const crashedEndTime = crashTime + CRASHED_DURATION_MS;

    return {
      roundSequence: roundSeq,
      roundId: `RND_${gameUid.toUpperCase()}_${countdownStart}_${roundSeq}`,
      crashMultiplier: crashM,
      flightDurationMs: flightDurMs,
      countdownStart,
      flightStart,
      crashTime,
      crashedEndTime,
      isOverrideApplied: isOverride,
    };
  };

  if (!store.currentRound) {
    store.currentRound = startNewRound(now);
  }

  // Advance completed rounds cleanly
  while (now >= store.currentRound.crashedEndTime) {
    const finishedRound = store.currentRound;
    if (store.lastConsumedRoundId !== finishedRound.roundId) {
      store.lastConsumedRoundId = finishedRound.roundId;
      store.history.unshift(finishedRound.crashMultiplier);
      if (store.history.length > 20) store.history.pop();

      if (finishedRound.isOverrideApplied) {
        consumeGameOverride(gameUid);
      }
    }

    let nextStartTime = finishedRound.crashedEndTime;
    if (now - nextStartTime > 30000) {
      nextStartTime = now;
    }
    store.currentRound = startNewRound(nextStartTime);
  }

  // If in COUNTDOWN, check if an admin just applied or cleared a God Mode override
  if (now < store.currentRound.flightStart) {
    const override = getGameOverride(gameUid);
    if (override && override.mode === "FORCED" && (override as any).forcedMultiplier) {
      const forcedM = (override as any).forcedMultiplier as number;
      if (store.currentRound.crashMultiplier !== forcedM) {
        const forcedFlightDurMs = Math.round(calculateFlightDurationSeconds(forcedM) * 1000);
        store.currentRound.crashMultiplier = forcedM;
        store.currentRound.flightDurationMs = forcedFlightDurMs;
        store.currentRound.crashTime = store.currentRound.flightStart + forcedFlightDurMs;
        store.currentRound.crashedEndTime = store.currentRound.crashTime + CRASHED_DURATION_MS;
        store.currentRound.isOverrideApplied = true;
      }
    } else if (override && override.mode === "AUTO" && store.currentRound.isOverrideApplied) {
      const hourIndex = Math.floor(store.currentRound.countdownStart / 3600000);
      const roundInHour = store.currentRound.roundSequence % 1000;
      const normalCrash = generateDeterministicCrash(gameUid, hourIndex, roundInHour);
      const flightDurMs = Math.round(calculateFlightDurationSeconds(normalCrash) * 1000);
      store.currentRound.crashMultiplier = normalCrash;
      store.currentRound.flightDurationMs = flightDurMs;
      store.currentRound.crashTime = store.currentRound.flightStart + flightDurMs;
      store.currentRound.crashedEndTime = store.currentRound.crashTime + CRASHED_DURATION_MS;
      store.currentRound.isOverrideApplied = false;
    }
  }

  const activeRound = store.currentRound;
  let phase: CrashPhase;
  let currentMultiplier = 1.0;
  let countdownLeft = 0;
  let phaseStartTime = activeRound.countdownStart;

  if (now < activeRound.flightStart) {
    phase = "COUNTDOWN";
    phaseStartTime = activeRound.countdownStart;
    countdownLeft = Number((Math.max(0, activeRound.flightStart - now) / 1000).toFixed(1));
    currentMultiplier = 1.0;
  } else if (now < activeRound.crashTime) {
    phase = "FLYING";
    phaseStartTime = activeRound.flightStart;
    const elapsedSec = (now - activeRound.flightStart) / 1000;
    currentMultiplier = Number(
      Math.min(activeRound.crashMultiplier, calculateAscentMultiplier(elapsedSec)).toFixed(2)
    );
    countdownLeft = 0;
  } else {
    phase = "CRASHED";
    phaseStartTime = activeRound.crashTime;
    currentMultiplier = activeRound.crashMultiplier;
    countdownLeft = 0;
  }

  return {
    gameUid,
    roundId: activeRound.roundId,
    phase,
    currentMultiplier,
    crashMultiplier: activeRound.crashMultiplier,
    countdownLeft,
    flightStartTime: activeRound.flightStart,
    phaseStartTime,
    serverTime: now,
    countdownTotalMs: COUNTDOWN_DURATION_MS,
    crashedTotalMs: CRASHED_DURATION_MS,
    flightDurationMs: activeRound.flightDurationMs,
    flightStart: activeRound.flightStart,
    crashTime: activeRound.crashTime,
    crashedEndTime: activeRound.crashedEndTime,
    history: store.history,
  };
}
