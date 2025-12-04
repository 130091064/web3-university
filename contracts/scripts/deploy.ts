import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const { viem } = await network.connect();

  const initialSupply = 1_000_000n * 10n ** 18n; // 100 万 YD

  // 部署 YDToken 合约，构造函数参数是初始供应量
  const ydToken = await viem.deployContract("YDToken", [initialSupply]);

  console.log("YDToken deployed to:", ydToken.address);

  // 部署 CourseMarketplace 合约，构造函数参数是 YDToken 合约地址
  const courseMarketplace = await viem.deployContract("CourseMarketplace", [
    ydToken.address,
  ]);

  console.log("CourseMarketplace deployed to:", courseMarketplace.address);

  // 3. 写入 deployments/sepolia.json
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentsPath = path.join(deploymentsDir, 'sepolia.json');

  const data = {
    ydToken: ydToken.address as `0x${string}`,
    courseMarketplace: courseMarketplace.address as `0x${string}`,
  };

  fs.writeFileSync(deploymentsPath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`\nSaved deployments to: ${deploymentsPath}`);
  console.log(data);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
