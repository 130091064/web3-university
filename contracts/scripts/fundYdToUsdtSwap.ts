import { network } from 'hardhat';
import { parseUnits } from 'viem';

async function main() {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [walletClient] = await viem.getWalletClients();
  const sender = walletClient.account.address;

  // 你的实际地址
  const MOCK_USDT = '0x29b5e915355cab3f29c8854f1b18777f6081ac59' as const;
  const SWAP = '0xd0cf265f17d0655800abe6dd33c43376ec5281e7' as const;

  console.log('Using account:', sender);
  console.log('MockUSDT:', MOCK_USDT);
  console.log('YdToUsdtSwap:', SWAP);

  // 只需要最小 ABI：mint / transfer / balanceOf
  const mockUsdtAbi = [
    {
      type: 'function',
      name: 'mint',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      outputs: [],
    },
    {
      type: 'function',
      name: 'transfer',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      outputs: [{ name: '', type: 'bool' }],
    },
    {
      type: 'function',
      name: 'balanceOf',
      stateMutability: 'view',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ name: '', type: 'uint256' }],
    },
  ] as const;

  // 1️⃣ 给你自己 mint 一些 MockUSDT，比如 100000 USDT
  const mintAmount = parseUnits('100000', 6); // 100000 * 1e6
  const mintTx = await walletClient.writeContract({
    address: MOCK_USDT,
    abi: mockUsdtAbi,
    functionName: 'mint',
    args: [sender, mintAmount],
  });
  console.log('Mint 100000 mUSDT to you, tx:', mintTx);

  await publicClient.waitForTransactionReceipt({
    hash: mintTx,
    confirmations: 1,
  });
  console.log('Mint confirmed.');

  // 2️⃣ 再把其中 50000 USDT 转到 Swap 合约当流动性
  const fundAmount = parseUnits('50000', 6); // 50000 * 1e6
  const fundTx = await walletClient.writeContract({
    address: MOCK_USDT,
    abi: mockUsdtAbi,
    functionName: 'transfer',
    args: [SWAP, fundAmount],
  });
  console.log('Transfer 50000 mUSDT to swap, tx:', fundTx);

  await publicClient.waitForTransactionReceipt({
    hash: fundTx,
    confirmations: 1,
  });
  console.log('Transfer confirmed.');

  // 3️⃣ 打印一下 Swap 里现在有多少 USDT
  const swapBalance = (await publicClient.readContract({
    address: MOCK_USDT,
    abi: mockUsdtAbi,
    functionName: 'balanceOf',
    args: [SWAP],
  })) as bigint;

  console.log('Swap USDT balance (raw):', swapBalance.toString());
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
