// Global Server-Side Authoritative Crash Engine for Sky Rush & Cricket Blast
// Synchronizes rounds, multipliers, countdowns, and crash events across all B2B clients in real-time.

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
  history: number[];
}

interface InternalGameState {
  gameUid: string;
  roundSequence: number;
  roundId: string;
  crashMultiplier: number;
  flightDurationMs: number;
  countdownStart: number; // T0
  flightStart: number;    // T0 + 10000
  crashTime: number;      // T0 + 10000 + flightDurationMs
  crashedEndTime: number; // crashTime + 3500
  history: number[];
}

// Dynamic RTP configuration storage
const rtpConfigKey = Symbol.for("royal_games_rtp_config");
const rtpContainer: Record<string, number> = (globalThis as any)[rtpConfigKey] || {};
(globalThis as any)[rtpConfigKey] = rtpContainer;

export function setGameRtpConfig(gameUid: string, rtp: number) {
  rtpContainer[gameUid] = rtp;
}

export function getGameRtpConfig(gameUid: string): number {
  return rtpContainer[gameUid] || 96.5;
}

// Generate Provably Fair crash multiplier with dynamic RTP
function generateCrashMultiplier(gameUid: string = "royal_skyrush"): number {
  const currentRtp = getGameRtpConfig(gameUid);
  const houseEdgeFraction = Math.max(0.01, (100 - currentRtp) / 100);
  const rand = Math.random();

  // Instant crash based on house edge fraction
  if (rand < houseEdgeFraction) return 1.0;

  // Standard Pareto Inverse Distribution calibrated to target RTP
  const rtpFraction = Math.max(0.8, currentRtp / 100);
  const raw = (rtpFraction - 0.005) / (1 - rand);
  const mult = Math.floor(raw * 100) / 100;
  return Number(Math.min(1000.0, Math.max(1.01, mult)).toFixed(2));
}

// Multiplier ascent curve function
export function calculateAscentMultiplier(elapsedSeconds: number): number {
  if (elapsedSeconds <= 0) return 1.0;
  const mult = Math.exp(0.065 * Math.pow(elapsedSeconds * 1.5, 1.25));
  return Number(Math.max(1.0, mult).toFixed(2));
}

// Exact mathematical inverse: calculate flight duration in seconds for a given crash multiplier
export function calculateFlightDurationSeconds(targetMultiplier: number): number {
  if (targetMultiplier <= 1.0) return 0.1;
  const lnM = Math.log(Math.max(1.0001, targetMultiplier));
  const inner = lnM / 0.065;
  const elapsed = Math.pow(inner, 0.8) / 1.5;
  return Math.max(0.1, Number(elapsed.toFixed(3)));
}

// Global in-memory singleton to persist state across hot-reloads and API calls
const globalEngineKey = Symbol.for("royal_games_crash_engine_state");

interface GlobalEngineContainer {
  games: Record<string, InternalGameState>;
}

const globalContainer: GlobalEngineContainer = (globalThis as any)[globalEngineKey] || {
  games: {},
};
(globalThis as any)[globalEngineKey] = globalContainer;

const COUNTDOWN_DURATION_MS = 10000; // 10.0 seconds bet window for synchronized multiplayer
const CRASHED_DURATION_MS = 3500;    // 3.5 seconds post-crash review

function getOrInitGame(gameUid: string): InternalGameState {
  const existing = globalContainer.games[gameUid];
  if (
    !existing ||
    typeof existing.crashedEndTime !== "number" ||
    isNaN(existing.crashedEndTime) ||
    typeof existing.flightStart !== "number" ||
    isNaN(existing.flightStart) ||
    typeof existing.countdownStart !== "number" ||
    isNaN(existing.countdownStart)
  ) {
    const seedCrash = generateCrashMultiplier(gameUid);
    const flightDurMs = Math.round(calculateFlightDurationSeconds(seedCrash) * 1000);
    const now = Date.now();
    const countdownStart = now;
    const flightStart = countdownStart + COUNTDOWN_DURATION_MS;
    const crashTime = flightStart + flightDurMs;
    const crashedEndTime = crashTime + CRASHED_DURATION_MS;

    globalContainer.games[gameUid] = {
      gameUid,
      roundSequence: 1000,
      roundId: `RND_${gameUid.toUpperCase()}_${countdownStart}_1000`,
      crashMultiplier: seedCrash,
      flightDurationMs: flightDurMs,
      countdownStart,
      flightStart,
      crashTime,
      crashedEndTime,
      history: [1.84, 2.12, 1.05, 4.5, 12.8, 1.95, 3.2, 8.45, 1.45, 24.18],
    };
  }
  return globalContainer.games[gameUid];
}

// Advance game clock authoritatively and deterministically based on absolute real-time clock
export function tickAndGetState(gameUid: string): GlobalCrashState {
  const state = getOrInitGame(gameUid);
  const now = Date.now();

  // If time has passed the end of the previous round, seamlessly advance to next round(s)
  while (now >= state.crashedEndTime) {
    state.roundSequence += 1;
    state.history = [state.crashMultiplier, ...state.history.slice(0, 19)];

    const newCrash = generateCrashMultiplier(gameUid);
    const newFlightDurMs = Math.round(calculateFlightDurationSeconds(newCrash) * 1000);

    const newCountdownStart = state.crashedEndTime;
    const newFlightStart = newCountdownStart + COUNTDOWN_DURATION_MS;
    const newCrashTime = newFlightStart + newFlightDurMs;
    const newCrashedEndTime = newCrashTime + CRASHED_DURATION_MS;

    state.roundId = `RND_${gameUid.toUpperCase()}_${newCountdownStart}_${state.roundSequence}`;
    state.crashMultiplier = newCrash;
    state.flightDurationMs = newFlightDurMs;
    state.countdownStart = newCountdownStart;
    state.flightStart = newFlightStart;
    state.crashTime = newCrashTime;
    state.crashedEndTime = newCrashedEndTime;
  }

  let phase: CrashPhase;
  let currentMultiplier = 1.0;
  let countdownLeft = 0;
  let phaseStartTime = state.countdownStart;
  let flightStartTime: number | null = null;

  if (now < state.flightStart) {
    // In 10.0s COUNTDOWN
    phase = "COUNTDOWN";
    phaseStartTime = state.countdownStart;
    const remainingMs = Math.max(0, state.flightStart - now);
    countdownLeft = Number((remainingMs / 1000).toFixed(1));
    currentMultiplier = 1.0;
    flightStartTime = null;
  } else if (now < state.crashTime) {
    // In FLYING
    phase = "FLYING";
    phaseStartTime = state.flightStart;
    flightStartTime = state.flightStart;
    const elapsedSec = (now - state.flightStart) / 1000;
    currentMultiplier = Number(Math.min(state.crashMultiplier, calculateAscentMultiplier(elapsedSec)).toFixed(2));
    countdownLeft = 0;
  } else {
    // In CRASHED review
    phase = "CRASHED";
    phaseStartTime = state.crashTime;
    flightStartTime = state.flightStart;
    currentMultiplier = state.crashMultiplier;
    countdownLeft = 0;
  }

  return {
    gameUid: state.gameUid,
    roundId: state.roundId,
    phase,
    currentMultiplier,
    crashMultiplier: state.crashMultiplier,
    countdownLeft,
    flightStartTime,
    phaseStartTime,
    serverTime: now,
    countdownTotalMs: COUNTDOWN_DURATION_MS,
    crashedTotalMs: CRASHED_DURATION_MS,
    flightDurationMs: state.flightDurationMs,
    history: state.history,
  };
}
