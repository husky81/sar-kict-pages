export const metadata = { title: "템플릿 관리 - SAR KICT" };

export default function AdminTemplatesPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold text-gray-900">인스턴스 템플릿 관리</h1>
        <p className="mt-2 text-gray-600">
          이 기능은 데이터베이스 마이그레이션 후 사용 가능합니다.
        </p>
        <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-6">
          <p className="text-sm text-yellow-800">
            인스턴스 템플릿 관리 기능이 준비되어 있습니다.
            관리자에게 데이터베이스 마이그레이션을 요청하세요.
          </p>
        </div>
      </div>
    </div>
  );
}
