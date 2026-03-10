export const metadata = { title: "사용 안내 - SAR KICT" };

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              사용 안내
            </h1>
            <a
              href="/dashboard"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              ← 대시보드로 돌아가기
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        {/* 개요 */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="text-3xl">📘</span>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                1. 개요
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
                본 서버는 연구소 내에서 대용량 계산 및 해석 작업(Gamma SAR 등)을 수행하기 위해 제공되는 클라우드 기반 계산 서버입니다.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">
                사용자는 웹에서 서버를 생성하여 계산을 수행할 수 있으며, 필요하지 않을 때는 서버를 종료하여 비용을 절약할 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* 비용 구조 안내 */}
        <section className="mt-6 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="text-3xl">💰</span>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                2. 비용 구조 안내
              </h2>
              <p className="mt-3 text-sm font-medium text-blue-900 sm:text-base">
                본 시스템에서 발생하는 비용은 소프트웨어 사용료가 아니라 서버 사용료입니다.
              </p>

              {/* 소프트웨어 비용 */}
              <div className="mt-4 rounded-lg border border-blue-200 bg-white p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 sm:text-base">
                  <span>✅</span>
                  <span>소프트웨어 비용</span>
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• Gamma SAR 소프트웨어는 이미 구매 완료</li>
                  <li>• 내부 연구원은 추가 비용 없이 사용 가능</li>
                </ul>
              </div>

              {/* 서버 비용 */}
              <div className="mt-4 rounded-lg border border-blue-200 bg-white p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 sm:text-base">
                  <span>🖥️</span>
                  <span>서버 비용</span>
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  서버는 클라우드 방식으로 운영되며 다음 특징이 있습니다:
                </p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">
                          항목
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">
                          설명
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-3 py-2 text-gray-600">과금 방식</td>
                        <td className="px-3 py-2 text-gray-900">
                          택시요금과 유사한 사용량 기반
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-gray-600">
                          비용 발생 시점
                        </td>
                        <td className="px-3 py-2 text-gray-900">
                          서버가 실행 중일 때
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-gray-600">비용 청구</td>
                        <td className="px-3 py-2 text-gray-900">월 1회 정산</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-gray-600">예상 비용</td>
                        <td className="px-3 py-2 text-gray-900">
                          사용량에 따라 변동
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 예상 사용 비용 */}
                <div className="mt-4 rounded-md bg-blue-50 p-3">
                  <p className="text-xs font-semibold text-blue-900 sm:text-sm">
                    예상 사용 비용 (참고)
                  </p>
                  <div className="mt-2 space-y-1 text-xs text-blue-800 sm:text-sm">
                    <div className="flex justify-between">
                      <span>• 간단 테스트:</span>
                      <span className="font-medium">거의 없음</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• 일반 연구 작업:</span>
                      <span className="font-medium">월 수만원 수준</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• 대용량 계산:</span>
                      <span className="font-medium">월 100~200만원 수준 가능</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-blue-700">
                    ※ 실제 비용은 사용 시간 및 계산량에 따라 달라질 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 비용 절약 방법 */}
        <section className="mt-6 rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="text-3xl">💡</span>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                3. 비용 절약 방법
              </h2>
              <p className="mt-3 text-sm text-gray-600 sm:text-base">
                서버 비용은 실행 시간 기준으로 발생하므로 다음 사항을 권장합니다:
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-start gap-2 rounded-lg bg-white p-3 border border-green-200">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-sm text-gray-900">
                    계산이 끝나면 서버 종료
                  </span>
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-white p-3 border border-green-200">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-sm text-gray-900">
                    필요할 때만 서버 실행
                  </span>
                </div>
                <div className="flex items-start gap-2 rounded-lg bg-white p-3 border border-green-200">
                  <span className="text-green-600 font-bold">✓</span>
                  <span className="text-sm text-gray-900">
                    장시간 미사용 시 서버 삭제
                  </span>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-green-100 border border-green-300 p-4">
                <p className="text-sm font-semibold text-green-900 sm:text-base">
                  💡 핵심: 서버는 필요할 때 켜고 사용 후 끄는 방식이 가장 효율적입니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 사용 절차 */}
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="text-3xl">📝</span>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                4. 사용 절차
              </h2>

              {/* 1단계 */}
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 sm:text-base">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                    1
                  </span>
                  <span>회원가입</span>
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-600 ml-8">
                  <li>• 웹사이트에서 회원가입 후 로그인합니다</li>
                  <li>• 회원가입 후 관리자가 계정을 확인합니다</li>
                </ul>
              </div>

              {/* 2단계 */}
              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 sm:text-base">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                    2
                  </span>
                  <span>서버 생성</span>
                </h3>
                <div className="mt-2 ml-8 space-y-2 text-sm text-gray-600">
                  <p>
                    로그인 후 "인스턴스 생성" 버튼을 통해 개인 계산 서버를
                    생성할 수 있습니다.
                  </p>
                  <p className="text-xs text-gray-500">
                    (서버 생성 시: 클라우드 인스턴스 생성, Gamma SAR 실행 환경
                    준비)
                  </p>
                </div>
              </div>

              {/* 3단계 */}
              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 sm:text-base">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                    3
                  </span>
                  <span>계산 수행</span>
                </h3>
                <div className="mt-2 ml-8 text-sm text-gray-600">
                  <p>생성된 서버에 접속하여 다음 작업을 수행할 수 있습니다:</p>
                  <ul className="mt-1 space-y-1">
                    <li>• Gamma SAR 해석 실행</li>
                    <li>• 대용량 계산</li>
                    <li>• 데이터 처리</li>
                  </ul>
                </div>
              </div>

              {/* 4단계 */}
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 sm:text-base">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white">
                    4
                  </span>
                  <span>서버 종료 (중요!)</span>
                </h3>
                <div className="mt-2 ml-8 space-y-2 text-sm text-gray-600">
                  <p className="font-medium text-red-900">
                    계산이 끝나면 반드시 서버 종료 또는 서버 삭제를 수행해
                    주세요.
                  </p>
                  <p className="text-red-800 text-xs">
                    ⚠️ 서버가 실행 중일 경우 비용이 계속 발생합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 서버 삭제 */}
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🗑️</span>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                5. 서버 삭제
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li>
                  • 사용하지 않는 경우 서버를 제거할 수 있습니다
                </li>
                <li>
                  • 계정 유지 자체로는 일반적으로 비용이 발생하지 않습니다
                </li>
                <li className="text-xs text-gray-500">
                  (단, 서버 또는 스토리지가 유지되는 경우 비용이 발생할 수
                  있습니다)
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 사용 권장 사항 */}
        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="text-3xl">👍</span>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                6. 사용 권장 사항
              </h2>

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-green-700 sm:text-base">
                  ✅ 서버 사용을 권장하는 경우:
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• 대용량 계산</li>
                  <li>• 장시간 해석 작업</li>
                  <li>• 개인 PC에서 처리하기 어려운 계산</li>
                </ul>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-700 sm:text-base">
                  ℹ️ 서버 사용이 필요하지 않을 수 있는 경우:
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                  <li>• 간단한 테스트</li>
                  <li>• 소규모 계산</li>
                </ul>
                <p className="mt-2 text-xs text-gray-500">
                  이 경우 로컬 PC에서 Gamma SAR 실행이 더 효율적일 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 문의 및 지원 */}
        <section className="mt-6 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="text-3xl">💬</span>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                7. 문의 및 지원
              </h2>
              <p className="mt-3 text-sm text-gray-600 sm:text-base">
                사용 중 문제가 발생하거나 서버 관련 문의가 있는 경우 담당자에게
                연락해 주세요.
              </p>
              <div className="mt-4 rounded-lg border border-purple-200 bg-white p-4">
                <p className="text-xs font-semibold text-gray-700 sm:text-sm">
                  문의 예시:
                </p>
                <ul className="mt-2 space-y-1 text-xs text-gray-600 sm:text-sm">
                  <li>• 서버 실행 오류</li>
                  <li>• Gamma SAR 실행 문제</li>
                  <li>• 서버 접속 문제</li>
                  <li>• 비용 관련 문의</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 참고 사항 */}
        <section className="mt-6 rounded-xl border border-gray-300 bg-gray-100 p-6 sm:p-8">
          <div className="flex items-start gap-3">
            <span className="text-3xl">📌</span>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                8. 참고 사항
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
                본 서버 시스템은 초기 운영 단계이며, 사용자의 피드백을 반영하여
                지속적으로 개선될 예정입니다.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">
                사용 중 불편 사항이나 개선 의견이 있으시면 언제든지 공유해
                주시면 감사하겠습니다.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="mt-8 flex justify-center">
          <a
            href="/dashboard"
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:text-base"
          >
            대시보드로 돌아가기
          </a>
        </div>
      </main>
    </div>
  );
}
