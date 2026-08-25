package kr.byeongmin.stockdaejang.global.util

import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneId

val SEOUL_ZONE: ZoneId = ZoneId.of("Asia/Seoul")

fun seoulNow(): OffsetDateTime = OffsetDateTime.now(SEOUL_ZONE)

fun LocalDate.atStartOfSeoulDay(): OffsetDateTime = atStartOfDay(SEOUL_ZONE).toOffsetDateTime()
