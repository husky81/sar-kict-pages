import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 최근 RunningLog 확인
  const logs = await prisma.runningLog.findMany({
    orderBy: { startedAt: 'desc' },
    take: 10,
    include: {
      instance: {
        select: {
          status: true,
          userId: true,
        }
      }
    }
  })

  console.log('\n=== 최근 RunningLog 10개 ===')
  logs.forEach(log => {
    console.log({
      id: log.id.slice(0, 8),
      startedAt: log.startedAt.toISOString(),
      stoppedAt: log.stoppedAt?.toISOString() || 'NULL',
      instanceStatus: log.instance.status,
      isOpen: log.stoppedAt === null,
    })
  })

  // 미종료 로그 확인
  const openLogs = await prisma.runningLog.findMany({
    where: { stoppedAt: null },
    include: {
      instance: {
        select: {
          status: true,
          instanceId: true,
        }
      }
    }
  })

  console.log('\n=== stoppedAt = null인 로그 ===')
  console.log(`총 ${openLogs.length}개`)
  openLogs.forEach(log => {
    const now = new Date()
    const hours = (now.getTime() - log.startedAt.getTime()) / (1000 * 60 * 60)
    console.log({
      startedAt: log.startedAt.toISOString(),
      hoursAgo: Math.round(hours * 10) / 10,
      instanceStatus: log.instance.status,
      instanceId: log.instance.instanceId || 'N/A',
    })
  })
}

main().finally(() => prisma.$disconnect())
