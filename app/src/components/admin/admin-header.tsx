"use client";

import { useState } from "react";
import SignOutButton from "@/components/auth/sign-out-button";

export default function AdminHeader({
  activePage,
}: {
  activePage: "users" | "costs";
}) {
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: "/admin/users", label: "사용자 관리", active: activePage === "users" },
    { href: "/admin/costs", label: "비용 관리", active: activePage === "costs" },
    { href: "/dashboard", label: "대시보드", active: false },
  ];

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <img src="/kict_ci.png" alt="KICT" className="h-7 w-auto sm:h-8" />
          <span className="text-base font-bold text-gray-900 sm:text-lg">SAR KICT</span>
          <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-medium text-white">
            관리자
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm ${
                link.active
                  ? "text-gray-900 font-medium"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {link.label}
            </a>
          ))}
          <SignOutButton />
        </nav>

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
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed right-0 top-0 h-full w-64 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <span className="text-sm font-semibold text-gray-900">메뉴</span>
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
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-3 text-sm ${
                    link.active
                      ? "bg-gray-100 text-gray-900 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {link.label}
                </a>
              ))}
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
