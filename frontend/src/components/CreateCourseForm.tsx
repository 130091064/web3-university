import React, { useState } from "react";

interface CreateCourseFormProps {
  onCreate: (price: string, metadataURI: string) => Promise<void> | void;
  isCreating: boolean;
  disabled: boolean;
}

export const CreateCourseForm: React.FC<CreateCourseFormProps> = ({
  onCreate,
  isCreating,
  disabled,
}) => {
  const [price, setPrice] = useState("");
  const [metadataURI, setMetadataURI] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || !metadataURI) return;
    await onCreate(price, metadataURI);
    setPrice("");
    setMetadataURI("");
  };

  return (
    <section className="rounded-2xl bg-slate-50/80 p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">创建新课程</h2>
          <p className="mt-1 text-xs text-slate-500">
            设置价格与简介，上架到课程市场。
          </p>
        </div>
        {disabled && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
            请先连接钱包
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* 价格 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">
            价格（YD）
          </label>
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-100"
            placeholder="例如：100"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={disabled || isCreating}
          />
        </div>

        {/* 简介 / 链接 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">
            课程简介或详情链接
          </label>
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-100"
            placeholder="一句话简介，或 https://... 链接"
            value={metadataURI}
            onChange={(e) => setMetadataURI(e.target.value)}
            disabled={disabled || isCreating}
          />
          <p className="mt-1 text-[11px] text-slate-400">
            支持填写简介或详情页链接（如 IPFS、Notion 等）。
          </p>
        </div>

        {/* 按钮 */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={disabled || isCreating}
            className="min-w-[120px] rounded-xl bg-linear-to-r from-indigo-500 via-sky-500 to-cyan-400 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isCreating ? "创建中..." : "创建课程"}
          </button>
        </div>
      </form>
    </section>
  );
};
