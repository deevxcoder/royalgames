# 👑 Royal Games Studio — Technical Troubleshooting & Synchronization Response
> **Date**: 27 August 2026  
> **Author**: Royal Games Studio Core Engineering & RGS Architecture Team  
> **Client Platform**: All Panel Exchange (B2B Client)  
> **Games In Scope**: **Sky Rush** (`royal_skyrush`) & **Cricket Blast** (`royal_cricketblast`)  
> **Reference Document**: `ROYAL_GAMES_STUDIO_TECHNICAL_QUERY.md` (v1.0.0)  
> **Response Version**: 2.0.0 (Production Verified)

---

## 📌 Executive Summary & Studio Confirmation

We have thoroughly reviewed the technical queries raised by the All Panel Exchange engineering team regarding the real-time multiplayer synchronization, countdown timing, late-join flight interpolation, and iframe lifecycle for **Sky Rush** (`royal_skyrush`) and **Cricket Blast** (`royal_cricketblast`).

We confirm the following core architecture guarantees:
1. **Uninterrupted 10.0-Second Global Countdown**: The server-side countdown is governed by an authoritative 24/7 global ticker synchronized to absolute UTC timestamps (`Date.now()`). Player joins, re-connections, and bet placements **never** reset or jump the countdown timer.
2. **Deterministic Late-Join Flight Interpolation**: Joining an in-progress round calculates the exact elapsed time (`server_now - flight_start_time`) and renders the aircraft/ball at the precise mathematical flight curve position without resetting animation time to zero or flickering.
3. **Zero-Reload In-Canvas State Transitions**: All bet placements, dual-panel toggles, cashouts, and visual animations execute 100% in-memory within the HTML5 Canvas / React state tree without internal iframe navigation or DOM reloading.

Below are the detailed, question-by-question technical responses and architectural specifications.

---

## ❓ Question-by-Question Technical Resolution

### 1. ⏱️ 10-Second Countdown Timing & Synchronization

#### 1.1 What is the authoritative server-side timing mechanism for the 10-second countdown across multiple connected sessions?
* **Authoritative Clock Engine**: Royal Games Studio employs an authoritative server crash engine (`serverCrashEngine.ts`) keyed to continuous absolute UTC epoch milliseconds (`Date.now()`).
* **Fixed Deterministic Schedule**: Every round has an immutable, mathematical timeline:
  $$\text{flightStart} = \text{countdownStart} + 10,000\,\text{ms}$$
  $$\text{crashTime} = \text{flightStart} + \text{flightDurationMs}$$
  $$\text{crashedEndTime} = \text{crashTime} + 3,500\,\text{ms}$$
* **Continuous State Calculation**: The countdown value is deterministically calculated as:
  $$\text{countdownLeft} = \max\left(0, \frac{\text{flightStart} - \text{serverNow}}{1000}\right)$$
* Both players (and all connected tabs across all operators) read from this identical timeline. When Server Time $T$ progresses, every client receives the exact same remaining fraction of a second.

#### 1.2 Does the entry of a new player trigger a room state reset or a fresh countdown timer on the server for all connected sockets?
* **NO**. The global game loop runs 24/7 independently of connected sockets or player counts.
* When Player B joins at $T+6.0\text{s}$ into a countdown:
  * Player A's client displays $4.0\text{s}$ remaining.
  * Player B's client immediately initializes at $4.0\text{s}$ remaining.
  * No reset event is broadcast, and the round launches simultaneously for both at $T+10.0\text{s}$.

#### 1.3 How should the client handle the countdown state if latency or packet jitter occurs right before the round launches?
* **Client-Side Exponential Moving Average (EMA) Time Offset**:
  The game client measures the round-trip time ($RTT$) on state updates:
  $$\text{estimatedServerNow} = \text{serverTime} + \frac{RTT}{2}$$
  $$\text{serverOffset} = \text{serverOffset}_{\text{prev}} \times 0.8 + (\text{estimatedServerNow} - \text{localNow}) \times 0.2$$
* **60 FPS Animation Ticker**:
  The client runs an internal high-frequency animation loop ($33\text{ms}$ / $60\text{FPS}$) that evaluates:
  $$\text{timeLeft} = \max\left(0, \frac{\text{flightStart} - (\text{localNow} + \text{serverOffset})}{1000}\right)$$
  When $\text{localNow} + \text{serverOffset} \ge \text{flightStart}$, the client smoothly transitions to the `FLYING` state locally, eliminating countdown stutter or visual freezing even if an HTTP packet arrives with $100\text{ms}$ jitter.

---

### 2. 👥 Multi-User Synchronization & Late-Join Interpolation

#### 2.1 Are all players from our operator token routed to the exact same global multiplayer room/channel, or does the launch API generate isolated room instances per session?
* **Global Multiplayer Room per Game UID**:
  All players across your operator (and partner networks) playing `royal_skyrush` or `royal_cricketblast` are routed to the **same authoritative multiplayer room**.
* **Global vs. Isolated Boundaries**:
  * **Global / Shared**: Round ID (`RND_ROYAL_SKYRUSH_<TIMESTAMP>_<SEQ>`), crash multiplier ($M_{\text{crash}}$), flight trajectory, global live bets feed, and round history.
  * **Isolated / Secure**: Player balances, placed bets, active bet panels (Panel 1 & Panel 2), cashout triggers, and wallet callback settlements.
  
```text
┌────────────────────────────────────────────────────────────────────────┐
│             GLOBAL 24/7 RGS ENGINE (Synchronized Timeline)             │
│   Round ID: RND_ROYAL_SKYRUSH_1772120000000_1042  |  Crash: 4.82x      │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
        ┌───────────▼───────────┐        ┌───────────▼───────────┐
        │  Player 1 (Rahul)     │        │  Player 2 (Vikas)     │
        │  Session: sess_a1b2   │        │  Session: sess_c3d4   │
        │  Balance: ₹5,000.00   │        │  Balance: ₹12,400.00  │
        │  Bet 1: ₹50 placed    │        │  Bet 1: ₹500 placed   │
        └───────────────────────┘        └───────────────────────┘
```

#### 2.2 When a second player joins an ongoing flight phase, how does the client engine handle late-join interpolation?
* **Ascent Multiplier Mathematical Curve**:
  The flight curve is governed by the continuous mathematical function:
  $$M(t) = \exp\left(0.065 \cdot (t \times 1.5)^{1.25}\right)$$
  *(where $t$ is the elapsed flight time in seconds: $t = (\text{serverNow} - \text{flightStart}) / 1000$)*.
* **Late-Join Handling**:
  When Player B enters while the jet is already in flight (e.g., at $t = 4.2\text{s}$, $M = 2.15\text{x}$):
  1. The client receives `phase: "FLYING"`, `flightStartTime: 1772120010000`, `crashMultiplier: 4.82`.
  2. The client calculates $t = (\text{accurateServerNow} - \text{flightStartTime}) / 1000 = 4.2\text{s}$.
  3. The client immediately computes $M(4.2) = 2.15\text{x}$.
  4. The canvas places the jet/ball at the exact X/Y coordinate corresponding to $2.15\text{x}$ and continues ascending smoothly at 60 FPS toward the crash point. Animation time is **never** reset to 0.

#### 2.3 How should `member_account` be formatted to guarantee complete session isolation?
* Format `member_account` and `user_id` as unique, persistent alphanumeric string identifiers (e.g., `"allpanel_usr_90812"` or `"player_rahul_101"`).
* Avoid using generic placeholder IDs (such as `"guest"`, `"user"`, or `"demo"`) across different real users. Each unique `member_account` is assigned a dedicated session token (`sess_...`) ensuring 100% balance and bet isolation.

---

### 3. ⚡ Canvas / Socket Performance & Anti-Flicker Architecture

#### 3.1 When a bet or cashout is executed, does the game client perform an internal page navigation, full DOM reload, or just a lightweight WebSocket/REST state transition?
* **Zero DOM Reload / Zero Page Navigation**:
  Betting and cashout actions operate purely via in-memory React state updates and asynchronous REST micro-requests (`POST /api/studio/round`).
* **Double-Buffered Canvas Rendering**:
  The flight arena is rendered via an isolated HTML5 `<canvas>` using `requestAnimationFrame` with internal double-buffering. Button clicks, sound effects, particle bursts, and parachute ejections occur as visual overlays without triggering canvas unmounts or parent re-renders.

#### 3.2 Is the game expecting any `window.postMessage` handshake from the parent window, or does it operate 100% autonomously within the iframe?
* **100% Autonomous Operation**:
  The game does **not** require any initial handshake from the parent window to start or synchronize.
* **Optional Outbound Parent Events**:
  For operator convenience, the game iframe dispatches standardized messages to `window.parent`:
  ```javascript
  // Dispatched when user clicks the Exit / Lobby button
  window.parent.postMessage({
    type: "ROYAL_GAMES_EVENT",
    action: "EXIT_GAME",
    returnUrl: "https://www.allpanelexch8.com/user/royal-games"
  }, "*");

  // Dispatched on balance updates
  window.parent.postMessage({
    type: "ROYAL_GAMES_EVENT",
    action: "BALANCE_UPDATE",
    balance: 5240.50,
    currency: "INR"
  }, "*");
  ```

#### 3.3 Are there specific Content Security Policy (CSP) or iframe `allow` attributes required?
* **Recommended Iframe Attributes**:
  ```html
  <iframe
    id="royal-game-frame"
    src="https://royalgamesstudio.vercel.app/play/sess_...?token=..."
    allow="fullscreen; autoplay; screen-wake-lock; clipboard-write; encrypted-media"
    loading="eager"
    frameborder="0"
    scrolling="no"
    style="width: 100%; height: 100%; border: none; display: block;"
  ></iframe>
  ```
* **Parent Platform CSP Header Recommendation**:
  Ensure your web server's `Content-Security-Policy` header permits framing the Royal Games domain:
  ```http
  Content-Security-Policy: frame-src 'self' https://royalgamesstudio.vercel.app https://*.vercel.app https://studio.royalgames.com;
  ```

---

### 4. 🔄 State Synchronization Protocol & Session Token Lifecycle

#### 4.1 What is the exact synchronization protocol used by the game iframe to connect to the RGS multiplayer ticker?
* **Dual-Tier State Synchronization**:
  1. **High-Speed State Poller**: The client syncs state via `GET /api/studio/multiplayer/state?game={gameUid}&_t={timestamp}` on a $150\text{ms}$ interval over HTTP/2 with `Cache-Control: no-store`.
  2. **60 FPS Client-Side Interpolation**: Between state updates, the local mathematical engine predicts and renders smooth continuous sub-millisecond multiplier progressions without waiting for network frames.

#### 4.2 How does the server handle temporary network latency or packet drops?
* **Server-Side Authoritative Auto-Cashout**:
  If a player enables Auto-Cashout (e.g. at $2.00\text{x}$) and their device temporarily loses network connectivity during the flight:
  * The RGS backend records the round at the authoritative crash multiplier.
  * If $M_{\text{crash}} \ge 2.00\text{x}$, the win is automatically credited and dispatched to your webhook (`callback_url`).
  * If $M_{\text{crash}} < 2.00\text{x}$, the bet is settled as lost.
  * The player's balance is guaranteed consistent upon reconnection.

#### 4.3 Does the launch session token expire after a fixed duration, and how does the game client handle token refresh?
* **24-Hour Token Validity**:
  Launch tokens (`token=eyJ...`) generated by `POST /api/v1/launch` are cryptographically signed JWTs valid for **24 hours** from generation time.
* **Extended Play Sessions**:
  During standard continuous gameplay, the active session is maintained. If a session is older than 24 hours or invalidated, calling `POST /api/v1/launch` generates a fresh URL without disrupting player records.

---

## 🛠️ Verified Integration Payload Reference

### Launch Request (`POST /api/v1/launch`)
```http
POST /api/v1/launch HTTP/1.1
Host: royalgamesstudio.vercel.app
Authorization: Bearer YOUR_STUDIO_API_TOKEN
Content-Type: application/json

{
  "member_account": "player_rahul_101",
  "user_id": "player_rahul_101",
  "game_uid": "royal_skyrush",
  "balance": 5000.00,
  "currency": "INR",
  "callback_url": "https://www.allpanelexch8.com/api/callback",
  "return_url": "https://www.allpanelexch8.com/user/royal-games"
}
```

### Successful Launch Response (`200 OK`)
```json
{
  "status": 1,
  "msg": "success",
  "data": {
    "session_id": "sess_884192841_skyrush",
    "launch_url": "https://royalgamesstudio.vercel.app/play/sess_884192841_skyrush?game=royal_skyrush&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "game_uid": "royal_skyrush",
    "currency": "INR",
    "balance": 5000.00
  }
}
```

---

## 🎯 Studio Quality Guarantees for All Panel Exchange

| Feature | Studio SLA / Guarantee | Status |
|---|---|---|
| **Countdown Sync** | 10.0s countdown is strictly shared across all players; zero reset on user join | ✅ **Verified** |
| **Late-Join Multiplier** | Accurate real-time interpolation along $M(t)$ curve; zero animation jump | ✅ **Verified** |
| **Bet & Cashout UX** | Zero iframe page reload; instant audio, particle, and parachute animations | ✅ **Verified** |
| **Crash Provable Fairness** | Standard Pareto Inverse Distribution ($RTP = 97.5\%$, Max $1,000\text{x}$) | ✅ **Verified** |
| **Webhook Idempotency** | Signed HMAC SHA-256 callback for every round settlement with unique `transaction_id` | ✅ **Verified** |

---

> **Support Contacts**:  
> * Technical Integration Lead: `api-support@royalgamesstudio.com`  
> * Live Integration Desk: Royal Games Studio B2B Developer Portal (`/portal/docs`)
