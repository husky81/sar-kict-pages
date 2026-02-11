export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <a href="/">
            <img
              src="/kict_ci.png"
              alt="KICT"
              className="mx-auto h-16 w-auto"
            />
          </a>
          <h1 className="mt-4 text-xl font-bold text-gray-900">
            SAR KICT Cloud Platform
          </h1>
        </div>
        <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-200">
          {children}
        </div>
      </div>
    </div>
  );
}
