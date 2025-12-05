import { network } from 'hardhat';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Aave 使用的精度
const RAY = 10n ** 27n;

async function main() {
  // 1. 连接 viem（跟你之前 YD 脚本风格一致）
  const { viem } = await network.connect();
  const [walletClient] = await viem.getWalletClients();
  const deployer = walletClient.account.address;

  console.log('Deployer:', deployer);

  // 2. 部署 MockUSDT
  console.log('Deploying MockUSDT...');
  const mockUsdt = await viem.deployContract('MockUSDT', []);
  console.log('MockUSDT deployed at:', mockUsdt.address);

  // 3. 设置固定年化利率 5%（RAY 精度）
  const fivePercentRay = (RAY * 5n) / 100n;
  console.log('LiquidityRate (5%) in RAY:', fivePercentRay.toString());

  // 4. 部署 AaveVault（asset + rate）
  console.log('Deploying AaveVault...');
  const aaveVault = await viem.deployContract('AaveVault', [mockUsdt.address, fivePercentRay]);
  console.log('AaveVault deployed at:', aaveVault.address);

  // 5. 更新 deployments/sepolia.json
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // 你这边网络名就固定 sepolia
  const networkName = 'sepolia';
  const filePath = path.join(deploymentsDir, `${networkName}.json`);

  // 读取旧的 JSON，保留 ydToken / courseMarketplace / ydSale / ydUsdtSwap 等字段
  let data: any = {};
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      data = JSON.parse(raw);
    } catch (e) {
      console.warn('⚠️  旧的 deployments JSON 解析失败，将重建:', e);
    }
  }

  // 更新 / 新增字段
  data.mockUsdt = mockUsdt.address; // 新增 mockUsdt
  data.aaveVault = aaveVault.address; // 覆盖 aavevault

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log('✅ Deployments saved to:', filePath);
  console.log(data);
}

main().catch((err) => {
  console.error('❌ Deploy failed:', err);
  process.exit(1);
});
