import { getUsers, updateUserStatus } from "@/lib/actions/admin";
import SignOutButton from "@/components/auth/sign-out-button";

export const metadata = { title: "사용자 관리 - SAR KICT" };

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  };
  const labels: Record<string, string> = {
    PENDING: "대기",
    APPROVED: "승인",
    REJECTED: "거부",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/kict_ci.png" alt="KICT" className="h-8 w-auto" />
            <span className="text-lg font-bold text-gray-900">SAR KICT</span>
            <span className="rounded-full bg-gray-900 px-2.5 py-0.5 text-xs font-medium text-white">
              관리자
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              대시보드
            </a>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900">사용자 관리</h1>
        <p className="mt-2 text-gray-600">
          가입 신청을 승인하거나 거부할 수 있습니다.
        </p>

        <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  사용자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  이메일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  역할
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  가입일
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt=""
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                          {user.name?.[0] || "?"}
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {user.name || "-"}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {user.role === "ADMIN" ? "관리자" : "회원"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    {user.status === "PENDING" && (
                      <div className="flex justify-end gap-2">
                        <form
                          action={async () => {
                            "use server";
                            await updateUserStatus(user.id, "APPROVED");
                          }}
                        >
                          <button
                            type="submit"
                            className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                          >
                            승인
                          </button>
                        </form>
                        <form
                          action={async () => {
                            "use server";
                            await updateUserStatus(user.id, "REJECTED");
                          }}
                        >
                          <button
                            type="submit"
                            className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                          >
                            거부
                          </button>
                        </form>
                      </div>
                    )}
                    {user.status === "APPROVED" && (
                      <form
                        action={async () => {
                          "use server";
                          await updateUserStatus(user.id, "REJECTED");
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          차단
                        </button>
                      </form>
                    )}
                    {user.status === "REJECTED" && (
                      <form
                        action={async () => {
                          "use server";
                          await updateUserStatus(user.id, "APPROVED");
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-md border border-green-300 px-3 py-1 text-xs font-medium text-green-600 hover:bg-green-50 transition-colors"
                        >
                          승인
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    등록된 사용자가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
