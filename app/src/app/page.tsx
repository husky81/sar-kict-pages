import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image src="/kict_ci.png" alt="KICT" width={36} height={36} />
            <span className="text-lg font-semibold">SAR KICT</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#features" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
              주요 기능
            </a>
            <a href="#about" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
              과제 소개
            </a>
            <a
              href="/login"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              로그인
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background logo - right side */}
        <div className="pointer-events-none absolute -right-16 top-1/2 -translate-y-1/2">
          <Image
            src="/kict_ci.png"
            alt=""
            width={700}
            height={400}
            className="opacity-[0.12] dark:opacity-[0.15]"
          />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 py-24 text-left sm:pl-16">
          <div className="inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            한국건설기술연구원 주요사업
          </div>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            위성 SAR 기반
            <br />
            <span className="text-blue-600">인프라 재해 대응</span> 기술 개발
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            위성 SAR(합성개구 레이더) 영상을 활용하여 도심지 및 인프라 구조물의
            지반 침하, 변위, 손상 등을 탐지하고 재해 대응 기술을 개발합니다.
          </p>
          <div className="mt-10 flex items-center gap-4">
            <a
              href="/login"
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              시작하기
            </a>
            <a
              href="#about"
              className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              자세히 보기
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-zinc-200 bg-zinc-50 py-20 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold">주요 기능</h2>
          <p className="mt-3 text-center text-zinc-600 dark:text-zinc-400">
            과제 참여 연구자 및 개발자를 위한 기능을 제공합니다
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon="🛰️"
              title="위성 데이터 스토리지"
              description="Sentinel-1 등 위성 데이터 접근 및 관리"
            />
            <FeatureCard
              icon="⚙️"
              title="Gamma SAR 해석 환경"
              description="Gamma SAR 실행 가능한 JupyterLab 환경 제공"
            />
            <FeatureCard
              icon="🖥️"
              title="해석 서버 접근"
              description="Gamma SAR 설치된 해석 서버 SSH 접근"
            />
            <FeatureCard
              icon="📊"
              title="InSAR 지반 모니터링"
              description="PSInSAR, SBAS 기법 기반 시계열 지반침하 모니터링"
            />
            <FeatureCard
              icon="🤖"
              title="AI 손상 평가"
              description="InSAR + AI 모델 결합 인프라 손상 위험도 평가"
            />
            <FeatureCard
              icon="🗺️"
              title="GIS 통합 플랫폼"
              description="AI·InSAR 정보 GIS 기반 시각화 및 위험 예경보"
            />
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold">과제 소개</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
              <h3 className="text-lg font-semibold">과제 개요</h3>
              <ul className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                <li className="flex justify-between">
                  <span>기간</span>
                  <span className="font-medium text-foreground">2025.01 ~ 2029.12</span>
                </li>
                <li className="flex justify-between">
                  <span>책임자</span>
                  <span className="font-medium text-foreground">이두한 선임연구위원</span>
                </li>
                <li className="flex justify-between">
                  <span>수행기관</span>
                  <span className="font-medium text-foreground">한국건설기술연구원</span>
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
              <h3 className="text-lg font-semibold">기대 성과</h3>
              <ul className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                <li>도심지 지반 침하·변위 실시간 모니터링 기술 확보</li>
                <li>AI 기반 구조물 손상 위험도 평가 시스템 개발</li>
                <li>GIS 기반 위험 맵핑 및 대응 플랫폼 구축</li>
                <li>재난 대응 효율성 증가 및 복구 비용 절감</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-zinc-500">
          <p>한국건설기술연구원 (KICT) · 위성 SAR 기반 인프라 재해 대응 기술 개발</p>
          <p className="mt-2">
            <a
              href="https://github.com/husky81/sar-kict-pages"
              className="hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-6 transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:border-zinc-800 dark:hover:border-blue-800 dark:hover:bg-blue-900/10">
      <div className="text-2xl">{icon}</div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  );
}
