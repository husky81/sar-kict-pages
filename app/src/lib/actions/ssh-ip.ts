"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ec2 } from "@/lib/aws";
import { revalidatePath } from "next/cache";
import {
  AuthorizeSecurityGroupIngressCommand,
  RevokeSecurityGroupIngressCommand,
} from "@aws-sdk/client-ec2";

const MAX_IPS = 4;
const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;

async function requireApprovedUser() {
  const session = await auth();
  if (!session?.user || session.user.status !== "APPROVED") {
    throw new Error("승인된 사용자만 이용할 수 있습니다");
  }
  return session;
}

function validateIpv4(ip: string): boolean {
  if (!IPV4_REGEX.test(ip)) return false;
  const parts = ip.split(".");
  return parts.every((p) => {
    const n = parseInt(p, 10);
    return n >= 0 && n <= 255;
  });
}

function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 25; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export async function getSshAllowedIps() {
  const session = await requireApprovedUser();

  const rows = await prisma.$queryRawUnsafe<
    { id: string; userId: string; ipAddress: string; createdAt: Date }[]
  >(
    `SELECT id, "userId", "ipAddress", "createdAt"
     FROM "SshAllowedIp"
     WHERE "userId" = $1
     ORDER BY "createdAt" ASC`,
    session.user.id
  ).catch(() => [] as { id: string; userId: string; ipAddress: string; createdAt: Date }[]);

  return rows.map((r) => ({
    id: r.id,
    ipAddress: r.ipAddress,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function addSshIp(ip: string) {
  const session = await requireApprovedUser();
  const userId = session.user.id;

  // Validate IP
  const trimmedIp = ip.trim();
  if (!validateIpv4(trimmedIp)) {
    throw new Error("올바른 IPv4 주소를 입력하세요");
  }

  // Check max count
  const countResult = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*) as count FROM "SshAllowedIp" WHERE "userId" = $1`,
    userId
  );
  const currentCount = Number(countResult[0]?.count ?? 0);
  if (currentCount >= MAX_IPS) {
    throw new Error(`최대 ${MAX_IPS}개의 IP만 등록할 수 있습니다`);
  }

  // Check duplicate
  const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM "SshAllowedIp" WHERE "userId" = $1 AND "ipAddress" = $2`,
    userId,
    trimmedIp
  );
  if (existing.length > 0) {
    throw new Error("이미 등록된 IP입니다");
  }

  // Get user's instance SG
  const instance = await prisma.instance.findUnique({
    where: { userId },
    select: { securityGroupId: true },
  });

  if (!instance?.securityGroupId) {
    throw new Error("인스턴스가 없습니다. 인스턴스가 생성된 후 IP를 등록하세요.");
  }

  const cidr = `${trimmedIp}/32`;

  // If this is the first IP, remove the 0.0.0.0/0 rule
  if (currentCount === 0) {
    try {
      await ec2.send(
        new RevokeSecurityGroupIngressCommand({
          GroupId: instance.securityGroupId,
          IpPermissions: [
            {
              IpProtocol: "tcp",
              FromPort: 22,
              ToPort: 22,
              IpRanges: [{ CidrIp: "0.0.0.0/0" }],
            },
          ],
        })
      );
    } catch {
      // 0.0.0.0/0 rule may not exist — ignore
    }
  }

  // Add SG ingress rule
  try {
    await ec2.send(
      new AuthorizeSecurityGroupIngressCommand({
        GroupId: instance.securityGroupId,
        IpPermissions: [
          {
            IpProtocol: "tcp",
            FromPort: 22,
            ToPort: 22,
            IpRanges: [{ CidrIp: cidr, Description: `SSH allow ${trimmedIp}` }],
          },
        ],
      })
    );
  } catch (error: unknown) {
    // If rule already exists in SG, continue
    if (
      error instanceof Error &&
      "Code" in error &&
      (error as { Code: string }).Code === "InvalidPermission.Duplicate"
    ) {
      // Already exists — OK
    } else {
      throw new Error("보안그룹 규칙 추가에 실패했습니다");
    }
  }

  // Insert into DB
  const id = generateId();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "SshAllowedIp" (id, "userId", "ipAddress", "createdAt")
     VALUES ($1, $2, $3, NOW())`,
    id,
    userId,
    trimmedIp
  );

  revalidatePath("/dashboard");
  return { success: true };
}

export async function removeSshIp(ipId: string) {
  const session = await requireApprovedUser();
  const userId = session.user.id;

  // Find the IP record
  const rows = await prisma.$queryRawUnsafe<
    { id: string; ipAddress: string }[]
  >(
    `SELECT id, "ipAddress" FROM "SshAllowedIp" WHERE id = $1 AND "userId" = $2`,
    ipId,
    userId
  );

  if (rows.length === 0) {
    throw new Error("IP를 찾을 수 없습니다");
  }

  const ipAddress = rows[0].ipAddress;
  const cidr = `${ipAddress}/32`;

  // Get user's instance SG
  const instance = await prisma.instance.findUnique({
    where: { userId },
    select: { securityGroupId: true },
  });

  if (instance?.securityGroupId) {
    // Remove SG ingress rule
    try {
      await ec2.send(
        new RevokeSecurityGroupIngressCommand({
          GroupId: instance.securityGroupId,
          IpPermissions: [
            {
              IpProtocol: "tcp",
              FromPort: 22,
              ToPort: 22,
              IpRanges: [{ CidrIp: cidr }],
            },
          ],
        })
      );
    } catch {
      console.warn(`SG rule revoke failed for ${cidr}`);
    }
  }

  // Delete from DB
  await prisma.$executeRawUnsafe(
    `DELETE FROM "SshAllowedIp" WHERE id = $1 AND "userId" = $2`,
    ipId,
    userId
  );

  revalidatePath("/dashboard");
  return { success: true };
}
