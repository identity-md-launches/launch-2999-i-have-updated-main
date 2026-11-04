// Squeek Life — game data: items, jobs, chapters, economy tuning.
export type ItemId =
  | "clothes"
  | "old_phone"
  | "bicycle"
  | "smartphone"
  | "motorbike"
  | "laptop"
  | "suit"
  | "car";

export type ShopId = "food" | "clothing" | "electronics" | "vehicle" | "street" | "restaurant" | "salon";
export type JobId = "trash" | "delivery" | "employee" | "manager" | "business" | "startup";

export interface GearDef {
  id: ItemId;
  name: string;
  price: number;
  shop: ShopId;
  desc: string;
}

export interface ConsumableDef {
  id: string;
  name: string;
  price: number;
  energy: number;
  desc: string;
  shop: ShopId;
}

export interface JobDef {
  id: JobId;
  name: string;
  reward: number;
  energy: number;
  requires: ItemId | null;
  blurb: string;
  /** Hold-to-collect jobs skip the timing mini-game. */
  hold?: boolean;
}

export const ENERGY_MAX = 100;
export const ENERGY_REGEN_PER_SEC = 1 / 1.5;
export const BED_COOLDOWN_MS = 90_000;
export const WHEEL_BOOST_MS = 120_000;
export const WHEEL_BOOST_ENERGY = 30;
export const GATE_COINS = 4000;

export const TRASH_REWARD = 15;
export const TRASH_ENERGY = 4;
export const TRASH_HOLD_SECONDS = 1.4;
export const TRASH_RESPAWN_MIN_MS = 11_000;
export const TRASH_RESPAWN_MAX_MS = 22_000;
export const TRASH_MAX_ACTIVE = 7;

export const GEAR: GearDef[] = [
  { id: "clothes", name: "Fresh clothes", price: 100, shop: "clothing", desc: "Clean threads — people stop holding their noses." },
  { id: "old_phone", name: "Hand-me-down phone", price: 200, shop: "electronics", desc: "Good enough to take calls. Unlocks the office clerk job." },
  { id: "bicycle", name: "Bicycle", price: 350, shop: "vehicle", desc: "Faster runs. Unlocks food delivery. Press E next to it to ride." },
  { id: "smartphone", name: "Smartphone", price: 700, shop: "electronics", desc: "Now you look like you belong downtown. Unlocks the corporate manager job." },
  { id: "motorbike", name: "Motorbike", price: 1500, shop: "vehicle", desc: "Unlocks the business deals job. Press E next to it to ride." },
  { id: "laptop", name: "Laptop", price: 3000, shop: "electronics", desc: "Unlocks the startup founder job." },
  { id: "suit", name: "Tailored suit", price: 3500, shop: "clothing", desc: "Required to walk into the rich district." },
  { id: "car", name: "Sports car", price: 6000, shop: "vehicle", desc: "Your road pass into the rich district. Press E to drive it." },
];

export const CONSUMABLES: ConsumableDef[] = [
  { id: "coffee", name: "Coffee", price: 20, energy: 25, desc: "+25 energy", shop: "food" },
  { id: "burger", name: "Cheeseburger", price: 45, energy: 60, desc: "+60 energy", shop: "food" },
  // Slums street-food carts.
  { id: "bubble_tea", name: "Bubble tea", price: 12, energy: 18, desc: "+18 energy · the cart on the corner", shop: "street" },
  { id: "skewers", name: "Skewer plate", price: 15, energy: 22, desc: "+22 energy · grilled right there", shop: "street" },
  { id: "noodles", name: "Noodle bowl", price: 28, energy: 35, desc: "+35 energy · hot broth, cheap stool", shop: "street" },
  // Rich district fine dining.
  { id: "tasting", name: "Tasting menu", price: 300, energy: 80, desc: "+80 energy · seven courses, one tiny plate", shop: "restaurant" },
  { id: "champagne", name: "Champagne", price: 180, energy: 45, desc: "+45 energy · served with a straight face", shop: "restaurant" },
  // Clip & Squeak Salon: you leave looking sharp and feeling fresher.
  { id: "haircut", name: "Fresh cut", price: 60, energy: 20, desc: "+20 energy · walk out looking employable", shop: "salon" },
  { id: "grooming", name: "Hot towel & trim", price: 150, energy: 45, desc: "+45 energy · the full treatment, warm towel included", shop: "salon" },
];

export const JOBS: JobDef[] = [
  { id: "trash", name: "Scavenging", reward: TRASH_REWARD, energy: TRASH_ENERGY, requires: null, hold: true, blurb: "Dig through trash piles around the slums. Hold E until the pile is cleared." },
  { id: "delivery", name: "Food delivery", reward: 45, energy: 6, requires: "bicycle", blurb: "Ride orders across the district." },
  { id: "employee", name: "Office clerk", reward: 100, energy: 8, requires: "old_phone", blurb: "Answer phones at Office Tower. The first rung of the office ladder." },
  { id: "manager", name: "Corporate manager", reward: 160, energy: 9, requires: "smartphone", blurb: "Run the floor at Corp HQ. Real salary, real suit energy." },
  { id: "business", name: "Business deals", reward: 220, energy: 10, requires: "motorbike", blurb: "Ride out to meet clients." },
  { id: "startup", name: "Startup founder", reward: 550, energy: 12, requires: "laptop", blurb: "Pitch investors at the Startup Hub." },
];

// --- Vehicles: bought in the showroom, then ridden around the city -------------
export type VehicleKind = "bicycle" | "motorbike" | "car";

export const VEHICLES: Record<VehicleKind, { name: string; speed: number; hop: string }> = {
  bicycle: { name: "Bicycle", speed: 178, hop: "You hop on the bicycle and start pedalling." },
  motorbike: { name: "Motorbike", speed: 212, hop: "You swing a leg over the motorbike." },
  car: { name: "Sports car", speed: 268, hop: "You drop into the driver's seat." },
};

/** Which shop item puts which vehicle in the parking bay. */
export const ITEM_VEHICLE: Partial<Record<ItemId, VehicleKind>> = {
  bicycle: "bicycle",
  motorbike: "motorbike",
  car: "car",
};

/** Running a red light on wheels costs you a fine — cyclists get a pass. */
export const TRAFFIC_FINE = 10;

// --- Delivery runs: fetch the order, then drop it off -------------------------
/** How close (px) you must get to a green marker for it to trigger. */
export const DELIVERY_REACH = 30;
/** The tip grows with the distance you actually ride. */
export const DELIVERY_TIP_PER_TILE = 2;
export const DELIVERY_TIP_MAX = 70;

// --- The park: a workout and a bench to sit on --------------------------------
export const WORKOUT_SECONDS = 2.4;
export const WORKOUT_ENERGY = 6;
export const WORKOUT_COOLDOWN_MS = 45_000;
/** Sitting on a bench rests you faster than standing around. */
export const SIT_ENERGY_PER_SEC = 1.8;

export const jobById = (id: JobId) => JOBS.find((j) => j.id === id)!;
export const gearById = (id: ItemId) => GEAR.find((g) => g.id === id)!;

export const SHOP_NAMES: Record<ShopId, string> = {
  food: "Food stall",
  clothing: "Clothing store",
  electronics: "Electronics store",
  vehicle: "Car showroom",
  street: "Street food",
  restaurant: "Golden Fork · 5★",
  salon: "Clip & Squeak Salon",
};

export interface ChapterDef {
  n: number;
  title: string;
  subtitle: string;
  objective: string;
}

export const CHAPTERS: ChapterDef[] = [
  { n: 1, title: "Rock Bottom", subtitle: "The slums", objective: "Earn your first 50 Coins scavenging trash." },
  { n: 2, title: "The Grind", subtitle: "Working the district", objective: "Own fresh clothes, a hand-me-down phone and a bicycle." },
  { n: 3, title: "Level Up", subtitle: "Downtown", objective: "Own a smartphone and a motorbike." },
  { n: 4, title: "The Big Break", subtitle: "Serious money", objective: "Own a laptop, a tailored suit and a sports car." },
  { n: 5, title: "The Rich District", subtitle: "Behind the golden gate", objective: "Wear the suit, own the car, carry 4,000 Coins and walk through the golden gate." },
];

export const ACHIEVEMENTS: Record<string, string> = {
  FIRST_WORK: "First honest job",
  CHAPTER_1: "Chapter 1 — Rock Bottom",
  CHAPTER_2: "Chapter 2 — The Grind",
  CHAPTER_3: "Chapter 3 — Level Up",
  CHAPTER_4: "Chapter 4 — The Big Break",
  CHAPTER_5: "Chapter 5 — The Rich District",
  HAMSTER: "Real Hamster Power",
  MANAGER: "Promoted to the corner office",
  TYCOON: "Neighborhood tycoon",
  WINNER: "SELF-MADE SQUEEK",
};

// Look changes with what you own: rags → clothes → smartphone → motorbike → suit → car.
export function stageFor(items: ItemId[]): number {
  const has = (id: ItemId) => items.includes(id);
  if (has("car")) return 5;
  if (has("suit")) return 4;
  if (has("motorbike")) return 3;
  if (has("smartphone")) return 2;
  if (has("clothes")) return 1;
  return 0;
}

/**
 * Overheard on the pavement — two neighbours stop and talk, and the whole city
 * feels lived in. Keep every line short: they are drawn in a small bubble.
 */
export const CHATS: [string, string][] = [
  ["Rent went up again.", "In this economy? Squeak."],
  ["Saving up for a scooter.", "A red one. Obviously."],
  ["The tram was late again.", "The tram is always late."],
  ["Golf on Sunday?", "Only if the gate's open."],
  ["My cousin made manager.", "Manager of what, exactly?"],
  ["Tried the noodle cart?", "Twice today. Not a word."],
  ["That statue looks pricey.", "That statue IS pricey."],
  ["Vault under the bank, they say.", "People say a lot of things."],
  ["Nice weather for scavenging.", "Rain or shine, I scavenge."],
  ["Found a coin in the fountain.", "You WHAT?"],
  ["Off to the mall?", "Window shopping. Again."],
  ["My tail's twitchy today.", "That's just Tuesday."],
  ["Someone's in my parking spot.", "Mouse or rat?"],
  ["That cat by the dumpster.", "Don't make eye contact."],
  ["Two coffees, one mouse.", "The usual, then."],
  ["The tower lift is broken again.", "Take the stairs. Builds muscle."],
  ["They've got a pool over there.", "They've got it all over there."],
  ["Did you get the parcel?", "Still waiting on it."],
  ["This bench taken?", "Only by me and my lunch."],
  ["Work's quiet this week.", "Quiet is expensive, mate."],
  ["You smell of fried noodles.", "I take that as a compliment."],
  ["Saw the mayor's car today.", "Was he even in it?"],
];

// ---------------------------------------------------------------- day & night

/** One full game day. Short enough to feel like a rhythm, long enough to play. */
export const DAY_SECONDS = 480;
export const CLOCK_START_MIN = 7 * 60;
export const SHOP_OPEN_MIN = 7 * 60;
export const SHOP_CLOSE_MIN = 23 * 60;
export const SLEEP_WAKE_MIN = 7 * 60;

export type Phase = "dawn" | "morning" | "noon" | "afternoon" | "evening" | "night";

export const PHASES: { id: Phase; from: number; to: number; label: string }[] = [
  { id: "dawn", from: 5 * 60, to: 7 * 60, label: "Dawn" },
  { id: "morning", from: 7 * 60, to: 11 * 60, label: "Morning" },
  { id: "noon", from: 11 * 60, to: 15 * 60, label: "Midday" },
  { id: "afternoon", from: 15 * 60, to: 19 * 60, label: "Afternoon" },
  { id: "evening", from: 19 * 60, to: 22 * 60, label: "Evening" },
  { id: "night", from: 22 * 60, to: 5 * 60, label: "Night" },
];

export function phaseFor(min: number): Phase {
  const m = ((min % 1440) + 1440) % 1440;
  if (m >= 22 * 60 || m < 5 * 60) return "night";
  for (const p of PHASES) if (p.id !== "night" && m >= p.from && m < p.to) return p.id;
  return "dawn";
}

/** How dark the streets get, and what colour the light turns. */
export const NIGHT_TINT: Record<Phase, { color: string; alpha: number; lamps: boolean }> = {
  dawn: { color: "#3a2f6b", alpha: 0.22, lamps: true },
  morning: { color: "#ffd977", alpha: 0.05, lamps: false },
  noon: { color: "#ffffff", alpha: 0.0, lamps: false },
  afternoon: { color: "#ffb066", alpha: 0.08, lamps: false },
  evening: { color: "#5a3f8f", alpha: 0.24, lamps: true },
  night: { color: "#0d1030", alpha: 0.5, lamps: true },
};

export function clockLabel(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(Math.floor(m % 60)).padStart(2, "0")}`;
}

export const isShopOpen = (min: number) => {
  const m = ((min % 1440) + 1440) % 1440;
  return m >= SHOP_OPEN_MIN && m < SHOP_CLOSE_MIN;
};

// ------------------------------------------------------------------- weather & events

export type EventId = "none" | "market" | "festival" | "rain" | "blackout" | "parade";

export const EVENTS: Record<
  EventId,
  { name: string; blurb: string; from: number; to: number; gateOpen?: boolean }
> = {
  none: { name: "Quiet day", blurb: "Nothing special on today.", from: 0, to: 1440 },
  market: {
    name: "Market Day",
    blurb: "Stalls out, crowds in, and the bins fill up twice as fast.",
    from: 8 * 60,
    to: 16 * 60,
  },
  rain: {
    name: "Rain",
    blurb: "Wet streets, umbrellas up, traffic crawling.",
    from: 6 * 60,
    to: 20 * 60,
  },
  festival: {
    name: "Street Festival",
    blurb: "Music on the plaza, dancing, confetti in the air.",
    from: 11 * 60,
    to: 18 * 60,
  },
  blackout: {
    name: "Blackout",
    blurb: "The grid is down. Lanterns only.",
    from: 19 * 60,
    to: 23 * 60,
  },
  parade: {
    name: "Parade",
    blurb: "The rich district marches — and the gate is open to watch.",
    from: 15 * 60,
    to: 18 * 60,
    gateOpen: true,
  },
};

/** A repeating calendar, so players can learn the city's rhythm. */
export const EVENT_CALENDAR: EventId[] = [
  "none",
  "market",
  "rain",
  "festival",
  "none",
  "blackout",
  "parade",
  "rain",
  "market",
  "festival",
];

export const eventForDay = (day: number): EventId => EVENT_CALENDAR[(day - 1) % EVENT_CALENDAR.length];

export function eventActive(id: EventId, min: number): boolean {
  if (id === "none") return false;
  const e = EVENTS[id];
  const m = ((min % 1440) + 1440) % 1440;
  return m >= e.from && m < e.to;
}

// ---------------------------------------------------------------- friends & reputation

export const FRIEND_TIERS: { at: number; label: string }[] = [
  { at: 3, label: "Acquaintance" },
  { at: 6, label: "Friend" },
  { at: 10, label: "Close friend" },
];

export const friendTier = (talks: number) =>
  [...FRIEND_TIERS].reverse().find((t) => talks >= t.at)?.label ?? "Stranger";

export const GREETINGS = [
  "Hey, {name}!",
  "Morning, {name}!",
  "{name}! Good to see you.",
  "Alright, {name}?",
  "There he is — {name}!",
  "Watch yourself out there, {name}.",
];

export const FRIEND_TIPS = [
  "Saw a fat pile behind the noodle cart.",
  "The bins by the garage are loaded today.",
  "Mind the coppers on the road tonight.",
  "The market's good today. Get down there.",
];

export const REP_TIERS: { at: number; label: string }[] = [
  { at: 0, label: "Nobody" },
  { at: 5, label: "Local face" },
  { at: 11, label: "Well known" },
  { at: 18, label: "Big cheese" },
  { at: 26, label: "City legend" },
];

export const repTier = (rep: number) =>
  [...REP_TIERS].reverse().find((t) => rep >= t.at)?.label ?? "Nobody";

/** Dress, work and friends are what a city judges you on. */
export const reputationOf = (stage: number, friends: number, works: number, chapter: number) =>
  Math.round(stage * 3 + friends * 1.2 + Math.min(12, works) * 0.8 + chapter);

/** At this reputation the guard waves you through the golden gate after dark. */
export const REP_GATE_OPEN = 12;
export const REP_DISCOUNT_AT = 11;
export const REP_DISCOUNT = 0.08;

// ------------------------------------------------------------------- shift work

export const SHIFT_SECONDS = 95;
export const SHIFT_CUSTOMERS = 8;
export const SHIFT_PAY = 12;
export const SHIFT_BONUS = 45;
export const SHIFT_ENERGY = 12;
export const SHIFT_COOLDOWN_MS = 75_000;
export const SHIFT_SERVE_REACH = 46;

export const SHIFT_ORDERS = [
  "One coffee, no sugar.",
  "Two bowls, extra hot.",
  "Skewers — make it four.",
  "Whatever's quick, please.",
  "One box to take away.",
  "Same as yesterday.",
  "Hot tea and a bun.",
  "Noodles, big bowl.",
];

// --------------------------------------------------------------------- transport

export const BUS_FARE = 8;
export const BUS_SPEED = 74;
export const BUS_DWELL_SEC = 6;
export const TAXI_FARES: { id: "slums" | "office" | "rich"; label: string; x: number; y: number; fare: number }[] = [
  { id: "slums", label: "The Slums", x: 8, y: 25, fare: 15 },
  { id: "office", label: "Office District", x: 30, y: 25, fare: 25 },
  { id: "rich", label: "Rich District", x: 56, y: 25, fare: 40 },
];

// ------------------------------------------------------------------------- home

export const FURNITURE: {
  id: string;
  name: string;
  price: number;
  blurb: string;
  comfort: number;
}[] = [
  { id: "rug", name: "Cosy Rug", price: 200, blurb: "Ties the whole shack together.", comfort: 1 },
  { id: "plant", name: "Cheese Plant", price: 260, blurb: "Something green that is not mould.", comfort: 1 },
  { id: "lamp", name: "Warm Lamp", price: 340, blurb: "Glows through the night.", comfort: 1 },
  { id: "shelf", name: "Bookshelf", price: 420, blurb: "Mostly paperbacks. Some cheese guides.", comfort: 1 },
  { id: "tv", name: "Fat-screen TV", price: 700, blurb: "Resting at home recovers energy twice as fast.", comfort: 1 },
  { id: "bed", name: "Comfy Bed", price: 900, blurb: "Sleeping at home comes back three times sooner.", comfort: 2 },
  { id: "pet", name: "Pet Rat — Crumb", price: 1200, blurb: "Follows you about and sniffs out loose Coins.", comfort: 2 },
];

export const FURNITURE_BY_ID = (id: string) => FURNITURE.find((f) => f.id === id);

/** Resting at home: base regen plus whatever comfort you have bought. */
export const homeComfortOf = (owned: string[]) =>
  owned.reduce((sum, id) => sum + (FURNITURE_BY_ID(id)?.comfort ?? 0), 0);

export const PET_COIN_EVERY_MS = 45_000;
export const PET_COIN_AMOUNT = 4;

// ------------------------------------------------------------- rival & friction

export const RIVAL_NAME = "Slick Whiskers";
export const RIVAL_SPEED = 118;
export const RIVAL_GRAB_SEC = 2.4;
export const RIVAL_STEAL_TOAST = "Slick Whiskers got to that pile first.";
export const RICH_SPOT_MULT = 2;
export const PAVEMENT_FINE = 12;

export const STAGE_LABELS = [
  "Torn rags, 0 Coins",
  "Fresh clothes",
  "Smartphone in paw",
  "Jacket and motorbike",
  "Tailored suit",
  "Suit, gold chain and a car",
];

export function formatCoins(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}
