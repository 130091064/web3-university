import { network } from "hardhat";

async function main() {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  const SWAP = "0x8c341d454a8b58af041f66c7fde8dba6c21fb0be" as const;

  const ydUsdtSwapAbi = [
    {
      type: "function",
      name: "ydToken",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "address" }],
    },
    {
      type: "function",
      name: "usdtToken",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "address" }],
    },
    {
      type: "function",
      name: "rateUsdtPerYd",
      stateMutability: "view",
      inputs: [],
      outputs: [{ name: "", type: "uint256" }],
    },
  ] as const;

  const ydToken = await publicClient.readContract({
    address: SWAP,
    abi: ydUsdtSwapAbi,
    functionName: "ydToken",
  });

  const usdtToken = await publicClient.readContract({
    address: SWAP,
    abi: ydUsdtSwapAbi,
    functionName: "usdtToken",
  });

  const rate = await publicClient.readContract({
    address: SWAP,
    abi: ydUsdtSwapAbi,
    functionName: "rateUsdtPerYd",
  });

  console.log("ydToken  :", ydToken);
  console.log("usdtToken:", usdtToken);
  console.log("rateUsdtPerYd:", rate.toString());
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
