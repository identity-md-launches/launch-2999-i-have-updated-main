import { useCallback, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/700.css";
import "@fontsource/be-vietnam-pro/800.css";
import "@fontsource/press-start-2p/400.css";
import { StartScreen } from "@/components/game/StartScreen";
import { GameShell, type Session } from "@/components/game/GameShell";
import { loadProgress } from "@/lib/progress";
import { applyBranding } from "@/lib/branding";
import type { SaveData } from "@/game/engine";

interface ExistingRun {
  key: string;
  name: string;
  wallet: string | null;
  save: SaveData | null;
  coins: number;
  chapter: number;
  won: boolean;
}

export default function App() {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } }));
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [existing, setExisting] = useState<ExistingRun | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);

  const refreshExisting = useCallback(async () => {
    const key = localStorage.getItem("squeek.key");
    const storedName = localStorage.getItem("squeek.name") ?? "";
    const storedWallet = localStorage.getItem("squeek.wallet");
    setWallet(storedWallet);
    if (!key) {
      setExisting(null);
      setLoading(false);
      return;
    }
    const result = await loadProgress(key);
    if (result?.player) {
      setExisting({
        key,
        name: result.player.name || storedName || "Squeek",
        wallet: result.player.wallet ?? storedWallet,
        save: result.player.state ?? null,
        coins: result.player.coins ?? 0,
        chapter: result.player.chapter ?? 1,
        won: Boolean(result.player.won),
      });
      if (result.player.wallet) {
        setWallet(result.player.wallet);
        localStorage.setItem("squeek.wallet", result.player.wallet);
      }
    } else {
      setExisting(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    applyBranding();
    setMounted(true);
    void refreshExisting();
  }, [refreshExisting]);

  const start = (name: string, mode: "new" | "continue") => {
    localStorage.setItem("squeek.name", name);
    if (mode === "continue" && existing) {
      setSession({ playerKey: existing.key, name, wallet: existing.wallet ?? wallet, save: existing.save });
      return;
    }
    const key =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `sq-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("squeek.key", key);
    setExisting(null);
    setSession({ playerKey: key, name, wallet: localStorage.getItem("squeek.wallet"), save: null });
  };

  const exit = () => {
    setSession(null);
    setLoading(true);
    void refreshExisting();
  };

  const handleWallet = (address: string | null) => {
    if (!address) return;
    setWallet(address);
    localStorage.setItem("squeek.wallet", address);
  };

  if (!mounted) {
    return <div className="min-h-screen bg-[#0d0c16]" />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {session ? (
        <GameShell
          key={`${session.playerKey}-${session.save ? "continue" : "fresh"}`}
          session={session}
          onExit={exit}
        />
      ) : (
        <StartScreen
          loading={loading}
          existing={existing}
          defaultName={existing?.name ?? localStorage.getItem("squeek.name") ?? ""}
          wallet={existing?.wallet ?? wallet}
          onStart={start}
          onWallet={handleWallet}
        />
      )}
    </QueryClientProvider>
  );
}
