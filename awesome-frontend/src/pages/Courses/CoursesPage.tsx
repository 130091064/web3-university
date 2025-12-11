import { LearningFlowBar } from '@components/common/LearningFlowBar';
import { CourseList } from '@components/course/CourseList';
import { CreateCourseForm } from '@components/course/CreateCourseForm';
import {
  COURSE_MARKETPLACE_ADDRESS,
  courseMarketplaceAbi,
  YD_TOKEN_ADDRESS,
  ydTokenAbi,
} from '@contracts';
import { useCourses } from '@hooks/useCourses';
import { useWaitForTransaction } from '@hooks/useWaitForTransaction';
import type { UICourse } from '@types';
import { useCallback, useEffect, useState } from 'react';
import { parseUnits } from 'viem';
import { useChainId, useConnection, usePublicClient, useWriteContract } from 'wagmi';
import { sepolia } from 'wagmi/chains';

const CoursesPage = () => {
  const { address, isConnected } = useConnection();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const chainId = useChainId();
  const { waitForReceipt } = useWaitForTransaction();

  const [reloadKey, setReloadKey] = useState(0);
  const { courses, loading, error } = useCourses(reloadKey);
  const [uiCourses, setUiCourses] = useState<UICourse[]>([]);
  const [creating, setCreating] = useState(false);
  const [buyingCourseId, setBuyingCourseId] = useState<bigint | undefined>();

  // 课程市场只部署在 Sepolia
  const isOnSepolia = chainId === sepolia.id;
  const isWrongNetwork = isConnected && !isOnSepolia;

  useEffect(() => {
    if (!publicClient || !courses.length) {
      setUiCourses(
        courses.map((c) => ({
          id: c.id,
          author: c.author,
          price: c.price,
          metadataURI: c.metadataURI,
          isActive: c.isActive,
          studentCount: undefined,
          createdAt: undefined,
          isAuthor: !!address && c.author.toLowerCase() === address?.toLowerCase(),
          hasPurchased: false,
        })),
      );
      return;
    }

    const loadStates = async () => {
      try {
        const list: UICourse[] = [];
        for (const c of courses) {
          let hasPurchased = false;

          if (address) {
            hasPurchased = (await publicClient.readContract({
              address: COURSE_MARKETPLACE_ADDRESS,
              abi: courseMarketplaceAbi,
              functionName: 'hasPurchased',
              args: [address, c.id],
            })) as boolean;
          }

          list.push({
            id: c.id,
            author: c.author,
            price: c.price,
            metadataURI: c.metadataURI,
            isActive: c.isActive,
            studentCount: c.studentCount,
            createdAt: c.createdAt,
            isAuthor: !!address && c.author.toLowerCase() === address?.toLowerCase(),
            hasPurchased,
          });
        }
        setUiCourses(list);
      } catch (err) {
        console.error('build uiCourses error:', err);
        setUiCourses(
          courses.map((c) => ({
            id: c.id,
            author: c.author,
            price: c.price,
            metadataURI: c.metadataURI,
            isActive: c.isActive,
            studentCount: c.studentCount,
            createdAt: c.createdAt,
            isAuthor: !!address && c.author.toLowerCase() === address?.toLowerCase(),
            hasPurchased: false,
          })),
        );
      }
    };

    loadStates();
  }, [publicClient, courses, address]);

  const handleCreateCourse = useCallback(
    async (priceStr: string, metadataURI: string) => {
      if (!isConnected || !address || !publicClient) return;
      if (isWrongNetwork) {
        // 只提示就好，不再往下走，避免再抛一堆链上错误
        alert('当前网络暂不支持创建课程，请切换到 Sepolia Testnet 后再试。');
        return;
      }
      if (!priceStr || !metadataURI) return;

      try {
        setCreating(true);
        const price = parseUnits(priceStr, 18);

        const hash = await writeContractAsync({
          address: COURSE_MARKETPLACE_ADDRESS,
          abi: courseMarketplaceAbi,
          functionName: 'createCourse',
          args: [price, metadataURI],
        });

        await waitForReceipt(hash);

        setReloadKey((k) => k + 1);
      } catch (err) {
        console.error('createCourse error:', err);
      } finally {
        setCreating(false);
      }
    },
    [isConnected, address, publicClient, writeContractAsync, waitForReceipt, isWrongNetwork],
  );

  const handleBuyCourse = useCallback(
    async (courseId: bigint) => {
      if (!isConnected || !address || !publicClient) return;
      if (isWrongNetwork) {
        alert('当前网络暂不支持购买课程，请切换到 Sepolia Testnet 后再试。');
        return;
      }

      try {
        setBuyingCourseId(courseId);

        const target = uiCourses.find((c) => c.id === courseId);
        if (!target) throw new Error('Course not found in uiCourses');
        const price = target.price;

        const allowance = (await publicClient.readContract({
          address: YD_TOKEN_ADDRESS,
          abi: ydTokenAbi,
          functionName: 'allowance',
          args: [address, COURSE_MARKETPLACE_ADDRESS],
        })) as bigint;

        if (allowance < price) {
          const approveHash = await writeContractAsync({
            address: YD_TOKEN_ADDRESS,
            abi: ydTokenAbi,
            functionName: 'approve',
            args: [COURSE_MARKETPLACE_ADDRESS, price],
          });

          await waitForReceipt(approveHash);
        }

        const buyHash = await writeContractAsync({
          address: COURSE_MARKETPLACE_ADDRESS,
          abi: courseMarketplaceAbi,
          functionName: 'buyCourse',
          args: [courseId],
        });

        await waitForReceipt(buyHash);

        setReloadKey((k) => k + 1);
      } catch (err) {
        console.error('buyCourse error:', err);
      } finally {
        setBuyingCourseId(undefined);
      }
    },
    [
      isConnected,
      address,
      publicClient,
      uiCourses,
      writeContractAsync,
      waitForReceipt,
      isWrongNetwork,
    ],
  );

  useEffect(() => {
    if (isConnected) {
      setReloadKey((k) => k + 1);
    } else {
      setUiCourses([]);
    }
  }, [isConnected]);

  // 友好错误文案
  let friendlyError: string | null = null;
  if (error) {
    if (isWrongNetwork) {
      friendlyError = '当前网络暂不支持读取课程记录，请在顶部切换到 Sepolia Testnet 后再查看。';
    } else {
      friendlyError = '加载课程时出现问题，请稍后重试。';
    }
    // 原始错误只打到控制台，不展示给用户
    console.error('load courses error:', error);
  }

  return (
    <section className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-100 sm:p-6">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-slate-900">课程市场</h1>
          <p className="text-sm text-slate-500">基于区块链的课程发布与购买平台。</p>
        </div>

        <LearningFlowBar currentStep={3} />

        {/* 创建课程表单 */}
        <CreateCourseForm
          onCreate={handleCreateCourse}
          isCreating={creating}
          disabled={!isConnected || isWrongNetwork}
        />

        {/* 课程列表 */}
        <CourseList
          courses={uiCourses}
          onBuy={handleBuyCourse}
          buyingCourseId={buyingCourseId}
          disabled={!isConnected || isWrongNetwork}
          loading={loading}
        />

        {/* 友好错误提示 */}
        {friendlyError && (
          <p className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {friendlyError}
          </p>
        )}
      </div>
    </section>
  );
};

export default CoursesPage;
