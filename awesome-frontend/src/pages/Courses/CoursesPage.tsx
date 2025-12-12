import { LearningFlowBar } from '@components/common/LearningFlowBar';
import { useToast } from '@components/common/Toast';
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
import { formatErrorMessage, isUserRejected } from '@utils/errorHandler';
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
  const { showSuccess, showError, showWarning, ToastComponent } = useToast();

  const [reloadKey, setReloadKey] = useState(0);
  // 只有在连接钱包时才加载课程
  const { courses, loading, error } = useCourses(reloadKey, isConnected);
  const [uiCourses, setUiCourses] = useState<UICourse[]>([]);
  const [creating, setCreating] = useState(false);
  const [buyingCourseId, setBuyingCourseId] = useState<bigint | undefined>();

  // 课程市场只部署在 Sepolia
  const isOnSepolia = chainId === sepolia.id;
  const isWrongNetwork = isConnected && !isOnSepolia;

  useEffect(() => {
    // 如果未连接钱包，直接清空UI课程列表
    if (!isConnected) {
      setUiCourses([]);
      return;
    }

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
  }, [publicClient, courses, address, isConnected]);

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

        showSuccess('课程创建成功！');
        setReloadKey((k) => k + 1);
      } catch (err) {
        console.error('createCourse error:', err);
        if (isUserRejected(err)) {
          showWarning(formatErrorMessage(err));
        } else {
          showError(`创建失败：${formatErrorMessage(err)}`);
        }
      } finally {
        setCreating(false);
      }
    },
    [
      isConnected,
      address,
      publicClient,
      writeContractAsync,
      waitForReceipt,
      isWrongNetwork,
      showSuccess,
      showError,
      showWarning,
    ],
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

        showSuccess(`成功购买课程！`);
        setReloadKey((k) => k + 1);
      } catch (err) {
        console.error('buyCourse error:', err);
        if (isUserRejected(err)) {
          showWarning(formatErrorMessage(err));
        } else {
          showError(`购买失败：${formatErrorMessage(err)}`);
        }
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
      showSuccess,
      showError,
      showWarning,
    ],
  );

  useEffect(() => {
    if (isConnected) {
      setReloadKey((k) => k + 1);
    } else {
      // 断开连接时清空课程列表
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
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="space-y-2 animate-slide-up">
        <h1 className="text-3xl font-bold gradient-text">课程市场</h1>
        <p className="text-slate-300">基于区块链的课程发布与购买平台</p>
      </div>

      <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <LearningFlowBar currentStep={3} />
      </div>

      {/* 创建课程表单 */}
      <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <CreateCourseForm
          onCreate={handleCreateCourse}
          isCreating={creating}
          disabled={!isConnected || isWrongNetwork}
        />
      </div>

      {/* 课程列表 */}
      <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <CourseList
          courses={uiCourses}
          onBuy={handleBuyCourse}
          buyingCourseId={buyingCourseId}
          disabled={!isConnected || isWrongNetwork}
          loading={loading}
        />
      </div>

      {/* 友好错误提示 */}
      {friendlyError && (
        <div className="rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 backdrop-blur-sm px-4 py-3 animate-slide-up">
          <p className="text-sm text-amber-300">{friendlyError}</p>
        </div>
      )}

      {/* Toast通知 */}
      <ToastComponent />
    </div>
  );
};

export default CoursesPage;
