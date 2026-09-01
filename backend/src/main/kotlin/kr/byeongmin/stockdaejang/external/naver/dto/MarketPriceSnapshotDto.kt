package kr.byeongmin.stockdaejang.external.naver.dto

import kr.byeongmin.stockdaejang.domain.stock.dto.MarketPriceDto
import kr.byeongmin.stockdaejang.domain.stock.types.DomesticMarketSession
import kr.byeongmin.stockdaejang.global.util.atStartOfSeoulDay
import kr.byeongmin.stockdaejang.global.util.ifNullThrow
import java.math.BigDecimal
import java.time.Clock
import java.time.OffsetDateTime

data class MarketPriceSnapshotDto(
	val stockCode: String,
	val stockName: String,
	val regularPrice: BigDecimal,
	val regularTradedAt: OffsetDateTime,
	val overPrice: BigDecimal?,
	val overTradedAt: OffsetDateTime?,
	val marketSession: DomesticMarketSession,
) {
	fun toMarketPrice(clock: Clock): MarketPriceDto {
		return when (marketSession) {
			DomesticMarketSession.PREOPEN,
			DomesticMarketSession.REGULAR_MARKET -> {
				toRegularMarketPrice()
			}

			DomesticMarketSession.PRE_MARKET -> {
				toOverMarketPrice()
			}

			DomesticMarketSession.AFTER_MARKET -> {
				toAfterMarketPrice(clock)
			}
		}
	}

	private fun toAfterMarketPrice(clock: Clock): MarketPriceDto {
		val afterMarketExpiryHour = 3L
		val overTradedAt = overTradedAt.ifNullThrow()
		val expiresAt = overTradedAt
			.toLocalDate()
			.plusDays(1)
			.atStartOfSeoulDay()
			.plusHours(afterMarketExpiryHour)
			.toInstant()

		return if (clock.instant().isBefore(expiresAt)) {
			toOverMarketPrice() // afterMarketExpiryHour 시간 기점으로 전환
		} else {
			MarketPriceDto.of(
				marketPriceSnapshot = this,
				localTradedAt = regularTradedAt,
				price = regularPrice,
				marketSession = DomesticMarketSession.REGULAR_MARKET,
			)
		}
	}

	private fun toRegularMarketPrice(): MarketPriceDto {
		return MarketPriceDto.of(
			marketPriceSnapshot = this,
			localTradedAt = regularTradedAt,
			price = regularPrice,
			marketSession = marketSession,
		)
	}

	private fun toOverMarketPrice(): MarketPriceDto {
		return MarketPriceDto.of(
			marketPriceSnapshot = this,
			localTradedAt = overTradedAt.ifNullThrow(),
			price = overPrice.ifNullThrow(),
			marketSession = marketSession,
		)
	}

	companion object {
		internal fun from(item: NaverMarketPriceResponseDto.ItemDto): MarketPriceSnapshotDto {
			val stockCode = item.stockCode
			val overMarketPriceInfo = item.overMarketPriceInfo
			return MarketPriceSnapshotDto(
				stockCode = stockCode,
				stockName = item.stockName,
				regularPrice = parsePrice(item.closePriceRaw),
				regularTradedAt = item.localTradedAt,
				overPrice = overMarketPriceInfo?.let { parsePrice(it.overPrice) },
				overTradedAt = overMarketPriceInfo?.localTradedAt,
				marketSession = getMarketSession(overMarketPriceInfo),
			)
		}

		private fun getMarketSession(overMarketPriceInfo: NaverMarketPriceResponseDto.OverMarketPriceInfoDto?): DomesticMarketSession =
			DomesticMarketSession.entries.firstOrNull {
				it.name == overMarketPriceInfo?.tradingSessionType
			} ?: DomesticMarketSession.REGULAR_MARKET

		private fun parsePrice(rawPrice: String): BigDecimal {
			return rawPrice.replace(",", "").toBigDecimalOrNull()
				?: BigDecimal.ZERO
		}

	}
}
