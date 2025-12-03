import { network } from "hardhat";

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
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
