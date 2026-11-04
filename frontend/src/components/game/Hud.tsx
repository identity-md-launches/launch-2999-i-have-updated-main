import {
  Armchair,
  Bike,
  Car,
  Check,
  ChefHat,
  CloudRain,
  Coins,
  Home,
  ListOrdered,
  Moon,
  Package,
  PartyPopper,
  Radio,
  Star,
  Sun,
  Trophy,
  Volume2,
  VolumeX,
  Wallet,
  ZapOff,
} from "lucide-react";
import type { ReactNode } from "react";
import type { Snapshot } from "@/game/engine";
import { CHAPTERS, ENERGY_MAX, formatCoins } from "@/game/data";
import { PIXEL, VN, chipClass, panelClass } from "./ui";

export type PanelId = "squeek" | "leaderboard" | "quests" | "home" | "wallet";

const TOAST_STYLE: Record<string, string> = {
  coin: "border-[#e8b23a] text-[#ffd977]",
  info: "border-[#3f8fd8] text-[#bcdcff]",
  warn: "border-[#c94f4f] text-[#ffb3b3]",
  achievement: "border-[#ff2882] text-[#ffa8cb]",
};

export /** One line of the bottom action bar: a key badge and what it does. */
function PromptRow({ prompt, progress }: { prompt: { label: string; key?: "E" | "F" }; progress?: number }) {
  const key = prompt.key === "F" ? "F" : "E";
  const text = prompt.label.replace(/^Press [EF] to /i, "").replace(/^./, (c) => c.toUpperCase());
  const accent = key === "F" ? "#7fe8ff" : "#ff2882";
  return (
    <div
      className="flex flex-col items-center gap-1 rounded-lg border-2 bg-[#141221]/95 px-3 py-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
      style={{ borderColor: `${accent}99` }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold text-[#12121a]"
          style={{ ...PIXEL, background: accent }}
        >
          {key}
        </span>
        <span className="text-[12px] font-semibold text-[#f2eefc]" style={VN}>
          {text}
        </span>
      </div>
      {typeof progress === "number" && progress > 0 && (
        <span className="h-1.5 w-full overflow-hidden rounded-full bg-[#2a2440]">
          <span
            className="block h-full rounded-full"
            style={{ width: `${Math.min(100, Math.round(progress * 100))}%`, background: accent }}
          />
        </span>
      )}
    </div>
  );
}

export function Hud({
  snap,
  panel,
  onOpen,
  wallet,
  onConnect,
  onToggleMute,
  live,
}: {
  snap: Snapshot;
  panel: PanelId | null;
  onOpen: (panel: PanelId) => void;
  wallet: string | null;
  onConnect: () => void;
  onToggleMute: () => void;
  live: boolean;
}) {
  const chapterDef = CHAPTERS[snap.chapter - 1];
  const lowEnergy = snap.energy < 25;
  const navButton = (id: PanelId, icon: ReactNode, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => onOpen(id)}
      className={`flex items-center gap-1.5 rounded-md border-2 px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
        panel === id
          ? "border-[#ff2882] bg-[#ff2882]/20 text-[#ffa8cb]"
          : "border-[#37305a] bg-[#141221]/90 text-[#cfc9e8] hover:bg-[#221c3a]"
      }`}
      style={VN}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <>
      {/* Top-left: Squeek's wallet */}
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className={`${panelClass} pointer-events-auto flex items-center gap-2 px-3 py-2`}>
            <Coins size={15} className="text-[#ffc53d]" />
            <span className="text-[13px] text-[#ffd977]" style={PIXEL}>
              {formatCoins(snap.coins)}
            </span>
          </div>
          <div className={`${panelClass} pointer-events-auto flex items-center gap-2 px-3 py-2`}>
            <span className="text-[9px] text-[#8f88b5]" style={VN}>
              EN
            </span>
            <div className="h-2.5 w-24 overflow-hidden rounded-sm border border-[#37305a] bg-[#241f33]">
              <div
                className={`h-full transition-[width] duration-200 ${lowEnergy ? "bg-gradient-to-r from-[#c94f4f] to-[#8f2f39]" : "bg-gradient-to-r from-[#43d17a] to-[#2fa85c]"}`}
                style={{ width: `${Math.round(snap.energyPct * 100)}%` }}
              />
            </div>
            <span className="text-[10px] tabular-nums text-[#9f98c4]" style={VN}>
              {Math.floor(snap.energy)}/{ENERGY_MAX}
            </span>
          </div>
        </div>

        <div className={`${panelClass} pointer-events-auto hidden w-[290px] px-3 py-2 sm:block`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#ff8ab8]" style={PIXEL}>
              CH.{snap.chapter}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-[#8f88b5]" style={PIXEL}>
              {chapterDef.title}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-[#cfc9e8]" style={VN}>
            {chapterDef.objective}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {snap.checklist.map((item) => (
              <span
                key={item.label}
                className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] ${
                  item.ok ? "border-[#2fa85c] bg-[#2fa85c]/15 text-[#8fe8b0]" : "border-[#37305a] bg-[#1c1830] text-[#8f88b5]"
                }`}
                style={VN}
              >
                {item.ok ? <Check size={10} /> : <span className="inline-block h-2 w-2 rounded-full border border-[#5a5280]" />}
                {item.label}
              </span>
            ))}
          </div>
        </div>
              {/* Clock, weather and standing — inside the left column, so they stack */}
      <div className="pointer-events-none flex max-w-[300px] flex-wrap items-center gap-2">
        <span
          className="flex items-center gap-1.5 rounded-md border-2 border-[#37305a] bg-[#141221]/90 px-2.5 py-1.5 text-[11px] font-semibold text-[#e8e4f5]"
          title={`${snap.phaseLabel} on day ${snap.day}`}
          style={VN}
        >
          {snap.phase === "night" ? <Moon size={13} className="text-[#9fb0ff]" /> : <Sun size={13} className="text-[#ffd977]" />}
          <span>Day {snap.day}</span>
          <span className="text-[#8f88b5]">·</span>
          <span>{snap.clock}</span>
          <span className="hidden text-[10px] text-[#8f88b5] sm:inline">{snap.phaseLabel}</span>
        </span>
        {snap.event.active && (
          <span
            className="flex items-center gap-1.5 rounded-md border-2 border-[#7fe8ff]/50 bg-[#7fe8ff]/10 px-2.5 py-1.5 text-[11px] font-semibold text-[#bff2ff]"
            title={snap.event.blurb}
            style={VN}
          >
            {snap.event.id === "rain" ? <CloudRain size={13} /> : snap.event.id === "blackout" ? <ZapOff size={13} /> : <PartyPopper size={13} />}
            <span className="hidden sm:inline">{snap.event.name}</span>
          </span>
        )}
        <span
          className="flex items-center gap-1.5 rounded-md border-2 border-[#e8b23a]/50 bg-[#e8b23a]/10 px-2.5 py-1.5 text-[11px] font-semibold text-[#ffd977]"
          title={`Reputation ${snap.rep} — dress well, work hard, know people`}
          style={VN}
        >
          <Star size={13} />
          <span>{snap.repLabel}</span>
          <span className="text-[10px] text-[#c9a85f]">{snap.rep}</span>
        </span>
        {snap.shift && (
          <span
            className="flex items-center gap-1.5 rounded-md border-2 border-[#43d17a]/60 bg-[#43d17a]/15 px-2.5 py-1.5 text-[11px] font-semibold text-[#b8f5cd]"
            title={`Serving the queue at ${snap.shift.cart}`}
            style={VN}
          >
            <ChefHat size={13} />
            <span>
              {snap.shift.served}/{snap.shift.total}
            </span>
            <span className="text-[10px] text-[#7fd8a0]">
              {Math.floor(snap.shift.left / 60)}:{String(Math.floor(snap.shift.left % 60)).padStart(2, "0")}
            </span>
          </span>
        )}
      </div>
      </div>

      {/* Top-right: panels */}
      <div className="absolute right-3 top-3 flex items-center gap-2">
        {navButton(
          "squeek",
          <span className="relative flex items-center">
            <Radio size={13} />
            <span className={`absolute -right-1.5 -top-1 h-1.5 w-1.5 rounded-full ${live ? "bg-[#43d17a]" : "bg-[#c94f4f]"}`} />
          </span>,
          "Squeekchain"
        )}
        {navButton("quests", <ListOrdered size={13} />, "Quests")}
        {navButton("home", <Home size={13} />, "Home")}
        {navButton("leaderboard", <Trophy size={13} />, "Ranks")}
        {snap.quest && (
          <span
            className="flex max-w-[220px] items-center gap-1.5 rounded-md border-2 border-[#43d17a]/70 bg-[#43d17a]/15 px-2.5 py-1.5 text-[11px] font-semibold text-[#b8f5cd]"
            title={snap.quest.stage === "pickup" ? "Collect the order" : "Drop the order off"}
            style={VN}
          >
            <Package size={13} className="shrink-0" />
            <span className="truncate">
              {snap.quest.stage === "pickup" ? `Pick up: ${snap.quest.label}` : `Deliver: ${snap.quest.label}`}
            </span>
          </span>
        )}
        {snap.sitting && (
          <span
            className="flex items-center gap-1.5 rounded-md border-2 border-[#7fe8ff]/60 bg-[#7fe8ff]/12 px-2.5 py-1.5 text-[11px] font-semibold text-[#bff2ff]"
            title="Press E to stand up"
            style={VN}
          >
            <Armchair size={13} />
            <span className="hidden md:inline">Resting</span>
          </span>
        )}
        {snap.riding && (
          <span
            className="flex items-center gap-1.5 rounded-md border-2 border-[#ff8ab8]/60 bg-[#ff2882]/15 px-2.5 py-1.5 text-[11px] font-semibold text-[#ffa8cb]"
            title="Press F to get off"
            style={VN}
          >
            {snap.riding === "car" ? <Car size={13} /> : <Bike size={13} />}
            <span className="hidden md:inline">{snap.riding === "car" ? "Driving" : "Riding"}</span>
            <span className="rounded border border-[#7fe8ff]/50 bg-[#7fe8ff]/10 px-1 py-0.5 text-[10px] font-bold text-[#bff2ff]">
              F
            </span>
          </span>
        )}
        <button
          type="button"
          onClick={onToggleMute}
          title={snap.muted ? "Sound off — click for music" : "Sound on — click to mute"}
          className={`flex items-center gap-1.5 rounded-md border-2 px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
            snap.muted ? "border-[#37305a] bg-[#141221]/90 text-[#8f88b5]" : "border-[#7fe8ff]/60 bg-[#7fe8ff]/10 text-[#bff2ff]"
          }`}
        >
          {snap.muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          <span className="hidden lg:inline" style={VN}>
            {snap.muted ? "Music off" : "Music on"}
          </span>
        </button>
        <button
          type="button"
          onClick={onConnect}
          className={`flex items-center gap-1.5 rounded-md border-2 px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
            wallet ? "border-[#2fa85c] bg-[#2fa85c]/15 text-[#8fe8b0]" : "border-[#e8b23a] bg-[#e8b23a]/10 text-[#ffd977] hover:bg-[#e8b23a]/20"
          }`}
          style={VN}
        >
          <Wallet size={13} />
          <span className="hidden sm:inline">{wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : "Connect wallet"}</span>
        </button>
      </div>

      {/* Bottom-centre: what you can do right here. Kept away from the mouse
          on purpose — labels over the character used to hide it. */}
      {(snap.prompt || snap.vehiclePrompt) && (
        <div className="pointer-events-none absolute bottom-32 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5 md:bottom-6">
          {snap.prompt && <PromptRow prompt={snap.prompt} progress={snap.promptProgress} />}
          {snap.vehiclePrompt && <PromptRow prompt={snap.vehiclePrompt} />}
        </div>
      )}

      {/* Bottom-left: controls */}
      <div className="pointer-events-none absolute bottom-3 left-3 hidden md:block">
        <div className={`${panelClass} px-3 py-2 text-[10px] text-[#8f88b5]`} style={VN}>
          <span className="text-[#cfc9e8]">WASD</span> move · <span className="text-[#cfc9e8]">E</span> interact / hold to
          scavenge · <span className="text-[#cfc9e8]">F</span> ride or get off · <span className="text-[#cfc9e8]">Esc</span> close
        </div>
      </div>

      {/* Chapter banner */}
      {snap.banner && (
        <div className="pointer-events-none absolute inset-x-0 top-24 flex justify-center">
          <div className="animate-in fade-in slide-in-from-top-4 zoom-in-95 duration-500 rounded-lg border-2 border-[#e8b23a] bg-[#141221]/95 px-6 py-4 text-center shadow-[0_16px_50px_rgba(0,0,0,0.7)]">
            <div className="text-[11px] text-[#e8b23a]" style={PIXEL}>
              CHAPTER {snap.banner.n}
            </div>
            <div className="mt-2 text-[16px] text-[#ffd977]" style={PIXEL}>
              {snap.banner.title}
            </div>
            <div className="mt-1 text-[12px] text-[#cfc9e8]" style={VN}>
              {snap.banner.subtitle}
            </div>
          </div>
        </div>
      )}

      {/* Interaction prompt */}
      {snap.prompt && !snap.modal && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center">
          <div className={`${panelClass} animate-in fade-in slide-in-from-bottom-2 flex flex-col items-center gap-1.5 px-3 py-2`}>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded border-2 border-[#ff2882] bg-[#ff2882]/20 text-[9px] text-[#ffa8cb]"
                style={PIXEL}
              >
                E
              </span>
              <span className="text-[12px] text-[#e8e5f6]" style={VN}>
                {snap.prompt.label}
              </span>
            </div>
            {snap.promptProgress > 0 && (
              <div className="h-1.5 w-40 overflow-hidden rounded-sm border border-[#37305a] bg-[#241f33]">
                <div className="h-full bg-[#ffd977]" style={{ width: `${Math.round(snap.promptProgress * 100)}%` }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-1.5">
        {snap.toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-in fade-in slide-in-from-bottom-2 rounded-md border-2 bg-[#141221]/95 px-3 py-1.5 text-[11px] font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.5)] ${
              TOAST_STYLE[toast.kind] ?? TOAST_STYLE.info
            }`}
            style={VN}
          >
            {toast.text}
          </div>
        ))}
      </div>
    </>
  );
}

export function TouchControls({
  onMove,
  onActionPress,
  onActionRelease,
  onVehiclePress,
}: {
  onMove: (dir: "up" | "down" | "left" | "right", pressed: boolean) => void;
  onActionPress: () => void;
  onVehiclePress: () => void;
  onActionRelease: () => void;
}) {
  const dirButton = (dir: "up" | "down" | "left" | "right", label: string) => (
    <button
      type="button"
      className="flex h-11 w-11 items-center justify-center rounded-md border-2 border-[#37305a] bg-[#141221]/90 text-[#cfc9e8] active:bg-[#272141]"
      onPointerDown={(event) => {
        event.preventDefault();
        onMove(dir, true);
      }}
      onPointerUp={() => onMove(dir, false)}
      onPointerLeave={() => onMove(dir, false)}
      onPointerCancel={() => onMove(dir, false)}
      style={VN}
    >
      {label}
    </button>
  );
  return (
    <div className="absolute bottom-4 left-4 flex items-end gap-6 md:hidden">
      <div className="grid grid-cols-3 gap-1">
        <span />
        {dirButton("up", "▲")}
        <span />
        {dirButton("left", "◀")}
        {dirButton("down", "▼")}
        {dirButton("right", "▶")}
      </div>
      <button
        type="button"
        onPointerDown={(event) => {
          event.preventDefault();
          onActionPress();
        }}
        onPointerUp={onActionRelease}
        onPointerLeave={onActionRelease}
        onPointerCancel={onActionRelease}
        className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#ff2882] bg-[#ff2882]/20 text-[13px] text-[#ffa8cb] active:bg-[#ff2882]/40"
        style={PIXEL}
      >
        E
      </button>
      <button
        type="button"
        onPointerDown={(event) => {
          event.preventDefault();
          onVehiclePress();
        }}
        className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#7fe8ff] bg-[#7fe8ff]/15 text-[13px] text-[#bff2ff] active:bg-[#7fe8ff]/35"
        style={PIXEL}
        title="Ride / get off"
      >
        F
      </button>
    </div>
  );
}
