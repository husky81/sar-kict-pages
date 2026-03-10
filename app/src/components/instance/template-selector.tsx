"use client";

import { useState } from "react";
import { createInstanceFromTemplate } from "@/lib/actions/ec2";

type Template = {
  id: string;
  name: string;
  description: string | null;
  instanceType: string;
  volumeSize: number;
  maxInstances: number;
  isDefault: boolean;
};

export default function TemplateSelector({ templates }: { templates: Template[] }) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    templates.find((t) => t.isDefault)?.id || templates[0]?.id || ""
  );
  const [instanceName, setInstanceName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!selectedTemplate) {
      alert("템플릿을 선택하세요.");
      return;
    }

    const template = templates.find((t) => t.id === selectedTemplate);
    if (!confirm(`${template?.name} 인스턴스를 생성하시겠습니까?\n\n서버 시작 시 비용이 발생합니다.`)) {
      return;
    }

    setCreating(true);
    try {
      await createInstanceFromTemplate(selectedTemplate, instanceName || undefined);
      alert("인스턴스 생성을 시작했습니다. 잠시 후 새로고침하세요.");
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "인스턴스 생성 실패");
    } finally {
      setCreating(false);
    }
  };

  const selectedTemplateData = templates.find((t) => t.id === selectedTemplate);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        새 인스턴스 생성
      </h2>

      {/* 템플릿 선택 */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            서버 템플릿 선택
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`text-left rounded-lg border-2 p-4 transition-all ${
                  selectedTemplate === template.id
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  {template.isDefault && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      기본
                    </span>
                  )}
                </div>
                {template.description && (
                  <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                )}
                <div className="text-xs text-gray-500 space-y-0.5">
                  <p>• 타입: {template.instanceType}</p>
                  <p>• 스토리지: {template.volumeSize}GB</p>
                  <p>• 최대: {template.maxInstances}개</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 인스턴스 이름 (선택사항) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            인스턴스 이름 (선택사항)
          </label>
          <input
            type="text"
            value={instanceName}
            onChange={(e) => setInstanceName(e.target.value)}
            placeholder="예: my-gpu-server"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* 생성 버튼 */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {selectedTemplateData && (
              <p>
                💡 {selectedTemplateData.name} 템플릿으로 최대{" "}
                {selectedTemplateData.maxInstances}개까지 생성 가능
              </p>
            )}
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !selectedTemplate}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? "생성 중..." : "🚀 인스턴스 생성"}
          </button>
        </div>
      </div>
    </div>
  );
}
