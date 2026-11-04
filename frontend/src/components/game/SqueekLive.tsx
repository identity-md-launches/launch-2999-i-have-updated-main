import { lazy, Suspense } from "react";
import { Activity, Gauge, RefreshCw, Radio } from "lucide-react";
import type { SqueekOverview } from "@/lib/progress";
import { compactNumber, formatBaseUnits, formatWhen } from "@/lib/progress";
import { PIXEL, VN, btnGhost, chipClass, panelClass } from "./ui";

const SqueekChart = lazy(() => import("./SqueekChart"));

const EVENT_LABELS: Record<string, string> = {
  "system.settlement_completed": "Settlement on Sepolia",
  "system.mining_checkpointed": "Mining checkpoint",
  "account.rewards_claimed": "SQK rewards claimed",
  "account.claim_recipient_set": "Claim recipient set",
  "account.rewards_staked": "Rewards staked",
  "account.sqk_staked": "SQK staked",
  "account.sqk_unstaked": "SQK unstaked",
  "nft.deposited": "Squeek deposited",
  "nft.withdrawn": "Squeek withdrawn",
  "nft.merged": "Squeek merged",
  "nft.launch_claimed": "Launch Squeek claimed",
  "measurement.distance_milestone": "Distance milestone",
  "measurement.daily_distance_milestone": "Daily distance milestone",
  "measurement.speed_milestone": "Speed milestone",
  "measurement.speed_record": "Speed record",
  "measurement.distance_streak": "Distance streak",
};

const CORE_STATUS: Record<string, { label: string; color: string; dot: string }> = {
  ACTIVE: { label: "RUNNING", color: "text-[#8fe8b0]", dot: "bg-[#43d17a]" },
  IDLE: { label: "RESTING", color: "text-[#9f98c4]", dot: "bg-[#5f5880]" },
  COUNTER_FAULT: { label: "SENSOR FAULT", color: "text-[#ffb3b3]", dot: "bg-[#c94f4f]" },
};

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border-2 border-[#241f33] bg-[#191527] px-3 py-2">
      <div className="text-[10px] text-[#8f88b5]" style={VN}>
        {label}
      </div>
      <div className="mt-1 text-[12px] text-[#f2f0fa]" style={PIXEL}>
        {value}
      </div>
      {hint ? (
        <div className="mt-0.5 text-[10px] text-[#5f5880]" style={VN}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

export function SqueekLive({
  overview,
  loading,
  error,
  onRefresh,
}: {
  overview: SqueekOverview | undefined;
  loading: boolean;
  error: boolean;
  onRefresh: () => void;
}) {
  if (loading && !overview) {
    return (
      <p className="text-[11px] text-[#9f98c4]" style={VN}>
        Reading live data from api.squeekchain.com…
      </p>
    );
  }
  if (error && !overview) {
    return (
      <div className="rounded-md border-2 border-[#c94f4f]/60 bg-[#c94f4f]/10 px-3 py-2">
        <p className="text-[11px] text-[#ffb3b3]" style={VN}>
          Could not reach the Squeekchain API. Try again in a moment.
        </p>
        <button type="button" className={`${btnGhost} mt-2`} onClick={onRefresh} style={VN}>
          Try again
        </button>
      </div>
    );
  }
  if (!overview) return null;

  const measurement = overview.status?.data?.measurement;
  const anchor = overview.status?.data?.builder?.anchor;
  const core = overview.core?.data;
  const economy = overview.economy?.data;
  const events: any[] = overview.events?.data?.events ?? [];
  const statusMeta = CORE_STATUS[String(measurement?.coreStatus ?? "")] ?? CORE_STATUS.IDLE;
  const blockProgress = anchor?.blockProgress ? Number(anchor.blockProgress) / 1_000_000_000 : null;
  const feedError = overview.status?.error ?? overview.core?.error ?? overview.economy?.error ?? null;

  return (
    <div className="flex flex-col gap-3">
      {feedError && (
        <div className="rounded-md border-2 border-[#e8b23a]/60 bg-[#e8b23a]/10 px-3 py-2">
          <p className="text-[11px] leading-relaxed text-[#ffd977]" style={VN}>
            Live feed refused by the Squeekchain API ({feedError}). The game keeps running — readings come back on their
            own once the connection clears.
          </p>
          <p className="mt-1 text-[10px] text-[#8f88b5]" style={VN}>
            Server check: open <span className="text-[#cfc9e8]">/api/squeekchain/diag</span> on this domain to see what
            the server gets from api.squeekchain.com.
          </p>
        </div>
      )}
      {/* Wheel */}
      <div className="rounded-md border-2 border-[#241f33] bg-[#191527] px-3 py-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] text-[#8f88b5]" style={VN}>
            <Radio size={12} className="text-[#7fe8ff]" /> Squeektoshi&apos;s wheel (WHEELY9000)
          </span>
          <span className={`flex items-center gap-1.5 text-[10px] ${statusMeta.color}`} style={VN}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
            {statusMeta.label}
          </span>
        </div>
        {measurement ? (
          <>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Stat label="RPM" value={compactNumber(Number(measurement.rpmMilli ?? 0) / 1000)} />
              <Stat label="Speed (m/s)" value={(Number(measurement.speedMmPerSecond ?? 0) / 1000).toFixed(2)} />
              <Stat label="Distance (m)" value={(Number(measurement.distanceMm ?? 0) / 1000).toFixed(0)} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Stat label="Total work units" value={compactNumber(measurement.cumulativeWorkUnits)} hint="measured by the hardware" />
              <Stat
                label="Current block"
                value={anchor?.blockHeight ? `#${Number(anchor.blockHeight).toLocaleString("en-US")}` : "—"}
                hint={blockProgress !== null ? `${(blockProgress * 100).toFixed(1)}% mined` : undefined}
              />
            </div>
            <p className="mt-2 text-[10px] text-[#5f5880]" style={VN}>
              Updated {formatWhen(measurement.observedAt)} ·{" "}
              {measurement.freshness === "online" ? "live signal" : `feed state ${measurement.freshness ?? "—"}`}
            </p>
          </>
        ) : (
          <p className="mt-2 text-[11px] text-[#9f98c4]" style={VN}>
            No wheel data yet. {overview.status?.error ? `Error: ${overview.status.error}` : ""}
          </p>
        )}
      </div>

      {/* Core + economy */}
      <div className="grid grid-cols-2 gap-2">
        <Stat
          label="SqueekCore block"
          value={core?.core?.blockHeight ? `#${Number(core.core.blockHeight).toLocaleString("en-US")}` : "—"}
          hint={core?.core ? `settled through round ${core.core.settledThroughRound ?? "—"}${core.core.paused ? " · paused" : ""}` : undefined}
        />
        <Stat
          label="Work per 1k blocks"
          value={core?.core?.workPerThousandBlocks ? Number(core.core.workPerThousandBlocks).toLocaleString("en-US") : "—"}
          hint={core?.chain ? `Sepolia · block ${Number(core.chain.safeThroughBlock ?? 0).toLocaleString("en-US")}` : undefined}
        />
        <Stat
          label="SQK live supply"
          value={economy?.supply?.liveSupplyBaseUnits ? formatBaseUnits(economy.supply.liveSupplyBaseUnits) : "—"}
          hint={economy?.status === "unavailable" ? `temporarily unavailable (${economy.reason ?? "—"})` : "SQK token"}
        />
        <Stat
          label="SQK staked"
          value={economy?.staking?.totalStakedBaseUnits ? formatBaseUnits(economy.staking.totalStakedBaseUnits) : "—"}
          hint={economy?.nft ? `Squeeks: ${Number(economy.nft.live ?? 0).toLocaleString("en-US")} live` : undefined}
        />
      </div>

      {/* 7d chart */}
      {overview.stats?.ok && overview.stats?.data?.activity?.days?.length ? (
        <div className="rounded-md border-2 border-[#241f33] bg-[#191527] px-3 py-3">
          <span className="flex items-center gap-1.5 text-[10px] text-[#8f88b5]" style={VN}>
            <Activity size={12} className="text-[#ff2882]" /> Work units, last 7 days (live)
          </span>
          <div className="mt-1">
            <Suspense fallback={<div className="h-[132px] w-full animate-pulse rounded bg-[#191527]" />}>
              <SqueekChart overview={overview} />
            </Suspense>
          </div>
        </div>
      ) : null}

      {/* Events */}
      <div className="rounded-md border-2 border-[#241f33] bg-[#191527] px-3 py-3">
        <span className="text-[10px] text-[#8f88b5]" style={VN}>
          Recent onchain activity
        </span>
        <div className="mt-2 flex flex-col gap-1.5">
          {events.slice(0, 8).map((event, index) => (
            <div key={event?.id ?? `event-${index}`} className="flex items-start justify-between gap-2 border-b border-[#241f33] pb-1.5 last:border-0">
              <div>
                <div className="text-[11px] text-[#cfc9e8]" style={VN}>
                  {EVENT_LABELS[String(event?.type ?? "")] ?? String(event?.type ?? "—")}
                </div>
                <div className="text-[10px] text-[#5f5880]" style={VN}>
                  {event?.source?.transactionHash ? `${String(event.source.transactionHash).slice(0, 10)}…` : "—"}
                </div>
              </div>
              <span className="whitespace-nowrap text-[10px] text-[#8f88b5]" style={VN}>
                {formatWhen(event?.occurredAt)}
              </span>
            </div>
          ))}
          {events.length === 0 && (
            <p className="text-[11px] text-[#9f98c4]" style={VN}>
              No events returned yet.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className={chipClass}>
          <Gauge size={11} className="text-[#7fe8ff]" />
          <span className="text-[10px] text-[#8f88b5]" style={VN}>
            Source: {overview.source ?? "api.squeekchain.com"} · {formatWhen(overview.fetched_at)}
          </span>
        </span>
        <button type="button" className={btnGhost} onClick={onRefresh} style={VN}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>
    </div>
  );
}

export function WheelModal({
  modal,
  overview,
  loading,
  error,
  onRefresh,
  onClose,
}: {
  modal: Extract<import("@/game/engine").Modal, { type: "wheel" }>;
  overview: SqueekOverview | undefined;
  loading: boolean;
  error: boolean;
  onRefresh: () => void;
  onClose: () => void;
}) {
  const boostTone =
    modal.boost.status === "granted"
      ? "border-[#2fa85c] bg-[#2fa85c]/10 text-[#8fe8b0]"
      : modal.boost.status === "asleep" || modal.boost.status === "offline"
        ? "border-[#37305a] bg-[#191527] text-[#9f98c4]"
        : "border-[#e8b23a] bg-[#e8b23a]/10 text-[#ffd977]";
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-4">
      <div className={`${panelClass} animate-in fade-in zoom-in-95 flex max-h-[88vh] w-full max-w-[520px] flex-col duration-200`}>
        <div className="border-b-2 border-[#37305a] px-4 py-3">
          <h3 className="text-[12px] font-bold text-[#7fe8ff]" style={PIXEL}>
            WHEELY9000
          </h3>
          <p className="mt-1.5 text-[11px] text-[#9f98c4]" style={VN}>
            Squeektoshi&apos;s real wheel rig — every number here comes straight from Squeekchain.
          </p>
        </div>
        <div className={`mx-4 mt-3 rounded-md border-2 px-3 py-2 text-[11px] ${boostTone}`} style={VN}>
          {modal.boost.message}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <SqueekLive overview={overview} loading={loading} error={error} onRefresh={onRefresh} />
        </div>
        <div className="flex items-center justify-between border-t-2 border-[#37305a] px-4 py-3">
          <span className="text-[10px] text-[#5f5880]" style={VN}>
            Free energy only while the real wheel is spinning.
          </span>
          <button type="button" className={btnGhost} onClick={onClose} style={VN}>
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
