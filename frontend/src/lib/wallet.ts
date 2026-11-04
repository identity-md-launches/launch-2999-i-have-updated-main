// EVM wallet helpers — Ethereum Sepolia (chainId 0xaa36a7 / 11155111).
const SEPOLIA_HEX = "0xaa36a7";

export const hasEvmWallet = () => typeof window !== "undefined" && Boolean((window as any)?.ethereum?.request);

export async function connectEvmWallet(): Promise<string | null> {
  const eth = (window as any)?.ethereum;
  if (!eth?.request) throw new Error("no_wallet");
  const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
  const address = accounts?.[0] ?? null;
  if (!address) return null;
  try {
    const chainId: string = await eth.request({ method: "eth_chainId" });
    if (chainId !== SEPOLIA_HEX) {
      try {
        await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: SEPOLIA_HEX }] });
      } catch (error: any) {
        if (error?.code === 4902) {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: SEPOLIA_HEX,
                chainName: "Sepolia",
                nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: ["https://rpc.sepolia.org"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
        }
      }
    }
  } catch {
    // Switching networks is optional — the game works on any chain.
  }
  return address;
}
