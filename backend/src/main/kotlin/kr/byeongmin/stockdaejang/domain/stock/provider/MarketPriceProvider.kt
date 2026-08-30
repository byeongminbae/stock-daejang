package kr.byeongmin.stockdaejang.domain.stock.provider

import kr.byeongmin.stockdaejang.external.naver.dto.MarketPriceSnapshotDto

interface MarketPriceProvider {
    val maxBatchSize: Int

    fun fetchMarketPrices(stockCodes: List<String>): List<MarketPriceSnapshotDto>
}
