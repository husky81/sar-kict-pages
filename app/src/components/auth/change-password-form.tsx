"use client";

import { useState, useTransition } from "react";
import { changePassword } from "@/lib/actions/change-password";

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (next.length < 8) {
      setMessage({ type: "error", text: "새 비밀번호는 8자 이상이어야 합니다." });
      return;
    }

    if (next !== confirm) {
      setMessage({ type: "error", text: "새 비밀번호가 일치하지 않습니다." });
      return;
    }

    startTransition(async () => {
      try {
        await changePassword(current, next);
        setMessage({ type: "success", text: "비밀번호가 변경되었습니다." });
        setCurrent("");
        setNext("");
        setConfirm("");
      } catch (e: unknown) {
        setMessage({
          type: "error",
          text: e instanceof Error ? e.message : "비밀번호 변경에 실패했습니다.",
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          현재 비밀번호
        </label>
        <input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
          disabled={isPending}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          새 비밀번호
        </label>
        <input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="8자 이상"
          required
          disabled={isPending}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          새 비밀번호 확인
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          disabled={isPending}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || !current || !next || !confirm}
        className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? "변경 중..." : "비밀번호 변경"}
      </button>

      {message && (
        <p
          className={`text-sm text-center ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
