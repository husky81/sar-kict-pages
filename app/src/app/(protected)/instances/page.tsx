import { getUserInstances } from "@/lib/actions/ec2";
import { getActiveTemplates } from "@/lib/actions/template";
import TemplateSelector from "@/components/instance/template-selector";
import InstanceGrid from "@/components/instance/instance-grid";

export const metadata = { title: "인스턴스 관리 - SAR KICT" };

export default async function InstancesPage() {
  const [instances, templates] = await Promise.all([
    getUserInstances(),
    getActiveTemplates(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">인스턴스 관리</h1>
          <p className="mt-1 text-sm text-gray-600">
            템플릿을 선택하여 인스턴스를 생성하고 관리하세요.
          </p>
        </div>

        {templates.length > 0 && (
          <TemplateSelector templates={templates} />
        )}

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            내 인스턴스 ({instances.length}개)
          </h2>
          <InstanceGrid instances={instances} />
        </div>
      </div>
    </div>
  );
}
