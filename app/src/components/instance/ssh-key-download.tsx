"use client";

import { useState } from "react";
import { getSshKey } from "@/lib/actions/ec2";

export default function SshKeyDownload() {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const key = await getSshKey();
      const blob = new Blob([key.privateKey], { type: "application/x-pem-file" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${key.keyPairName}.pem`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("SSH 키 다운로드에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
    >
      {loading ? "다운로드 중..." : "SSH 키 다운로드"}
    </button>
  );
}
