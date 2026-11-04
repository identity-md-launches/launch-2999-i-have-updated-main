// Shared pixel-retro UI tokens.
export const PIXEL = { fontFamily: "'Press Start 2P', monospace" } as const;
export const VN = { fontFamily: "'Be Vietnam Pro', system-ui, sans-serif" } as const;

export const panelClass =
  "rounded-lg border-2 border-[#37305a] bg-[#141221]/95 shadow-[0_16px_50px_rgba(0,0,0,0.65)] backdrop-blur-sm";

const btnBase =
  "inline-flex items-center justify-center gap-1.5 rounded-md border-2 px-3 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

export const btnPrimary = `${btnBase} border-[#ff2882] bg-[#ff2882]/15 text-[#ffa8cb] hover:bg-[#ff2882]/30`;
export const btnGhost = `${btnBase} border-[#37305a] bg-[#1c1830] text-[#cfc9e8] hover:bg-[#272141]`;
export const btnGold = `${btnBase} border-[#e8b23a] bg-[#e8b23a]/15 text-[#ffd977] hover:bg-[#e8b23a]/25`;

export const chipClass = "inline-flex items-center gap-1.5 rounded border border-[#37305a] bg-[#1c1830] px-2 py-1";
