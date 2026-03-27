import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TIMEZONE = "Asia/Seoul"

function getKSTDayKey(date: Date): string {
  return date.toLocaleDateString("sv-SE", { timeZone: TIMEZONE })
}

function getNextKSTMidnight(date: Date): Date {
  const kstDateStr = date.toLocaleString("en-US", { timeZone: TIMEZONE })
  const kstDate = new Date(kstDateStr)

  const nextDay = new Date(kstDate)
  nextDay.setDate(nextDay.getDate() + 1)
  nextDay.setHours(0, 0, 0, 0)

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })

  const parts = formatter.formatToParts(nextDay)
  const year = parts.find((p) => p.type === "year")!.value
  const month = parts.find((p) => p.type === "month")!.value
  const day = parts.find((p) => p.type === "day")!.value

  const kstMidnight = new Date(`${year}-${month}-${day}T00:00:00+09:00`)
  return kstMidnight
}

async function main() {
  console.log('🧪 비용 계산 테스트\n')

  const instances = await prisma.instance.findMany({
    include: {
      runningLogs: {
        orderBy: { startedAt: 'desc' },
        take: 5
      },
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })

  for (const instance of instances) {
    console.log(`\n👤 사용자: ${instance.user.name} (${instance.user.email})`)
    console.log(`   인스턴스 상태: ${instance.status}`)
    console.log(`   최근 RunningLog:`)

    if (instance.runningLogs.length === 0) {
      console.log('   (로그 없음)')
      continue
    }

    for (const log of instance.runningLogs) {
      const startKST = log.startedAt.toLocaleString('ko-KR', { timeZone: TIMEZONE })
      const stopKST = log.stoppedAt ? log.stoppedAt.toLocaleString('ko-KR', { timeZone: TIMEZONE }) : 'NULL'

      const startDay = getKSTDayKey(log.startedAt)
      const stopDay = log.stoppedAt ? getKSTDayKey(log.stoppedAt) : 'N/A'

      console.log(`   - ${log.id.slice(0, 8)}`)
      console.log(`     시작: ${startKST} (KST 날짜: ${startDay})`)
      console.log(`     종료: ${stopKST} (KST 날짜: ${stopDay})`)

      if (log.stoppedAt) {
        const durationMin = Math.round((log.stoppedAt.getTime() - log.startedAt.getTime()) / 60000)
        console.log(`     가동: ${durationMin}분 (${Math.round(durationMin / 60 * 10) / 10}시간)`)
      } else {
        console.log(`     ⚠️ stoppedAt NULL (인스턴스 ${instance.status})`)
      }
    }
  }

  console.log('\n✅ 테스트 완료')
}

main()
  .catch((e) => {
    console.error('❌ 에러:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
