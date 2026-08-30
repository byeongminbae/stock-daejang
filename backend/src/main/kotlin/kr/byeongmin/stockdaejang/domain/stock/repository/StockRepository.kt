package kr.byeongmin.stockdaejang.domain.stock.repository

import kr.byeongmin.stockdaejang.domain.stock.entity.Stock
import kr.byeongmin.stockdaejang.global.repository.BaseJpaRepository

interface StockRepository : BaseJpaRepository<Stock, Long> {
    fun findByStockCode(stockCode: String): Stock?

    fun findAllByStockCodeIn(stockCodes: List<String>): List<Stock>
}
