package kr.byeongmin.stockdaejang.domain.stock.controller

import kr.byeongmin.stockdaejang.domain.stock.provider.ExternalStockProvider
import kr.byeongmin.stockdaejang.domain.stock.service.StockService
import kr.byeongmin.stockdaejang.external.naver.dto.MarketPriceSnapshotDto
import kr.byeongmin.stockdaejang.external.naver.dto.StockSearchResultDto
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import kr.byeongmin.stockdaejang.global.exception.GlobalExceptionHandler
import org.junit.jupiter.api.Test
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.test.web.servlet.setup.MockMvcBuilders

class StockControllerTest {
	@Test
	fun `rejects a query under two characters with a validation error`() {
		var invocationCount = 0
		val mockMvc = mockMvc(FakeExternalStockProvider {
			invocationCount += 1
			emptyList()
		})

		mockMvc.perform(get("/api/v1/stocks").param("stockName", "삼"))
			.andExpect(status().isBadRequest)
			.andExpect(jsonPath("$.success").value(false))
			.andExpect(jsonPath("$.statusCode").value("REQ_001"))

		kotlin.test.assertEquals(0, invocationCount)
	}

	@Test
	fun `returns stock item fields in the success envelope`() {
		val mockMvc = mockMvc(FakeExternalStockProvider {
			listOf(stockSearchResult())
		})

		mockMvc.perform(get("/api/v1/stocks").param("stockName", "삼성"))
			.andExpect(status().isOk)
			.andExpect(jsonPath("$.success").value(true))
			.andExpect(jsonPath("$.data[0].code").value("005930"))
			.andExpect(jsonPath("$.data[0].isEtf").value(false))
			.andExpect(jsonPath("$.data[0].market").value("코스피"))
			.andExpect(jsonPath("$.data[0].name").value("삼성전자"))
	}

	@Test
	fun `maps a typed Naver provider failure to the external API error response`() {
		val mockMvc = mockMvc(FakeExternalStockProvider {
			throw BusinessException(CommonError.EXTERNAL_API_ERROR)
		})

		mockMvc.perform(get("/api/v1/stocks").param("stockName", "삼성"))
			.andExpect(status().isBadGateway)
			.andExpect(jsonPath("$.success").value(false))
			.andExpect(jsonPath("$.statusCode").value("EXT_000"))
	}

	@Test
	fun `rejects a query over eighty characters with a validation error`() {
		var invocationCount = 0
		val mockMvc = mockMvc(FakeExternalStockProvider {
			invocationCount += 1
			emptyList()
		})

		mockMvc.perform(get("/api/v1/stocks").param("stockName", "가".repeat(81)))
			.andExpect(status().isBadRequest)
			.andExpect(jsonPath("$.success").value(false))
			.andExpect(jsonPath("$.statusCode").value("REQ_001"))

		kotlin.test.assertEquals(0, invocationCount)
	}

	private fun mockMvc(provider: ExternalStockProvider): MockMvc {
		return MockMvcBuilders
			.standaloneSetup(StockController(StockService(provider)))
			.setControllerAdvice(GlobalExceptionHandler())
			.build()
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

	private fun stockSearchResult(): StockSearchResultDto {
		return StockSearchResultDto(
			code = "005930",
			isEtf = false,
			isStock = true,
			isKorean = true,
			hasDomesticStockPage = true,
			market = "코스피",
			name = "삼성전자",
		)
	}
}
