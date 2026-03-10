import { auth } from "@/auth";
import DashboardHeader from "@/components/layout/dashboard-header";
import InstanceCard from "@/components/instance/instance-card";
import CostCard from "@/components/instance/cost-card";
import { getUserInstance, getUserInstanceConfig } from "@/lib/actions/ec2";
import { getMyInstanceCost } from "@/lib/actions/cost";
import { getSshAllowedIps } from "@/lib/actions/ssh-ip";
import { hasPassword } from "@/lib/actions/change-password";

export const metadata = { title: "대시보드 - SAR KICT" };

export default async function DashboardPage() {
  const session = await auth();
  const [instance, config, costData, allowedIps, userHasPassword] = await Promise.all([
    getUserInstance(),
    getUserInstanceConfig(),
    getMyInstanceCost(),
    getSshAllowedIps(),
    hasPassword(),
  ]);

  const initialInstance = instance
    ? {
        id: instance.id,
        instanceId: instance.instanceId || "",
        status: instance.status,
        publicIp: instance.publicIp,
        privateIp: instance.privateIp,
        instanceType: instance.instanceType,
        keyPairName: instance.keyPairName,
        launchedAt: instance.launchedAt?.toISOString() || null,
        stoppedAt: instance.stoppedAt?.toISOString() || null,
      }
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        userName={session?.user?.name}
        userEmail={session?.user?.email}
        isAdmin={session?.user?.role === "ADMIN"}
        hasPassword={userHasPassword}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">대시보드</h1>
        <p className="mt-1 text-sm text-gray-600 sm:mt-2 sm:text-base">
          SAR KICT Cloud Platform에 오신 것을 환영합니다.
        </p>

        {/* 비용 요약 카드 */}
        {costData && initialInstance && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="hidden sm:block text-3xl">💰</div>
                <div>
                  <p className="text-xs text-blue-600 font-medium">이번 달 예상 비용</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-900">
                    ${costData.totalCost.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex gap-6 sm:gap-8">
                <div>
                  <p className="text-xs text-blue-600">가동 시간</p>
                  <p className="text-lg sm:text-xl font-semibold text-blue-900">
                    {Math.floor(costData.totalMinutes / 60)}h {costData.totalMinutes % 60}m
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-600">인스턴스 상태</p>
                  <p className="text-lg sm:text-xl font-semibold text-blue-900">
                    {costData.isRunning ? (
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        실행 중
                      </span>
                    ) : (
                      <span className="text-gray-600">중지됨</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 sm:mt-8 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
            <h3 className="font-semibold text-gray-900">내 정보</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">이름</dt>
                <dd className="text-gray-900">
                  {session?.user?.name || "-"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">이메일</dt>
                <dd className="text-gray-900 break-all text-right ml-4">{session?.user?.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">역할</dt>
                <dd className="text-gray-900">
                  {session?.user?.role === "ADMIN" ? "관리자" : "회원"}
                </dd>
              </div>
            </dl>
          </div>

          <InstanceCard
            initialInstance={initialInstance}
            quota={config.quota}
            assignedType={config.instanceType}
            allowedIps={allowedIps}
          />
        </div>

        {initialInstance && (
          <div className="mt-6">
            <CostCard cost={costData} />
          </div>
        )}
      </main>
    </div>
  );
}
