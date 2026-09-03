package kr.byeongmin.stockdaejang.global.util

import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneId

val SEOUL_ZONE: ZoneId = ZoneId.of("Asia/Seoul")

fun seoulNow(): OffsetDateTime {
    return OffsetDateTime.now(SEOUL_ZONE)
}

fun LocalDate.atStartOfSeoulDay(): OffsetDateTime {
    return atStartOfDay(SEOUL_ZONE).toOffsetDateTime()
}
