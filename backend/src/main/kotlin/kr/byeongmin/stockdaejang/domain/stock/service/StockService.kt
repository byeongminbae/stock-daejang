package kr.byeongmin.stockdaejang.domain.stock.service

import kr.byeongmin.stockdaejang.domain.stock.dto.StockSearchItemResponseDto
import kr.byeongmin.stockdaejang.domain.stock.provider.ExternalStockProvider
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.stereotype.Service

@Service
class StockService(
    private val externalStockProvider: ExternalStockProvider,
) {
    fun searchStocks(stockName: String): SuccessDataResponse<List<StockSearchItemResponseDto>> {
        val normalizedStockName = stockName.trim()

        val stockSearchItems = externalStockProvider.searchStock(normalizedStockName)
            .filter { it.isDomesticStock() }
            .map(StockSearchItemResponseDto::from)

        return SuccessDataResponse(stockSearchItems)
    }
}
