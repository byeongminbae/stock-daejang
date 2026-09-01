package kr.byeongmin.stockdaejang.domain.stock.service

import kr.byeongmin.stockdaejang.domain.stock.provider.ExternalStockProvider
import kr.byeongmin.stockdaejang.external.naver.dto.MarketPriceSnapshotDto
import kr.byeongmin.stockdaejang.external.naver.dto.StockSearchResultDto
import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

class StockServiceTest {
	@Test
	fun `trims a valid query and maps only Korean domestic stock results with valid codes and ETF flags`() {
		var providerQuery = ""
		val service = StockService(FakeExternalStockProvider { query ->
			providerQuery = query
			listOf(
				result(code = "005930", isEtf = false),
				result(code = "AAPL", isKorean = false),
				result(code = "KOSPI", isStock = false),
				result(code = "123", hasDomesticStockPage = false),
				result(code = "000660", isEtf = null),
				result(code = "not-valid"),
			)
		})

		val response = service.searchStocks("  삼성  ")

		assertEquals("삼성", providerQuery)
		assertEquals(listOf("005930"), response.data.map { it.code })
	}

	private class FakeExternalStockProvider(
		private val onSearch: (String) -> List<StockSearchResultDto>,
	) : ExternalStockProvider {
		override val maxBatchSize: Int = 50

		override fun searchStock(stockName: String): List<StockSearchResultDto> = onSearch(stockName)

		override fun getMarketPrices(stockCodes: List<String>): List<MarketPriceSnapshotDto> {
			error("not used in this test")
		}
	}

	private fun result(
		code: String,
		isEtf: Boolean? = false,
		isStock: Boolean = true,
		isKorean: Boolean = true,
		hasDomesticStockPage: Boolean = true,
	): StockSearchResultDto {
		return StockSearchResultDto(
			code = code,
			isEtf = isEtf,
			isStock = isStock,
			isKorean = isKorean,
			hasDomesticStockPage = hasDomesticStockPage,
			market = "코스피",
			name = "종목",
		)
	}
}
