package kr.byeongmin.stockdaejang.domain.stock.provider

import kr.byeongmin.stockdaejang.external.naver.dto.MarketPriceSnapshotDto
import kr.byeongmin.stockdaejang.external.naver.dto.StockSearchResultDto

interface ExternalStockProvider {
	val maxBatchSize: Int

	fun searchStock(stockName: String): List<StockSearchResultDto>

	fun getMarketPrices(stockCodes: List<String>): List<MarketPriceSnapshotDto>
}
