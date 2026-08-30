package kr.byeongmin.stockdaejang.domain.stock.service

import kr.byeongmin.stockdaejang.domain.stock.dto.MarketStockCodesDto
import kr.byeongmin.stockdaejang.domain.stock.dto.MarketPriceDto
import kr.byeongmin.stockdaejang.domain.stock.enums.DomesticMarketSession
import kr.byeongmin.stockdaejang.domain.stock.provider.MarketPriceProvider
import kr.byeongmin.stockdaejang.external.naver.dto.MarketPriceSnapshotDto
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import kr.byeongmin.stockdaejang.global.util.atStartOfSeoulDay
import kr.byeongmin.stockdaejang.global.util.ifNullThrow
import org.springframework.stereotype.Service
import java.time.Clock

@Service
class DomesticMarketPriceService(
    private val marketPriceProvider: MarketPriceProvider,
    private val clock: Clock = Clock.systemDefaultZone(),
) {
    fun getMarketPrices(marketStockCodesDto: MarketStockCodesDto): Map<String, MarketPriceDto> {
        if (sanityCheck(marketStockCodesDto)) return emptyMap()

        val normalizedStockCodes = marketStockCodesDto.normalizedStockCodes
        val chunkedStockCodes = normalizedStockCodes.chunked(marketPriceProvider.maxBatchSize)
        val marketPricesByStockCode = chunkedStockCodes
            .flatMap {
                marketPriceProvider.fetchMarketPrices(it)
            }.associate {
                it.stockCode to selectMarketPrice(it)
            }

        return normalizedStockCodes.associateWithTo(linkedMapOf()) { stockCode ->
            marketPricesByStockCode.getValue(stockCode)
        }
    }

    private fun sanityCheck(marketStockCodesDto: MarketStockCodesDto): Boolean {
        if (marketStockCodesDto.normalizedStockCodes.isEmpty()) {
            return true
        }

        if (marketPriceProvider.maxBatchSize <= 0) {
            throw BusinessException(CommonError.INTERNAL_SERVER_ERROR)
        }
        return false
    }

    private fun selectMarketPrice(marketPriceSnapshot: MarketPriceSnapshotDto): MarketPriceDto {
        return marketPriceSnapshot.to()
            ?: selectAfterMarketPrice(marketPriceSnapshot)
    }

    private fun selectAfterMarketPrice(marketPriceSnapshot: MarketPriceSnapshotDto): MarketPriceDto {
        val overTradedAt = marketPriceSnapshot.overTradedAt.ifNullThrow()
        val expiresAt = overTradedAt
            .toLocalDate()
            .plusDays(1)
            .atStartOfSeoulDay()
            .plusHours(AFTER_MARKET_EXPIRY_HOUR)
        return if (clock.instant().isBefore(expiresAt.toInstant())) {
            marketPriceSnapshot.toOverMarketPrice()
        } else {
            marketPriceSnapshot.toRegularMarketPrice(DomesticMarketSession.REGULAR_MARKET)
        }
    }

    private companion object {
        const val AFTER_MARKET_EXPIRY_HOUR = 3L
    }
}
