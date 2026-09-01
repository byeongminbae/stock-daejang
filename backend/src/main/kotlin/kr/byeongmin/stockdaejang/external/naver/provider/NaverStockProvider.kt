package kr.byeongmin.stockdaejang.external.naver.provider

import io.github.oshai.kotlinlogging.KotlinLogging
import kr.byeongmin.stockdaejang.domain.stock.provider.ExternalStockProvider
import kr.byeongmin.stockdaejang.external.naver.dto.MarketPriceSnapshotDto
import kr.byeongmin.stockdaejang.external.naver.dto.NaverMarketPriceResponseDto
import kr.byeongmin.stockdaejang.external.naver.dto.NaverSearchResponseDto
import kr.byeongmin.stockdaejang.external.naver.dto.StockSearchResultDto
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient

@Component
class NaverStockProvider(
	private val restClient: RestClient,
) : ExternalStockProvider {
	private val logger = KotlinLogging.logger {}

	override val maxBatchSize: Int = 50

	override fun searchStock(stockName: String): List<StockSearchResultDto> {
		val searchResponse = try {
			restClient.get()
				.uri { builder ->
					builder.path("/search")
						.queryParam("page", 1)
						.queryParam("q", stockName)
						.queryParam("size", 30)
						.queryParam("target", "stock")
						.build()
				}
				.retrieve()
				.body(NaverSearchResponseDto::class.java)
				?: throw BusinessException(CommonError.EXTERNAL_API_ERROR)
		} catch (exception: Exception) {
			logger.error { exception }
			throw BusinessException(CommonError.EXTERNAL_API_ERROR)
		}

		if (!searchResponse.isSuccess) {
			throw BusinessException(CommonError.EXTERNAL_API_ERROR)
		}

		return searchResponse.result.items
			.map(StockSearchResultDto::from)
	}

	override fun getMarketPrices(stockCodes: List<String>): List<MarketPriceSnapshotDto> {
		val marketPriceResponse = try {
			restClient.get()
				.uri { builder ->
					builder.path("/realTime/marketPrice")
						.queryParam("endType", "stock")
						.queryParam("itemCodes", stockCodes.joinToString(","))
						.queryParam("stockType", "domestic")
						.build()
				}
				.retrieve()
				.body(NaverMarketPriceResponseDto::class.java)
				?: throw BusinessException(CommonError.EXTERNAL_API_ERROR)
		} catch (exception: Exception) {
			logger.error { exception }
			throw BusinessException(CommonError.EXTERNAL_API_ERROR)
		}

		if (!marketPriceResponse.isSuccess) {
			throw BusinessException(CommonError.EXTERNAL_API_ERROR)
		}

		return marketPriceResponse.result.datas
			.map(MarketPriceSnapshotDto::from)
	}
}
