import { network } from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // 0. 连接当前 network，拿到 viem 客户端（Hardhat 3 官方写法）
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  // 1. 读取部署信息
  const deploymentsPath = path.join(
    __dirname,
    "..",
    "deployments",
    "sepolia.json"
  );

  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8")) as {
    ydToken: `0x${string}`;
    courseMarketplace: `0x${string}`;
  };

  const YD_TOKEN_ADDRESS = deployments.ydToken;
  const MARKETPLACE_ADDRESS = deployments.courseMarketplace;

  console.log("YDToken:", YD_TOKEN_ADDRESS);
  console.log("CourseMarketplace:", MARKETPLACE_ADDRESS);

  // 2. 获取钱包（当前 network 的第一个账号）
  const [walletClient] = await viem.getWalletClients();
  const userAddress = walletClient.account.address;
  console.log("Using account:", userAddress);

  // 3. 连接合约实例（viem 风格）
  const ydToken = await viem.getContractAt("YDToken", YD_TOKEN_ADDRESS);
  const marketplace = await viem.getContractAt(
    "CourseMarketplace",
    MARKETPLACE_ADDRESS
  );

  // 4. 要购买的课程 ID
  const courseId = 1n;

  const course = await marketplace.read.getCourse([courseId]);
  console.log("Course info:", course);

  const price: bigint = course.price;
  console.log("Course price (YD smallest unit):", price.toString());

  // 5. 检查当前 YD 余额
  const balance = await ydToken.read.balanceOf([userAddress]);
  console.log("YD balance:", balance.toString());

  if (balance < price) {
    throw new Error("YD balance not enough to buy this course");
  }

  // 6. 检查 allowance
  const allowance = await ydToken.read.allowance([
    userAddress,
    MARKETPLACE_ADDRESS,
  ]);
  console.log("Current allowance:", allowance.toString());

  if (allowance < price) {
    console.log("Allowance not enough, sending approve...");

    const approveHash = await ydToken.write.approve([
      MARKETPLACE_ADDRESS,
      price,
    ]);
    console.log("Approve tx:", approveHash);

    await publicClient.waitForTransactionReceipt({
      hash: approveHash,
      confirmations: 1,
    });

    console.log("Approve confirmed.");
  } else {
    console.log("Allowance already sufficient, skip approve.");
  }

  // 7. 调用 buyCourse 购买课程
  console.log("Calling buyCourse...");
  const buyHash = await marketplace.write.buyCourse([courseId]);
  console.log("buyCourse tx:", buyHash);

  await publicClient.waitForTransactionReceipt({
    hash: buyHash,
    confirmations: 1,
  });

  console.log("buyCourse confirmed!");

  // 8. 验证 purchased 状态
  const purchased = await marketplace.read.hasPurchased([
    userAddress,
    courseId,
  ]);
  console.log("hasPurchased(user, courseId):", purchased);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
