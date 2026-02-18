import { getUsers, updateUserStatus } from "@/lib/actions/admin";
import {
  provisionInstance,
  adminStopInstance,
  adminStartInstance,
  reclaimInstance,
} from "@/lib/actions/ec2";
import AdminHeader from "@/components/admin/admin-header";
import InstanceStatusBadge from "@/components/instance/instance-status-badge";
import InstanceConfigForm from "@/components/admin/instance-config-form";

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

function UserAvatar({ image, name }: { image: string | null; name: string | null }) {
  if (image) {
    return <img src={image} alt="" className="h-8 w-8 rounded-full" />;
  }
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
      {name?.[0] || "?"}
    </div>
  );
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader activePage="users" />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">사용자 관리</h1>
        <p className="mt-1 text-sm text-gray-600 sm:mt-2 sm:text-base">
          가입 신청을 승인하거나 거부할 수 있습니다.
        </p>

        {/* Mobile card view */}
        <div className="mt-6 space-y-4 md:hidden">
          {users.map((user) => {
            const instanceStatus = user.instance?.status;
            const isRunning =
              instanceStatus === "RUNNING" ||
              instanceStatus === "STARTING" ||
              instanceStatus === "PENDING";
            const isStopped = instanceStatus === "STOPPED" || instanceStatus === "STOPPING";

            return (
              <div
                key={user.id}
                className="rounded-xl border border-gray-200 bg-white p-4 space-y-3"
              >
                {/* User info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserAvatar image={user.image} name={user.name} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.name || "-"}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <StatusBadge status={user.status} />
                </div>

                {/* Instance info */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-500">인스턴스</span>
                  {user.instance ? (
                    <div className="flex items-center gap-2">
                      <InstanceStatusBadge status={user.instance.status} />
                      <span className="text-xs font-mono text-gray-400">
                        {user.instance.instanceId?.slice(0, 12)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">없음</span>
                  )}
                </div>

                {/* Instance config */}
                {user.status === "APPROVED" && (
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-500 mb-2">인스턴스 설정</p>
                    <InstanceConfigForm
                      userId={user.id}
                      initialQuota={user.instanceQuota}
                      initialType={user.instanceType}
                      hasActiveInstance={
                        !!user.instance &&
                        user.instance.status !== "TERMINATED"
                      }
                    />
                  </div>
                )}

                {/* Date */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-500">가입일</span>
                  <span className="text-xs text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                  {/* 사용자 상태 관리 */}
                  {user.status === "PENDING" && (
                    <>
                      <form
                        action={async () => {
                          "use server";
                          await updateUserStatus(user.id, "APPROVED");
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-md bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 transition-colors min-h-[36px]"
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
                          className="rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 transition-colors min-h-[36px]"
                        >
                          거부
                        </button>
                      </form>
                    </>
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
                        className="rounded-md border border-red-300 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors min-h-[36px]"
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
                        className="rounded-md border border-green-300 px-3 py-2 text-xs font-medium text-green-600 hover:bg-green-50 transition-colors min-h-[36px]"
                      >
                        승인
                      </button>
                    </form>
                  )}

                  {user.status === "APPROVED" &&
                    !user.instance &&
                    user.instanceQuota >= 1 && (
                      <form
                        action={async () => {
                          "use server";
                          await provisionInstance(user.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors min-h-[36px]"
                        >
                          인스턴스 생성
                        </button>
                      </form>
                    )}

                  {user.instance && isStopped && (
                    <form
                      action={async () => {
                        "use server";
                        await adminStartInstance(user.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-md bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 transition-colors min-h-[36px]"
                      >
                        시작
                      </button>
                    </form>
                  )}

                  {user.instance && isRunning && (
                    <form
                      action={async () => {
                        "use server";
                        await adminStopInstance(user.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-md border border-yellow-400 px-3 py-2 text-xs font-medium text-yellow-700 hover:bg-yellow-50 transition-colors min-h-[36px]"
                      >
                        종료
                      </button>
                    </form>
                  )}

                  {user.instance && (
                    <form
                      action={async () => {
                        "use server";
                        await reclaimInstance(user.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors min-h-[36px]"
                      >
                        회수
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}

          {users.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">
              등록된 사용자가 없습니다.
            </div>
          )}
        </div>

        {/* Desktop table view */}
        <div className="mt-8 hidden md:block overflow-hidden rounded-xl border border-gray-200 bg-white">
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
                  인스턴스
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  인스턴스 설정
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
              {users.map((user) => {
                const instanceStatus = user.instance?.status;
                const isRunning =
                  instanceStatus === "RUNNING" ||
                  instanceStatus === "STARTING" ||
                  instanceStatus === "PENDING";
                const isStopped = instanceStatus === "STOPPED" || instanceStatus === "STOPPING";

                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar image={user.image} name={user.name} />
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
                    <td className="whitespace-nowrap px-6 py-4">
                      {user.instance ? (
                        <div className="flex items-center gap-2">
                          <InstanceStatusBadge status={user.instance.status} />
                          <span className="text-xs font-mono text-gray-400">
                            {user.instance.instanceId?.slice(0, 12)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">없음</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {user.status === "APPROVED" ? (
                        <InstanceConfigForm
                          userId={user.id}
                          initialQuota={user.instanceQuota}
                          initialType={user.instanceType}
                          hasActiveInstance={
                            !!user.instance &&
                            user.instance.status !== "TERMINATED"
                          }
                        />
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {user.status === "PENDING" && (
                          <>
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
                          </>
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

                        {user.status === "APPROVED" &&
                          !user.instance &&
                          user.instanceQuota >= 1 && (
                            <form
                              action={async () => {
                                "use server";
                                await provisionInstance(user.id);
                              }}
                            >
                              <button
                                type="submit"
                                className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                              >
                                인스턴스 생성
                              </button>
                            </form>
                          )}

                        {user.instance && isStopped && (
                          <form
                            action={async () => {
                              "use server";
                              await adminStartInstance(user.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                            >
                              시작
                            </button>
                          </form>
                        )}

                        {user.instance && isRunning && (
                          <form
                            action={async () => {
                              "use server";
                              await adminStopInstance(user.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="rounded-md border border-yellow-400 px-3 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-50 transition-colors"
                            >
                              종료
                            </button>
                          </form>
                        )}

                        {user.instance && (
                          <form
                            action={async () => {
                              "use server";
                              await reclaimInstance(user.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="rounded-md border border-red-300 bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                            >
                              회수
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
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
