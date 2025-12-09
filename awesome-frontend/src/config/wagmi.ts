import { createConfig, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

const VITE_INFURA_SEPOLIA_URL =
	(process.env.VITE_INFURA_SEPOLIA_URL as string) || "";

export const config = createConfig({
	chains: [sepolia, mainnet],
	connectors: [
		injected({
			target: "metaMask",
		}),
	],
	transports: {
		[sepolia.id]: http(VITE_INFURA_SEPOLIA_URL),
		[mainnet.id]: http(), // ENS 查询走主网
	},
});
