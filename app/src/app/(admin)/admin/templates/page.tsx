import { getAllTemplates } from "@/lib/actions/template";

export const metadata = { title: "템플릿 관리 - SAR KICT" };

export default async function AdminTemplatesPage() {
  const templates = await getAllTemplates();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold text-gray-900">인스턴스 템플릿 관리</h1>
        <p className="mt-2 text-gray-600">
          사용자가 인스턴스를 생성할 때 선택할 수 있는 템플릿입니다.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`rounded-xl border p-5 ${
                template.isActive
                  ? "border-gray-200 bg-white"
                  : "border-gray-100 bg-gray-50 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                <div className="flex gap-1">
                  {template.isDefault && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      기본
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      template.isActive
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {template.isActive ? "활성" : "비활성"}
                  </span>
                </div>
              </div>

              {template.description && (
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
              )}

              <div className="space-y-1 text-sm text-gray-500">
                <p>타입: <span className="font-mono text-gray-900">{template.instanceType}</span></p>
                <p>스토리지: {template.volumeSize}GB</p>
                <p>최대 인스턴스: {template.maxInstances}개</p>
                <p>사용 중: {template._count.instances}개</p>
              </div>
            </div>
          ))}
        </div>

        {templates.length === 0 && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-500">등록된 템플릿이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
