"use server";

// TODO: DB 마이그레이션 후 활성화
// 현재 InstanceTemplate 테이블이 존재하지 않아 스텁으로 대체

export async function getActiveTemplates() {
  return [];
}

export async function getAllTemplates() {
  return [];
}

export async function createTemplate(_data: {
  name: string;
  description?: string;
  instanceType: string;
  volumeSize: number;
  maxInstances: number;
  isDefault?: boolean;
}) {
  throw new Error("DB 마이그레이션이 필요합니다. 관리자에게 문의하세요.");
}

export async function updateTemplate(
  _id: string,
  _data: {
    name?: string;
    description?: string;
    instanceType?: string;
    volumeSize?: number;
    maxInstances?: number;
    isActive?: boolean;
    isDefault?: boolean;
  }
) {
  throw new Error("DB 마이그레이션이 필요합니다. 관리자에게 문의하세요.");
}

export async function deleteTemplate(_id: string) {
  throw new Error("DB 마이그레이션이 필요합니다. 관리자에게 문의하세요.");
}
