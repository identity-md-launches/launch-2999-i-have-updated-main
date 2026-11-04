import { useQuery } from "@tanstack/react-query";
import { Award, Briefcase, Crown, ExternalLink, Heart, Info, Medal, Sparkles, Trophy, Wallet, X } from "lucide-react";
import type { ReactNode } from "react";
import type { Snapshot } from "@/game/engine";
import { ACHIEVEMENTS, CHAPTERS, FURNITURE, JOBS, STAGE_LABELS, formatCoins, gearById, stageFor } from "@/game/data";
import {
  fetchLeaderboard,
  fetchSqueekAccount,
  fetchSqueekOverview,
  formatBaseUnits,
  formatWhen,
  compactNumber,
} from "@/lib/progress";
import { PIXEL, VN, btnGhost, btnGold, chipClass, panelClass } from "./ui";
import { SqueekLive } from "./SqueekLive";

function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-40 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className={`${panelClass} animate-in slide-in-from-right-8 flex h-full w-full max-w-[400px] flex-col rounded-none border-y-0 border-r-0 duration-200`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-[#37305a] px-4 py-3">
          <h3 className="text-[11px] text-[#f2f0fa]" style={PIXEL}>
            {title}
          </h3>
          <button type="button" onClick={onClose} className="rounded border-2 border-[#37305a] p-1 text-[#9f98c4] hover:bg-[#241f3d]">
            <X size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export function SqueekPanel({ onClose }: { onClose: () => void }) {
  const query = useQuery({
    queryKey: ["squeek-overview"],
    queryFn: fetchSqueekOverview,
    refetchInterval: 30_000,
    retry: 1,
  });
  return (
    <Drawer title="SQUEEKCHAIN · LIVE" onClose={onClose}>
      <SqueekLive
        overview={query.data}
        loading={query.isLoading}
        error={query.isError}
        onRefresh={() => void query.refetch()}
      />
    </Drawer>
  );
}

export function LeaderboardPanel({ onClose }: { onClose: () => void }) {
  const query = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
    refetchInterval: 60_000,
  });
  const rows = query.data ?? [];
  return (
    <Drawer title="LEADERBOARD" onClose={onClose}>
      <p className="text-[11px] text-[#9f98b5]" style={VN}>
        Ranked by total Coins earned across every run.
      </p>
      <div className="mt-3 flex flex-col gap-1.5">
        {query.isLoading && (
          <p className="text-[11px] text-[#9f98c4]" style={VN}>
            Loading…
          </p>
        )}
        {rows.map((row) => (
          <div
            key={`${row.rank}-${row.name}`}
            className={`flex items-center justify-between rounded-md border-2 px-3 py-2 ${
              row.rank === 1 ? "border-[#e8b23a]/60 bg-[#e8b23a]/10" : "border-[#241f33] bg-[#191527]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 text-[11px] text-[#8f88b5]" style={PIXEL}>
                {row.rank}
              </span>
              <div>
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#f2f0fa]" style={VN}>
                  {row.name}
                  {row.won ? <Crown size={12} className="text-[#ffd977]" /> : null}
                </div>
                <div className="text-[10px] text-[#5f5880]" style={VN}>
                  Ch.{row.chapter} · {row.wallet ?? "no wallet linked"}
                </div>
              </div>
            </div>
            <span className="text-[11px] text-[#ffd977]" style={PIXEL}>
              {formatCoins(row.coins_earned)}
            </span>
          </div>
        ))}
        {!query.isLoading && rows.length === 0 && (
          <p className="text-[11px] text-[#9f98c4]" style={VN}>
            Nobody on the board yet — you could be the first.
          </p>
        )}
      </div>
    </Drawer>
  );
}

export function HomePanel({
  snap,
  onBuy,
  onClose,
}: {
  snap: Snapshot;
  onBuy: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Drawer title="SQUEEK'S FLAT" onClose={onClose}>
      <div className={`${panelClass} px-3 py-2 text-[11px] text-[#cfc9e8]`} style={VN}>
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-[#ffd977]" />
          <span className="font-semibold text-[#ffd977]">Home comfort {snap.comfort}</span>
        </div>
        <p className="mt-1 text-[10px] text-[#8f88b5]">
          Every piece you own makes resting at home recover energy faster, and the flat is drawn the way you left it.
        </p>
      </div>
      <div className="mt-2 space-y-2">
        {FURNITURE.map((item) => {
          const owned = snap.furniture.includes(item.id);
          const afford = snap.coins >= item.price;
          return (
            <div key={item.id} className={`${panelClass} flex items-center justify-between gap-3 px-3 py-2`}>
              <div>
                <div className="text-[12px] font-semibold text-[#f2eefc]" style={VN}>
                  {item.name}
                </div>
                <div className="text-[10px] text-[#8f88b5]" style={VN}>
                  {item.blurb}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onBuy(item.id)}
                disabled={owned}
                className={owned ? btnGhost : afford ? btnGold : btnGhost}
                style={VN}
              >
                {owned ? "In the flat" : `${formatCoins(item.price)} Coins`}
              </button>
            </div>
          );
        })}
      </div>
    </Drawer>
  );
}

/** The neighbours you have got to know. */
function FriendsSection({ snap }: { snap: Snapshot }) {
  return (
    <div className="mt-2">
      <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold text-[#ffa8cb]" style={VN}>
        <Heart size={12} /> People who know you
        <span className="text-[10px] text-[#8f88b5]">{snap.friends.length}</span>
      </div>
      {snap.friends.length === 0 ? (
        <div className={`${panelClass} px-3 py-2 text-[10px] text-[#8f88b5]`} style={VN}>
          Nobody knows your name yet. Walk up to someone and press E to say hello — do it a few times and they will remember
          you.
        </div>
      ) : (
        <div className="space-y-1">
          {snap.friends.slice(0, 12).map((f) => (
            <div key={f.id} className={`${panelClass} flex items-center justify-between px-3 py-1.5`}>
              <span className="text-[11px] text-[#e8e4f5]" style={VN}>
                {f.name}
              </span>
              <span className="text-[10px] text-[#8f88b5]" style={VN}>
                {f.tier} · {f.talks} chats
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function QuestsPanel({ snap, onClose }: { snap: Snapshot; onClose: () => void }) {
  return (
    <Drawer title="QUESTS & ACHIEVEMENTS" onClose={onClose}>
      <FriendsSection snap={snap} />
      <div className="mt-3 flex flex-col gap-2">
        {CHAPTERS.map((chapter) => {
          const done = snap.chapter > chapter.n || (chapter.n === 5 && snap.won);
          const current = snap.chapter === chapter.n && !done;
          return (
            <div
              key={chapter.n}
              className={`rounded-md border-2 px-3 py-2 ${
                current ? "border-[#ff2882]/70 bg-[#ff2882]/10" : done ? "border-[#2fa85c]/50 bg-[#2fa85c]/10" : "border-[#241f33] bg-[#191527]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8f88b5]" style={PIXEL}>
                  CH.{chapter.n}
                </span>
                <span className={`text-[10px] ${done ? "text-[#8fe8b0]" : current ? "text-[#ffa8cb]" : "text-[#5f5880]"}`} style={VN}>
                  {done ? "Completed" : current ? "In progress" : "Locked"}
                </span>
              </div>
              <div className="mt-1 text-[12px] font-semibold text-[#f2f0fa]" style={VN}>
                {chapter.title} · {chapter.subtitle}
              </div>
              <p className="mt-1 text-[11px] text-[#9f98c4]" style={VN}>
                {chapter.objective}
              </p>
              {current && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {snap.checklist.map((item) => (
                    <span
                      key={item.label}
                      className={`rounded border px-1.5 py-0.5 text-[10px] ${
                        item.ok ? "border-[#2fa85c] bg-[#2fa85c]/15 text-[#8fe8b0]" : "border-[#37305a] text-[#8f88b5]"
                      }`}
                      style={VN}
                    >
                      {item.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-md border-2 border-[#241f33] bg-[#191527] px-3 py-3">
        <div className="flex items-center gap-1.5 text-[11px] text-[#cfc9e8]" style={VN}>
          <Briefcase size={13} className="text-[#7fe8ff]" /> Career ladder · Coins per shift
        </div>
        <div className="mt-2 flex flex-col gap-1.5">
          {JOBS.map((job) => {
            const locked = Boolean(job.requires) && !snap.items.includes(job.requires!);
            return (
              <div key={job.id} className="flex items-center justify-between gap-2 border-b border-[#241f33] pb-1.5 last:border-0 last:pb-0">
                <div>
                  <div className={`text-[11px] ${locked ? "text-[#8f88b5]" : "text-[#cfc9e8]"}`} style={VN}>
                    {job.name}
                  </div>
                  <div className="text-[10px] text-[#5f5880]" style={VN}>
                    {job.hold
                      ? `Hold E · ${job.energy} EN per pile`
                      : `${job.energy} EN · ${job.requires ? (locked ? `needs ${gearById(job.requires).name}` : `uses your ${gearById(job.requires).name}`) : "no gear needed"}`}
                  </div>
                </div>
                <span className={`whitespace-nowrap text-[11px] ${locked ? "text-[#5f5880]" : "text-[#ffd977]"}`} style={PIXEL}>
                  {formatCoins(job.reward)}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-[#5f5880]" style={VN}>
          Downtown jobs pay far more per shift than scavenging — buy the gear on the left to unlock the next rung. Land the
          timing bar in the middle for a ×1.5 bonus.
        </p>
      </div>

      <div className="mt-5">
        <div className="flex items-center gap-1.5 text-[11px] text-[#ffd977]" style={VN}>
          <Trophy size={13} /> Achievements ({snap.achievements.length}/{Object.keys(ACHIEVEMENTS).length})
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {Object.entries(ACHIEVEMENTS).map(([code, title]) => {
            const unlocked = snap.achievements.includes(code);
            return (
              <span
                key={code}
                className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] ${
                  unlocked ? "border-[#e8b23a] bg-[#e8b23a]/15 text-[#ffd977]" : "border-[#37305a] text-[#5f5880]"
                }`}
                style={VN}
              >
                <Medal size={11} /> {title}
              </span>
            );
          })}
        </div>
      </div>

      <div className="mt-5 rounded-md border-2 border-[#241f33] bg-[#191527] px-3 py-3">
        <div className="flex items-center gap-1.5 text-[11px] text-[#cfc9e8]" style={VN}>
          <Award size={13} className="text-[#ff8ab8]" /> Current look
        </div>
        <div className="mt-1.5 text-[11px] text-[#9f98c4]" style={VN}>
          {STAGE_LABELS[stageFor(snap.items)]}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {snap.items.length === 0 ? (
            <span className="text-[11px] text-[#5f5880]" style={VN}>
              You own nothing yet — just the torn rags.
            </span>
          ) : (
            snap.items.map((item) => (
              <span key={item} className={`${chipClass} text-[10px] text-[#cfc9e8]`} style={VN}>
                {gearById(item).name}
              </span>
            ))
          )}
        </div>
      </div>
    </Drawer>
  );
}

export function WalletPanel({
  wallet,
  onConnect,
  onClose,
}: {
  wallet: string | null;
  onConnect: () => void;
  onClose: () => void;
}) {
  const query = useQuery({
    queryKey: ["squeek-account", wallet],
    queryFn: () => fetchSqueekAccount(wallet!),
    enabled: Boolean(wallet),
    retry: 1,
  });
  const account = query.data?.data;
  const earnings: any[] = account?.earnings ?? [];

  return (
    <Drawer title="WALLET & ONCHAIN" onClose={onClose}>
      <div className="rounded-md border-2 border-[#3f8fd8]/50 bg-[#3f8fd8]/10 px-3 py-3">
        <div className="flex items-center gap-1.5 text-[11px] text-[#bcdcff]" style={VN}>
          <Info size={13} /> What linking a wallet does
        </div>
        <ul className="mt-1.5 flex flex-col gap-1 text-[11px] leading-relaxed text-[#cfc9e8]" style={VN}>
          <li>· Ties your run and achievements to your address on the leaderboard (shown as 0x12…ab34).</li>
          <li>· Unlocks the live onchain view below: claimable SQK, staked SQK, your Squeek NFTs and 7-day rewards.</li>
          <li>· Read-only — it never signs a transaction, costs no gas and never moves anything.</li>
        </ul>
      </div>

      {!wallet ? (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-[11px] leading-relaxed text-[#9f98c4]" style={VN}>
            Playing without a wallet works fine — your progress still saves. Connect only if you want the leaderboard link
            and your onchain stats.
          </p>
          <button type="button" className={btnGold} onClick={onConnect} style={VN}>
            <Wallet size={13} /> Connect wallet
          </button>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          <div className="rounded-md border-2 border-[#2fa85c]/50 bg-[#2fa85c]/10 px-3 py-2">
            <div className="text-[10px] text-[#8fe8b0]" style={VN}>
              Connected · Ethereum Sepolia
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-[11px] text-[#f2f0fa]" style={VN}>
                {wallet.slice(0, 10)}…{wallet.slice(-8)}
              </span>
              <a
                className="inline-flex items-center gap-1 text-[10px] text-[#7fe8ff] hover:underline"
                href={`https://sepolia.etherscan.io/address/${wallet}`}
                target="_blank"
                rel="noreferrer"
                style={VN}
              >
                Etherscan <ExternalLink size={10} />
              </a>
            </div>
          </div>

          {query.isLoading && (
            <p className="text-[11px] text-[#9f98c4]" style={VN}>
              Reading wallet data from Squeekchain…
            </p>
          )}
          {query.isError && (
            <p className="text-[11px] text-[#ffb3b3]" style={VN}>
              Could not read wallet data. Try again later.
            </p>
          )}
          {account?.status === "unavailable" && (
            <p className="text-[11px] text-[#9f98c4]" style={VN}>
              Squeekchain has no data for this wallet right now ({account.reason ?? "unavailable"}).
            </p>
          )}
          {account?.status === "available" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Claimable SQK", value: formatBaseUnits(account?.rewards?.claimableBaseUnits) },
                  { label: "SQK staked", value: formatBaseUnits(account?.stake?.principalBaseUnits) },
                  { label: "Squeeks (wallet)", value: String(account?.tokenCounts?.wallet ?? "0") },
                  { label: "Squeeks (staking)", value: String(account?.tokenCounts?.staking ?? "0") },
                  { label: "NFT power", value: compactNumber(account?.power?.nftPower) },
                  { label: "SQK power", value: compactNumber(account?.power?.sqkPower) },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-md border-2 border-[#241f33] bg-[#191527] px-3 py-2">
                    <div className="text-[10px] text-[#8f88b5]" style={VN}>
                      {stat.label}
                    </div>
                    <div className="mt-1 text-[11px] text-[#f2f0fa]" style={PIXEL}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              {earnings.length > 0 && (
                <div className="rounded-md border-2 border-[#241f33] bg-[#191527] px-3 py-3">
                  <span className="text-[10px] text-[#8f88b5]" style={VN}>
                    Rewards, last 7 days (SQK)
                  </span>
                  <div className="mt-2 flex h-16 items-end gap-1.5">
                    {earnings.map((day, index) => {
                      const toSqk = (raw: unknown) => {
                        try {
                          return Number(BigInt(String(raw ?? "0"))) / 1e18;
                        } catch {
                          return 0;
                        }
                      };
                      const values = earnings.map((entry) => toSqk(entry?.earnedBaseUnits));
                      const max = Math.max(...values, 0.0000001);
                      const value = toSqk(day?.earnedBaseUnits);
                      return (
                        <div key={`${day?.date ?? index}`} className="flex flex-1 flex-col items-center gap-1">
                          <div
                            className="w-full rounded-sm bg-[#ff2882]"
                            style={{ height: `${Math.max(3, (value / max) * 48)}px` }}
                            title={`${day?.date ?? ""}: ${formatBaseUnits(day?.earnedBaseUnits ?? "0")} SQK`}
                          />
                          <span className="text-[8px] text-[#5f5880]" style={VN}>
                            {String(day?.date ?? "").slice(5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {Array.isArray(account?.tokens) && account.tokens.length > 0 && (
                <div className="rounded-md border-2 border-[#241f33] bg-[#191527] px-3 py-3">
                  <span className="text-[10px] text-[#8f88b5]" style={VN}>
                    Your Squeek NFTs
                  </span>
                  <div className="mt-2 flex flex-col gap-1">
                    {account.tokens.slice(0, 8).map((token: any, index: number) => (
                      <div key={token?.tokenId ?? `token-${index}`} className="flex items-center justify-between text-[11px]" style={VN}>
                        <span className="text-[#cfc9e8]">#{String(token?.tokenId ?? "—")}</span>
                        <span className="text-[#8f88b5]">
                          level {token?.level ?? "—"} · {token?.custody === "staking" ? "staked" : "in wallet"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[10px] text-[#5f5880]" style={VN}>
                Wallet data read live from Squeekchain · updated {formatWhen(new Date().toISOString())}
              </p>
            </>
          )}
          <button type="button" className={btnGhost} onClick={onConnect} style={VN}>
            Switch wallet
          </button>
        </div>
      )}
    </Drawer>
  );
}
