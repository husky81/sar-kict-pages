import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 미종료 RunningLog 검색 중...\n')

  // stoppedAt이 null이고 인스턴스가 STOPPED 상태인 경우 찾기
  const problematicLogs = await prisma.runningLog.findMany({
    where: {
      stoppedAt: null,
      instance: {
        status: {
          in: ['STOPPED', 'TERMINATED', 'FAILED']
        }
      }
    },
    include: {
      instance: {
        select: {
          status: true,
          updatedAt: true,
          instanceId: true,
        }
      }
    }
  })

  console.log(`발견된 미종료 로그: ${problematicLogs.length}개\n`)

  if (problematicLogs.length === 0) {
    console.log('✅ 정리할 로그가 없습니다.')
    return
  }

  // 각 로그 출력
  problematicLogs.forEach((log, idx) => {
    console.log(`[${idx + 1}]`)
    console.log(`  Log ID: ${log.id}`)
    console.log(`  Started At: ${log.startedAt.toISOString()}`)
    console.log(`  Instance Status: ${log.instance.status}`)
    console.log(`  Instance ID: ${log.instance.instanceId || 'N/A'}`)
    console.log(`  Instance Updated At: ${log.instance.updatedAt.toISOString()}`)
    console.log()
  })

  // 수정 확인
  console.log('⚠️  위 로그들의 stoppedAt을 인스턴스의 updatedAt으로 설정하시겠습니까?')
  console.log('⚠️  이 작업은 되돌릴 수 없습니다!\n')

  // 실제 수정 (주석 해제하여 사용)
  console.log('🔧 수정 중...\n')

  for (const log of problematicLogs) {
    // 인스턴스의 updatedAt을 stoppedAt으로 사용
    const stoppedAt = log.instance.updatedAt

    await prisma.runningLog.update({
      where: { id: log.id },
      data: { stoppedAt }
    })

    const duration = Math.round((stoppedAt.getTime() - log.startedAt.getTime()) / 60000)

    console.log(`✅ 수정 완료: ${log.id}`)
    console.log(`   Started: ${log.startedAt.toISOString()}`)
    console.log(`   Stopped: ${stoppedAt.toISOString()}`)
    console.log(`   Duration: ${duration}분 (${Math.round(duration / 60 * 10) / 10}시간)\n`)
  }

  console.log(`\n🎉 총 ${problematicLogs.length}개 로그 수정 완료!`)
}

main()
  .catch((e) => {
    console.error('❌ 에러 발생:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
