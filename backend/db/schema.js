// Squeek Life — database tables (single source of truth, auto-synced on startup)
const { pgTable, serial, text, integer, boolean, timestamp, jsonb } = require("drizzle-orm/pg-core");

// One row per playthrough. `player_key` is a random id generated in the browser
// (linked to a wallet address when the player connects one).
exports.players = pgTable("players", {
  id: serial("id").primaryKey(),
  player_key: text("player_key").notNull().unique(),
  name: text("name").notNull().default("Squeek"),
  wallet: text("wallet"),
  coins: integer("coins").notNull().default(0),
  coins_earned: integer("coins_earned").notNull().default(0),
  chapter: integer("chapter").notNull().default(1),
  stage: integer("stage").notNull().default(0),
  won: boolean("won").notNull().default(false),
  state: jsonb("state"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Unlocked achievements, keyed by player + code.
exports.achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  player_key: text("player_key").notNull(),
  code: text("code").notNull(),
  title: text("title").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});
