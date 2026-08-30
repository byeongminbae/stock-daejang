package kr.byeongmin.stockdaejang.domain.stock.dto

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import kr.byeongmin.stockdaejang.domain.common.validation.STOCK_CODE_PATTERN
import kr.byeongmin.stockdaejang.external.naver.dto.StockSearchResultDto
import kr.byeongmin.stockdaejang.global.util.ifNullThrow

@Schema(description = "종목 검색 결과")
data class StockSearchItemResponseDto(
    @field:Schema(
        description = "종목코드",
        example = "005930",
        pattern = STOCK_CODE_PATTERN,
    )
    val code: String,

    @get:JsonProperty("isEtf")
    @get:Schema(
        name = "isEtf",
        description = "ETF 여부",
        example = "false",
    )
    val isEtf: Boolean,

    @field:Schema(
        description = "시장",
        example = "코스피",
    )
    val market: String,

    @field:Schema(
        description = "종목명",
        example = "삼성전자",
    )
    val name: String,
) {
    companion object {
        fun from(stockSearchResult: StockSearchResultDto): StockSearchItemResponseDto {
            return StockSearchItemResponseDto(
                code = stockSearchResult.code,
                isEtf = stockSearchResult.isEtf.ifNullThrow(),
                market = stockSearchResult.market,
                name = stockSearchResult.name,
            )
        }
    }
}
