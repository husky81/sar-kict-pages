import { auth } from "@/auth";
import SignOutButton from "@/components/auth/sign-out-button";
import InstanceCard from "@/components/instance/instance-card";
import { getUserInstance } from "@/lib/actions/ec2";

export const metadata = { title: "대시보드 - SAR KICT" };

export default async function DashboardPage() {
  const session = await auth();
  const instance = await getUserInstance();

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
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/kict_ci.png" alt="KICT" className="h-8 w-auto" />
            <span className="text-lg font-bold text-gray-900">SAR KICT</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {session?.user?.name || session?.user?.email}
            </span>
            {session?.user?.role === "ADMIN" && (
              <a
                href="/admin/users"
                className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition-colors"
              >
                관리자
              </a>
            )}
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-2 text-gray-600">
          SAR KICT Cloud Platform에 오신 것을 환영합니다.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
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
                <dd className="text-gray-900">{session?.user?.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">역할</dt>
                <dd className="text-gray-900">
                  {session?.user?.role === "ADMIN" ? "관리자" : "회원"}
                </dd>
              </div>
            </dl>
          </div>

          <InstanceCard initialInstance={initialInstance} />
        </div>
      </main>
    </div>
  );
}
