// Ready-made promo copy for Squeek Life + one-click share helpers.
// Everything here is plain text so the player can post it anywhere.

/** Used when the game runs locally (preview) — the public link is what people can open. */
export const PUBLIC_URL = "https://finish-product-322f7d.surf.computer/";

/** The link to share: the live site when we're on it, otherwise the public one. */
export function gameUrl(): string {
  if (typeof window === "undefined") return PUBLIC_URL;
  const host = window.location.hostname;
  if (!host || host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) return PUBLIC_URL;
  const base = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  return new URL(base, window.location.origin).toString();
}

/** Fits a single post (X counts every link as 23 characters). */
export const SHORT_POST = `Squeek Life 🐹 — a pixel rags-to-riches life sim.

Squeek wakes up broke in the slums. Scavenge trash, climb 6 jobs, and earn the golden gate into the rich district.

The WHEELY9000 rig runs on live Squeekchain data.`;

/** Longer version: story, jobs, and the chain rig. Post one by one as a thread. */
export const THREAD_POSTS: string[] = [
  `Squeek Life 🐹 — a pixel rags-to-riches life sim you can play right in the browser.

Meet Squeek: a hamster in a shack at the edge of the slums, 0 Coins to his name, and one plan — get rich.`,
  `The story, in 5 chapters:

1 · Rock Bottom
2 · The Grind
3 · Level Up
4 · The Big Break
5 · The Rich District

One city, three districts split by walls — the slums, the office blocks, and the rich side behind a golden gate.`,
  `The work:

🗑️ Hold E to dig through trash piles
🛵 Food delivery — 45 Coins
☎️ Office clerk — 100
📱 Corporate manager — 160
🏍️ Business deals — 220
💻 Startup founder — 550

Every job unlocks with gear you buy from money you earned.`,
  `The hook: the WHEELY9000 rig in the office district is wired to LIVE Squeekchain data.

Core status, blocks, supply, staking — read straight from the chain. And while the real wheel is spinning, standing at the rig refills your energy for free.`,
  `Free to play, no wallet needed.

Link a Sepolia wallet only if you want your name on the leaderboard — read-only, the game never asks you to sign or pay.`,
];

export function postOnX(text: string, url?: string) {
  const params = new URLSearchParams({ text });
  if (url) params.set("url", url);
  window.open(`https://twitter.com/intent/tweet?${params.toString()}`, "_blank", "noopener,noreferrer");
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
