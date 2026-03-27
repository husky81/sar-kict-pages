"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("관리자 권한이 필요합니다");
  }
  return session;
}

export async function getActiveTemplates() {
  const templates = await prisma.instanceTemplate.findMany({
    where: { isActive: true },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
  return templates;
}

export async function getAllTemplates() {
  await requireAdmin();
  const templates = await prisma.instanceTemplate.findMany({
    orderBy: [{ isActive: "desc" }, { isDefault: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { instances: true } },
    },
  });
  return templates;
}

export async function createTemplate(data: {
  name: string;
  description?: string;
  instanceType: string;
  volumeSize: number;
  maxInstances: number;
  isDefault?: boolean;
}) {
  await requireAdmin();

  if (data.isDefault) {
    await prisma.instanceTemplate.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  const template = await prisma.instanceTemplate.create({
    data: {
      name: data.name,
      description: data.description,
      instanceType: data.instanceType,
      volumeSize: data.volumeSize,
      maxInstances: data.maxInstances,
      isDefault: data.isDefault || false,
    },
  });

  revalidatePath("/admin/templates");
  revalidatePath("/instances");
  return template;
}

export async function updateTemplate(
  id: string,
  data: {
    name?: string;
    description?: string;
    instanceType?: string;
    volumeSize?: number;
    maxInstances?: number;
    isActive?: boolean;
    isDefault?: boolean;
  }
) {
  await requireAdmin();

  if (data.isDefault) {
    await prisma.instanceTemplate.updateMany({
      where: { isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  const template = await prisma.instanceTemplate.update({
    where: { id },
    data,
  });

  revalidatePath("/admin/templates");
  revalidatePath("/instances");
  return template;
}

export async function deleteTemplate(id: string) {
  await requireAdmin();

  const instanceCount = await prisma.instance.count({
    where: { templateId: id },
  });

  if (instanceCount > 0) {
    throw new Error("이 템플릿을 사용 중인 인스턴스가 있어 삭제할 수 없습니다. 비활성화를 사용하세요.");
  }

  await prisma.instanceTemplate.delete({ where: { id } });

  revalidatePath("/admin/templates");
  revalidatePath("/instances");
}
