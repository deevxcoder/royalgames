import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function getRandomCard() {
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
  const isRed = suit === "♥" || suit === "♦";
  return {
    rank,
    suit,
    color: isRed ? "red" : "black",
    display: `${rank}${suit}`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId,
      sessionToken,
      gameUid = "royal_skyrush",
      betAmount = 50,
      currentBalance = 1000,
      // Game-specific parameters
      coinChoice = "heads",
      andarBaharSide = "andar",
      chickenAction = "step", // "step" or "cashout"
      currentChickenLane = 0,
      minesCount = 3,
      revealedMinesIndices = [],
      mineTileIndex = 0,
      isMinesCashout = false,
      rouletteBetType = "red", // "red", "black", "even", "odd", "number_17", etc.
      aviatorCashoutMult = 0, // > 0 if cashed out
    } = body;

    const bet = Number(betAmount) || 0;
    let winAmount = 0;
    let multiplier = 0;
    let isWin = false;
    let extraData: any = {};
    let gameName = "Royal Game";

    // 1. COIN FLIP ROYALE
    if (gameUid === "royal_coinflip") {
      gameName = "Coin Flip Royale";
      const outcome = Math.random() < 0.5 ? "heads" : "tails";
      isWin = outcome === coinChoice;
      multiplier = isWin ? 1.96 : 0;
      winAmount = isWin ? Number((bet * multiplier).toFixed(2)) : 0;
      extraData = {
        coinResult: outcome,
        multiplier,
      };
    }

    // 2. ANDAR BAHAR LIVE
    else if (gameUid === "royal_andarbahar") {
      gameName = "Andar Bahar Live";
      const joker = getRandomCard();
      const dealtAndar: any[] = [];
      const dealtBahar: any[] = [];
      let winningSide: "andar" | "bahar" = "andar";
      let matched = false;

      // Deal cards alternately
      for (let i = 0; i < 20; i++) {
        const nextCardAndar = getRandomCard();
        dealtAndar.push(nextCardAndar);
        if (nextCardAndar.rank === joker.rank) {
          winningSide = "andar";
          matched = true;
          break;
        }

        const nextCardBahar = getRandomCard();
        dealtBahar.push(nextCardBahar);
        if (nextCardBahar.rank === joker.rank) {
          winningSide = "bahar";
          matched = true;
          break;
        }
      }

      if (!matched) {
        // Guarantee match on chosen random side if exhausted
        const matchCard = { ...joker, suit: joker.suit === "♠" ? "♥" : "♠" };
        winningSide = Math.random() < 0.5 ? "andar" : "bahar";
        if (winningSide === "andar") dealtAndar.push(matchCard);
        else dealtBahar.push(matchCard);
      }

      isWin = winningSide === andarBaharSide;
      multiplier = isWin ? (winningSide === "andar" ? 1.9 : 2.0) : 0;
      winAmount = isWin ? Number((bet * multiplier).toFixed(2)) : 0;
      extraData = {
        jokerCard: joker,
        dealtAndar,
        dealtBahar,
        winningSide,
        multiplier,
      };
    }

    // 3. CHICKEN ROAD CROSS
    else if (gameUid === "royal_chickencross") {
      gameName = "Chicken Road Cross";
      if (chickenAction === "cashout") {
        multiplier = Math.max(1.0, 1.0 + currentChickenLane * 0.35);
        winAmount = Number((bet * multiplier).toFixed(2));
        isWin = true;
        extraData = {
          cashedOut: true,
          crashed: false,
          lane: currentChickenLane,
          multiplier,
        };
      } else {
        // Step forward
        const crashProbability = 0.18 + currentChickenLane * 0.04;
        const crashed = Math.random() < crashProbability;
        if (crashed) {
          isWin = false;
          winAmount = 0;
          multiplier = 0;
          extraData = {
            cashedOut: false,
            crashed: true,
            lane: currentChickenLane,
          };
        } else {
          const nextLane = currentChickenLane + 1;
          multiplier = Number((1.0 + nextLane * 0.35).toFixed(2));
          isWin = true;
          winAmount = 0; // Not cashed out yet
          extraData = {
            cashedOut: false,
            crashed: false,
            lane: nextLane,
            multiplier,
          };
        }
      }
    }

    // 4. AVIATOR ROYALE CRASH
    else if (gameUid === "royal_aviator") {
      gameName = "Aviator Royale Crash";
      if (aviatorCashoutMult > 0) {
        multiplier = Number(aviatorCashoutMult.toFixed(2));
        winAmount = Number((bet * multiplier).toFixed(2));
        isWin = true;
        extraData = {
          multiplier,
          cashedOut: true,
        };
      } else {
        isWin = false;
        winAmount = 0;
        extraData = {
          multiplier: 0,
          cashedOut: false,
        };
      }
    }

    // 5. MINES GOLD
    else if (gameUid === "royal_mines") {
      gameName = "Mines Gold";
      if (isMinesCashout) {
        const safePicks = revealedMinesIndices.length;
        const calcMult = Number((1 + safePicks * (0.2 + minesCount * 0.08)).toFixed(2));
        winAmount = Number((bet * calcMult).toFixed(2));
        isWin = true;
        extraData = {
          cashedOut: true,
          hitBomb: false,
          multiplier: calcMult,
        };
      } else {
        // Pick tile
        const totalTiles = 25;
        const remainingTiles = totalTiles - revealedMinesIndices.length;
        const hitBombChance = minesCount / remainingTiles;
        const hitBomb = Math.random() < hitBombChance;

        if (hitBomb) {
          isWin = false;
          winAmount = 0;
          extraData = {
            hitBomb: true,
            cashedOut: false,
            tileIndex: mineTileIndex,
          };
        } else {
          const nextSafeCount = revealedMinesIndices.length + 1;
          const nextMult = Number((1 + nextSafeCount * (0.2 + minesCount * 0.08)).toFixed(2));
          isWin = true;
          winAmount = 0; // ongoing round
          extraData = {
            hitBomb: false,
            cashedOut: false,
            tileIndex: mineTileIndex,
            multiplier: nextMult,
          };
        }
      }
    }

    // 6. EUROPEAN ROULETTE
    else if (gameUid === "royal_roulette") {
      gameName = "European Roulette";
      const winningNumber = Math.floor(Math.random() * 37); // 0 - 36
      const RED_NUMS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
      const isRed = RED_NUMS.includes(winningNumber);
      const isBlack = winningNumber !== 0 && !isRed;
      const isEven = winningNumber !== 0 && winningNumber % 2 === 0;
      const isOdd = winningNumber !== 0 && winningNumber % 2 !== 0;

      let won = false;
      if (rouletteBetType === "red" && isRed) {
        won = true;
        multiplier = 2.0;
      } else if (rouletteBetType === "black" && isBlack) {
        won = true;
        multiplier = 2.0;
      } else if (rouletteBetType === "even" && isEven) {
        won = true;
        multiplier = 2.0;
      } else if (rouletteBetType === "odd" && isOdd) {
        won = true;
        multiplier = 2.0;
      } else if (rouletteBetType === `num_${winningNumber}`) {
        won = true;
        multiplier = 36.0;
      }

      isWin = won;
      winAmount = isWin ? Number((bet * multiplier).toFixed(2)) : 0;
      extraData = {
        winningNumber,
        isRed,
        isBlack,
        multiplier,
      };
    }

    // Calculate new balance
    // For cashout / final round: newBalance = currentBalance - bet + winAmount
    const newBalance = Number((currentBalance - bet + winAmount).toFixed(2));

    // Settle with royalggr B2B engine
    const royalggrUrl = process.env.ROYAL_GGR_URL || "http://localhost:3001";
    let ggrResponseData: any = {};

    try {
      const ggrRes = await axios.post(`${royalggrUrl}/api/studio/round`, {
        sessionToken,
        sessionId,
        gameUid,
        gameName,
        betAmount: bet,
        winAmount,
        newPlayerBalance: newBalance,
        gameRoundInfo: extraData,
      });
      ggrResponseData = ggrRes.data;
    } catch (ggrErr: any) {
      console.warn("Could not notify royalggr directly (offline simulation mode active):", ggrErr.message);
    }

    return NextResponse.json({
      success: true,
      isWin,
      betAmount: bet,
      winAmount,
      multiplier,
      newBalance,
      serialNumber: ggrResponseData?.serialNumber || `SN_SIM_${Date.now()}`,
      ...extraData,
    });
  } catch (err: any) {
    console.error("Studio Round Execution Error:", err);
    return NextResponse.json({ success: false, error: err.message || "Internal error" }, { status: 500 });
  }
}
