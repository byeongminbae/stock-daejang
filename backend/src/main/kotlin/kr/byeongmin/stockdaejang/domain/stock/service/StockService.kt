package kr.byeongmin.stockdaejang.domain.stock.service

import kr.byeongmin.stockdaejang.domain.stock.dto.StockSearchItemResponseDto
import kr.byeongmin.stockdaejang.domain.stock.provider.StockSearchProvider
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.stereotype.Service

@Service
class StockService(
    private val stockSearchProvider: StockSearchProvider,
) {
    fun searchStocks(stockName: String): SuccessDataResponse<List<StockSearchItemResponseDto>> {
        val normalizedStockName = stockName.trim()

        val stockSearchItems = stockSearchProvider.search(normalizedStockName)
            .filter { it.isDomesticStock() }
            .map(StockSearchItemResponseDto::from)

        return SuccessDataResponse(stockSearchItems)
    }
}
