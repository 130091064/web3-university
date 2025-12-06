import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const { viem } = await network.connect();

  // 1. 读取现有 deployments/sepolia.json，拿到之前部署好的 YDToken 地址
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  const deploymentsPath = path.join(deploymentsDir, "sepolia.json");

  if (!fs.existsSync(deploymentsPath)) {
    throw new Error(
      "deployments/sepolia.json 不存在，请先运行完整部署脚本部署 YDToken"
    );
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8")) as {
    ydToken: `0x${string}`;
    courseMarketplace?: `0x${string}`;
  };

  const ydTokenAddress = deployments.ydToken;
  console.log("Using existing YDToken:", ydTokenAddress);

  // 2. 只重新部署 CourseMarketplace（构造参数仍然是 YDToken 地址）
  const courseMarketplace = await viem.deployContract("CourseMarketplace", [
    ydTokenAddress,
  ]);

  console.log("New CourseMarketplace deployed to:", courseMarketplace.address);

  // 3. 更新 deployments/sepolia.json 中的 courseMarketplace 地址（保留原 ydToken）
  const newDeployments = {
    ...deployments,
    courseMarketplace: courseMarketplace.address as `0x${string}`,
  };

  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    deploymentsPath,
    JSON.stringify(newDeployments, null, 2),
    "utf-8"
  );

  console.log(`\nUpdated deployments: ${deploymentsPath}`);
  console.log(newDeployments);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
