package kr.byeongmin.stockdaejang.domain.stock.dto

import kr.byeongmin.stockdaejang.domain.stock.enums.MarketSession
import kr.byeongmin.stockdaejang.external.naver.dto.MarketPriceSnapshotDto
import java.time.OffsetDateTime

data class MarketPriceDto(
    val stockCode: String,
    val localTradedAt: OffsetDateTime,
    val price: Long,
    val marketSession: MarketSession,
    val stockName: String,
) {
    companion object {
        fun of(
            marketPriceSnapshot: MarketPriceSnapshotDto,
            localTradedAt: OffsetDateTime,
            price: Long,
            marketSession: MarketSession,
        ): MarketPriceDto {
            return MarketPriceDto(
                stockCode = marketPriceSnapshot.stockCode,
                localTradedAt = localTradedAt,
                price = price,
                marketSession = marketSession,
                stockName = marketPriceSnapshot.stockName,
            )
        }
    }
}
