import { useState } from "react";
import { Check, Crown, Lock, Send, X } from "lucide-react";
import type { Modal } from "@/game/engine";
import { formatCoins, formatDuration } from "@/game/data";
import { PIXEL, VN, btnGhost, btnGold, btnPrimary, panelClass } from "./ui";
import { ShareModal } from "./ShareModal";

export function DialogModal({
  modal,
  onNext,
  onClose,
}: {
  modal: Extract<Modal, { type: "dialog" }>;
  onNext: () => void;
  onClose: () => void;
}) {
  const isLast = modal.index + 1 >= modal.lines.length;
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center p-4">
      <div className={`${panelClass} animate-in fade-in slide-in-from-bottom-4 w-full max-w-[560px] duration-200`}>
        <div className="flex items-center justify-between border-b-2 border-[#37305a] px-4 py-2">
          <span className="text-[12px] font-bold text-[#ffa8cb]" style={VN}>
            {modal.speaker}
          </span>
          <button type="button" onClick={onClose} className="rounded border-2 border-[#37305a] p-1 text-[#9f98c4] hover:bg-[#241f3d]">
            <X size={13} />
          </button>
        </div>
        <div className="px-4 py-4">
          <p className="min-h-[42px] text-[13px] leading-relaxed text-[#e8e5f6]" style={VN}>
            {modal.lines[modal.index]}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] text-[#5f5880]" style={VN}>
              {modal.index + 1}/{modal.lines.length}
            </span>
            <button type="button" className={btnPrimary} onClick={onNext} style={VN}>
              {isLast ? "Done" : "Continue ▸"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GateModal({
  modal,
  onTryOpen,
  onClose,
}: {
  modal: Extract<Modal, { type: "gate" }>;
  onTryOpen: () => void;
  onClose: () => void;
}) {
  const ready = modal.checks.every((check) => check.ok);
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-4">
      <div className={`${panelClass} animate-in fade-in zoom-in-95 w-full max-w-[420px] duration-200`}>
        <div className="border-b-2 border-[#37305a] px-4 py-3">
          <h3 className="text-[13px] font-bold text-[#ffd977]" style={PIXEL}>
            RICH DISTRICT
          </h3>
          <p className="mt-1.5 text-[11px] text-[#9f98c4]" style={VN}>
            The guard only opens this gate for real assets.
          </p>
        </div>
        <div className="grid gap-2 px-4 py-4">
          {modal.checks.map((check) => (
            <div
              key={check.label}
              className={`flex items-center gap-2 rounded-md border-2 px-3 py-2 text-[12px] ${
                check.ok ? "border-[#2fa85c] bg-[#2fa85c]/10 text-[#8fe8b0]" : "border-[#37305a] bg-[#191527] text-[#9f98c4]"
              }`}
              style={VN}
            >
              {check.ok ? <Check size={14} /> : <Lock size={14} />}
              {check.label}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t-2 border-[#37305a] px-4 py-3">
          <span className="text-[11px] text-[#8f88b5]" style={VN}>
            {modal.open ? "The gate is open." : ready ? "Requirements met." : "Not eligible yet."}
          </span>
          <div className="flex gap-2">
            <button type="button" className={btnGhost} onClick={onClose} style={VN}>
              Close
            </button>
            {!modal.open && (
              <button type="button" className={btnGold} disabled={!ready} onClick={onTryOpen} style={VN}>
                Push the gate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WinScreen({
  modal,
  onContinue,
  onLeaderboard,
}: {
  modal: Extract<Modal, { type: "win" }>;
  onContinue: () => void;
  onLeaderboard: () => void;
}) {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <div className={`${panelClass} animate-in fade-in zoom-in-95 w-full max-w-[520px] border-[#e8b23a] duration-300`}>
        <div className="flex flex-col items-center border-b-2 border-[#37305a] px-6 py-6 text-center">
          <Crown size={30} className="text-[#ffd977]" />
          <h2 className="mt-3 text-[16px] text-[#ffd977]" style={PIXEL}>
            SELF-MADE SQUEEK
          </h2>
          <p className="mt-2 text-[12px] text-[#cfc9e8]" style={VN}>
            From the trash piles of the slums to the richest street in the city. You made it.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 px-6 py-5">
          {[
            { label: "Coins earned", value: formatCoins(modal.coinsEarned) },
            { label: "Shifts worked", value: `${modal.works}` },
            { label: "Time played", value: formatDuration(modal.playedSec) },
            { label: "Achievements", value: `${modal.achievements}` },
          ].map((stat) => (
            <div key={stat.label} className="rounded-md border-2 border-[#241f33] bg-[#191527] px-3 py-2">
              <div className="text-[10px] text-[#8f88b5]" style={VN}>
                {stat.label}
              </div>
              <div className="mt-1 text-[13px] text-[#f2f0fa]" style={PIXEL}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t-2 border-[#37305a] px-6 py-4">
          <span className="text-[11px] text-[#8f88b5]" style={VN}>
            Progress saved. Connect a Sepolia wallet to link it to your address.
          </span>
          <div className="flex gap-2">
            <button type="button" className={btnGhost} onClick={() => setShareOpen(true)} style={VN}>
              <Send size={12} /> Share
            </button>
            <button type="button" className={btnGhost} onClick={onLeaderboard} style={VN}>
              Leaderboard
            </button>
            <button type="button" className={btnGold} onClick={onContinue} style={VN}>
              Keep playing
            </button>
          </div>
        </div>
      </div>

      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} />}
    </div>
  );
}
