"use server";

// TODO: DB 마이그레이션 후 활성화
// 현재 CostLimit 테이블이 존재하지 않아 스텁으로 대체

export async function getMyCostLimits() {
  return [];
}

export async function setCostLimit(_data: {
  limitType: "DAILY" | "MONTHLY";
  limitAmount: number;
  notifyAt?: number;
}) {
  throw new Error("DB 마이그레이션이 필요합니다. 관리자에게 문의하세요.");
}

export async function deactivateCostLimit(_id: string) {
  throw new Error("DB 마이그레이션이 필요합니다. 관리자에게 문의하세요.");
}

export async function deleteCostLimit(_id: string) {
  throw new Error("DB 마이그레이션이 필요합니다. 관리자에게 문의하세요.");
}
