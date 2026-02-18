import { auth } from "@/auth";
import { hasPassword } from "@/lib/actions/change-password";
import DashboardHeader from "@/components/layout/dashboard-header";
import ChangePasswordForm from "@/components/auth/change-password-form";
import { redirect } from "next/navigation";

export const metadata = { title: "비밀번호 변경 - SAR KICT" };

export default async function ChangePasswordPage() {
  const session = await auth();
  const userHasPassword = await hasPassword();

  if (!userHasPassword) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        userName={session?.user?.name}
        userEmail={session?.user?.email}
        isAdmin={session?.user?.role === "ADMIN"}
        hasPassword={userHasPassword}
      />

      <main className="mx-auto max-w-md px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">
            비밀번호 변경
          </h1>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            현재 비밀번호를 확인한 후 새 비밀번호로 변경합니다.
          </p>

          <ChangePasswordForm />
        </div>
      </main>
    </div>
  );
}
