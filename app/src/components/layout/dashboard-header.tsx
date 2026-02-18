"use client";

import { useState } from "react";
import SignOutButton from "@/components/auth/sign-out-button";

export default function DashboardHeader({
  userName,
  userEmail,
  isAdmin,
  hasPassword = false,
}: {
  userName: string | null | undefined;
  userEmail: string | null | undefined;
  isAdmin: boolean;
  hasPassword?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <img src="/kict_ci.png" alt="KICT" className="h-7 w-auto sm:h-8" />
          <span className="text-base font-bold text-gray-900 sm:text-lg">SAR KICT</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {userName || userEmail}
          </span>
          {hasPassword && (
            <a
              href="/settings/password"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              비밀번호 변경
            </a>
          )}
          {isAdmin && (
            <a
              href="/admin/users"
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition-colors"
            >
              관리자
            </a>
          )}
          <SignOutButton />
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          onClick={() => setOpen(true)}
          aria-label="메뉴 열기"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          <div className="fixed right-0 top-0 h-full w-64 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {userName || "-"}
                </p>
                <p className="text-xs text-gray-500">{userEmail}</p>
              </div>
              <button
                type="button"
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                onClick={() => setOpen(false)}
                aria-label="메뉴 닫기"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-col p-4">
              {hasPassword && (
                <a
                  href="/settings/password"
                  className="rounded-md px-3 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  비밀번호 변경
                </a>
              )}
              {isAdmin && (
                <a
                  href="/admin/users"
                  className="rounded-md px-3 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  관리자 페이지
                </a>
              )}
              <div className="mt-4 border-t border-gray-200 pt-4 px-3">
                <SignOutButton />
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
