import { useEffect, useRef, useState } from "react";
import { Coins, Crown, Gamepad2, Radio, Save, Send, Wallet } from "lucide-react";
import { drawPlayer } from "@/game/sprites";
import { STAGE_LABELS } from "@/game/data";
import { connectEvmWallet, hasEvmWallet } from "@/lib/wallet";
import { gameMusic } from "@/game/music";
import { ShareModal } from "./ShareModal";
import { PIXEL, VN, btnGhost, btnGold, btnPrimary, chipClass, panelClass } from "./ui";

function StagePreview() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = 180 * dpr;
    canvas.height = 130 * dpr;
    let raf = 0;
    const t0 = performance.now();
    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      const stage = Math.floor(t / 2.2) % 6;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, 180, 130);
      ctx.fillStyle = "#191527";
      ctx.fillRect(0, 100, 180, 30);
      ctx.fillStyle = "#241f33";
      ctx.fillRect(0, 100, 180, 3);
      const frame = Math.floor(t * 3.2) % 2;
      drawPlayer(ctx, 90, 110, "down", frame, stage, t);
      ctx.font = '600 11px "Be Vietnam Pro", system-ui, sans-serif';
      ctx.textAlign = "center";
      ctx.fillStyle = "#8f88b5";
      ctx.fillText(STAGE_LABELS[stage], 90, 124);
      ctx.textAlign = "left";
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="mx-auto" style={{ width: 180, height: 130 }} />;
}

export function StartScreen({
  loading,
  existing,
  defaultName,
  wallet,
  onStart,
  onWallet,
}: {
  loading: boolean;
  existing: { coins: number; chapter: number; won: boolean } | null;
  defaultName: string;
  wallet: string | null;
  onStart: (name: string, mode: "new" | "continue") => void;
  onWallet: (address: string | null) => void;
}) {
  const [name, setName] = useState(defaultName);
  const [notice, setNotice] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  // Title-screen theme: browsers only allow audio after a gesture, so start on the first tap/key.
  useEffect(() => {
    const music = gameMusic();
    const kickoff = () => {
      music.ensure();
      music.setTrack("menu");
    };
    window.addEventListener("pointerdown", kickoff, { once: true });
    window.addEventListener("keydown", kickoff, { once: true });
    return () => {
      window.removeEventListener("pointerdown", kickoff);
      window.removeEventListener("keydown", kickoff);
    };
  }, []);

  useEffect(() => {
    setName((current) => (current.trim().length === 0 ? defaultName : current));
  }, [defaultName]);

  const connect = async () => {
    if (!hasEvmWallet()) {
      setNotice("No EVM wallet found in this browser. Install MetaMask to link an address to your run.");
      return;
    }
    try {
      const address = await connectEvmWallet();
      if (address) {
        onWallet(address);
        setNotice("Wallet connected on Sepolia. Your run will be linked to this address.");
      }
    } catch {
      setNotice("Wallet connection failed.");
    }
  };

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-[#0d0c16] px-4 py-10" style={VN}>
      <div className="mx-auto flex w-full max-w-[620px] flex-col items-center">
        <div className="text-center">
          <h1 className="text-[26px] leading-tight text-[#ffd977]" style={PIXEL}>
            SQUEEK LIFE
          </h1>
          <p className="mt-3 text-[11px] tracking-widest text-[#ff8ab8]" style={PIXEL}>
            FROM RAGS TO RICHES
          </p>
        </div>

        <p className="mt-5 max-w-[470px] text-center text-[13px] leading-relaxed text-[#9f98c4]">
          One broke rat, three districts and a whole city to grind through. Scavenge trash, take jobs, upgrade your look —
          then talk your way past the golden gate.
        </p>

        <div className={`${panelClass} mt-6 w-full px-5 py-5`}>
          <StagePreview />
          <p className="mt-1 text-center text-[11px] text-[#5f5880]">
            Everything you buy changes how Squeek looks.
          </p>

          <label className="mt-5 block text-[11px] text-[#8f88b5]">
            Character name
            <input
              value={name}
              maxLength={16}
              onChange={(event) => setName(event.target.value)}
              placeholder="Squeek"
              className="mt-1.5 w-full rounded-md border-2 border-[#37305a] bg-[#191527] px-3 py-2 text-[13px] text-[#f2f0fa] outline-none placeholder:text-[#5f5880] focus:border-[#ff2882]"
              style={VN}
            />
          </label>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className={`${btnGold} flex-1`}
              onClick={() => onStart(name.trim() || "Squeek", "new")}
              style={VN}
            >
              <Gamepad2 size={14} /> New game
            </button>
            {existing && (
              <button
                type="button"
                className={`${btnPrimary} flex-1`}
                onClick={() => onStart(name.trim() || "Squeek", "continue")}
                style={VN}
              >
                <Save size={14} /> Continue · Ch.{existing.chapter} · {existing.coins.toLocaleString("en-US")} Coins
              </button>
            )}
          </div>

          {loading && <p className="mt-3 text-center text-[11px] text-[#5f5880]">Checking saved progress…</p>}

          <div className="mt-4 flex items-center justify-between rounded-md border-2 border-[#241f33] bg-[#191527] px-3 py-2">
            <span className="text-[11px] text-[#8f88b5]">
              {wallet
                ? `Wallet: ${wallet.slice(0, 6)}…${wallet.slice(-4)} (Sepolia) · linked to your run`
                : "EVM wallet (optional) — links your run + onchain stats"}
            </span>
            <button type="button" className={btnGhost} onClick={connect} style={VN}>
              <Wallet size={12} /> {wallet ? "Switch wallet" : "Connect wallet"}
            </button>
          </div>

          {notice && (
            <p className="mt-3 rounded-md border-2 border-[#37305a] bg-[#191527] px-3 py-2 text-[11px] text-[#cfc9e8]" style={VN}>
              {notice}
            </p>
          )}
        </div>

        <button type="button" className={`${btnGhost} mt-5`} onClick={() => setShareOpen(true)} style={VN}>
          <Send size={12} /> Share this game on X
        </button>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className={chipClass}>
            <Gamepad2 size={11} className="text-[#8fe8b0]" />
            <span className="text-[10px] text-[#8f88b5]">WASD + E · touch controls included</span>
          </span>
          <span className={chipClass}>
            <Coins size={11} className="text-[#ffd977]" />
            <span className="text-[10px] text-[#8f88b5]">About 20–30 minutes to beat</span>
          </span>
          <span className={chipClass}>
            <Radio size={11} className="text-[#7fe8ff]" />
            <span className="text-[10px] text-[#8f88b5]">Live data from api.squeekchain.com</span>
          </span>
          <span className={chipClass}>
            <Crown size={11} className="text-[#ff8ab8]" />
            <span className="text-[10px] text-[#8f88b5]">Progress saves automatically</span>
          </span>
        </div>

        <p className="mt-6 max-w-[470px] text-center text-[10px] leading-relaxed text-[#5f5880]">
          Coins are in-game points, not SQK tokens. Connecting a wallet only links your address to your progress and
          achievements — the game never asks you to sign or pay.
        </p>
      </div>

      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} />}
    </div>
  );
}
