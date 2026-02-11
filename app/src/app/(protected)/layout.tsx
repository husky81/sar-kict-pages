import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.status === "PENDING") {
    redirect("/pending");
  }

  if (session.user.status !== "APPROVED") {
    redirect("/login");
  }

  return <>{children}</>;
}
