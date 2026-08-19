export interface StudioGame {
  game_id: number;
  game_uid: string;
  name: string;
  provider: string;
  category: string;
  rtp: number;
  max_multiplier: number;
  logo: string | null;
  description: string;
}

export const STUDIO_GAMES: StudioGame[] = [
  {
    game_id: 88801,
    game_uid: "royal_coinflip",
    name: "Coin Flip Royale",
    provider: "Royal Games",
    category: "Casual / Instant Win",
    rtp: 98.5,
    max_multiplier: 100.0,
    logo: null,
    description: "Classic Heads or Tails instant multiplier with 3D physics and streak bonuses.",
  },
  {
    game_id: 88802,
    game_uid: "royal_andarbahar",
    name: "Andar Bahar Live",
    provider: "Royal Games",
    category: "Table / Live Indian",
    rtp: 98.0,
    max_multiplier: 25.0,
    logo: null,
    description: "Traditional Indian card game with Joker opening card, Andar/Bahar bets, and bead plate roadmap.",
  },
  {
    game_id: 88803,
    game_uid: "royal_chickencross",
    name: "Chicken Road Cross",
    provider: "Royal Games",
    category: "Crash / Stepper",
    rtp: 97.8,
    max_multiplier: 250.0,
    logo: null,
    description: "Multi-lane traffic road crossing multiplier crash game with step-by-step cashout.",
  },
  {
    game_id: 88804,
    game_uid: "royal_aviator",
    name: "Aviator Royale Crash",
    provider: "Royal Games",
    category: "Crash / Flash",
    rtp: 97.0,
    max_multiplier: 1000.0,
    logo: null,
    description: "High-adrenaline curve multiplier crash game. Cash out before the plane flies away!",
  },
  {
    game_id: 88805,
    game_uid: "royal_mines",
    name: "Mines Gold",
    provider: "Royal Games",
    category: "Originals / Instant",
    rtp: 98.2,
    max_multiplier: 500.0,
    logo: null,
    description: "5x5 minefield grid. Uncover gems and cash out anytime before hitting a mine.",
  },
  {
    game_id: 88806,
    game_uid: "royal_roulette",
    name: "European Roulette",
    provider: "Royal Games",
    category: "Table / Wheel",
    rtp: 97.3,
    max_multiplier: 36.0,
    logo: null,
    description: "37-pocket European roulette with straight-up bets, Red/Black, and Even/Odd.",
  },
];

export const ROYAL_STUDIO_GAMES = STUDIO_GAMES;
