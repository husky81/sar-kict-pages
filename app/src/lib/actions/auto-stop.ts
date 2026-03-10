"use server";

// TODO: DB 마이그레이션 후 활성화
// 현재 AutoStopPolicy 테이블이 존재하지 않아 스텁으로 대체

export async function getMyAutoStopPolicy() {
  return null;
}

export async function setAutoStopPolicy(_data: {
  isActive: boolean;
  idleMinutes?: number;
  checkCpu?: boolean;
  cpuThreshold?: number;
  stopOnWeekends?: boolean;
  stopAtNight?: boolean;
  nightStartHour?: number;
  nightEndHour?: number;
}) {
  throw new Error("DB 마이그레이션이 필요합니다. 관리자에게 문의하세요.");
}

export async function deactivateAutoStopPolicy() {
  throw new Error("DB 마이그레이션이 필요합니다. 관리자에게 문의하세요.");
}

export async function deleteAutoStopPolicy() {
  throw new Error("DB 마이그레이션이 필요합니다. 관리자에게 문의하세요.");
}
