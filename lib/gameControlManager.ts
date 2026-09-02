// Authoritative Studio Game Control & Outcome Override Manager (God Mode)
// Enables the Studio Owner to manually force crash points, bust players, or select winning card sides.

import { db } from "./db";

export interface CrashOverrideConfig {
  mode: "AUTO" | "FORCED";
  forcedMultiplier: number | null;
  roundsRemaining: number;
  label?: string;
  updatedAt: number;
}

export interface AndarBaharOverrideConfig {
  mode: "AUTO" | "FORCED";
  forcedWinner: "ANDAR" | "BAHAR" | null;
  roundsRemaining: number;
  label?: string;
  updatedAt: number;
}

export interface StudioGameControlState {
  royal_skyrush: CrashOverrideConfig;
  royal_cricketblast: CrashOverrideConfig;
  royal_andarbahar: AndarBaharOverrideConfig;
}

const defaultState: StudioGameControlState = {
  royal_skyrush: {
    mode: "AUTO",
    forcedMultiplier: null,
    roundsRemaining: 0,
    updatedAt: Date.now(),
  },
  royal_cricketblast: {
    mode: "AUTO",
    forcedMultiplier: null,
    roundsRemaining: 0,
    updatedAt: Date.now(),
  },
  royal_andarbahar: {
    mode: "AUTO",
    forcedWinner: null,
    roundsRemaining: 0,
    updatedAt: Date.now(),
  },
};

const GLOBAL_OVERRIDE_KEY = Symbol.for("royal_studio_game_overrides_v1");
const globalContainer: { state: StudioGameControlState } = (globalThis as any)[GLOBAL_OVERRIDE_KEY] || {
  state: { ...defaultState },
};
(globalThis as any)[GLOBAL_OVERRIDE_KEY] = globalContainer;

// Get current live overrides for all 3 games
export function getAllGameOverrides(): StudioGameControlState {
  return globalContainer.state;
}

// Get override for a specific game
export function getGameOverride(gameUid: string) {
  if (gameUid === "royal_skyrush") return globalContainer.state.royal_skyrush;
  if (gameUid === "royal_cricketblast") return globalContainer.state.royal_cricketblast;
  if (gameUid === "royal_andarbahar") return globalContainer.state.royal_andarbahar;
  return null;
}

// Set Crash Game override
export function setCrashGameOverride(
  gameUid: "royal_skyrush" | "royal_cricketblast",
  forcedMultiplier: number,
  roundsRemaining: number = 1,
  label?: string
) {
  const mult = Number(Math.max(1.01, Math.min(1000.0, forcedMultiplier)).toFixed(2));
  globalContainer.state[gameUid] = {
    mode: "FORCED",
    forcedMultiplier: mult,
    roundsRemaining: Math.max(1, roundsRemaining),
    label: label || `Manual Override: Crash at ${mult}x`,
    updatedAt: Date.now(),
  };
  persistToDatabase();
  return globalContainer.state[gameUid];
}

// Set Andar Bahar winning side override
export function setAndarBaharOverride(
  forcedWinner: "ANDAR" | "BAHAR",
  roundsRemaining: number = 1,
  label?: string
) {
  globalContainer.state.royal_andarbahar = {
    mode: "FORCED",
    forcedWinner,
    roundsRemaining: Math.max(1, roundsRemaining),
    label: label || `Manual Override: Force ${forcedWinner} Win`,
    updatedAt: Date.now(),
  };
  persistToDatabase();
  return globalContainer.state.royal_andarbahar;
}

// Consume 1 round of override (called when round concludes)
export function consumeGameOverride(gameUid: string) {
  const current = (globalContainer.state as any)[gameUid];
  if (!current || current.mode !== "FORCED") return;

  if (current.roundsRemaining > 1) {
    current.roundsRemaining -= 1;
  } else {
    // Revert back to AUTO
    if (gameUid === "royal_andarbahar") {
      globalContainer.state.royal_andarbahar = {
        mode: "AUTO",
        forcedWinner: null,
        roundsRemaining: 0,
        updatedAt: Date.now(),
      };
    } else {
      (globalContainer.state as any)[gameUid] = {
        mode: "AUTO",
        forcedMultiplier: null,
        roundsRemaining: 0,
        updatedAt: Date.now(),
      };
    }
  }
  persistToDatabase();
}

// Clear override for a specific game
export function clearGameOverride(gameUid: string) {
  if (gameUid === "royal_skyrush" || gameUid === "royal_cricketblast") {
    globalContainer.state[gameUid] = {
      mode: "AUTO",
      forcedMultiplier: null,
      roundsRemaining: 0,
      updatedAt: Date.now(),
    };
  } else if (gameUid === "royal_andarbahar") {
    globalContainer.state.royal_andarbahar = {
      mode: "AUTO",
      forcedWinner: null,
      roundsRemaining: 0,
      updatedAt: Date.now(),
    };
  }
  persistToDatabase();
}

// Reset all 3 games to standard AUTO RNG
export function resetAllGameOverrides() {
  globalContainer.state = {
    royal_skyrush: {
      mode: "AUTO",
      forcedMultiplier: null,
      roundsRemaining: 0,
      updatedAt: Date.now(),
    },
    royal_cricketblast: {
      mode: "AUTO",
      forcedMultiplier: null,
      roundsRemaining: 0,
      updatedAt: Date.now(),
    },
    royal_andarbahar: {
      mode: "AUTO",
      forcedWinner: null,
      roundsRemaining: 0,
      updatedAt: Date.now(),
    },
  };
  persistToDatabase();
}

// Optional asynchronous background sync to DB
async function persistToDatabase() {
  try {
    await db.siteSetting.upsert({
      where: { id: "game_control_overrides" },
      update: {
        enabledProviders: JSON.stringify(globalContainer.state),
      },
      create: {
        id: "game_control_overrides",
        enabledProviders: JSON.stringify(globalContainer.state),
      },
    });
  } catch (err) {
    // Non-blocking in memory
  }
}
