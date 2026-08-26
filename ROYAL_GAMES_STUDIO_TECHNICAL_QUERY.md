# 👑 Royal Games Studio — Technical Troubleshooting & Synchronization Query
> **Date**: 27 August 2026  
> **Client Platform**: All Panel Exchange (B2B Client)  
> **Games In Scope**: **Sky Rush** (`royal_skyrush`) & **Cricket Blast** (`royal_cricketblast`)  
> **Document Version**: 1.0.0

---

## 📌 Context & Overview
We have integrated Royal Games Studio via the authoritative RGS Launch API (`POST /api/v1/launch`) and embedded the games inside our secure iframe container with stable DOM mounts as per the **v2.0.0 Integration Guide**.

During internal multi-user load testing of the new **Multiplayer** features for **Sky Rush** and **Cricket Blast**, we observed critical synchronization and round lifecycle issues that require clarification and fixes from the Royal Games Studio engineering team.

---

## ❓ Critical Technical Queries for Studio Team

### 1. ⏱️ 10-Second Countdown Reset & Time-Jump Issue
* **Symptom**: During the 10-second betting countdown phase in **Sky Rush** and **Cricket Blast**, when a second player enters or places a bet:
  - The 10-second countdown timer suddenly resets, jumps, or desynchronizes between the two players' screens.
  - One player's screen shows countdown finishing while the second player's screen is still in countdown, leading to split game states.
* **Questions for Studio Team**:
  1. What is the authoritative server-side timing mechanism for the 10-second countdown across multiple connected sessions?
  2. Does the entry of a new player trigger a room state reset or a fresh countdown timer on the server for all connected sockets?
  3. How should the client handle the countdown state if latency or packet jitter occurs right before the round launches?

---

### 2. 👥 Multi-User Synchronization & Time Jump / State Conflict
* **Symptom**: When Player A is already inside the game arena and Player B launches the same game:
  - The round timer/multiplier jumps or desynchronizes.
  - The canvas/flight curve experiences a visual flicker or resets animation time to 0.
* **Questions for Studio Team**:
  1. Are all players from our operator token routed to the **exact same global multiplayer room/channel**, or does the launch API generate isolated room instances per session?
  2. When a second player joins an ongoing flight phase, how does the client engine handle **late-join interpolation**? Does it receive the authoritative `server_elapsed_time` from WebSocket, or does it attempt to restart the local animation?
  3. How should `member_account` be formatted to guarantee complete session isolation?

---

### 3. ⚡ Canvas / Socket Flicker upon Bet & Cashout
* **Symptom**: When a player clicks **Bet** or **Cashout**, the internal game canvas or iframe UI undergoes a brief micro-flicker or state glitch.
* **Questions for Studio Team**:
  1. When a bet or cashout is executed, does the game client perform an internal page navigation, full DOM reload, or just a lightweight WebSocket/REST state transition?
  2. Is the game expecting any `window.postMessage` handshake from the parent window, or does it operate 100% autonomously within the iframe?
  3. Are there specific Content Security Policy (CSP) or iframe `allow` attributes required beyond `allow="fullscreen; autoplay; screen-wake-lock"`?

---

### 4. 🔄 WebSocket & Session Token Lifecycle
* **Questions for Studio Team**:
  1. What is the exact WebSocket URL and protocol used by the game iframe to connect to the RGS multiplayer ticker?
  2. How does the server handle temporary network latency or packet drops? Does it maintain player state without kicking or resetting the round?
  3. Does the launch session token (`token=eyJ...`) expire after a fixed duration, and how does the game client handle token refresh during extended play sessions?

---

## 🛠️ Our Integration Configuration (For Studio Verification)

```json
// POST https://royalgamesstudio.vercel.app/api/v1/launch
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

```html
<!-- Client Iframe Embedding (Memoized & Stable Key) -->
<iframe
  id="royal-game-frame"
  src="https://royalgamesstudio.vercel.app/play/sess_...?token=..."
  allow="fullscreen; autoplay; screen-wake-lock; clipboard-write; encrypted-media"
  loading="eager"
  frameborder="0"
  scrolling="no"
></iframe>
```

---

## 🎯 Requested Action Items from Royal Games Studio
1. **Verify Global Room Countdown**: Confirm that Sky Rush and Cricket Blast maintain an uninterrupted authoritative 10-second betting countdown that does not reset or jump when new players join.
2. **Verify Late-Join Multiplayer Sync**: Ensure new player connections do not interrupt or reset ongoing flights for other active players in the room.
3. **Confirm Smooth Cashout Transition**: Ensure cashout actions trigger seamless in-canvas animations without internal frame reloads.
