import SignupForm from "@/components/auth/signup-form";
import GoogleSignInButton from "@/components/auth/google-sign-in-button";

export const metadata = { title: "회원가입 - SAR KICT" };

export default function SignupPage() {
  return (
    <>
      <h2 className="mb-6 text-center text-lg font-semibold text-gray-900">
        회원가입
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

      <SignupForm />

      <p className="mt-6 text-center text-sm text-gray-500">
        이미 계정이 있으신가요?{" "}
        <a href="/login" className="text-blue-600 hover:underline font-medium">
          로그인
        </a>
      </p>
    </>
  );
}
