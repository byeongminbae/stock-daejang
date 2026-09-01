package kr.byeongmin.stockdaejang.domain.stock.service

import kr.byeongmin.stockdaejang.domain.stock.dto.MarketPriceDto
import kr.byeongmin.stockdaejang.domain.stock.dto.MarketStockCodesDto
import kr.byeongmin.stockdaejang.domain.stock.provider.ExternalStockProvider
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import org.springframework.stereotype.Service
import java.time.Clock

@Service
class DomesticMarketPriceService(
	private val marketPriceProvider: ExternalStockProvider,
	private val clock: Clock = Clock.systemDefaultZone(),
) {
	fun getMarketPrices(marketStockCodesDto: MarketStockCodesDto): Map<String, MarketPriceDto> {
		if (sanityCheck(marketStockCodesDto)) return emptyMap()

		val normalizedStockCodes = marketStockCodesDto.normalizedStockCodes
		val chunkedStockCodes = normalizedStockCodes.chunked(marketPriceProvider.maxBatchSize)
		return chunkedStockCodes
			.flatMap { marketPriceProvider.getMarketPrices(it) }
			.associate { it.stockCode to it.toMarketPrice(clock) }
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
}
