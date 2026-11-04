import { Zap } from "lucide-react";
import type { Modal } from "@/game/engine";
import { ENERGY_MAX, formatCoins, jobById } from "@/game/data";
import { PIXEL, VN, btnGhost, btnPrimary, panelClass } from "./ui";

const QUALITY_TEXT: Record<string, { label: string; color: string }> = {
  perfect: { label: "PERFECT ×1.5", color: "text-[#8fe8b0]" },
  good: { label: "GOOD ×1", color: "text-[#ffd977]" },
  miss: { label: "MISSED ×0.5", color: "text-[#ffb3b3]" },
};

export function WorkModal({
  modal,
  energy,
  onBegin,
  onStop,
  onAgain,
  onClose,
}: {
  modal: Extract<Modal, { type: "work" }>;
  energy: number;
  onBegin: () => void;
  onStop: () => void;
  onAgain: () => void;
  onClose: () => void;
}) {
  const job = jobById(modal.job);
  const enough = energy >= job.energy;
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-4">
      <div className={`${panelClass} animate-in fade-in zoom-in-95 w-full max-w-[460px] duration-200`}>
        <div className="border-b-2 border-[#37305a] px-4 py-3">
          <h3 className="text-[14px] font-bold text-[#f2f0fa]" style={VN}>
            {job.name}
          </h3>
          <p className="mt-1 text-[11px] text-[#9f98c4]" style={VN}>
            {job.blurb}
          </p>
        </div>

        <div className="flex items-center justify-between px-4 py-3 text-[11px]" style={VN}>
          <span className="text-[#ffd977]">Base pay: {formatCoins(job.reward)} Coins</span>
          <span className="flex items-center gap-1 text-[#8f88b5]">
            <Zap size={12} className="text-[#8fe8b0]" /> −{job.energy} EN · {Math.floor(energy)}/{ENERGY_MAX} left
          </span>
        </div>

        {modal.phase === "intro" && (
          <div className="px-4 pb-2">
            <p className="text-[11px] leading-relaxed text-[#cfc9e8]" style={VN}>
              Stop the marker in the green zone for ×1.5, the yellow for ×1, and outside for ×0.5.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className={btnGhost} onClick={onClose} style={VN}>
                Later
              </button>
              <button type="button" className={btnPrimary} disabled={!enough} onClick={onBegin} style={VN}>
                {enough ? "Start (Space)" : "Out of energy"}
              </button>
            </div>
          </div>
        )}

        {(modal.phase === "sweep" || modal.phase === "result") && (
          <div className="px-4 pb-4">
            <div className="relative mt-2 h-7 w-full overflow-hidden rounded border-2 border-[#37305a] bg-[#241f33]">
              <div className="absolute inset-y-0 left-[30%] w-[13%] bg-[#8a6d2a]/60" />
              <div className="absolute inset-y-0 left-[43%] w-[14%] bg-[#2fa85c]/70" />
              <div className="absolute inset-y-0 left-[57%] w-[13%] bg-[#8a6d2a]/60" />
              {modal.phase === "sweep" && (
                <div
                  className="absolute inset-y-0 w-[3px] bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                  style={{ left: `${Math.round(modal.marker * 100)}%` }}
                />
              )}
              {modal.phase === "result" && modal.quality && (
                <div className="absolute inset-y-0 w-[3px] bg-[#ff2882]" style={{ left: `${Math.round(modal.marker * 100)}%` }} />
              )}
            </div>

            {modal.phase === "sweep" ? (
              <div className="mt-4 flex justify-end">
                <button type="button" className={btnPrimary} onClick={onStop} style={VN}>
                  STOP! (Space)
                </button>
              </div>
            ) : (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold" style={PIXEL}>
                    <span className={modal.quality ? QUALITY_TEXT[modal.quality].color : ""}>
                      {modal.quality ? QUALITY_TEXT[modal.quality].label : ""}
                    </span>
                  </span>
                  <span className="text-[13px] text-[#ffd977]" style={PIXEL}>
                    +{formatCoins(modal.reward)}
                  </span>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button type="button" className={btnGhost} onClick={onClose} style={VN}>
                    Close
                  </button>
                  <button type="button" className={btnPrimary} disabled={!enough} onClick={onAgain} style={VN}>
                    {enough ? "Work again" : "Out of energy"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
