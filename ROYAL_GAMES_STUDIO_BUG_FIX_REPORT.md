# 👑 Royal Games Studio — Bug Fix & Multiplayer Patch Report (v2.1.0)

> **Date**: 27 August 2026  
> **Target Client**: All Panel Exchange (B2B Client)  
> **Games In Scope**: **Sky Rush** (`royal_skyrush`) & **Cricket Blast** (`royal_cricketblast`)  
> **Status**: ✅ **RESOLVED & VERIFIED IN PRODUCTION BUILD**  
> **Reference Bug Report**: `ROYAL_GAMES_STUDIO_BUG_REPORT.md`  

---

## 📌 Executive Summary

We have identified and resolved the multiplayer desynchronization and poller state glitches reported during multi-user testing. 

The core issues were caused by **Vercel Serverless Multi-Instance clock divergence** (where separate Lambda instances initialized state on cold starts at different offsets) combined with **poller-driven state overrides**.

We have deployed **v2.1.0 Architecture Patch** featuring:
1. **100% Deterministic Pure Epoch Mathematics** across all serverless nodes globally.
2. **60 FPS Continuous Time-Driven Client State Machine** that strictly adheres to the 10.0s countdown, real-time ascent trajectory, and 3.5s crash cooldown without poller race conditions.

---

## 🔍 Root Cause & Fix Details

### 1. ☁️ Issue: Serverless Multi-Instance State Divergence
* **Root Cause**: On serverless hosting (Vercel Lambdas), separate instances initialized in-memory state on cold-start at whatever millisecond that specific container booted. User A hitting Lambda #1 and User B hitting Lambda #2 received slightly shifted round schedules and different round IDs.
* **Engine Fix**: 
  - Refactored `serverCrashEngine.ts` to compute all round schedules using **Pure Deterministic Epoch Math** seeded by hourly UTC anchors and provably fair PRNG (Mulberry32).
  - At **any exact millisecond $T$**, every serverless Lambda, edge worker, and data center in the world computes the **EXACT same round ID, same countdown start, same takeoff time, same flight duration, and same crash point**.

### 2. ⚡ Issue: 150ms Poller Overriding Local State
* **Root Cause**: Rapid poller responses returning `phase: FLYING` were forcibly updating the React UI state, abruptly cutting off the 10-second visual countdown on the user's screen.
* **Client Fix**:
  - The 150ms poller now **only updates the background server reference and network time offset** (`serverOffset`).
  - The **60 FPS internal animation loop is the sole authoritative driver** of local phase transitions:
    - $\text{Time} < \text{flightStart} \implies$ **Strict 10.0s Countdown** ($\text{timeLeft} = (\text{flightStart} - \text{Time}) / 1000$).
    - $\text{flightStart} \le \text{Time} < \text{crashTime} \implies$ **Smooth 60FPS Flight Curve** ($M(t) = \exp(0.065 \cdot (t \times 1.5)^{1.25})$).
    - $\text{crashTime} \le \text{Time} < \text{crashedEndTime} \implies$ **Strict 3.5s Crash Screen**.
  - Out-of-order poller packets (`data.serverTime < lastServerTime`) are automatically discarded.

---

## 🛠️ Modified Core Files in Studio Engine

| File | Changes Made |
|---|---|
| [`royalgames/lib/serverCrashEngine.ts`](file:///c:/Users/vikram/Desktop/royalgames-project/royalgames/lib/serverCrashEngine.ts) | Implemented deterministic hour-schedule computation with pure epoch math across all serverless lambdas. |
| [`royalgames/components/games/SkyRushGame.tsx`](file:///c:/Users/vikram/Desktop/royalgames-project/royalgames/components/games/SkyRushGame.tsx) | Decoupled poller from UI state; implemented continuous time-driven 60FPS phase state machine. |
| [`royalgames/components/games/CricketBlastGame.tsx`](file:///c:/Users/vikram/Desktop/royalgames-project/royalgames/components/games/CricketBlastGame.tsx) | Applied identical time-based continuous state machine and out-of-order packet filters. |

---

## 🎯 Verification & Test Results

```text
✓ Production Build Compilation: Passed (0 Type Errors)
✓ 10-Second Countdown Integrity: Verified 10.0s -> 0.0s uninterrupted across multiple tabs
✓ Multi-User Sync: Player 1 and Player 2 see identical round IDs, flight curves, and crash points
✓ Late-Join Interpolation: Late joining mid-flight renders exact active multiplier seamlessly
✓ Bet & Cashout Actions: 100% in-memory with zero canvas/DOM reloads
```

---

> **Support Contacts**:  
> * Technical Integration Lead: `api-support@royalgamesstudio.com`  
> * Live Integration Desk: Royal Games Studio B2B Developer Portal (`/portal/docs`)
