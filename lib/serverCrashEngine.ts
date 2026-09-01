// Global Server-Side Authoritative Deterministic Crash Engine for Sky Rush & Cricket Blast
// Pure Epoch Mathematics ensures 100% synchronization across all serverless lambda instances, edge nodes, and B2B clients.

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

// Advance game clock authoritatively and deterministically based on absolute real-time clock
export function tickAndGetState(gameUid: string = "royal_skyrush", targetTime?: number): GlobalCrashState {
  const now = targetTime ?? Date.now();
  const HOUR_MS = 3600000;
  const hourIndex = Math.floor(now / HOUR_MS);

  const curRounds = computeHourRounds(gameUid, hourIndex);
  let activeRoundIndex = curRounds.findIndex(
    (r) => now >= r.countdownStart && now < r.crashedEndTime
  );

  let activeRound: InternalRoundSchedule;
  if (activeRoundIndex !== -1) {
    activeRound = curRounds[activeRoundIndex];
  } else {
    // If exact boundary or past hour end before next hour computes
    if (now >= curRounds[curRounds.length - 1].crashedEndTime) {
      const nextHourRounds = computeHourRounds(gameUid, hourIndex + 1);
      activeRound = nextHourRounds[0] || curRounds[curRounds.length - 1];
      activeRoundIndex = 0;
    } else {
      activeRound = curRounds[0];
      activeRoundIndex = 0;
    }
  }

  // Compile history array from recent completed rounds
  const history: number[] = [];
  // 1. Collect from current hour preceding rounds
  for (let i = activeRoundIndex - 1; i >= 0 && history.length < 20; i--) {
    history.push(curRounds[i].crashMultiplier);
  }
  // 2. If needed, supplement from previous hour rounds
  if (history.length < 20 && hourIndex > 0) {
    const prevHourRounds = computeHourRounds(gameUid, hourIndex - 1);
    for (let i = prevHourRounds.length - 1; i >= 0 && history.length < 20; i--) {
      history.push(prevHourRounds[i].crashMultiplier);
    }
  }
  // Fallback defaults if beginning of epoch
  if (history.length === 0) {
    history.push(1.84, 2.12, 1.05, 4.5, 12.8, 1.95, 3.2, 8.45, 1.45, 24.18);
  }

  let phase: CrashPhase;
  let currentMultiplier = 1.0;
  let countdownLeft = 0;
  let phaseStartTime = activeRound.countdownStart;
  let flightStartTime: number | null = null;

  if (now < activeRound.flightStart) {
    // In 10.0s COUNTDOWN
    phase = "COUNTDOWN";
    phaseStartTime = activeRound.countdownStart;
    const remainingMs = Math.max(0, activeRound.flightStart - now);
    countdownLeft = Number((remainingMs / 1000).toFixed(1));
    currentMultiplier = 1.0;
    flightStartTime = null;
  } else if (now < activeRound.crashTime) {
    // In FLYING
    phase = "FLYING";
    phaseStartTime = activeRound.flightStart;
    flightStartTime = activeRound.flightStart;
    const elapsedSec = (now - activeRound.flightStart) / 1000;
    currentMultiplier = Number(
      Math.min(activeRound.crashMultiplier, calculateAscentMultiplier(elapsedSec)).toFixed(2)
    );
    countdownLeft = 0;
  } else {
    // In CRASHED review (3.5s pause)
    phase = "CRASHED";
    phaseStartTime = activeRound.crashTime;
    flightStartTime = activeRound.flightStart;
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
    history,
  };
}
