export interface StudioGame {
  game_id: number;
  game_uid: string;
  name: string;
  provider: string;
  category: string;
  rtp: number;
  max_multiplier: number;
  logo: string | null;
  thumbnail: string;
  description: string;
  isFeatured?: boolean;
}

export const STUDIO_GAMES: StudioGame[] = [
  {
    game_id: 88801,
    game_uid: "royal_skyrush",
    name: "Sky Rush",
    provider: "Royal Games Studio",
    category: "Crash / Multiplier",
    rtp: 97.5,
    max_multiplier: 1000.0,
    logo: null,
    thumbnail: "/games/royal_skyrush.svg",
    description: "Futuristic high-speed aerial flight machine. Watch the multiplier ascend and cash out before the supersonic sonic boom!",
    isFeatured: true,
  },
  {
    game_id: 88802,
    game_uid: "royal_cricketblast",
    name: "Cricket Blast",
    provider: "Royal Games Studio",
    category: "Crash / Sports",
    rtp: 97.6,
    max_multiplier: 500.0,
    logo: null,
    thumbnail: "/games/royal_cricketblast.svg",
    description: "Night stadium cricket hit. Batter smashes the ball into the night sky as multiplier escalates before catch.",
    isFeatured: true,
  },
  {
    game_id: 88803,
    game_uid: "royal_andarbahar",
    name: "Andar Bahar Royale",
    provider: "Royal Games Studio",
    category: "Table / Live Cards",
    rtp: 96.0,
    max_multiplier: 1.95,
    logo: null,
    thumbnail: "/games/royal_andarbahar.svg",
    description: "Global live synchronized multiplayer Andar Bahar with 7-figure VIP felt, 3D card dealing, and instant payouts.",
    isFeatured: true,
  },
];
