import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const { viem } = await network.connect();

  // 1. 从环境变量读取 MockUSDT 地址 + 初始利率
  const UNDERLYING = process.env.AAVE_UNDERLYING as `0x${string}`;
  const RATE_RAY_STR =
    process.env.AAVE_LIQUIDITY_RATE_RAY ?? "50000000000000000000000000"; // 默认 5%

  if (!UNDERLYING) {
    throw new Error("请在 .env 中配置 AAVE_UNDERLYING=MockUSDT地址");
  }

  const INITIAL_RATE_RAY = BigInt(RATE_RAY_STR);

  console.log("UNDERLYING (MockUSDT):", UNDERLYING);
  console.log("INITIAL_RATE_RAY:", INITIAL_RATE_RAY.toString());

  // 2. 部署 AaveVault 合约（注意这里只有两个参数）
  const vault = await viem.deployContract("AaveVault", [
    UNDERLYING,
    INITIAL_RATE_RAY,
  ]);

  console.log("AaveVault deployed to:", vault.address);

  // 3. 更新 deployments/sepolia.json
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const file = path.join(deploymentsDir, "sepolia.json");

  let data: any = {};
  if (fs.existsSync(file)) {
    data = JSON.parse(fs.readFileSync(file, "utf-8"));
  }

  data.aaveVault = vault.address;

  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
  console.log("Updated deployments file:", file);
  console.log(data);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
