import { auth } from "@/auth";
import DashboardHeader from "@/components/layout/dashboard-header";
import { getMyCostLimits } from "@/lib/actions/cost-limit";
import { getMyAutoStopPolicy } from "@/lib/actions/auto-stop";
import { hasPassword } from "@/lib/actions/change-password";
import CostLimitSection from "@/components/settings/cost-limit-section";
import AutoStopSection from "@/components/settings/auto-stop-section";

export const metadata = { title: "설정 - SAR KICT" };

export default async function SettingsPage() {
  const session = await auth();
  const [costLimits, autoStopPolicy, userHasPassword] = await Promise.all([
    getMyCostLimits(),
    getMyAutoStopPolicy(),
    hasPassword(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        userName={session?.user?.name}
        userEmail={session?.user?.email}
        isAdmin={session?.user?.role === "ADMIN"}
        hasPassword={userHasPassword}
      />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">설정</h1>
        <p className="mt-1 text-sm text-gray-600">
          비용 한도와 자동 종료 정책을 관리합니다. 설정한 정책은 실시간으로 적용됩니다.
        </p>

        <div className="mt-6 space-y-6">
          <CostLimitSection initialLimits={costLimits} />
          <AutoStopSection initialPolicy={autoStopPolicy} />

          {userHasPassword && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">계정</h2>
              <p className="mt-1 text-sm text-gray-500">계정 보안 설정</p>
              <div className="mt-4">
                <a
                  href="/settings/password"
                  className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  비밀번호 변경
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
