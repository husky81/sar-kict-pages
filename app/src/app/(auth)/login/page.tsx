import LoginForm from "@/components/auth/login-form";
import GoogleSignInButton from "@/components/auth/google-sign-in-button";

export const metadata = { title: "로그인 - SAR KICT" };

export default function LoginPage() {
  return (
    <>
      <h2 className="mb-6 text-center text-lg font-semibold text-gray-900">
        로그인
      </h2>

      <GoogleSignInButton />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-gray-500">또는</span>
        </div>
      </div>

      <LoginForm />

      <p className="mt-6 text-center text-sm text-gray-500">
        계정이 없으신가요?{" "}
        <a href="/signup" className="text-blue-600 hover:underline font-medium">
          회원가입
        </a>
      </p>
    </>
  );
}
