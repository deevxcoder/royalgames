# 👑 ROYAL GAMES STUDIO — B2B API & IFRAME INTEGRATION GUIDE
> **Document Version**: 2.0.0 (Production Release)  
> **Target Audience**: Client Casino Developers, Platform Integrators & Technical Leads  
> **RGS Engine**: Remote Gaming Server (HTML5 / WebGL / Canvas / Web Audio)

---

## 📑 Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Authentication & Security](#2-authentication--security)
3. [Step 1: Fetch Games Catalog (`GET /api/v1/games`)](#3-step-1-fetch-games-catalog)
4. [Step 2: Generate Game Launch URL (`POST /api/v1/launch`)](#4-step-2-generate-game-launch-url)
5. [Step 3: Client Frontend Iframe Integration (Anti-Flicker Best Practices)](#5-step-3-client-frontend-iframe-integration)
6. [Step 4: Webhook Settlement Callback Receiver](#6-step-4-webhook-settlement-callback-receiver)
7. [HMAC SHA-256 Signature Verification](#7-hmac-sha-256-signature-verification)
8. [Complete Code Examples (Node.js, PHP, Python, cURL)](#8-complete-code-examples)
9. [Integration Troubleshooting & FAQ](#9-integration-troubleshooting--faq)

---

## 1. Architecture Overview

Royal Games Studio operates as an authoritative **Remote Gaming Server (RGS)** hosting 10 proprietary HTML5 casino games. 

```text
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             YOUR CASINO PLATFORM (B2C CLIENT)                            │
│  - Player balance management                                                             │
│  - Casino lobby & game cards                                                             │
│  - Embedded Game Iframe                                                                  │
│  - Webhook settlement endpoint (/api/callback)                                           │
└──────────────────────────┬───────────────────────────────────▲───────────────────────────┘
                           │ 1. POST /api/v1/launch            │ 4. HTTP Settlement Webhook
                           │ (Token + Player ID + Game UID)    │ (Idempotency + Signed Sig)
                           ▼                                   │
┌──────────────────────────────────────────────────────────────┴───────────────────────────┐
│                           ROYAL GAMES STUDIO & RGS ENGINE                                │
│  - Authoritative RNG Math & 24/7 Synchronized Multiplayer Engine                         │
│  - 60FPS Canvas/WebGL Game Play Arena (/play/[sessionId])                                │
│  - Instant Webhook Dispatcher with HMAC SHA-256 Signatures                               │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### 🎮 The 10 Proprietary Studio Games:
| Game Name | Game UID | Category | RTP | Max Multiplier | Key Mechanic |
|---|---|---|---|---|---|
| 🚀 **Sky Rush** | `royal_skyrush` | Crash / Multiplier | 97.5% | 1,000x | **24/7 Global Multiplayer Crash Jet** with ejection parachute cashouts |
| 🐯 **Tiger Trail** | `royal_tigertrail` | Step / Cashout | 98.0% | 500x | Jungle River 10-step cashout stepper |
| 💣 **Bomb Grid** | `royal_bombgrid` | Mines / Originals | 98.5% | 500x | 5x5 laser energy crystal minefield |
| 📍 **Drop X** | `royal_dropx` | Physics / Plinko | 98.2% | 1,000x | 60FPS real-time gravity Plinko physics |
| 🏏 **Cricket Blast** | `royal_cricketblast` | Crash / Sports | 97.6% | 500x | **24/7 Global Multiplayer Night Stadium Crash** |
| ♾️ **Infinity X** | `royal_infinityx` | Quantum / Limbo | 98.8% | 10,000x | Quantum Hyperspace fast target Limbo |
| 🏛️ **Treasure Tower** | `royal_treasuretower` | Tower / Risk Step | 98.0% | 500x | 8-Floor ancient temple risk ladder |
| 🎲 **Dice X** | `royal_dicex` | Probability / Table | 99.0% | 990x | 3D Isometric probability dice table |
| 🃏 **Card Climb** | `royal_cardclimb` | Cards / Table | 98.3% | 120x | 3D Royal Hi-Lo felt table |
| 🎡 **Lucky Wheel X** | `royal_luckywheel` | Wheel / Fortune | 97.0% | 100x | 60FPS dynamic volatility fortune wheel |

---

## 2. Authentication & Security

All B2B API requests must include your **Studio API Token** in the HTTP request headers:

```http
Authorization: Bearer YOUR_STUDIO_API_TOKEN
Content-Type: application/json
```

> [!NOTE]
> - Obtain your API token (`rgs_live_...`) and Secret Key from the Operator Developer Portal.
> - Configure your server's outbound public IP in the **IP Whitelist** inside the operator portal.

---

## 3. Step 1: Fetch Games Catalog

Retrieve the active games catalog with RTPs, categories, and vector SVG thumbnails.

### Request:
```http
GET /api/v1/games HTTP/1.1
Host: studio.royalgames.com
Authorization: Bearer YOUR_STUDIO_API_TOKEN
```

### Response (200 OK):
```json
{
  "status": 1,
  "msg": "success",
  "total_games": 10,
  "data": [
    {
      "game_id": 88801,
      "game_uid": "royal_skyrush",
      "name": "Sky Rush",
      "category": "crash",
      "rtp": 97.5,
      "volatility": "HIGH",
      "max_multiplier": "1000x",
      "thumbnail": "https://studio.royalgames.com/games/royal_skyrush.svg",
      "status": "ACTIVE"
    },
    {
      "game_id": 88805,
      "game_uid": "royal_cricketblast",
      "name": "Cricket Blast",
      "category": "crash",
      "rtp": 97.6,
      "volatility": "HIGH",
      "max_multiplier": "500x",
      "thumbnail": "https://studio.royalgames.com/games/royal_cricketblast.svg",
      "status": "ACTIVE"
    }
  ]
}
```

---

## 4. Step 2: Generate Game Launch URL

When a player clicks a game thumbnail on your casino site, call this endpoint to create an authenticated game session.

### Request:
```http
POST /api/v1/launch HTTP/1.1
Host: studio.royalgames.com
Authorization: Bearer YOUR_STUDIO_API_TOKEN
Content-Type: application/json

{
  "member_account": "player_rahul_99",
  "game_uid": "royal_skyrush",
  "balance": 5000.00,
  "currency": "INR",
  "callback_url": "https://your-casino.com/api/callback",
  "return_url": "https://your-casino.com/lobby"
}
```

### Request Parameters:
| Parameter | Type | Required | Description |
|---|---|---|---|
| `member_account` | `string` | **Yes** | Unique identifier of the player in your casino database. |
| `game_uid` | `string` | **Yes** | Target Game UID (e.g. `royal_skyrush`, `royal_dropx`). |
| `balance` | `number` | **Yes** | Current balance of the player to load into the game arena. |
| `currency` | `string` | No | Currency code (default: `INR`, `USD`, `EUR`, `USDT`). |
| `callback_url` | `string` | **Yes** | Your endpoint where round settlements will be dispatched. |
| `return_url` | `string` | No | URL to redirect when player clicks the "Exit / Lobby" button. |

### Response (200 OK):
```json
{
  "status": 1,
  "msg": "Royal Studio game session created successfully",
  "data": {
    "session_id": "sess_89a1f0c2e...",
    "game_uid": "royal_skyrush",
    "game_name": "Sky Rush",
    "provider": "Royal Games Studio",
    "launch_url": "https://studio.royalgames.com/play/sess_89a1f0c2e...?token=eyJhbGciOi...&game=royal_skyrush&returnUrl=...",
    "expires_at": "2026-08-27T06:30:00.000Z"
  }
}
```

---

## 5. Step 3: Client Frontend Iframe Integration

> [!CAUTION]
> **CRITICAL ANTI-FLICKER GUIDELINES**:
> - Embed the returned `launch_url` **once** inside a standard iframe.
> - **DO NOT re-render or change the `src` attribute of the iframe** during active gameplay.
> - In React/Vue/Angular, ensure the iframe component has a **stable key** or is outside state-re-rendering wrappers.

### Recommended HTML / CSS Embedding:

```html
<!-- Responsive 16:9 Game Container -->
<div class="casino-game-wrapper">
  <iframe
    id="royal-game-frame"
    src="LAUNCH_URL_RECEIVED_FROM_API"
    allow="autoplay; fullscreen; screen-wake-lock"
    loading="eager"
    frameborder="0"
    scrolling="no"
  ></iframe>
</div>

<style>
  .casino-game-wrapper {
    position: relative;
    width: 100%;
    max-width: 1280px;
    height: 720px;
    margin: 0 auto;
    background-color: #06080e;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  }

  @media (max-width: 768px) {
    .casino-game-wrapper {
      height: 100vh;
      border-radius: 0;
    }
  }

  #royal-game-frame {
    width: 100%;
    height: 100%;
    display: block;
    border: none;
  }
</style>
```

---

## 6. Step 4: Webhook Settlement Callback Receiver

When a player places a bet, cashes out, or loses a round, Royal Games Studio sends an authoritative HTTP `POST` webhook to your configured `callback_url`.

### Webhook Request:
```http
POST https://your-casino.com/api/callback HTTP/1.1
Content-Type: application/json
x-signature: <HMAC_SHA256_HEX_SIGNATURE>
x-timestamp: 1772051234000

{
  "serial_number": "SN_ROYAL_1772051234_4821",
  "member_account": "player_rahul_99",
  "game_id": 88801,
  "game_uid": "royal_skyrush",
  "game_name": "Sky Rush",
  "bet_amount": 100.00,
  "win_amount": 250.00,
  "credit_amount": 5150.00,
  "timestamp": 1772051234000
}
```

### Webhook Field Reference:
| Field | Type | Description |
|---|---|---|
| `serial_number` | `string` | **Unique Idempotency Key**. Use this to prevent duplicate processing. |
| `member_account` | `string` | The player ID in your system. |
| `game_uid` | `string` | Game UID (e.g. `royal_skyrush`). |
| `bet_amount` | `number` | Total bet wagered in this round (0 if only win). |
| `win_amount` | `number` | Total win payout credited in this round (0 on bust/loss). |
| `credit_amount` | `number` | Authoritative player balance after resolving bet & win. |
| `timestamp` | `number` | Unix millisecond timestamp of round resolution. |

### Expected Webhook Response:
Your endpoint **MUST** respond with HTTP status `200` and JSON:
```json
{
  "status": 1,
  "msg": "success"
}
```

---

## 7. HMAC SHA-256 Signature Verification

To verify that the webhook originated authoritatively from Royal Games Studio:

1. Extract the raw JSON request body as a string.
2. Compute the HMAC SHA-256 hash of the payload using your **Secret Key**.
3. Compare the generated hash with the `x-signature` header.

$$\text{Signature} = \text{HMAC-SHA256}(\text{Raw JSON Body}, \text{SECRET\_KEY})$$

---

## 8. Complete Code Examples

### 🟢 Node.js (Express & Next.js)

#### 1. Game Launcher (`launch.js`):
```javascript
const axios = require("axios");

async function launchGame(playerId, gameUid, balance) {
  const response = await axios.post(
    "https://studio.royalgames.com/api/v1/launch",
    {
      member_account: playerId,
      game_uid: gameUid,
      balance: balance,
      currency: "INR",
      callback_url: "https://your-casino.com/api/callback",
      return_url: "https://your-casino.com/lobby"
    },
    {
      headers: {
        Authorization: `Bearer YOUR_STUDIO_API_TOKEN`,
        "Content-Type": "application/json"
      }
    }
  );

  return response.data.data.launch_url;
}
```

#### 2. Settlement Webhook Receiver (`callback.js`):
```javascript
const express = require("express");
const crypto = require("crypto");
const app = express();

app.use(express.json());

const processedSerials = new Set();
const SECRET_KEY = "YOUR_STUDIO_SECRET_KEY";

app.post("/api/callback", (req, res) => {
  const { serial_number, member_account, bet_amount, win_amount, credit_amount } = req.body;

  // 1. Idempotency Check (Prevent duplicate credits)
  if (processedSerials.has(serial_number)) {
    return res.json({ status: 1, msg: "Already processed" });
  }

  // 2. Update player balance in your database
  // await db.users.update({ where: { id: member_account }, data: { balance: credit_amount } });

  processedSerials.add(serial_number);
  console.log(`[SETTLEMENT] ${member_account}: Bet ₹${bet_amount}, Win ₹${win_amount} -> New Bal: ₹${credit_amount}`);

  return res.status(200).json({ status: 1, msg: "success" });
});

app.listen(3000);
```

---

### 🐘 PHP (Laravel / Core PHP)

#### 1. Game Launcher (`launch.php`):
```php
<?php
$token = "YOUR_STUDIO_API_TOKEN";
$url = "https://studio.royalgames.com/api/v1/launch";

$payload = [
    "member_account" => "player_vikram_101",
    "game_uid" => "royal_skyrush",
    "balance" => 5000.00,
    "currency" => "INR",
    "callback_url" => "https://your-casino.com/api/callback.php",
    "return_url" => "https://your-casino.com/lobby"
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer " . $token,
    "Content-Type: application/json"
]);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
$launchUrl = $data['data']['launch_url'];

// Redirect or render in iframe:
// echo '<iframe src="' . htmlspecialchars($launchUrl) . '" width="100%" height="720px"></iframe>';
?>
```

#### 2. Settlement Webhook Receiver (`callback.php`):
```php
<?php
$rawPayload = file_get_contents('php://input');
$data = json_decode($rawPayload, true);

$serialNumber = $data['serial_number'];
$memberAccount = $data['member_account'];
$betAmount = (float)$data['bet_amount'];
$winAmount = (float)$data['win_amount'];
$creditAmount = (float)$data['credit_amount'];

// Check database if $serialNumber already processed
// UPDATE users SET balance = $creditAmount WHERE id = $memberAccount;

header('Content-Type: application/json');
echo json_encode(["status" => 1, "msg" => "success"]);
?>
```

---

### 🐍 Python (FastAPI / Django)

```python
from fastapi import FastAPI, Request
import hmac, hashlib

app = FastAPI()
processed_serials = set()

@app.post("/api/callback")
async def webhook_callback(request: Request):
    payload = await request.json()
    serial_number = payload.get("serial_number")
    member_account = payload.get("member_account")
    credit_amount = payload.get("credit_amount")

    # Idempotency Check
    if serial_number in processed_serials:
        return {"status": 1, "msg": "Already processed"}

    # Update player balance
    processed_serials.add(serial_number)
    print(f"Settled {member_account} with balance {credit_amount}")

    return {"status": 1, "msg": "success"}
```

---

### 💻 cURL Test Command:

```bash
curl -X POST "https://studio.royalgames.com/api/v1/launch" \
  -H "Authorization: Bearer YOUR_STUDIO_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "member_account": "player_test_1",
    "game_uid": "royal_skyrush",
    "balance": 2500.0,
    "currency": "INR",
    "callback_url": "https://your-casino.com/api/callback"
  }'
```

---

## 9. Integration Troubleshooting & FAQ

### Q: Why does the game iframe flicker or reload when a bet is placed?
- **A**: The parent client page is re-rendering the iframe component whenever React/Vue state changes. Place the `<iframe>` in a dedicated component with `React.memo` or a stable DOM key, and do not mutate the `src` prop after mounting.

### Q: Are multiple players playing Sky Rush in the same round?
- **A**: Yes. Sky Rush and Cricket Blast run on an authoritative 24/7 global server clock. All players connect to the exact same continuous round sequence, countdown timer, flight curve, and crash multiplier.

### Q: How do we handle network dropouts or closed browsers during flight?
- **A**: The server authoritative engine automatically records uncashed bets as loss settlements upon round crash and dispatches a signed webhook callback to your server. The player wallet is guaranteed to stay synchronized.
