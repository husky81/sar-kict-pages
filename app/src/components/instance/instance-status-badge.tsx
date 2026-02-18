const styles: Record<string, string> = {
  RUNNING: "bg-green-100 text-green-800",
  STOPPED: "bg-gray-100 text-gray-800",
  PENDING: "bg-blue-100 text-blue-800",
  STARTING: "bg-blue-100 text-blue-800",
  STOPPING: "bg-yellow-100 text-yellow-800",
  TERMINATED: "bg-red-100 text-red-800",
  FAILED: "bg-red-100 text-red-800",
};

const labels: Record<string, string> = {
  RUNNING: "실행 중",
  STOPPED: "중지됨",
  PENDING: "준비 중",
  STARTING: "켜는 중",
  STOPPING: "끄는 중",
  TERMINATED: "종료됨",
  FAILED: "실패",
};

export default function InstanceStatusBadge({ status }: { status: string }) {
  const isActive =
    status === "RUNNING" || status === "STARTING" || status === "PENDING";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-800"}`}
    >
      {isActive && (
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
      )}
      {labels[status] || status}
    </span>
  );
}
