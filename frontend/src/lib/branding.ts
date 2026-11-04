// Squeek Life — runtime branding: tab title + pixel-mouse favicon.
// (index.html is managed by the scaffold, so the app applies its own identity here.)

const TITLE = "Squeek Life — From Rags to Riches";
const DESCRIPTION =
  "Squeek Life: a pixel rags-to-riches life sim. Scavenge trash, take jobs, upgrade your look and unlock the rich district. Live Squeekchain data, in-game Coins only.";

// 32×32 pixel mouse, palette taken from the in-game sprite.
const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#141221"/>
  <rect x="5" y="5" width="8" height="8" fill="#b9a28c"/>
  <rect x="7" y="7" width="4" height="4" fill="#e8a8b8"/>
  <rect x="19" y="5" width="8" height="8" fill="#b9a28c"/>
  <rect x="21" y="7" width="4" height="4" fill="#e8a8b8"/>
  <rect x="7" y="9" width="18" height="16" fill="#b9a28c"/>
  <rect x="10" y="22" width="12" height="3" fill="#dccfba"/>
  <rect x="11" y="14" width="3" height="3" fill="#2b2b33"/>
  <rect x="18" y="14" width="3" height="3" fill="#2b2b33"/>
  <rect x="14" y="19" width="4" height="3" fill="#e8788f"/>
  <rect x="23" y="24" width="6" height="6" fill="#ffd977"/>
  <rect x="24" y="25" width="4" height="1" fill="#e8b23a"/>
</svg>`;

export const faviconHref = `data:image/svg+xml,${encodeURIComponent(FAVICON_SVG)}`;

function ensureIcon() {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/svg+xml";
  link.href = faviconHref;
  // Safari pins this one instead of rel="icon".
  if (!document.querySelector('link[rel="mask-icon"]')) {
    const mask = document.createElement("link");
    mask.rel = "mask-icon";
    mask.href = faviconHref;
    document.head.appendChild(mask);
  }
}

function ensureMeta(name: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}

/** Applied once on boot. */
export function applyBranding() {
  document.title = TITLE;
  ensureIcon();
  ensureMeta("description", DESCRIPTION);
  ensureMeta("theme-color", "#0d0c16");
  ensureMeta("apple-mobile-web-app-title", "Squeek Life");
}

/** While a run is open the tab shows the chapter being played. */
export function setChapterTitle(chapter: number | null) {
  document.title = chapter ? `Squeek Life · Chapter ${chapter}` : TITLE;
}
