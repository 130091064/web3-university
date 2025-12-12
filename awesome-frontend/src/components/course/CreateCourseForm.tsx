import { useState } from 'react';

interface CreateCourseFormProps {
  onCreate: (price: string, metadataURI: string) => Promise<void> | void;
  isCreating: boolean;
  disabled: boolean;
}

export const CreateCourseForm = ({ onCreate, isCreating, disabled }: CreateCourseFormProps) => {
  const [price, setPrice] = useState('');
  const [metadataURI, setMetadataURI] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || !metadataURI) return;
    await onCreate(price, metadataURI);
    setPrice('');
    setMetadataURI('');
  };

  return (
    <section className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/20 p-4 shadow-2xl sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="inline-block w-1.5 h-5 bg-gradient-to-b from-violet-500 to-purple-500 rounded-full"></span>
            创建新课程
          </h2>
          <p className="mt-1 text-sm text-slate-300">设置价格与简介，上架到课程市场</p>
        </div>
        {disabled && (
          <span className="rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs text-slate-300">
            请先连接钱包
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 价格 */}
        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium text-slate-300">价格（YD）</div>
          <input
            className="rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-slate-400 outline-none transition focus:border-violet-400/50 focus:bg-white/10 disabled:opacity-50"
            placeholder="例如：100"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={disabled || isCreating}
          />
        </div>

        {/* 简介 / 链接 */}
        <div className="flex flex-col gap-2">
          <div className="text-sm font-medium text-slate-300">课程简介或详情链接</div>
          <input
            className="rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-slate-400 outline-none transition focus:border-violet-400/50 focus:bg-white/10 disabled:opacity-50"
            placeholder="一句话简介，或 https://... 链接"
            value={metadataURI}
            onChange={(e) => setMetadataURI(e.target.value)}
            disabled={disabled || isCreating}
          />
          <p className="text-xs text-slate-400">支持填写简介或详情页链接（如 IPFS、Notion 等）。</p>
        </div>

        {/* 按钮 */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={disabled || isCreating}
            className="min-w-[140px] cursor-pointer rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-violet-500/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
          >
            {isCreating ? '⏳ 创建中...' : '🚀 创建课程'}
          </button>
        </div>
      </form>
    </section>
  );
};
