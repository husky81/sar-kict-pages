import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/auth/sign-out-button";

export const metadata = { title: "승인 대기 - SAR KICT" };

export default async function PendingPage() {
  const session = await auth();

  if (session?.user?.status === "APPROVED") {
    redirect("/dashboard");
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
        <svg
          className="h-8 w-8 text-yellow-600"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h2 className="text-lg font-semibold text-gray-900">승인 대기 중</h2>
      <p className="mt-2 text-sm text-gray-500">
        가입 신청이 접수되었습니다.
        <br />
        관리자 승인 후 서비스를 이용할 수 있습니다.
      </p>

      {session?.user?.email && (
        <p className="mt-4 text-xs text-gray-400">
          {session.user.email}
        </p>
      )}

      <div className="mt-6">
        <SignOutButton />
      </div>
    </div>
  );
}
