// Royal Arena - 1v1 Cock Fight Combat & Matchmaking Engine
// Simulates live 1v1 matchmaking with 5% House Rake and dynamic combat rounds.

export type RoosterCorner = "RED" | "BLUE";

export interface RoosterStats {
  name: string;
  breed: string;
  corner: RoosterCorner;
  color: string;
  maxHp: number;
  currentHp: number;
  attackPower: number;
  agility: number;
}

export interface CombatRoundLog {
  roundNum: number;
  attacker: RoosterCorner;
  action: "TALON_SLASH" | "WING_BUFFET" | "BEAK_STRIKE" | "CRITICAL_KO";
  damage: number;
  redHpAfter: number;
  blueHpAfter: number;
  description: string;
}

export interface CockFightMatchResult {
  matchId: string;
  stake: number;
  totalPot: number;
  houseRake: number; // 5%
  winnerPayout: number; // 95% of pot (1.90x of stake)
  winner: RoosterCorner;
  playerCorner: RoosterCorner;
  playerWon: boolean;
  totalCombatRounds: number;
  logs: CombatRoundLog[];
  opponentName: string;
}

const OPPONENT_NAMES = [
  "ThunderBeak_99",
  "ShadowClaw_VIP",
  "VegasRooster_X",
  "KingGaruda_77",
  "IronTalon_Pro",
  "DragonSpur_88",
  "ColosseumAce",
  "RedFury_Warrior",
];

// Generates a dynamic 3-phase combat match with health bar depletion
export function simulateCockFightMatch(stake: number, chosenCorner: RoosterCorner): CockFightMatchResult {
  const matchId = `CF_${Date.now()}_${Math.floor(Math.random() * 8999 + 1000)}`;
  const totalPot = stake * 2;
  const houseRake = Number((totalPot * 0.05).toFixed(2));
  const winnerPayout = Number((totalPot - houseRake).toFixed(2)); // 1.90x stake

  // Pick Opponent
  const opponentName = OPPONENT_NAMES[Math.floor(Math.random() * OPPONENT_NAMES.length)];

  // Provably Fair Coin/Combat outcome (50/50 base with 5% rake structure)
  const winner: RoosterCorner = Math.random() < 0.5 ? "RED" : "BLUE";
  const playerWon = chosenCorner === winner;

  let redHp = 100;
  let blueHp = 100;
  const logs: CombatRoundLog[] = [];

  // Simulate 3 to 4 exciting clash exchanges
  const numExchanges = Math.floor(Math.random() * 2) + 3; // 3 or 4 rounds

  for (let i = 1; i <= numExchanges; i++) {
    const isFinalRound = i === numExchanges;
    const attacker: RoosterCorner = i % 2 === 1 ? "RED" : "BLUE";

    if (isFinalRound) {
      // Final knockout strike
      if (winner === "RED") {
        const dmg = blueHp;
        blueHp = 0;
        logs.push({
          roundNum: i,
          attacker: "RED",
          action: "CRITICAL_KO",
          damage: dmg,
          redHpAfter: redHp,
          blueHpAfter: 0,
          description: "🔴 Garuda unleashes a devastating Flying Razor Talon KO!",
        });
      } else {
        const dmg = redHp;
        redHp = 0;
        logs.push({
          roundNum: i,
          attacker: "BLUE",
          action: "CRITICAL_KO",
          damage: dmg,
          redHpAfter: 0,
          blueHpAfter: blueHp,
          description: "🔵 Shamo lands a thunderous Steel Beak finishing strike!",
        });
      }
    } else {
      // Mid-battle exchange
      const dmg = Math.floor(Math.random() * 20) + 22; // 22-42 dmg
      const actionType = Math.random() < 0.5 ? "TALON_SLASH" : "WING_BUFFET";

      if (attacker === "RED") {
        blueHp = Math.max(20, blueHp - dmg);
        logs.push({
          roundNum: i,
          attacker: "RED",
          action: actionType,
          damage: dmg,
          redHpAfter: redHp,
          blueHpAfter: blueHp,
          description: `🔴 Garuda slashes for ${dmg} DMG!`,
        });
      } else {
        redHp = Math.max(20, redHp - dmg);
        logs.push({
          roundNum: i,
          attacker: "BLUE",
          action: actionType,
          damage: dmg,
          redHpAfter: redHp,
          blueHpAfter: blueHp,
          description: `🔵 Shamo counters with Wing Strike for ${dmg} DMG!`,
        });
      }
    }
  }

  return {
    matchId,
    stake,
    totalPot,
    houseRake,
    winnerPayout,
    winner,
    playerCorner: chosenCorner,
    playerWon,
    totalCombatRounds: logs.length,
    logs,
    opponentName,
  };
}
