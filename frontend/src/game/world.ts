// Squeek Life — the world: three districts split by city walls, plus interaction points.
import { BUS_FARE, RIVAL_NAME, type JobId, type ShopId } from "./data";

export const TILE = 32;
export const COLS = 68;
export const ROWS = 44;
export const ROAD_TOP = 21; // rows 21..23 are the main road through all three districts
export const WALL_A = 20; // slums | office district (open archway)
export const WALL_B = 45; // office district | rich district (golden gate)
export const GATE_ROWS = [ROAD_TOP, ROAD_TOP + 1, ROAD_TOP + 2];
// Crosswalks sit between shop fronts, never directly in front of a door.
export const CROSSWALKS = [12, 26, 39, 58];

export type TileKind = "grass" | "dirt" | "road" | "sidewalk" | "plaza" | "lawn";
export type Zone = "slums" | "office" | "rich";
export type Dir = "down" | "up" | "left" | "right";

export interface Building {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  zone: Zone;
  style: "shack" | "shop" | "hub" | "office" | "tower" | "house" | "mansion" | "machine" | "villa" | "hotel" | "restaurant" | "mall" | "salon" | "garage" | "apartment" | "shack2";
  sign?: string;
  door?: { x: number; y: number };
}

export interface WorldObject {
  id: string;
  type:
    | "tree"
    | "bench"
    | "lamp"
    | "fountain"
    | "sign"
    | "statue"
    | "trashcan"
    | "supercar"
    | "trafficlight"
    | "parkingbay"
    | "foodcart"
    | "busstop"
    | "taxi"
    | "golfgreen"
    | "golfbunker"
    | "golfflag"
    | "bike"
    | "laundry"
    | "bush"
    | "gym"
    | "pond"
    | "table";
  x: number;
  y: number;
  w: number;
  h: number;
  solid: boolean;
  text?: string;
  variant?: string;
}

export interface TrashSpot {
  id: string;
  x: number;
  y: number;
  kind: "dumpster" | "trashbag";
}

export interface Interactable {
  id: string;
  kind:
    | "job"
    | "shop"
    | "bed"
    | "gate"
    | "wheel"
    | "npc"
    | "mansion"
    | "trash"
    | "vehicle"
    | "hotel"
    | "mall"
    | "garage"
    | "home"
    | "busstop"
    | "taxi"
    | "bench"
    | "gym"
    | "bus"
    | "taxi"
    | "shift";
  x: number; // tile coords (center of the tile)
  y: number;
  label: string;
  /** Which key triggers it — E for the world, F for your ride. */
  key?: "E" | "F";
  job?: JobId;
  shop?: ShopId;
  npcId?: string;
  spotId?: string;
  /** The bench / machine this prompt belongs to. */
  objId?: string;
}

export interface Npc {
  id: string;
  name: string;
  x: number; // px
  y: number;
  hx: number;
  hy: number;
  r: number; // wander radius in tiles
  kind:
    | "rival"
    | "dancer"
    | "marcher"
    | "customer"
    | "pet"
    | "scavenger"
    | "worker"
    | "richrat"
    | "guard"
    | "kid"
    | "citizen"
    | "police"
    | "golfer"
    | "staff"
    | "guest"
    | "courier"
    | "resident"
    | "vendor"
    | "busker"
    | "jogger"
    | "chef"
    | "waiter";
  /** Park benches: this one is sitting down instead of standing. */
  sitting?: boolean;
  /** Diners: seated with a bowl in front of them. */
  eating?: boolean;
  /** Something carried in the paws while moving: a tray or a takeaway box. */
  carry?: "plate" | "box";
  /** Countdown while this npc is inside a building (hidden from the street). */
  vanishFor?: number;
  /** A shift customer walking up to the counter. */
  shiftGuest?: boolean;
  order?: string;
  served?: boolean;
  /** Dancing at the festival, marching in the parade. */
  dancing?: boolean;
  marching?: boolean;
  /** Umbrella up in the rain. */
  umbrella?: boolean;
  /** Pet rat trailing the player. */
  following?: boolean;
  /** Gone home for the night — not on the street, not talkable. */
  offDuty?: boolean;
  /** Stays out after dark (night owls, cops, couriers). */
  nightOwl?: boolean;
  /** The rival scavenger's current target pile. */
  raidTarget?: string;
  raidFor?: number;
  /** Seconds left in a pavement conversation (0 = not talking). */
  chatFor?: number;
  chatTotal?: number;
  chatConv?: number;
  chatRole?: number;
  chatLine?: string;
  chatCool?: number;
  /** Cached walk path to the current waypoint. */
  path?: { x: number; y: number }[] | null;
  pathFor?: number;
  pathAt?: number;
  directing?: boolean;
  swinging?: boolean;
  /** Couriers follow a fixed route instead of wandering. */
  route?: { x: number; y: number; wait?: number; vanish?: number }[];
  routeIndex?: number;
  stop?: number;
  dir: Dir;
  moving: boolean;
  anim: number;
  target: { x: number; y: number } | null;
  pause: number;
  timer: number;
  hidden: boolean;
  digging: boolean;
  goingInside: boolean;
  digPuff: number;
  lines: string[];
}

export interface World {
  tiles: TileKind[][];
  solid: boolean[][];
  buildings: Building[];
  objects: WorldObject[];
  interactables: Interactable[];
  npcs: Npc[];
  zoneLabels: { x: number; y: number; text: string }[];
  spawn: { x: number; y: number };
  gateTiles: { x: number; y: number }[];
  gateOpen: boolean;
  wheelActive: boolean;
  trashSpots: TrashSpot[];
  /** Where the bus pulls in, and where the taxi rank waits. */
  busStops: { id: string; x: number; y: number; label: string }[];
  taxiRank: { x: number; y: number };
  /** Staff spots behind each food cart — where a shift is worked from. */
  shiftSpots: { id: string; name: string; x: number; y: number; counterX: number; counterY: number; doorX: number; doorY: number }[];
  officeDoors: { x: number; y: number }[];
}

/** Where a bought vehicle waits when it is not being ridden (tile coords). */
export const PARK_BAY: Record<"bicycle" | "motorbike" | "car", { x: number; y: number }> = {
  bicycle: { x: 39.5, y: 26.6 },
  motorbike: { x: 38.5, y: 26.6 },
  car: { x: 43.5, y: 26.6 },
};

/** The green park behind the office towers: cols 21–44, rows 2–8. */
export const PARK = { x: 21, y: 2, w: 24, h: 7 };

/** What each outdoor gym machine is called in its prompt. */
const GYM_NAMES: Record<string, string> = {
  treadmill: "treadmill",
  rower: "rowing machine",
  press: "chest press",
  pullup: "pull-up bar",
};

/** Crosswalks that get their own traffic signal + patrol officer. */
export const SIGNAL_COLUMNS = CROSSWALKS;
export const COP_CROSSWALK = 26;

const zoneOf = (col: number): Zone => (col <= WALL_A - 1 ? "slums" : col >= WALL_B + 1 ? "rich" : "office");

export function buildWorld(): World {
  const tiles: TileKind[][] = [];
  for (let y = 0; y < ROWS; y++) {
    const row: TileKind[] = [];
    for (let x = 0; x < COLS; x++) row.push(x <= WALL_A - 1 ? "dirt" : x <= WALL_B - 1 ? "plaza" : "lawn");
    tiles.push(row);
  }
  const solid: boolean[][] = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => false));

  const fill = (x: number, y: number, w: number, h: number, kind: TileKind) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (tiles[j] && tiles[j][i] !== undefined) tiles[j][i] = kind;
  };
  const block = (x: number, y: number, w: number, h: number) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (solid[j] && solid[j][i] !== undefined) solid[j][i] = true;
  };

  // Main road + sidewalks across every district.
  fill(0, ROAD_TOP, COLS, 3, "road");
  fill(0, ROAD_TOP - 1, COLS, 1, "sidewalk");
  fill(0, ROAD_TOP + 3, COLS, 1, "sidewalk");

  // --- Squeek Park: the green lung behind the office towers (cols 21–44, rows 2–8) ---
  fill(PARK.x, PARK.y, PARK.w, PARK.h, "lawn");
  // Two ways in from the plaza, plus a running loop the joggers can circle.
  fill(21, 2, 1, 18, "sidewalk");
  fill(38, 2, 1, 19, "sidewalk");
  fill(22, 3, 22, 1, "sidewalk");
  fill(22, 7, 22, 1, "sidewalk");
  fill(22, 3, 1, 5, "sidewalk");
  fill(43, 3, 1, 5, "sidewalk");

  // Only one wall left: the golden gate into the rich district. The slums and
  // the office district run straight into each other — no fence in between.
  for (let y = 0; y < ROWS; y++) {
    if (GATE_ROWS.includes(y)) continue;
    solid[y][WALL_B] = true;
  }
  // The golden gate starts locked.
  for (const row of GATE_ROWS) solid[row][WALL_B] = true;

  const buildings: Building[] = [];
  const addBuilding = (b: Omit<Building, "zone"> & { zone?: Zone }) => {
    const building: Building = { zone: b.zone ?? zoneOf(b.x + Math.floor(b.w / 2)), ...b };
    buildings.push(building);
    block(b.x, b.y, b.w, b.h);
  };

  // --- District 1: the slums (cols 0–19) ---
  addBuilding({ id: "home", x: 2, y: 14, w: 5, h: 5, style: "shack", sign: "Squeek's home", door: { x: 4, y: 18 } });
  addBuilding({ id: "shack-a", x: 9, y: 15, w: 4, h: 4, style: "shack" });
  addBuilding({ id: "shack-b", x: 3, y: 28, w: 5, h: 4, style: "shack" });
  addBuilding({ id: "shack-c", x: 10, y: 27, w: 4, h: 5, style: "shack" });
  // The slums keep growing: a crowded strip of shacks up top and a warren of
  // huts below, packed so tightly the alleys barely fit a motorbike.
  addBuilding({ id: "shack-d", x: 1, y: 9, w: 4, h: 4, style: "shack2" });
  addBuilding({ id: "shack-e", x: 6, y: 8, w: 4, h: 5, style: "shack2" });
  addBuilding({ id: "shack-f", x: 11, y: 9, w: 4, h: 4, style: "shack2" });
  addBuilding({ id: "shack-g", x: 16, y: 8, w: 3, h: 5, style: "shack2" });
  addBuilding({ id: "shack-h", x: 0, y: 33, w: 5, h: 4, style: "shack2" });
  addBuilding({ id: "shack-i", x: 6, y: 33, w: 5, h: 4, style: "shack2" });
  addBuilding({ id: "shack-j", x: 12, y: 32, w: 5, h: 5, style: "shack2" });
  addBuilding({ id: "shack-k", x: 0, y: 38, w: 5, h: 5, style: "shack2" });
  addBuilding({ id: "shack-l", x: 6, y: 38, w: 5, h: 5, style: "shack2" });
  addBuilding({ id: "shack-m", x: 12, y: 38, w: 5, h: 5, style: "shack2" });
  addBuilding({ id: "shack-n", x: 17, y: 33, w: 2, h: 3, style: "shack2" });
  addBuilding({ id: "shack-o", x: 17, y: 37, w: 2, h: 3, style: "shack2" });
  addBuilding({ id: "shack-p", x: 17, y: 41, w: 2, h: 3, style: "shack2" });
  addBuilding({ id: "food-stall", x: 14, y: 14, w: 5, h: 5, style: "shop", sign: "Food stall", door: { x: 16, y: 18 } });
  addBuilding({ id: "clothing", x: 13, y: 27, w: 6, h: 5, style: "shop", sign: "Clothing store", door: { x: 16, y: 27 } });

  // --- District 2: the office district (cols 21–44) ---
  addBuilding({ id: "tower-a", x: 22, y: 11, w: 6, h: 8, style: "office", sign: "Office Tower", door: { x: 24, y: 18 } });
  addBuilding({ id: "tower-b", x: 30, y: 9, w: 7, h: 10, style: "tower", sign: "Business Tower", door: { x: 32, y: 18 } });
  addBuilding({ id: "corp-hq", x: 28, y: 10, w: 2, h: 9, style: "tower", sign: "Corp HQ", door: { x: 28, y: 18 } });
  addBuilding({ id: "tower-c", x: 39, y: 11, w: 6, h: 8, style: "office", sign: "Startup Hub", door: { x: 41, y: 18 } });
  addBuilding({ id: "wheely", x: 37, y: 14, w: 2, h: 4, style: "machine", sign: "WHEELY9000" });
  addBuilding({ id: "delivery-hub", x: 22, y: 27, w: 6, h: 5, style: "hub", sign: "Delivery Hub", door: { x: 24, y: 27 } });
  addBuilding({ id: "electronics", x: 30, y: 27, w: 6, h: 5, style: "shop", sign: "Electronics", door: { x: 32, y: 27 } });
  addBuilding({ id: "showroom", x: 38, y: 27, w: 7, h: 5, style: "shop", sign: "Car Showroom", door: { x: 41, y: 27 } });
  // The south side of the office district: a mall, services and mid-tier housing.
  // Two-tile street at rows 32–33, then a block of services and housing with
  // open alleys (row 39/40 and column 34) so nothing is ever walled off.
  addBuilding({ id: "mall", x: 21, y: 34, w: 13, h: 6, style: "mall", sign: "Squeek Mall", door: { x: 27, y: 34 } });
  addBuilding({ id: "salon", x: 35, y: 34, w: 5, h: 5, style: "salon", sign: "Clip & Squeak Salon", door: { x: 37, y: 34 } });
  addBuilding({ id: "garage", x: 40, y: 34, w: 5, h: 5, style: "garage", sign: "Grease & Sons Garage", door: { x: 42, y: 34 } });
  addBuilding({ id: "apt-a", x: 35, y: 40, w: 5, h: 4, style: "apartment", sign: "Cheddar Court", door: { x: 37, y: 40 } });
  addBuilding({ id: "apt-b", x: 40, y: 40, w: 5, h: 4, style: "apartment", sign: "Brie Terrace", door: { x: 42, y: 40 } });
  addBuilding({ id: "apt-c", x: 21, y: 41, w: 12, h: 3, style: "apartment", sign: "Muenster Row", door: { x: 26, y: 41 } });

  // --- District 3: the rich district (cols 46–67) ---
  addBuilding({ id: "mansion", x: 56, y: 27, w: 8, h: 7, style: "mansion", sign: "Squeek Mansion", door: { x: 60, y: 27 } });
  addBuilding({ id: "hotel", x: 46, y: 27, w: 9, h: 8, style: "hotel", sign: "Grand Squeek Hotel", door: { x: 50, y: 27 } });
  addBuilding({ id: "restaurant", x: 56, y: 36, w: 8, h: 7, style: "restaurant", sign: "Golden Fork · 5★", door: { x: 60, y: 36 } });
  addBuilding({ id: "villa-a", x: 48, y: 12, w: 6, h: 6, style: "villa", sign: "Villa Aurelia", door: { x: 51, y: 17 } });
  addBuilding({ id: "villa-b", x: 57, y: 11, w: 7, h: 7, style: "villa", sign: "Villa Blanc", door: { x: 60, y: 17 } });
  addBuilding({ id: "villa-c", x: 65, y: 13, w: 3, h: 5, style: "villa", door: { x: 66, y: 17 } });

  const objects: WorldObject[] = [];
  const addObject = (o: Omit<WorldObject, "id"> & { id?: string }) => {
    const obj: WorldObject = { id: o.id ?? `${o.type}-${o.x}-${o.y}`, ...o };
    objects.push(obj);
    if (obj.solid) block(obj.x, obj.y, obj.w, obj.h);
    return obj;
  };

  // One neat avenue of shade trees along each pavement — evenly spaced, and
  // never in front of a shop door.
  for (const [row, off] of [[ROAD_TOP - 1, 0], [ROAD_TOP + 3, 3]] as [number, number][]) {
    for (let x = 3 + off; x < COLS - 2; x += 5) {
      if (CROSSWALKS.some((c) => Math.abs(c - x) <= 1)) continue;
      addObject({ type: "tree", x, y: row, w: 1, h: 1, solid: false });
    }
  }

  // Street lamps along both sidewalks (skipping the walls).
  for (let x = 4; x < COLS - 2; x += 7) {
    if (x === WALL_A || x === WALL_B) continue;
    addObject({ type: "lamp", x, y: ROAD_TOP - 1, w: 1, h: 1, solid: false });
    if (x % 14 === 4) addObject({ type: "lamp", x: x + 3, y: ROAD_TOP + 3, w: 1, h: 1, solid: false });
  }
  addObject({ type: "trashcan", x: 27, y: 19, w: 1, h: 1, solid: false });
  addObject({ type: "trashcan", x: 35, y: 25, w: 1, h: 1, solid: false });

  // Office district greenery + benches.
  for (const [tx, ty] of [[28, 31], [36, 31]]) {
    addObject({ type: "tree", x: tx, y: ty, w: 1, h: 1, solid: false });
  }
  addObject({ type: "bench", x: 24, y: 32, w: 1, h: 1, solid: true });
  addObject({ type: "bench", x: 33, y: 32, w: 1, h: 1, solid: true });
  addObject({ type: "bench", x: 41, y: 32, w: 1, h: 1, solid: true });

  // Rich district: hotel forecourt, supercars, greenery.
  addObject({ type: "fountain", x: 46, y: 25, w: 2, h: 2, solid: true });
  addObject({ type: "fountain", x: 64, y: 34, w: 2, h: 2, solid: true });
  addObject({ type: "statue", x: 55, y: 18, w: 1, h: 1, solid: true });
  addObject({ type: "supercar", x: 54, y: 25, w: 2, h: 1, solid: true, variant: "crimson" });
  addObject({ type: "supercar", x: 62, y: 25, w: 2, h: 1, solid: true, variant: "aqua" });
  addObject({ type: "supercar", x: 49, y: 25, w: 2, h: 1, solid: true, variant: "gold" });
  for (const [tx, ty] of [[55, 27], [66, 25], [47, 14], [57, 21], [66, 34], [49, 36], [46, 43]]) {
    addObject({ type: "tree", x: tx, y: ty, w: 1, h: 1, solid: false });
  }
  addObject({ type: "bench", x: 60, y: 34, w: 1, h: 1, solid: true });

  // The golf course in the south-west corner: fairway green, bunkers, tee and flag.
  addObject({ type: "golfgreen", x: 48, y: 37, w: 4, h: 4, solid: false });
  addObject({ type: "golfbunker", x: 53, y: 41, w: 3, h: 2, solid: false });
  addObject({ type: "golfbunker", x: 47, y: 38, w: 2, h: 2, solid: false });
  addObject({ type: "golfflag", x: 49, y: 39, w: 1, h: 1, solid: false });
  addObject({ type: "golfgreen", x: 52, y: 38, w: 2, h: 2, solid: false });

  // Street food carts: the slums live off the pavement.
  addObject({ type: "foodcart", x: 5, y: 24, w: 1, h: 1, solid: true, variant: "coffee" });
  addObject({ type: "foodcart", x: 9, y: 24, w: 1, h: 1, solid: true, variant: "skewer" });
  addObject({ type: "foodcart", x: 15, y: 24, w: 1, h: 1, solid: true, variant: "noodle" });
  addObject({ type: "foodcart", x: 36, y: 26, w: 1, h: 1, solid: true, variant: "truck" });

  // Pavement tables beside the food carts — where the diners sit.
  for (const [tx, ty] of [[4, 26], [8, 26], [14, 26], [34, 26]]) {
    addObject({ type: "table", x: tx, y: ty, w: 1, h: 1, solid: true });
  }

  // Slum alleys: washing strung between the shacks, scooters dumped anywhere.
  for (const [lx, ly] of [[5, 13], [10, 13], [15, 13], [5, 37], [11, 37], [4, 32], [10, 32], [0, 32], [4, 43], [10, 43], [15, 43]]) {
    addObject({ type: "laundry", x: lx, y: ly, w: 2, h: 1, solid: false });
  }
  // Office south block: benches outside the mall.
  for (const [tx2, ty2] of [[33, 41]]) {
    addObject({ type: "tree", x: tx2, y: ty2, w: 1, h: 1, solid: false });
  }
  addObject({ type: "bench", x: 24, y: 32, w: 1, h: 1, solid: true });
  addObject({ type: "bench", x: 30, y: 32, w: 1, h: 1, solid: true });

  // --- Squeek Park: trees and shrubs on the fringes, benches and machines inside ---
  for (const tx of [23, 27, 31, 35, 39, 43]) addObject({ type: "tree", x: tx, y: 2, w: 1, h: 1, solid: false });
  for (const tx of [24, 28, 32, 36, 40, 44]) addObject({ type: "tree", x: tx, y: 8, w: 1, h: 1, solid: false });
  for (const tx of [25, 29, 33, 37, 41]) addObject({ type: "bush", x: tx, y: 1, w: 1, h: 1, solid: false });
  addObject({ type: "bush", x: 22, y: 1, w: 1, h: 1, solid: false, variant: "flower" });
  addObject({ type: "bush", x: 44, y: 1, w: 1, h: 1, solid: false, variant: "flower" });
  addObject({ type: "bush", x: 42, y: 2, w: 1, h: 1, solid: false });
  // The pond and a drinking fountain in the middle of the lawn.
  addObject({ type: "pond", x: 29, y: 4, w: 5, h: 2, solid: true });
  addObject({ type: "fountain", x: 36, y: 4, w: 2, h: 2, solid: true });
  // Outdoor gym: four machines in a row for the office crowd.
  addObject({ type: "gym", x: 24, y: 4, w: 1, h: 1, solid: true, variant: "treadmill" });
  addObject({ type: "gym", x: 25, y: 4, w: 1, h: 1, solid: true, variant: "rower" });
  addObject({ type: "gym", x: 24, y: 6, w: 1, h: 1, solid: true, variant: "press" });
  addObject({ type: "gym", x: 25, y: 6, w: 1, h: 1, solid: true, variant: "pullup" });
  // Benches facing the water — press E to sit down.
  for (const bx of [27, 31, 35, 39]) addObject({ type: "bench", x: bx, y: 6, w: 2, h: 1, solid: true, variant: "park" });
  for (const [lx, ly] of [[22, 3], [43, 3], [22, 7], [43, 7]]) addObject({ type: "lamp", x: lx, y: ly, w: 1, h: 1, solid: false });
  addObject({ type: "sign", x: 21, y: 20, w: 1, h: 1, solid: false, text: "SQUEEK PARK ↑" });
  addObject({ type: "sign", x: 38, y: 20, w: 1, h: 1, solid: false, text: "SQUEEK PARK ↑" });

  // Traffic lights: one on each sidewalk at every crosswalk, facing the road.
  for (const col of CROSSWALKS) {
    addObject({ type: "trafficlight", x: col, y: ROAD_TOP - 1, w: 1, h: 1, solid: false, variant: "north" });
    addObject({ type: "trafficlight", x: col, y: ROAD_TOP + 3, w: 1, h: 1, solid: false, variant: "south" });
  }

  // Painted parking bays in front of the showroom — where your vehicle waits.
  for (const [bx, by] of [[38, 26], [39, 26], [43, 26]]) {
    addObject({ type: "parkingbay", x: bx, y: by, w: 1, h: 1, solid: false });
  }

  // Only two signposts left, both for the park — everything else is a name
  // plate bolted to the building it belongs to.

  // Trash spots: a fixed pool, some active at a time; cleared piles respawn elsewhere.
  const trashSpots: TrashSpot[] = [
    { id: "t1", x: 7, y: 25, kind: "dumpster" },
    { id: "t2", x: 4, y: 26, kind: "trashbag" },
    { id: "t3", x: 13, y: 26, kind: "dumpster" },
    { id: "t4", x: 17, y: 24, kind: "trashbag" },
    { id: "t5", x: 8, y: 37, kind: "trashbag" },
    { id: "t6", x: 2, y: 19, kind: "trashbag" },
    { id: "t7", x: 17, y: 25, kind: "dumpster" },
    { id: "t8", x: 8, y: 30, kind: "trashbag" },
    { id: "t9", x: 2, y: 25, kind: "dumpster" },
    { id: "t10", x: 8, y: 25, kind: "trashbag" },
    { id: "t11", x: 11, y: 26, kind: "trashbag" },
    { id: "t12", x: 18, y: 32, kind: "trashbag" },
    { id: "t13", x: 22, y: 24, kind: "trashbag" },
    { id: "t14", x: 43, y: 24, kind: "trashbag" },
    { id: "t15", x: 23, y: 25, kind: "dumpster" },
    { id: "t16", x: 35, y: 24, kind: "trashbag" },
  ];

  const interactables: Interactable[] = [
    { id: "bed", kind: "bed", x: 4, y: 19, label: "Sleep at home (full energy)" },
    { id: "shop-food", kind: "shop", x: 16, y: 19, label: "Food stall", shop: "food" },
    { id: "shop-clothing", kind: "shop", x: 16, y: 26, label: "Clothing store", shop: "clothing" },
    { id: "shop-electronics", kind: "shop", x: 32, y: 26, label: "Electronics store", shop: "electronics" },
    { id: "shop-vehicle", kind: "shop", x: 41, y: 26, label: "Car showroom", shop: "vehicle" },
    { id: "job-office", kind: "job", x: 24, y: 19, label: "Office clerk", job: "employee" },
    { id: "job-manager", kind: "job", x: 28, y: 19, label: "Corporate manager", job: "manager" },
    { id: "job-biz", kind: "job", x: 32, y: 19, label: "Business deals", job: "business" },
    { id: "job-startup", kind: "job", x: 41, y: 19, label: "Startup founder", job: "startup" },
    { id: "job-delivery", kind: "job", x: 24, y: 26, label: "Food delivery", job: "delivery" },
    { id: "wheel", kind: "wheel", x: 37, y: 19, label: "WHEELY9000 · live data" },
    { id: "gate", kind: "gate", x: 44, y: 22, label: "Golden gate" },
    { id: "mansion", kind: "mansion", x: 60, y: 26, label: "Squeek Mansion" },
    { id: "shop-street-1", kind: "shop", x: 5, y: 24, label: "Coffee cart", shop: "street" },
    { id: "shop-street-2", kind: "shop", x: 9, y: 24, label: "Skewer grill", shop: "street" },
    { id: "shop-street-3", kind: "shop", x: 15, y: 24, label: "Noodle cart", shop: "street" },
    { id: "shop-truck", kind: "shop", x: 36, y: 26, label: "Food truck", shop: "street" },
    { id: "hotel", kind: "hotel", x: 50, y: 26, label: "Grand Squeek Hotel" },
    { id: "restaurant", kind: "shop", x: 60, y: 35, label: "Golden Fork · 5★", shop: "restaurant" },
    { id: "mall", kind: "mall", x: 27, y: 33, label: "Squeek Mall" },
    { id: "salon", kind: "shop", x: 37, y: 33, label: "Clip & Squeak Salon", shop: "salon" },
    { id: "garage", kind: "garage", x: 42, y: 33, label: "Grease & Sons Garage" },
    { id: "apt-a", kind: "home", x: 37, y: 39, label: "Cheddar Court" },
    { id: "apt-b", kind: "home", x: 42, y: 39, label: "Brie Terrace" },
    { id: "apt-c", kind: "home", x: 26, y: 40, label: "Muenster Row" },
  ];

  // Benches and gym machines: added straight from the objects so every seat and
  // every machine gets its own prompt.
  for (const obj of objects) {
    if (obj.type === "bench") {
      interactables.push({
        id: `sit-${obj.id}`,
        kind: "bench",
        x: obj.x,
        y: obj.y,
        label: "Sit on the bench",
        objId: obj.id,
      });
    } else if (obj.type === "gym") {
      interactables.push({
        id: `gym-${obj.id}`,
        kind: "gym",
        x: obj.x,
        y: obj.y,
        label: `Use the ${GYM_NAMES[obj.variant ?? "treadmill"] ?? "machine"}`,
        objId: obj.id,
      });
    }
  }

  const npcs: Npc[] = [
    {
      id: "scav-1",
      name: "Rusty",
      x: 8.5 * TILE,
      y: 24.5 * TILE,
      hx: 8.5,
      hy: 24.5,
      r: 7,
      kind: "scavenger",
      dir: "down",
      moving: false,
      anim: 0,
      target: null,
      pause: 1,
      timer: 0,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: [
        "Another day, another pile. Nothing personal, kid.",
        "I saw a can in there. Or maybe that was a rock. Still counts.",
        "Word of advice: the office district pays better. Get a phone first.",
      ],
    },
    {
      id: "scav-2",
      name: "Nibbles",
      x: 11.5 * TILE,
      y: 32.4 * TILE,
      hx: 11.5,
      hy: 32.4,
      r: 6,
      kind: "scavenger",
      dir: "left",
      moving: false,
      anim: 0,
      target: null,
      pause: 2,
      timer: 0,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: [
        "Hold that key down and dig properly. Rushing gets you nothing.",
        "Sleep at home when you run out of energy. It is free, unlike my coffee.",
      ],
    },
    {
      id: "scav-3",
      name: "Patch",
      x: 5.5 * TILE,
      y: 34.5 * TILE,
      hx: 5.5,
      hy: 34.5,
      r: 5,
      kind: "scavenger",
      dir: "right",
      moving: false,
      anim: 0,
      target: null,
      pause: 1.5,
      timer: 0,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: [
        "Rags are a lifestyle. At least that is what I tell myself.",
        "When the wheel runs, the whole chain hums. Go see the WHEELY9000.",
      ],
    },
    {
      id: "worker-1",
      name: "Commuter",
      x: 24.5 * TILE,
      y: 20.5 * TILE,
      hx: 24.5,
      hy: 20.5,
      r: 5,
      kind: "worker",
      dir: "down",
      moving: false,
      anim: 0,
      target: null,
      pause: 0,
      timer: 2,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: ["Deadline in an hour. Gotta run.", "The tower coffee is terrible. Bring your own."],
    },
    {
      id: "worker-2",
      name: "Analyst",
      x: 32.5 * TILE,
      y: 25.5 * TILE,
      hx: 32.5,
      hy: 25.5,
      r: 5,
      kind: "worker",
      dir: "up",
      moving: false,
      anim: 0,
      target: null,
      pause: 0,
      timer: 4,
      hidden: true,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: ["Nine floors up, and the lift is broken again.", "Someone said the Startup Hub is hiring. Again."],
    },
    {
      id: "worker-3",
      name: "Intern",
      x: 41.5 * TILE,
      y: 20.5 * TILE,
      hx: 41.5,
      hy: 20.5,
      r: 5,
      kind: "worker",
      dir: "left",
      moving: false,
      anim: 0,
      target: null,
      pause: 0,
      timer: 1,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: ["I fetch coffee. That is the whole job.", "One day I will own the top floor. Mark my words."],
    },
    {
      id: "worker-4",
      name: "Broker",
      x: 28.5 * TILE,
      y: 20.5 * TILE,
      hx: 28.5,
      hy: 20.5,
      r: 6,
      kind: "worker",
      dir: "right",
      moving: false,
      anim: 0,
      target: null,
      pause: 0,
      timer: 6,
      hidden: true,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: ["Buy low, sell high. Or just sell, honestly.", "Rich district? You need a suit AND a car. Rules are rules."],
    },
    {
      id: "worker-5",
      name: "Courier",
      x: 24.5 * TILE,
      y: 26.5 * TILE,
      hx: 24.5,
      hy: 26.5,
      r: 5,
      kind: "worker",
      dir: "up",
      moving: false,
      anim: 0,
      target: null,
      pause: 0,
      timer: 3,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: ["This box is heavier than it looks.", "A bicycle pays for itself in a week, trust me."],
    },
    {
      id: "worker-6",
      name: "Manager",
      x: 37.5 * TILE,
      y: 25.5 * TILE,
      hx: 37.5,
      hy: 25.5,
      r: 5,
      kind: "worker",
      dir: "down",
      moving: false,
      anim: 0,
      target: null,
      pause: 0,
      timer: 5,
      hidden: true,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: ["Meetings about meetings. This is the job.", "Get the laptop. Then you can call yourself a founder."],
    },
    {
      id: "richrat",
      name: "Mr. Whiskerton",
      x: 36.5 * TILE,
      y: 25.5 * TILE,
      hx: 36.5,
      hy: 25.5,
      r: 5,
      kind: "richrat",
      dir: "left",
      moving: false,
      anim: 0,
      target: null,
      pause: 1,
      timer: 0,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: [
        "You smell like the slums. Do stand downwind, would you.",
        "I own three floors of that tower. You own… a trash pile?",
        "The rich district gate does not open for rags. Get a suit, get a car, get real.",
      ],
    },
    {
      id: "lady",
      name: "Lady Pemberton",
      x: 58.5 * TILE,
      y: 24.5 * TILE,
      hx: 58.5,
      hy: 24.5,
      r: 7,
      kind: "richrat",
      dir: "right",
      moving: false,
      anim: 0,
      target: null,
      pause: 1.5,
      timer: 0,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: [
        "The fountain is marble, the cars are Italian, and you are… here.",
        "Guards! Oh, relax — apparently you earned it. How quaint.",
        "Do keep off the lawn, darling. The gardener is very sensitive.",
      ],
    },
    {
      id: "kid",
      name: "Little Pip",
      x: 33.5 * TILE,
      y: 22.5 * TILE,
      hx: 33.5,
      hy: 22.5,
      r: 4,
      kind: "kid",
      dir: "down",
      moving: false,
      anim: 0,
      target: null,
      pause: 1.5,
      timer: 0,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: [
        "Have you seen Squeektoshi? The hamster runs a real wheel somewhere. It powers the chain!",
        "When the wheel spins, we get free energy. It is the coolest thing in this city.",
      ],
    },
    {
      id: "cop",
      name: "Officer Crumb",
      x: 33.5 * TILE,
      y: 24.4 * TILE,
      hx: 33.5,
      hy: 24.4,
      r: 0,
      kind: "police",
      dir: "left",
      moving: false,
      anim: 0,
      target: null,
      pause: 0,
      timer: 0,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: [
        "Mind the lights, citizen. Red means stop — even on two wheels.",
        "I have seen every shortcut in this city. None of them are worth a fine.",
        "Crosswalk is right here. Use it and we will get along fine.",
      ],
    },
    {
      id: "golfer-1",
      name: "Duff Harrington",
      x: 51.5 * TILE,
      y: 39.5 * TILE,
      hx: 51.5,
      hy: 39.5,
      r: 3,
      kind: "golfer",
      dir: "left",
      moving: false,
      anim: 0,
      target: null,
      pause: 1,
      timer: 0,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: [
        "Fore! …oh, you are not standing in the way. Carry on then.",
        "Par is a state of mind, old sport. So is losing.",
      ],
    },
    {
      id: "golfer-2",
      name: "Bogey Blanc",
      x: 54.5 * TILE,
      y: 42.5 * TILE,
      hx: 54.5,
      hy: 42.5,
      r: 3,
      kind: "golfer",
      dir: "up",
      moving: false,
      anim: 0,
      target: null,
      pause: 1.5,
      timer: 0,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: [
        "Nine holes before lunch. It is the only civilised way to live.",
        "My caddie quit. Apparently I am 'difficult'. Imagine that.",
      ],
    },
    {
      id: "doorman",
      name: "Bramwell",
      x: 48.5 * TILE,
      y: 26.5 * TILE,
      hx: 48.5,
      hy: 26.5,
      r: 0,
      kind: "staff",
      dir: "down",
      moving: false,
      anim: 0,
      target: null,
      pause: 0,
      timer: 0,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: [
        "Welcome to the Grand Squeek Hotel. Five stars — we counted them twice.",
        "The penthouse is taken. By someone with more Coins than you, I imagine.",
        "The Golden Fork next door does a seven-course menu. Bring an appetite, and a budget.",
      ],
    },
    {
      id: "guest-1",
      name: "Mrs. Sterling",
      x: 52.5 * TILE,
      y: 25.5 * TILE,
      hx: 52.5,
      hy: 25.5,
      r: 4,
      kind: "guest",
      dir: "left",
      moving: false,
      anim: 0,
      target: null,
      pause: 1.2,
      timer: 0,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: [
        "I only stay in hotels with a fountain in front. It is a rule, not a preference.",
        "The golf course is delightful. The other players, less so.",
      ],
    },
    {
      id: "guest-2",
      name: "Sommelier Pinot",
      x: 58.5 * TILE,
      y: 35.5 * TILE,
      hx: 58.5,
      hy: 35.5,
      r: 2,
      kind: "staff",
      dir: "right",
      moving: false,
      anim: 0,
      target: null,
      pause: 1,
      timer: 0,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: [
        "The tasting menu is seven courses. You will still be hungry. That is the point.",
        "We keep a bottle for guests who look like they earned it. You are getting there.",
      ],
    },
    // ---- Delivery riders: food stall → office towers, and back again ----
    {
      id: "courier-1",
      name: "Rider Nibble",
      x: 16.5 * TILE,
      y: 19.6 * TILE,
      hx: 16.5,
      hy: 19.6,
      r: 0,
      kind: "courier",
      dir: "left",
      moving: false,
      anim: 0,
      target: null,
      pause: 0,
      timer: 0,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      routeIndex: 0,
      route: [
        { x: 16.5, y: 19.6, wait: 3.2 },
        { x: 12.5, y: 19.6 },
        { x: 12.5, y: 22.5 },
        { x: 26.5, y: 22.5 },
        { x: 26.5, y: 19.6 },
        { x: 31.5, y: 19.6, wait: 3.6 },
        { x: 26.5, y: 19.6 },
        { x: 26.5, y: 22.5 },
        { x: 12.5, y: 22.5 },
        { x: 12.5, y: 19.6 },
      ],
      lines: ["“Food delivery! Hot, cheap, and only slightly dropped.”", "“Two wheels, no traffic, no mercy.”"],
    },
    {
      id: "courier-2",
      name: "Rider Crumb",
      x: 22.5 * TILE,
      y: 22.5 * TILE,
      hx: 22.5,
      hy: 22.5,
      r: 0,
      kind: "courier",
      dir: "right",
      moving: false,
      anim: 0,
      target: null,
      pause: 0,
      timer: 0,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      routeIndex: 4,
      route: [
        { x: 16.5, y: 19.6, wait: 2.6 },
        { x: 12.5, y: 19.6 },
        { x: 12.5, y: 22.5 },
        { x: 26.5, y: 22.5 },
        { x: 26.5, y: 19.6 },
        { x: 24.5, y: 19.6, wait: 3.4 },
        { x: 26.5, y: 19.6 },
        { x: 26.5, y: 22.5 },
        { x: 12.5, y: 22.5 },
        { x: 12.5, y: 19.6 },
      ],
      lines: ["“Office lunch run. Twenty boxes, one bike.”", "“If I'm late, the noodles get cold and the tower gets angry.”"],
    },
    // The people waiting at the bottom of the towers.
    {
      id: "receiver-1",
      name: "Pip from Accounting",
      x: 32.5 * TILE,
      y: 19.6 * TILE,
      hx: 32.5,
      hy: 19.6,
      r: 0.4,
      kind: "citizen",
      dir: "left",
      moving: false,
      anim: 0,
      target: null,
      pause: 0.5,
      timer: 0,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: ["“Waiting on my noodles. Third time this week.”", "“The rider knows my order better than I do.”"],
    },
    {
      id: "receiver-2",
      name: "Tam the Intern",
      x: 24.5 * TILE,
      y: 19.6 * TILE,
      hx: 24.5,
      hy: 19.6,
      r: 0.4,
      kind: "resident",
      dir: "right",
      moving: false,
      anim: 0,
      target: null,
      pause: 0.5,
      timer: 0,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: ["“I ordered for the whole floor. I will be eating alone in the stairwell.”", "“Cheap lunch is the only perk this job has left.”"],
    },
    // ---- The slums are packed: kids, neighbours and people who never left ----
    {
      id: "slum-1",
      name: "Mrs. Gouda",
      x: 5.5 * TILE,
      y: 32.4 * TILE,
      hx: 5.5,
      hy: 32.4,
      r: 1.4,
      kind: "citizen",
      dir: "down",
      moving: false,
      anim: 0,
      target: null,
      pause: 0.8,
      timer: 0,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: ["“Mind the washing. It has been drying since Tuesday.”", "“Fourteen of us in that hut. You get used to the elbows.”"],
    },
    {
      id: "slum-2",
      name: "Old Rennet",
      x: 3.5 * TILE,
      y: 43.4 * TILE,
      hx: 3.5,
      hy: 43.4,
      r: 1.2,
      kind: "citizen",
      dir: "up",
      moving: false,
      anim: 0,
      target: null,
      pause: 1.1,
      timer: 0,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: ["“Born here, will go here. At least the rent is honest.”", "“You're the one climbing out, aren't you. I can tell.”"],
    },
    {
      id: "slum-3",
      name: "Auntie Blue",
      x: 11.5 * TILE,
      y: 13.6 * TILE,
      hx: 11.5,
      hy: 13.6,
      r: 1.6,
      kind: "citizen",
      dir: "left",
      moving: false,
      anim: 0,
      target: null,
      pause: 0.7,
      timer: 0,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: ["“Noodle cart's the best on the block. Don't tell the other two.”", "“Watch the puddles, love. That one's not water.”"],
    },
    {
      id: "slum-4",
      name: "Nib",
      x: 8.5 * TILE,
      y: 32.5 * TILE,
      hx: 8.5,
      hy: 32.5,
      r: 2.2,
      kind: "kid",
      dir: "right",
      moving: false,
      anim: 0,
      target: null,
      pause: 0.4,
      timer: 0,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: ["“Race you to the gate!”", "“I can ride a motorbike. I'm not allowed, but I can.”"],
    },
    {
      id: "slum-5",
      name: "Titch",
      x: 13.5 * TILE,
      y: 37.4 * TILE,
      hx: 13.5,
      hy: 37.4,
      r: 2.2,
      kind: "kid",
      dir: "left",
      moving: false,
      anim: 0,
      target: null,
      pause: 0.4,
      timer: 0,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: ["“We built a ramp. It's terrible. Want to try it?”", "“When I'm big I'm getting a scooter with a radio.”"],
    },
    {
      id: "slum-6",
      name: "Crusty Dan",
      x: 17.5 * TILE,
      y: 36.4 * TILE,
      hx: 17.5,
      hy: 36.4,
      r: 1.5,
      kind: "citizen",
      dir: "up",
      moving: false,
      anim: 0,
      target: null,
      pause: 0.9,
      timer: 0,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: ["“Scooter's up on blocks. Again.”", "“Everyone here's got two wheels and no plans.”"],
    },
    {
      id: "slum-7",
      name: "Widow Stilton",
      x: 1.5 * TILE,
      y: 26.5 * TILE,
      hx: 1.5,
      hy: 26.5,
      r: 1.3,
      kind: "citizen",
      dir: "right",
      moving: false,
      anim: 0,
      target: null,
      pause: 0.9,
      timer: 0,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: ["“I sell dumplings from that cart. Buy one, they're good.”", "“The rich district? I've never had a reason to go.”"],
    },
    {
      id: "guard",
      name: "Gate Guard",
      x: 43.5 * TILE,
      y: 20.5 * TILE,
      hx: 43.5,
      hy: 20.5,
      r: 0,
      kind: "guard",
      dir: "right",
      moving: false,
      anim: 0,
      target: null,
      pause: 3,
      timer: 0,
      hidden: false,
      digging: false,
      goingInside: false,
      digPuff: 0,
      lines: [
        "Golden gate rules: tailored suit, a car, and 4,000 Coins on you.",
        "No exceptions. I do not make them, I just stand here.",
      ],
    },
  ];

  const zoneLabels: { x: number; y: number; text: string }[] = [
    { x: 9, y: 19.2, text: "THE SLUMS" },
    { x: 33, y: 19.2, text: "OFFICE DISTRICT" },
    { x: 57, y: 24.2, text: "RICH DISTRICT" },
  ];

  const officeDoors: { x: number; y: number }[] = buildings
    .filter((b) => b.zone === "office" && b.door && b.style !== "machine")
    .map((b) => {
      const topDoor = b.door!.y === b.y;
      return {
        x: (b.door!.x + 0.5) * TILE,
        y: topDoor ? (b.door!.y - 0.5) * TILE : (b.door!.y + 1.5) * TILE,
      };
    });

  // Every cart gets its own vendor and a small queue — the pavement market
  // should feel like a place people actually live, not a row of props.
  const idleNpc = (n: Partial<Npc> & { id: string; name: string; x: number; y: number; kind: Npc["kind"]; dir: Dir }): Npc => ({
    hx: n.x / TILE,
    hy: n.y / TILE,
    r: 0,
    moving: false,
    anim: 0,
    target: null,
    pause: 1.4,
    timer: 0,
    hidden: false,
    digging: false,
    goingInside: false,
    digPuff: 0,
    lines: [],
    ...n,
  });
  const cartCrew: {
    cart: [number, number];
    /** Where the takeaway crowd walks off to (in front of a door). */
    door: [number, number];
    /** The table the waiter serves. */
    table: [number, number];
    waiter: string;
    diners: [string, string];
    vendor: string;
    vlines: string[];
    queue: [string, string][];
  }[] = [
    {
      cart: [5, 24],
      door: [4, 19],
      table: [4, 26],
      waiter: "Tray Lad Timmy",
      diners: ["Ada Flatwhite", "Biscuit Bram"],
      vendor: "Barista Beans",
      vlines: [
        "“One coffee, extra hot. Everyone in this district runs on my brew.”",
        "“Morning rush starts at six. You are late for tomorrow already.”",
      ],
      queue: [
        ["Rush Hour Rita", "“Two minutes late and the office notices. Hurry that cup, Beans.”"],
        ["Sleepy Sam", "“Make it the strong one. The really strong one.”"],
      ],
    },
    {
      cart: [9, 24],
      door: [16, 19],
      table: [8, 26],
      waiter: "Skewer Sue",
      diners: ["Charcoal Charlie", "Mia Marinade"],
      vendor: "Grillmaster Pip",
      vlines: [
        "“Five skewers a minute when the coals are right. Watch your eyebrows.”",
        "“Smoke is free. Sauce costs extra.”",
      ],
      queue: [["Hungry Hollis", "“Eight skewers. No, that is not a lot.”"]],
    },
    {
      cart: [15, 24],
      door: [16, 26],
      table: [14, 26],
      waiter: "Broth Boyo",
      diners: ["Slurp Simmons", "Chopstick Chess"],
      vendor: "Noodle Nan",
      vlines: [
        "“Broth has been on since dawn. That is where the flavour lives.”",
        "“Sit anywhere. There is nowhere to sit, but sit anywhere.”",
      ],
      queue: [
        ["Little Dot", "“Nan's noodles or nothing. I have standards, mostly.”"],
        ["Cold Tofu", "“Hot bowl on a cold day. Best trade in the slums.”"],
      ],
    },
    {
      cart: [36, 26],
      door: [32, 26],
      table: [34, 26],
      waiter: "Box Run Becca",
      diners: ["Lunch Break Lou", "Deadline Dee"],
      vendor: "Trucker Vim",
      vlines: [
        "“Office lunch rush starts in ten. I have forty boxes to shift.”",
        "“Cheap, fast, and only slightly on the floor. That is the deal.”",
      ],
      queue: [["Suit Number Nine", "“I have a meeting in twelve minutes and a queue in front of me.”"]],
    },
  ];
  for (const crew2 of cartCrew) {
    const [cx, cy] = crew2.cart;
    const [dx, dy] = crew2.door;
    const [tx, ty] = crew2.table;
    const queueSpots = [1.65, 2.7];
    npcs.push(
      // The cook works the pan behind the cart.
      idleNpc({
        id: `chef-${cx}`,
        name: crew2.vendor,
        x: (cx - 0.62) * TILE,
        y: (cy + 0.62) * TILE,
        kind: "chef",
        dir: "right",
        lines: crew2.vlines,
      }),
      // The waiter runs plates from the cart to the table and back.
      {
        ...idleNpc({
          id: `waiter-${cx}`,
          name: crew2.waiter,
          x: (cx + 0.5) * TILE,
          y: (cy + 1.5) * TILE,
          kind: "waiter",
          dir: "down",
          lines: ["“Hot plate, coming through. Mind your tail.”", "“Sit down, I will bring it over.”"],
        }),
        route: [
          { x: cx + 0.5, y: cy + 1.5, wait: 1.1 },
          { x: tx + 0.5, y: ty + 1.5, wait: 1.4 },
        ],
        routeIndex: 0,
        stop: 0,
        carry: "plate",
      }
    );
    // Two diners parked at the table with a bowl each.
    crew2.diners.forEach((name, i) => {
      npcs.push({
        ...idleNpc({
          id: `diner-${cx}-${i}`,
          name,
          x: (tx + (i === 0 ? 0.12 : 0.88)) * TILE,
          y: (ty + 1) * TILE - 5,
          kind: "citizen",
          dir: i === 0 ? "right" : "left",
          lines: ["“Best bowl on this pavement, no contest.”", "“I eat here every single day. Every day.”"],
        }),
        sitting: true,
        eating: true,
      });
    });
    // The queue: they order, take the box and carry it into the nearest building.
    crew2.queue.forEach(([name, line], i) => {
      npcs.push({
        ...idleNpc({
          id: `queue-${cx}-${i}`,
          name,
          x: (cx + 0.5) * TILE,
          y: (cy + (queueSpots[i] ?? 1.65)) * TILE,
          kind: "citizen",
          dir: "up",
          lines: [line],
        }),
        route: [
          { x: cx + 0.5, y: cy + (queueSpots[i] ?? 1.65), wait: 3.4 + i * 1.3 },
          { x: dx + 0.5, y: dy + 0.7, wait: 0.6 },
          { x: dx + 0.5, y: dy + 0.7, vanish: 7 + i * 2 },
        ],
        routeIndex: 0,
        stop: 0,
        carry: "box",
      });
    });
  }
  // Two buskers: one in the slum market, one on the office plaza.
  npcs.push(
    idleNpc({
      id: "busker-1",
      name: "Strings McGee",
      x: 12.5 * TILE,
      y: 25.7 * TILE,
      kind: "busker",
      dir: "down",
      lines: ["“Requests are free. Talent costs Coins.”", "“I have been playing this corner for nine years. Nobody has paid me yet.”"],
    }),
    idleNpc({
      id: "busker-2",
      name: "Melody Marmot",
      x: 29.5 * TILE,
      y: 25.7 * TILE,
      kind: "busker",
      dir: "down",
      lines: ["“This one is about a mouse who found a coin. It ends badly.”", "“Tip me and I will stop. Or do not, and I will keep going.”"],
    })
  );

  // --- Squeek Park crowd: joggers on the loop, people on the benches, kids loose ---
  const parkLoop: { x: number; y: number; wait?: number }[] = [
    { x: 22.5, y: 3.5 },
    { x: 43.5, y: 3.5 },
    { x: 43.5, y: 7.5 },
    { x: 22.5, y: 7.5 },
  ];
  const laneLap: { x: number; y: number; wait?: number }[] = [
    { x: 21.5, y: 3.5 },
    { x: 21.5, y: 18.5 },
    { x: 22.5, y: 18.5 },
    { x: 22.5, y: 3.5 },
  ];
  npcs.push(
    {
      ...idleNpc({
        id: "jog-1",
        name: "Pace O'Malley",
        x: 22.5 * TILE,
        y: 3.5 * TILE,
        kind: "jogger",
        dir: "right",
        lines: ["“Morning! Four laps before the stand-up. Every single day.”", "“You look winded. That is the hill, not the altitude.”"],
      }),
      route: parkLoop,
      routeIndex: 0,
      stop: 0,
    },
    {
      ...idleNpc({
        id: "jog-2",
        name: "Trotter Bell",
        x: 43.5 * TILE,
        y: 7.5 * TILE,
        kind: "jogger",
        dir: "left",
        lines: ["“I do the long lap — down the lane and back. Beats the treadmill.”", "“Two more laps and I have earned my coffee.”"],
      }),
      route: laneLap,
      routeIndex: 0,
      stop: 0,
    },
    // Bench regulars: two in the park, one on the office plaza.
    { ...idleNpc({ id: "sit-1", name: "Bertie Bloom", x: 36 * TILE, y: 7 * TILE - 5, kind: "citizen", dir: "down", lines: ["“I come here every lunchtime. Best bench in the city.”", "“Sit down, watch the pond. The office can wait.”"] }), sitting: true },
    { ...idleNpc({ id: "sit-2", name: "Nana Praline", x: 40 * TILE, y: 7 * TILE - 5, kind: "resident", dir: "down", lines: ["“The ducks know me. They come right up.”", "“Young rats jog past me twice a lap. Show-offs, the lot of them.”"] }), sitting: true },
    { ...idleNpc({ id: "sit-3", name: "Otto Brine", x: 30 * TILE + 16, y: 33 * TILE - 5, kind: "worker", dir: "down", lines: ["“Fifteen minutes of daylight, then back to the desk.”", "“Best part of the job, this bench.”"] }), sitting: true },
    // Slick Whiskers — the other scavenger on this patch.
    idleNpc({
      id: "rival-slick",
      name: RIVAL_NAME,
      x: 14.5 * TILE,
      y: 30.5 * TILE,
      kind: "rival",
      dir: "down",
      r: 4,
      lines: ["“Piles are mine, friend. Finders keepers.”", "“You're quick. Not quick enough.”"],
    }),
    // Two kids running loose on the lawn.
    idleNpc({ id: "park-kid-1", name: "Pipkin", x: 33.5 * TILE, y: 3.5 * TILE, kind: "kid", dir: "down", r: 3, lines: ["“Bet you cannot catch me!”"] }),
    idleNpc({ id: "park-kid-2", name: "Muffin", x: 26.5 * TILE, y: 7.5 * TILE, kind: "kid", dir: "up", r: 3, lines: ["“I am not tired. You are tired.”"] })
  );

  // Bus stops on the pavement, one per district, and a taxi rank by the hub.
  const busStops = [
    { id: "bus-slums", x: 2, y: 24, label: "Slumside stop" },
    { id: "bus-office", x: 29, y: 24, label: "Tower Row stop" },
    { id: "bus-rich", x: 52, y: 24, label: "Gold Gate stop" },
  ];
  for (const stop of busStops) {
    objects.push({ id: stop.id, type: "busstop", x: stop.x, y: stop.y, w: 1, h: 1, solid: false, text: stop.label });
    interactables.push({ id: `${stop.id}-wait`, kind: "bus", x: stop.x, y: stop.y, label: `Wait for the bus · ${BUS_FARE} Coins` });
  }
  const taxiRank = { x: 33, y: 24 };
  objects.push({ id: "taxi-rank", type: "taxi", x: taxiRank.x, y: taxiRank.y, w: 2, h: 1, solid: false });
  interactables.push({ id: "taxi-rank-hail", kind: "taxi", x: taxiRank.x, y: taxiRank.y, label: "Call a taxi" });

  for (const cart of cartCrew) {
    interactables.push({
      id: `shift-${cart.cart[0]}`,
      kind: "shift",
      x: cart.cart[0] + 1,
      y: cart.cart[1],
      label: `Work a shift at ${cart.vendor}`,
    });
  }

  return {
    tiles,
    solid,
    buildings,
    objects,
    interactables,
    npcs,
    busStops,
    taxiRank,
    shiftSpots: cartCrew.map((cart, i) => ({
      id: `shift-${i}`,
      name: cart.vendor,
      // Staff stand behind the cart, customers queue at the front.
      x: cart.cart[0] + 1,
      y: cart.cart[1],
      counterX: cart.cart[0] + 0.5,
      counterY: cart.cart[1] + 1.5,
      doorX: cart.door[0] + 0.5,
      doorY: cart.door[1] + 0.7,
    })),
    zoneLabels,
    spawn: { x: 4.5 * TILE, y: 20.6 * TILE },
    gateTiles: GATE_ROWS.map((row) => ({ x: WALL_B, y: row })),
    gateOpen: false,
    wheelActive: false,
    trashSpots,
    officeDoors,
  };
}

export const tileToPx = (v: number) => v * TILE;
export const isSolidAt = (world: World, px: number, py: number) => {
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
  return world.solid[ty][tx];
};
