import { createConfig, http } from "wagmi";
import { sepolia, mainnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const config = createConfig({
  chains: [sepolia, mainnet],
  connectors: [
    injected({
      target: "metaMask",
    }),
  ],
  transports: {
    [sepolia.id]: http(import.meta.env.VITE_INFURA_SEPOLIA_URL),
    [mainnet.id]: http(), // ENS 查询走主网
  },
});
