const express = require("express");
const { dbQuery } = require("@surf-ai/sdk/db");

const router = express.Router();

const maskWallet = (wallet) => (wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : null);

// Top Squeek citizens by lifetime coins earned.
router.get("/", async (_req, res) => {
  try {
    const { rows } = await dbQuery(
      `SELECT name, coins_earned, chapter, won, wallet, updated_at
       FROM players
       WHERE coins_earned > 0
       ORDER BY coins_earned DESC, updated_at ASC
       LIMIT 20`
    );
    res.json({
      ok: true,
      players: rows.map((row, index) => ({
        rank: index + 1,
        name: row.name,
        coins_earned: row.coins_earned,
        chapter: row.chapter,
        won: row.won,
        wallet: maskWallet(row.wallet),
        updated_at: row.updated_at,
      })),
    });
  } catch (error) {
    console.error("[leaderboard] failed:", error.message);
    res.status(500).json({ ok: false, error: "leaderboard_failed" });
  }
});

module.exports = router;
