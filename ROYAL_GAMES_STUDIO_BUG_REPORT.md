# 🚨 Royal Games Studio — Critical Bug Report: Multiplayer State-Machine Desync & Poller Glitch

> **Date**: 27 August 2026  
> **Client Platform**: All Panel Exchange (B2B Client)  
> **Games In Scope**: **Sky Rush** (`royal_skyrush`) & **Cricket Blast** (`royal_cricketblast`)  
> **Environment**: Production / Live (`royalgamesstudio.vercel.app`)  
> **Severity**: **HIGH (Core Gameplay Flow Broken)**

---

## 📌 Observed Symptom Summary

During live testing with **2 distinct users on separate accounts/browsers**, the game flow breaks after 1–2 rounds:

1. **Round Flow Breaks**: The standard cycle (`10.0s Countdown -> Flying Phase -> Crash -> 3.5s Cooldown -> Next 10.0s Countdown`) fails to execute in sequence.
2. **Countdown Skipping / Short Circuit**: The 10-second countdown does not run for its full duration. It frequently starts at e.g. 8s or 5s, or abruptly vanishes after 1–2 seconds and jumps directly into `FLYING`.
3. **Double Crash / Flicker Glitch**: Immediately after a crash, instead of holding the 3.5s crashed screen and transitioning smoothly into the 10s countdown, the canvas flickers, restarts flight immediately, and crashes again prematurely.

---

## 🔍 Technical Root Cause Analysis (For Studio Engineering Team)

Based on the architecture detailed in your technical response (`ROYAL_GAMES_STUDIO_TECHNICAL_RESPONSE.md`), this issue is caused by the following mechanisms in the Studio frontend/backend:

### 1. ⚡ 150ms State Poller Race Condition (`/api/studio/multiplayer/state`)
* The client polls `GET /api/studio/multiplayer/state` every **150ms**.
* When the server transitions from `CRASHED` to `COUNTDOWN` to `FLYING`:
  * If a client receives a poller payload where `serverNow >= flightStartTime`, the client **forcibly overrides its local state** and jumps directly to `FLYING`, completely skipping the visual 10-second countdown for the user.
* **Fix Required**: The client state machine must respect local phase timers and never abruptly truncate an active phase unless a hard desync threshold (>2000ms) is crossed.

---

### 2. ☁️ Vercel Serverless Multi-Instance / Lambda Clock Skew
* If `royalgamesstudio.vercel.app` calculates `serverNow` across multiple serverless lambda instances without a single centralized Redis/Upstash source of truth:
  * User A's request hits Lambda #1 (Round time: $T_1$).
  * User B's request hits Lambda #2 (Round time: $T_2$).
  * Different lambda instances calculate slightly different phase boundaries or crash multipliers, causing the client to receive conflicting state updates that oscillate between `CRASHED` and `FLYING`.
* **Fix Required**: Ensure all multiplayer state queries read from a single shared atomic Redis instance or deterministic epoch math with strict NTP server synchronization.

---

### 3. ⏱️ Deterministic Phase State Machine Fix Needed in Studio Client

The game engine inside `/play/[sessionId]` must enforce strict phase guardrails:

```typescript
// Studio Client State Machine Guardrail
const PHASE_DURATIONS = {
  COUNTDOWN: 10000, // Strict 10.0s
  CRASH_PAUSE: 3500, // Strict 3.5s
};

// When server state is received:
if (serverState.phase === 'FLYING') {
  const elapsed = serverNow - serverState.flightStartTime;
  if (elapsed < 0) {
    // We are still in countdown phase! Do NOT jump to flying!
    localPhase = 'COUNTDOWN';
    countdownRemaining = Math.abs(elapsed) / 1000;
  } else {
    localPhase = 'FLYING';
    currentMultiplier = calculateMultiplier(elapsed / 1000);
  }
}
```

---

## 🎯 Requested Action Items from Studio Team

1. **Verify State Transition Timings**: Ensure that every round strictly adheres to:
   - `COUNTDOWN`: Exactly 10.0 seconds.
   - `FLYING`: Ascends smoothly until mathematical crash point.
   - `CRASHED`: Displays crash screen for exactly 3.5 seconds.
2. **Prevent Poller Flicker**: Ensure the 150ms poller does not cause canvas redraw flashes or state oscillation when rapid responses return out of order.
3. **Deploy Patch to `royalgamesstudio.vercel.app`**: Test multi-user room in production with 2 active players playing 10 consecutive continuous rounds.
