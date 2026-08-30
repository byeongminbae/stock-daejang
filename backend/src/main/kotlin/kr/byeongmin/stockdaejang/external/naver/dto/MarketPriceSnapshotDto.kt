package kr.byeongmin.stockdaejang.external.naver.dto

import kr.byeongmin.stockdaejang.domain.stock.dto.MarketPriceDto
import kr.byeongmin.stockdaejang.domain.stock.enums.DomesticMarketSession
import kr.byeongmin.stockdaejang.global.util.ifNullThrow
import java.time.OffsetDateTime

data class MarketPriceSnapshotDto(
    val stockCode: String,
    val marketStatus: String,
    val stockName: String,
    val regularPrice: Long,
    val regularTradedAt: OffsetDateTime,
    val overPrice: Long?,
    val overTradedAt: OffsetDateTime?,
    val marketSession: DomesticMarketSession,
) {
    fun to(): MarketPriceDto? {
        return selectorsBySession[marketSession]?.invoke()
    }

    fun toRegularMarketPrice(selectedSession: DomesticMarketSession = marketSession): MarketPriceDto {
        return MarketPriceDto.of(
            marketPriceSnapshot = this,
            localTradedAt = regularTradedAt,
            price = regularPrice,
            marketSession = selectedSession,
        )
    }

    fun toOverMarketPrice(): MarketPriceDto {
        return MarketPriceDto.of(
            marketPriceSnapshot = this,
            localTradedAt = overTradedAt.ifNullThrow(),
            price = overPrice.ifNullThrow(),
            marketSession = marketSession,
        )
    }

    private val selectorsBySession: Map<DomesticMarketSession, () -> MarketPriceDto> = mapOf(
        DomesticMarketSession.PREOPEN to { toRegularMarketPrice() },
        DomesticMarketSession.REGULAR_MARKET to { toRegularMarketPrice() },
        DomesticMarketSession.PRE_MARKET to { toOverMarketPrice() },
    )
}
