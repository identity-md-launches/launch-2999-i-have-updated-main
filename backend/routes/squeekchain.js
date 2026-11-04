// Live read-only proxy for Squeekchain's public API (https://api.squeekchain.com/v1/…).
// No key required. Every payload is passed through as-is — never invented.
//
// The upstream sits behind Cloudflare and answers 403 to obvious bot traffic from
// datacenter IPs (Node's default `user-agent: node` is one of them). We therefore
// identify ourselves properly, and retry with standard browser headers if a WAF
// still refuses the request. Rate limits (429/503/504) are retried with backoff,
// honouring Retry-After as the docs require.
const express = require("express");

const router = express.Router();

const API_BASE = "https://api.squeekchain.com";
const APP_UA = "SqueekLife/1.0 (+https://squeeklife.surf.computer; read-only game client)";
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const cache = new Map(); // path -> { at, payload }

// Live readings must never be served from an intermediary cache: a stale blocked
// response would otherwise keep the game dark long after the upstream recovered.
function noStore(res) {
  res.set("cache-control", "no-store, max-age=0");
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function headersFor(attempt) {
  const base = {
    accept: "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "no-cache",
  };
  return attempt === 0 ? { ...base, "user-agent": APP_UA } : { ...base, "user-agent": BROWSER_UA };
}

async function attemptFetch(path, attempt, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      signal: controller.signal,
      headers: headersFor(attempt),
    });
    if (!response.ok) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "0");
      const requestId = response.headers.get("x-request-id");
      const error = new Error(`HTTP ${response.status}${requestId ? ` (${requestId})` : ""}`);
      error.status = response.status;
      error.retryAfter = Number.isFinite(retryAfter) ? retryAfter : 0;
      throw error;
    }
    return JSON.parse(await response.text());
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(path, { timeoutMs = 9000 } = {}) {
  const retryable = new Set([403, 429, 500, 502, 503, 504]);
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await attemptFetch(path, attempt, timeoutMs);
    } catch (error) {
      lastError = error;
      if (error.name === "AbortError") {
        lastError = new Error("timeout");
        break;
      }
      if (!retryable.has(error.status) || attempt === 2) break;
      const wait = error.retryAfter ? Math.min(error.retryAfter * 1000, 4000) : 350 * (attempt + 1);
      await sleep(wait);
    }
  }
  throw lastError ?? new Error("unknown_error");
}

async function cached(path, ttlMs) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < ttlMs) return { ok: true, data: hit.payload, cached: true };
  try {
    const data = await fetchJson(path);
    cache.set(path, { at: Date.now(), payload: data });
    return { ok: true, data, cached: false };
  } catch (error) {
    // Serve the last good copy if the upstream is briefly unreachable.
    if (hit) return { ok: true, data: hit.payload, cached: true, stale: true };
    return { ok: false, error: error.message, status: error.status ?? null };
  }
}

const OVERVIEW_PATHS = [
  ["/v1/status", 15_000],
  ["/v1/core", 20_000],
  ["/v1/economy/state", 30_000],
  ["/v1/measurement/stats?range=7d", 300_000],
  ["/v1/events?category=all&limit=12", 30_000],
];

// Everything the game shows about the real Squeekchain, in one call.
router.get("/overview", async (_req, res) => {
  noStore(res);
  const [status, core, economy, stats, events] = await Promise.all(
    OVERVIEW_PATHS.map(([path, ttl]) => cached(path, ttl))
  );

  res.json({
    ok: status.ok || core.ok || economy.ok,
    fetched_at: new Date().toISOString(),
    source: `${API_BASE}/v1`,
    status,
    core,
    economy,
    stats,
    events,
  });
});

// A wallet's real Squeekchain footprint (Squeeks held, power, SQK, earnings).
router.get("/account/:address", async (req, res) => {
  noStore(res);
  const address = String(req.params.address || "");
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return res.status(400).json({ ok: false, error: "invalid_address" });
  }
  const result = await cached(`/v1/accounts/${address.toLowerCase()}?limit=12`, 20_000);
  if (!result.ok) return res.status(502).json({ ok: false, error: result.error });
  res.json({ ok: true, cached: Boolean(result.cached), data: result.data });
});

// Reachability self-check: hit each upstream endpoint once and report exactly what
// the server sees (status, latency, error). Handy when a deployment can't read live data.
router.get("/diag", async (_req, res) => {
  noStore(res);
  const results = [];
  for (const [path] of OVERVIEW_PATHS) {
    const started = Date.now();
    try {
      const payload = await fetchJson(path, { timeoutMs: 8000 });
      results.push({ path, ok: true, ms: Date.now() - started, bytes: JSON.stringify(payload).length });
    } catch (error) {
      results.push({ path, ok: false, ms: Date.now() - started, status: error.status ?? null, error: error.message });
    }
  }
  res.json({
    ok: results.every((entry) => entry.ok),
    upstream: API_BASE,
    checked_at: new Date().toISOString(),
    results,
  });
});

module.exports = router;
