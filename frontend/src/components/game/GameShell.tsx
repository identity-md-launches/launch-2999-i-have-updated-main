import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { DoorOpen, X } from "lucide-react";
import { SqueekGame, type Snapshot } from "@/game/engine";
import { fetchSqueekOverview, saveProgress, unlockAchievement } from "@/lib/progress";
import { connectEvmWallet, hasEvmWallet } from "@/lib/wallet";
import { setChapterTitle } from "@/lib/branding";
import { Hud, TouchControls, type PanelId } from "./Hud";
import { TAXI_FARES, formatCoins } from "@/game/data";
import { PIXEL, VN, btnGhost, btnGold, panelClass } from "./ui";
import { ShopModal } from "./ShopModal";
import { WorkModal } from "./WorkModal";
import { DialogModal, GateModal, WinScreen } from "./StoryModals";
import { WheelModal } from "./SqueekLive";
import { HomePanel, LeaderboardPanel, QuestsPanel, SqueekPanel, WalletPanel } from "./SidePanels";

export interface Session {
  playerKey: string;
  name: string;
  wallet: string | null;
  save: import("@/game/engine").SaveData | null;
}

const NULL_SNAPSHOT: Snapshot = {
  coins: 0,
  coinsEarned: 0,
  energy: 100,
  energyPct: 1,
  chapter: 1,
  checklist: [],
  items: [],
  stage: 0,
  prompt: null,
  vehiclePrompt: null,
  promptProgress: 0,
  modal: null,
  toasts: [],
  banner: null,
  won: false,
  gateOpen: false,
  works: 0,
  playedSec: 0,
  achievements: [],
  name: "",
  wallet: null,
  riding: null,
  wheelBoostReadyAt: 0,
  muted: false,
  quest: null,
  sitting: false,
  workingOut: false,
  clock: "07:00",
  day: 1,
  phase: "morning",
  phaseLabel: "Morning",
  event: { id: "none", name: "Quiet day", blurb: "", active: false },
  rep: 0,
  repLabel: "Nobody",
  friends: [],
  shopOpen: true,
  shift: null,
  comfort: 0,
  furniture: [],
  busWaiting: false,
  petOut: false,
};

/** Where to, boss? */
function TaxiModal({
  coins,
  onGo,
  onClose,
}: {
  coins: number;
  onGo: (id: "slums" | "office" | "rich") => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-4">
      <div className={`${panelClass} animate-in fade-in zoom-in-95 w-full max-w-[440px] duration-200`}>
        <div className="flex items-start justify-between border-b-2 border-[#37305a] px-4 py-3">
          <div>
            <div className="text-[11px] text-[#e8b23a]" style={PIXEL}>
              TAXI
            </div>
            <div className="mt-1 text-[13px] font-semibold text-[#f2f0fa]" style={VN}>
              “Where to, boss?”
            </div>
            <div className="text-[10px] text-[#8f88b5]" style={VN}>
              You have {formatCoins(coins)} Coins
            </div>
          </div>
          <button type="button" onClick={onClose} className={btnGhost} style={VN}>
            <X size={13} /> Close
          </button>
        </div>
        <div className="flex flex-col gap-2 p-4">
          {TAXI_FARES.map((ride) => (
            <button
              key={ride.id}
              type="button"
              onClick={() => onGo(ride.id)}
              className={coins >= ride.fare ? btnGold : btnGhost}
              style={VN}
            >
              {ride.label} · {formatCoins(ride.fare)} Coins
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GameShell({ session, onExit }: { session: Session; onExit: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<SqueekGame | null>(null);
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [wallet, setWallet] = useState<string | null>(session.wallet);
  const walletRef = useRef<string | null>(session.wallet);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    walletRef.current = wallet;
  }, [wallet]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const instance = new SqueekGame({
      canvas,
      playerKey: session.playerKey,
      name: session.name,
      wallet: walletRef.current,
      save: session.save,
      onSave: (payload, summary) => {
        void saveProgress(session.playerKey, session.name, walletRef.current, summary, payload);
      },
      onAchievement: (code, title) => {
        void unlockAchievement(session.playerKey, code, title);
      },
    });
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      instance.resize(Math.max(360, rect.width), Math.max(280, rect.height), Math.min(2, window.devicePixelRatio || 1));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    instance.start();
    setGame(instance);

    const saveNow = () => instance.saveNow();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") instance.saveNow();
    };
    window.addEventListener("pagehide", saveNow);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", saveNow);
      document.removeEventListener("visibilitychange", onVisibility);
      observer.disconnect();
      instance.saveNow();
      instance.destroy();
      setGame(null);
    };
  }, [session]);

  const subscribe = useCallback((listener: () => void) => (game ? game.subscribe(listener) : () => {}), [game]);
  const getSnapshot = useCallback(() => (game ? game.getSnapshot() : NULL_SNAPSHOT), [game]);
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Tab title follows the run, and resets when the player leaves the game.
  useEffect(() => {
    setChapterTitle(snap.chapter);
    return () => setChapterTitle(null);
  }, [snap.chapter]);

  const overviewQuery = useQuery({
    queryKey: ["squeek-overview"],
    queryFn: fetchSqueekOverview,
    refetchInterval: 30_000,
    retry: 1,
  });

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && panel) setPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel]);

  const connect = async () => {
    if (!hasEvmWallet()) {
      setNotice("No EVM wallet found in this browser. Install MetaMask to link a wallet.");
      window.setTimeout(() => setNotice(null), 5000);
      return;
    }
    try {
      const address = await connectEvmWallet();
      if (address) {
        setWallet(address);
        localStorage.setItem("squeek.wallet", address);
        game?.setWallet(address);
        setNotice("Sepolia wallet linked to this run.");
        window.setTimeout(() => setNotice(null), 4000);
      }
    } catch {
      setNotice("Wallet connection failed.");
      window.setTimeout(() => setNotice(null), 4000);
    }
  };

  const modal = snap.modal;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0d0c16]" style={VN}>
      <div ref={wrapRef} className="absolute inset-0">
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>

      <Hud
        snap={snap}
        panel={panel}
        onOpen={(next) => setPanel((current) => (current === next ? null : next))}
        wallet={wallet}
        onConnect={() => setPanel("wallet")}
        onToggleMute={() => game?.toggleMute()}
        live={Boolean(overviewQuery.data?.ok)}
      />

      <TouchControls
        onMove={(dir, pressed) => game?.setVirtualKey(dir, pressed)}
        onActionPress={() => game?.pressAction()}
        onVehiclePress={() => game?.pressVehicle()}
        onActionRelease={() => game?.releaseAction()}
      />

      <button
        type="button"
        onClick={onExit}
        className={`${btnGhost} absolute bottom-3 right-3 z-20`}
        style={VN}
      >
        <DoorOpen size={13} /> Menu
      </button>

      {notice && (
        <div className="absolute left-1/2 top-16 z-50 -translate-x-1/2 rounded-md border-2 border-[#37305a] bg-[#141221]/95 px-3 py-2 text-[11px] text-[#cfc9e8]">
          {notice}
        </div>
      )}

      {modal?.type === "shop" && (
        <ShopModal
          modal={modal}
          coins={snap.coins}
          items={snap.items}
          onBuyGear={(id) => game?.buyGear(id)}
          onBuyConsumable={(id) => game?.buyConsumable(id)}
          onClose={() => game?.closeModal()}
        />
      )}

      {modal?.type === "work" && (
        <WorkModal
          modal={modal}
          energy={snap.energy}
          onBegin={() => game?.beginSweep()}
          onStop={() => game?.stopMarker()}
          onAgain={() => game?.workAgain()}
          onClose={() => game?.closeModal()}
        />
      )}

      {modal?.type === "taxi" && (
        <TaxiModal
          coins={snap.coins}
          onGo={(id) => game?.takeTaxi(id)}
          onClose={() => game?.closeModal()}
        />
      )}

      {modal?.type === "dialog" && (
        <DialogModal modal={modal} onNext={() => game?.nextDialog()} onClose={() => game?.closeModal()} />
      )}

      {modal?.type === "gate" && (
        <GateModal modal={modal} onTryOpen={() => game?.tryOpenGate()} onClose={() => game?.closeModal()} />
      )}

      {modal?.type === "wheel" && (
        <WheelModal
          modal={modal}
          overview={overviewQuery.data}
          loading={overviewQuery.isLoading}
          error={overviewQuery.isError}
          onRefresh={() => void overviewQuery.refetch()}
          onClose={() => game?.closeModal()}
        />
      )}

      {modal?.type === "win" && (
        <WinScreen
          modal={modal}
          onContinue={() => game?.closeModal()}
          onLeaderboard={() => {
            game?.closeModal();
            setPanel("leaderboard");
          }}
        />
      )}

      {panel === "squeek" && <SqueekPanel onClose={() => setPanel(null)} />}
      {panel === "leaderboard" && <LeaderboardPanel onClose={() => setPanel(null)} />}
      {panel === "quests" && <QuestsPanel snap={snap} onClose={() => setPanel(null)} />}
      {panel === "home" && (
        <HomePanel snap={snap} onBuy={(id) => game?.buyFurniture(id)} onClose={() => setPanel(null)} />
      )}
      {panel === "wallet" && (
        <WalletPanel
          wallet={wallet}
          onConnect={() => {
            void connect();
          }}
          onClose={() => setPanel(null)}
        />
      )}
    </div>
  );
}
