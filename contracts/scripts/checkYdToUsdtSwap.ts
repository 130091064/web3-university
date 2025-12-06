// scripts/checkYdToUsdtSwap.ts
import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { formatUnits } from "viem";
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
  console.log("👉 读取的 sepolia.json 路径:", deploymentsPath);

  const deploymentsRaw = fs.readFileSync(deploymentsPath, "utf-8");
  console.log("👉 sepolia.json 原始内容:", deploymentsRaw);

  const deployments = JSON.parse(deploymentsRaw) as {
    ydToken: `0x${string}`;
    mockUsdt: `0x${string}`;
    ydUsdtSwap: `0x${string}`;
  };

  const YD_TOKEN_JSON = deployments.ydToken;
  const USDT_TOKEN_JSON = deployments.mockUsdt;
  const SWAP = deployments.ydUsdtSwap;

  console.log("YD_TOKEN (from json)   =", YD_TOKEN_JSON);
  console.log("USDT_TOKEN (from json) =", USDT_TOKEN_JSON);
  console.log("SWAP                   =", SWAP);
  console.log("------------");

  // 3. 合约实例（先用 json 里的地址连上）
  const ydTokenByJson = await viem.getContractAt("YDToken", YD_TOKEN_JSON, {
    client: { public: publicClient, wallet: walletClient },
  });
  const usdtByJson = await viem.getContractAt("MockUSDT", USDT_TOKEN_JSON, {
    client: { public: publicClient, wallet: walletClient },
  });
  const swap = await viem.getContractAt("YdToUsdtSwap", SWAP, {
    client: { public: publicClient, wallet: walletClient },
  });

  // 4. 读取 Swap 合约内部记录的 token 地址
  const [ydAddrInSwap, usdtAddrInSwap] = await Promise.all([
    swap.read.ydToken(),
    swap.read.usdtToken(),
  ]);

  console.log("🧩 Swap 合约内部记录的 ydToken 地址 =", ydAddrInSwap);
  console.log("🧩 Swap 合约内部记录的 usdtToken 地址 =", usdtAddrInSwap);
  console.log("------------");

  // 5. 分别按两种地址，查看 Swap 的 USDT 库存

  // 5.1 用 json 里的 USDT 地址看余额
  const usdtBalanceByJson = await usdtByJson.read.balanceOf([SWAP]);

  // 5.2 用 Swap 合约内部的 usdtToken 地址，重新连一个合约看余额
  const usdtBySwap = await viem.getContractAt("MockUSDT", usdtAddrInSwap, {
    client: { public: publicClient },
  });
  const usdtBalanceBySwap = await usdtBySwap.read.balanceOf([SWAP]);

  // 6. 你钱包的 YD / 授权
  const [ydBalance, ydAllowance] = await Promise.all([
    ydTokenByJson.read.balanceOf([user]),
    ydTokenByJson.read.allowance([user, SWAP]),
  ]);

  console.log("➡️  你钱包 YD 余额:", formatUnits(ydBalance, 18), "YD");
  console.log("➡️  你钱包给 Swap 授权的 YD 数量:", formatUnits(ydAllowance, 18), "YD");

  console.log("➡️  按 sepolia.json 里的 USDT 地址统计的库存:", formatUnits(usdtBalanceByJson, 6), "USDT");
  console.log("➡️  按 Swap 合约内部 usdtToken 地址统计的库存:", formatUnits(usdtBalanceBySwap, 6), "USDT");

  const rate = await swap.read.rateUsdtPerYd();
  console.log("➡️  当前汇率 rateUsdtPerYd:", rate.toString(), "(1e6 精度，例如 1000000 表示 1 USDT)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
