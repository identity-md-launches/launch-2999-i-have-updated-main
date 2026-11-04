const express = require("express");
const { dbQuery } = require("@surf-ai/sdk/db");

const router = express.Router();

const cleanKey = (value) => (typeof value === "string" && value.trim().length >= 8 && value.length <= 80 ? value.trim() : null);
const int = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Math.max(0, Math.round(Number(value))) : fallback);
// Public leaderboard: a run can never earn more than this, so cap tampered payloads.
const MAX_COINS = 50_000_000;
// Light anti-spam: one save per player every 1.2s (the game autosaves every 8s).
const SAVE_MIN_INTERVAL_MS = 1_200;
const lastSaveAt = new Map();

function saveAllowed(key) {
  const now = Date.now();
  const previous = lastSaveAt.get(key) ?? 0;
  if (now - previous < SAVE_MIN_INTERVAL_MS) return false;
  lastSaveAt.set(key, now);
  if (lastSaveAt.size > 5000) {
    for (const [entryKey, at] of lastSaveAt) if (now - at > 60_000) lastSaveAt.delete(entryKey);
  }
  return true;
}

// Load a playthrough + its achievements.
router.get("/:key", async (req, res) => {
  const key = cleanKey(req.params.key);
  if (!key) return res.status(400).json({ ok: false, error: "invalid_player_key" });
  try {
    const player = await dbQuery("SELECT * FROM players WHERE player_key = $1", [key]);
    if (player.rows.length === 0) return res.status(404).json({ ok: false, error: "not_found" });
    const achievements = await dbQuery(
      "SELECT code, title, created_at FROM achievements WHERE player_key = $1 ORDER BY created_at ASC",
      [key]
    );
    return res.json({ ok: true, player: player.rows[0], achievements: achievements.rows });
  } catch (error) {
    console.error("[progress] load failed:", error.message);
    return res.status(500).json({ ok: false, error: "load_failed" });
  }
});

// Save (upsert) a playthrough.
router.post("/save", async (req, res) => {
  const body = req.body || {};
  const key = cleanKey(body.player_key);
  if (!key) return res.status(400).json({ ok: false, error: "invalid_player_key" });
  if (!saveAllowed(key)) return res.status(429).json({ ok: false, error: "too_many_saves" });
  const name = (typeof body.name === "string" ? body.name : "").trim().slice(0, 24) || "Squeek";
  const wallet = typeof body.wallet === "string" && /^0x[a-fA-F0-9]{40}$/.test(body.wallet) ? body.wallet.toLowerCase() : null;
  let state = null;
  if (body.state && typeof body.state === "object") {
    const encoded = JSON.stringify(body.state);
    if (encoded.length <= 40000) state = encoded;
  }
  try {
    const result = await dbQuery(
      `INSERT INTO players (player_key, name, wallet, coins, coins_earned, chapter, stage, won, state, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, now())
       ON CONFLICT (player_key) DO UPDATE SET
         name = EXCLUDED.name,
         wallet = COALESCE(EXCLUDED.wallet, players.wallet),
         coins = EXCLUDED.coins,
         coins_earned = EXCLUDED.coins_earned,
         chapter = EXCLUDED.chapter,
         stage = EXCLUDED.stage,
         won = EXCLUDED.won,
         state = EXCLUDED.state,
         updated_at = now()
       RETURNING id, updated_at`,
      [
        key,
        name,
        wallet,
        int(body.coins) > MAX_COINS ? MAX_COINS : int(body.coins),
        int(body.coins_earned) > MAX_COINS ? MAX_COINS : int(body.coins_earned),
        Math.min(5, Math.max(1, int(body.chapter, 1))),
        Math.min(5, Math.max(0, int(body.stage))),
        Boolean(body.won),
        state,
      ]
    );
    return res.json({ ok: true, saved_at: result.rows[0]?.updated_at ?? null });
  } catch (error) {
    console.error("[progress] save failed:", error.message);
    return res.status(500).json({ ok: false, error: "save_failed" });
  }
});

// Unlock an achievement (idempotent per player + code).
router.post("/achievement", async (req, res) => {
  const body = req.body || {};
  const key = cleanKey(body.player_key);
  const code = (typeof body.code === "string" ? body.code : "").trim().slice(0, 48);
  const title = (typeof body.title === "string" ? body.title : "").trim().slice(0, 80) || code;
  if (!key || !code) return res.status(400).json({ ok: false, error: "invalid_payload" });
  try {
    await dbQuery(
      `INSERT INTO achievements (player_key, code, title)
       SELECT $1, $2, $3
       WHERE NOT EXISTS (SELECT 1 FROM achievements WHERE player_key = $1 AND code = $2)`,
      [key, code, title]
    );
    return res.json({ ok: true });
  } catch (error) {
    console.error("[progress] achievement failed:", error.message);
    return res.status(500).json({ ok: false, error: "achievement_failed" });
  }
});

module.exports = router;

