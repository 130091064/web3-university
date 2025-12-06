import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const { viem } = await network.connect();

  const deploymentsPath = path.join(
    __dirname,
    "..",
    "deployments",
    "sepolia.json"
  );

  if (!fs.existsSync(deploymentsPath)) {
    throw new Error(`Deployments file not found: ${deploymentsPath}`);
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8")) as {
    ydToken: `0x${string}`;
    courseMarketplace?: `0x${string}`;
    aaveVault?: `0x${string}`;
    ydSale?: `0x${string}`;
    ydUsdtSwap?: `0x${string}`;
    mockUsdt?: `0x${string}`;
  };

  const YD_TOKEN_ADDRESS = deployments.ydToken;
  if (!YD_TOKEN_ADDRESS) {
    throw new Error("ydToken missing in deployments file");
  }

  // 这里的 USDT 地址要和 AaveVault 里的 UNDERLYING 一致
  // 你可以：
  //  1）如果之前在 deployments 里存过，就直接用；
  //  2）否则，从 .env 读取 UNDERLYING。
  const usdtAddress = deployments.mockUsdt;

  if (!usdtAddress) {
    throw new Error("USDT (UNDERLYING) address not found");
  }

  console.log("YDToken:", YD_TOKEN_ADDRESS);
  console.log("USDT (underlying):", usdtAddress);

  // 汇率：1 YD = 1 USDT（USDT 6 位精度）
  const rateUsdtPerYd = 1_000_000n; // 1e6

  const ydUsdtSwap = await viem.deployContract("YdToUsdtSwap", [
    YD_TOKEN_ADDRESS,
    usdtAddress,
    rateUsdtPerYd,
  ]);

  console.log("YdToUsdtSwap deployed to:", ydUsdtSwap.address);

  deployments.ydUsdtSwap = ydUsdtSwap.address as `0x${string}`;

  fs.writeFileSync(
    deploymentsPath,
    JSON.stringify(deployments, null, 2),
    "utf-8"
  );
  console.log("Updated deployments file:", deploymentsPath);
  console.log(deployments);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
