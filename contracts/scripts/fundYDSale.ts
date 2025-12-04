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
    `sepolia.json`
  );

  if (!fs.existsSync(deploymentsPath)) {
    throw new Error(`Deployments file not found: ${deploymentsPath}`);
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8")) as {
    ydToken: `0x${string}`;
    ydSale: `0x${string}`;
  };

  const YD_TOKEN_ADDRESS = deployments.ydToken;
  const YD_SALE_ADDRESS = deployments.ydSale;

  if (!YD_TOKEN_ADDRESS || !YD_SALE_ADDRESS) {
    throw new Error("ydToken or ydSale address missing in deployments");
  }

  const { getWalletClients, getContractAt } = viem;
  const [walletClient] = await getWalletClients();
  const from = walletClient.account.address;

  console.log("From account:", from);
  console.log("YDToken:", YD_TOKEN_ADDRESS);
  console.log("YDSale:", YD_SALE_ADDRESS);

  // 1. 连接 YDToken 合约
  const ydToken = await getContractAt("YDToken", YD_TOKEN_ADDRESS);

  // 2. 设定要转多少 YD 作为库存（比如 100000 YD）
  const amount = 100_000n * 10n ** 18n; // 100000 * 1e18

  console.log("Sending YD to sale contract:", amount.toString());

  const hash = await ydToken.write.transfer([YD_SALE_ADDRESS, amount]);
  console.log("transfer tx:", hash);

  const publicClient = await viem.getPublicClient();
  await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });

  console.log("Transfer confirmed. YDSale now has initial YD inventory.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
