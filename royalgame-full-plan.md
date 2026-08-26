# 👑 ROYAL GAMES STUDIO — MASTER ARCHITECTURE & FULL PLAN
**File Name**: `royalgame-full-plan.md`  
**Purpose**: Master architectural blueprint and operational reference for the **Royal Games Studio (RGS)**.

---

## 🏛️ Unified Single-Site & Single-Database Architecture

The project is structured as a streamlined, single-app ecosystem to eliminate database collisions, port conflicts, and unnecessary multi-tier complexity:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               [royalgames] - GAME STUDIO & RGS                                   │
│  - Remote Gaming Server (RGS) hosting 10 native HTML5 crash, stepper, physics & table games.     │
│  - Authoritative Global Synchronized Multiplayer Crash Engine (Sky Rush & Cricket Blast).        │
│  - Provably Fair RNG Math Engine with configurable RTP (97.0% – 99.0%).                         │
│  - Enterprise 7-Figure Left Sidebar Admin Dashboard (/admin).                                    │
│  - Showcase & Fullscreen Responsive Play Arena (/play/[sessionId]?token=...&game=...).          │
│  - Direct B2B API Gateway (/api/v1/launch, /api/v1/games) for external client casino integration.│
│  - Authoritative Round Settlement API (/api/studio/round) & Realtime Webhook Callback Dispatcher. │
└───────────────────────────────────────────────┬──────────────────────────────────────────────────┘
                                                │ (B2B REST API + Webhooks)
                                                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             EXTERNAL CLIENT CASINOS (PRODUCTION)                                 │
│  - External client websites launch games via Royal Games Studio B2B API.                          │
│  - Real-time round settlements received via cryptographically signed webhooks (/api/callback).  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

> **Note on Future GGR Aggregator**:  
> For the standalone B2B GGR Aggregator & Operator Portal (`royalggr`), refer to the root PRD: [`ROYALGGR_PRD.md`](file:///c:/Users/vikram/Desktop/royalgames-project/ROYALGGR_PRD.md).

---

## 📁 `royalgames` — Gaming Studio & Remote Gaming Server (RGS)
**Port**: `http://localhost:3000` (or `http://localhost:3002`)

### Role & Responsibilities:
The core Remote Gaming Server (RGS) that develops, computes, renders, and serves all proprietary HTML5 casino games. It manages authoritative game math, real-time multiplayer loops, player session tokens, B2B API integrations, and instant webhook callbacks to external operators.

### 🎮 The 10 Proprietary Studio Games:
1. 🚀 **Sky Rush** (`royal_skyrush`) — **Multiplayer Global Synchronized Crash Multiplier Jet**
   - *Mechanics*: Continuous 24/7 global server loop. Dual independent bet panels, auto-cashout, ejection parachute passenger jump animations, sonic boom explosion bust.
   - *RTP*: 97.5% | *Max Multiplier*: 1,000x | *Asset*: `/games/royal_skyrush.svg`
2. 🐯 **Tiger Trail** (`royal_tigertrail`) — **Jungle River Stepper & Cashout Expedition**
   - *Mechanics*: 10-step stone path across a wild jungle river. Players can step forward to multiply their wager or cash out at any stone.
   - *RTP*: 98.0% | *Max Multiplier*: 500x | *Asset*: `/games/royal_tigertrail.svg`
3. 💣 **Bomb Grid** (`royal_bombgrid`) — **5x5 Laser Energy Crystal Minefield**
   - *Mechanics*: Uncover safe glowing crystals across a 25-tile grid with selectable bomb count (1 to 24). Cash out at any stage.
   - *RTP*: 98.5% | *Max Multiplier*: 500x | *Asset*: `/games/royal_bombgrid.svg`
4. 📍 **Drop X** (`royal_dropx`) — **60FPS Physics Plinko Multi-Pin Drop**
   - *Mechanics*: Precision real-time gravity physics with selectable 8–16 pin rows and Low / Medium / High risk bucket distributions.
   - *RTP*: 98.2% | *Max Multiplier*: 1,000x | *Asset*: `/games/royal_dropx.svg`
5. 🏏 **Cricket Blast** (`royal_cricketblast`) — **Multiplayer Global Synchronized Night Stadium Crash**
   - *Mechanics*: Batter smashes super-six ball high into the floodlit stadium night sky as the multiplier escalates until boundary catch out.
   - *RTP*: 97.6% | *Max Multiplier*: 500x | *Asset*: `/games/royal_cricketblast.svg`
6. ♾️ **Infinity X** (`royal_infinityx`) — **Quantum Hyperspace Limbo Fast Multiplier**
   - *Mechanics*: Ultra-fast target probability multiplier generator with real-time target win chance calculator.
   - *RTP*: 98.8% | *Max Multiplier*: 10,000x | *Asset*: `/games/royal_infinityx.svg`
7. 🏛️ **Treasure Tower** (`royal_treasuretower`) — **8-Floor Ancient Temple Pyramid Risk Stepper**
   - *Mechanics*: Ascend through 8 vertical temple floors by picking safe stone doors while avoiding hidden crumble traps.
   - *RTP*: 98.0% | *Max Multiplier*: 500x | *Asset*: `/games/royal_treasuretower.svg`
8. 🎲 **Dice X** (`royal_dicex`) — **3D Probability Dice Table**
   - *Mechanics*: Sleek isometric dice with Roll Under / Over threshold slider and instant payout odds calculation.
   - *RTP*: 99.0% | *Max Multiplier*: 990x | *Asset*: `/games/royal_dicex.svg`
9. 🃏 **Card Climb** (`royal_cardclimb`) — **3D Royal Hi-Lo Felt Table**
   - *Mechanics*: Predict whether the next sequential royal card is Higher or Lower to build multiplier streaks.
   - *RTP*: 98.3% | *Max Multiplier*: 120x | *Asset*: `/games/royal_cardclimb.svg`
10. 🎡 **Lucky Wheel X** (`royal_luckywheel`) — **60FPS Multiplier Sector Fortune Wheel**
    - *Mechanics*: Dynamic spinning sector wheel with low/med/high volatility wheel configurations and instant pointer stop.
    - *RTP*: 97.0% | *Max Multiplier*: 100x | *Asset*: `/games/royal_luckywheel.svg`

---

## 🏛️ Enterprise 7-Figure Left Sidebar Admin Dashboard (`/admin`):
- **Left-Fixed Sidebar**:
  - `👑 ROYAL GAMES STUDIO` branding with `RGS Engine` tag & live green heartbeat.
  - **OPERATOR MANAGEMENT**: `B2B Clients & Keys`, `Deposit Approvals` (with pending badge), `Studio Overview`.
  - **ENGINE & AUDIT STREAM**: `Round Audit Ledger` (with live auto-polling telemetry), `B2B API Integration Docs`.
  - **EXTERNAL LINK**: `Live Game Suite` launcher.
  - **SUPERADMIN PROFILE**: Account profile card with 1-click logout.
- **Top Header Bar**: Breadcrumbs path, 4s background sync heartbeat indicator, manual refresh with spin animation, and direct Showcase launch button.

---

## ⚙️ Core Studio Backend Engine:
- **Global Multiplayer Crash Synchronization Engine (`serverCrashEngine.ts`)**:
  - Single authoritative 24/7 server game clock loop for `royal_skyrush` and `royal_cricketblast`.
  - Phases: `COUNTDOWN (5.0s)` ➔ `FLYING / AIRBORNE` ➔ `CRASHED / CAUGHT (3.5s)`.
  - Endpoint: `GET /api/studio/multiplayer/state?game=...`
- **Authoritative Round Settlement API (`POST /api/studio/round`)**:
  - Authoritatively computes player balance, logs round into `db.gameRound`, calculates GGR fee, and dispatches real-time webhooks to the operator's `callbackUrl`.
- **Session Info Verification API (`GET /api/studio/session`)**:
  - Decodes token, validates player balance and operator identity from `db.gameSession`.
- **Direct B2B Launch API Gateway (`POST /api/v1/launch`)**:
  - Validates operator token and IP whitelist, generates secure session UUID, and returns authenticated game launch URL.

---

## 🔒 Security & Provably Fair Cryptography

1. **Provably Fair SHA-256 Engine**:
   - Every round's outcome is mathematically calculated before the round starts using:
     $$\text{Result} = \text{HMAC-SHA256}(\text{Server Seed}, \text{Client Seed} + \text{Nonce})$$
2. **Idempotency & Replay Attack Defense**:
   - Every round settlement generated by Royal Games Studio contains a unique idempotency serial number (`SN_ROYAL_<timestamp>_<rand>`).
   - Webhook receivers reject duplicate serial numbers, preventing replay attacks or double credits.
3. **IP Whitelist Firewall**:
   - External B2B API requests are strictly filtered against operator-configured IP whitelists.
