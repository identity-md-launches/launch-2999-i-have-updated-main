// Squeek Life — procedural pixel-art renderer (no external image assets).
import type { TileKind, Building, WorldObject, World, Npc, Dir } from "./world";
import { TILE, COLS, ROWS, ROAD_TOP, CROSSWALKS, WALL_A, WALL_B, GATE_ROWS } from "./world";

let ZOOM = 1;
export const setZoom = (z: number) => {
  ZOOM = z;
};

// Traffic signal phase, pushed in by the engine each frame so the lights can be drawn.
export type SignalPhase = "green" | "yellow" | "red";
let SIGNAL: SignalPhase = "green";
export const setSignalPhase = (phase: SignalPhase) => {
  SIGNAL = phase;
};
const r = (v: number) => (ZOOM === 1 ? Math.round(v) : Math.round(v * ZOOM) / ZOOM);

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(r(x), r(y), Math.max(1, r(w)), Math.max(1, r(h)));
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, radius: number) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") ctx.roundRect(r(x), r(y), r(w), r(h), radius);
  else ctx.rect(r(x), r(y), r(w), r(h));
}

const hash = (x: number, y: number, i = 0) => {
  let h = (x * 374761393 + y * 668265263 + i * 1274126177) | 0;
  h = (h ^ (h >>> 13)) * 1103515245;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};

const TILE_PAL: Record<TileKind, [string, string, string]> = {
  grass: ["#2f6b3f", "#2a6039", "#357947"],
  dirt: ["#6a5541", "#5f4c3a", "#77614b"],
  road: ["#3b3b46", "#35353f", "#43434f"],
  sidewalk: ["#8b8b93", "#82828a", "#96969e"],
  plaza: ["#6e6a7c", "#666274", "#787486"],
  lawn: ["#3e7a49", "#386f43", "#468a52"],
};

export function drawTile(ctx: CanvasRenderingContext2D, kind: TileKind, tx: number, ty: number) {
  const [base, dark, light] = TILE_PAL[kind];
  px(ctx, tx * TILE, ty * TILE, TILE, TILE, base);
  const n = kind === "road" ? 2 : 4;
  for (let i = 0; i < n; i++) {
    const h1 = hash(tx, ty, i * 3 + 1);
    const h2 = hash(tx, ty, i * 3 + 2);
    const h3 = hash(tx, ty, i * 3 + 3);
    const c = h3 > 0.5 ? light : dark;
    px(ctx, tx * TILE + Math.floor(h1 * 14) * 2, ty * TILE + Math.floor(h2 * 14) * 2, 2, 2, c);
  }
  if (kind === "sidewalk") {
    px(ctx, tx * TILE, ty * TILE, TILE, 2, dark);
    px(ctx, tx * TILE, ty * TILE, 2, TILE, dark);
  }
  if (kind === "plaza") {
    px(ctx, tx * TILE, ty * TILE, TILE, 1, dark);
    px(ctx, tx * TILE, ty * TILE, 1, TILE, dark);
  }
  if (kind === "road") {
    px(ctx, tx * TILE, ty * TILE, TILE, 1, dark);
  }
}

export function drawRoadDetails(ctx: CanvasRenderingContext2D, x0: number, x1: number) {
  const cy = (ROAD_TOP + 1) * TILE + TILE / 2 - 1;
  for (let x = Math.max(0, x0); x <= Math.min(COLS - 1, x1); x += 2) {
    px(ctx, x * TILE + 6, cy, TILE - 12, 3, "#c9c39a");
  }
  for (const c of CROSSWALKS) {
    if (c < x0 - 1 || c > x1 + 1) continue;
    for (let row = ROAD_TOP; row < ROAD_TOP + 3; row++) {
      for (let b = 0; b < 3; b++) {
        px(ctx, c * TILE + 5, row * TILE + 3 + b * 10, TILE - 10, 6, "#e8e6d8");
      }
    }
  }
}

export function drawZoneLabels(ctx: CanvasRenderingContext2D, world: World) {
  ctx.font = '800 19px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.textAlign = "center";
  for (const label of world.zoneLabels) {
    ctx.fillText(label.text, r(label.x * TILE), r(label.y * TILE));
  }
  ctx.textAlign = "left";
}

// --- District walls + the two gates -----------------------------------------

function drawWallColumn(ctx: CanvasRenderingContext2D, col: number, y0: number, y1: number) {
  const x = col * TILE;
  for (let y = y0; y <= y1; y++) {
    if (GATE_ROWS.includes(y)) continue;
    const top = y * TILE;
    px(ctx, x, top, TILE, TILE, "#5c5768");
    px(ctx, x, top, TILE, 3, "#6f6a7d");
    px(ctx, x, top + TILE - 3, TILE, 3, "#4b4758");
    px(ctx, x, top + 8, TILE, 2, "#4b4758");
    px(ctx, x, top + 20, TILE, 2, "#4b4758");
    const seam = y % 2 === 0 ? 10 : 22;
    px(ctx, x + seam, top, 2, TILE, "#4b4758");
    if (hash(col, y, 9) > 0.72) px(ctx, x + 6, top + 12, 6, 4, "#514c5e");
  }
}

function drawGateBeam(ctx: CanvasRenderingContext2D, col: number, label: string, golden: boolean) {
  const x = col * TILE + TILE / 2;
  const y = ROAD_TOP * TILE - 18;
  const w = 150;
  px(ctx, x - w / 2 + 4, y + 6, w, 20, "rgba(0,0,0,0.3)");
  px(ctx, x - w / 2, y, w, 20, "#3f3a4e");
  px(ctx, x - w / 2, y, w, 3, golden ? "#e8b23a" : "#7f7a92");
  px(ctx, x - w / 2, y + 17, w, 3, "#2c2839");
  ctx.font = '700 10px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillStyle = golden ? "#ffd977" : "#cfc9e8";
  ctx.textAlign = "center";
  ctx.fillText(label, r(x), r(y + 14));
  ctx.textAlign = "left";
  // Pillars on both sides of the opening.
  for (const side of [-1, 1]) {
    const px_ = x + side * (w / 2 - 6) - 7;
    px(ctx, px_, y + 14, 14, 12, "#4b4758");
    px(ctx, px_, y + 14, 14, 3, golden ? "#e8b23a" : "#6f6a7d");
  }
}

export function drawWalls(ctx: CanvasRenderingContext2D, y0: number, y1: number, t: number, gateOpen: boolean) {
  // The slums and the office district flow into each other — only the golden
  // gate into the rich district still has a wall.
  drawWallColumn(ctx, WALL_B, y0, y1);

  if (y1 >= ROAD_TOP - 1 && y0 <= ROAD_TOP + 3) {
    drawGateBeam(ctx, WALL_B, "RICH DISTRICT", true);

    const bx = WALL_B * TILE;
    const gy = ROAD_TOP * TILE;
    if (!gateOpen) {
      for (let i = 0; i < 8; i++) px(ctx, bx + 3, gy + 3 + i * 12, 26, 6, "#c9a05a");
      px(ctx, bx + 9, gy + 40, 14, 14, "#e8b23a");
      px(ctx, bx + 13, gy + 44, 6, 6, "#6b5a2a");
    } else {
      for (let i = 0; i < 3; i++) px(ctx, bx + 3, gy + 2 + i * 12, 26, 5, "#c9a05a");
      const blink = Math.floor(t * 3) % 2 === 0;
      px(ctx, bx + 9, gy + 44, 14, 6, "#43d17a");
      if (blink) px(ctx, bx + 12, gy + 36, 8, 4, "rgba(232,178,58,0.6)");
    }
  }
}

// --- Buildings ---------------------------------------------------------------

const BUILDING_STYLE: Record<
  Building["style"],
  { wall: string; wall2: string; roof: string; window: string; lit: string }
> = {
  shack: { wall: "#6f5b48", wall2: "#65523f", roof: "#463527", window: "#3a2f24", lit: "#c9a05a" },
  shop: { wall: "#7d6b56", wall2: "#736250", roof: "#4d3f31", window: "#3c332a", lit: "#f0c86a" },
  hub: { wall: "#5a5f70", wall2: "#525768", roof: "#3f4353", window: "#39414f", lit: "#8fd8ea" },
  office: { wall: "#5d6376", wall2: "#545a6c", roof: "#3d4252", window: "#39414f", lit: "#9fe0f2" },
  tower: { wall: "#4b5063", wall2: "#434858", roof: "#343848", window: "#7fd4e8", lit: "#f2d98a" },
  house: { wall: "#8a7a68", wall2: "#7f7060", roof: "#5b4d3f", window: "#3c332a", lit: "#f0c86a" },
  mansion: { wall: "#a2937e", wall2: "#968876", roof: "#6b5b48", window: "#f5e6b8", lit: "#ffe9a8" },
  machine: { wall: "#3a3f52", wall2: "#333849", roof: "#2a2e3d", window: "#8fd8ea", lit: "#8fd8ea" },
  villa: { wall: "#eae5dc", wall2: "#d9d3c8", roof: "#b8563f", window: "#9fd8ea", lit: "#ffe9a8" },
  hotel: { wall: "#ddd3c4", wall2: "#c9bfad", roof: "#5b4d3f", window: "#bfe9f7", lit: "#ffe9a8" },
  restaurant: { wall: "#6b5b4a", wall2: "#5e5040", roof: "#3f3a33", window: "#f5e6b8", lit: "#ffd977" },
  mall: { wall: "#cfc9e8", wall2: "#bdb6dc", roof: "#8f86b8", window: "#bfe9f7", lit: "#ffe9a8" },
  salon: { wall: "#f0c9d8", wall2: "#e0b0c4", roof: "#b8563f", window: "#ffe9f2", lit: "#ffd977" },
  garage: { wall: "#8f96a8", wall2: "#7c8496", roof: "#4a505f", window: "#bfe9f7", lit: "#ffd977" },
  apartment: { wall: "#c9a58a", wall2: "#b8917a", roof: "#7a5340", window: "#bfe9f7", lit: "#ffe9a8" },
  shack2: { wall: "#6f6357", wall2: "#5f5449", roof: "#4a4238", window: "#c9a86a", lit: "#ffd977" },
};


// --- Shop interiors: real storefronts, seen through the glass -----------------

type BuildingStyle = { wall: string; wall2: string; roof: string; window: string; lit: string };
type InteriorFn = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, streetNorth: boolean) => void;

/** Shared geometry: where the floor sits and where the storefront glass goes. */
function interiorFrame(x: number, y: number, w: number, h: number, streetNorth: boolean, glassH = 13) {
  const top = y + 4;
  const bottom = y + h - 4;
  const floorTop = streetNorth ? top + glassH : top;
  const floorBottom = streetNorth ? bottom : bottom - glassH;
  return { fx: x + 5, fw: w - 10, floorTop, floorBottom, glassY: streetNorth ? top : bottom - glassH, glassH };
}

function drawGlass(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number) {
  ctx.globalAlpha = 0.2;
  px(ctx, x, y, w, h, "#bfe9f7");
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.beginPath();
  ctx.rect(r(x), r(y), r(w), r(h));
  ctx.clip();
  const sweep = ((t * 26) % (w + 140)) - 70;
  ctx.globalAlpha = 0.16;
  px(ctx, x + sweep, y - 8, 30, h + 16, "#ffffff");
  ctx.globalAlpha = 1;
  ctx.restore();
  for (let i = 0; i <= w; i += 28) px(ctx, x + i, y, 2, h, "#5c5868");
  px(ctx, x, y, w, 2, "#7d7a8c");
  px(ctx, x, y + h - 2, w, 2, "#3a3746");
}

function lightPool(ctx: CanvasRenderingContext2D, cx: number, cy: number, rad: number, alpha: number, color = "255,244,214") {
  const glow = ctx.createRadialGradient(r(cx), r(cy), 3, r(cx), r(cy), r(rad));
  glow.addColorStop(0, `rgba(${color},${alpha})`);
  glow.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(r(cx - rad), r(cy - rad), r(rad * 2), r(rad * 2));
}

/** Car showroom: polished floor, spotlights, hero car on a turntable, bikes. */
function showroomInterior(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, streetNorth: boolean) {
  const f = interiorFrame(x, y, w, h, streetNorth);
  const fh = f.floorBottom - f.floorTop;
  px(ctx, f.fx, f.floorTop, f.fw, fh, "#4b4b5a");
  for (let gx = f.fx; gx < f.fx + f.fw; gx += 20) px(ctx, gx, f.floorTop, 1, fh, "#54546a");
  for (let gy = f.floorTop; gy < f.floorBottom; gy += 20) px(ctx, f.fx, gy, f.fw, 1, "#54546a");
  for (const p of [0.18, 0.5, 0.82]) lightPool(ctx, f.fx + f.fw * p, f.floorTop + fh * 0.5, 72, 0.2);
  // Hero car on a turntable.
  const tx = f.fx + f.fw * 0.5;
  const ty = f.floorTop + fh * 0.32;
  px(ctx, tx - 32, ty - 24, 64, 48, "#3a3a48");
  ctx.strokeStyle = "#e8b23a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(r(tx), r(ty), r(24), 0, Math.PI * 2);
  ctx.stroke();
  drawVehicle(ctx, "car", tx, ty, "up", t, { style: VEHICLE_COLORS.crimson, scale: 0.6 });
  const spin = t * 1.1;
  ctx.globalAlpha = 0.55;
  px(ctx, tx + Math.cos(spin) * 19 - 3, ty + Math.sin(spin) * 19 - 3, 6, 6, "#ffd977");
  ctx.globalAlpha = 1;
  // Two cars on the floor, both nose-out toward the street.
  const carY = f.floorTop + fh * 0.74;
  drawVehicle(ctx, "car", f.fx + f.fw * 0.19, carY, "up", t, { style: VEHICLE_COLORS.blue, scale: 0.82 });
  drawVehicle(ctx, "car", f.fx + f.fw * 0.81, carY, "up", t, { style: VEHICLE_COLORS.white, scale: 0.82 });
  // Two bikes between them.
  const bikeY = f.floorTop + fh * 0.92;
  drawVehicle(ctx, "bike", f.fx + f.fw * 0.42, bikeY, "up", t, { style: VEHICLE_COLORS.teal, scale: 0.95 });
  drawVehicle(ctx, "bike", f.fx + f.fw * 0.58, bikeY, "up", t, { style: VEHICLE_COLORS.gold, scale: 0.95 });
  // Price cards + a desk with a plant.
  for (const px0 of [0.19, 0.81]) {
    const cx0 = f.fx + f.fw * px0;
    px(ctx, cx0 - 9, carY - 26, 18, 12, "#f2f0fa");
    px(ctx, cx0 - 7, carY - 23, 14, 2, "#8f88b5");
    px(ctx, cx0 - 7, carY - 19, 9, 2, "#8f88b5");
  }
  px(ctx, f.fx + 2, f.floorTop + 2, 26, 14, "#3f3f4d");
  px(ctx, f.fx + 6, f.floorTop + 4, 8, 8, "#5f5f70");
  px(ctx, f.fx + f.fw - 30, f.floorTop + 2, 26, 14, "#3f3f4d");
  px(ctx, f.fx + f.fw - 22, f.floorTop - 4, 10, 8, "#3f9d6b");
  // A salesperson working the floor and a customer sizing up the hero car.
  person(ctx, f.fx + f.fw * 0.62, carY + 26, "up", t, "#2b2b36", { outfit2: "#ffd977" });
  person(ctx, f.fx + f.fw * 0.36, ty + 30, "up", t, "#e8e0d0", { outfit2: "#c94f4f" });
  drawGlass(ctx, x, f.glassY, w, f.glassH, t);
}

/** Electronics store: TV wall, shelves of gadgets, laptop table, LED strip. */
function electronicsInterior(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, streetNorth: boolean) {
  const f = interiorFrame(x, y, w, h, streetNorth);
  const fh = f.floorBottom - f.floorTop;
  px(ctx, f.fx, f.floorTop, f.fw, fh, "#2f2f3a");
  for (let gy = f.floorTop; gy < f.floorBottom; gy += 18) px(ctx, f.fx, gy, f.fw, 1, "#383846");
  // TV wall showing colour bars.
  for (let k = 0; k < 3; k++) {
    const tvx = f.fx + 8 + k * ((f.fw - 16) / 3);
    const tvw = (f.fw - 16) / 3 - 8;
    px(ctx, tvx, f.floorTop + 6, tvw, 26, "#1c1c26");
    const bars = ["#ff5a7a", "#ffc53d", "#43d17a", "#7fe8ff"];
    for (let b = 0; b < 4; b++) {
      const c = bars[(b + Math.floor(t * 0.9 + k)) % bars.length];
      px(ctx, tvx + 3, f.floorTop + 9 + b * 5, tvw - 6, 4, c);
    }
    px(ctx, tvx + tvw / 2 - 4, f.floorTop + 33, 8, 2, "#3a3a48");
  }
  // Gadget shelf.
  const shelfY = f.floorTop + fh * 0.55;
  px(ctx, f.fx + 6, shelfY, f.fw - 12, 5, "#3f3f4d");
  for (let i = 0; i < 8; i++) {
    const gx = f.fx + 14 + i * ((f.fw - 30) / 8);
    const glow = Math.sin(t * 2 + i) > -0.3;
    px(ctx, gx, shelfY - 11, 9, 11, "#22222c");
    px(ctx, gx + 1, shelfY - 10, 7, 8, glow ? "#7fe8ff" : "#2a5f6b");
  }
  // Laptop table.
  const tableY = f.floorTop + fh * 0.82;
  px(ctx, f.fx + f.fw * 0.5 - 44, tableY, 88, 22, "#3a3a48");
  for (const off of [-26, 4]) {
    px(ctx, f.fx + f.fw * 0.5 + off, tableY + 3, 22, 10, "#1c1c26");
    px(ctx, f.fx + f.fw * 0.5 + off + 2, tableY + 5, 18, 6, "#9fe0f2");
  }
  px(ctx, f.fx + 6, tableY + 6, 20, 12, "#3f3f4d");
  px(ctx, f.fx + 9, tableY + 8, 14, 8, "#43d17a");
  // Customers trying the gadgets.
  person(ctx, f.fx + f.fw * 0.42, shelfY + 22, "up", t, "#3f6fd6");
  person(ctx, f.fx + f.fw * 0.72, tableY + 30, "up", t, "#c94f4f");
  drawGlass(ctx, x, f.glassY, w, f.glassH, t);
}

/** Clothing store: racks of garments, mannequins, mirror, checkout counter. */
function clothingInterior(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, streetNorth: boolean) {
  const f = interiorFrame(x, y, w, h, streetNorth);
  const fh = f.floorBottom - f.floorTop;
  px(ctx, f.fx, f.floorTop, f.fw, fh, "#6b503a");
  for (let gy = f.floorTop; gy < f.floorBottom; gy += 12) px(ctx, f.fx, gy, f.fw, 1, "#5d4531");
  const colors = ["#c94f4f", "#3f6fd6", "#43d17a", "#e0b84a", "#b78aff", "#ff8ab8"];
  // Two clothing racks near the glass.
  for (const rx0 of [0.28, 0.72]) {
    const rx = f.fx + f.fw * rx0;
    const sway = Math.sin(t * 1.6 + rx0 * 6) * 1.2;
    px(ctx, rx - 26, f.floorTop + 12, 52, 3, "#8a8a96");
    for (let i = 0; i < 6; i++) {
      const gx = rx - 24 + i * 9;
      px(ctx, gx, f.floorTop + 15, 7, 16 + (i % 2) * 2, colors[(i + Math.round(rx0 * 4)) % colors.length]);
      px(ctx, gx, f.floorTop + 15 + sway, 7, 2, "rgba(255,255,255,0.25)");
    }
  }
  // Mannequins.
  for (const [mx0, mc] of [[0.14, "#3f6fd6"], [0.86, "#c94f4f"]] as [number, string][]) {
    const mx = f.fx + f.fw * mx0;
    const my = f.floorTop + fh * 0.66;
    px(ctx, mx - 5, my - 22, 10, 12, mc);
    px(ctx, mx - 3, my - 10, 6, 10, "#d8d8e0");
    px(ctx, mx - 4, my, 8, 3, "#3a3a48");
  }
  // Mirror + counter with a till.
  const my2 = f.floorTop + fh * 0.82;
  px(ctx, f.fx + f.fw * 0.5 - 20, my2, 40, 16, "#3f3f4d");
  px(ctx, f.fx + f.fw * 0.5 - 14, my2 + 3, 28, 8, "#8fe8b0");
  px(ctx, f.fx + f.fw * 0.5 + 34, my2 - 4, 22, 22, "#cfd8e8");
  px(ctx, f.fx + f.fw * 0.5 + 36, my2 - 2, 6, 18, "rgba(255,255,255,0.5)");
  px(ctx, f.fx + f.fw * 0.5 + 52, my2 + 4, 14, 12, "#3a3a48");
  // Shoppers browsing the racks.
  clothingShoppers(ctx, f, t);
  drawGlass(ctx, x, f.glassY, w, f.glassH, t);
}

/** Food stall: open counter, trays, steam and a cook working the pass. */
function foodStallInterior(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, streetNorth: boolean) {
  const f = interiorFrame(x, y, w, h, streetNorth, 6);
  const fh = f.floorBottom - f.floorTop;
  // Chequered floor.
  for (let gy = f.floorTop, j = 0; gy < f.floorBottom; gy += 16, j++) {
    for (let gx = f.fx, i = 0; gx < f.fx + f.fw; gx += 16, i++) {
      px(ctx, gx, gy, 16, 16, (i + j) % 2 === 0 ? "#5c4a3a" : "#6b5544");
    }
  }
  // Menu board on the back wall.
  px(ctx, f.fx + 8, f.floorTop + 4, 44, 22, "#2a2438");
  for (let i = 0; i < 4; i++) px(ctx, f.fx + 12, f.floorTop + 8 + i * 5, 36 - i * 5, 2, "#cfc9e8");
  // Counter along the street side.
  const counterY = streetNorth ? f.floorTop + 4 : f.floorBottom - 20;
  px(ctx, f.fx, counterY, f.fw, 18, "#8a6a4a");
  px(ctx, f.fx, counterY, f.fw, 4, "#a8835c");
  const foods = ["#e0b84a", "#c94f4f", "#43d17a"];
  for (let i = 0; i < 4; i++) {
    const tx = f.fx + 12 + i * ((f.fw - 24) / 4);
    px(ctx, tx, counterY + 5, 24, 9, "#3a3a48");
    px(ctx, tx + 2, counterY + 6, 20, 7, foods[i % foods.length]);
    // Steam.
    const puff = (t * 18 + i * 9) % 22;
    ctx.globalAlpha = Math.max(0, 0.35 - puff / 60);
    px(ctx, tx + 9, counterY - 4 - puff, 6, 6, "#f2f0fa");
    ctx.globalAlpha = 1;
  }
  // Cook behind the pass.
  const cookX = f.fx + f.fw * 0.32;
  const cookY = streetNorth ? counterY + 34 : counterY - 18;
  drawMouseSprite(ctx, cookX, cookY, "down", 0, { fur: "#c4b09a", furD: "#a89478", outfit: "#f2f0fa", outfit2: "#e8e0d0", scale: 0.9 }, t);
  px(ctx, cookX - 7, cookY - 26, 14, 6, "#f2f0fa");
  px(ctx, cookX - 5, cookY - 30, 10, 5, "#f2f0fa");
  const stir = Math.sin(t * 3) * 3;
  px(ctx, cookX + 10 + stir, cookY - 18, 3, 10, "#8a8a96");
  // Two regulars eating at the counter.
  const seatY = streetNorth ? counterY + 26 : counterY - 12;
  person(ctx, f.fx + f.fw * 0.62, seatY, streetNorth ? "up" : "down", t, "#c94f4f", { scale: 0.92 });
  person(ctx, f.fx + f.fw * 0.82, seatY, streetNorth ? "up" : "down", t, "#3f6fd6", { scale: 0.92 });
  drawGlass(ctx, x, f.glassY, w, f.glassH, t);
}

/** Delivery hub: conveyor with moving parcels, crates, lockers, a scooter. */
function deliveryHubInterior(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, streetNorth: boolean) {
  const f = interiorFrame(x, y, w, h, streetNorth);
  const fh = f.floorBottom - f.floorTop;
  px(ctx, f.fx, f.floorTop, f.fw, fh, "#4a4a56");
  for (let gy = f.floorTop; gy < f.floorBottom; gy += 22) px(ctx, f.fx, gy, f.fw, 2, "#5c5c68");
  // Conveyor belt with parcels.
  const beltY = f.floorTop + fh * 0.5;
  px(ctx, f.fx + 6, beltY, f.fw - 12, 16, "#3a3a48");
  for (let i = 0; i < 8; i++) px(ctx, f.fx + 8 + i * ((f.fw - 20) / 8), beltY + 3, 8, 10, "#5f5f70");
  for (let k = 0; k < 3; k++) {
    const bx = f.fx + 10 + ((t * 26 + k * ((f.fw - 30) / 3)) % (f.fw - 30));
    px(ctx, bx, beltY - 10, 16, 12, "#b98f5a");
    px(ctx, bx + 1, beltY - 9, 14, 3, "#d8b07a");
  }
  // Crate stack + lockers + whiteboard.
  for (let i = 0; i < 3; i++) px(ctx, f.fx + 6 + i * 2, f.floorTop + 8 + i * 6, 22, 10, i % 2 ? "#a8835c" : "#c9a06a");
  for (let i = 0; i < 3; i++) px(ctx, f.fx + f.fw - 34 + i * 10, f.floorTop + 6, 8, 26, "#5a5f70");
  px(ctx, f.fx + f.fw * 0.5 - 22, f.floorTop + 6, 44, 24, "#eef2f8");
  px(ctx, f.fx + f.fw * 0.5 - 18, f.floorTop + 10, 36, 2, "#8f88b5");
  px(ctx, f.fx + f.fw * 0.5 - 18, f.floorTop + 15, 26, 2, "#8f88b5");
  px(ctx, f.fx + f.fw * 0.5 - 18, f.floorTop + 20, 30, 2, "#8f88b5");
  // Scooter waiting for its rider.
  drawVehicle(ctx, "bike", f.fx + f.fw * 0.8, f.floorTop + fh * 0.86, "down", t, { style: VEHICLE_COLORS.teal, scale: 1 });
  drawGlass(ctx, x, f.glassY, w, f.glassH, t);
}


/** Helper: a mouse drawn inside a shop (customers, staff). */
function person(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: Dir,
  t: number,
  outfit: string,
  extra: Partial<MousePalette> = {},
  scale = 0.95
) {
  drawMouseSprite(ctx, x, y, dir, 0, { ...BASE_MOUSE, outfit, scale, ...extra }, t);
}

/** Villa entrance hall: marble floor, chandelier, desk and a receptionist. */
function villaInterior(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, streetNorth: boolean) {
  const f = interiorFrame(x, y, w, h, streetNorth);
  const fh = f.floorBottom - f.floorTop;
  px(ctx, f.fx, f.floorTop, f.fw, fh, "#e8e2d6");
  for (let gx = f.fx, i = 0; gx < f.fx + f.fw; gx += 16, i++) {
    for (let gy = f.floorTop, j = 0; gy < f.floorBottom; gy += 16, j++) {
      if ((i + j) % 2 === 0) px(ctx, gx, gy, 16, 16, "#ded7c9");
    }
  }
  // Rug + console table.
  px(ctx, f.fx + f.fw * 0.5 - 34, f.floorTop + fh * 0.62, 68, 22, "#8f3f4f");
  px(ctx, f.fx + f.fw * 0.5 - 30, f.floorTop + fh * 0.62 + 3, 60, 16, "#a8546a");
  px(ctx, f.fx + 6, f.floorTop + 4, 34, 12, "#5b4d3f");
  px(ctx, f.fx + 10, f.floorTop - 2, 10, 8, "#8fe8b0");
  // Reception desk with a receptionist behind it.
  const deskY = f.floorTop + fh * 0.3;
  const deskX = f.fx + f.fw * 0.5;
  px(ctx, deskX - 30, deskY, 60, 18, "#3f3a33");
  px(ctx, deskX - 28, deskY + 2, 56, 5, "#8a6a4a");
  px(ctx, deskX - 24, deskY + 8, 14, 8, "#eef2f8");
  px(ctx, deskX + 12, deskY - 6, 8, 6, "#7fe8ff");
  person(ctx, deskX - 6, deskY - 2, "down", t, "#7a1f2f", { outfit2: "#ffd977", hat: "cap", hatColor: "#5f1622" });
  // Chandelier + plants.
  lightPool(ctx, deskX, deskY + 6, 56, 0.18);
  px(ctx, deskX - 10, f.floorTop + 2, 20, 4, "#ffd977");
  px(ctx, deskX - 2, f.floorTop + 6, 4, 6, "#c9a02a");
  px(ctx, f.fx + f.fw - 20, f.floorTop + 4, 12, 14, "#3f9d6b");
  px(ctx, f.fx + f.fw - 18, f.floorTop + 18, 8, 8, "#8a6a4a");
  drawGlass(ctx, x, f.glassY, w, f.glassH, t);
}

/** Hotel lobby: marble inlay, long desk, luggage and a grand piano. */
function hotelInterior(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, streetNorth: boolean) {
  const f = interiorFrame(x, y, w, h, streetNorth, 15);
  const fh = f.floorBottom - f.floorTop;
  px(ctx, f.fx, f.floorTop, f.fw, fh, "#e6e0d4");
  for (let gy = f.floorTop; gy < f.floorBottom; gy += 18) px(ctx, f.fx, gy, f.fw, 1, "#d8d0c0");
  // Circular marble inlay.
  ctx.strokeStyle = "#c9a02a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(r(f.fx + f.fw * 0.5), r(f.floorTop + fh * 0.62), r(26), 0, Math.PI * 2);
  ctx.stroke();
  px(ctx, f.fx + f.fw * 0.5 - 14, f.floorTop + fh * 0.62 - 8, 28, 16, "#d8d0c0");
  // Reception desk with two staff and a monitor bank.
  const deskX = f.fx + f.fw * 0.34;
  const deskY = f.floorTop + fh * 0.3;
  px(ctx, deskX - 34, deskY, 68, 20, "#4a3f31");
  px(ctx, deskX - 32, deskY + 2, 64, 6, "#8a6a4a");
  for (let i = 0; i < 3; i++) px(ctx, deskX - 26 + i * 20, deskY + 9, 12, 8, "#7fe8ff");
  person(ctx, deskX - 16, deskY - 2, "down", t, "#7a1f2f", { outfit2: "#ffd977", hat: "cap", hatColor: "#5f1622" });
  person(ctx, deskX + 12, deskY - 2, "down", t, "#7a1f2f", { outfit2: "#ffd977", hat: "cap", hatColor: "#5f1622" });
  lightPool(ctx, deskX, deskY + 8, 70, 0.16);
  // Grand piano + luggage trolley.
  const pianoX = f.fx + f.fw * 0.76;
  px(ctx, pianoX - 18, f.floorTop + fh * 0.5, 36, 22, "#2b2b36");
  px(ctx, pianoX - 14, f.floorTop + fh * 0.5 + 4, 28, 10, "#f2f0fa");
  for (let i = 0; i < 6; i++) px(ctx, pianoX - 12 + i * 4, f.floorTop + fh * 0.5 + 15, 3, 5, "#e8e0d0");
  px(ctx, f.fx + 10, f.floorTop + fh * 0.72, 26, 14, "#8a6a4a");
  px(ctx, f.fx + 12, f.floorTop + fh * 0.72 - 8, 20, 9, "#4a3f31");
  px(ctx, f.fx + 16, f.floorTop + fh * 0.72 + 14, 4, 6, "#3a3a48");
  px(ctx, f.fx + 28, f.floorTop + fh * 0.72 + 14, 4, 6, "#3a3a48");
  // Chandeliers.
  for (const px0 of [0.3, 0.7]) {
    const cx0 = f.fx + f.fw * px0;
    px(ctx, cx0 - 12, f.floorTop + 1, 24, 4, "#ffd977");
    px(ctx, cx0 - 2, f.floorTop + 5, 4, 7, "#c9a02a");
    lightPool(ctx, cx0, f.floorTop + 14, 46, 0.16);
  }
  drawGlass(ctx, x, f.glassY, w, f.glassH, t);
}

/** Five-star restaurant: laid tables, diners, candles and a bar. */
function restaurantInterior(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, streetNorth: boolean) {
  const f = interiorFrame(x, y, w, h, streetNorth);
  const fh = f.floorBottom - f.floorTop;
  px(ctx, f.fx, f.floorTop, f.fw, fh, "#5c4632");
  for (let gy = f.floorTop; gy < f.floorBottom; gy += 10) px(ctx, f.fx, gy, f.fw, 1, "#513c2b");
  // Bar with bottles along the back wall.
  px(ctx, f.fx + 4, f.floorTop + 2, 62, 16, "#3f3a33");
  for (let i = 0; i < 7; i++) {
    px(ctx, f.fx + 8 + i * 8, f.floorTop + 4, 5, 12, ["#43d17a", "#c94f4f", "#ffd977", "#7fe8ff"][i % 4]);
  }
  px(ctx, f.fx + 4, f.floorTop + 18, 62, 4, "#8a6a4a");
  person(ctx, f.fx + 20, f.floorTop + 32, "up", t, "#2b2b36", { outfit2: "#ffd977" });
  // Tables with white cloths, candles and diners.
  const tables: [number, number][] = [
    [0.3, 0.55],
    [0.62, 0.5],
    [0.82, 0.72],
    [0.4, 0.8],
  ];
  for (const [tx0, ty0] of tables) {
    const tx = f.fx + f.fw * tx0;
    const ty = f.floorTop + fh * ty0;
    px(ctx, tx - 15, ty - 10, 30, 20, "#f2f0fa");
    px(ctx, tx - 13, ty - 8, 26, 16, "#e8e0d0");
    px(ctx, tx - 3, ty - 4, 6, 6, "#ffd977");
    const flicker = 0.5 + 0.5 * Math.abs(Math.sin(t * 3 + tx));
    ctx.globalAlpha = 0.5 * flicker;
    px(ctx, tx - 1, ty - 8, 3, 4, "#fff3c4");
    ctx.globalAlpha = 1;
    px(ctx, tx - 11, ty - 6, 4, 3, "#cfc9e8");
    px(ctx, tx + 7, ty - 6, 4, 3, "#cfc9e8");
    // Two diners per table, sitting opposite each other.
    person(ctx, tx - 4, ty - 12, "down", t, "#3f3a33", { outfit2: "#ffd977", scale: 0.86 });
    person(ctx, tx + 6, ty + 16, "up", t, "#7a1f2f", { outfit2: "#ffd977", scale: 0.86 });
  }
  // Waiter walking the floor with a tray.
  const walk = Math.sin(t * 0.8) * 18;
  const wx = f.fx + f.fw * 0.5 + walk;
  const wy = f.floorTop + fh * 0.68;
  person(ctx, wx, wy, walk > 0 ? "right" : "left", t, "#2b2b36", { outfit2: "#ffd977" });
  px(ctx, wx + 6, wy - 26, 16, 3, "#cfc9e8");
  px(ctx, wx + 10, wy - 24, 6, 4, "#e8b23a");
  drawGlass(ctx, x, f.glassY, w, f.glassH, t);
}

/** Shoppers browsing the clothing store, drawn behind the glass. */
function clothingShoppers(ctx: CanvasRenderingContext2D, f: ReturnType<typeof interiorFrame>, t: number) {
  person(ctx, f.fx + f.fw * 0.34, f.floorTop + (f.floorBottom - f.floorTop) * 0.52, "down", t, "#3f6fd6");
  person(ctx, f.fx + f.fw * 0.66, f.floorTop + (f.floorBottom - f.floorTop) * 0.58, "down", t, "#c94f4f");
  person(ctx, f.fx + f.fw * 0.5, f.floorTop + (f.floorBottom - f.floorTop) * 0.86, "up", t, "#3f9d6b", { scale: 0.9 });
}


/** Squeek Mall: glass atrium, escalator, kiosks and shoppers. */
function mallInterior(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, streetNorth: boolean) {
  const f = interiorFrame(x, y, w, h, streetNorth, 18);
  const fh = f.floorBottom - f.floorTop;
  px(ctx, f.fx, f.floorTop, f.fw, fh, "#e9e5f2");
  for (let gy = f.floorTop; gy < f.floorBottom; gy += 22) px(ctx, f.fx, gy, f.fw, 1, "#d8d3e6");
  // Back wall shop fronts with lit signs.
  for (let i = 0; i < 4; i++) {
    const sx = f.fx + 8 + i * ((f.fw - 24) / 4);
    px(ctx, sx, f.floorTop + 2, (f.fw - 32) / 4, 26, "#2b2b36");
    px(ctx, sx + 2, f.floorTop + 6, (f.fw - 32) / 4 - 4, 14, i % 2 ? "#ffd977" : "#7fe8ff");
    px(ctx, sx + 2, f.floorTop + 22, (f.fw - 32) / 4 - 4, 3, "#4a4460");
  }
  // Escalator climbing to the upper floor.
  const ex = f.fx + f.fw * 0.62;
  const ey = f.floorTop + fh * 0.42;
  ctx.save();
  ctx.translate(r(ex), r(ey));
  ctx.rotate(-0.5);
  px(ctx, 0, 0, 92, 12, "#b9b3cc");
  px(ctx, 0, -6, 92, 4, "#8f88a8");
  const off = (t * 26) % 10;
  for (let i = -1; i < 11; i++) px(ctx, i * 10 - off, 2, 8, 4, "#d8d3e6");
  ctx.restore();
  px(ctx, ex + 34, ey - 52, 10, 54, "#c4bfd6");
  // Fountain + planters in the middle of the floor.
  const fx2 = f.fx + f.fw * 0.24;
  const fy2 = f.floorTop + fh * 0.62;
  px(ctx, fx2 - 24, fy2, 48, 16, "#b9b3cc");
  px(ctx, fx2 - 20, fy2 + 2, 40, 10, "#7fd8ea");
  px(ctx, fx2 - 3, fy2 - 14, 6, 16, "#d8d3e6");
  const jet = 6 + Math.abs(Math.sin(t * 2)) * 8;
  px(ctx, fx2 - 2, fy2 - 14 - jet, 4, jet, "#bfeef7");
  for (const [px3, py3] of [[f.fx + 10, f.floorTop + fh * 0.5], [f.fx + f.fw - 16, f.floorTop + fh * 0.34]]) {
    px(ctx, px3, py3, 12, 14, "#3f9d6b");
    px(ctx, px3 + 2, py3 + 14, 8, 8, "#8a6a4a");
  }
  // Kiosks and shoppers.
  for (const [kx, ky] of [[0.14, 0.32], [0.44, 0.28], [0.86, 0.6]]) {
    const kx2 = f.fx + f.fw * kx;
    const ky2 = f.floorTop + fh * ky;
    px(ctx, kx2 - 16, ky2, 32, 14, "#8a6a4a");
    for (let i = 0; i < 4; i++) px(ctx, kx2 - 13 + i * 7, ky2 - 5, 5, 5, ["#c94f4f", "#43d17a", "#ffd977", "#7fe8ff"][i]);
  }
  person(ctx, f.fx + f.fw * 0.34, f.floorTop + fh * 0.78, "up", t, "#3f6fd6");
  person(ctx, f.fx + f.fw * 0.55, f.floorTop + fh * 0.86, "left", t, "#c94f4f");
  person(ctx, f.fx + f.fw * 0.78, f.floorTop + fh * 0.3, "down", t, "#3f9d6b");
  drawGlass(ctx, x, f.glassY, w, f.glassH, t);
}

/** Clip & Squeak Salon: mirrors, chairs, dryers and a queue. */
function salonInterior(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, streetNorth: boolean) {
  const f = interiorFrame(x, y, w, h, streetNorth);
  const fh = f.floorBottom - f.floorTop;
  px(ctx, f.fx, f.floorTop, f.fw, fh, "#f4e2ea");
  for (let gy = f.floorTop; gy < f.floorBottom; gy += 12) px(ctx, f.fx, gy, f.fw, 1, "#e8cfdb");
  // Mirror wall with a strip light, two chairs in front of it.
  for (let i = 0; i < 2; i++) {
    const mx = f.fx + 10 + i * ((f.fw - 30) / 2);
    px(ctx, mx, f.floorTop + 4, 28, 24, "#b9c6d8");
    px(ctx, mx + 2, f.floorTop + 6, 24, 20, "#d6e2ee");
    px(ctx, mx + 6, f.floorTop + 10, 8, 12, "#8a94a8");
    px(ctx, mx + 4, f.floorTop, 20, 3, "#fff6d0");
    // Chair + customer + stylist.
    const cx2 = mx + 14;
    const cy2 = f.floorTop + 40;
    px(ctx, cx2 - 8, cy2, 16, 12, "#2b2b36");
    px(ctx, cx2 - 6, cy2 - 8, 12, 10, "#3f3f4d");
    person(ctx, cx2, cy2 - 4, "up", t, i === 0 ? "#c94f4f" : "#7fb2ff", { scale: 0.9 });
    const snip = Math.sin(t * 5 + i) * 2;
    person(ctx, cx2 + 18, cy2 - 2, "left", t, "#2b2b36", { outfit2: "#ffd977" });
    px(ctx, cx2 + 10 + snip, cy2 - 22, 8, 3, "#d8d3e6");
    px(ctx, cx2 + 10 + snip, cy2 - 18, 8, 3, "#d8d3e6");
  }
  // Dryer hoods along the wall + a waiting bench.
  for (let i = 0; i < 2; i++) px(ctx, f.fx + f.fw - 40 + i * 20, f.floorTop + 8, 16, 14, "#c9a5b8");
  px(ctx, f.fx + f.fw - 46, f.floorTop + fh * 0.66, 40, 12, "#8a6a4a");
  person(ctx, f.fx + f.fw - 30, f.floorTop + fh * 0.66 - 4, "up", t, "#3f9d6b", { scale: 0.88 });
  person(ctx, f.fx + f.fw - 16, f.floorTop + fh * 0.66 - 4, "up", t, "#e8b23a", { scale: 0.88 });
  px(ctx, f.fx + 6, f.floorTop + fh * 0.8, 20, 16, "#43d17a");
  px(ctx, f.fx + 8, f.floorTop + fh * 0.8 + 16, 14, 10, "#8a6a4a");
  drawGlass(ctx, x, f.glassY, w, f.glassH, t);
}

/** Grease & Sons Garage: a car on the lift, tools and a mechanic. */
function garageInterior(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, streetNorth: boolean) {
  const f = interiorFrame(x, y, w, h, streetNorth);
  const fh = f.floorBottom - f.floorTop;
  px(ctx, f.fx, f.floorTop, f.fw, fh, "#6b6f7c");
  for (let i = 0; i < 5; i++) px(ctx, f.fx + 6 + i * 26, f.floorTop + 4, 18, 2, "#5d616e");
  // Tool wall.
  px(ctx, f.fx + 4, f.floorTop + 2, f.fw - 8, 16, "#3f4450");
  for (let i = 0; i < 8; i++) px(ctx, f.fx + 10 + i * 12, f.floorTop + 5, 6, 10, ["#c9a02a", "#8a8a96", "#c94f4f", "#7fe8ff"][i % 4]);
  // Car up on the two-post lift.
  const cx3 = f.fx + f.fw * 0.5;
  const liftY = f.floorTop + fh * 0.42;
  px(ctx, cx3 - 40, liftY + 20, 80, 5, "#3a3f52");
  px(ctx, cx3 - 44, f.floorTop + 20, 6, fh * 0.5, "#8a8a96");
  px(ctx, cx3 + 38, f.floorTop + 20, 6, fh * 0.5, "#8a8a96");
  drawVehicle(ctx, "car", cx3, liftY + 8, "right", t, { style: VEHICLE_COLORS.blue, brake: true });
  // Mechanic underneath with a wrench.
  person(ctx, cx3 - 22, liftY + 34, "right", t, "#2f5f8f", { outfit2: "#e8e0d0" });
  px(ctx, cx3 - 12 + Math.sin(t * 4) * 3, liftY + 26, 10, 3, "#c9a02a");
  // Tires, oil drum and a tool chest.
  for (let i = 0; i < 3; i++) px(ctx, f.fx + 8, f.floorTop + fh * 0.7 + i * 9, 14, 8, "#2b2b36");
  px(ctx, f.fx + f.fw - 22, f.floorTop + fh * 0.66, 14, 20, "#c94f4f");
  px(ctx, f.fx + f.fw - 22, f.floorTop + fh * 0.66 + 6, 14, 3, "#f2f0fa");
  px(ctx, f.fx + f.fw - 44, f.floorTop + fh * 0.78, 18, 12, "#e8b23a");
  drawGlass(ctx, x, f.glassY, w, f.glassH, t);
}

/** Mid-tier apartment lobby: mailboxes, a lift and a resident. */
function apartmentInterior(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number, streetNorth: boolean) {
  const f = interiorFrame(x, y, w, h, streetNorth, 14);
  const fh = f.floorBottom - f.floorTop;
  px(ctx, f.fx, f.floorTop, f.fw, fh, "#cbbfae");
  for (let gy = f.floorTop; gy < f.floorBottom; gy += 14) px(ctx, f.fx, gy, f.fw, 1, "#bcaf9c");
  // Mailboxes.
  px(ctx, f.fx + 4, f.floorTop + 4, 46, 22, "#7c8496");
  for (let i = 0; i < 8; i++) px(ctx, f.fx + 7 + (i % 4) * 11, f.floorTop + 6 + Math.floor(i / 4) * 10, 9, 8, "#9aa2b2");
  // Lift with a floor indicator.
  const lx = f.fx + f.fw - 40;
  px(ctx, lx, f.floorTop + 2, 34, fh * 0.6, "#8a94a8");
  px(ctx, lx + 3, f.floorTop + 5, 28, fh * 0.6 - 6, "#b9c6d8");
  px(ctx, lx + 3, f.floorTop + 5, 28, 3, "#5d616e");
  const floorNo = 1 + (Math.floor(t / 3) % 6);
  px(ctx, lx + 12, f.floorTop - 6, 12, 8, "#2b2b36");
  px(ctx, lx + 15, f.floorTop - 4, 6, 4, floorNo > 3 ? "#ffd977" : "#7fe8ff");
  px(ctx, lx + 14, f.floorTop + fh * 0.3, 8, 3, "#5d616e");
  // Resident checking mail + a bike against the wall.
  person(ctx, f.fx + 26, f.floorTop + fh * 0.62, "up", t, "#7fb2ff");
  // Parcels waiting for the residents.
  px(ctx, f.fx + f.fw * 0.4, f.floorTop + fh * 0.76, 15, 11, "#c9741f");
  px(ctx, f.fx + f.fw * 0.4 + 2, f.floorTop + fh * 0.76 + 2, 11, 2, "#f2f0fa");
  px(ctx, f.fx + f.fw * 0.44, f.floorTop + fh * 0.68, 11, 9, "#e8b23a");
  px(ctx, f.fx + 6, f.floorTop + fh * 0.72, 18, 16, "#43d17a");
  px(ctx, f.fx + 8, f.floorTop + fh * 0.72 + 16, 12, 8, "#8a6a4a");
  drawGlass(ctx, x, f.glassY, w, f.glassH, t);
}

/** Furniture the player owns — the flat is drawn from this list. */
let HOME_FURNITURE: string[] = [];
export function setHomeFurniture(list: string[]) {
  HOME_FURNITURE = list;
}

/** Your flat, seen through the glass: everything you have bought, in place. */
function homeInterior(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, t: number) {
  const f = interiorFrame(x, y, w, h, false, 22);
  const has = (id: string) => HOME_FURNITURE.includes(id);
  const fx = f.fx;
  const fw = f.fw;
  const top = f.floorTop;
  const bottom = f.floorBottom;
  // Back wall and floor.
  px(ctx, fx, top, fw, bottom - top, "#3a3048");
  px(ctx, fx, top, fw, 6, "#4a3f5c");
  // Rug under everything.
  if (has("rug")) px(ctx, fx + 10, bottom - 12, fw - 20, 9, "#a8465e");
  // Bed, upgraded if bought.
  const bedColor = has("bed") ? "#6fb0e8" : "#8a7f6a";
  px(ctx, fx + 6, top + 8, 30, 20, "#4a3f2c");
  px(ctx, fx + 8, top + 10, 26, 16, bedColor);
  px(ctx, fx + 10, top + 12, 10, 7, "#f2f0fa");
  if (has("bed")) px(ctx, fx + 6, top + 6, 30, 4, "#c9e4ff");
  // Lamp, glowing.
  if (has("lamp")) {
    px(ctx, fx + fw - 14, top + 12, 3, 12, "#6b5a45");
    const glow = 0.6 + Math.sin(t * 3) * 0.4;
    px(ctx, fx + fw - 20, top + 7, 13, 7, "#ffd977");
    ctx.save();
    ctx.globalAlpha = 0.22 * glow;
    ctx.fillStyle = "#ffd977";
    ctx.fillRect(fx + fw - 30, top + 2, 30, 26);
    ctx.restore();
  }
  // Plant.
  if (has("plant")) {
    px(ctx, fx + 40, top + 18, 8, 8, "#a8465e");
    px(ctx, fx + 38, top + 8, 12, 10, "#3d8449");
    px(ctx, fx + 42, top + 5, 4, 5, "#4fa96e");
  }
  // Shelf with a few books.
  if (has("shelf")) {
    px(ctx, fx + 6, bottom - 14, 34, 4, "#6b5a45");
    for (let i = 0; i < 5; i++) {
      px(ctx, fx + 8 + i * 6, bottom - 19, 4, 5, ["#c94f4f", "#4f7fd6", "#e8b23a", "#4fa96e", "#b45fd0"][i]);
    }
  }
  // Telly, flickering away.
  if (has("tv")) {
    px(ctx, fx + fw - 36, top + 20, 26, 16, "#2a2440");
    const flick = Math.floor(t * 6) % 3;
    px(ctx, fx + fw - 33, top + 22, 20, 12, ["#6fb0e8", "#8fd8ff", "#c9e4ff"][flick]);
    px(ctx, fx + fw - 26, top + 36, 6, 3, "#1b1b24");
  }
  // Crumb the rat, asleep in the corner when you are not out with him.
  if (has("pet")) drawPetRat(ctx, fx + fw - 16, bottom - 5, "left", t * 0.4);
}

const SHOP_INTERIOR: Record<string, InteriorFn> = {
  home: homeInterior,
  showroom: showroomInterior,
  electronics: electronicsInterior,
  clothing: clothingInterior,
  "food-stall": foodStallInterior,
  "delivery-hub": deliveryHubInterior,
  mall: mallInterior,
  salon: salonInterior,
  garage: garageInterior,
  "apt-a": apartmentInterior,
  "apt-b": apartmentInterior,
  "apt-c": apartmentInterior,
  "villa-a": villaInterior,
  "villa-b": villaInterior,
  "villa-c": villaInterior,
  hotel: hotelInterior,
  restaurant: restaurantInterior,
};

const o_shack_dish = (b: { id: string }) => b.id.charCodeAt(b.id.length - 1) % 2 === 0;

export function drawBuilding(ctx: CanvasRenderingContext2D, b: Building, t: number, wheelActive: boolean) {
  const s = BUILDING_STYLE[b.style];
  const x = b.x * TILE;
  const y = b.y * TILE;
  const w = b.w * TILE;
  const h = b.h * TILE;
  const interior = SHOP_INTERIOR[b.id];
  const hasInterior = Boolean(interior);
  // A door on the top row means the shop faces the road to the north.
  const streetNorth = b.door ? b.door.y === b.y : true;
  const roofAtTop = hasInterior ? !streetNorth : true;

  px(ctx, x + 5, y + 8, w, h, "rgba(0,0,0,0.28)");
  px(ctx, x, y, w, h, s.wall);
  px(ctx, x, roofAtTop ? y : y + h - 14, w, 14, s.roof);
  px(ctx, x, y, 4, h, s.wall2);
  px(ctx, x + w - 4, y, 4, h, s.wall2);
  if (roofAtTop) px(ctx, x, y + h - 5, w, 5, s.wall2);
  else px(ctx, x, y + 4, w, 4, s.wall2);

  if (interior) interior(ctx, x, y, w, h, t, streetNorth);

  const busy = !hasInterior && (b.style === "office" || b.style === "tower");
  const winCols = Math.max(1, Math.floor((b.w - 1) / 2));
  for (let j = 0; !hasInterior && j < Math.max(1, Math.floor((b.h - 1) / 2)); j++) {
    for (let i = 0; i < winCols; i++) {
      const wx = x + 18 + i * 64;
      const wy = y + 26 + j * 56;
      if (wx + 26 > x + w - 8 || wy + 22 > y + h - 30) continue;
      const lit = hash(b.x + i, b.y + j, 7) > (busy ? 0.35 : 0.62);
      px(ctx, wx, wy, 26, 22, s.wall2);
      px(ctx, wx + 3, wy + 3, 20, 16, lit ? s.lit : s.window);
      // Workers at their desks, visible through the glass of office towers.
      if (busy && lit) {
        const bob = Math.sin(t * 1.5 + (b.x + i) * 1.7 + j * 2.3) * 1.4;
        const worker = hash(b.x + i, b.y + j, 21) > 0.28;
        if (worker) {
          const dark = "rgba(24,21,38,0.6)";
          px(ctx, wx + 7, wy + 12 + bob, 12, 6, dark);
          px(ctx, wx + 9, wy + 8 + bob, 8, 5, dark);
          px(ctx, wx + 8, wy + 6 + bob, 3, 3, dark);
          px(ctx, wx + 15, wy + 6 + bob, 3, 3, dark);
        }
      }
    }
  }

  if (b.style === "tower") {
    for (let i = 0; i < Math.floor(b.w / 2); i++) px(ctx, x + 8 + i * 48, y + 14, 6, h - 20, s.wall2);
  }

  // Rooftop gear + a glass lobby make the city blocks read as real buildings.
  if (!hasInterior && (b.style === "office" || b.style === "tower" || b.style === "hub")) {
    const units = Math.max(1, Math.floor(b.w / 96));
    for (let i = 0; i < units; i++) {
      const ax = x + 18 + i * 92;
      if (ax + 24 > x + w - 14) break;
      px(ctx, ax, y + 3, 24, 9, "#4a4f60");
      px(ctx, ax + 2, y + 5, 20, 5, "#616779");
      px(ctx, ax + 4, y + 6, 6, 3, "#7d8496");
    }
    px(ctx, x + w - 30, y + 4, 8, 8, "#5f6577");
    if (b.style === "tower") {
      const blink = Math.floor(t * 1.7) % 2 === 0;
      px(ctx, x + w - 27, y - 10, 3, 14, "#6a6f80");
      px(ctx, x + w - 28, y - 13, 5, 4, blink ? "#ff4d5e" : "#7a2a35");
    }
  }

  // Lobby canopy over the street entrance.
  if (!hasInterior && b.door && (b.style === "office" || b.style === "tower" || b.style === "hub")) {
    const topDoor = b.door.y === b.y;
    const lx = b.door.x * TILE - 12;
    const ly = topDoor ? b.door.y * TILE + 30 : (b.door.y + 1) * TILE - 44;
    px(ctx, lx, ly, 48, 6, "#4a4f60");
    px(ctx, lx + 2, ly + 1, 44, 3, "#8fd8ea");
    px(ctx, lx + 2, topDoor ? ly + 6 : ly - 16, 8, 16, "rgba(191,233,247,0.35)");
    px(ctx, lx + 38, topDoor ? ly + 6 : ly - 16, 8, 16, "rgba(191,233,247,0.35)");
  }

  if (b.style === "machine") {
    const cx = x + w / 2;
    const cy = y + h - 40;
    const rad = 20;
    px(ctx, cx - rad - 4, cy - rad - 4, rad * 2 + 8, rad * 2 + 8, "#232736");
    ctx.strokeStyle = wheelActive ? "#8fd8ea" : "#5a5f70";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(r(cx), r(cy), r(rad), 0, Math.PI * 2);
    ctx.stroke();
    const spin = wheelActive ? t * 3.2 : t * 0.35;
    for (let k = 0; k < 4; k++) {
      const a = spin + (k * Math.PI) / 2;
      ctx.strokeStyle = wheelActive ? "#7fe8ff" : "#6a6f80";
      ctx.beginPath();
      ctx.moveTo(r(cx), r(cy));
      ctx.lineTo(r(cx + Math.cos(a) * rad), r(cy + Math.sin(a) * rad));
      ctx.stroke();
    }
    const blink = Math.floor(t * 2) % 2 === 0;
    px(ctx, x + 8, y + 20, 6, 6, wheelActive && blink ? "#43d17a" : "#2a5f42");
  }

  // Door + sign. Doors sit on the bottom row (facing south) or the top row (facing north).
  if (b.door) {
    const facing: "up" | "down" = b.door.y === b.y ? "up" : "down";
    const dx = b.door.x * TILE + 4;
    const dy = facing === "up" ? b.door.y * TILE + 2 : (b.door.y + 1) * TILE - 30;
    px(ctx, dx, dy, 24, 30, "#2b2434");
    px(ctx, dx + 2, dy + 2, 20, 26, b.style === "mansion" ? "#4a3d2c" : "#38304a");
    px(ctx, dx + 17, dy + 15, 3, 3, "#e8b23a");
    if (facing === "down") px(ctx, dx - 3, dy + 30, 30, 3, "#5c5a6e");
    else px(ctx, dx - 3, dy - 3, 30, 3, "#5c5a6e");
    if (b.style === "mansion") {
      px(ctx, dx - 22, dy - 14, 8, 44, "#d9cbb2");
      px(ctx, dx + 38, dy - 14, 8, 44, "#d9cbb2");
      px(ctx, dx - 24, dy - 18, 12, 6, "#e8b23a");
      px(ctx, dx + 36, dy - 18, 12, 6, "#e8b23a");
    }
    if (b.style === "shop" || b.style === "hub") {
      // Glass storefronts skip the awning (it would sit on the shelves); the open
      // food stall keeps one over the counter.
      const awningY = hasInterior
        ? b.id === "food-stall"
          ? y + h + 2
          : null
        : facing === "down"
          ? dy - 14
          : dy + 30;
      if (awningY !== null) {
        for (let i = 0; i < 6; i++) px(ctx, dx - 14 + i * 9, awningY, 9, 12, i % 2 === 0 ? "#c94f4f" : "#e8e0d0");
        px(ctx, dx - 16, facing === "down" ? awningY + 12 : awningY - 3, 56, 3, "#3a2f28");
      }
    }
  }

  if (b.style === "mall") {
    // Revolving door, glass canopy and a big illuminated sign band.
    const dy = b.door ? b.door.y * TILE : y + h;
    const dx2 = b.door ? b.door.x * TILE - 10 : x + w / 2;
    px(ctx, dx2 - 14, dy - 14, 48, 8, "#8f86b8");
    px(ctx, dx2 - 10, dy - 12, 40, 4, "#ffd977");
    px(ctx, dx2 - 2, dy - 24, 24, 12, "#2b2b36");
    for (let i = 0; i < 5; i++) px(ctx, dx2 + i * 4, dy - 22, 3, 8, i % 2 ? "#ffd977" : "#7fe8ff");
    for (let i = 0; i < 3; i++) px(ctx, x + 12 + i * 14, y + 4, 10, 10, "#7fe8ff");
  }
  if (b.style === "salon") {
    // Pink awning, a pole sign and a shampoo bottle by the door.
    const topDoor = b.door ? b.door.y === b.y : true;
    const awY = topDoor ? (b.door ? b.door.y * TILE - 14 : y - 14) : (b.door ? (b.door.y + 1) * TILE + 2 : y + h + 2);
    const awX = b.door ? b.door.x * TILE - 18 : x + w / 2;
    for (let i = 0; i < 5; i++) px(ctx, awX + i * 10, awY, 10, 9, i % 2 ? "#f0c9d8" : "#e0b0c4");
    px(ctx, awX - 2, topDoor ? awY - 3 : awY + 9, 54, 3, "#b8563f");
    px(ctx, x + 6, y + 2, 4, 26, "#8a8a96");
    px(ctx, x + 1, y + 4, 14, 12, "#f0c9d8");
    px(ctx, x + 4, y + 8, 8, 2, "#b8563f");
  }
  if (b.style === "garage") {
    // Roller shutter, tyre stack and an oil drum.
    const dy2 = b.door ? b.door.y * TILE : y + h;
    const dx3 = b.door ? b.door.x * TILE - 14 : x + w / 2;
    px(ctx, dx3, dy2 - 20, 44, 20, "#5d616e");
    for (let i = 0; i < 6; i++) px(ctx, dx3 + 1, dy2 - 18 + i * 3, 42, 2, "#6f7480");
    for (let i = 0; i < 3; i++) px(ctx, x + 4, y + h - 10 - i * 7, 12, 6, "#2b2b36");
    px(ctx, x + w - 12, y + h - 20, 10, 18, "#c94f4f");
    px(ctx, x + w - 12, y + h - 14, 10, 3, "#f2f0fa");
  }
  if (b.style === "apartment") {
    // Balconies with washing, an entrance canopy and an intercom panel.
    for (let i = 0; i < 3; i++) {
      const by3 = y + 8 + i * Math.max(10, Math.floor(h / 4));
      if (by3 > y + h - 14) break;
      for (const side of [0.24, 0.7]) {
        const bx3 = x + w * side;
        px(ctx, bx3 - 12, by3, 24, 3, "#7a5340");
        px(ctx, bx3 - 12, by3 - 8, 24, 8, "rgba(20,16,28,0.55)");
        const cloth2 = ["#e8e0d0", "#7fb2ff", "#c94f4f", "#ffd977"];
        for (let k = 0; k < 3; k++) px(ctx, bx3 - 9 + k * 7, by3 - 6, 5, 6, cloth2[(k + i) % cloth2.length]);
      }
    }
    const topDoor = b.door ? b.door.y === b.y : true;
    const cy3 = topDoor ? (b.door ? b.door.y * TILE - 12 : y - 12) : (b.door ? (b.door.y + 1) * TILE + 2 : y + h + 2);
    const cx4 = b.door ? b.door.x * TILE - 12 : x + w / 2;
    px(ctx, cx4, cy3, 36, 6, "#7a5340");
    px(ctx, cx4 + 2, cy3 + 1, 32, 3, "#c9a58a");
    px(ctx, x + 5, y + h - 16, 6, 10, "#5d616e");
  }
  if (b.style === "shack2") {
    // Corrugated patchwork, a leaning roof and a water tank on top.
    px(ctx, x + 4, y + 6, 14, 10, "#7c6f60");
    for (let i = 0; i < 4; i++) px(ctx, x + 5 + i * 3, y + 7, 2, 8, "#6f6357");
    px(ctx, x + w - 18, y + 12, 12, 8, "#6b5b4a");
    px(ctx, x + w - 12, y + h - 22, 4, 20, "#5f5449");
    px(ctx, x + w - 16, y + h - 26, 12, 6, "#4a4238");
    if (o_shack_dish(b)) {
      px(ctx, x + w - 14, y + 2, 9, 7, "#c9bfad");
      px(ctx, x + w - 11, y + 9, 3, 6, "#8a8a96");
    }
    px(ctx, x + 3, y + h - 6, 10, 6, "#4a4238");
  }

  if (b.style === "hotel") {
    // Five gold stars and a valet canopy over the entrance.
    for (let i = 0; i < 5; i++) px(ctx, x + 10 + i * 10, y + 3, 6, 6, "#ffd977");
    const topDoor = b.door ? b.door.y === b.y : true;
    const cy2 = topDoor ? (b.door ? b.door.y * TILE + 34 : y + 34) : (b.door ? (b.door.y + 1) * TILE - 40 : y + h - 40);
    const cx2 = b.door ? b.door.x * TILE - 6 : x + w / 2;
    px(ctx, cx2, cy2, 44, 6, "#7a1f2f");
    px(ctx, cx2 + 2, cy2 + 1, 40, 3, "#ffd977");
  }
  if (b.style === "restaurant") {
    // Wine-red awning + a menu board by the door.
    const topDoor = b.door ? b.door.y === b.y : true;
    const awY = topDoor ? (b.door ? b.door.y * TILE - 16 : y - 16) : (b.door ? (b.door.y + 1) * TILE + 2 : y + h + 2);
    const awX = b.door ? b.door.x * TILE - 20 : x + w / 2;
    for (let i = 0; i < 6; i++) px(ctx, awX + i * 10, awY, 10, 10, i % 2 ? "#7a1f2f" : "#c94f4f");
    px(ctx, awX - 2, topDoor ? awY - 3 : awY + 10, 64, 3, "#3a2f28");
    px(ctx, x + 8, y + 4, 16, 20, "#2a2438");
    px(ctx, x + 11, y + 7, 10, 2, "#ffd977");
    px(ctx, x + 11, y + 12, 10, 2, "#cfc9e8");
    px(ctx, x + 11, y + 17, 10, 2, "#cfc9e8");
  }
  if (b.style === "villa") {
    // Columned portico on the entrance side.
    const topDoor = b.door ? b.door.y === b.y : false;
    const py2 = topDoor ? (b.door ? b.door.y * TILE - 18 : y - 18) : (b.door ? (b.door.y + 1) * TILE + 2 : y + h + 2);
    const px2 = b.door ? b.door.x * TILE - 14 : x + w / 2 - 14;
    px(ctx, px2, py2, 60, 6, "#f2f0fa");
    px(ctx, px2 + 4, topDoor ? py2 + 6 : py2 - 18, 7, 18, "#e8e2d6");
    px(ctx, px2 + 49, topDoor ? py2 + 6 : py2 - 18, 7, 18, "#e8e2d6");
  }

  if (b.sign) {
    // A name plate bolted to the facade, right beside the door — no floating
    // text over the rooftops.
    ctx.font = '700 10px "Be Vietnam Pro", system-ui, sans-serif';
    const tw = ctx.measureText(b.sign).width;
    const plateW = tw + 14;
    const plateH = 15;
    const centreX = b.door ? b.door.x * TILE + 16 : x + w / 2;
    const topDoor = b.door ? b.door.y === b.y : false;
    const plateY = b.door
      ? topDoor
        ? b.door.y * TILE + 34
        : b.door.y * TILE - 17
      : y + 8;
    const bx = centreX - plateW / 2;
    px(ctx, bx + 2, plateY + 2, plateW, plateH, "rgba(0,0,0,0.35)");
    px(ctx, bx, plateY, plateW, plateH, "#241f33");
    px(ctx, bx, plateY, plateW, 2, "#ff2882");
    px(ctx, bx, plateY + plateH - 2, plateW, 2, "#37305a");
    ctx.fillStyle = "#ffd977";
    ctx.textAlign = "center";
    ctx.fillText(b.sign, r(centreX), r(plateY + 11));
    ctx.textAlign = "left";
  }
}


// --- Vehicles ----------------------------------------------------------------

export interface VehicleStyle {
  body: string;
  dark: string;
  glass: string;
  trim: string;
}

export const VEHICLE_COLORS: Record<string, VehicleStyle> = {
  red: { body: "#c0392b", dark: "#8f2a20", glass: "#bfe9f7", trim: "#ffe08a" },
  blue: { body: "#3f6fd6", dark: "#2f55a8", glass: "#bfe9f7", trim: "#ffe08a" },
  teal: { body: "#2f8f8f", dark: "#246f6f", glass: "#bfe9f7", trim: "#ffe08a" },
  yellow: { body: "#e0b84a", dark: "#b08d2f", glass: "#bfe9f7", trim: "#fff3c4" },
  green: { body: "#3f9d6b", dark: "#2f7a52", glass: "#bfe9f7", trim: "#fff3c4" },
  white: { body: "#d8d8e0", dark: "#b0b0bc", glass: "#bfe9f7", trim: "#ffe08a" },
  black: { body: "#3a3a48", dark: "#2a2a36", glass: "#9fd8ea", trim: "#ffd977" },
  taxi: { body: "#e8b23a", dark: "#b9862a", glass: "#bfe9f7", trim: "#2a2a36" },
  crimson: { body: "#a52a3f", dark: "#7d1f30", glass: "#bfe9f7", trim: "#ffd977" },
  gold: { body: "#c9a02a", dark: "#9a7a1f", glass: "#bfe9f7", trim: "#fff3c4" },
  sky: { body: "#4a9fe0", dark: "#33749f", glass: "#bfe9f7", trim: "#ffe08a" },
};

/**
 * Top-down vehicle. Authored facing right; mirrored for `left` and rotated for
 * `up`/`down`, so all four headings stay consistent.
 */
export function drawVehicle(
  ctx: CanvasRenderingContext2D,
  kind: "car" | "van" | "bike" | "bicycle",
  x: number,
  y: number,
  dir: Dir,
  t: number,
  opts: { style?: VehicleStyle; scale?: number; rider?: boolean; brake?: boolean; headlights?: boolean } = {}
) {
  const s = opts.style ?? VEHICLE_COLORS.blue;
  const scale = opts.scale ?? 1;
  const mirror = dir === "left";
  const rotate = dir === "up" || dir === "down";
  if (mirror) {
    ctx.save();
    ctx.translate(r(x) * 2, 0);
    ctx.scale(-1, 1);
  }
  if (rotate) {
    ctx.save();
    ctx.translate(r(x), r(y));
    ctx.rotate(dir === "down" ? Math.PI / 2 : -Math.PI / 2);
    ctx.translate(-r(x), -r(y));
  }
  if (kind === "bicycle") drawBicycleBody(ctx, x, y, s, t, scale, !opts.brake);
  else if (kind === "bike") drawBikeBody(ctx, x, y, s, t, scale, Boolean(opts.rider));
  else drawCarBody(ctx, x, y, s, kind === "van", t, scale, opts);

  if (rotate) ctx.restore();
  if (mirror) ctx.restore();
}

function drawCarBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: VehicleStyle,
  van: boolean,
  t: number,
  scale: number,
  opts: { brake?: boolean; headlights?: boolean }
) {
  const L = (van ? 56 : 46) * scale;
  const W = (van ? 30 : 26) * scale;
  const half = L / 2;
  const hw = W / 2;
  // Ground shadow.
  px(ctx, x - half + 2, y - hw + 5, L, W, "rgba(0,0,0,0.30)");
  // Wheels.
  px(ctx, x - half + 8, y - hw - 3, 11, 5, "#1b1b24");
  px(ctx, x + half - 20, y - hw - 3, 11, 5, "#1b1b24");
  px(ctx, x - half + 8, y + hw - 2, 11, 5, "#1b1b24");
  px(ctx, x + half - 20, y + hw - 2, 11, 5, "#1b1b24");
  // Body.
  px(ctx, x - half, y - hw, L, W, s.body);
  px(ctx, x - half, y - hw, L, 3, "rgba(255,255,255,0.16)");
  px(ctx, x - half, y + hw - 3, L, 3, s.dark);
  // Cabin + glass.
  const cabinX = van ? x - half + 12 : x - 6 * scale;
  const cabinW = van ? 26 * scale : 20 * scale;
  px(ctx, cabinX, y - hw + 3, cabinW, W - 6, s.dark);
  px(ctx, cabinX + cabinW - 6 * scale, y - hw + 4, 5 * scale, W - 8, s.glass);
  px(ctx, cabinX + 1, y - hw + 5, 3 * scale, W - 10, "rgba(20,24,36,0.55)");
  // Roof shine.
  px(ctx, cabinX + 4, y - hw + 4, cabinW - 12, 2, "rgba(255,255,255,0.14)");
  // Lights.
  px(ctx, x + half - 3, y - hw + 3, 3, 5, opts.headlights === false ? s.trim : "#fff6d5");
  px(ctx, x + half - 3, y + hw - 8, 3, 5, opts.headlights === false ? s.trim : "#fff6d5");
  px(ctx, x - half, y - hw + 3, 3, 5, opts.brake ? "#ff6b7a" : "#a8323f");
  px(ctx, x - half, y + hw - 8, 3, 5, opts.brake ? "#ff6b7a" : "#a8323f");
  if (van) px(ctx, x - half + 4, y - hw + 2, 30 * scale, 3, "rgba(255,255,255,0.12)");
  // Exhaust shimmer while driving.
  if (!opts.brake) {
    const puff = (t * 26) % 12;
    ctx.globalAlpha = 0.14;
    px(ctx, x - half - 6 - puff, y - 3, 5, 5, "#cfc9e8");
    ctx.globalAlpha = 1;
  }
}

function drawBicycleBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: VehicleStyle,
  t: number,
  scale: number,
  pedalling: boolean
) {
  const L = 30 * scale;
  const half = L / 2;
  const spin = pedalling ? t * 7 : 0.6;
  px(ctx, x - half + 1, y + 3, L, 4 * scale, "rgba(0,0,0,0.22)");
  // Wheels: thin tyres with spokes that turn while you pedal.
  for (const wx of [x - half + 4, x + half - 4]) {
    px(ctx, wx - 3, y - 7, 6, 14, "#1b1b24");
    px(ctx, wx - 2, y - 5, 4, 10, "#b9b9c6");
    ctx.strokeStyle = "#8a8a98";
    ctx.lineWidth = 1;
    for (let k = 0; k < 3; k++) {
      const a = spin + (k * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(r(wx - Math.cos(a) * 2.4), r(y - Math.sin(a) * 5));
      ctx.lineTo(r(wx + Math.cos(a) * 2.4), r(y + Math.sin(a) * 5));
      ctx.stroke();
    }
  }
  // Frame: down tube, top tube, seat post.
  px(ctx, x - half + 5, y - 1, L - 10, 2, s.body);
  px(ctx, x - half + 9, y + 1, 2, 4, s.dark);
  px(ctx, x + half - 13, y - 1, 2, 6, s.dark);
  // Handlebar + saddle (the rider's feet land just under the saddle).
  px(ctx, x + half - 8, y - 5, 3, 9, s.dark);
  px(ctx, x + half - 12, y - 6, 8, 2, s.trim);
  px(ctx, x - half + 11, y - 2, 8, 4, "#2b2b36");
  // Crank + pedals.
  px(ctx, x - 1 + Math.cos(spin) * 3, y + 1 + Math.sin(spin) * 3, 3, 3, s.trim);
  px(ctx, x - 1 - Math.cos(spin) * 3, y + 1 - Math.sin(spin) * 3, 3, 3, "#2b2b36");
}

function drawBikeBody(ctx: CanvasRenderingContext2D, x: number, y: number, s: VehicleStyle, t: number, scale: number, rider: boolean) {
  const L = 32 * scale;
  const half = L / 2;
  px(ctx, x - half + 2, y - 6 * scale + 4, L, 12 * scale, "rgba(0,0,0,0.28)");
  // Wheels.
  px(ctx, x - half, y - 5, 10, 10, "#1b1b24");
  px(ctx, x + half - 10, y - 5, 10, 10, "#1b1b24");
  px(ctx, x - half + 2, y - 3, 6, 6, "#3a3a48");
  px(ctx, x + half - 8, y - 3, 6, 6, "#3a3a48");
  // Frame, tank, seat.
  px(ctx, x - half + 8, y - 4, 16 * scale, 8, s.body);
  px(ctx, x - half + 4, y - 3, 8, 6, s.dark);
  px(ctx, x + half - 14, y - 6, 4, 12, s.dark);
  px(ctx, x + half - 3, y - 2, 3, 4, "#fff6d5");
  if (rider) {
    px(ctx, x - 4, y - 5, 10, 10, s.dark);
    px(ctx, x - 2, y - 3, 6, 6, "#ffd977");
  } else {
    px(ctx, x - 2, y - 3, 6, 6, "#2b2b36");
  }
}

// --- Objects -----------------------------------------------------------------

const SUPER_CAR_COLORS: Record<string, [string, string, string]> = {
  crimson: ["#8f2f3f", "#6f2430", "#ff8ab8"],
  aqua: ["#2f7f8f", "#24636f", "#7fe8ff"],
  gold: ["#b98f2a", "#8f6f1f", "#ffd977"],
};

export function drawObject(ctx: CanvasRenderingContext2D, o: WorldObject, t: number, gateOpen: boolean) {
  const x = o.x * TILE;
  const y = o.y * TILE;
  switch (o.type) {
    case "tree": {
      const sway = Math.sin(t * 1.3 + o.x) * 1.6;
      px(ctx, x + 14, y + 18, 5, 12, "#5a4432");
      ctx.fillStyle = "#2f6b3f";
      ctx.beginPath();
      ctx.arc(r(x + 16 + sway), r(y + 12), r(13), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3d8449";
      ctx.beginPath();
      ctx.arc(r(x + 12 + sway), r(y + 8), r(8), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#468a52";
      ctx.beginPath();
      ctx.arc(r(x + 20 + sway), r(y + 9), r(6), 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "bench": {
      px(ctx, x + 3, y + 20, 26, 5, "#8a5f3a");
      px(ctx, x + 3, y + 12, 26, 4, "#7a5334");
      px(ctx, x + 5, y + 25, 4, 6, "#5b3f28");
      px(ctx, x + 23, y + 25, 4, 6, "#5b3f28");
      break;
    }
    case "bush": {
      ctx.fillStyle = "#2f6b3f";
      ctx.beginPath();
      ctx.arc(r(x + 10), r(y + 22), r(9), 0, Math.PI * 2);
      ctx.arc(r(x + 22), r(y + 22), r(9), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3d8449";
      ctx.beginPath();
      ctx.arc(r(x + 16), r(y + 17), r(10), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#468a52";
      ctx.beginPath();
      ctx.arc(r(x + 12), r(y + 14), r(5), 0, Math.PI * 2);
      ctx.fill();
      if (o.variant === "flower") {
        const blooms: [number, number, string][] = [
          [11, 15, "#ff8ab8"],
          [20, 14, "#ffd977"],
          [16, 23, "#ff2882"],
          [22, 24, "#b78aff"],
        ];
        for (const [fx, fy, fc] of blooms) px(ctx, x + fx, y + fy, 3, 3, fc);
      }
      break;
    }
    case "table": {
      // Two chairs, a cloth, and somebody's lunch.
      px(ctx, x + 1, y + 11, 6, 5, "#5b4a38");
      px(ctx, x + 1, y + 9, 6, 3, "#7a6349");
      px(ctx, x + 25, y + 11, 6, 5, "#5b4a38");
      px(ctx, x + 25, y + 9, 6, 3, "#7a6349");
      px(ctx, x + 5, y + 5, 22, 22, "#8a5f3a");
      px(ctx, x + 7, y + 7, 18, 18, "#e8e0d0");
      px(ctx, x + 10, y + 10, 10, 7, "#c94f4f");
      px(ctx, x + 11, y + 11, 8, 3, "#ffd977");
      px(ctx, x + 22, y + 14, 3, 5, "#f2f0fa");
      break;
    }
    case "pond": {
      const pw = o.w * TILE;
      const ph = o.h * TILE;
      px(ctx, x - 2, y - 2, pw + 4, ph + 4, "#7d7d88");
      px(ctx, x + 1, y + 1, pw - 2, ph - 2, "#2f6f9e");
      px(ctx, x + 4, y + 4, pw - 8, ph - 8, "#3f8fd8");
      ctx.strokeStyle = "rgba(205,240,255,0.4)";
      ctx.lineWidth = 1;
      for (let k = 0; k < 4; k++) {
        const rr = (t * 9 + k * 17) % 46;
        ctx.beginPath();
        ctx.ellipse(
          r(x + pw / 2 + Math.sin(k * 2.1) * 22),
          r(y + ph / 2 + Math.cos(k * 1.7) * 9),
          r(5 + rr / 3),
          r(2.5 + rr / 6),
          0,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }
      px(ctx, x + 11, y + 9, 11, 8, "#3d8449");
      px(ctx, x + pw - 26, y + ph - 20, 9, 7, "#468a52");
      px(ctx, x + 14, y + 11, 3, 3, "#ff8ab8");
      break;
    }
    case "gym": {
      const metal = "#8f8f9c";
      const pad = "#22222c";
      const bar = "#ffd977";
      const v = o.variant ?? "treadmill";
      if (v === "treadmill") {
        px(ctx, x + 3, y + 11, 26, 15, "#3a3a48");
        px(ctx, x + 5, y + 13, 22, 11, pad);
        px(ctx, x + 22, y + 4, 3, 8, metal);
        px(ctx, x + 13, y + 2, 15, 3, metal);
        px(ctx, x + 7, y + 14, 4, 3, bar);
      } else if (v === "rower") {
        px(ctx, x + 2, y + 21, 28, 6, "#3a3a48");
        px(ctx, x + 5, y + 16, 11, 5, pad);
        px(ctx, x + 18, y + 13, 9, 9, metal);
        px(ctx, x + 20, y + 15, 5, 5, bar);
        px(ctx, x + 8, y + 11, 3, 6, metal);
      } else if (v === "press") {
        px(ctx, x + 5, y + 23, 22, 6, "#3a3a48");
        px(ctx, x + 8, y + 17, 16, 6, pad);
        px(ctx, x + 5, y + 5, 4, 14, metal);
        px(ctx, x + 23, y + 5, 4, 14, metal);
        px(ctx, x + 3, y + 2, 26, 3, bar);
      } else {
        px(ctx, x + 4, y + 9, 4, 20, metal);
        px(ctx, x + 24, y + 9, 4, 20, metal);
        px(ctx, x + 4, y + 6, 24, 3, bar);
        px(ctx, x + 14, y + 9, 3, 7, pad);
      }
      break;
    }
    case "lamp": {
      const glow = ctx.createRadialGradient(r(x + 16), r(y + 4), 2, r(x + 16), r(y + 4), 40);
      glow.addColorStop(0, "rgba(255,233,168,0.16)");
      glow.addColorStop(1, "rgba(255,233,168,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(r(x - 24), r(y - 36), r(80), r(80));
      px(ctx, x + 14, y + 8, 4, 24, "#2f2f3a");
      px(ctx, x + 10, y + 2, 12, 7, "#3a3a48");
      px(ctx, x + 12, y + 9, 8, 3, "#ffe9a8");
      break;
    }
    case "fountain": {
      const w = o.w * TILE;
      const h = o.h * TILE;
      px(ctx, x + 4, y + 6, w, h, "#5c5868");
      px(ctx, x, y, w, h, "#7d7d88");
      px(ctx, x + 8, y + 8, w - 16, h - 16, "#3f8fd8");
      px(ctx, x + w / 2 - 6, y + 14, 12, h - 26, "#8d8d98");
      px(ctx, x + w / 2 - 10, y + 8, 20, 6, "#a0a0aa");
      for (let k = 0; k < 3; k++) {
        const rr = ((t * 14 + k * 18) % 44) + 6;
        ctx.strokeStyle = "rgba(190,235,255,0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(r(x + w / 2), r(y + h / 2 + 4), r(rr / 2), 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case "statue": {
      px(ctx, x + 4, y + 22, 24, 8, "#6e6a7c");
      px(ctx, x + 8, y + 14, 16, 8, "#8d8d98");
      drawMouseSprite(ctx, x + 16, y + 16, "down", 0, { fur: "#e8b23a", furD: "#c9932a", outfit: "#f5c542", scale: 0.62 }, t);
      break;
    }
    case "trashcan": {
      px(ctx, x + 9, y + 8, 14, 22, "#5a5f70");
      px(ctx, x + 7, y + 5, 18, 5, "#464b5c");
      px(ctx, x + 12, y + 12, 2, 14, "#4a4f60");
      px(ctx, x + 18, y + 12, 2, 14, "#4a4f60");
      break;
    }
    case "busstop": {
      drawBusStop(ctx, x, y, t, o.text ?? "Bus stop");
      break;
    }
    case "taxi": {
      drawTaxi(ctx, x, y, t);
      break;
    }
    case "sign": {
      px(ctx, x + 14, y + 12, 4, 20, "#5b4a38");
      ctx.font = '700 9px "Be Vietnam Pro", system-ui, sans-serif';
      const tw = ctx.measureText(o.text ?? "").width + 10;
      px(ctx, x + 16 - tw / 2, y + 2, tw, 15, "#2a2438");
      px(ctx, x + 16 - tw / 2, y + 2, tw, 2, "#ff2882");
      ctx.fillStyle = "#e8e8f0";
      ctx.textAlign = "center";
      ctx.fillText(o.text ?? "", r(x + 16), r(y + 13));
      ctx.textAlign = "left";
      break;
    }
    case "parkingbay": {
      // Painted bay lines on the pavement.
      px(ctx, x + 2, y + 2, 2, 28, "rgba(240,235,210,0.5)");
      px(ctx, x + 28, y + 2, 2, 28, "rgba(240,235,210,0.5)");
      px(ctx, x + 4, y + 28, 24, 2, "rgba(240,235,210,0.5)");
      break;
    }
    case "trafficlight": {
      const cx = x + 16;
      const headY = y - 26;
      // Pole rising out of the sidewalk, foot plate on the ground.
      px(ctx, cx - 2, headY + 34, 4, 24, "#3a3a48");
      px(ctx, cx - 5, y + 28, 10, 4, "#2b2b36");
      // Head: dark box with three lamps, the live one glowing.
      px(ctx, cx - 8, headY, 16, 34, "#26262f");
      px(ctx, cx - 6, headY + 2, 12, 30, "#171720");
      const lamps: { key: SignalPhase; color: string; glow: string }[] = [
        { key: "red", color: "#ff4d5e", glow: "rgba(255,77,94,0.5)" },
        { key: "yellow", color: "#ffc53d", glow: "rgba(255,197,61,0.5)" },
        { key: "green", color: "#43d17a", glow: "rgba(67,209,122,0.5)" },
      ];
      lamps.forEach((lamp, i) => {
        const ly = headY + 5 + i * 9;
        const on = SIGNAL === lamp.key;
        if (on) {
          const halo = ctx.createRadialGradient(r(cx), r(ly + 3), 1, r(cx), r(ly + 3), 22);
          halo.addColorStop(0, lamp.glow);
          halo.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = halo;
          ctx.fillRect(r(cx - 22), r(ly - 19), r(44), r(44));
        }
        px(ctx, cx - 4, ly, 8, 7, on ? lamp.color : "#2f2f39");
        if (on) px(ctx, cx - 3, ly + 1, 3, 2, "rgba(255,255,255,0.8)");
      });
      // Pedestrian box beside the pole: green while vehicles are held.
      px(ctx, cx - 19, y + 10, 12, 12, "#26262f");
      px(ctx, cx - 17, y + 12, 8, 8, SIGNAL === "red" ? "#8fe8b0" : "#ff8a9a");
      break;
    }
    case "bike": {
      const tone = VEHICLE_COLORS[o.variant ?? "red"] ?? VEHICLE_COLORS.red;
      px(ctx, x + 12, y + 26, 10, 3, "rgba(0,0,0,0.25)");
      drawVehicle(ctx, "bike", x + 16, y + 18, "up", t, { style: tone, brake: true });
      break;
    }
    case "laundry": {
      // A line strung between two poles with washing pegged to it.
      const lw = o.w * TILE;
      const ly = y + 16 + Math.sin(t * 1.6 + o.x) * 1.5;
      px(ctx, x + 2, y + 8, 2, 22, "#6b5b4a");
      px(ctx, x + lw - 4, y + 8, 2, 22, "#6b5b4a");
      px(ctx, x + 2, ly, lw - 4, 2, "#c9bfad");
      const cloth = ["#e8e0d0", "#7fb2ff", "#c94f4f", "#ffd977", "#43d17a"];
      for (let i = 0; i < 5; i++) {
        const cxp = x + 6 + i * ((lw - 12) / 5);
        const sway = Math.sin(t * 1.4 + i * 1.2 + o.x) * 2;
        px(ctx, cxp + sway, ly + 2, 9, 12, cloth[(i + o.x) % cloth.length]);
        px(ctx, cxp + 2 + sway, ly + 1, 4, 2, "#8a8a96");
      }
      break;
    }
    case "foodcart": {
      const v = o.variant ?? "noodle";
      const cx = x + 16;
      const cartY = y + 10;
      // Cart body + wheels.
      px(ctx, x + 3, cartY, 26, 16, "#8a6a4a");
      px(ctx, x + 3, cartY, 26, 4, "#a8835c");
      px(ctx, x + 5, cartY + 16, 5, 6, "#2b2b36");
      px(ctx, x + 22, cartY + 16, 5, 6, "#2b2b36");
      // Parasol above the cart.
      const stripe = v === "coffee" ? ["#c94f4f", "#e8e0d0"] : v === "skewer" ? ["#3f9d6b", "#e8e0d0"] : ["#e8b23a", "#e8e0d0"];
      for (let i = 0; i < 6; i++) px(ctx, x - 8 + i * 9, y - 14, 9, 9, i % 2 ? stripe[1] : stripe[0]);
      px(ctx, cx - 1, y - 6, 3, 12, "#5b4a38");
      if (v === "coffee") {
        px(ctx, x + 8, cartY - 10, 16, 12, "#3a3a48");
        px(ctx, x + 10, cartY - 8, 12, 4, "#5f5f70");
        px(ctx, x + 11, cartY - 3, 3, 3, Math.floor(t * 2) % 2 ? "#ff4d5e" : "#5a2a30");
        px(ctx, x + 22, cartY - 4, 5, 4, "#f2f0fa");
      } else if (v === "skewer") {
        px(ctx, x + 5, cartY - 8, 22, 8, "#2b2b36");
        px(ctx, x + 7, cartY - 6, 18, 4, Math.floor(t * 3) % 2 ? "#ff7a3d" : "#e8541f");
        for (let i = 0; i < 4; i++) px(ctx, x + 8 + i * 5, cartY - 12, 3, 5, "#c94f4f");
        for (let i = 0; i < 3; i++) {
          const puff = (t * 16 + i * 8) % 20;
          ctx.globalAlpha = Math.max(0, 0.3 - puff / 60);
          px(ctx, x + 10 + i * 6, cartY - 16 - puff, 5, 5, "#cfc9e8");
          ctx.globalAlpha = 1;
        }
      } else {
        px(ctx, x + 6, cartY - 10, 20, 12, "#5a5f70");
        px(ctx, x + 8, cartY - 8, 16, 4, "#8a8a96");
        px(ctx, x + 24, cartY - 6, 6, 5, "#e8e0d0");
        for (let i = 0; i < 2; i++) {
          const puff = (t * 14 + i * 10) % 18;
          ctx.globalAlpha = Math.max(0, 0.32 - puff / 50);
          px(ctx, cx - 4 + i * 8, cartY - 14 - puff, 6, 6, "#f2f0fa");
          ctx.globalAlpha = 1;
        }
      }
      if (v === "truck") {
        // A proper food truck instead of a cart.
        px(ctx, x - 14, y + 2, 60, 26, "#c94f4f");
        px(ctx, x - 14, y + 2, 60, 5, "#e8e0d0");
        px(ctx, x - 8, y + 10, 30, 12, "#2b2b36");
        px(ctx, x - 6, y + 12, 26, 8, "#ffd977");
        px(ctx, x + 26, y + 6, 16, 8, "#9fd8ea");
        px(ctx, x - 10, y + 28, 10, 6, "#2b2b36");
        px(ctx, x + 28, y + 28, 10, 6, "#2b2b36");
        px(ctx, x - 12, y - 4, 56, 6, "#3a2f28");
      }
      break;
    }
    case "golfgreen": {
      const gw = o.w * TILE;
      const gh = o.h * TILE;
      px(ctx, x + 2, y + 2, gw - 4, gh - 4, "#4f9a58");
      px(ctx, x + 6, y + 6, gw - 12, gh - 12, "#5aa864");
      px(ctx, x + 10, y + 10, gw - 20, gh - 20, "#63b56d");
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r(x + gw / 2), r(y + gh / 2), r(Math.min(gw, gh) / 2 - 6), 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "golfbunker": {
      const bw = o.w * TILE;
      const bh = o.h * TILE;
      px(ctx, x + 2, y + 2, bw - 4, bh - 4, "#c9a86a");
      px(ctx, x + 5, y + 5, bw - 10, bh - 10, "#dcbe86");
      for (let i = 0; i < 6; i++) {
        const hx = x + 8 + hash(o.x + i, o.y, 3) * (bw - 18);
        const hy = y + 8 + hash(o.x + i, o.y, 9) * (bh - 18);
        px(ctx, hx, hy, 4, 3, "#b8975a");
      }
      break;
    }
    case "golfflag": {
      const fx = x + 14;
      px(ctx, fx - 5, y + 14, 12, 8, "#3f7a49");
      px(ctx, fx - 2, y + 15, 6, 5, "#1f1f28");
      px(ctx, fx - 1, y - 8, 2, 24, "#e8e0d0");
      const wave = Math.sin(t * 3 + o.x) * 2;
      px(ctx, fx + 1, y - 8, 12, 8, "#c94f4f");
      px(ctx, fx + 1 + wave, y - 7, 8, 3, "#e05f5f");
      break;
    }
    case "supercar": {
      const w = o.w * TILE;
      const [body, dark, glowColor] = SUPER_CAR_COLORS[o.variant ?? "crimson"] ?? SUPER_CAR_COLORS.crimson;
      // neon underglow
      const glow = ctx.createRadialGradient(r(x + w / 2), r(y + 26), 2, r(x + w / 2), r(y + 26), r(w));
      glow.addColorStop(0, `${glowColor}44`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(r(x - 10), r(y + 6), r(w + 20), r(34));
      px(ctx, x + 2, y + 26, w - 2, 4, "rgba(0,0,0,0.35)");
      px(ctx, x, y + 16, w, 12, body);
      px(ctx, x + 2, y + 14, w - 6, 3, glowColor);
      px(ctx, x + 14, y + 8, w - 30, 8, dark);
      px(ctx, x + 17, y + 10, w - 36, 5, "#9fe8f8");
      px(ctx, x + w - 16, y + 4, 14, 4, dark); // spoiler
      px(ctx, x + 4, y + 18, 5, 4, "#fff3c4");
      px(ctx, x + w - 9, y + 18, 5, 4, "#ff5a7a");
      px(ctx, x + 8, y + 26, 9, 6, "#1c1c26");
      px(ctx, x + w - 17, y + 26, 9, 6, "#1c1c26");
      break;
    }
  }
}

export function drawTrash(ctx: CanvasRenderingContext2D, spot: { x: number; y: number; kind: string }, t: number) {
  const x = spot.x * TILE;
  const y = spot.y * TILE;
  if (spot.kind === "dumpster") {
    px(ctx, x + 6, y + 26, 22, 3, "rgba(0,0,0,0.3)");
    px(ctx, x + 3, y + 8, 26, 20, "#3f7d4a");
    px(ctx, x + 1, y + 4, 30, 6, "#356b3f");
    px(ctx, x + 5, y + 12, 22, 3, "#2f5f3a");
    px(ctx, x + 6, y + 24, 4, 3, "#23232c");
    px(ctx, x + 22, y + 24, 4, 3, "#23232c");
    px(ctx, x + 27, y + 2, 3, 3, "#c9a05a");
    px(ctx, x + 30, y + 6, 2, 2, "#c94f4f");
  } else {
    // A pile of trash bags with a couple of cans.
    const wobble = Math.sin(t * 1.6 + spot.x) * 1;
    px(ctx, x + 5, y + 24, 22, 4, "rgba(0,0,0,0.28)");
    ctx.fillStyle = "#3a3a46";
    ctx.beginPath();
    ctx.arc(r(x + 13), r(y + 19 + wobble * 0.3), r(9), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#33333e";
    ctx.beginPath();
    ctx.arc(r(x + 22), r(y + 21), r(7), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#44444f";
    ctx.beginPath();
    ctx.arc(r(x + 17), r(y + 13), r(6), 0, Math.PI * 2);
    ctx.fill();
    px(ctx, x + 24, y + 12, 4, 9, "#8a8f9a");
    px(ctx, x + 5, y + 10, 4, 8, "#7f8490");
  }
}

// --- Characters --------------------------------------------------------------

export interface MousePalette {
  fur: string;
  furD: string;
  belly?: string;
  earIn?: string;
  nose?: string;
  eye?: string;
  outfit?: string;
  outfit2?: string;
  glasses?: boolean;
  hat?: "top" | "cap" | null;
  hatColor?: string;
  chain?: boolean;
  phone?: boolean;
  torn?: boolean;
  scale?: number;
}

const BASE_MOUSE = {
  fur: "#b9a28c",
  furD: "#9a8570",
  belly: "#dccfba",
  earIn: "#e8a8b8",
  nose: "#e8788f",
  eye: "#2b2b33",
};

const STAGE_PALETTES: MousePalette[] = [
  { ...BASE_MOUSE, outfit: "#6d6a60", torn: true },
  { ...BASE_MOUSE, outfit: "#3f7fd6" },
  { ...BASE_MOUSE, outfit: "#3f7fd6", outfit2: "#eef2f8", phone: true },
  { ...BASE_MOUSE, outfit: "#8c3039" },
  { ...BASE_MOUSE, outfit: "#26262f", outfit2: "#eef2f8", glasses: true },
  { ...BASE_MOUSE, outfit: "#26262f", outfit2: "#eef2f8", glasses: true, chain: true },
];

export const paletteForStage = (stage: number): MousePalette => STAGE_PALETTES[Math.max(0, Math.min(5, stage))];

export const NPC_PALETTES: Record<Npc["kind"], MousePalette> = {
  scavenger: { ...BASE_MOUSE, fur: "#a89078", furD: "#8f7a64", outfit: "#5b5347", torn: true, scale: 0.95 },
  worker: { ...BASE_MOUSE, outfit: "#3f6fd6", outfit2: "#eef2f8" },
  richrat: { ...BASE_MOUSE, fur: "#9a8fa8", furD: "#837a92", outfit: "#5a3f8f", hat: "top", hatColor: "#1f1f28", scale: 1.05 },
  citizen: { ...BASE_MOUSE, fur: "#a89078", furD: "#8f7a64", outfit: "#3f7d4a", hat: "cap", hatColor: "#2f6b3f" },
  kid: { ...BASE_MOUSE, fur: "#c4b09a", furD: "#a89478", outfit: "#e0b84a", scale: 0.78 },
  guard: { ...BASE_MOUSE, fur: "#a89078", furD: "#8f7a64", outfit: "#3a4f8f", hat: "cap", hatColor: "#2b3a6b", scale: 1.05 },
  police: { ...BASE_MOUSE, fur: "#a89078", furD: "#8f7a64", outfit: "#2f3f6b", outfit2: "#eef2f8", hat: "cap", hatColor: "#1f2a45", scale: 1.06 },
  golfer: { ...BASE_MOUSE, fur: "#b8a58e", furD: "#9c8a74", outfit: "#f2f0fa", outfit2: "#c94f4f", hat: "cap", hatColor: "#e8e0d0", scale: 1.02 },
  staff: { ...BASE_MOUSE, fur: "#a89078", furD: "#8f7a64", outfit: "#7a1f2f", outfit2: "#ffd977", hat: "cap", hatColor: "#5f1622", scale: 1.04 },
  guest: { ...BASE_MOUSE, fur: "#c4b09a", furD: "#a89478", outfit: "#e8e0d0", outfit2: "#ffd977", hat: "top", hatColor: "#2b2b36", scale: 1.04 },
  courier: { ...BASE_MOUSE, fur: "#b8a58e", furD: "#9c8a74", outfit: "#e8541f", outfit2: "#f2f0fa", hat: "cap", hatColor: "#c94f4f", scale: 0.82 },
  resident: { ...BASE_MOUSE, fur: "#b0a08c", furD: "#968674", outfit: "#7fb2ff", outfit2: "#e8e0d0", scale: 0.98 },
  vendor: { ...BASE_MOUSE, fur: "#b8a58e", furD: "#9c8a74", outfit: "#e8e0d0", outfit2: "#c94f4f", hat: "cap", hatColor: "#f2f0fa", scale: 1.0 },
  busker: { ...BASE_MOUSE, fur: "#b0a08c", furD: "#968674", outfit: "#5b4a7a", outfit2: "#ffd977", hat: "top", hatColor: "#3a2f4a", scale: 1.0 },
  jogger: { ...BASE_MOUSE, fur: "#c8b49c", furD: "#a8907a", outfit: "#2f8f8f", outfit2: "#ffd977", hat: "cap", hatColor: "#7fe8ff", scale: 1.0 },
  chef: { ...BASE_MOUSE, fur: "#c2ab92", furD: "#a48e77", outfit: "#f2f0fa", outfit2: "#c94f4f", scale: 1.0 },
  waiter: { ...BASE_MOUSE, fur: "#b6a58f", furD: "#9a8a76", outfit: "#2b2b36", outfit2: "#e8e0d0", scale: 1.0 },
  rival: { ...BASE_MOUSE, fur: "#7d7d8c", furD: "#5f5f6e", outfit: "#4a2f3d", outfit2: "#c94f4f", hat: "cap", hatColor: "#2a2440", scale: 1.0 },
  dancer: { ...BASE_MOUSE, fur: "#d8b48c", furD: "#b8926a", outfit: "#b45fd0", outfit2: "#ffd977", scale: 1.0 },
  marcher: { ...BASE_MOUSE, fur: "#c2ab92", furD: "#a48e77", outfit: "#8a1f3d", outfit2: "#e8b23a", hat: "cap", hatColor: "#e8b23a", scale: 1.0 },
  customer: { ...BASE_MOUSE, fur: "#bda98f", furD: "#9c8a72", outfit: "#3f6f8f", outfit2: "#e8e0d0", scale: 1.0 },
  pet: { ...BASE_MOUSE, fur: "#9b9bab", furD: "#7d7d8c", outfit: "#9b9bab", outfit2: "#b3b3c2", scale: 0.55 },
};

export function drawMouseSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: Dir,
  frame: number,
  palette: MousePalette,
  t: number,
  pose: "normal" | "dig" | "sit" | "eat" = "normal"
) {
  const flip = dir === "right";
  if (flip) {
    ctx.save();
    ctx.translate(r(x) * 2, 0);
    ctx.scale(-1, 1);
  }
  drawMouseBody(ctx, x, y, dir === "up" ? "up" : dir === "down" ? "down" : "left", frame, palette, t, pose);
  if (flip) ctx.restore();
}

function drawMouseBody(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: "down" | "up" | "left",
  frame: number,
  p: MousePalette,
  t: number,
  pose: "normal" | "dig" | "sit" | "eat"
) {
  const U = 2 * (p.scale ?? 1);
  const left = x - 7 * U;
  const top = y - 16 * U;
  const rect = (dx: number, dy: number, w: number, h: number, c: string) =>
    px(ctx, left + dx * U, top + dy * U, w * U, h * U, c);

  const fur = p.fur;
  const furD = p.furD;
  const outfit = p.outfit ?? fur;
  const eye = p.eye ?? "#2b2b33";
  const digging = pose === "dig";
  const eating = pose === "eat";
  const sitting = pose === "sit" || eating;
  const bob = eating
    ? -1.4 + Math.max(0, Math.sin(t * 4 + x * 0.08)) * 0.9
    : sitting
      ? -1.4
      : digging
        ? Math.sin(t * 9) * 0.7
        : frame === 1
          ? -0.6
          : 0;

  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(r(x), r(y - 1), r(8 * U), r(2.2 * U), 0, 0, Math.PI * 2);
  ctx.fill();

  const wig = sitting ? 0 : Math.sin(t * 7 + x * 0.05) * 1.1;
  rect(11.5, 9.5 + wig, 2.2, 1.2, furD);
  rect(13, 7.5 + wig * 1.4, 1.4, 2.2, furD);

  if (sitting) {
    // Legs stretched out in front of the bench, toes up.
    rect(3.4, 13.2, 2.6, 3.4, furD);
    rect(7.6, 13.2, 2.6, 3.4, furD);
    rect(3.4, 16.2, 2.6, 1.2, "#2b2b36");
    rect(7.6, 16.2, 2.6, 1.2, "#2b2b36");
  } else {
    const legA = frame === 1 ? 13 : 14;
    const legB = frame === 1 ? 14 : 13;
    rect(4, legA, 2.2, 2, furD);
    rect(7.8, legB, 2.2, 2, furD);
  }

  rect(3, 8 + bob, 8, 7, outfit);
  rect(2.4, 9.4 + bob, 9.2, 4.6, outfit);
  if (!p.outfit) rect(5, 11 + bob, 4, 3, p.belly ?? "#dccfba");

  if (digging) {
    // Both paws down in the trash, alternating.
    rect(1.6, 12.4 + (frame ? 0.8 : 0), 2, 2.6, outfit);
    rect(10.6, 12.4 + (frame ? 0 : 0.8), 2, 2.6, outfit);
  } else if (sitting) {
    // Hands resting on your knees.
    rect(1.8, 11.6, 1.8, 3.4, outfit);
    rect(10.4, 11.6, 1.8, 3.4, outfit);
  } else {
    const armSwing = frame === 1 ? 0.7 : 0;
    rect(1.6, 10.4 + armSwing, 1.6, 3, outfit);
    rect(10.8, 10.4 - armSwing, 1.6, 3, outfit);
  }

  rect(3, 2 + bob, 8, 6.4, fur);
  rect(2.4, 3.4 + bob, 9.2, 4.2, fur);
  if (facing !== "up") rect(5, 7 + bob, 4, 1.4, p.belly ?? "#dccfba");

  rect(1.4, 0 + bob, 3.2, 3.2, fur);
  rect(2, 0.7 + bob, 1.6, 1.6, p.earIn ?? "#e8a8b8");
  rect(9.4, 0 + bob, 3.2, 3.2, fur);
  rect(10, 0.7 + bob, 1.6, 1.6, p.earIn ?? "#e8a8b8");

  if (facing === "down") {
    rect(4.2, 4 + bob, 1.6, 2, eye);
    rect(8.2, 4 + bob, 1.6, 2, eye);
    rect(6.4, 6.4 + bob, 2, 1.2, p.nose ?? "#e8788f");
    rect(0.4, 5.4 + bob, 2, 0.7, furD);
    rect(11.6, 5.4 + bob, 2, 0.7, furD);
  } else if (facing === "left") {
    rect(3.6, 4 + bob, 1.6, 2, eye);
    rect(0.4, 6.2 + bob, 2.4, 1.2, p.nose ?? "#e8788f");
    rect(-0.6, 5.4 + bob, 2, 0.7, furD);
  } else {
    rect(4, 3.4 + bob, 6, 1.2, furD);
  }

  if (p.outfit2 && facing !== "up") rect(5.2, 7.6 + bob, 3.6, 1.2, p.outfit2);

  if (p.torn) {
    rect(6, 11.4, 1.8, 1.4, fur);
    rect(3.6, 12.4, 1.6, 1.4, furD);
    rect(8.8, 12.6, 1.6, 1, "#5b4a3a");
  }
  if (p.phone && facing !== "up") {
    rect(11.2, 9.6, 2.2, 3.6, "#20202a");
    rect(11.7, 10.1, 1.2, 1.8, "#7fe8ff");
  }
  if (p.glasses && facing !== "up") {
    rect(3.4, 3.6 + bob, 8.4, 1.7, "#15151c");
    rect(3.4, 3.3 + bob, 8.4, 0.6, "#e8b23a");
  }
  if (p.chain && facing !== "up") {
    rect(5.2, 9.2 + bob, 3.8, 0.8, "#f5c542");
    rect(6.6, 10 + bob, 1, 1.2, "#f5c542");
  }
  if (p.hat === "top") {
    rect(3.6, -2.6 + bob, 6.8, 3, p.hatColor ?? "#1f1f28");
    rect(2.6, -0.2 + bob, 8.8, 1, p.hatColor ?? "#1f1f28");
    rect(3.6, -1.2 + bob, 6.8, 0.8, "#8f2f3f");
  } else if (p.hat === "cap") {
    rect(3.2, 0.4 + bob, 7.6, 2, p.hatColor ?? "#2f6b3f");
    rect(1.4, 2 + bob, 4.6, 1.2, p.hatColor ?? "#2f6b3f");
  }
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: Dir,
  frame: number,
  stage: number,
  t: number,
  pose: "normal" | "dig" | "sit" | "eat" = "normal"
) {
  drawMouseSprite(ctx, x, y, dir, frame, paletteForStage(stage), t, pose);
}

/** Cooks: tall toque, apron, and a pan they keep flipping over the flame. */
function drawChefKit(ctx: CanvasRenderingContext2D, npc: Npc, t: number) {
  const U = 2 * (NPC_PALETTES.chef.scale ?? 1);
  const top = npc.y - 16 * U;
  // Toque.
  px(ctx, npc.x - 5 * U, top - 7 * U, 10 * U, 6 * U, "#f2f0fa");
  px(ctx, npc.x - 7 * U, top - 3 * U, 14 * U, 3 * U, "#dcdce6");
  // Apron strings at the back of the waist.
  px(ctx, npc.x - 6 * U, npc.y - 7 * U, 12 * U, 1.4 * U, "#dcdce6");
  // The pan: tilted, with the food jumping out of it.
  const flip = Math.sin(t * 5.2);
  const panX = npc.x + 13;
  const panY = npc.y - 8;
  px(ctx, panX, panY, 13, 3, "#3a3a48");
  px(ctx, panX + 12, panY - 1, 8, 2, "#5b5b6b");
  px(ctx, panX + 1, panY - 1 - Math.abs(flip) * 3, 10, 2, "#22222c");
  const foodY = panY - 4 - Math.abs(flip) * 9;
  px(ctx, panX + 3, foodY, 4, 3, "#e8b23a");
  px(ctx, panX + 8, foodY + 1, 3, 3, "#c94f4f");
  // Flame under the pan, flickering.
  const flame = 2 + Math.abs(Math.sin(t * 9)) * 3;
  px(ctx, panX + 2, panY + 3, 9, flame, "#ff8a3d");
  px(ctx, panX + 4, panY + 3, 5, flame * 0.6, "#ffd977");
}

/** Waiters: bow tie, and a tray held out in front. */
function drawWaiterKit(ctx: CanvasRenderingContext2D, npc: Npc, t: number) {
  const U = 2 * (NPC_PALETTES.waiter.scale ?? 1);
  px(ctx, npc.x - 2.4 * U, npc.y - 8 * U, 4.8 * U, 1.6 * U, "#c94f4f");
  px(ctx, npc.x - 1.2 * U, npc.y - 8.6 * U, 2.4 * U, 2.4 * U, "#e8e0d0");
  void t;
}

/** Whatever an npc is carrying: a waiter's tray or a takeaway box. */
function drawCarriedItem(ctx: CanvasRenderingContext2D, npc: Npc, t: number) {
  if (!npc.carry || !npc.moving) return;
  const dir = npc.dir;
  const ox = dir === "left" ? -15 : dir === "right" ? 15 : 0;
  const oy = dir === "up" ? -16 : dir === "down" ? 9 : 1;
  const x = npc.x + ox;
  const y = npc.y + oy;
  const bob = Math.sin(t * 9 + npc.x * 0.05) * 0.8;
  if (npc.carry === "plate") {
    px(ctx, x - 9, y - 2 + bob, 18, 3, "#c9c9d4");
    px(ctx, x - 6, y - 7 + bob, 12, 5, "#f2f0fa");
    px(ctx, x - 3, y - 9 + bob, 6, 2, "#dcdce6");
    px(ctx, x - 2, y - 10 + bob, 4, 2, "#ffd977");
  } else {
    px(ctx, x - 6, y - 8 + bob, 12, 9, "#c98a3a");
    px(ctx, x - 6, y - 8 + bob, 12, 2, "#e8b23a");
    px(ctx, x - 1, y - 8 + bob, 2, 9, "#8a5f2a");
  }
}

/** Joggers get a sweatband and a bit of motion blur in their wake. */
function drawJoggerKit(ctx: CanvasRenderingContext2D, npc: Npc, t: number) {
  const U = 2 * (NPC_PALETTES.jogger.scale ?? 1);
  px(ctx, npc.x - 8 * U, npc.y - 12 * U, 16 * U, 1.6 * U, "#ff2882");
  if (!npc.moving) return;
  const dir = npc.dir === "left" ? -1 : 1;
  ctx.globalAlpha = 0.25;
  for (let k = 1; k <= 2; k++) {
    px(ctx, npc.x - dir * (10 + k * 7), npc.y - 4 - k, 6, 2, "#cfd6ff");
  }
  ctx.globalAlpha = 1;
}

export function drawNpcSprite(ctx: CanvasRenderingContext2D, npc: Npc, t: number) {
  if (npc.kind === "courier") {
    drawCourierSprite(ctx, npc, t);
    return;
  }
  if (npc.kind === "busker") {
    drawMouseSprite(ctx, npc.x, npc.y, npc.dir, 0, NPC_PALETTES.busker, t);
    drawBuskerKit(ctx, npc, t);
    return;
  }
  const frame = npc.digging ? Math.floor(npc.anim * 8) % 2 : npc.moving ? Math.floor(npc.anim * 6) % 2 : 0;
  const pose = npc.sitting ? (npc.eating ? "eat" : "sit") : npc.digging ? "dig" : "normal";
  drawMouseSprite(ctx, npc.x, npc.y, npc.dir, frame, NPC_PALETTES[npc.kind], t, pose);
  if (npc.kind === "jogger") drawJoggerKit(ctx, npc, t);
  if (npc.kind === "chef") drawChefKit(ctx, npc, t);
  if (npc.kind === "waiter") drawWaiterKit(ctx, npc, t);
  drawCarriedItem(ctx, npc, t);
  if (npc.kind === "police") drawPoliceKit(ctx, npc, t);
  if (npc.kind === "golfer") drawGolfKit(ctx, npc, t);
}

/** A street musician with a guitar and a few notes drifting off. */
function drawBuskerKit(ctx: CanvasRenderingContext2D, npc: Npc, t: number) {
  const strum = Math.sin(t * 6) * 2;
  // Guitar held across the body.
  px(ctx, npc.x - 12, npc.y - 20 + strum * 0.4, 15, 11, "#a8562f");
  px(ctx, npc.x - 10, npc.y - 18 + strum * 0.4, 11, 7, "#c9741f");
  px(ctx, npc.x + 1, npc.y - 24 + strum, 4, 12, "#5b4a38");
  px(ctx, npc.x - 1, npc.y - 27 + strum, 7, 4, "#3a2f28");
  for (let i = 0; i < 3; i++) {
    const rise = ((t * 14 + i * 13) % 34) / 34;
    ctx.globalAlpha = Math.max(0, 0.75 - rise);
    const nx = npc.x + 10 + i * 5 + Math.sin(t * 2 + i) * 3;
    px(ctx, nx, npc.y - 20 - rise * 26, 5, 5, "#ffd977");
    px(ctx, nx + 5, npc.y - 24 - rise * 26, 2, 9, "#ffd977");
    ctx.globalAlpha = 1;
  }
}

/** A delivery rider: scooter, rider and the insulated parcel box on the back. */
function drawCourierSprite(ctx: CanvasRenderingContext2D, npc: Npc, t: number) {
  const dir = npc.dir;
  const moving = npc.moving;
  const bob = moving ? Math.sin(t * 10) * 1.1 : 0;
  const bikeY = npc.y - 1;
  drawVehicle(ctx, "bike", npc.x, bikeY + bob, dir, t, { style: VEHICLE_COLORS.red, brake: !moving });
  // Insulated parcel box strapped on the rack behind the saddle.
  const back = dir === "left" ? 9 : -23;
  px(ctx, npc.x + back, npc.y - 17 + bob, 14, 13, "#e8541f");
  px(ctx, npc.x + back + 2, npc.y - 15 + bob, 10, 3, "#f2f0fa");
  px(ctx, npc.x + back + 2, npc.y - 10 + bob, 10, 2, "#c9741f");
  // Rider: a touch smaller than a walker, feet down on the seat, not floating.
  drawMouseSprite(ctx, npc.x, npc.y + 2 + bob, dir, moving ? Math.floor(t * 8) % 2 : 0, NPC_PALETTES.courier, t);
  if (!moving && (npc.stop ?? 0) > 0) {
    // Arm out, handing the parcel over at the door.
    px(ctx, npc.x + (dir === "left" ? -22 : 14), npc.y - 13, 11, 9, "#c9741f");
    px(ctx, npc.x + (dir === "left" ? -20 : 16), npc.y - 11, 7, 2, "#f2f0fa");
  }
}

/** Club + ball, swung on a loop while the golfer lines up a shot. */
function drawGolfKit(ctx: CanvasRenderingContext2D, npc: Npc, t: number) {
  const x = npc.x;
  const y = npc.y;
  if (!npc.swinging) {
    // Bag on the shoulder.
    px(ctx, x + 6, y - 22, 5, 16, "#4a3f31");
    px(ctx, x + 5, y - 24, 7, 4, "#c94f4f");
    return;
  }
  const swing = Math.sin(t * 4.2);
  const angle = -0.9 + (swing + 1) * 0.75;
  const cx = x + (npc.dir === "left" ? -8 : 8);
  const cy = y - 14;
  ctx.save();
  ctx.translate(r(cx), r(cy));
  ctx.rotate(angle);
  px(ctx, 0, -1, 16, 3, "#8a8a96");
  px(ctx, 14, -3, 5, 7, "#2b2b36");
  ctx.restore();
  if (swing > 0.7) px(ctx, cx + (npc.dir === "left" ? -18 : 18), y - 4, 4, 4, "#f2f0fa");
}

/** Hi-vis vest, white gloves and — while directing traffic — a raised arm plus a whistle. */
function drawPoliceKit(ctx: CanvasRenderingContext2D, npc: Npc, t: number) {
  const x = npc.x;
  const y = npc.y;
  // Reflective vest bands.
  px(ctx, x - 7, y - 20, 14, 3, "#f2e35a");
  px(ctx, x - 7, y - 14, 14, 3, "#f2e35a");
  if (!npc.directing) return;
  const wave = Math.sin(t * 3.4) * 2;
  const side = npc.dir === "left" ? -1 : 1;
  // Raised, gloved arm.
  px(ctx, x + side * 9 - 2, y - 26 + wave, 4, 12, "#2f3f6b");
  px(ctx, x + side * 9 - 3, y - 29 + wave, 6, 4, "#eef2f8");
  // Whistle + air.
  px(ctx, x + side * 6 - 1, y - 22, 3, 3, "#d8d8e0");
  const pulse = 0.35 + 0.65 * Math.abs(Math.sin(t * 4.2));
  ctx.strokeStyle = `rgba(255,255,255,${pulse.toFixed(2)})`;
  ctx.lineWidth = 1.6;
  for (let k = 0; k < 2; k++) {
    ctx.beginPath();
    ctx.arc(r(x + side * 10), r(y - 21), r(4 + k * 3), -0.9 + (side < 0 ? Math.PI : 0), 0.9 + (side < 0 ? Math.PI : 0));
    ctx.stroke();
  }
}

/** The green circle that marks a delivery pickup / drop-off. */
export function drawQuestMarker(ctx: CanvasRenderingContext2D, mx: number, my: number, t: number, label: string) {
  const pulse = 1 + Math.sin(t * 3.2) * 0.07;
  ctx.fillStyle = "rgba(67,209,122,0.16)";
  ctx.beginPath();
  ctx.ellipse(r(mx), r(my), r(20 * pulse), r(10 * pulse), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(67,209,122,0.95)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(r(mx), r(my), r(20 * pulse), r(10 * pulse), 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(67,209,122,0.32)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(r(mx), r(my), r(29 * pulse), r(14.5 * pulse), 0, 0, Math.PI * 2);
  ctx.stroke();
  const bob = Math.sin(t * 3.2) * 3;
  ctx.fillStyle = "#43d17a";
  ctx.beginPath();
  ctx.moveTo(r(mx - 8), r(my - 32 + bob));
  ctx.lineTo(r(mx + 8), r(my - 32 + bob));
  ctx.lineTo(r(mx), r(my - 20 + bob));
  ctx.closePath();
  ctx.fill();
  ctx.font = '700 11px "Be Vietnam Pro", system-ui, sans-serif';
  const tw = ctx.measureText(label).width;
  const bw = tw + 18;
  ctx.fillStyle = "rgba(10,22,15,0.92)";
  roundRect(ctx, mx - bw / 2, my - 60 + bob, bw, 19, 5);
  ctx.fill();
  ctx.strokeStyle = "#43d17a";
  ctx.lineWidth = 1.5;
  roundRect(ctx, mx - bw / 2, my - 60 + bob, bw, 19, 5);
  ctx.stroke();
  ctx.fillStyle = "#d9ffe6";
  ctx.textAlign = "center";
  ctx.fillText(label, r(mx), r(my - 46 + bob));
  ctx.textAlign = "left";
}

/** A takeaway box held in front of whoever is carrying an order. */
export function drawParcel(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const bob = Math.sin(t * 8) * 1.2;
  px(ctx, x - 7, y - 16 + bob, 14, 11, "#c98a3a");
  px(ctx, x - 7, y - 16 + bob, 14, 3, "#e8b23a");
  px(ctx, x - 1, y - 16 + bob, 2, 11, "#8a5f2a");
  px(ctx, x - 7, y - 12 + bob, 14, 1, "#8a5f2a");
}

/**
 * The thing you are about to interact with gets a soft ring on the pavement.
 * No text over the mouse: the label lives in the bar along the bottom edge.
 */
export function drawTargetRing(
  ctx: CanvasRenderingContext2D,
  tx: number,
  ty: number,
  t: number,
  accent: string
) {
  const cx = Math.round(tx * TILE + TILE / 2);
  const cy = Math.round(ty * TILE + TILE - 6);
  const pulse = 0.55 + Math.sin(t * 3.4) * 0.45;
  ctx.save();
  ctx.globalAlpha = 0.35 + pulse * 0.45;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  roundRect(ctx, cx - 13 - pulse * 2, cy - 5 - pulse, 26 + pulse * 4, 10 + pulse * 2, 5);
  ctx.stroke();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = accent;
  roundRect(ctx, cx - 13 - pulse * 2, cy - 5 - pulse, 26 + pulse * 4, 10 + pulse * 2, 5);
  ctx.fill();
  ctx.restore();
}

/** Night, evening and dawn wash over everything drawn before it. */
export function drawDayTint(ctx: CanvasRenderingContext2D, vw: number, vh: number, color: string, alpha: number) {
  if (alpha <= 0.001) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, vw, vh);
  ctx.restore();
}

/** Warm pool of light under a street lamp — the city's night face. */
export function drawLampGlow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, strength: number, warm = true) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  const inner = warm ? "255,214,120" : "255,180,120";
  grad.addColorStop(0, `rgba(${inner},${0.5 * strength})`);
  grad.addColorStop(0.55, `rgba(${inner},${0.18 * strength})`);
  grad.addColorStop(1, "rgba(255,214,120,0)");
  ctx.save();
  ctx.fillStyle = grad;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();
}

/** Falling rain, drawn over the world while the weather is wet. */
export function drawRain(ctx: CanvasRenderingContext2D, drops: { x: number; y: number; len: number; speed: number }[], t: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(190,220,255,0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const drop of drops) {
    const y = drop.y + ((t * drop.speed) % 900);
    ctx.moveTo(Math.round(drop.x), Math.round(y % 900) - 100);
    ctx.lineTo(Math.round(drop.x) - 2, Math.round((y % 900) - 100) + drop.len);
  }
  ctx.stroke();
  ctx.restore();
}

/** A brolly, because it is raining and mice do not like wet fur. */
export function drawUmbrella(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  px(ctx, x - 1, y - 4, 2, 8, "#6b5a45");
  px(ctx, x - 9, y - 8, 18, 4, color);
  px(ctx, x - 6, y - 11, 12, 3, color);
  px(ctx, x - 2, y - 13, 4, 2, color);
}

/** The bus shelter: pole, flag and a bench to wait on. */
export function drawBusStop(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, label: string) {
  px(ctx, x + 12, y + 6, 4, 26, "#4a4560");
  px(ctx, x + 4, y - 12, 22, 16, "#1d2a4a");
  px(ctx, x + 4, y - 12, 22, 3, "#4f7fd6");
  ctx.font = '700 9px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillStyle = "#dfe8ff";
  ctx.textAlign = "center";
  ctx.fillText("BUS", r(x + 15), r(y - 2));
  ctx.textAlign = "left";
  ctx.save();
  ctx.globalAlpha = 0.6 + Math.sin(t * 2.4) * 0.4;
  px(ctx, x + 6, y + 2, 18, 3, "#ffd977");
  ctx.restore();
  void label;
}

/** A taxi idling at the rank. */
export function drawTaxi(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  const bob = Math.sin(t * 2) * 0.4;
  px(ctx, x + 2, y - 2 + bob, 60, 12, "#e8b23a");
  px(ctx, x + 4, y - 8 + bob, 56, 8, "#f5c85c");
  px(ctx, x + 12, y - 7 + bob, 16, 6, "#8fd8ff");
  px(ctx, x + 34, y - 7 + bob, 16, 6, "#8fd8ff");
  px(ctx, x + 26, y - 12 + bob, 12, 5, "#2a2440");
  ctx.font = '700 6px "Press Start 2P", monospace';
  ctx.fillStyle = "#ffd977";
  ctx.fillText("TAXI", r(x + 27), r(y - 8 + bob));
  px(ctx, x + 10, y + 10 + bob, 12, 8, "#1b1b24");
  px(ctx, x + 42, y + 10 + bob, 12, 8, "#1b1b24");
  px(ctx, x + 60, y - 2 + bob, 4, 5, "#fff3c4");
}

/** The city bus — three windows and a lot of patience. */
export function drawBusBody(ctx: CanvasRenderingContext2D, x: number, y: number, dir: 1 | -1, t: number) {
  const bob = Math.sin(t * 3) * 0.3;
  const w = 104;
  px(ctx, x - w / 2, y - 16 + bob, w, 26, "#3f8f5c");
  px(ctx, x - w / 2 + 2, y - 24 + bob, w - 4, 10, "#4fa96e");
  for (let i = 0; i < 4; i++) px(ctx, x - w / 2 + 8 + i * 24, y - 22 + bob, 18, 7, "#bfe6ff");
  px(ctx, x - w / 2 + 6, y - 4 + bob, w - 12, 10, "#8fd8ff");
  px(ctx, x - w / 2 + 10, y + 10 + bob, 16, 8, "#1b1b24");
  px(ctx, x + w / 2 - 26, y + 10 + bob, 16, 8, "#1b1b24");
  px(ctx, dir > 0 ? x + w / 2 - 2 : x - w / 2 - 2, y - 8 + bob, 4, 6, "#fff3c4");
  ctx.font = '700 7px "Press Start 2P", monospace';
  ctx.fillStyle = "#eaffef";
  ctx.fillText("BUS", r(x - 12), r(y - 2 + bob));
}

/** Party kit: dancers get sparkle, the parade gets a sash. */
export function drawDancerKit(ctx: CanvasRenderingContext2D, npc: Npc, t: number) {
  const sway = Math.sin(t * 6 + npc.x * 0.05);
  const top = npc.y - 16;
  px(ctx, npc.x - 8 + sway * 3, top - 2, 3, 7, "#ff2882");
  px(ctx, npc.x + 5 + sway * 3, top - 2, 3, 7, "#7fe8ff");
  px(ctx, npc.x - 3, top - 8, 6, 3, "#ffd977");
}

export function drawMarcherKit(ctx: CanvasRenderingContext2D, npc: Npc, t: number) {
  const sway = Math.sin(t * 4 + npc.x * 0.02);
  px(ctx, npc.x - 6, npc.y - 12, 12, 3, "#e8b23a");
  px(ctx, npc.x + 7 + sway, npc.y - 26, 2, 14, "#8a5f2a");
  px(ctx, npc.x + 5 + sway, npc.y - 30, 6, 5, "#c94f4f");
}

/** Crumb the pet rat, trotting along behind you. */
export function drawPetRat(ctx: CanvasRenderingContext2D, x: number, y: number, dir: Dir, t: number) {
  const flip = dir === "left";
  const bob = Math.sin(t * 8) * 0.6;
  const cx = Math.round(x);
  const cy = Math.round(y + bob);
  ctx.save();
  if (flip) {
    ctx.translate(cx, cy);
    ctx.scale(-1, 1);
    ctx.translate(-cx, -cy);
  }
  px(ctx, cx - 7, cy - 5, 13, 6, "#9b9bab");
  px(ctx, cx + 5, cy - 6, 6, 5, "#b3b3c2");
  px(ctx, cx + 10, cy - 4, 3, 3, "#d8a0b8");
  px(ctx, cx + 7, cy - 9, 3, 3, "#b3b3c2");
  px(ctx, cx - 10, cy - 3, 6, 2, "#9b9bab");
  px(ctx, cx - 2, cy + 1, 3, 3, "#7d7d8c");
  px(ctx, cx + 3, cy + 1, 3, 3, "#7d7d8c");
  ctx.restore();
}

/** Small speech bubble used when two locals stop for a natter. */
export function drawChatBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, t: number) {
  ctx.font = '600 10px "Be Vietnam Pro", system-ui, sans-serif';
  const tw = ctx.measureText(text).width;
  const w = tw + 14;
  const h = 18;
  const bx = Math.round(x - w / 2);
  const by = Math.round(y - h);
  const bob = Math.sin(t * 2.2) * 0.6;
  ctx.save();
  ctx.globalAlpha = 0.96;
  px(ctx, bx + 1, by + 1 + bob, w, h, "rgba(0,0,0,0.35)");
  px(ctx, bx, by + bob, w, h, "#f4f1ff");
  px(ctx, bx, by + bob, w, 2, "#ffb3d4");
  // Tail.
  px(ctx, Math.round(x) - 2, by + h + bob, 4, 3, "#f4f1ff");
  px(ctx, Math.round(x) - 3, by + h + 3 + bob, 2, 2, "#f4f1ff");
  ctx.fillStyle = "#2a2440";
  ctx.textAlign = "center";
  ctx.fillText(text, Math.round(x), Math.round(by + 13 + bob));
  ctx.textAlign = "left";
  ctx.restore();
}

export function drawMinimap(
  ctx: CanvasRenderingContext2D,
  world: World,
  pxPos: number,
  pyPos: number,
  vw: number,
  quest: { x: number; y: number } | null = null
) {
  const S = 2;
  const w = COLS * S;
  const h = ROWS * S;
  const mx = vw - w - 14;
  const my = 64;
  ctx.fillStyle = "rgba(10,9,20,0.85)";
  roundRect(ctx, mx - 4, my - 4, w + 8, h + 8, 4);
  ctx.fill();
  ctx.strokeStyle = "#2e2a45";
  ctx.lineWidth = 2;
  roundRect(ctx, mx - 4, my - 4, w + 8, h + 8, 4);
  ctx.stroke();
  const zones: [number, number, string][] = [
    [0, WALL_A - 1, "#6a5541"],
    [WALL_A + 1, WALL_B - 1, "#5d6376"],
    [WALL_B + 1, COLS - 1, "#3e7a49"],
  ];
  for (const [a, b, c] of zones) {
    ctx.fillStyle = c;
    ctx.fillRect(mx + a * S, my, (b - a + 1) * S, h);
  }
  ctx.fillStyle = "#33333c";
  ctx.fillRect(mx, my + ROAD_TOP * S, w, 3 * S);
  // walls + gates
  ctx.fillStyle = "#8d87a0";
  ctx.fillRect(mx + WALL_A * S, my, S, h);
  ctx.fillRect(mx + WALL_B * S, my, S, h);
  ctx.fillStyle = world.gateOpen ? "#43d17a" : "#e8b23a";
  ctx.fillRect(mx + WALL_B * S, my + ROAD_TOP * S, S, 3 * S);
  ctx.fillStyle = "#7fe8ff";
  ctx.fillRect(mx + 37 * S, my + 14 * S, 2 * S, 4 * S);

  const MARKER_COLORS: Record<string, string> = {
    job: "#8fe8b0",
    shop: "#ffd977",
    bed: "#ffffff",
    wheel: "#7fe8ff",
    gate: "#e8b23a",
    mansion: "#ff8ab8",
    npc: "#b78aff",
    trash: "#9a9a7a",
  };
  for (const target of world.interactables) {
    if (target.kind === "bench" || target.kind === "gym") continue;
    ctx.fillStyle = MARKER_COLORS[target.kind] ?? "#ffffff";
    ctx.fillRect(r(mx + target.x * S), r(my + target.y * S), 2, 2);
  }
  if (quest) {
    ctx.fillStyle = "#43d17a";
    ctx.fillRect(r(mx + quest.x * S - 1), r(my + quest.y * S - 1), 4, 4);
    ctx.strokeStyle = "#0d2a17";
    ctx.lineWidth = 1;
    ctx.strokeRect(r(mx + quest.x * S - 1), r(my + quest.y * S - 1), 4, 4);
  }

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(r(mx + (pxPos / TILE) * S), r(my + (pyPos / TILE) * S), r(3.5), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ff2882";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}
