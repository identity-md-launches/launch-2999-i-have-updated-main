import { api } from "./api";
import type { SaveData } from "@/game/engine";

export interface PlayerRow {
  player_key: string;
  name: string;
  wallet: string | null;
  coins: number;
  coins_earned: number;
  chapter: number;
  stage: number;
  won: boolean;
  state: SaveData | null;
  updated_at: string;
}

export interface LeaderboardRow {
  rank: number;
  name: string;
  coins_earned: number;
  chapter: number;
  won: boolean;
  wallet: string | null;
  updated_at: string;
}

export async function loadProgress(key: string): Promise<{ player: PlayerRow; achievements: { code: string; title: string }[] } | null> {
  try {
    const res = await fetch(api(`progress/${encodeURIComponent(key)}`));
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.ok) return null;
    return { player: json.player as PlayerRow, achievements: json.achievements ?? [] };
  } catch {
    return null;
  }
}

export async function saveProgress(
  playerKey: string,
  name: string,
  wallet: string | null,
  summary: { coins: number; coinsEarned: number; chapter: number; stage: number; won: boolean },
  state: SaveData
): Promise<void> {
  try {
    await fetch(api("progress/save"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        player_key: playerKey,
        name,
        wallet,
        coins: summary.coins,
        coins_earned: summary.coinsEarned,
        chapter: summary.chapter,
        stage: summary.stage,
        won: summary.won,
        state,
      }),
    });
  } catch {
    // Offline-safe: the next autosave will retry.
  }
}

export async function unlockAchievement(playerKey: string, code: string, title: string): Promise<void> {
  try {
    await fetch(api("progress/achievement"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ player_key: playerKey, code, title }),
    });
  } catch {
    // Non-critical.
  }
}

export async function fetchLeaderboard(): Promise<LeaderboardRow[]> {
  const res = await fetch(api("leaderboard"), { cache: "no-store" });
  const json = await res.json();
  return json?.players ?? [];
}

export interface SqueekOverview {
  ok: boolean;
  fetched_at: string;
  source: string;
  status: { ok: boolean; data?: any; error?: string; cached?: boolean };
  core: { ok: boolean; data?: any; error?: string; cached?: boolean };
  economy: { ok: boolean; data?: any; error?: string; cached?: boolean };
  stats: { ok: boolean; data?: any; error?: string; cached?: boolean };
  events: { ok: boolean; data?: any; error?: string; cached?: boolean };
}

export async function fetchSqueekOverview(): Promise<SqueekOverview> {
  const res = await fetch(api("squeekchain/overview"), { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as SqueekOverview;
}

export async function fetchSqueekAccount(address: string): Promise<{ ok: boolean; data?: any; error?: string }> {
  const res = await fetch(api(`squeekchain/account/${address}`), { cache: "no-store" });
  return (await res.json()) as { ok: boolean; data?: any; error?: string };
}

// SQK-style base units (18 decimals) → readable string.
export function formatBaseUnits(value: string | null | undefined, digits = 2): string {
  if (value === null || value === undefined || value === "") return "—";
  try {
    const big = BigInt(value);
    const negative = big < BigInt(0);
    const abs = negative ? -big : big;
    const scale = BigInt(10) ** BigInt(18);
    const whole = abs / scale;
    const frac = abs % scale;
    const fracStr = frac.toString().padStart(18, "0").slice(0, digits);
    return `${negative ? "-" : ""}${whole.toLocaleString("en-US")}${digits > 0 ? "." + fracStr : ""}`;
  } catch {
    return "—";
  }
}

export function compactNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return n.toLocaleString("en-US");
  return String(Math.round(n * 100) / 100);
}

export function formatWhen(iso: string | undefined | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
}
