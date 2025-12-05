import { network } from 'hardhat';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USDT_DECIMALS = 6n;

async function main() {
  const { viem } = await network.connect();
  const [walletClient] = await viem.getWalletClients();
  const publicClient = await viem.getPublicClient();

  const user = walletClient.account.address;
  console.log('User (script account):', user);

  // 1. 读取部署信息
  const deploymentsPath = path.join(__dirname, '..', 'deployments', 'sepolia.json');
  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, 'utf-8')) as {
    mockUsdt: `0x${string}`;
    aaveVault: `0x${string}`;
  };

  const mockUsdtAddress = deployments.mockUsdt;
  const aaveVaultAddress = deployments.aaveVault;

  console.log('MockUSDT:', mockUsdtAddress);
  console.log('AaveVault:', aaveVaultAddress);

  // 2. 连接合约
  const mockUsdt = await viem.getContractAt('MockUSDT', mockUsdtAddress);
  const aaveVault = await viem.getContractAt('AaveVault', aaveVaultAddress);

  // 2.1 打印 owner，确认 mint 权限
  const mockUsdtOwner = await mockUsdt.read.owner();
  console.log('MockUSDT owner:', mockUsdtOwner);
  if (mockUsdtOwner.toLowerCase() !== user.toLowerCase()) {
    console.log('⚠️ 当前脚本账号不是 MockUSDT 的 owner，mint 会失败，请确认 sepolia 使用的私钥和部署脚本一致。');
  }

  // 3. mint mUSDT
  const amountToMint = 1_000n * 10n ** USDT_DECIMALS; // 1000 mUSDT
  console.log('\n=== Mint mUSDT ===');
  await mockUsdt.write.mint([user, amountToMint]);

  let userBalance = await mockUsdt.read.balanceOf([user]);
  console.log('User mUSDT balance after mint:', userBalance.toString());

  // 4. approve
  console.log('\n=== Approve Vault ===');
  await mockUsdt.write.approve([aaveVaultAddress, amountToMint]);

  const allowance = await mockUsdt.read.allowance([user, aaveVaultAddress]);
  console.log('Allowance to Vault:', allowance.toString());

  // 5. 检查余额 & 授权是否足够
  const depositAmount = 500n * 10n ** USDT_DECIMALS; // 存 500 mUSDT
  console.log('\n准备存入:', depositAmount.toString(), 'mUSDT');

  if (userBalance < depositAmount) {
    throw new Error(`❌ 用户余额不足，当前余额: ${userBalance.toString()}，需要: ${depositAmount.toString()}`);
  }
  if (allowance < depositAmount) {
    throw new Error(`❌ 授权额度不足，当前额度: ${allowance.toString()}，需要: ${depositAmount.toString()}`);
  }

  // 6. 存入 Vault
  console.log('\n=== Deposit to Vault ===');
  await aaveVault.write.deposit([depositAmount]);

  const afterDepositUserToken = await mockUsdt.read.balanceOf([user]);
  const balanceInVault1 = await aaveVault.read.balanceOf([user]);
  const index1 = await aaveVault.read.getCurrentIndex();

  console.log('User mUSDT balance after deposit:', afterDepositUserToken.toString());
  console.log('User balance in Vault (after deposit):', balanceInVault1.toString());
  console.log('Current index:', index1.toString());

  // 7. 等一会儿
  console.log('\n⏳ Waiting 20 seconds to accrue interest...');
  await new Promise((resolve) => setTimeout(resolve, 20_000));

  const balanceInVault2 = await aaveVault.read.balanceOf([user]);
  const index2 = await aaveVault.read.getCurrentIndex();

  console.log('\n=== After 20s ===');
  console.log('User balance in Vault:', balanceInVault2.toString());
  console.log('Index before:', index1.toString());
  console.log('Index after :', index2.toString());

  // 7. 在 withdraw 之前，给 Vault 喂一大笔“利息”（保证余额绝对充足）
  console.log('\n=== Feed interest to Vault ===');
  const bigInterest = 1_000_000_000_000n; // 随便给一大笔，演示用
  await mockUsdt.write.mint([aaveVaultAddress, bigInterest]);
  const vaultBalanceAfterMint = await mockUsdt.read.balanceOf([aaveVaultAddress]);
  console.log('Vault mUSDT balance after feeding interest:', vaultBalanceAfterMint.toString());

  // 8. 只提回我们当初存入的那 500 mUSDT
  console.log('\n=== Withdraw depositAmount (500 mUSDT) ===');
  await aaveVault.write.withdraw([depositAmount]);

  const finalUserToken = await mockUsdt.read.balanceOf([user]);
  const finalVaultBalance = await aaveVault.read.balanceOf([user]);
  const finalUserVaultBalance = await aaveVault.read.balanceOf([user]);

  console.log('User mUSDT after withdraw:', finalUserToken.toString());
  console.log('User balance in Vault after withdraw:', finalUserVaultBalance.toString());
  console.log('Vault mUSDT balance after withdraw:', finalVaultBalance.toString());

  console.log('\n✅ Flow finished.');
}

main().catch((err) => {
  console.error('❌ Test flow failed:', err);
  process.exit(1);
});
