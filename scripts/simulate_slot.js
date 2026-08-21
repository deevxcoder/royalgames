// Simulation with Dynamic / Random Bets (₹10 to ₹100 per spin)

const SYMBOLS_CONFIG = {
  ganesha: { payouts: { 3: 30, 4: 100, 5: 300 } },
  tajmahal: { payouts: { 3: 2, 4: 15, 5: 30 } },
  peacock: { payouts: { 3: 15, 4: 50, 5: 150 } },
  lotus: { payouts: { 3: 10, 4: 30, 5: 100 } },
  diya: { payouts: { 3: 8, 4: 20, 5: 60 } },
  ring: { payouts: { 3: 5, 4: 15, 5: 40 } },
  ace: { payouts: { 3: 3, 4: 8, 5: 25 } },
  king: { payouts: { 3: 2.5, 4: 6, 5: 20 } },
  queen: { payouts: { 3: 2, 4: 5, 5: 15 } },
  jack: { payouts: { 3: 1.5, 4: 4, 5: 10 } },
};

const PAYLINES = [
  [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 2, 2, 2, 1], [1, 0, 0, 0, 1], [0, 1, 1, 1, 0],
  [2, 1, 1, 1, 2], [0, 1, 0, 1, 0], [2, 1, 2, 1, 2], [1, 0, 1, 0, 1], [1, 2, 1, 2, 1],
  [0, 0, 1, 0, 0], [2, 2, 1, 2, 2], [1, 1, 0, 1, 1], [1, 1, 2, 1, 1], [0, 2, 0, 2, 0],
];

const REEL_STRIPS = [
  ["jack", "queen", "king", "ace", "diya", "ring", "lotus", "peacock", "jack", "queen", "king", "diya", "ace", "ganesha", "jack", "queen", "king", "tajmahal", "lotus", "diya"],
  ["jack", "queen", "king", "diya", "ring", "lotus", "peacock", "jack", "queen", "ace", "diya", "ganesha", "jack", "queen", "king", "tajmahal", "ace", "lotus", "king", "queen"],
  ["jack", "queen", "king", "diya", "ring", "lotus", "peacock", "ace", "jack", "queen", "king", "ganesha", "diya", "tajmahal", "ace", "queen", "jack", "lotus", "king", "ring"],
  ["jack", "queen", "king", "diya", "ring", "lotus", "peacock", "jack", "queen", "king", "ace", "diya", "ganesha", "tajmahal", "jack", "queen", "lotus", "ace", "king", "diya"],
  ["jack", "queen", "king", "diya", "ring", "lotus", "peacock", "jack", "queen", "king", "ace", "diya", "ganesha", "tajmahal", "jack", "queen", "lotus", "ace", "king", "ring"]
];

function generateRandomReels() {
  const grid = [];
  for (let c = 0; c < 5; c++) {
    const strip = REEL_STRIPS[c];
    const stopIdx = Math.floor(Math.random() * strip.length);
    const reel = [
      strip[stopIdx % strip.length],
      strip[(stopIdx + 1) % strip.length],
      strip[(stopIdx + 2) % strip.length]
    ];
    grid.push(reel);
  }
  return grid;
}

function evaluateSpin(grid, totalBet, isFreeSpins = false) {
  const lineBet = totalBet / PAYLINES.length;
  let totalLinePayout = 0;

  PAYLINES.forEach((linePattern) => {
    const symbolsOnLine = [];
    for (let reel = 0; reel < 5; reel++) {
      const row = linePattern[reel];
      symbolsOnLine.push(grid[reel][row]);
    }

    let targetSymbol = null;
    let hasWild = false;
    for (const sym of symbolsOnLine) {
      if (sym === "ganesha") {
        hasWild = true;
        continue;
      }
      if (sym === "tajmahal") break;
      targetSymbol = sym;
      break;
    }

    if (!targetSymbol && hasWild) targetSymbol = "ganesha";
    if (!targetSymbol) return;

    let matchCount = 0;
    for (let i = 0; i < 5; i++) {
      const current = symbolsOnLine[i];
      if (current === targetSymbol || (current === "ganesha" && targetSymbol !== "tajmahal")) {
        matchCount++;
      } else {
        break;
      }
    }

    if (matchCount >= 3) {
      const config = SYMBOLS_CONFIG[targetSymbol];
      const baseMultiplier = (config.payouts && config.payouts[matchCount]) || 0;
      if (baseMultiplier > 0) {
        const wildMult = hasWild ? 2 : 1;
        const freeSpinMult = isFreeSpins ? 2 : 1;
        const totalMult = baseMultiplier * wildMult * freeSpinMult;
        totalLinePayout += lineBet * totalMult;
      }
    }
  });

  let scatterCount = 0;
  for (let reel = 0; reel < 5; reel++) {
    for (let row = 0; row < 3; row++) {
      if (grid[reel][row] === "tajmahal") scatterCount++;
    }
  }

  let scatterWin = 0;
  let isFreeSpinsTriggered = false;
  if (scatterCount >= 3) {
    isFreeSpinsTriggered = true;
    const scatterMult = scatterCount === 5 ? 30 : scatterCount === 4 ? 15 : 2;
    scatterWin = totalBet * scatterMult;
  }

  const totalWin = Number((totalLinePayout + scatterWin).toFixed(2));
  return { totalWin, isFreeSpinsTriggered };
}

// SIMULATION WITH RANDOM BETS (₹10, ₹20, ₹50, ₹100)
function runRandomBetsSimulation() {
  const INITIAL_BALANCE = 10000;
  const BET_OPTIONS = [10, 20, 50, 100]; // common player bets between 10 and 100

  let playerBalance = INITIAL_BALANCE;
  let totalWagered = 0;
  let totalWon = 0;
  let rounds = 0;
  let freeSpinsCount = 0;
  let bigWinsCount = 0;

  const milestones = [];
  const intervals = [100, 200, 300, 400, 500, 600, 700, 800];

  while (playerBalance >= 10 && rounds < 5000) {
    rounds++;

    // Pick random bet amount from ₹10 to ₹100
    const availableBets = BET_OPTIONS.filter(b => b <= playerBalance);
    if (availableBets.length === 0) break;
    const currentBet = availableBets[Math.floor(Math.random() * availableBets.length)];

    playerBalance -= currentBet;
    totalWagered += currentBet;

    const grid = generateRandomReels();
    const result = evaluateSpin(grid, currentBet, false);
    let roundWin = result.totalWin;

    if (result.isFreeSpinsTriggered) {
      freeSpinsCount++;
      for (let f = 0; f < 10; f++) {
        const fsGrid = generateRandomReels();
        const fsRes = evaluateSpin(fsGrid, currentBet, true);
        roundWin += fsRes.totalWin;
      }
    }

    if (roundWin >= currentBet * 6) bigWinsCount++;

    playerBalance += roundWin;
    totalWon += roundWin;

    if (intervals.includes(rounds) || playerBalance < 10) {
      const houseProfit = totalWagered - totalWon;
      milestones.push({
        round: rounds,
        playerBalance: Math.round(playerBalance),
        houseProfit: Math.round(houseProfit),
        totalWagered: Math.round(totalWagered),
        totalWon: Math.round(totalWon),
        avgBet: (totalWagered / rounds).toFixed(1),
        rtp: ((totalWon / totalWagered) * 100).toFixed(1) + "%",
      });
    }
  }

  return {
    initialBalance: INITIAL_BALANCE,
    survivedRounds: rounds,
    finalBalance: Math.round(playerBalance),
    totalWagered,
    totalWon: Math.round(totalWon),
    totalHouseProfit: Math.round(totalWagered - totalWon),
    overallRTP: ((totalWon / totalWagered) * 100).toFixed(2) + "%",
    freeSpinsCount,
    bigWinsCount,
    milestones,
  };
}

console.log(JSON.stringify(runRandomBetsSimulation(), null, 2));
