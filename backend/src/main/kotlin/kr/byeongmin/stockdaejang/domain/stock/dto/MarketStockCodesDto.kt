package kr.byeongmin.stockdaejang.domain.stock.dto

import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException

data class MarketStockCodesDto(val stockCodes: List<String>) {
    val normalizedStockCodes: List<String> = stockCodes.distinct()

    init {
        if (stockCodes.size > MAX_STOCK_CODES) {
            throw BusinessException(CommonError.INVALID_INPUT_VALUE)
        }
    }

    fun isEmpty(): Boolean {
        return normalizedStockCodes.isEmpty()
    }

    private companion object {
        const val MAX_STOCK_CODES = 500
    }
}
