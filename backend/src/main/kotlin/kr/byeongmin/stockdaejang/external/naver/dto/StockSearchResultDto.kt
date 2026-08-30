package kr.byeongmin.stockdaejang.external.naver.dto

import kr.byeongmin.stockdaejang.domain.common.validation.STOCK_CODE_PATTERN
import kr.byeongmin.stockdaejang.global.util.isNotNull

data class StockSearchResultDto(
    val code: String,

    val isEtf: Boolean?,

    val isStock: Boolean,

    val isKorean: Boolean,

    val hasDomesticStockPage: Boolean,

    val market: String,

    val name: String,
) {
    val hasValidStockCode: Boolean
        get() = Regex(STOCK_CODE_PATTERN).matches(code)

    fun isDomesticStock(): Boolean = isStock &&
            isKorean &&
            hasDomesticStockPage &&
            hasValidStockCode &&
            isEtf.isNotNull()
}
