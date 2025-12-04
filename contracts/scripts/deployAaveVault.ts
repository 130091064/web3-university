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

  const UNDERLYING = process.env.AAVE_UNDERLYING as `0x${string}`;
  const ATOKEN = process.env.AAVE_ATOKEN as `0x${string}`;
  const POOL = process.env.AAVE_POOL as `0x${string}`;

  if (!UNDERLYING || !ATOKEN || !POOL) {
    throw new Error(
      "请在 .env 中配置 AAVE_UNDERLYING, AAVE_ATOKEN, AAVE_POOL"
    );
  }

  console.log("UNDERLYING:", UNDERLYING);
  console.log("ATOKEN:", ATOKEN);
  console.log("POOL:", POOL);

  // 部署 AaveVault 合约
  const vault = await viem.deployContract("AaveVault", [
    UNDERLYING,
    ATOKEN,
    POOL,
  ]);

  console.log("AaveVault deployed to:", vault.address);

  // 写入 deployments/sepolia.json，复用你之前的结构
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const file = path.join(deploymentsDir, 'sepolia.json');

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
