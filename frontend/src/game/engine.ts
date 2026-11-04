// Squeek Life — game engine: world simulation, economy, chapters, saving.
import { api } from "@/lib/api";
import {
  buildWorld,
  isSolidAt,
  TILE,
  COLS,
  ROWS,
  WALL_A,
  WALL_B,
  ROAD_TOP,
  CROSSWALKS,
  COP_CROSSWALK,
  PARK_BAY,
  type World,
  type Building,
  type Dir,
  type Interactable,
  type TrashSpot,
} from "./world";
import { GameMusic, gameMusic, type TrackName } from "./music";
import {
  drawTile,
  drawRoadDetails,
  drawZoneLabels,
  drawBuilding,
  drawObject,
  drawTrash,
  drawWalls,
  drawPlayer,
  drawNpcSprite,
  drawChatBubble,
  drawTargetRing,
  drawBusBody,
  drawDancerKit,
  drawMarcherKit,
  drawPetRat,
  drawUmbrella,
  drawRain,
  drawLampGlow,
  drawDayTint,
  setHomeFurniture,
  drawMinimap,
  drawQuestMarker,
  drawParcel,
  setZoom,
  drawVehicle,
  setSignalPhase,
  VEHICLE_COLORS,
  type SignalPhase,
  type VehicleStyle,
} from "./sprites";
import {
  CONSUMABLES,
  CHAPTERS,
  ENERGY_MAX,
  ENERGY_REGEN_PER_SEC,
  BED_COOLDOWN_MS,
  WHEEL_BOOST_MS,
  WHEEL_BOOST_ENERGY,
  GATE_COINS,
  TRASH_REWARD,
  TRASH_ENERGY,
  TRASH_HOLD_SECONDS,
  TRASH_RESPAWN_MIN_MS,
  TRASH_RESPAWN_MAX_MS,
  TRASH_MAX_ACTIVE,
  VEHICLES,
  ITEM_VEHICLE,
  TRAFFIC_FINE,
  DELIVERY_REACH,
  DELIVERY_TIP_PER_TILE,
  DELIVERY_TIP_MAX,
  WORKOUT_SECONDS,
  WORKOUT_ENERGY,
  WORKOUT_COOLDOWN_MS,
  SIT_ENERGY_PER_SEC,
  CHATS,
  DAY_SECONDS,
  CLOCK_START_MIN,
  SLEEP_WAKE_MIN,
  NIGHT_TINT,
  PHASES,
  phaseFor,
  clockLabel,
  isShopOpen,
  eventForDay,
  eventActive,
  EVENTS,
  type EventId,
  friendTier,
  GREETINGS,
  FRIEND_TIPS,
  reputationOf,
  repTier,
  REP_GATE_OPEN,
  REP_DISCOUNT_AT,
  REP_DISCOUNT,
  SHIFT_SECONDS,
  SHIFT_CUSTOMERS,
  SHIFT_PAY,
  SHIFT_BONUS,
  SHIFT_ENERGY,
  SHIFT_COOLDOWN_MS,
  SHIFT_SERVE_REACH,
  SHIFT_ORDERS,
  BUS_FARE,
  BUS_SPEED,
  BUS_DWELL_SEC,
  TAXI_FARES,
  FURNITURE,
  FURNITURE_BY_ID,
  homeComfortOf,
  PET_COIN_EVERY_MS,
  PET_COIN_AMOUNT,
  RIVAL_NAME,
  RIVAL_SPEED,
  RIVAL_GRAB_SEC,
  RIVAL_STEAL_TOAST,
  RICH_SPOT_MULT,
  PAVEMENT_FINE,
  type VehicleKind,
  stageFor,
  jobById,
  gearById,
  SHOP_NAMES,
  ACHIEVEMENTS,
  type ItemId,
  type JobId,
  type ShopId,
} from "./data";

export interface Toast {
  id: number;
  text: string;
  kind: "coin" | "info" | "warn" | "achievement";
  age: number;
}

/** A delivery run: collect the order at the food stall, drop it at a door. */
export interface DeliveryQuest {
  stage: "pickup" | "deliver";
  /** Marker tile you have to reach. */
  x: number;
  y: number;
  label: string;
  /** Where the order was collected, so the tip can reward the distance. */
  fromX: number;
  fromY: number;
}

export interface Banner {
  n: number;
  title: string;
  subtitle: string;
  age: number;
}

export interface SaveData {
  v: number;
  coins: number;
  coinsEarned: number;
  energy: number;
  items: ItemId[];
  chapter: number;
  works: number;
  playedSec: number;
  pos: { x: number; y: number };
  gateOpen: boolean;
  won: boolean;
  bedReadyAt: number;
  wheelReadyAt: number;
  achievements: string[];
  /** Bought vehicles, parked where you left them. */
  vehicles?: Partial<Record<VehicleKind, { x: number; y: number }>>;
  riding?: VehicleKind | null;
  /** A delivery run survives a reload. */
  quest?: DeliveryQuest | null;
  /** Minutes past midnight, and which day of the city's life we are on. */
  clockMin?: number;
  day?: number;
  /** How many times you have talked to each neighbour. */
  friends?: Record<string, number>;
  /** Furniture bought for the flat. */
  furniture?: string[];
  /** Older saves stored a single vehicle — still read for compatibility. */
  vehicle?: { kind: VehicleKind; x: number; y: number } | null;
}

export type WheelBoost = {
  status: "idle" | "granted" | "cooldown" | "asleep" | "offline";
  message: string;
};

export type Modal =
  | { type: "shop"; shop: ShopId; title: string; keeper: string; discount?: number }
  | {
      type: "work";
      job: JobId;
      phase: "intro" | "sweep" | "result";
      marker: number;
      quality: "perfect" | "good" | "miss" | null;
      reward: number;
    }
  | { type: "dialog"; speaker: string; lines: string[]; index: number }
  | { type: "gate"; checks: { label: string; ok: boolean }[]; open: boolean }
  | { type: "wheel"; state: "loading" | "ok" | "error"; error?: string; data?: any; boost: WheelBoost }
  | { type: "win"; coinsEarned: number; works: number; playedSec: number; achievements: number }
  | { type: "taxi" };

export interface Snapshot {
  coins: number;
  coinsEarned: number;
  energy: number;
  energyPct: number;
  chapter: number;
  checklist: { label: string; ok: boolean }[];
  items: ItemId[];
  stage: number;
  prompt: Interactable | null;
  /** Prompt for the F key — your ride. */
  vehiclePrompt: Interactable | null;
  promptProgress: number;
  modal: Modal | null;
  toasts: Toast[];
  banner: Banner | null;
  won: boolean;
  gateOpen: boolean;
  works: number;
  playedSec: number;
  achievements: string[];
  name: string;
  wallet: string | null;
  wheelBoostReadyAt: number;
  muted: boolean;
  riding: VehicleKind | null;
  /** The delivery run you are on, if any. */
  quest: { stage: "pickup" | "deliver"; label: string } | null;
  sitting: boolean;
  workingOut: boolean;
  /** The city clock. */
  clock: string;
  day: number;
  phase: string;
  phaseLabel: string;
  event: { id: EventId; name: string; blurb: string; active: boolean };
  /** Reputation and what people call you. */
  rep: number;
  repLabel: string;
  friends: { id: string; name: string; talks: number; tier: string }[];
  shopOpen: boolean;
  /** A shift on the counter, if you are on one. */
  shift: { left: number; served: number; total: number; cart: string } | null;
  comfort: number;
  furniture: string[];
  busWaiting: boolean;
  petOut: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  delay: number;
  gravity: number;
}

interface TrafficCar {
  id: number;
  kind: "car" | "van" | "bike";
  lane: 0 | 1; // 0 = westbound (upper lane), 1 = eastbound (lower lane)
  seg: number; // index into TRAFFIC_SEGMENTS: slums / office / rich district
  x: number;
  y: number;
  speed: number;
  base: number;
  style: VehicleStyle;
  brake: boolean;
}

/** Lane centres inside the three-tile road. */
const LANE_Y = [ROAD_TOP * TILE + 24, ROAD_TOP * TILE + 3 * TILE - 24];
/** Traffic never crosses the district walls: each stretch fades out at its ends. */
const TRAFFIC_SEGMENTS: { from: number; to: number; zone: "slums" | "city" | "rich" }[] = [
  // The slums and the office district share one stretch now that the fence is
  // gone; only the golden gate still splits the road.
  { from: -90, to: WALL_B * TILE - 10, zone: "slums" },
  { from: (WALL_B + 1) * TILE + 10, to: COLS * TILE + 90, zone: "rich" },
];
const PLAYER_VEHICLE_STYLE: Record<VehicleKind, VehicleStyle> = {
  bicycle: VEHICLE_COLORS.sky,
  motorbike: VEHICLE_COLORS.teal,
  car: VEHICLE_COLORS.crimson,
};

/** Vehicles that need an engine: red-light fines only apply to these. */
const MOTORISED: VehicleKind[] = ["motorbike", "car"];

/** How each rideable vehicle is drawn. */
const VEHICLE_DRAW: Record<VehicleKind, "car" | "bike" | "bicycle"> = {
  bicycle: "bicycle",
  motorbike: "bike",
  car: "car",
};

/** Where a delivery can end, and what to call it in the toast. */
const BUILDING_NAMES: Record<string, string> = {
  "tower-a": "Office Tower",
  "tower-b": "Squeek Tower",
  "tower-c": "Skyline Tower",
  "corp-hq": "Corp HQ",
  electronics: "the electronics store",
  showroom: "the car showroom",
  mall: "Squeek Mall",
  salon: "Clip & Squeak Salon",
  garage: "Grease & Sons Garage",
  "apt-a": "Cheddar Court",
  "apt-b": "Brie Terrace",
  "apt-c": "Muenster Row",
  clothing: "the clothing store",
  home: "Squeek's home",
};
const prettyId = (id: string) => id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const FIREWORK_COLORS = ["#ff2882", "#ffc53d", "#43d17a", "#7fe8ff", "#b78aff", "#ffffff"];
const KEEPERS: Record<ShopId, { title: string; keeper: string }> = {
  food: { title: "Food stall", keeper: "Owner: “Eat first, grind later.”" },
  clothing: { title: "Clothing store", keeper: "Owner: “Dress sharp and the city treats you differently.”" },
  electronics: { title: "Electronics store", keeper: "Owner: “Second-hand, but it still turns on.”" },
  vehicle: { title: "Car showroom", keeper: "Owner: “No wheels, no distance, kid.”" },
  street: { title: "Street food", keeper: "Vendor: “Cheap, hot and on the pavement. What more do you want?”" },
  restaurant: { title: "Golden Fork · 5★", keeper: "Maître d': “Jacket required. Tips expected.”" },
  salon: { title: "Clip & Squeak Salon", keeper: "Babs: “Sit down, I'll have you looking employable in ten minutes.”" },
};

export class SqueekGame {
  world: World = buildWorld();
  player = { x: 0, y: 0, dir: "down" as Dir, moving: false, anim: 0 };
  cam = { x: 0, y: 0 };
  keys: Record<string, boolean> = {};
  energy = ENERGY_MAX;
  coins = 0;
  coinsEarned = 0;
  items: ItemId[] = [];
  chapter = 1;
  works = 0;
  playedSec = 0;
  gateOpen = false;
  won = false;
  bedReadyAt = 0;
  wheelReadyAt = 0;
  achievements: string[] = [];
  toasts: Toast[] = [];
  banner: Banner | null = null;
  prompt: Interactable | null = null;
  // ---- the city clock ----
  clockMin = CLOCK_START_MIN;
  day = 1;
  eventId: EventId = eventForDay(1);
  /** Multiplies what a pile is worth (Market Day is a good day). */
  trashMult = 1;
  richSpotId: string | null = null;
  /** Which pile is loaded today. */
  /** People you have talked to. */
  friends: Record<string, number> = {};
  furniture: string[] = [];
  shift: { spotId: string; left: number; served: number; total: number; cart: string; spawnIn: number; readyAt: number } | null =
    null;
  shiftCooldownUntil = 0;
  busX = 0;
  busDir: 1 | -1 = 1;
  busDwell = 0;
  busStopIndex = 0;
  ridingBus = false;
  taxiTo: { label: string; fare: number; x: number; y: number } | null = null;
  private eventCrowd: string[] = [];
  private rainDrops: { x: number; y: number; len: number; speed: number }[] = [];
  private petCoinAt = 0;
  private raidSpot: string | null = null;
  /** Set up on the first frame: which pile is loaded today. */
  private richSpotReady = false;
  private shiftGuests: string[] = [];
  private pavementFineAt = 0;
  private greetCool = new Map<string, number>();
  private chatTimer = 6;
  private chatting = 0;
  /** Separate prompt for the F key (your parked ride). */
  vehiclePrompt: Interactable | null = null;
  /** A delivery run in progress. */
  quest: DeliveryQuest | null = null;
  /** Bench you are currently sitting on. */
  sitting: { objId: string; x: number; y: number } | null = null;
  /** Outdoor gym machine you are using right now. */
  workout: { objId: string; t: number } | null = null;
  workoutReadyAt = 0;
  /** Carrying a takeaway order for the delivery job. */
  carrying = false;
  modal: Modal | null = null;
  particles: Particle[] = [];
  activeTrash: TrashSpot[] = [];
  trashInteractables: Interactable[] = [];
  parked: Partial<Record<VehicleKind, { x: number; y: number }>> = {};
  riding: VehicleKind | null = null;
  private traffic: TrafficCar[] = [];
  private trafficId = 1;
  private trafficAcc = 1.2;
  private signal: { phase: SignalPhase; timer: number } = { phase: "green", timer: 9 };
  private finedThisCycle = false;
  name: string;
  playerKey: string;
  wallet: string | null = null;
  onSave: (payload: SaveData, summary: { coins: number; coinsEarned: number; chapter: number; stage: number; won: boolean }) => void;
  onAchievement: (code: string, title: string) => void;

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private dpr = 1;
  private vw = 800;
  private vh = 520;
  private zoom = 1;
  private raf = 0;
  private last = 0;
  private running = false;
  private emitAcc = 0;
  private saveAcc = 0;
  private dirty = false;
  private toastId = 0;
  private winAt = 0;
  private listeners = new Set<() => void>();
  private snapshot: Snapshot;
  private chapterCheckAcc = 0;
  private pollAcc = 0;
  private workSpeed = 0.95;
  private workDir = 1;
  private holdActive = false;
  private holdProgress = 0;
  private holdTargetId: string | null = null;
  private tiredNotified = false;
  private trashRespawnQueue: number[] = [];
  music: GameMusic;
  private musicZone: TrackName | null = null;

  constructor(opts: {
    canvas: HTMLCanvasElement;
    playerKey: string;
    name: string;
    wallet: string | null;
    save: SaveData | null;
    onSave: SqueekGame["onSave"];
    onAchievement: SqueekGame["onAchievement"];
  }) {
    this.canvas = opts.canvas;
    this.playerKey = opts.playerKey;
    this.name = opts.name;
    this.wallet = opts.wallet;
    this.onSave = opts.onSave;
    this.onAchievement = opts.onAchievement;
    this.music = gameMusic();
    this.player.x = this.world.spawn.x;
    this.player.y = this.world.spawn.y;
    if (opts.save) this.hydrate(opts.save);
    else {
      this.modal = {
        type: "dialog",
        speaker: "Chapter 1 · Rock Bottom",
        lines: [
          "Squeek wakes up in the slums. Torn rags, empty pockets, zero Coins.",
          "A rich rat strolls past and smirks: “Out of my way, trash.”",
          "Squeek grits his teeth. Time to climb — starting with the trash piles outside.",
        ],
        index: 0,
      };
      this.banner = { n: 1, title: "Rock Bottom", subtitle: "The slums", age: 0 };
    }
    if (this.gateOpen) {
      this.world.gateOpen = true;
      for (const tile of this.world.gateTiles) this.world.solid[tile.y][tile.x] = false;
    }
    // One pile a day is loaded — twice the Coins if you get there first.
    this.richSpotId = this.world.trashSpots[this.day % this.world.trashSpots.length]?.id ?? null;
    this.seedTrash();
    this.snapshot = this.buildSnapshot();
  }

  // ---------- lifecycle ----------
  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    this.music.ensure();
    this.syncMusic();
    this.pollWheel();
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.update(dt);
      this.render(now / 1000);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.music.stop();
    this.listeners.clear();
  }

  /** District soundtrack: each zone gets its own loop. */
  private syncMusic() {
    const col = Math.floor(this.player.x / TILE);
    const zone: TrackName = col <= WALL_A - 1 ? "slums" : col >= WALL_B + 1 ? "rich" : "office";
    if (zone === this.musicZone) return;
    this.musicZone = zone;
    this.music.setTrack(zone);
  }

  toggleMute(): boolean {
    const muted = this.music.toggleMute();
    try {
      localStorage.setItem("squeek.muted", muted ? "1" : "0");
    } catch {
      /* ignore */
    }
    this.emitNow();
    return muted;
  }

  resize(width: number, height: number, dpr: number) {
    if (!this.canvas) return;
    this.dpr = dpr;
    this.vw = width;
    this.vh = height;
    this.zoom = width < 720 ? 0.75 : 1;
    setZoom(this.zoom);
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
  }

  // ---------- store ----------
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  getSnapshot = () => this.snapshot;

  private emit() {
    this.snapshot = this.buildSnapshot();
    for (const listener of this.listeners) listener();
  }

  private buildSnapshot(): Snapshot {
    return {
      coins: Math.floor(this.coins),
      coinsEarned: Math.floor(this.coinsEarned),
      energy: this.energy,
      energyPct: Math.max(0, Math.min(1, this.energy / ENERGY_MAX)),
      chapter: this.chapter,
      checklist: this.checklist(),
      items: [...this.items],
      stage: stageFor(this.items),
      prompt: this.prompt,
      vehiclePrompt: this.vehiclePrompt,
      promptProgress: this.prompt?.kind === "trash" ? this.holdProgress : 0,
      modal: this.modal,
      toasts: [...this.toasts],
      banner: this.banner,
      won: this.won,
      gateOpen: this.gateOpen,
      works: this.works,
      playedSec: this.playedSec,
      achievements: [...this.achievements],
      name: this.name,
      wallet: this.wallet,
      wheelBoostReadyAt: this.wheelReadyAt,
      muted: this.music.muted,
      riding: this.riding,
      quest: this.quest ? { stage: this.quest.stage, label: this.quest.label } : null,
      sitting: Boolean(this.sitting),
      workingOut: Boolean(this.workout),
      clock: clockLabel(this.clockMin),
      day: this.day,
      phase: this.phase,
      phaseLabel: PHASES.find((x) => x.id === this.phase)?.label ?? "",
      event: {
        id: this.eventId,
        name: EVENTS[this.eventId].name,
        blurb: EVENTS[this.eventId].blurb,
        active: this.eventOn,
      },
      rep: this.rep,
      repLabel: repTier(this.rep),
      friends: Object.entries(this.friends)
        .map(([id, talks]) => ({
          id,
          name: this.world.npcs.find((n) => n.id === id)?.name ?? "Someone",
          talks,
          tier: friendTier(talks),
        }))
        .sort((a, b) => b.talks - a.talks),
      shopOpen: this.shopOpen,
      shift: this.shift
        ? { left: Math.max(0, this.shift.left), served: this.shift.served, total: this.shift.total, cart: this.shift.cart }
        : null,
      comfort: this.comfort,
      furniture: this.furniture,
      busWaiting: this.ridingBus,
      petOut: this.furniture.includes("pet"),
    };
  }

  private checklist(): { label: string; ok: boolean }[] {
    const has = (id: ItemId) => this.items.includes(id);
    switch (this.chapter) {
      case 1:
        return [{ label: "Earn 50 Coins", ok: this.coinsEarned >= 50 }];
      case 2:
        return [
          { label: "Fresh clothes", ok: has("clothes") },
          { label: "Hand-me-down phone", ok: has("old_phone") },
          { label: "Bicycle", ok: has("bicycle") },
        ];
      case 3:
        return [
          { label: "Smartphone", ok: has("smartphone") },
          { label: "Motorbike", ok: has("motorbike") },
        ];
      case 4:
        return [
          { label: "Laptop", ok: has("laptop") },
          { label: "Tailored suit", ok: has("suit") },
          { label: "Sports car", ok: has("car") },
        ];
      default:
        return [
          { label: "Tailored suit", ok: has("suit") },
          { label: "Sports car", ok: has("car") },
          { label: `Carry ${GATE_COINS.toLocaleString("en-US")} Coins`, ok: this.coins >= GATE_COINS },
          { label: "Walk into the rich district", ok: this.won },
        ];
    }
  }

  // ---------- input ----------
  private onKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
    if ((key === "e" || key === "enter" || key === " ") && !event.repeat) this.pressAction();
    if (key === "f" && !event.repeat) this.pressVehicle();
    if (key === "escape") this.closeModal();
    this.keys[key] = true;
  };
  private onKeyUp = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    this.keys[key] = false;
    if (key === "e" || key === "enter" || key === " ") this.releaseAction();
  };

  setVirtualKey(key: "up" | "down" | "left" | "right", pressed: boolean) {
    const map = {
      up: ["arrowup", "w"],
      down: ["arrowdown", "s"],
      left: ["arrowleft", "a"],
      right: ["arrowright", "d"],
    } as const;
    for (const code of map[key]) this.keys[code] = pressed;
  }

  /** Press (keyboard E/Space or the touch button). */
  pressAction() {
    if (this.modal) {
      this.action();
      return;
    }
    if (this.shift && this.serveGuest()) return;
    if (this.prompt?.kind === "trash") {
      this.holdActive = true;
      return;
    }
    this.action();
  }

  /**
   * Press F — get on or off a vehicle. Kept off the E key on purpose: standing
   * outside a shop, E has to stay with the shop.
   */
  pressVehicle() {
    if (this.modal || this.workout) return;
    if (this.sitting) this.standUp();
    if (this.riding) {
      this.dismount();
      return;
    }
    const near = this.parkedNear();
    if (near) this.mount(near.kind);
  }

  /** Release — ends a hold-to-collect interaction. */
  releaseAction() {
    this.holdActive = false;
    this.holdProgress = 0;
    this.holdTargetId = null;
    this.tiredNotified = false;
  }

  action() {
    if (this.modal) {
      if (this.modal.type === "dialog") this.nextDialog();
      else if (this.modal.type === "work") {
        if (this.modal.phase === "intro") this.beginSweep();
        else if (this.modal.phase === "sweep") this.stopMarker();
        else if (this.modal.phase === "result") this.workAgain();
      }
      return;
    }
    if (!this.prompt || this.prompt.kind === "trash") return;
    this.dispatch(this.prompt);
  }

  private dispatch(target: Interactable) {
    switch (target.kind) {
      case "job":
        if (!this.shopOpen) {
          this.toast("Nobody is hiring at this hour. Come back in the morning.", "warn");
          this.music.sfx("deny");
          break;
        }
        this.startWork(target.job!);
        break;
      case "shop":
        if (!this.shopOpen) {
          this.toast("Closed for the night. Doors open again at 07:00.", "warn");
          this.music.sfx("deny");
          break;
        }
        this.openShop(target.shop!);
        break;
      case "bed":
        this.rest();
        break;
      case "gate": {
        if (!this.gateOpen && this.rep >= REP_GATE_OPEN) {
          this.openGate();
          this.gateOpen = true;
          this.world.gateOpen = true;
          for (const tile of this.world.gateTiles) this.world.solid[tile.y][tile.x] = false;
          this.toast(`Officer Crumb: “Evening, ${this.name || "Squeek"}.” — the gate swings open.`, "info");
          this.music.sfx("achievement");
          this.checkChapters();
          break;
        }
        if (!this.shopOpen && this.rep < REP_GATE_OPEN && !this.gateOpen) {
          this.toast(
            `Officer Crumb: “Gate's shut for the night.” — come back in the morning, or make a name for yourself (${this.rep}/${REP_GATE_OPEN}).`,
            "warn"
          );
          this.music.sfx("deny");
          break;
        }
        this.openGate();
        break;
      }
      case "wheel":
        this.openWheel();
        break;
      case "npc": {
        const npc = this.world.npcs.find((n) => n.id === target.npcId);
        if (npc) {
          this.remember(npc);
          const tier = friendTier(this.friends[npc.id] ?? 1);
          const extra = (this.friends[npc.id] ?? 0) >= 3 ? [`“${npc.name.split(" ")[0]} — you again! ${tier} of mine now, aren't you.”`] : [];
          this.modal = { type: "dialog", speaker: npc.name, lines: [...npc.lines, ...extra], index: 0 };
        }
        break;
      }
      case "vehicle": {
        const near = this.parkedNear();
        if (near) this.mount(near.kind);
        break;
      }
      case "bench":
        if (this.sitting) this.standUp();
        else if (target.objId) this.sitDown(target.objId);
        break;
      case "bus":
        this.boardBus(target.id);
        break;
      case "taxi":
        this.callTaxi();
        break;
      case "shift":
        this.startShift(target.id);
        break;
      case "gym":
        if (target.objId) this.useMachine(target.objId);
        break;
      case "mall": {
        this.modal = {
          type: "dialog",
          speaker: "Squeek Mall",
          lines: [
            "“Level 1 is all kiosks, Level 2 is clothes, Level 3 is a food court that never closes.”",
            "“Escalator's the moving stairs, kid. Just… step on.”",
          ],
          index: 0,
        };
        break;
      }
      case "garage": {
        const lines = this.items.includes("car")
          ? [
              "“That's a serious motor you've got. Bring her in, first service is on the house.”",
              "“Runs on hope and premium, does she? We'll fix the hope part.”",
            ]
          : [
              "“No car? Then it's tyre-kicking day. Go on, kick one.”",
              "“Come back when you can afford four wheels, kid. We'll make her sing.”",
            ];
        this.modal = { type: "dialog", speaker: "Grease & Sons Garage", lines, index: 0 };
        break;
      }
      case "home": {
        const lines =
          target.id === "apt-a"
            ? ["“Cheddar Court. Third floor, no lift on Tuesdays, don't ask.”", "“Rent is due Friday. It is always due Friday.”"]
            : target.id === "apt-b"
              ? ["“Brie Terrace. Quiet building, thin walls, everyone knows everyone.”", "“You're not on the list. But you look harmless enough.”"]
              : ["“Muenster Row — twenty-four flats, one washing machine.”", "“Mid-tier living: not a shack, not a mansion. You'll get there.”"];
        this.modal = { type: "dialog", speaker: target.label, lines, index: 0 };
        break;
      }
      case "hotel": {
        const reception = this.won
          ? [
              "“Ah — the self-made Squeek. Your usual suite is ready, sir.”",
              "“The Golden Fork holds a table for you at eight. Shall we send the car?”",
            ]
          : [
              "“Welcome to the Grand Squeek Hotel. Rooms start at 2,000 Coins a night.”",
              "“You are… not dressed for the lobby, but we are too polite to say so.”",
            ];
        this.modal = { type: "dialog", speaker: "Grand Squeek Hotel", lines: reception, index: 0 };
        break;
      }
      case "mansion":
        if (this.won) {
          this.modal = {
            type: "dialog",
            speaker: "Squeek Mansion",
            lines: ["This place is yours now. Try not to squeak too loud.", "From the trash piles to the top floor. A legend."],
            index: 0,
          };
        } else {
          this.toast("The golden gate is still closed.", "warn");
        }
        break;
    }
    this.emitNow();
  }

  // ---------- trash ----------
  private seedTrash() {
    const pool = [...this.world.trashSpots];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    // The loaded pile of the day is always out there somewhere.
    const at = pool.findIndex((spot) => spot.id === this.richSpotId);
    if (at > 0) pool.unshift(...pool.splice(at, 1));
    for (const spot of pool.slice(0, TRASH_MAX_ACTIVE)) this.spawnTrash(spot);
  }

  private spawnTrash(spot: TrashSpot) {
    if (this.activeTrash.some((t) => t.id === spot.id)) return;
    if (Math.hypot((spot.x + 0.5) * TILE - this.player.x, (spot.y + 0.5) * TILE - this.player.y) < 56) return;
    this.activeTrash.push(spot);
    if (spot.kind === "dumpster") this.world.solid[spot.y][spot.x] = true;
    this.trashInteractables.push({
      id: `trash-${spot.id}`,
      kind: "trash",
      x: spot.x,
      y: spot.y,
      label: "Hold E to scavenge",
      spotId: spot.id,
    });
  }

  private removeTrash(spotId: string) {
    const spot = this.activeTrash.find((t) => t.id === spotId);
    if (!spot) return;
    this.activeTrash = this.activeTrash.filter((t) => t.id !== spotId);
    this.trashInteractables = this.trashInteractables.filter((i) => i.spotId !== spotId);
    if (spot.kind === "dumpster") this.world.solid[spot.y][spot.x] = false;
  }

  private nearestTrash(x: number, y: number, maxDistance: number): TrashSpot | null {
    let best: TrashSpot | null = null;
    let bestDist = maxDistance;
    for (const spot of this.activeTrash) {
      const dist = Math.hypot((spot.x + 0.5) * TILE - x, (spot.y + 0.5) * TILE - y);
      if (dist < bestDist) {
        bestDist = dist;
        best = spot;
      }
    }
    return best;
  }

  private updateHold(dt: number) {
    const target = this.prompt;
    if (!this.holdActive || this.modal || !target || target.kind !== "trash") {
      this.holdProgress = 0;
      this.holdTargetId = null;
      return;
    }
    if (this.holdTargetId !== target.id) {
      this.holdTargetId = target.id;
      this.holdProgress = 0;
    }
    if (this.energy < TRASH_ENERGY) {
      if (!this.tiredNotified) {
        this.toast("Too tired to scavenge. Eat something or sleep at home.", "warn");
        this.tiredNotified = true;
        this.emitNow();
      }
      return;
    }
    this.holdProgress = Math.min(1, this.holdProgress + dt / TRASH_HOLD_SECONDS);
    if (this.holdProgress >= 1) this.completeTrashPickup(target);
  }

  private completeTrashPickup(target: Interactable) {
    const spotId = target.spotId!;
    this.removeTrash(spotId);
    this.energy = Math.max(0, this.energy - TRASH_ENERGY);
    const loaded = spotId === this.richSpotId;
    const reward = Math.round(TRASH_REWARD * this.trashMult * (loaded ? RICH_SPOT_MULT : 1));
    this.coins += reward;
    this.coinsEarned += reward;
    this.works += 1;
    this.toast(
      loaded ? `Loaded pile! +${reward} Coins` : `Pile cleared · +${reward} Coins`,
      "coin"
    );
    this.music.sfx("coin");
    for (let i = 0; i < 10; i++) this.spawnPuff((target.x + 0.5) * TILE + (Math.random() * 22 - 11), (target.y + 0.9) * TILE);
    if (this.works === 1) this.unlock("FIRST_WORK");
    if (this.coinsEarned >= 20000) this.unlock("TYCOON");
    this.holdProgress = 0;
    this.holdTargetId = null;
    this.markDirty();
    this.checkChapters();
    this.trashRespawnQueue.push(
      performance.now() + TRASH_RESPAWN_MIN_MS + Math.random() * (TRASH_RESPAWN_MAX_MS - TRASH_RESPAWN_MIN_MS)
    );
    this.emitNow();
  }

  private updateTrashRespawn() {
    const now = performance.now();
    while (this.trashRespawnQueue.length > 0 && this.trashRespawnQueue[0] <= now) {
      this.trashRespawnQueue.shift();
      if (this.activeTrash.length >= TRASH_MAX_ACTIVE) continue;
      const free = this.world.trashSpots.filter((spot) => !this.activeTrash.some((t) => t.id === spot.id));
      if (free.length === 0) continue;
      this.spawnTrash(free[Math.floor(Math.random() * free.length)]);
    }
  }

  // ---------- player actions ----------
  private openShop(shop: ShopId) {
    const meta = KEEPERS[shop];
    const discount = this.rep >= REP_DISCOUNT_AT ? REP_DISCOUNT : 0;
    if (discount > 0) this.toast(`${meta.keeper} knows your face — ${Math.round(discount * 100)}% off today.`, "info");
    this.modal = { type: "shop", shop, title: meta.title, keeper: meta.keeper, discount };
  }

  buyGear(id: ItemId) {
    const gear = gearById(id);
    const discount = this.modal?.type === "shop" ? (this.modal.discount ?? 0) : 0;
    const price = Math.round(gear.price * (1 - discount));
    if (this.items.includes(id)) {
      this.toast(`You already own the ${gear.name.toLowerCase()}.`, "info");
      this.emitNow();
      return;
    }
    if (this.coins < price) {
      const short = Math.ceil(price - this.coins);
      this.toast(
        `Need ${short.toLocaleString("en-US")} more Coins for the ${gear.name.toLowerCase()} — you have ${Math.floor(this.coins).toLocaleString("en-US")}.`,
        "warn"
      );
      this.music.sfx("deny");
      this.emitNow();
      return;
    }
    const stageBefore = stageFor(this.items);
    this.coins -= price;
    this.items.push(id);
    this.music.sfx("buy");
    this.toast(`Bought ${gear.name} (−${gear.price.toLocaleString("en-US")})`, "coin");
    if (stageFor(this.items) > stageBefore) this.toast(`New look: ${gear.name}!`, "info");
    const parkedKind = ITEM_VEHICLE[id];
    if (parkedKind) {
      const bay = PARK_BAY[parkedKind];
      this.parked[parkedKind] = { x: bay.x * TILE, y: bay.y * TILE };
      this.toast(`Your ${gear.name} is parked outside — walk up and press E to ride.`, "info");
    }
    this.markDirty();
    this.checkChapters();
    this.emitNow();
  }

  buyConsumable(id: string) {
    const item = CONSUMABLES.find((c) => c.id === id);
    if (!item) return;
    if (this.coins < item.price) {
      this.toast("Not enough Coins.", "warn");
      this.music.sfx("deny");
      this.emitNow();
      return;
    }
    this.coins -= item.price;
    this.energy = Math.min(ENERGY_MAX, this.energy + item.energy);
    this.music.sfx("buy");
    this.toast(`${item.name}: +${item.energy} energy`, "info");
    this.markDirty();
    this.emitNow();
  }

  private rest() {
    const now = Date.now();
    if (now < this.bedReadyAt) {
      this.toast(`Already rested — ready again in ${Math.ceil((this.bedReadyAt - now) / 1000)}s.`, "warn");
      this.emitNow();
      return;
    }
    this.energy = ENERGY_MAX;
    const bedBonus = this.furniture.includes("bed") ? 3 : 1;
    this.bedReadyAt = now + BED_COOLDOWN_MS / bedBonus;
    // Sleep through to the morning.
    const minutes = (SLEEP_WAKE_MIN - (this.clockMin % 1440) + 1440) % 1440;
    const sleptThrough = minutes > 30;
    if (sleptThrough) {
      this.clockMin += minutes;
      if (Math.floor(this.clockMin / 1440) > 0) {
        this.clockMin -= 1440;
        this.day += 1;
        this.rollDay();
      }
    }
    this.toast(
      sleptThrough ? `Slept through to ${clockLabel(this.clockMin)} on day ${this.day}.` : "Slept well. Energy full.",
      "info"
    );
    this.music.sfx("sleep");
    this.markDirty();
    this.emitNow();
  }

  private startWork(jobId: JobId) {
    const job = jobById(jobId);
    if (job.hold) return;
    if (job.requires && !this.items.includes(job.requires)) {
      const gear = gearById(job.requires);
      this.toast(`Need ${gear.name} for ${job.name} — buy it at the ${SHOP_NAMES[gear.shop]}.`, "warn");
      this.emitNow();
      return;
    }
    if (this.energy < job.energy) {
      this.toast("Out of energy. Eat something or sleep at home.", "warn");
      this.emitNow();
      return;
    }
    // Deliveries are real runs: collect the order, then ride it across town.
    if (jobId === "delivery") {
      this.startDelivery();
      return;
    }
    this.modal = { type: "work", job: jobId, phase: "intro", marker: 0, quality: null, reward: 0 };
    this.emitNow();
  }

  // ---------- delivery runs: pick the order up, then drop it off ----------
  /** The pavement tile right outside a building's door. */
  private doorFront(b: Building): { x: number; y: number } | null {
    const door = b.door;
    if (!door) return null;
    for (const [dx, dy] of [[0, 1], [0, -1], [-1, 0], [1, 0]] as [number, number][]) {
      const x = door.x + dx;
      const y = door.y + dy;
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) continue;
      if (!this.world.solid[y][x]) return { x, y };
    }
    return null;
  }

  /** Somewhere across the slums or the office district to run an order to. */
  private pickDeliveryTarget(): { x: number; y: number; name: string } | null {
    const spots: { x: number; y: number; name: string; b: Building }[] = [];
    for (const b of this.world.buildings) {
      if (!b.door || b.zone === "rich" || b.id === "food-stall" || b.id === "delivery-hub") continue;
      const front = this.doorFront(b);
      if (front) spots.push({ ...front, name: BUILDING_NAMES[b.id] ?? prettyId(b.id), b });
    }
    if (!spots.length) return null;
    const px0 = this.player.x / TILE;
    const py0 = this.player.y / TILE;
    const far = spots.filter((s) => Math.hypot(s.x - px0, s.y - py0) > 7);
    const pool = far.length ? far : spots;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return { x: pick.x, y: pick.y, name: pick.name };
  }

  private startDelivery() {
    const job = jobById("delivery");
    if (this.quest) {
      this.toast(`Finish your run first — ${this.quest.label} is waiting.`, "warn");
      this.music.sfx("deny");
      this.emitNow();
      return;
    }
    if (this.energy < job.energy) {
      this.toast("Out of energy. Eat something or sleep at home.", "warn");
      this.music.sfx("deny");
      this.emitNow();
      return;
    }
    const stall = this.world.buildings.find((b) => b.id === "food-stall");
    const front = stall ? this.doorFront(stall) : null;
    if (!front) {
      this.toast("No orders on the board right now.", "warn");
      this.emitNow();
      return;
    }
    this.energy -= job.energy;
    this.quest = {
      stage: "pickup",
      x: front.x,
      y: front.y,
      label: "Food stall",
      fromX: front.x,
      fromY: front.y,
    };
    this.music.sfx("buy");
    this.toast("Order in! Grab it at the food stall — follow the green circle.", "info");
    this.markDirty();
    this.emitNow();
  }

  private updateQuest() {
    const quest = this.quest;
    if (!quest) return;
    const mx = (quest.x + 0.5) * TILE;
    const my = (quest.y + 0.5) * TILE;
    if (Math.hypot(mx - this.player.x, my - this.player.y) > DELIVERY_REACH) return;
    if (quest.stage === "pickup") {
      const target = this.pickDeliveryTarget();
      if (!target) {
        this.quest = null;
        return;
      }
      quest.stage = "deliver";
      quest.x = target.x;
      quest.y = target.y;
      quest.label = target.name;
      this.carrying = true;
      this.music.sfx("boost");
      this.toast(`Order collected — run it to ${target.name}.`, "info");
      this.spawnBurst(this.player.x, this.player.y - 12, 8);
      this.markDirty();
      this.emitNow();
      return;
    }
    const tiles = Math.hypot(quest.x - quest.fromX, quest.y - quest.fromY);
    const tip = Math.min(DELIVERY_TIP_MAX, Math.round(tiles * DELIVERY_TIP_PER_TILE));
    const reward = jobById("delivery").reward + tip;
    this.coins += reward;
    this.coinsEarned += reward;
    this.works += 1;
    this.carrying = false;
    this.quest = null;
    this.music.sfx("coin");
    this.toast(`Delivered to ${quest.label}! +${reward} Coins (tip +${tip})`, "coin");
    this.spawnBurst(this.player.x, this.player.y - 14, 12);
    if (this.works === 1) this.unlock("FIRST_WORK");
    if (this.coinsEarned >= 20000) this.unlock("TYCOON");
    this.checkChapters();
    this.markDirty();
    this.emitNow();
  }

  // ---------- benches and the outdoor gym ----------
  sitDown(objId: string) {
    if (this.riding) return;
    const bench = this.world.objects.find((o) => o.id === objId);
    if (!bench) return;
    const seatX = (bench.x + bench.w / 2) * TILE;
    const seatY = (bench.y + 1) * TILE - 5;
    const taken = this.world.npcs.some(
      (n) => n.sitting && Math.abs(n.x - seatX) < 18 && Math.abs(n.y - seatY) < 20
    );
    if (taken) {
      this.toast("Someone's already sitting there.", "warn");
      this.music.sfx("deny");
      this.emitNow();
      return;
    }
    this.sitting = { objId, x: seatX, y: seatY };
    this.player.x = seatX;
    this.player.y = seatY;
    this.player.dir = "down";
    this.player.moving = false;
    this.music.sfx("buy");
    this.toast("You sit down and watch the city go by.", "info");
    this.updatePrompt();
    this.emitNow();
  }

  standUp() {
    const seat = this.sitting;
    if (!seat) return;
    const bench = this.world.objects.find((o) => o.id === seat.objId);
    this.sitting = null;
    if (bench) {
      // Step off the bench onto the pavement in front of it.
      this.player.y = Math.min(ROWS * TILE - 10, (bench.y + 1) * TILE + 10);
    }
    this.updatePrompt();
    this.emitNow();
  }

  useMachine(objId: string) {
    const machine = this.world.objects.find((o) => o.id === objId);
    if (!machine || this.workout) return;
    const now = performance.now();
    if (now < this.workoutReadyAt) {
      this.toast(`Catch your breath — ${Math.ceil((this.workoutReadyAt - now) / 1000)}s.`, "warn");
      this.music.sfx("deny");
      this.emitNow();
      return;
    }
    this.workout = { objId, t: 0 };
    this.player.dir = "up";
    this.player.moving = false;
    this.music.sfx("boost");
    this.updatePrompt();
    this.emitNow();
  }

  private updateWorkout(dt: number) {
    const workout = this.workout;
    if (!workout) return;
    workout.t += dt;
    if (Math.random() < dt * 8) {
      this.particles.push({
        x: this.player.x + (Math.random() - 0.5) * 14,
        y: this.player.y - 16,
        vx: (Math.random() - 0.5) * 26,
        vy: -20,
        life: 0,
        maxLife: 0.5,
        color: "#7fe8ff",
        size: 2,
        delay: 0,
        gravity: 90,
      });
    }
    if (workout.t < WORKOUT_SECONDS) return;
    this.workout = null;
    this.workoutReadyAt = performance.now() + WORKOUT_COOLDOWN_MS;
    this.energy = Math.min(ENERGY_MAX, this.energy + WORKOUT_ENERGY);
    this.music.sfx("coin");
    this.toast(`Good set — +${WORKOUT_ENERGY} energy.`, "info");
    this.updatePrompt();
    this.markDirty();
    this.emitNow();
  }

  beginSweep() {
    if (this.modal?.type !== "work") return;
    this.modal.phase = "sweep";
    this.modal.marker = 0;
    this.modal.quality = null;
    this.workDir = 1;
    this.emitNow();
  }

  stopMarker() {
    if (this.modal?.type !== "work" || this.modal.phase !== "sweep") return;
    const job = jobById(this.modal.job);
    const m = this.modal.marker;
    const quality: "perfect" | "good" | "miss" = Math.abs(m - 0.5) < 0.07 ? "perfect" : Math.abs(m - 0.5) < 0.2 ? "good" : "miss";
    const mult = quality === "perfect" ? 1.5 : quality === "good" ? 1 : 0.5;
    const reward = Math.round(job.reward * mult);
    this.energy = Math.max(0, this.energy - job.energy);
    this.coins += reward;
    this.coinsEarned += reward;
    this.works += 1;
    this.modal.phase = "result";
    this.modal.quality = quality;
    this.modal.reward = reward;
    const label = quality === "perfect" ? "Perfect ×1.5" : quality === "good" ? "Good ×1" : "Missed ×0.5";
    this.toast(`${label} · +${reward.toLocaleString("en-US")} Coins`, "coin");
    this.music.sfx(quality);
    if (this.modal.job === "manager") this.unlock("MANAGER");
    if (this.works === 1) this.unlock("FIRST_WORK");
    if (this.coinsEarned >= 20000) this.unlock("TYCOON");
    this.markDirty();
    this.checkChapters();
    this.emitNow();
  }

  workAgain() {
    if (this.modal?.type !== "work") return;
    const job = jobById(this.modal.job);
    if (this.energy < job.energy) {
      this.toast("Out of energy. Eat something or sleep at home.", "warn");
      this.emitNow();
      return;
    }
    this.modal = { type: "work", job: this.modal.job, phase: "intro", marker: 0, quality: null, reward: 0 };
    this.emitNow();
  }

  nextDialog() {
    if (this.modal?.type !== "dialog") return;
    if (this.modal.index + 1 < this.modal.lines.length) this.modal.index += 1;
    else this.modal = null;
    this.emitNow();
  }

  closeModal() {
    if (this.modal?.type === "work" && this.modal.phase === "sweep") return;
    if (this.modal) {
      this.modal = null;
      this.emitNow();
    }
  }

  openGate() {
    this.modal = { type: "gate", checks: this.gateChecks(), open: this.gateOpen };
    this.emitNow();
  }

  private gateChecks() {
    return [
      { label: "Tailored suit", ok: this.items.includes("suit") },
      { label: "Sports car", ok: this.items.includes("car") },
      { label: `Carry ${GATE_COINS.toLocaleString("en-US")} Coins`, ok: this.coins >= GATE_COINS },
    ];
  }

  tryOpenGate() {
    if (this.modal?.type !== "gate") return;
    const checks = this.gateChecks();
    if (!checks.every((c) => c.ok)) {
      this.toast("Not eligible for the rich district yet.", "warn");
      this.emitNow();
      return;
    }
    this.gateOpen = true;
    this.world.gateOpen = true;
    for (const tile of this.world.gateTiles) this.world.solid[tile.y][tile.x] = false;
    this.modal = { type: "gate", checks, open: true };
    this.toast("The golden gate opens. Step through!", "info");
    this.music.sfx("gate");
    this.spawnBurst((WALL_B + 0.5) * TILE, 22 * TILE, 24);
    this.markDirty();
    this.emitNow();
  }

  openWheel() {
    this.modal = {
      type: "wheel",
      state: "loading",
      boost: { status: "idle", message: "Reading live data from Squeekchain…" },
    };
    this.emitNow();
    void this.fetchWheel(true);
  }

  private async pollWheel() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const res = await fetch(api("squeekchain/overview"), { signal: controller.signal });
      const json = await res.json();
      const measurement = json?.status?.data?.measurement;
      this.world.wheelActive = measurement?.coreStatus === "ACTIVE";
    } catch {
      this.world.wheelActive = false;
    } finally {
      clearTimeout(timer);
    }
  }

  private async fetchWheel(fromStation: boolean) {
    const target = this.modal;
    try {
      const res = await fetch(api("squeekchain/overview"));
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "upstream_unavailable");
      const measurement = json?.status?.data?.measurement;
      const active = measurement?.coreStatus === "ACTIVE";
      this.world.wheelActive = active;
      let boost: WheelBoost;
      const now = Date.now();
      if (!measurement) {
        boost = { status: "offline", message: "Squeekchain has no wheel data right now." };
      } else if (!active) {
        boost = { status: "asleep", message: `Squeektoshi is resting (${measurement.coreStatus}). Come back while the wheel is spinning for free energy.` };
      } else if (now < this.wheelReadyAt) {
        boost = { status: "cooldown", message: `Boost already claimed. Ready again in ${Math.ceil((this.wheelReadyAt - now) / 1000)}s.` };
      } else {
        this.energy = Math.min(ENERGY_MAX, this.energy + WHEEL_BOOST_ENERGY);
        this.wheelReadyAt = now + WHEEL_BOOST_MS;
        boost = { status: "granted", message: `Squeektoshi is running for real! +${WHEEL_BOOST_ENERGY} energy.` };
        this.toast(`Hamster Power! +${WHEEL_BOOST_ENERGY} energy`, "info");
        this.music.sfx("boost");
        this.unlock("HAMSTER");
        this.markDirty();
      }
      if (fromStation && this.modal === target) this.modal = { type: "wheel", state: "ok", data: json, boost };
    } catch (error) {
      this.world.wheelActive = false;
      if (fromStation && this.modal === target) {
        this.modal = {
          type: "wheel",
          state: "error",
          error: error instanceof Error ? error.message : "unknown_error",
          boost: { status: "offline", message: "Could not reach api.squeekchain.com." },
        };
      }
    }
    this.emitNow();
  }

  setWallet(address: string | null) {
    this.wallet = address;
    this.markDirty();
    this.emitNow();
  }

  saveNow() {
    if (!this.running) return;
    const payload: SaveData = {
      v: 1,
      coins: Math.floor(this.coins),
      coinsEarned: Math.floor(this.coinsEarned),
      energy: Math.round(this.energy),
      items: [...this.items],
      chapter: this.chapter,
      works: this.works,
      playedSec: Math.round(this.playedSec),
      // Never save the seated spot: reloading inside a bench would trap you.
      pos: this.sitting
        ? { x: Math.round(this.standSpotFor(this.sitting.objId).x), y: Math.round(this.standSpotFor(this.sitting.objId).y) }
        : { x: Math.round(this.player.x), y: Math.round(this.player.y) },
      gateOpen: this.gateOpen,
      won: this.won,
      clockMin: this.clockMin,
      day: this.day,
      friends: { ...this.friends },
      furniture: [...this.furniture],
      bedReadyAt: this.bedReadyAt,
      wheelReadyAt: this.wheelReadyAt,
      achievements: [...this.achievements],
      vehicles: (Object.keys(this.parked) as VehicleKind[]).reduce<Partial<Record<VehicleKind, { x: number; y: number }>>>(
        (acc, kind) => {
          const spot = this.parked[kind];
          if (!spot) return acc;
          const ridingThis = this.riding === kind;
          acc[kind] = {
            x: Math.round(ridingThis ? this.player.x : spot.x),
            y: Math.round(ridingThis ? this.player.y : spot.y),
          };
          return acc;
        },
        {}
      ),
      riding: this.riding,
      quest: this.quest ? { ...this.quest } : null,
    };
    this.dirty = false;
    this.onSave(payload, {
      coins: payload.coins,
      coinsEarned: payload.coinsEarned,
      chapter: this.chapter,
      stage: stageFor(this.items),
      won: this.won,
    });
  }

  /** Where you'd stand after getting up, so a reload never traps you on a bench. */
  private standSpotFor(objId: string): { x: number; y: number } {
    const bench = this.world.objects.find((o) => o.id === objId);
    if (!bench) return { x: this.player.x, y: this.player.y };
    return { x: (bench.x + bench.w / 2) * TILE, y: Math.min(ROWS * TILE - 10, (bench.y + 1) * TILE + 10) };
  }

  private markDirty() {
    this.dirty = true;
  }

  private toast(text: string, kind: Toast["kind"]) {
    this.toastId += 1;
    this.toasts.push({ id: this.toastId, text, kind, age: 0 });
    if (this.toasts.length > 4) this.toasts.shift();
  }

  private unlock(code: string) {
    if (this.achievements.includes(code)) return;
    this.achievements.push(code);
    this.toast(`Achievement: ${ACHIEVEMENTS[code] ?? code}`, "achievement");
    this.music.sfx("achievement");
    this.onAchievement(code, ACHIEVEMENTS[code] ?? code);
    this.markDirty();
  }

  private checkChapters() {
    const has = (id: ItemId) => this.items.includes(id);
    const met = (n: number) =>
      n === 1
        ? this.coinsEarned >= 50
        : n === 2
          ? has("clothes") && has("old_phone") && has("bicycle")
          : n === 3
            ? has("smartphone") && has("motorbike")
            : n === 4
              ? has("laptop") && has("suit") && has("car")
              : false;
    let advanced = false;
    while (this.chapter <= 4 && met(this.chapter)) {
      this.unlock(`CHAPTER_${this.chapter}`);
      this.chapter += 1;
      const def = CHAPTERS[this.chapter - 1];
      this.banner = { n: def.n, title: def.title, subtitle: def.subtitle, age: 0 };
      this.toast(`Chapter ${def.n}: ${def.title}`, "info");
      advanced = true;
    }
    if (advanced) this.markDirty();
  }

  private triggerWin() {
    this.won = true;
    this.unlock("CHAPTER_5");
    this.unlock("WINNER");
    this.music.sfx("win");
    this.winAt = performance.now();
    for (let i = 0; i < 6; i++) {
      const delay = i * 0.35;
      this.spawnBurst(this.player.x + (Math.random() - 0.5) * 320, this.player.y - 160 - Math.random() * 120, 30, delay);
    }
    this.toast("SELF-MADE SQUEEK!", "achievement");
    this.markDirty();
    this.saveNow();
  }

  private spawnBurst(x: number, y: number, count: number, delay = 0) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 170;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        life: 0,
        maxLife: 1.1 + Math.random() * 1.1,
        color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)],
        size: 2 + Math.random() * 3,
        delay,
        gravity: 150,
      });
    }
  }

  private spawnPuff(x: number, y: number) {
    this.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 26,
      vy: -12 - Math.random() * 16,
      life: 0,
      maxLife: 0.45 + Math.random() * 0.35,
      color: "#9a927f",
      size: 2 + Math.random() * 2,
      delay: 0,
      gravity: 40,
    });
  }

  // ---------- simulation ----------
  private update(dt: number) {
    this.playedSec += dt;
    this.updateClock(dt);
    this.energy = Math.min(ENERGY_MAX, this.energy + dt * ENERGY_REGEN_PER_SEC);
    this.syncMusic();

    for (const toast of this.toasts) toast.age += dt;
    this.toasts = this.toasts.filter((toast) => toast.age < 4.2);
    if (this.banner) {
      this.banner.age += dt;
      if (this.banner.age > 4.4) this.banner = null;
    }

    for (const particle of this.particles) {
      if (particle.delay > 0) {
        particle.delay -= dt;
        continue;
      }
      particle.life += dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += particle.gravity * dt;
      particle.vx *= 1 - dt * 1.2;
    }
    this.particles = this.particles.filter((p) => p.life < p.maxLife);
    if (this.rainDrops.length === 0) {
      for (let i = 0; i < 150; i++) {
        this.rainDrops.push({
          x: Math.random() * 1400,
          y: Math.random() * 900,
          len: 8 + Math.random() * 10,
          speed: 520 + Math.random() * 320,
        });
      }
    }

    if (this.modal?.type === "work" && this.modal.phase === "sweep") {
      this.modal.marker += this.workDir * this.workSpeed * dt;
      if (this.modal.marker >= 1) {
        this.modal.marker = 1;
        this.workDir = -1;
      } else if (this.modal.marker <= 0) {
        this.modal.marker = 0;
        this.workDir = 1;
      }
    }

    if (!this.modal && !this.workout) this.movePlayer(dt);
    else this.player.moving = false;
    if (this.sitting) {
      const atHome = Math.hypot(this.player.x - 4.5 * TILE, this.player.y - 20.6 * TILE) < 120;
      const comfy = this.furniture.includes("tv") && atHome ? 2 : 1;
      const homeBonus = atHome ? this.comfort * 0.35 * comfy : 0;
      this.energy = Math.min(ENERGY_MAX, this.energy + dt * (SIT_ENERGY_PER_SEC + homeBonus));
    }
    this.updateGreetings(dt);
    this.updateEventCrowd(dt);
    this.updateBus(dt);
    this.updateRival(dt);
    this.updatePet(dt);
    this.updateShift(dt);
    this.updatePavementPatrol(dt);

    this.updateQuest();
    this.updateWorkout(dt);
    this.updateSignal(dt);
    this.updateTraffic(dt);
    this.updateNpcs(dt);
    this.checkRedLight();
    this.updatePrompt();
    this.updateHold(dt);
    this.updateTrashRespawn();
    this.updateCamera(dt);

    this.chapterCheckAcc += dt;
    if (this.chapterCheckAcc > 0.5) {
      this.chapterCheckAcc = 0;
      this.checkChapters();
    }

    if (this.chapter === 5 && this.gateOpen && !this.won && this.player.x > (WALL_B + 1.6) * TILE) this.triggerWin();

    if (this.won && this.modal === null && this.winAt > 0 && performance.now() - this.winAt > 2400) {
      this.modal = {
        type: "win",
        coinsEarned: Math.floor(this.coinsEarned),
        works: this.works,
        playedSec: Math.round(this.playedSec),
        achievements: this.achievements.length,
      };
      this.winAt = 0;
      this.emitNow();
    }

    this.pollAcc += dt;
    if (this.pollAcc > 45) {
      this.pollAcc = 0;
      void this.pollWheel();
    }

    this.saveAcc += dt;
    if (this.dirty && this.saveAcc > 8) {
      this.saveAcc = 0;
      this.saveNow();
    }

    this.emitAcc += dt;
    const busy = (this.modal?.type === "work" && this.modal.phase === "sweep") || this.holdProgress > 0;
    if (this.emitAcc > (busy ? 0.033 : 0.09)) {
      this.emitAcc = 0;
      this.emit();
    }
  }

  private movePlayer(dt: number) {
    const keys = this.keys;
    let dx = 0;
    let dy = 0;
    if (keys["a"] || keys["arrowleft"]) dx -= 1;
    if (keys["d"] || keys["arrowright"]) dx += 1;
    if (keys["w"] || keys["arrowup"]) dy -= 1;
    if (keys["s"] || keys["arrowdown"]) dy += 1;
    const moving = dx !== 0 || dy !== 0;
    // Any step stands you up off the bench first.
    if (moving && this.sitting) {
      this.standUp();
      return;
    }
    this.player.moving = moving;
    if (!moving) return;
    const len = Math.hypot(dx, dy) || 1;
    const speed = this.riding ? VEHICLES[this.riding].speed : 152;
    const stepX = (dx / len) * speed * dt;
    const stepY = (dy / len) * speed * dt;
    if (Math.abs(dx) > Math.abs(dy)) this.player.dir = dx > 0 ? "right" : "left";
    else this.player.dir = dy > 0 ? "down" : "up";
    if (this.canStand(this.player.x + stepX, this.player.y)) this.player.x += stepX;
    if (this.canStand(this.player.x, this.player.y + stepY)) this.player.y += stepY;
    this.player.x = Math.max(18, Math.min(COLS * TILE - 18, this.player.x));
    this.player.y = Math.max(20, Math.min(ROWS * TILE - 8, this.player.y));
    this.player.anim += dt * 2.2;
  }

  private canStand(x: number, y: number) {
    const points: [number, number][] = [
      [x - 9, y - 4],
      [x + 9, y - 4],
      [x - 9, y + 3],
      [x + 9, y + 3],
    ];
    return points.every(([px_, py_]) => !isSolidAt(this.world, px_, py_));
  }

  private moveNpcTowards(npc: { x: number; y: number; dir: Dir; anim: number; moving: boolean }, tx: number, ty: number, speed: number, dt: number) {
    const dx = tx - npc.x;
    const dy = ty - npc.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return true;
    const stepX = (dx / dist) * speed * dt;
    const stepY = (dy / dist) * speed * dt;
    if (Math.abs(dx) > Math.abs(dy)) npc.dir = dx > 0 ? "right" : "left";
    else npc.dir = dy > 0 ? "down" : "up";
    let blocked = false;
    if (!isSolidAt(this.world, npc.x + stepX, npc.y)) npc.x += stepX;
    else blocked = true;
    if (!isSolidAt(this.world, npc.x, npc.y + stepY)) npc.y += stepY;
    else blocked = true;
    npc.moving = !blocked;
    npc.anim += dt * 2;
    return dist < 6 || blocked;
  }

  /** Kinds who will happily stop for a natter instead of getting on with life. */
  private static CHATTY = new Set(["citizen", "resident", "richrat", "scavenger", "worker", "staff", "guest"]);

  /**
   * Small talk: two locals who happen to be near each other stop, turn to face
   * one another and swap a couple of lines. It costs nothing and it is the
   * difference between a city and a diorama.
   */
  private startChat() {
    const pool = this.world.npcs.filter(
      (n) =>
        !n.hidden &&
        !n.route &&
        !n.digging &&
        !n.chatFor &&
        !(n.chatCool && n.chatCool > 0) &&
        SqueekGame.CHATTY.has(n.kind) &&
        (!n.sitting || n.eating || Math.random() < 0.5)
    );
    for (let attempt = 0; attempt < 12; attempt++) {
      const a = pool[Math.floor(Math.random() * pool.length)];
      if (!a) return;
      const b = pool.find(
        (n) => n !== a && !n.chatFor && Math.hypot(n.x - a.x, n.y - a.y) < 96
      );
      if (!b) continue;
      const conv = Math.floor(Math.random() * CHATS.length);
      const total = 5 + Math.random() * 3.5;
      for (const [npc, role] of [[a, 0], [b, 1]] as [World["npcs"][number], number][]) {
        npc.chatFor = total;
        npc.chatTotal = total;
        npc.chatConv = conv;
        npc.chatRole = role;
        npc.chatCool = 0;
        npc.stop = 0;
        npc.target = null;
        if (!npc.sitting) {
          const dx = (role === 0 ? b.x : a.x) - npc.x;
          const dy = (role === 0 ? b.y : a.y) - npc.y;
          npc.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
        }
      }
      this.chatting += 1;
      return;
    }
  }

  private updateChat(npc: World["npcs"][number], dt: number) {
    const left = (npc.chatFor ?? 0) - dt;
    npc.chatFor = Math.max(0, left);
    npc.moving = false;
    const elapsed = (npc.chatTotal ?? 0) - npc.chatFor;
    const phase = Math.floor(elapsed / 2.6);
    // Only whoever holds the floor gets a bubble — one line at a time.
    const speaker = phase % 2;
    if ((npc.chatConv ?? 0) >= 0) {
      npc.chatLine = (npc.chatRole ?? 0) === speaker ? CHATS[npc.chatConv ?? 0][speaker] : undefined;
    }
    if (npc.chatFor <= 0) {
      npc.chatLine = undefined;
      npc.chatTotal = 0;
      npc.chatCool = 16 + Math.random() * 26;
      this.chatting = Math.max(0, this.chatting - 1);
    }
  }

  private updateNpcs(dt: number) {
    // Night empties the streets; rain sends half of them home too.
    const night = this.phase === "night";
    const wet = this.eventOn && this.eventId === "rain";
    for (const npc of this.world.npcs) {
      if (npc.nightOwl === undefined) {
        const hash = npc.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
        npc.nightOwl =
          ["police", "courier", "rival", "pet", "customer", "dancer", "marcher"].includes(npc.kind) || hash % 100 < 28;
      }
      const shouldRest = (night && !npc.nightOwl) || (wet && !npc.nightOwl && npc.kind !== "chef" && npc.kind !== "waiter");
      if (shouldRest !== Boolean(npc.offDuty)) npc.offDuty = shouldRest;
    }
    if (this.chatTimer > 0) this.chatTimer -= dt;
    if (this.chatTimer <= 0) {
      this.chatTimer = 4 + Math.random() * 5;
      if (this.chatting < 3) this.startChat();
    }
    for (const npc of this.world.npcs) {
      if (npc.chatCool && npc.chatCool > 0) npc.chatCool -= dt;
      if (npc.offDuty) {
        npc.moving = false;
        continue;
      }
      if (npc.kind === "pet" || npc.following) continue;
      if (npc.kind === "rival") continue;
      if (npc.kind === "dancer") {
        npc.moving = false;
        npc.anim += dt * 4;
        continue;
      }
      if (npc.kind === "marcher") continue;
      if (npc.chatFor && npc.chatFor > 0) {
        this.updateChat(npc, dt);
        continue;
      }
      if (npc.kind === "guard") continue;
      if (npc.kind === "police") {
        this.updateCop(npc, dt);
        continue;
      }
      if (npc.route) {
        this.updateRoute(npc, dt);
        continue;
      }
      if (npc.sitting) {
        npc.moving = false;
        continue;
      }
      if (npc.kind === "golfer") {
        this.updateGolfer(npc, dt);
        continue;
      }
      if (npc.kind === "worker") this.updateWorker(npc, dt);
      else if (npc.kind === "scavenger") this.updateScavenger(npc, dt);
      else this.updateWanderer(npc, dt);
    }
  }

  private updateWorker(npc: World["npcs"][number], dt: number) {
    if (npc.hidden) {
      npc.moving = false;
      npc.timer -= dt;
      if (npc.timer <= 0) {
        const door = this.world.officeDoors[Math.floor(Math.random() * this.world.officeDoors.length)];
        npc.x = door.x;
        npc.y = door.y;
        npc.hidden = false;
        npc.target = null;
        npc.pause = 0.2 + Math.random() * 1.4;
      }
      return;
    }
    if (npc.pause > 0) {
      npc.pause -= dt;
      npc.moving = false;
      return;
    }
    if (!npc.target) {
      const door = this.world.officeDoors[Math.floor(Math.random() * this.world.officeDoors.length)];
      if (Math.random() < 0.42) {
        npc.target = { x: door.x, y: door.y };
        npc.goingInside = true;
      } else {
        npc.target = { x: door.x + (Math.random() * 150 - 75), y: door.y + (Math.random() < 0.5 ? -22 : 30) };
        npc.goingInside = false;
      }
      return;
    }
    const arrived = this.moveNpcTowards(npc, npc.target.x, npc.target.y, 54, dt);
    if (!arrived) return;
    if (npc.goingInside) {
      npc.hidden = true;
      npc.timer = 2.5 + Math.random() * 7;
      npc.goingInside = false;
    } else {
      npc.pause = 0.6 + Math.random() * 2.2;
    }
    npc.target = null;
  }

  /** Delivery riders loop between the food stall and their drop-off point. */
  /**
   * BFS across the tile grid between two waypoints, so a route npc walks around
   * a cart or a wall rather than grinding against it.
   */
  private routePath(npc: World["npcs"][number], leg: { x: number; y: number }): { x: number; y: number }[] {
    const sx = Math.floor(npc.x / TILE);
    const sy = Math.floor(npc.y / TILE);
    const tx = Math.floor(leg.x);
    const ty = Math.floor(leg.y);
    const key = (x: number, y: number) => y * COLS + x;
    const walkable = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
      return !isSolidAt(this.world, (x + 0.5) * TILE, (y + 0.5) * TILE);
    };
    if (sx === tx && sy === ty) return [];
    if (!walkable(tx, ty)) return [];
    const prev = new Map<number, number>();
    const seen = new Set<number>([key(sx, sy)]);
    const queue: [number, number][] = [[sx, sy]];
    let found = false;
    while (queue.length && !found) {
      const [x, y] = queue.shift()!;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]) {
        const nx = x + dx;
        const ny = y + dy;
        if (seen.has(key(nx, ny)) || !walkable(nx, ny)) continue;
        seen.add(key(nx, ny));
        prev.set(key(nx, ny), key(x, y));
        if (nx === tx && ny === ty) {
          found = true;
          break;
        }
        queue.push([nx, ny]);
      }
    }
    if (!found) return [];
    const path: { x: number; y: number }[] = [];
    let cur = key(tx, ty);
    while (cur !== key(sx, sy)) {
      path.push({ x: (cur % COLS) + 0.5, y: Math.floor(cur / COLS) + 0.5 });
      const p = prev.get(cur);
      if (p === undefined) return [];
      cur = p;
    }
    path.reverse();
    return path;
  }

  private followRoutePath(
    npc: World["npcs"][number],
    leg: { x: number; y: number },
    speed: number,
    dt: number
  ) {
    const index = npc.routeIndex ?? 0;
    if (npc.pathFor !== index || !npc.path) {
      npc.path = this.routePath(npc, leg);
      npc.pathFor = index;
      npc.pathAt = 0;
    }
    const path = npc.path;
    if (path.length === 0) {
      // Straight line (or already there) — the old behaviour.
      return this.moveNpcTowards(npc, leg.x * TILE, leg.y * TILE, speed, dt);
    }
    const at = Math.min(npc.pathAt ?? 0, path.length - 1);
    const node = path[at];
    const last = at === path.length - 1;
    const goalX = last ? leg.x * TILE : node.x * TILE;
    const goalY = last ? leg.y * TILE : node.y * TILE;
    const arrived = this.moveNpcTowards(npc, goalX, goalY, speed, dt);
    if (arrived && !last) {
      npc.pathAt = at + 1;
      return false;
    }
    if (arrived) npc.path = null;
    return arrived;
  }

  private updateRoute(npc: World["npcs"][number], dt: number) {
    const route = npc.route;
    if (!route || route.length < 2) {
      this.updateWanderer(npc, dt);
      return;
    }
    if (npc.vanishFor && npc.vanishFor > 0) {
      npc.vanishFor -= dt;
      npc.moving = false;
      if (npc.vanishFor <= 0) {
        npc.vanishFor = 0;
        npc.hidden = false;
      }
      return;
    }
    if (npc.stop && npc.stop > 0) {
      npc.stop -= dt;
      npc.moving = false;
      return;
    }
    const index = npc.routeIndex ?? 0;
    const leg = route[index];
    const speed = npc.kind === "jogger" ? 154 : npc.kind === "waiter" ? 104 : 92;
    // Walk around buildings instead of into them: waiters, couriers and the
    // takeaway crowd all share this pathing.
    const arrived = this.followRoutePath(npc, leg, speed, dt);
    if (arrived) {
      npc.routeIndex = (index + 1) % route.length;
      // Waypoints carry their own pause: long at the pickup and the drop-off.
      npc.stop = leg.wait ?? 0.08;
      // Some waypoints are a doorway: the npc steps inside for a while.
      if (leg.vanish) {
        npc.hidden = true;
        npc.vanishFor = leg.vanish;
      }
    }
  }

  /** Golfers stroll the fairway and stop to swing at the ball. */
  private updateGolfer(npc: World["npcs"][number], dt: number) {
    if (npc.swinging) {
      npc.anim += dt;
      npc.moving = false;
      npc.timer -= dt;
      if (npc.timer <= 0) {
        npc.swinging = false;
        npc.pause = 1.5 + Math.random() * 3;
      }
      return;
    }
    this.updateWanderer(npc, dt);
    if (!npc.moving && npc.pause > 0 && Math.random() < dt * 0.4) {
      npc.swinging = true;
      npc.timer = 1.2;
    }
  }

  private updateScavenger(npc: World["npcs"][number], dt: number) {
    if (npc.digging) {
      npc.anim += dt;
      npc.moving = false;
      npc.timer -= dt;
      npc.digPuff -= dt;
      if (npc.digPuff <= 0) {
        npc.digPuff = 0.5;
        this.spawnPuff(npc.x + (Math.random() * 18 - 9), npc.y - 2);
      }
      if (npc.timer <= 0) {
        npc.digging = false;
        npc.pause = 0.8 + Math.random() * 2;
      }
      return;
    }
    if (npc.pause > 0) {
      npc.pause -= dt;
      npc.moving = false;
      return;
    }
    if (!npc.target) {
      const trash = this.nearestTrash(npc.x, npc.y, 300);
      if (trash && Math.random() < 0.82) {
        npc.target = { x: (trash.x + 0.5) * TILE + (Math.random() * 18 - 9), y: (trash.y + 0.5) * TILE + 14 };
      } else {
        for (let attempt = 0; attempt < 10; attempt++) {
          const tx = (npc.hx + (Math.random() * 2 - 1) * npc.r) * TILE;
          const ty = (npc.hy + (Math.random() * 2 - 1) * npc.r) * TILE;
          if (!isSolidAt(this.world, tx, ty)) {
            npc.target = { x: tx, y: ty };
            break;
          }
        }
      }
      if (!npc.target) npc.pause = 2;
      return;
    }
    const arrived = this.moveNpcTowards(npc, npc.target.x, npc.target.y, 40, dt);
    if (!arrived) return;
    npc.target = null;
    const trash = this.nearestTrash(npc.x, npc.y, 52);
    if (trash) {
      npc.digging = true;
      npc.timer = 2 + Math.random() * 2.5;
      npc.digPuff = 0.2;
    } else {
      npc.pause = 1 + Math.random() * 2;
    }
  }

  private updateWanderer(npc: World["npcs"][number], dt: number) {
    if (npc.pause > 0) {
      npc.pause -= dt;
      npc.moving = false;
      return;
    }
    if (!npc.target) {
      for (let attempt = 0; attempt < 10; attempt++) {
        const tx = (npc.hx + (Math.random() * 2 - 1) * npc.r) * TILE;
        const ty = (npc.hy + (Math.random() * 2 - 1) * npc.r) * TILE;
        if (!isSolidAt(this.world, tx, ty)) {
          npc.target = { x: tx, y: ty };
          break;
        }
      }
      if (!npc.target) npc.pause = 2;
      return;
    }
    const arrived = this.moveNpcTowards(npc, npc.target.x, npc.target.y, 42, dt);
    if (arrived) {
      npc.target = null;
      npc.pause = 1.2 + Math.random() * 2.4;
      npc.moving = false;
    }
  }

  // ---------- the living city ----------

  /** Extra faces out on Market Day, dancers at the festival, marchers in the parade. */
  private updateEventCrowd(dt: number) {
    void dt;
    const want: { id: string; kind: World["npcs"][number]["kind"]; x: number; y: number; dir: World["npcs"][number]["dir"]; dancing?: boolean; marching?: boolean }[] = [];
    if (this.eventOn && this.eventId === "market") {
      const spots: [number, number][] = [
        [7, 26],
        [12, 25],
        [19, 26],
        [24, 25],
        [31, 26],
        [40, 25],
      ];
      spots.forEach(([x, y], i) =>
        want.push({ id: `mkt-${i}`, kind: "citizen", x, y, dir: i % 2 ? "left" : "right" })
      );
    }
    if (this.eventOn && this.eventId === "festival") {
      const spots: [number, number][] = [
        [24, 25],
        [26, 25],
        [28, 25],
        [30, 25],
        [32, 25],
        [34, 25],
      ];
      spots.forEach(([x, y], i) =>
        want.push({ id: `fest-${i}`, kind: "dancer", x, y, dir: i % 2 ? "left" : "right", dancing: true })
      );
    }
    if (this.eventOn && this.eventId === "parade") {
      for (let i = 0; i < 6; i++) {
        want.push({ id: `par-${i}`, kind: "marcher", x: 48 + i * 2, y: 25, dir: "right", marching: true });
      }
    }
    const wanted = new Set(want.map((w) => w.id));
    // Retire anyone whose event is over.
    this.world.npcs = this.world.npcs.filter((n) => !this.eventCrowd.includes(n.id) || wanted.has(n.id));
    this.eventCrowd = this.eventCrowd.filter((id) => wanted.has(id));
    for (const w of want) {
      if (this.world.npcs.some((n) => n.id === w.id)) continue;
      this.world.npcs.push({
        id: w.id,
        name: w.dancing ? "Dancer" : w.marching ? "Marcher" : "Shopper",
        kind: w.kind,
        x: w.x * TILE,
        y: w.y * TILE,
        hx: w.x,
        hy: w.y,
        r: w.marching ? 0 : 1.6,
        dir: w.dir,
        moving: false,
        anim: 0,
        target: null,
        pause: 0,
        timer: 0,
        hidden: false,
        stop: 0,
        digging: false,
        lines: ["“What a day to be out.”"],
        goingInside: false,
        digPuff: 0,
        dancing: w.dancing,
        marching: w.marching,
        nightOwl: true,
      });
      this.eventCrowd.push(w.id);
    }
    // Marchers walk the golden street and loop.
    if (this.eventOn && this.eventId === "parade") {
      for (const npc of this.world.npcs) {
        if (!npc.marching) continue;
        npc.x += RIVAL_SPEED * 0.5 * (1 / 60);
        npc.moving = true;
        if (npc.x > 66 * TILE) npc.x = 46 * TILE;
      }
    }
  }

  /** The bus: a real vehicle that loops the road and pulls in at the stops. */
  private updateBus(dt: number) {
    const lane = LANE_Y[1];
    this.busX += BUS_SPEED * this.busDir * dt;
    if (this.busX > COLS * TILE + 60) {
      this.busX = -60;
    }
    const stops = this.world.busStops;
    const next = stops[this.busStopIndex];
    const targetX = (next.x + 1) * TILE;
    if (this.busDir > 0 && this.busX > targetX - 6 && this.busDwell <= 0) {
      this.busDwell = BUS_DWELL_SEC;
    }
    if (this.busDwell > 0) {
      this.busDwell -= dt;
      if (this.busDwell <= 0) {
        this.busStopIndex = (this.busStopIndex + 1) % stops.length;
        const following = stops[this.busStopIndex];
        this.busDir = (following.x + 1) * TILE > this.busX ? 1 : -1;
      }
    }
    void lane;
    // Riding it: hop off when it next pulls in.
    if (this.ridingBus && this.busDwell > 0) {
      const stop = stops[this.busStopIndex];
      this.ridingBus = false;
      this.player.x = (stop.x + 0.5) * TILE;
      this.player.y = (stop.y + 1.6) * TILE;
      this.toast(`Off at ${stop.label}.`, "info");
      this.music.sfx("achievement");
      this.emitNow();
    }
  }

  private boardBus(stopId: string) {
    const stop = this.world.busStops.find((b) => `${b.id}-wait` === stopId);
    if (!stop) return;
    if (this.ridingBus) return;
    if (this.busDwell <= 0 || Math.abs(this.busX - (stop.x + 1) * TILE) > 40) {
      this.toast("The bus is not here yet — wait at the stop.", "warn");
      this.emitNow();
      return;
    }
    if (this.coins < BUS_FARE) {
      this.toast(`The fare is ${BUS_FARE} Coins.`, "warn");
      this.emitNow();
      return;
    }
    this.coins -= BUS_FARE;
    this.ridingBus = true;
    this.player.moving = false;
    this.toast(`On the bus · −${BUS_FARE} Coins. Next stop coming up.`, "info");
    this.music.sfx("buy");
    this.markDirty();
    this.emitNow();
  }

  private callTaxi() {
    this.modal = { type: "taxi" };
    this.emitNow();
  }

  takeTaxi(id: "slums" | "office" | "rich") {
    const dest = TAXI_FARES.find((t) => t.id === id);
    if (!dest) return;
    if (this.coins < dest.fare) {
      this.toast(`That ride costs ${dest.fare} Coins.`, "warn");
      this.emitNow();
      return;
    }
    this.coins -= dest.fare;
    this.player.x = (dest.x + 0.5) * TILE;
    this.player.y = (dest.y + 1.4) * TILE;
    this.toast(`Taxi drops you at ${dest.label} · −${dest.fare} Coins.`, "info");
    this.music.sfx("buy");
    this.closeModal();
    this.markDirty();
    this.emitNow();
  }

  /** Slick Whiskers raids the same piles you do. He is faster than he looks. */
  private updateRival(dt: number) {
    const rival = this.world.npcs.find((n) => n.kind === "rival");
    if (!rival || this.modal) return;
    if (!this.raidSpot) {
      const live = this.activeTrash.filter((t) => t.id !== this.richSpotId);
      if (live.length === 0) return;
      const pick = live[Math.floor(Math.random() * live.length)];
      this.raidSpot = pick.id;
      rival.raidTarget = pick.id;
    }
    const spot = this.activeTrash.find((t) => t.id === this.raidSpot);
    if (!spot) {
      this.raidSpot = null;
      rival.raidFor = 0;
      return;
    }
    const tx = (spot.x + 0.5) * TILE;
    const ty = (spot.y + 1.1) * TILE;
    const arrived = this.moveNpcTowards(rival, tx, ty, RIVAL_SPEED, dt);
    if (!arrived) return;
    rival.raidFor = (rival.raidFor ?? 0) + dt;
    if (rival.raidFor < RIVAL_GRAB_SEC) {
      if (Math.random() < 0.3) this.spawnPuff(tx + (Math.random() * 14 - 7), ty);
      return;
    }
    // Got it first.
    this.removeTrash(spot.id);
    this.raidSpot = null;
    rival.raidFor = 0;
    this.trashRespawnQueue.push(
      performance.now() + TRASH_RESPAWN_MIN_MS + Math.random() * (TRASH_RESPAWN_MAX_MS - TRASH_RESPAWN_MIN_MS)
    );
    if (Math.hypot(this.player.x - tx, this.player.y - ty) < 380) this.toast(RIVAL_STEAL_TOAST, "warn");
    this.emitNow();
  }

  /** Crumb the pet rat trots behind you and digs up the odd Coin. */
  private updatePet(dt: number) {
    const pet = this.world.npcs.find((n) => n.following);
    if (!this.furniture.includes("pet")) {
      if (pet) this.world.npcs = this.world.npcs.filter((n) => !n.following);
      return;
    }
    if (!pet) {
      this.world.npcs.push({
        id: "pet-crumb",
        name: "Crumb",
        kind: "pet",
        x: this.player.x - 22,
        y: this.player.y + 14,
        hx: this.player.x / TILE,
        hy: this.player.y / TILE,
        r: 0,
        dir: "down",
        moving: false,
        anim: 0,
        target: null,
        pause: 0,
        timer: 0,
        hidden: false,
        stop: 0,
        digging: false,
        lines: ["“Squeak!”"],
        goingInside: false,
        digPuff: 0,
        following: true,
        nightOwl: true,
      });
      return;
    }
    const behind = this.riding ? 46 : 26;
    const goalX = this.player.x - (this.player.dir === "left" ? -behind : behind);
    const goalY = this.player.y + 12;
    const dist = Math.hypot(goalX - pet.x, goalY - pet.y);
    if (dist > 12) {
      pet.x += (goalX - pet.x) * Math.min(1, dt * 3.4);
      pet.y += (goalY - pet.y) * Math.min(1, dt * 3.4);
      pet.moving = true;
      pet.dir = goalX < pet.x ? "left" : "right";
    } else {
      pet.moving = false;
    }
    pet.anim += dt * 2;
    const now = performance.now();
    if (now >= this.petCoinAt) {
      this.petCoinAt = now + PET_COIN_EVERY_MS;
      if (dist < 90 && !this.riding) {
        this.coins += PET_COIN_AMOUNT;
        this.coinsEarned += PET_COIN_AMOUNT;
        this.toast(`Crumb sniffs out ${PET_COIN_AMOUNT} Coins.`, "coin");
        this.music.sfx("coin");
        for (let i = 0; i < 6; i++) this.spawnPuff(pet.x + (Math.random() * 16 - 8), pet.y - 4);
        this.markDirty();
        this.emitNow();
      }
    }
  }

  /** A shift on the counter: customers come, you serve them, you get paid. */
  startShift(spotId: string) {
    const spot =
      this.world.shiftSpots.find((s) => s.id === spotId) ??
      this.world.shiftSpots.find((s) => `shift-${s.x - 1}` === spotId);
    if (!spot) return;
    if (this.shift) {
      this.toast("You are already on a shift.", "warn");
      this.emitNow();
      return;
    }
    if (performance.now() < this.shiftCooldownUntil) {
      const left = Math.ceil((this.shiftCooldownUntil - performance.now()) / 1000);
      this.toast(`Catch your breath — next shift in ${left}s.`, "warn");
      this.emitNow();
      return;
    }
    if (this.energy < SHIFT_ENERGY) {
      this.toast("Too tired for a shift. Eat something first.", "warn");
      this.emitNow();
      return;
    }
    if (!this.shopOpen) {
      this.toast("The counter is closed for the night.", "warn");
      this.emitNow();
      return;
    }
    this.energy -= SHIFT_ENERGY;
    this.player.x = (spot.x + 0.5) * TILE;
    this.player.y = (spot.y + 0.7) * TILE;
    this.player.moving = false;
    this.shift = {
      spotId: spot.id,
      left: SHIFT_SECONDS,
      served: 0,
      total: SHIFT_CUSTOMERS,
      cart: spot.name,
      spawnIn: 1.5,
      readyAt: 0,
    };
    this.toast(`Shift started at ${spot.name}. Serve the queue with E.`, "info");
    this.music.sfx("achievement");
    this.emitNow();
  }

  private spawnShiftGuest(spot: World["shiftSpots"][number]) {
    const id = `guest-${Math.floor(Math.random() * 1e9)}`;
    const order = SHIFT_ORDERS[Math.floor(Math.random() * SHIFT_ORDERS.length)];
    const queueX = spot.counterX + (Math.random() * 1.4 - 0.7);
    this.world.npcs.push({
      id,
      name: "Customer",
      kind: "customer",
      x: queueX * TILE,
      y: (spot.counterY + 1.4) * TILE,
      hx: queueX,
      hy: spot.counterY + 1.4,
      r: 0,
      dir: "up",
      moving: false,
      anim: 0,
      target: null,
      pause: 0,
      timer: 0,
      hidden: false,
      stop: 0,
      digging: false,
      lines: [`“${order}”`],
      goingInside: false,
      digPuff: 0,
      shiftGuest: true,
      order,
      umbrella: this.eventOn && this.eventId === "rain",
      route: [
        { x: queueX, y: spot.counterY, wait: 4.2 },
        { x: spot.doorX, y: spot.doorY, wait: 0.4 },
        { x: spot.doorX, y: spot.doorY, vanish: 2 },
      ],
      routeIndex: 0,
      nightOwl: true,
    });
    this.shiftGuests.push(id);
  }

  private updateShift(dt: number) {
    if (!this.shift) return;
    const spot = this.world.shiftSpots.find((s) => s.id === this.shift!.spotId);
    if (!spot) {
      this.shift = null;
      return;
    }
    this.shift.left -= dt;
    this.shift.spawnIn -= dt;
    if (this.shift.spawnIn <= 0 && this.shift.served + this.shiftGuests.length < this.shift.total) {
      this.spawnShiftGuest(spot);
      this.shift.spawnIn = 7 + Math.random() * 4;
    }
    // Guests leave when they have been served or have waited too long.
    const guests = this.world.npcs.filter((n) => n.shiftGuest);
    for (const guest of guests) {
      if (guest.served) continue;
      if ((guest.routeIndex ?? 0) >= 2 && !guest.hidden) {
        this.dropGuest(guest, false);
      }
    }
    // Walking off the job.
    const away = Math.hypot(this.player.x - (spot.x + 0.5) * TILE, this.player.y - (spot.y + 0.7) * TILE);
    if (away > 96) {
      this.endShift("You wandered off the counter.");
      return;
    }
    if (this.shift.left <= 0) this.endShift(null);
  }

  /** Serving whoever is standing at the counter right now. */
  private serveGuest(): boolean {
    if (!this.shift) return false;
    const spot = this.world.shiftSpots.find((s) => s.id === this.shift!.spotId);
    if (!spot) return false;
    const counter = { x: spot.counterX * TILE, y: spot.counterY * TILE };
    const guest = this.world.npcs.find(
      (n) =>
        n.shiftGuest &&
        !n.served &&
        !n.hidden &&
        (n.routeIndex ?? 0) === 0 &&
        Math.hypot(n.x - counter.x, n.y - counter.y) < SHIFT_SERVE_REACH
    );
    if (!guest) return false;
    guest.served = true;
    guest.lines = ["“Thanks — keep the change.”"];
    guest.routeIndex = 1;
    guest.stop = 0.2;
    this.shift.served += 1;
    this.coins += SHIFT_PAY;
    this.coinsEarned += SHIFT_PAY;
    this.works += 1;
    this.toast(`${guest.order ?? "Order"} · +${SHIFT_PAY} Coins`, "coin");
    this.music.sfx("coin");
    for (let i = 0; i < 8; i++) this.spawnPuff(guest.x + (Math.random() * 20 - 10), guest.y - 6);
    if (this.shift.served >= this.shift.total) this.endShift(null);
    this.markDirty();
    this.emitNow();
    return true;
  }

  private dropGuest(guest: World["npcs"][number], paid: boolean) {
    void paid;
    guest.served = true;
    guest.hidden = true;
    guest.vanishFor = 0.1;
    this.world.npcs = this.world.npcs.filter((n) => n !== guest);
  }

  private endShift(reason: string | null) {
    const shift = this.shift;
    if (!shift) return;
    this.shift = null;
    this.shiftCooldownUntil = performance.now() + SHIFT_COOLDOWN_MS;
    for (const id of this.shiftGuests) {
      this.world.npcs = this.world.npcs.filter((n) => n.id !== id);
    }
    this.shiftGuests = [];
    const perfect = shift.served >= shift.total;
    if (perfect) {
      this.coins += SHIFT_BONUS;
      this.coinsEarned += SHIFT_BONUS;
      this.toast(`Shift done — every order served. +${SHIFT_BONUS} Coins bonus!`, "coin");
      this.unlock("FIRST_WORK");
    } else if (reason) {
      this.toast(reason, "warn");
    } else {
      this.toast(`Shift over · ${shift.served}/${shift.total} served.`, "info");
    }
    this.checkChapters();
    this.markDirty();
    this.emitNow();
  }

  /** Riding a motor vehicle on the pavement gets the attention of the police. */
  private updatePavementPatrol(dt: number) {
    void dt;
    if (!this.riding || this.riding === "bicycle") return;
    const tx = Math.floor(this.player.x / TILE);
    const ty = Math.floor(this.player.y / TILE);
    const onRoad = ty >= ROAD_TOP && ty <= ROAD_TOP + 2;
    if (onRoad) return;
    const now = performance.now();
    if (now < this.pavementFineAt) return;
    const cop = this.world.npcs.find(
      (n) => n.kind === "police" && !n.hidden && Math.hypot(n.x - this.player.x, n.y - this.player.y) < 150
    );
    if (!cop) return;
    this.pavementFineAt = now + 20_000;
    this.coins = Math.max(0, this.coins - PAVEMENT_FINE);
    this.toast(`Officer Crumb: “Off the pavement with that.” −${PAVEMENT_FINE} Coins`, "warn");
    this.music.sfx("deny");
    void tx;
    this.markDirty();
    this.emitNow();
  }

  /** Buying something for the flat. */
  buyFurniture(id: string) {
    const item = FURNITURE_BY_ID(id);
    if (!item) return;
    if (this.furniture.includes(id)) {
      this.toast(`You already have the ${item.name.toLowerCase()}.`, "info");
      this.emitNow();
      return;
    }
    if (this.coins < item.price) {
      const short = Math.ceil(item.price - this.coins);
      this.toast(`Need ${short.toLocaleString("en-US")} more Coins for the ${item.name.toLowerCase()}.`, "warn");
      this.music.sfx("deny");
      this.emitNow();
      return;
    }
    this.coins -= item.price;
    this.furniture.push(id);
    this.toast(`${item.name} delivered to the flat.`, "info");
    this.music.sfx("buy");
    this.markDirty();
    this.emitNow();
  }

  // ---------- clock, day and weather ----------
  get phase() {
    return phaseFor(this.clockMin);
  }

  get eventOn() {
    return eventActive(this.eventId, this.clockMin);
  }

  get shopOpen() {
    return isShopOpen(this.clockMin);
  }

  get comfort() {
    return homeComfortOf(this.furniture);
  }

  get rep() {
    return reputationOf(stageFor(this.items), Object.keys(this.friends).length, this.works, this.chapter);
  }

  private updateClock(dt: number) {
    if (!this.richSpotReady) {
      this.richSpotReady = true;
      this.richSpotId = this.world.trashSpots[this.day % this.world.trashSpots.length]?.id ?? null;
    }
    const before = this.clockMin;
    this.clockMin += (dt / DAY_SECONDS) * 1440;
    if (Math.floor(this.clockMin / 1440) > Math.floor(before / 1440)) {
      this.day += 1;
      this.clockMin -= 1440;
      this.rollDay();
    }
    // Announce the phase changes so the day has a shape.
    const phaseBefore = phaseFor(before);
    if (phaseFor(this.clockMin) !== phaseBefore) {
      const p = PHASES.find((x) => x.id === this.phase);
      this.toast(`${p?.label ?? "The city"} settles in.`, "info");
    }
    // Market Day fills the bins; rain keeps people indoors.
    this.trashMult = this.eventOn && this.eventId === "market" ? 1.6 : 1;
  }

  private rollDay() {
    this.eventId = eventForDay(this.day);
    this.richSpotId = this.world.trashSpots[this.day % this.world.trashSpots.length]?.id ?? null;
    const loaded = this.world.trashSpots.find((spot) => spot.id === this.richSpotId);
    if (loaded) this.spawnTrash(loaded);
    const ev = EVENTS[this.eventId];
    this.banner = { n: this.day, title: `DAY ${this.day}`, subtitle: `${ev.name} — ${ev.blurb}`, age: 0 };
    if (this.eventId !== "none") this.toast(`${ev.name}: ${ev.blurb}`, "info");
    this.markDirty();
  }

  /** Friendships: talking to the same mouse again and again builds them up. */
  private remember(npc: World["npcs"][number]) {
    const before = this.friends[npc.id] ?? 0;
    const after = before + 1;
    this.friends[npc.id] = after;
    const tierBefore = friendTier(before);
    const tierAfter = friendTier(after);
    if (tierAfter !== tierBefore) {
      this.toast(`${npc.name} now counts you a ${tierAfter.toLowerCase()}.`, "info");
      this.music.sfx("achievement");
      const tip = FRIEND_TIPS[Math.floor(Math.random() * FRIEND_TIPS.length)];
      this.toast(`${npc.name}: “${tip}”`, "coin");
      this.coins += 3;
      this.coinsEarned += 3;
    }
    this.markDirty();
  }

  /** A familiar face says hello as you walk past. */
  private updateGreetings(dt: number) {
    for (const [id, until] of this.greetCool) if (until <= performance.now()) this.greetCool.delete(id);
    if (!this.shopOpen) return;
    for (const npc of this.world.npcs) {
      if (npc.hidden || npc.offDuty || npc.chatFor || npc.following) continue;
      const talks = this.friends[npc.id] ?? 0;
      if (talks < 3 || this.greetCool.has(npc.id)) continue;
      const dist = Math.hypot(npc.x - this.player.x, npc.y - this.player.y);
      if (dist > 70) continue;
      this.greetCool.set(npc.id, performance.now() + 24_000);
      const line = GREETINGS[Math.floor(Math.random() * GREETINGS.length)].replace("{name}", this.name || "Squeek");
      npc.chatLine = line;
      npc.chatFor = 2.4;
      npc.chatTotal = 2.4;
      npc.chatConv = -1;
      npc.chatRole = 0;
      this.chatting += 1;
      break;
    }
    void dt;
  }

  private updatePrompt() {
    if (this.modal) {
      this.prompt = null;
      this.vehiclePrompt = null;
      return;
    }
    // The F prompt: get off what you are riding, or on what you parked.
    if (this.riding) {
      const name = VEHICLES[this.riding].name.toLowerCase();
      this.vehiclePrompt = {
        id: "vehicle-riding",
        kind: "vehicle",
        key: "F",
        x: this.player.x / TILE - 0.5,
        // Under the wheels: it used to sit right on top of the rider.
        y: this.player.y / TILE + 0.7,
        label: `Press F to get off the ${name}`,
      };
    } else {
      const parked = this.parkedNear();
      this.vehiclePrompt = parked
        ? {
            id: "vehicle-parked",
            kind: "vehicle",
            key: "F",
            x: this.parked[parked.kind]!.x / TILE - 0.5,
            y: this.parked[parked.kind]!.y / TILE - 0.4,
            label:
              parked.kind === "bicycle"
                ? "Press F to get on the bicycle"
                : `Press F to ride the ${VEHICLES[parked.kind].name.toLowerCase()}`,
          }
        : null;
    }
    if (this.sitting) {
      // Sitting down: the bubble hangs low so it never covers the mouse.
      this.prompt = {
        id: "bench-sitting",
        kind: "bench",
        x: this.sitting.x / TILE - 0.5,
        y: this.player.y / TILE + 0.62,
        label: "Press E to stand up",
      };
      return;
    }
    if (this.workout) {
      this.prompt = null;
      return;
    }
    let best: Interactable | null = null;
    let bestDist = 48;
    const consider = (target: Interactable) => {
      const tx = (target.x + 0.5) * TILE;
      const ty = (target.y + 0.5) * TILE;
      const dist = Math.hypot(tx - this.player.x, ty - this.player.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = target;
      }
    };
    for (const target of this.world.interactables) consider(target);
    for (const target of this.trashInteractables) consider(target);
    // NPCs only take the prompt when nothing else is in reach — a scavenger
    // standing at a pile must never block the hold-to-scavenge interaction.
    if (!best) {
      for (const npc of this.world.npcs) {
        if (npc.hidden || npc.offDuty || npc.kind === "pet") continue;
        const dist = Math.hypot(npc.x - this.player.x, npc.y - this.player.y);
        if (dist < 40) {
          bestDist = dist;
          best = { id: `npc-${npc.id}`, kind: "npc", x: npc.x / TILE, y: npc.y / TILE, label: `Talk to ${npc.name}`, npcId: npc.id };
        }
      }
    }
    // Shutters down after hours: say so before the player presses E.
    if (best && !this.shopOpen && (best.kind === "shop" || best.kind === "job" || best.kind === "hotel")) {
      best = { ...best, label: `${best.label} · closed` };
    }
    // The bus stop talks about the bus, not about waiting forever.
    if (best && best.kind === "bus") {
      const stop = this.world.busStops.find((b) => `${b.id}-wait` === best!.id);
      const here = stop ? Math.abs(this.busX - (stop.x + 1) * TILE) <= 40 && this.busDwell > 0 : false;
      best = {
        ...best,
        label: this.ridingBus
          ? "On the bus"
          : here
            ? `Board the bus · ${BUS_FARE} Coins`
            : `Wait for the bus · ${BUS_FARE} Coins`,
      };
    }
    // The staff hatch only opens while the cart is trading.
    if (best && best.kind === "shift" && (!this.shopOpen || this.shift)) best = null;
    this.prompt = best;
  }


  // ---------- traffic, signals and the patrol officer ----------
  private updateSignal(dt: number) {
    this.signal.timer -= dt;
    if (this.signal.timer <= 0) {
      const next: Record<SignalPhase, SignalPhase> = { green: "yellow", yellow: "red", red: "green" };
      this.signal.phase = next[this.signal.phase];
      this.signal.timer = this.signal.phase === "green" ? 9 : this.signal.phase === "yellow" ? 2.5 : 8;
      if (this.signal.phase === "red") this.finedThisCycle = false;
    }
    setSignalPhase(this.signal.phase);
  }

  private trafficGap(car: TrafficCar): number {
    const sign = car.lane === 1 ? 1 : -1;
    const half = car.kind === "van" ? 28 : car.kind === "bike" ? 16 : 23;
    let gap = 1e6;
    for (const other of this.traffic) {
      if (other === car || other.lane !== car.lane || other.seg !== car.seg) continue;
      const ahead = (other.x - car.x) * sign;
      if (ahead > 0 && ahead < 170) gap = Math.min(gap, ahead - 54);
    }
    const blockers = [{ x: this.player.x, y: this.player.y }];
    for (const npc of this.world.npcs) if (npc.kind === "police" && !npc.hidden) blockers.push({ x: npc.x, y: npc.y });
    for (const blocker of blockers) {
      if (Math.abs(blocker.y - car.y) > 27) continue;
      const ahead = (blocker.x - car.x) * sign;
      if (ahead > 0 && ahead < 140) gap = Math.min(gap, ahead - 58);
    }
    if (this.signal.phase !== "green") {
      for (const col of CROSSWALKS) {
        if (car.seg === 0 && col > WALL_B) continue;
        if (car.seg === 1 && col <= WALL_B) continue;
        const line = car.lane === 1 ? col * TILE - 10 - half : (col + 1) * TILE + 10 + half;
        const ahead = (line - car.x) * sign;
        if (ahead > -8 && ahead < 220) gap = Math.min(gap, ahead);
      }
    }
    return gap;
  }

  private updateTraffic(dt: number) {
    this.trafficAcc -= dt;
    if (this.trafficAcc <= 0 && this.traffic.length < 9) {
      this.trafficAcc = 1.1 + Math.random() * 1.8;
      this.spawnTraffic();
      // The slums run on scooters — they arrive in packs, never in cars.
      if (Math.random() < 0.6 && this.traffic.length < 9) this.spawnTraffic(0);
    }
    for (const car of this.traffic) {
      const sign = car.lane === 1 ? 1 : -1;
      const gap = this.trafficGap(car);
      const desired = gap <= 1 ? 0 : Math.min(car.base, Math.max(0, (gap - 2) * 2.6));
      car.speed += (desired - car.speed) * Math.min(1, dt * 3.4);
      if (desired === 0 && gap <= 1) car.speed = 0;
      car.brake = desired < car.base * 0.5;
      car.x += sign * car.speed * dt;
    }
    const segmentOf = (x: number) => (x > WALL_B * TILE ? 1 : 0);
    this.traffic = this.traffic.filter((car) => {
      const seg = TRAFFIC_SEGMENTS[car.seg];
      if (car.x < seg.from - 40 || car.x > seg.to + 40) return false;
      // A car that changed stretch (only possible through the gate) keeps its lane honest.
      if (segmentOf(car.x) !== car.seg) return false;
      return true;
    });
  }

  private spawnTraffic(forceSeg?: number) {
    const lane: 0 | 1 = Math.random() < 0.5 ? 0 : 1;
    const seg = forceSeg ?? Math.floor(Math.random() * TRAFFIC_SEGMENTS.length);
    const stretch = TRAFFIC_SEGMENTS[seg];
    const startX = lane === 1 ? stretch.from : stretch.to;
    for (const car of this.traffic) {
      if (car.lane === lane && Math.abs(car.x - startX) < 110) return;
    }
    const roll = Math.random();
    // The slums still run mostly on two wheels — anything spawning up that end
    // of the road is a scooter; the office side gets the mixed traffic.
    const kind: TrafficCar["kind"] =
      startX < WALL_A * TILE ? "bike" : roll < 0.15 ? "van" : roll < 0.6 ? "bike" : "car";
    const palette = ["red", "blue", "teal", "yellow", "white", "black", "green"];
    const style = VEHICLE_COLORS[palette[Math.floor(Math.random() * palette.length)]] ?? VEHICLE_COLORS.blue;
    const base = kind === "van" ? 72 : kind === "bike" ? (stretch.zone === "slums" ? 104 : 116) : 94;
    this.traffic.push({
      id: this.trafficId++,
      kind,
      lane,
      seg,
      x: startX,
      y: LANE_Y[lane],
      speed: base * 0.6,
      base,
      style,
      brake: false,
    });
  }

  /** The officer walks onto the crosswalk while the light is red, then steps back. */
  private updateCop(npc: World["npcs"][number], dt: number) {
    const directing = this.signal.phase === "red";
    npc.directing = directing;
    const targetX = (COP_CROSSWALK + 0.5) * TILE;
    const targetY = directing ? (ROAD_TOP + 1.35) * TILE : 24.5 * TILE;
    const dx = targetX - npc.x;
    const dy = targetY - npc.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 2) {
      const step = Math.min(dist, 46 * dt);
      npc.x += (dx / dist) * step;
      npc.y += (dy / dist) * step;
      npc.anim += dt;
      npc.moving = true;
      npc.dir = Math.abs(dy) > Math.abs(dx) ? (dy > 0 ? "down" : "up") : dx > 0 ? "right" : "left";
    } else {
      npc.moving = false;
      npc.dir = directing ? "left" : "down";
    }
  }

  /** Running the red light on wheels earns you a fine from Officer Crumb. */
  private checkRedLight() {
    if (!this.riding || !MOTORISED.includes(this.riding) || this.signal.phase !== "red" || this.finedThisCycle) return;
    const inCrosswalk =
      Math.abs(this.player.x - (COP_CROSSWALK + 0.5) * TILE) < 30 &&
      this.player.y > (ROAD_TOP - 0.4) * TILE &&
      this.player.y < (ROAD_TOP + 3.4) * TILE;
    if (!inCrosswalk) return;
    this.finedThisCycle = true;
    const fine = Math.min(TRAFFIC_FINE, Math.floor(this.coins));
    this.coins -= fine;
    this.music.sfx("deny");
    this.toast(
      fine > 0 ? `Officer Crumb: red light! Fine −${fine} Coins.` : "Officer Crumb: red light! Consider this a warning.",
      "warn"
    );
    this.markDirty();
    this.emitNow();
  }

  /** Which of your parked vehicles is within reach right now? */
  private parkedNear(): { kind: VehicleKind; dist: number } | null {
    let best: VehicleKind | null = null;
    let bestDist = 46;
    for (const kind of Object.keys(this.parked) as VehicleKind[]) {
      const spot = this.parked[kind];
      if (!spot) continue;
      const dist = Math.hypot(spot.x - this.player.x, spot.y - this.player.y);
      if (dist < bestDist) {
        bestDist = dist;
        best = kind;
      }
    }
    return best ? { kind: best, dist: bestDist } : null;
  }

  mount(kind: VehicleKind) {
    if (!this.parked[kind]) return;
    this.riding = kind;
    this.music.sfx("boost");
    this.toast(VEHICLES[kind].hop, "info");
    this.markDirty();
    this.emitNow();
  }

  dismount() {
    if (!this.riding) return;
    const kind = this.riding;
    this.riding = null;
    this.parked[kind] = { x: this.player.x, y: this.player.y + 6 };
    this.toast(`You park the ${VEHICLES[kind].name.toLowerCase()} and hop off.`, "info");
    this.markDirty();
    this.emitNow();
  }

  private updateCamera(dt: number) {
    const viewW = this.vw / this.zoom;
    const viewH = this.vh / this.zoom;
    const targetX = Math.max(0, Math.min(COLS * TILE - viewW, this.player.x - viewW / 2));
    const targetY = Math.max(0, Math.min(ROWS * TILE - viewH, this.player.y - viewH / 2));
    const k = 1 - Math.exp(-9 * dt);
    this.cam.x += (targetX - this.cam.x) * k;
    this.cam.y += (targetY - this.cam.y) * k;
  }

  private emitNow() {
    this.emit();
  }

  // ---------- render ----------
  private render(time: number) {
    const ctx = this.ctx ?? (this.canvas ? this.canvas.getContext("2d") : null);
    if (!ctx) return;
    if (!this.ctx && this.canvas) {
      this.ctx = ctx;
      this.cam.x = Math.max(0, this.player.x - this.vw / this.zoom / 2);
      this.cam.y = Math.max(0, this.player.y - this.vh / this.zoom / 2);
    }
    ctx.imageSmoothingEnabled = false;
    const z = this.zoom;
    const dpr = this.dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#0d0c16";
    ctx.fillRect(0, 0, this.canvas!.width, this.canvas!.height);
    ctx.setTransform(dpr * z, 0, 0, dpr * z, -this.cam.x * dpr * z, -this.cam.y * dpr * z);
    setHomeFurniture(this.furniture);

    const x0 = Math.max(0, Math.floor(this.cam.x / TILE));
    const x1 = Math.min(COLS - 1, Math.ceil((this.cam.x + this.vw / z) / TILE));
    const y0 = Math.max(0, Math.floor(this.cam.y / TILE));
    const y1 = Math.min(ROWS - 1, Math.ceil((this.cam.y + this.vh / z) / TILE));

    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) drawTile(ctx, this.world.tiles[ty][tx], tx, ty);
    drawRoadDetails(ctx, x0, x1);
    // The bus is a real vehicle on the real road.
    drawBusBody(ctx, this.busX, LANE_Y[1], this.busDir, time);
    // Loaded pile of the day sparkles so you can spot it.
    if (this.richSpotId) {
      const rich = this.activeTrash.find((t) => t.id === this.richSpotId);
      if (rich) {
        ctx.save();
        ctx.globalAlpha = 0.4 + Math.sin(time * 4) * 0.3;
        ctx.fillStyle = "#ffd977";
        ctx.fillRect(rich.x * TILE + 6, rich.y * TILE + 2, 20, 3);
        ctx.restore();
      }
    }
    // Where a shift is worked from.
    if (this.shift) {
      const spot = this.world.shiftSpots.find((s2) => s2.id === this.shift!.spotId);
      if (spot) {
        ctx.save();
        ctx.globalAlpha = 0.35 + Math.sin(time * 3) * 0.2;
        ctx.strokeStyle = "#43d17a";
        ctx.lineWidth = 2;
        ctx.strokeRect(spot.x * TILE + 4, spot.y * TILE + 4, TILE - 8, TILE - 8);
        ctx.restore();
      }
    }
    drawZoneLabels(ctx, this.world);
    if (this.quest) {
      drawQuestMarker(ctx, (this.quest.x + 0.5) * TILE, (this.quest.y + 0.85) * TILE, time, this.quest.label);
    }

    for (const building of this.world.buildings) {
      if (building.x > x1 + 1 || building.x + building.w < x0 - 1) continue;
      if (building.y > y1 + 1 || building.y + building.h < y0 - 1) continue;
      drawBuilding(ctx, building, time, this.world.wheelActive);
    }

    drawWalls(ctx, y0, y1, time, this.world.gateOpen);

    const drawables: { y: number; draw: () => void }[] = [];
    for (const object of this.world.objects) {
      if (object.x + object.w < x0 - 1 || object.x > x1 + 1) continue;
      if (object.y + object.h < y0 - 1 || object.y > y1 + 2) continue;
      drawables.push({ y: (object.y + object.h) * TILE, draw: () => drawObject(ctx, object, time, this.world.gateOpen) });
    }
    for (const spot of this.activeTrash) {
      if (spot.x < x0 - 1 || spot.x > x1 + 1 || spot.y < y0 - 1 || spot.y > y1 + 2) continue;
      drawables.push({ y: (spot.y + 1) * TILE, draw: () => drawTrash(ctx, spot, time) });
    }
    for (const npc of this.world.npcs) {
      if (npc.hidden) continue;
      if (npc.x < x0 * TILE - 40 || npc.x > (x1 + 1) * TILE + 40) continue;
      drawables.push({ y: npc.y, draw: () => drawNpcSprite(ctx, npc, time) });
    }
    for (const car of this.traffic) {
      if (car.x < x0 * TILE - 80 || car.x > (x1 + 1) * TILE + 80) continue;
      const stretch = TRAFFIC_SEGMENTS[car.seg];
      const edge = Math.min(car.x - stretch.from, stretch.to - car.x);
      const alpha = Math.max(0, Math.min(1, edge / 70));
      if (alpha <= 0.03) continue;
      const dir: Dir = car.lane === 1 ? "right" : "left";
      drawables.push({
        y: car.y + 6,
        draw: () => {
          ctx.globalAlpha = alpha;
          drawVehicle(ctx, car.kind, car.x, car.y, dir, time, { style: car.style, brake: car.brake });
          ctx.globalAlpha = 1;
        },
      });
    }
    for (const kind of Object.keys(this.parked) as VehicleKind[]) {
      const spot = this.parked[kind];
      if (!spot || this.riding === kind) continue;
      drawables.push({
        y: spot.y + 6,
        draw: () =>
          drawVehicle(ctx, VEHICLE_DRAW[kind], spot.x, spot.y, "up", time, {
            style: PLAYER_VEHICLE_STYLE[kind],
            brake: true,
          }),
      });
    }
    if (this.riding) {
      const kind = this.riding;
      const vx = this.player.x;
      const vy = this.player.y - 4;
      drawables.push({
        y: this.player.y - 1,
        draw: () =>
          drawVehicle(ctx, VEHICLE_DRAW[kind], vx, vy, this.player.dir, time, {
            style: PLAYER_VEHICLE_STYLE[kind],
            brake: !this.player.moving,
          }),
      });
    }
    drawables.push({
      y: this.player.y,
      draw: () => {
        const frame = this.workout
          ? Math.floor(time * 6) % 2
          : this.player.moving
            ? Math.floor(this.player.anim * 4) % 2
            : 0;
        drawPlayer(
          ctx,
          this.player.x,
          this.player.y,
          this.player.dir,
          frame,
          stageFor(this.items),
          time,
          this.sitting ? "sit" : "normal"
        );
        if (this.carrying) drawParcel(ctx, this.player.x, this.player.y, time);
      },
    });
    drawables.sort((a, b) => a.y - b.y);
    for (const item of drawables) item.draw();

    // Umbrellas, kit and the pet, all on top of the crowd.
    const wet = this.eventOn && this.eventId === "rain";
    for (const npc of this.world.npcs) {
      if (npc.hidden || npc.offDuty) continue;
      if (npc.sitting) continue;
      if (npc.dancing) drawDancerKit(ctx, npc, time);
      if (npc.marching) drawMarcherKit(ctx, npc, time);
      if (npc.kind === "pet") drawPetRat(ctx, npc.x, npc.y, npc.dir, time);
      if (wet && !npc.marching && !npc.dancing) {
        const hash = npc.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
        drawUmbrella(ctx, npc.x, npc.y - 26, ["#ff2882", "#7fe8ff", "#ffd977", "#43d17a"][hash % 4]);
      }
    }
    if (wet) drawRain(ctx, this.rainDrops, time);

    // Night falls on the city, and the lamps come on.
    const tint = NIGHT_TINT[this.phase];
    const blackout = this.eventOn && this.eventId === "blackout";
    if (tint.lamps && !blackout) {
      for (const object of this.world.objects) {
        if (object.type !== "lamp" && object.type !== "trafficlight") continue;
        const lx = (object.x + 0.5) * TILE;
        const ly = (object.y + 0.5) * TILE;
        if (lx < this.cam.x - 80 || lx > this.cam.x + this.vw / this.zoom + 80) continue;
        drawLampGlow(ctx, lx, ly, object.type === "lamp" ? 76 : 44, object.type === "lamp" ? 1 : 0.7);
      }
      // Your own flat glows through the glass once you have a lamp.
      if (this.furniture.includes("lamp")) drawLampGlow(ctx, 4.5 * TILE, 16 * TILE, 70, 0.8);
    }
    if (blackout) {
      for (const npc of this.world.npcs) {
        if (npc.hidden || npc.offDuty) continue;
        if (!npc.nightOwl) continue;
        drawLampGlow(ctx, npc.x, npc.y - 8, 42, 0.75, false);
      }
    }
    drawDayTint(ctx, this.vw / this.zoom, this.vh / this.zoom, tint.color, blackout ? Math.max(tint.alpha, 0.62) : tint.alpha);

    for (const particle of this.particles) {
      if (particle.delay > 0) continue;
      const alpha = Math.max(0, 1 - particle.life / particle.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.fillRect(Math.round(particle.x), Math.round(particle.y), particle.size, particle.size);
      ctx.globalAlpha = 1;
    }

    // Labels for these two live in the bottom bar of the HUD — nothing is drawn
    // over the mouse any more.
    if (this.prompt) drawTargetRing(ctx, this.prompt.x, this.prompt.y, time, "#ff2882");
    if (this.vehiclePrompt) drawTargetRing(ctx, this.vehiclePrompt.x, this.vehiclePrompt.y, time, "#7fe8ff");

    // Chatter floats above the talkers only.
    for (const npc of this.world.npcs) {
      if (!npc.chatFor || npc.chatFor <= 0 || !npc.chatLine || npc.hidden) continue;
      drawChatBubble(ctx, npc.x, npc.y - (npc.sitting ? 30 : 44), npc.chatLine, time);
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawMinimap(ctx, this.world, this.player.x, this.player.y, this.vw, this.quest ? { x: this.quest.x, y: this.quest.y } : null);
  }

  private hydrate(save: SaveData) {
    this.coins = save.coins ?? 0;
    this.coinsEarned = save.coinsEarned ?? 0;
    this.energy = Math.min(ENERGY_MAX, save.energy ?? ENERGY_MAX);
    this.items = Array.isArray(save.items) ? save.items : [];
    this.chapter = Math.min(5, Math.max(1, save.chapter ?? 1));
    this.works = save.works ?? 0;
    this.playedSec = save.playedSec ?? 0;
    this.gateOpen = Boolean(save.gateOpen);
    this.won = Boolean(save.won);
    this.bedReadyAt = save.bedReadyAt ?? 0;
    this.clockMin = typeof save.clockMin === "number" ? save.clockMin : CLOCK_START_MIN;
    this.day = Math.max(1, save.day ?? 1);
    this.eventId = eventForDay(this.day);
    this.richSpotId = this.world.trashSpots[this.day % this.world.trashSpots.length]?.id ?? null;
    this.friends = save.friends ?? {};
    this.richSpotId = this.world.trashSpots[this.day % this.world.trashSpots.length]?.id ?? null;
    this.furniture = Array.isArray(save.furniture) ? save.furniture : [];
    this.wheelReadyAt = save.wheelReadyAt ?? 0;
    this.achievements = Array.isArray(save.achievements) ? save.achievements : [];
    const quest = save.quest;
    this.quest =
      quest && (quest.stage === "pickup" || quest.stage === "deliver") && Number.isFinite(quest.x) && Number.isFinite(quest.y)
        ? {
            stage: quest.stage,
            x: quest.x,
            y: quest.y,
            label: typeof quest.label === "string" ? quest.label : "the order",
            fromX: Number.isFinite(quest.fromX) ? quest.fromX : quest.x,
            fromY: Number.isFinite(quest.fromY) ? quest.fromY : quest.y,
          }
        : null;
    this.carrying = this.quest?.stage === "deliver";
    if (save.pos && Number.isFinite(save.pos.x) && Number.isFinite(save.pos.y)) {
      this.player.x = Math.max(18, Math.min(COLS * TILE - 18, save.pos.x));
      this.player.y = Math.max(20, Math.min(ROWS * TILE - 8, save.pos.y));
    }
    const stored = { ...(save.vehicles ?? {}) } as Partial<Record<VehicleKind, { x: number; y: number }>>;
    if (save.vehicle && save.vehicle.kind) stored[save.vehicle.kind] = { x: save.vehicle.x, y: save.vehicle.y };
    for (const kind of Object.keys(stored) as VehicleKind[]) {
      const spot = stored[kind];
      const bay = PARK_BAY[kind];
      if (!spot || !Number.isFinite(spot.x) || !Number.isFinite(spot.y)) {
        this.parked[kind] = { x: bay.x * TILE, y: bay.y * TILE };
        continue;
      }
      this.parked[kind] = { x: spot.x, y: spot.y };
    }
    this.riding = save.riding && this.parked[save.riding] ? save.riding : null;
    // The world layout may have changed since the save was written — never respawn inside a wall.
    if (!this.canStand(this.player.x, this.player.y)) {
      this.player.x = this.world.spawn.x;
      this.player.y = this.world.spawn.y;
      for (const kind of Object.keys(this.parked) as VehicleKind[]) {
        const bay = PARK_BAY[kind];
        this.parked[kind] = { x: bay.x * TILE, y: bay.y * TILE };
      }
      this.riding = null;
    }
    // Same for a parked vehicle left inside a building after a map update.
    for (const kind of Object.keys(this.parked) as VehicleKind[]) {
      const spot = this.parked[kind];
      if (spot && !this.canStand(spot.x, spot.y)) {
        const bay = PARK_BAY[kind];
        this.parked[kind] = { x: bay.x * TILE, y: bay.y * TILE };
      }
    }
  }
}
