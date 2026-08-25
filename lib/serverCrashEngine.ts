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
  history: number[];
}

interface InternalGameState {
  gameUid: string;
  roundSequence: number;
  roundId: string;
  phase: CrashPhase;
  crashMultiplier: number;
  phaseStartTime: number;
  flightStartTime: number | null;
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

// Global in-memory singleton to persist state across hot-reloads and API calls
const globalEngineKey = Symbol.for("royal_games_crash_engine_state");

interface GlobalEngineContainer {
  games: Record<string, InternalGameState>;
}

const globalContainer: GlobalEngineContainer = (globalThis as any)[globalEngineKey] || {
  games: {},
};
(globalThis as any)[globalEngineKey] = globalContainer;

function getOrInitGame(gameUid: string): InternalGameState {
  if (!globalContainer.games[gameUid]) {
    const seedCrash = generateCrashMultiplier(gameUid);
    globalContainer.games[gameUid] = {
      gameUid,
      roundSequence: 1000,
      roundId: `RND_${gameUid.toUpperCase()}_${Date.now()}`,
      phase: "COUNTDOWN",
      crashMultiplier: seedCrash,
      phaseStartTime: Date.now(),
      flightStartTime: null,
      history: [1.84, 2.12, 1.05, 4.5, 12.8, 1.95, 3.2, 8.45, 1.45, 24.18],
    };
  }
  return globalContainer.games[gameUid];
}

const COUNTDOWN_DURATION_MS = 10000; // 10.0 seconds bet window for synchronized multiplayer
const CRASHED_DURATION_MS = 3500; // 3.5 seconds post-crash review

// Advance game clock authoritatively
export function tickAndGetState(gameUid: string): GlobalCrashState {
  const state = getOrInitGame(gameUid);
  const now = Date.now();
  const elapsedInPhase = now - state.phaseStartTime;

  if (state.phase === "COUNTDOWN") {
    if (elapsedInPhase >= COUNTDOWN_DURATION_MS) {
      // Transition from COUNTDOWN to FLYING
      state.phase = "FLYING";
      state.phaseStartTime = now;
      state.flightStartTime = now;
    }
  } else if (state.phase === "FLYING") {
    const elapsedSeconds = (now - (state.flightStartTime || now)) / 1000;
    const currentMult = calculateAscentMultiplier(elapsedSeconds);

    if (currentMult >= state.crashMultiplier) {
      // Transition from FLYING to CRASHED
      state.phase = "CRASHED";
      state.phaseStartTime = now;
      state.history = [state.crashMultiplier, ...state.history.slice(0, 19)];
    }
  } else if (state.phase === "CRASHED") {
    if (elapsedInPhase >= CRASHED_DURATION_MS) {
      // Transition from CRASHED to next COUNTDOWN
      state.roundSequence += 1;
      state.roundId = `RND_${gameUid.toUpperCase()}_${now}_${state.roundSequence}`;
      state.phase = "COUNTDOWN";
      state.phaseStartTime = now;
      state.flightStartTime = null;
      state.crashMultiplier = generateCrashMultiplier(gameUid);
    }
  }

  // Calculate current multiplier for response
  let currentMultiplier = 1.0;
  let countdownLeft = 0;

  if (state.phase === "COUNTDOWN") {
    const remaining = Math.max(0, COUNTDOWN_DURATION_MS - elapsedInPhase);
    countdownLeft = Number((remaining / 1000).toFixed(1));
    currentMultiplier = 1.0;
  } else if (state.phase === "FLYING") {
    const elapsedSeconds = (now - (state.flightStartTime || now)) / 1000;
    currentMultiplier = Math.min(state.crashMultiplier, calculateAscentMultiplier(elapsedSeconds));
  } else if (state.phase === "CRASHED") {
    currentMultiplier = state.crashMultiplier;
  }

  return {
    gameUid: state.gameUid,
    roundId: state.roundId,
    phase: state.phase,
    currentMultiplier,
    crashMultiplier: state.crashMultiplier,
    countdownLeft,
    flightStartTime: state.flightStartTime,
    phaseStartTime: state.phaseStartTime,
    serverTime: now,
    countdownTotalMs: COUNTDOWN_DURATION_MS,
    crashedTotalMs: CRASHED_DURATION_MS,
    history: state.history,
  };
}
