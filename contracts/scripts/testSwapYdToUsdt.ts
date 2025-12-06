// scripts/testSwapYdToUsdt.ts
import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { parseUnits, formatUnits } from "viem";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("------------");

  // 1. 连接 viem
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [walletClient] = await viem.getWalletClients();
  const user = walletClient.account!.address;
  console.log("使用账号:", user);
  console.log("------------");

  // 2. 读取 deployments/sepolia.json
  const deploymentsPath = path.join(__dirname, "..", "deployments", "sepolia.json");
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8")) as {
    ydToken: `0x${string}`;
    mockUsdt: `0x${string}`;
    ydUsdtSwap: `0x${string}`;
  };

  const YD_TOKEN = deployments.ydToken;
  const USDT_TOKEN = deployments.mockUsdt;
  const SWAP = deployments.ydUsdtSwap;

  console.log("YD_TOKEN   =", YD_TOKEN);
  console.log("USDT_TOKEN =", USDT_TOKEN);
  console.log("SWAP       =", SWAP);
  console.log("------------");

  // 3. 合约实例（read+write 都要，所以绑定 public + wallet）
  const ydToken = await viem.getContractAt("YDToken", YD_TOKEN, {
    client: { public: publicClient, wallet: walletClient },
  });
  const usdtToken = await viem.getContractAt("MockUSDT", USDT_TOKEN, {
    client: { public: publicClient, wallet: walletClient },
  });
  const swap = await viem.getContractAt("YdToUsdtSwap", SWAP, {
    client: { public: publicClient, wallet: walletClient },
  });

  // 4. 目标兑换量：100 YD（18 位精度）
  const humanYd = "100";
  const ydAmount = parseUnits(humanYd, 18);

  // 5. 兑换前余额
  const [ydBefore, usdtBefore, allowanceBefore] = await Promise.all([
    ydToken.read.balanceOf([user]),
    usdtToken.read.balanceOf([user]),
    ydToken.read.allowance([user, SWAP]),
  ]);

  console.log("💰 兑换前余额：");
  console.log("   YD    =", formatUnits(ydBefore, 18));
  console.log("   USDT  =", formatUnits(usdtBefore, 6));
  console.log("   授权给 Swap 的 YD =", formatUnits(allowanceBefore, 18));

  // 6. 如果授权不足，先 approve 一下
  if (allowanceBefore < ydAmount) {
    console.log(`授权不足，准备 approve ${humanYd} YD 给 Swap...`);
    const approveHash = await ydToken.write.approve([SWAP, ydAmount]);
    console.log("approve txHash =", approveHash);

    // 等交易确认
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
    console.log("✅ approve 已确认");
  } else {
    console.log("授权已足够，跳过 approve");
  }

  // 7. 执行兑换
  console.log(`🚀 准备调用 swapYdForUsdt(${humanYd} YD)...`);
  const swapHash = await swap.write.swapYdForUsdt([ydAmount]);
  console.log("swap txHash =", swapHash);

  const swapReceipt = await publicClient.waitForTransactionReceipt({ hash: swapHash });
  console.log("swap 交易状态 =", swapReceipt.status); // "success" or "reverted"

  // 8. 兑换后余额
  const [ydAfter, usdtAfter] = await Promise.all([
    ydToken.read.balanceOf([user]),
    usdtToken.read.balanceOf([user]),
  ]);

  console.log("💰 兑换后余额：");
  console.log("   YD    =", formatUnits(ydAfter, 18));
  console.log("   USDT  =", formatUnits(usdtAfter, 6));
}

main().catch((err) => {
  console.error("❌ testSwap 过程中报错：", err);
  process.exit(1);
});
