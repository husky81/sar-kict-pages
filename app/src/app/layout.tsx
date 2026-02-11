import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/providers/session-provider";

export const metadata: Metadata = {
  title: "SAR KICT",
  description: "SAR KICT Cloud Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
