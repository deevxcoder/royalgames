# 👑 ROYAL GAMES STUDIO — B2B API & IFRAME INTEGRATION GUIDE
> **Document Version**: 2.5.0 (Authoritative Release)  
> **Target Audience**: Client Casino Operators, Platform Integrators, Backend & Frontend Engineers  
> **RGS Engine**: Royal Remote Gaming Server (Node.js / Next.js / Canvas 60FPS / Web Audio / WebSocket & SSE Sync)

---

## 📑 Table of Contents
1. [Architecture & System Flow](#1-architecture--system-flow)
2. [Studio Games Catalog & Suite](#2-studio-games-catalog--suite)
3. [Authentication & Security](#3-authentication--security)
4. [Step 1: Discover Games Catalog (`GET /api/v1/games`)](#4-step-1-discover-games-catalog)
5. [Step 2: Generate Authorized Launch URL (`POST /api/v1/launch`)](#5-step-2-generate-authorized-launch-url)
6. [Step 3: Client Frontend Iframe Integration (Anti-Flicker Standard)](#6-step-3-client-frontend-iframe-integration)
7. [Step 4: Authoritative Webhook Settlement Receiver (`POST /api/callback`)](#7-step-4-authoritative-webhook-settlement-receiver)
8. [Multiplayer Synchronization & God Mode Mechanics](#8-multiplayer-synchronization--god-mode-mechanics)
9. [Complete Code Implementations (Node.js, PHP, Python, cURL)](#9-complete-code-implementations)
10. [Integration Troubleshooting & FAQ](#10-integration-troubleshooting--faq)

---

## 1. Architecture & System Flow

Royal Games Studio operates as an authoritative, high-throughput **Remote Gaming Server (RGS)**. All game logic, multiplier curves, card deals, and payout math are executed strictly on the studio backend. Client casinos embed games via an isolated `<iframe>` and receive instant round settlement webhooks for player wallet balances.

```text
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             YOUR CASINO PLATFORM (B2C CLIENT)                            │
│  - Player Authentication & Balance Wallet                                                │
│  - Casino Lobby & Game Grid                                                              │
│  - Seamless Responsive Game Iframe Container                                             │
│  - Idempotent Webhook Settlement Receiver (/api/callback)                                │
└──────────────────────────┬───────────────────────────────────▲───────────────────────────┘
                           │ 1. POST /api/v1/launch            │ 4. Webhook Settlement POST
                           │ (Bearer Token + Player + Balance) │ (Idempotent Serial Number)
                           ▼                                   │
┌──────────────────────────────────────────────────────────────┴───────────────────────────┐
│                          ROYAL GAMES STUDIO & RGS CLOUD                                  │
│  - Authoritative Global 24/7 Multiplayer Engine (Sky Rush, Cricket Blast, Andar Bahar)   │
│  - Real-Time Dynamic God Mode / Liability Optimization Engine                            │
│  - 60FPS Hardware-Accelerated Canvas & WebGL Game Arena (/play/[sessionId])              │
│  - Automated Webhook Dispatcher with Database Audit Logging                              │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Studio Games Catalog & Suite

The studio hosts multiplayer and single-player games engineered for high retention, VIP betting volume, and low latency:

| Game Name | Game UID | Category | RTP | Max Multiplier | Key Mechanic |
|---|---|---|---|---|---|
| 🚀 **Sky Rush** | `royal_skyrush` | Crash / Multiplier | 97.5% | 1,000x | **24/7 Global Multiplayer Crash Jet** with synchronized player curves & emergency ejection cashouts |
| 🏏 **Cricket Blast** | `royal_cricketblast` | Crash / Sports | 97.6% | 500x | **24/7 Global Multiplayer Night Stadium** with super-six ball flight & synchronized multiplier curve |
| 🎴 **Andar Bahar Royale** | `royal_andarbahar` | Table / Live Cards | 96.0% | 1.95x / 120x | **24/7 Global Live Card Dealing Engine** with 52-card deck, real-time dealing sequence, and mid-round God Mode override |
| 🐯 **Tiger Trail** | `royal_tigertrail` | Step / Cashout | 98.0% | 500x | Jungle River 10-step cashout stepper |
| 💣 **Bomb Grid** | `royal_bombgrid` | Mines / Originals | 98.5% | 500x | 5x5 laser energy crystal minefield |
| 📍 **Drop X** | `royal_dropx` | Physics / Plinko | 98.2% | 1,000x | 60FPS real-time gravity Plinko physics engine |
| ♾️ **Infinity X** | `royal_infinityx` | Quantum / Limbo | 98.8% | 10,000x | Quantum Hyperspace fast target Limbo |
| 🏛️ **Treasure Tower** | `royal_treasuretower` | Tower / Risk Step | 98.0% | 500x | 8-Floor ancient temple risk ladder |
| 🎲 **Dice X** | `royal_dicex` | Probability / Table | 99.0% | 990x | 3D Isometric probability dice table |
| 🃏 **Card Climb** | `royal_cardclimb` | Cards / Table | 98.3% | 120x | 3D Royal Hi-Lo felt table |
| 🎡 **Lucky Wheel X** | `royal_luckywheel` | Wheel / Fortune | 97.0% | 100x | 60FPS dynamic volatility fortune wheel |

---

## 3. Authentication & Security

All API endpoints are authenticated using your **Studio API Bearer Token**:

```http
Authorization: Bearer YOUR_STUDIO_API_TOKEN
Content-Type: application/json
```

> [!NOTE]
> - Tokens are generated per operator inside the **Studio Admin & Operator Portal**.
> - Each operator has a prepaid GGR credit balance. Launch requests require an active positive operator balance.
> - Game access can be enabled or disabled per operator in the Studio Game Control dashboard.

---

## 4. Step 1: Discover Games Catalog

Fetch the active list of games enabled for your operator account, complete with descriptions, RTPs, categories, and vector SVG thumbnails.

### HTTP Request
```http
GET /api/v1/games HTTP/1.1
Host: studio.royalgames.com
Authorization: Bearer YOUR_STUDIO_API_TOKEN
```

### JSON Response (200 OK)
```json
{
  "status": 1,
  "code": 0,
  "msg": "Royal Games Studio Catalog",
  "count": 3,
  "data": {
    "games": [
      {
        "game_id": 88801,
        "game_uid": "royal_skyrush",
        "name": "Sky Rush",
        "category": "Crash / Multiplier",
        "rtp": 97.5,
        "max_multiplier": "1000x",
        "thumbnail": "https://studio.royalgames.com/games/royal_skyrush.svg",
        "banner": "https://studio.royalgames.com/games/royal_skyrush.svg",
        "description": "Futuristic high-speed aerial flight machine. Watch the multiplier ascend and cash out before the supersonic sonic boom!",
        "is_active": true
      },
      {
        "game_id": 88802,
        "game_uid": "royal_cricketblast",
        "name": "Cricket Blast",
        "category": "Crash / Sports",
        "rtp": 97.6,
        "max_multiplier": "500x",
        "thumbnail": "https://studio.royalgames.com/games/royal_cricketblast.svg",
        "banner": "https://studio.royalgames.com/games/royal_cricketblast.svg",
        "description": "Night stadium cricket hit. Batter smashes the ball into the night sky as multiplier escalates before catch.",
        "is_active": true
      },
      {
        "game_id": 88803,
        "game_uid": "royal_andarbahar",
        "name": "Andar Bahar Royale",
        "category": "Table / Live Cards",
        "rtp": 96.0,
        "max_multiplier": "1.95x",
        "thumbnail": "https://studio.royalgames.com/games/royal_andarbahar.svg",
        "banner": "https://studio.royalgames.com/games/royal_andarbahar.svg",
        "description": "Global live synchronized multiplayer Andar Bahar with 7-figure VIP felt, 3D card dealing, and instant payouts.",
        "is_active": true
      }
    ],
    "total": 3
  }
}
```

---

## 5. Step 2: Generate Authorized Launch URL

Call `/api/v1/launch` whenever a player clicks "Play Now" or launches a game from your casino lobby.

### HTTP Request
```http
POST /api/v1/launch HTTP/1.1
Host: studio.royalgames.com
Authorization: Bearer YOUR_STUDIO_API_TOKEN
Content-Type: application/json

{
  "member_account": "rc1001",
  "game_uid": "royal_skyrush",
  "balance": 15000.00,
  "currency": "INR",
  "callback_url": "https://your-casino.com/api/callback",
  "return_url": "https://your-casino.com/lobby"
}
```

### Request Parameters
| Field | Type | Required | Description |
|---|---|---|---|
| `member_account` / `user_id` | `string` | **Yes** | Unique player ID in your casino database (e.g. `rc1001`, `player_8891`). |
| `game_uid` | `string` | **Yes** | Target Game UID (`royal_skyrush`, `royal_cricketblast`, `royal_andarbahar`, etc.). |
| `balance` / `wallet` | `number` | **Yes** | Current real-money player wallet balance to load into the session. |
| `currency` | `string` | No | Currency code (default: `INR`, `USD`, `EUR`, `USDT`, `AED`). |
| `callback_url` | `string` | **Yes** | Your authoritative webhook URL to receive round settlements. |
| `return_url` | `string` | No | URL to redirect when player clicks "Exit / Return to Lobby". |

### JSON Response (200 OK)
```json
{
  "status": 1,
  "code": 0,
  "msg": "Royal Studio game session created successfully",
  "data": {
    "session_id": "sess_89a1f0c2e9b84311894d...",
    "game_uid": "royal_skyrush",
    "game_name": "Sky Rush",
    "provider": "Royal Games Studio",
    "launch_url": "https://studio.royalgames.com/play/sess_89a1f0c2e9b84311894d...?token=eyJhbGciOi...&game=royal_skyrush&returnUrl=https%3A%2F%2Fyour-casino.com%2Flobby",
    "client_name": "Royal Casino Ltd",
    "expires_at": "2026-09-05T04:00:00.000Z"
  }
}
```

---

## 6. Step 3: Client Frontend Iframe Integration

> [!IMPORTANT]
> **ANTI-FLICKER BEST PRACTICES**:
> 1. Set the `launch_url` in the `src` attribute **once upon mounting**.
> 2. **Never re-render or re-assign `src`** during state changes in your parent casino app.
> 3. Give the iframe a static `key` and place it inside a memoized container.
> 4. Use `allow="autoplay; fullscreen; screen-wake-lock"` for smooth 60FPS sound and animation.

### Production CSS / HTML Container:
```html
<div class="casino-game-stage">
  <iframe
    id="royal-studio-frame"
    src="LAUNCH_URL_RECEIVED_FROM_API"
    allow="autoplay; fullscreen; screen-wake-lock"
    loading="eager"
    frameborder="0"
    scrolling="no"
  ></iframe>
</div>

<style>
  .casino-game-stage {
    position: relative;
    width: 100%;
    max-width: 1400px;
    height: min(85vh, 880px);
    margin: 0 auto;
    background: #07090e;
    border-radius: 18px;
    border: 1px solid rgba(255, 215, 0, 0.15);
    overflow: hidden;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
  }

  @media (max-width: 768px) {
    .casino-game-stage {
      height: 100dvh;
      border-radius: 0;
      border: none;
    }
  }

  #royal-studio-frame {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
  }
</style>
```

---

## 7. Step 4: Authoritative Webhook Settlement Receiver

Whenever a round finishes (player cashes out, plane crashes, card matching concludes, or bet is settled), the studio server sends an HTTP `POST` webhook to your configured `callback_url`.

### Webhook HTTP Request
```http
POST https://your-casino.com/api/callback HTTP/1.1
Content-Type: application/json
User-Agent: RoyalGames-Webhook-Dispatcher/1.0

{
  "serial_number": "SN_ROYAL_1772051234_4821",
  "member_account": "rc1001",
  "game_id": 88801,
  "game_uid": "royal_skyrush",
  "game_name": "Sky Rush",
  "game_round": "ROUND_SK_49182",
  "bet_amount": 500.00,
  "win_amount": 1250.00,
  "credit_amount": 15750.00,
  "timestamp": 1772051234000
}
```

### Settlement Payload Field Reference
| Field | Type | Description |
|---|---|---|
| `serial_number` | `string` | **Unique Idempotency Key**. Use this to check against previously settled rounds to prevent double credits. |
| `member_account` | `string` | The unique player identifier from your database. |
| `game_uid` | `string` | The game identifier (`royal_skyrush`, `royal_cricketblast`, `royal_andarbahar`, etc.). |
| `game_name` | `string` | Human-readable game title. |
| `game_round` | `string` | Unique round identifier for audit logs. |
| `bet_amount` | `number` | Total bet wagered in this settlement (e.g. `500.00`). |
| `win_amount` | `number` | Total payout won in this round (`0.00` if lost/crashed). |
| `credit_amount` | `number` | Authoritative player wallet balance calculated by the RGS. |
| `timestamp` | `number` | Millisecond Unix timestamp of the round completion. |

### Expected Webhook Response
Your server **MUST** return HTTP Status `200` with JSON:
```json
{
  "status": 1,
  "code": 0,
  "msg": "SETTLEMENT_SUCCESS",
  "serial_number": "SN_ROYAL_1772051234_4821"
}
```

---

## 8. Multiplayer Synchronization & God Mode Mechanics

### 🌐 Real-Time Multiplayer Synchronized Clock
- **Sky Rush & Cricket Blast**: All players globally share the exact same round cycle:
  - **Betting Phase (5.0s)**: Players place Bet 1 & Bet 2.
  - **Ascension Phase**: Multiplier ascends uniformly across all connected screens (`1.00x` $\rightarrow$ `1000.00x`).
  - **Crash Phase (3.0s)**: Supersonic crash / catch event broadcast to all sessions simultaneously.
- **Andar Bahar Royale**: 
  - **Betting Phase (15.0s)**: Joker Card is revealed. Players place real bets on Andar, Bahar, or Side Bets.
  - **Dealing Phase (3.0s/card)**: Cards dealt alternately (Andar $\rightarrow$ Bahar $\rightarrow$ Andar...).
  - **Match Settlement Phase (4.0s)**: Winning side highlights with instant wallet credit.

### 🛡️ Operator God Mode & Liability Protection
- The Studio Admin Portal includes a **Real-Time God Mode Engine**.
- **Crash Games**: Admins can override the next round crash multiplier or trigger an instant crash during live flight.
- **Andar Bahar Royale**:
  - Live pool metrics show real user bet distributions on Andar vs Bahar.
  - Studio Admin can dynamically override the winning side **at any moment before the matching card is dealt**.
  - Lowest liability calculation automatically shows the highest house profit outcome.

---

## 9. Complete Code Implementations

### 🟢 Node.js (Next.js App Router / Express)

#### 1. Launch Game Controller (`app/api/launch/route.ts`):
```typescript
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const STUDIO_BASE_URL = "https://studio.royalgames.com";
const STUDIO_API_TOKEN = process.env.STUDIO_API_TOKEN!;

export async function POST(req: NextRequest) {
  const { userId, gameUid, balance } = await req.json();

  const response = await axios.post(
    `${STUDIO_BASE_URL}/api/v1/launch`,
    {
      member_account: userId,
      game_uid: gameUid || "royal_skyrush",
      balance: balance,
      currency: "INR",
      callback_url: "https://your-casino.com/api/callback",
      return_url: "https://your-casino.com/lobby",
    },
    {
      headers: {
        Authorization: `Bearer ${STUDIO_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  return NextResponse.json(response.data);
}
```

#### 2. Settlement Webhook Receiver (`app/api/callback/route.ts`):
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db"; // Your Prisma/Database client

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { serial_number, member_account, bet_amount, win_amount, credit_amount, game_uid, game_name, game_round } = payload;

    if (!serial_number) {
      return NextResponse.json({ status: 0, error: "Missing serial_number" }, { status: 400 });
    }

    // 1. IDEMPOTENCY CHECK: Prevent duplicate crediting
    const existing = await db.roundAudit.findUnique({ where: { serialNumber: serial_number } });
    if (existing) {
      return NextResponse.json({ status: 1, msg: "DUPLICATE_ALREADY_PROCESSED" });
    }

    // 2. ATOMIC DATABASE TRANSACTION
    await db.$transaction(async (tx) => {
      // Update player wallet
      await tx.user.update({
        where: { id: member_account },
        data: { balance: credit_amount },
      });

      // Record transaction & audit trail
      await tx.transaction.create({
        data: {
          userId: member_account,
          type: win_amount > 0 ? "WIN" : "BET",
          amount: win_amount > 0 ? win_amount : bet_amount,
          balanceAfter: credit_amount,
          reference: serial_number,
        },
      });

      await tx.roundAudit.create({
        data: {
          serialNumber: serial_number,
          userId: member_account,
          gameUid: game_uid,
          betAmount: bet_amount,
          winAmount: win_amount,
        },
      });
    });

    return NextResponse.json({ status: 1, code: 0, msg: "SETTLEMENT_SUCCESS", serial_number });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ status: 0, error: err.message }, { status: 500 });
  }
}
```

---

### 🐘 PHP (Laravel & Core PHP)

#### 1. Game Launcher (`launch.php`):
```php
<?php
$studioUrl = "https://studio.royalgames.com/api/v1/launch";
$apiToken  = "YOUR_STUDIO_API_TOKEN";

$payload = [
    "member_account" => "player_vikram_101",
    "game_uid"       => "royal_skyrush",
    "balance"        => 5000.00,
    "currency"       => "INR",
    "callback_url"   => "https://your-casino.com/api/callback.php",
    "return_url"     => "https://your-casino.com/lobby"
];

$ch = curl_init($studioUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . $apiToken,
    "Content-Type: application/json"
]);

$response = curl_exec($ch);
curl_close($ch);

$result = json_decode($response, true);
$launchUrl = $result['data']['launch_url'];

// Render in iframe:
// echo '<iframe src="' . htmlspecialchars($launchUrl) . '" width="100%" height="720px"></iframe>';
?>
```

#### 2. Settlement Webhook (`callback.php`):
```php
<?php
$rawBody = file_get_contents('php://input');
$data = json_decode($rawBody, true);

$serialNumber  = $data['serial_number'];
$memberAccount = $data['member_account'];
$betAmount     = (float)$data['bet_amount'];
$winAmount     = (float)$data['win_amount'];
$creditAmount  = (float)$data['credit_amount'];

// 1. Check if $serialNumber already exists in your DB (Idempotency)
// 2. Atomically update player balance:
//    UPDATE users SET balance = $creditAmount WHERE id = $memberAccount;
// 3. INSERT INTO round_audits (serial, user, bet, win) VALUES (...)

header('Content-Type: application/json');
echo json_encode(["status" => 1, "code" => 0, "msg" => "SETTLEMENT_SUCCESS", "serial_number" => $serialNumber]);
?>
```

---

### 🐍 Python (FastAPI)

```python
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel

app = FastAPI()
processed_serials = set()

class SettlementModel(BaseModel):
    serial_number: str
    member_account: str
    game_uid: str
    bet_amount: float
    win_amount: float
    credit_amount: float
    timestamp: int

@app.post("/api/callback")
async def webhook_receiver(data: SettlementModel):
    # Idempotency Protection
    if data.serial_number in processed_serials:
        return {"status": 1, "msg": "DUPLICATE_ALREADY_PROCESSED"}

    # Atomic DB Update
    # await db.users.update(id=data.member_account, balance=data.credit_amount)
    processed_serials.add(data.serial_number)
    print(f"Settled {data.member_account}: Bet {data.bet_amount} Win {data.win_amount} -> Balance {data.credit_amount}")

    return {"status": 1, "code": 0, "msg": "SETTLEMENT_SUCCESS", "serial_number": data.serial_number}
```

---

### 💻 cURL CLI Quick Test

```bash
# 1. Fetch Catalog
curl -X GET "http://localhost:3000/api/v1/games" \
  -H "Authorization: Bearer rgs_live_royalgames_key_2026"

# 2. Launch Game Session
curl -X POST "http://localhost:3000/api/v1/launch" \
  -H "Authorization: Bearer rgs_live_royalgames_key_2026" \
  -H "Content-Type: application/json" \
  -d '{
    "member_account": "rc1001",
    "game_uid": "royal_skyrush",
    "balance": 10000.0,
    "currency": "INR",
    "callback_url": "http://localhost:3001/api/callback",
    "return_url": "http://localhost:3001"
  }'
```

---

## 10. Integration Troubleshooting & FAQ

### Q: Why does the game iframe flicker or reload during gameplay?
- **A**: The parent page component is re-rendering and resetting the `src` attribute of the `<iframe>`. Ensure your React/Vue iframe component is memoized (`React.memo`) and its props remain constant across round ticks.

### Q: How are concurrent users (e.g. `rc1001` and `rc1002`) synchronized?
- **A**: The studio server runs an authoritative background ticker for multiplayer games. All connected clients poll or stream from the exact same round state (`/api/studio/multiplayer/state` or `/api/studio/andarbahar/state`), guaranteeing millisecond synchronization of flight multipliers and card dealing.

### Q: What happens if a player loses internet connection during a live round?
- **A**: The round continues on the server. If the player cashed out before disconnecting, their win is saved. If the multiplier crashes or the game round ends, the server auto-settles the round and dispatches the webhook to your callback URL.

### Q: What should our callback endpoint return on error?
- **A**: If your database is temporarily unreachable, return HTTP `500`. The RGS webhook dispatcher logs the failure and allows retry monitoring in the Studio Admin Webhook Logs dashboard.
