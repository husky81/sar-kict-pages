"use client";

import { useActionState } from "react";
import { signup, type AuthState } from "@/lib/actions/auth";

export default function SignupForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signup,
    {}
  );

  if (state.success) {
    return (
      <div className="rounded-md bg-green-50 p-4 text-center">
        <h3 className="text-sm font-medium text-green-800">가입 신청 완료</h3>
        <p className="mt-1 text-sm text-green-600">
          관리자 승인 후 로그인할 수 있습니다.
        </p>
        <a
          href="/login"
          className="mt-3 inline-block text-sm text-blue-600 hover:underline"
        >
          로그인 페이지로 이동
        </a>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          이름
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="홍길동"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="email@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="영문 + 숫자 포함 8자 이상"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? "가입 처리 중..." : "회원가입"}
      </button>
    </form>
  );
}
