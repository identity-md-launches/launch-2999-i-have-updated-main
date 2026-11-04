import { Bike, Briefcase, Car, Coffee, Gauge, Laptop, Scissors, Shirt, Smartphone, Utensils, X } from "lucide-react";
import type { ReactNode } from "react";
import type { Modal } from "@/game/engine";
import { CONSUMABLES, GEAR, formatCoins, type ItemId } from "@/game/data";
import { PIXEL, VN, btnGhost, btnGold, panelClass } from "./ui";

const GEAR_ICON: Record<ItemId, ReactNode> = {
  clothes: <Shirt size={18} className="text-[#7fb2ff]" />,
  old_phone: <Smartphone size={18} className="text-[#9f98c4]" />,
  bicycle: <Bike size={18} className="text-[#8fe8b0]" />,
  smartphone: <Smartphone size={18} className="text-[#7fe8ff]" />,
  motorbike: <Gauge size={18} className="text-[#ffd977]" />,
  laptop: <Laptop size={18} className="text-[#cfc9e8]" />,
  suit: <Briefcase size={18} className="text-[#ffa8cb]" />,
  car: <Car size={18} className="text-[#ff8ab8]" />,
};

export function ShopModal({
  modal,
  coins,
  items,
  onBuyGear,
  onBuyConsumable,
  onClose,
}: {
  modal: Extract<Modal, { type: "shop" }>;
  coins: number;
  items: ItemId[];
  onBuyGear: (id: ItemId) => void;
  onBuyConsumable: (id: string) => void;
  onClose: () => void;
}) {
  const gear = GEAR.filter((item) => item.shop === modal.shop);
  const discount = modal.discount ?? 0;
  const priceOf = (price: number) => Math.round(price * (1 - discount));
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-4">
      <div className={`${panelClass} animate-in fade-in zoom-in-95 w-full max-w-[540px] duration-200`}>
        <div className="flex items-start justify-between border-b-2 border-[#37305a] px-4 py-3">
          <div>
            <h3 className="text-[14px] font-bold text-[#f2f0fa]" style={VN}>
              {modal.title}
            </h3>
            <p className="mt-1 text-[11px] text-[#9f98c4]" style={VN}>
              {modal.keeper}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#ffd977]" style={PIXEL}>
              {formatCoins(coins)}
            </span>
            <button type="button" onClick={onClose} className="rounded border-2 border-[#37305a] p-1 text-[#9f98c4] hover:bg-[#241f3d]">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {CONSUMABLES.some((item) => item.shop === modal.shop) ? (
            <div className="grid gap-2">
              {CONSUMABLES.filter((item) => item.shop === modal.shop).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-md border-2 border-[#241f33] bg-[#191527] px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    {item.shop === "salon" ? (
                      <Scissors size={18} className="text-[#ffa8cb]" />
                    ) : item.id === "coffee" || item.id === "bubble_tea" ? (
                      <Coffee size={18} className="text-[#ffd977]" />
                    ) : (
                      <Utensils size={18} className="text-[#ff8ab8]" />
                    )}
                    <div>
                      <div className="text-[12px] font-semibold text-[#f2f0fa]" style={VN}>
                        {item.name}
                      </div>
                      <div className="text-[11px] text-[#8f88b5]" style={VN}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={btnGold}
                    disabled={coins < item.price}
                    onClick={() => onBuyConsumable(item.id)}
                    style={VN}
                  >
                    {formatCoins(item.price)}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-2">
              {gear.map((item) => {
                const owned = items.includes(item.id);
                const affordable = coins >= priceOf(item.price);
                return (
                  <div key={item.id} className="flex items-center justify-between rounded-md border-2 border-[#241f33] bg-[#191527] px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded border border-[#37305a] bg-[#241f33]">
                        {GEAR_ICON[item.id]}
                      </span>
                      <div>
                        <div className="text-[12px] font-semibold text-[#f2f0fa]" style={VN}>
                          {item.name}
                        </div>
                        <div className="text-[11px] text-[#8f88b5]" style={VN}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    {owned ? (
                      <span className="rounded border border-[#2fa85c] bg-[#2fa85c]/15 px-2 py-1 text-[11px] text-[#8fe8b0]" style={VN}>
                        Owned
                      </span>
                    ) : (
                      <button
                        type="button"
                        className={affordable ? btnGold : btnGhost}
                        onClick={() => onBuyGear(item.id)}
                        style={VN}
                        title={affordable ? "Buy" : "Not enough Coins yet"}
                      >
                        {affordable
                          ? discount > 0
                            ? `${formatCoins(priceOf(item.price))} (−${Math.round(discount * 100)}%)`
                            : formatCoins(item.price)
                          : `Need ${formatCoins(priceOf(item.price) - coins)}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t-2 border-[#37305a] px-4 py-3">
          <span className="text-[11px] text-[#8f88b5]" style={VN}>
            Everything you buy changes how Squeek looks.
          </span>
          <button type="button" className={btnGhost} onClick={onClose} style={VN}>
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
