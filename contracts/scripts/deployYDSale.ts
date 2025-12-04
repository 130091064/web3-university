import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const { viem } = await network.connect();

  // 1. 从 deployments/sepolia.json 里读出 YDToken 地址
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
  };

  const YD_TOKEN_ADDRESS = deployments.ydToken;
  if (!YD_TOKEN_ADDRESS) {
    throw new Error("ydToken address not found in deployments file");
  }

  console.log("YDToken:", YD_TOKEN_ADDRESS);

  // 2. 设置汇率：1 ETH = 1000 YD（你可以按需调整）
  const rate = 1000n * 10n ** 18n; // 1000 * 1e18

  // 3. 部署 YDSale
  const ydSale = await viem.deployContract("YDSale", [YD_TOKEN_ADDRESS, rate]);

  console.log("YDSale deployed to:", ydSale.address);

  // 4. 写回 deployments 文件
  deployments.ydSale = ydSale.address;

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
