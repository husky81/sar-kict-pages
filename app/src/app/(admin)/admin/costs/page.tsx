import AdminHeader from "@/components/admin/admin-header";
import InstanceStatusBadge from "@/components/instance/instance-status-badge";
import { getAllUsersCost } from "@/lib/actions/cost";
import { INSTANCE_PRESETS } from "@/lib/instance-types";

export const metadata = { title: "비용 관리 - SAR KICT" };

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins}분`;
  return `${hours}시간 ${mins}분`;
}

export default async function AdminCostsPage() {
  const data = await getAllUsersCost();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader activePage="costs" />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">비용 관리</h1>
        <p className="mt-1 text-sm text-gray-600 sm:mt-2 sm:text-base">
          이번 달 프로젝트 전체 EC2 비용을 확인할 수 있습니다.
        </p>

        {/* Summary cards */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
            <p className="text-xs text-gray-500 sm:text-sm">이번 달 총비용</p>
            <p className="text-lg font-bold text-gray-900 sm:text-2xl">
              ${data.projectTotal.total.toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
            <p className="text-xs text-gray-500 sm:text-sm">EC2 비용</p>
            <p className="text-lg font-bold text-gray-700 sm:text-2xl">
              ${data.projectTotal.ec2.toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
            <p className="text-xs text-gray-500 sm:text-sm">EBS 비용</p>
            <p className="text-lg font-bold text-gray-700 sm:text-2xl">
              ${data.projectTotal.ebs.toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
            <p className="text-xs text-gray-500 sm:text-sm">인스턴스</p>
            <p className="text-lg font-bold text-gray-900 sm:text-2xl">
              <span className="text-green-600">{data.activeCount}</span>
              <span className="text-sm font-normal text-gray-400 sm:text-base">
                {" "}
                / {data.totalCount}
              </span>
            </p>
          </div>
        </div>

        {/* Mobile card view */}
        <div className="mt-6 space-y-3 md:hidden">
          {data.users.map((row) => (
            <div
              key={row.userId}
              className="rounded-xl border border-gray-200 bg-white p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {row.userName || "-"}
                  </p>
                  <p className="text-xs text-gray-500">{row.userEmail}</p>
                </div>
                <InstanceStatusBadge status={row.status} />
              </div>

              <div className="border-t border-gray-100 pt-2 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">인스턴스</span>
                  <span className="text-gray-700">
                    {INSTANCE_PRESETS[row.instanceType]?.label || row.instanceType}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">가동 시간</span>
                  <span className="text-gray-700">{formatDuration(row.totalMinutes)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">EC2</span>
                  <span className="text-gray-700">${row.ec2Cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">EBS</span>
                  <span className="text-gray-700">${row.ebsCost.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                <span className="text-xs font-medium text-gray-900">
                  총비용: ${row.totalCost.toFixed(2)}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded"
                      style={{
                        width: `${
                          data.projectTotal.total > 0
                            ? (row.totalCost / data.projectTotal.total) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {data.projectTotal.total > 0
                      ? ((row.totalCost / data.projectTotal.total) * 100).toFixed(0)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>
          ))}

          {data.users.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-500">
              프로비저닝된 인스턴스가 없습니다.
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
                  인스턴스
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  상태
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  가동 시간
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  EC2
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  EBS
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  총비용
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  비율
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.users.map((row) => (
                <tr key={row.userId} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {row.userName || "-"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {row.userEmail}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-xs text-gray-700">
                      {INSTANCE_PRESETS[row.instanceType]?.label ||
                        row.instanceType}
                    </div>
                    <div className="text-xs font-mono text-gray-400">
                      {row.instanceId?.slice(0, 16) || "-"}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <InstanceStatusBadge status={row.status} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-700">
                    {formatDuration(row.totalMinutes)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-700">
                    ${row.ec2Cost.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-700">
                    ${row.ebsCost.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    ${row.totalCost.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-gray-100 rounded overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded"
                          style={{
                            width: `${
                              data.projectTotal.total > 0
                                ? (row.totalCost / data.projectTotal.total) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-10 text-right">
                        {data.projectTotal.total > 0
                          ? (
                              (row.totalCost / data.projectTotal.total) *
                              100
                            ).toFixed(0)
                          : 0}
                        %
                      </span>
                    </div>
                  </td>
                </tr>
              ))}

              {data.users.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-center text-sm text-gray-500"
                  >
                    프로비저닝된 인스턴스가 없습니다.
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
