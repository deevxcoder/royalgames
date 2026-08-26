# 👑 ROYAL GGR — B2B GGR Aggregator & Operator Portal (PRD)

> **Document Version**: 1.0.0  
> **Status**: Archived Specification / Future Roadmap  
> **Purpose**: Complete Product Requirements Document (PRD), Architecture, Database Schema, and API Specification for building the standalone B2B GGR Aggregation & Operator Management Platform.

---

## 1. Executive Summary & Vision

**Royal GGR** is an enterprise-grade B2B iGaming Aggregator & Operator Management Platform. It serves as the middle-tier financial and integration bridge between Game Studios (RGS like Royal Games Studio, Pragmatic Play, PG Soft, Spribe, etc.) and B2C Casino Operators.

### Core Value Proposition:
1. **Prepaid GGR Billing Engine**: Automatically tracks operator gross gaming revenue (GGR) / hold and deducts platform commission (e.g. 10%) from prepaid operator balance.
2. **Unified Game Launch API**: Single standard REST endpoint for operators to launch games across multiple studios.
3. **High-Reliability Webhook Dispatcher**: Cryptographically signed HMAC SHA-256 round callbacks with automatic retries, delivery logging, and idempotency guarantees.
4. **Self-Service Operator Portal**: Client registration, API key generation (`rgs_live_...`), IP whitelisting firewall, prepaid wallet recharge (UPI / USDT Crypto), and live round telemetry audit.

---

## 2. System Architecture & Flow

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL B2C CASINO OPERATOR                            │
│  - Player balance management                                                     │
│  - Frontend Casino Lobby & Game Launcher                                         │
│  - Webhook callback receiver (/api/callback)                                     │
└─────────────────────────┬──────────────────────────────────▲─────────────────────┘
                          │ 1. POST /api/v1/launch           │ 4. Webhook Settlement
                          │ (Token + Member ID + Game UID)   │ (Credit / Debit / Sig)
                          ▼                                  │
┌────────────────────────────────────────────────────────────┴─────────────────────┐
│                             ROYAL GGR PLATFORM                                   │
│  - IP Whitelist & Token Auth Firewall                                            │
│  - Operator Balance & GGR Fee Computation (e.g., 10% hold deduction)              │
│  - Game Catalog & Multi-Provider Aggregation Relay                               │
│  - Idempotency & HMAC SHA-256 Webhook Dispatcher with retry queue                │
└─────────────────────────┬──────────────────────────────────▲─────────────────────┘
                          │ 2. Forward Launch Request        │ 3. Studio Round Result
                          │ (Session ID + Callback Config)   │ (Win / Bet / Multiplier)
                          ▼                                  │
┌────────────────────────────────────────────────────────────┴─────────────────────┐
│                          REMOTE GAMING SERVER (RGS)                              │
│  - Royal Games Studio / External Studios                                         │
│  - Canvas/WebGL 60FPS Game Play Arena                                            │
│  - Authoritative Math RNG & Realtime Multiplayer Engine                          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema Specification (Prisma / PostgreSQL)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ---------------------------------------------------------
// OPERATOR & AUTHENTICATION
// ---------------------------------------------------------
model Operator {
  id               String                   @id @default(cuid())
  companyName      String
  email            String                   @unique
  passwordHash     String
  balance          Float                    @default(10000.0) // Prepaid GGR credit balance
  currency         String                   @default("INR")
  ggrRate          Float                    @default(10.0)    // Revenue share percentage (e.g. 10%)
  isAdmin          Boolean                  @default(false)   // Master Superadmin flag
  status           String                   @default("ACTIVE") // ACTIVE, SUSPENDED, PENDING
  callbackUrl      String?                  // Default operator callback URL
  encryptCallbacks Boolean                  @default(false)
  createdAt        DateTime                 @default(now())
  updatedAt        DateTime                 @updatedAt

  tokens           ApiToken[]
  sessions         GameSession[]
  rounds           GameRound[]
  transactions     OperatorTransaction[]
  webhookLogs      WebhookLog[]
  deposits         OperatorDepositRequest[]
  gameToggles      OperatorGameToggle[]

  @@map("operators")
}

model ApiToken {
  id          String   @id @default(cuid())
  operatorId  String
  operator    Operator @relation(fields: [operatorId], references: [id], onDelete: Cascade)
  token       String   @unique // Public API token e.g. "roy_live_..."
  secretKey   String   // Private 256-bit secret key for HMAC signature verification
  name        String   @default("Production Key")
  isLive      Boolean  @default(true)
  ipWhitelist String?  // Comma-separated allowed IPs (null = allow all)
  createdAt   DateTime @default(now())

  @@index([operatorId])
  @@map("api_tokens")
}

// ---------------------------------------------------------
// GAME SESSIONS & ROUND SETTLEMENTS
// ---------------------------------------------------------
model GameSession {
  id          String       @id @default(cuid())
  sessionId   String       @unique // Unique session UUID passed to game URL
  operatorId  String
  operator    Operator     @relation(fields: [operatorId], references: [id], onDelete: Cascade)
  userId      String       // Operator's player ID
  gameUid     String       // e.g. royal_skyrush, royal_dropx
  balance     Float        // Initial player balance
  currency    String       @default("INR")
  callbackUrl String       // Target operator callback endpoint
  returnUrl   String       // Exit lobby URL
  status      String       @default("ACTIVE") // ACTIVE, CLOSED
  createdAt   DateTime     @default(now())
  expiresAt   DateTime
  rounds      GameRound[]
  webhookLogs WebhookLog[]

  @@index([operatorId])
  @@map("game_sessions")
}

model GameRound {
  id             String       @id @default(cuid())
  serialNumber   String       @unique // Global Idempotency Key (e.g. SN_ROYAL_1700000000_abcd)
  sessionId      String?
  session        GameSession? @relation(fields: [sessionId], references: [id], onDelete: SetNull)
  operatorId     String?
  operator       Operator?    @relation(fields: [operatorId], references: [id], onDelete: Cascade)
  memberAccount  String?      // Operator Player ID
  gameUid        String
  gameName       String?
  gameRound      String?      // Multiplier or internal round count
  betAmount      Float        @default(0)
  winAmount      Float        @default(0)
  creditAmount   Float        // Player balance after round resolution
  ggrFeeDeducted Float        @default(0.0) // GGR fee charged to operator
  rawPayload     String?      // Stored JSON payload
  createdAt      DateTime     @default(now())

  @@index([memberAccount])
  @@map("game_rounds")
}

// ---------------------------------------------------------
// PREPAID WALLET & BILLING LEDGER
// ---------------------------------------------------------
model OperatorDepositRequest {
  id             String   @id @default(cuid())
  operatorId     String
  operator       Operator @relation(fields: [operatorId], references: [id], onDelete: Cascade)
  amount         Float
  currency       String   @default("INR")
  paymentMethod  String   // UPI, USDT_TRC20, BANK_TRANSFER
  transactionRef String   // UTR or TxHash
  proofImage     String?
  status         String   @default("PENDING") // PENDING, APPROVED, REJECTED
  adminNotes     String?
  processedBy    String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@index([operatorId])
  @@map("operator_deposit_requests")
}

model OperatorTransaction {
  id           String   @id @default(cuid())
  operatorId   String
  operator     Operator @relation(fields: [operatorId], references: [id], onDelete: Cascade)
  type         String   // DEPOSIT, GGR_FEE, ADJUSTMENT
  amount       Float
  balanceAfter Float
  referenceId  String?
  description  String?
  createdAt    DateTime @default(now())

  @@index([operatorId])
  @@map("operator_transactions")
}

// ---------------------------------------------------------
// WEBHOOK LOGS & RELIABILITY
// ---------------------------------------------------------
model WebhookLog {
  id           String       @id @default(cuid())
  operatorId   String
  operator     Operator     @relation(fields: [operatorId], references: [id], onDelete: Cascade)
  sessionId    String?
  session      GameSession? @relation(fields: [sessionId], references: [id], onDelete: SetNull)
  serialNumber String
  targetUrl    String
  payload      String
  responseCode Int?
  responseBody String?
  status       String       @default("SUCCESS") // SUCCESS, FAILED, RETRYING
  attempts     Int          @default(1)
  createdAt    DateTime     @default(now())

  @@index([operatorId])
  @@map("webhook_logs")
}

// ---------------------------------------------------------
// GAME & PROVIDER CATALOG
// ---------------------------------------------------------
model OperatorGameToggle {
  id         String   @id @default(cuid())
  operatorId String
  operator   Operator @relation(fields: [operatorId], references: [id], onDelete: Cascade)
  gameUid    String
  isEnabled  Boolean  @default(true)
  updatedAt  DateTime @updatedAt

  @@unique([operatorId, gameUid])
  @@index([operatorId])
  @@map("operator_game_toggles")
}

model ExternalProvider {
  id          String         @id @default(cuid())
  brandId     Int            @unique
  name        String
  type        String         @default("ROYAL_NATIVE") // ROYAL_NATIVE, NEXX_AGGREGATOR, DIRECT_RGS
  apiUrl      String?
  apiToken    String?
  apiSecret   String?
  logo        String?
  isActive    Boolean        @default(true)
  gameCount   Int            @default(0)
  ggrMargin   Float          @default(10.0)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  games       ExternalGame[]

  @@map("external_providers")
}

model ExternalGame {
  id            String           @id @default(cuid())
  providerId    String
  provider      ExternalProvider @relation(fields: [providerId], references: [id], onDelete: Cascade)
  gameId        Int?
  gameUid       String           @unique
  name          String
  category      String           @default("crash") // crash, originals, physics, table, slots
  rtp           Float            @default(97.5)
  volatility    String           @default("MEDIUM")
  maxMultiplier String           @default("1000x")
  thumbnail     String?
  banner        String?
  isActive      Boolean          @default(true)
  isFeatured    Boolean          @default(false)
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  @@index([providerId])
  @@map("external_games")
}
```

---

## 4. API Endpoints Specification

### 4.1. Game Launch (`POST /api/v1/launch`)
- **Headers**:
  - `Authorization: Bearer <API_TOKEN>`
  - `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "member_account": "player_99182",
    "game_uid": "royal_skyrush",
    "balance": 5000.00,
    "currency": "INR",
    "callback_url": "https://client-casino.com/api/callback",
    "return_url": "https://client-casino.com/lobby"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "status": 1,
    "msg": "success",
    "data": {
      "session_id": "sess_89a1f0c2e...",
      "launch_url": "https://studio.royalgames.com/play/sess_89a1f0c2e...?token=...",
      "game_uid": "royal_skyrush",
      "expires_at": "2026-08-27T03:00:00Z"
    }
  }
  ```

### 4.2. Games Catalog (`GET /api/v1/games`)
- **Headers**: `Authorization: Bearer <API_TOKEN>`
- **Response**: List of enabled games with categories, RTP, thumbnails, and status.

### 4.3. Operator Balance & GGR Status (`GET /api/v1/ggr-balance`)
- **Headers**: `Authorization: Bearer <API_TOKEN>`
- **Response**:
  ```json
  {
    "status": 1,
    "operator": "BetKing International",
    "prepaid_balance": 14250.80,
    "currency": "INR",
    "ggr_rate": 10.0,
    "status": "ACTIVE"
  }
  ```

---

## 5. Webhook & Settlement Lifecycle

1. **Round Execution**: Player bets ₹100 and wins ₹250 on `royal_skyrush`.
2. **GGR Fee Calculation**:
   $$\text{Hold} = \text{Bet} - \text{Win} = 100 - 250 = -150 \text{ (Loss to House)}$$
   *(If Hold > 0, e.g. Player lost ₹100, House GGR = ₹100 $\rightarrow$ GGR Fee = 10% $\times 100 = ₹10$ auto-deducted from Operator's prepaid balance).*
3. **Webhook Payload Dispatch**:
   ```json
   {
     "serial_number": "SN_ROYAL_1772051234_98213",
     "member_account": "player_99182",
     "game_uid": "royal_skyrush",
     "bet_amount": 100.00,
     "win_amount": 250.00,
     "net_change": 150.00,
     "balance_after": 5150.00,
     "currency": "INR",
     "timestamp": 1772051234,
     "signature": "hmac_sha256_hex_hash"
   }
   ```
4. **Idempotency Guarantee**: If the operator's server receives the same `serial_number` more than once, it returns HTTP 200 without double-crediting.

---

## 6. Self-Service Operator Portal Routes (`/portal/*`)

- `/portal/login` & `/portal/register` — Operator authentication with auto-credited demo sandbox balance.
- `/portal/dashboard` — Live GGR volume, turnover, active sessions, and balance widget.
- `/portal/apikeys` — Generate API tokens, rotate secret keys, and configure IP whitelist firewall.
- `/portal/wallet` — Top-up prepaid balance via UPI QR or USDT TRC-20, view invoice receipts.
- `/portal/webhooks` — Live callback delivery inspector with latency, status codes, payload inspection, and manual retry.
- `/portal/docs` — Interactive API swagger/documentation with cURL, Node.js, Python, and PHP snippets.

---

## 7. Next Steps for Implementation (When Revived)
- Initialize Next.js standalone project with Tailwind CSS & Lucide React.
- Connect to PostgreSQL instance via Prisma.
- Implement Redis/BullMQ queue for asynchronous webhook dispatch and retries.
- Deploy on scalable infrastructure (Docker / Vercel / AWS ECS).
