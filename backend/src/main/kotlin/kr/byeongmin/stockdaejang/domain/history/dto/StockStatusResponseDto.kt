package kr.byeongmin.stockdaejang.domain.history.dto

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import kr.byeongmin.stockdaejang.domain.common.validation.STOCK_CODE_PATTERN
import kr.byeongmin.stockdaejang.domain.stock.entity.Stock

@Schema(description = "거래 내역의 '종목명 또는 종목코드' 필터에서 선택할 수 있는 매수 종목")
data class StockStatusResponseDto(
    @field:Schema(
        description = "종목코드",
        example = "005930",
        pattern = STOCK_CODE_PATTERN,
    )
    val code: String,

    @field:Schema(
        description = "종목명",
        example = "삼성전자",
    )
    val name: String,

    @field:Schema(
        description = "시장",
        example = "코스피",
    )
    val market: String,

    @get:JsonProperty("isEtf")
    @get:Schema(
        name = "isEtf",
        description = "ETF 여부",
        example = "false",
    )
    val isEtf: Boolean,
) {
    companion object {
        fun from(stock: Stock): StockStatusResponseDto {
            return StockStatusResponseDto(
                code = stock.stockCode,
                name = stock.stockName,
                market = stock.market,
                isEtf = stock.isEtf,
            )
        }
    }
}
