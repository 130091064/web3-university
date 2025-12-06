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
    await onCreate(price, metadataURI); // 支持异步/同步

    // ⭐ 提交后清空
    setPrice("");
    setMetadataURI("");
  };

  return (
    <section className="mb-6 rounded-3xl bg-linear-to-br from-white via-sky-50 to-blue-50/80 p-5 shadow-xl shadow-sky-100/70 ring-1 ring-sky-100/80">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">
        创建新课程
      </h2>
      <form
        onSubmit={handleSubmit}
        className="grid gap-3 md:grid-cols-[1fr,1fr,auto]"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">
            价格（YD，整数字符串）
          </label>
          <input
            className="rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            placeholder="例如：100"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={disabled || isCreating}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">
            课程简介 / 链接（必填）
          </label>
          <input
            className="rounded-2xl border border-slate-200/80 bg-white/90 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            placeholder="一句话简介，或 https://... 详情链接"
            value={metadataURI}
            onChange={(e) => setMetadataURI(e.target.value)}
            disabled={disabled || isCreating}
          />
          <p className="mt-1 text-[11px] text-slate-400">
            可以直接写一句课程简介，也可以填写课程详情页 / JSON 元数据的链接
            （IPFS、Notion、官网地址等）。
          </p>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={disabled || isCreating}
            className="w-full rounded-2xl bg-linear-to-r from-indigo-500 via-sky-500 to-cyan-400 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-sky-200/70 transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isCreating ? "创建中..." : "创建课程"}
          </button>
        </div>
      </form>
      {disabled && (
        <p className="mt-2 text-xs text-slate-500">
          请先连接钱包，才能创建课程。
        </p>
      )}
    </section>
  );
};
