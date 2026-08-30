package kr.byeongmin.stockdaejang.domain.brokerage.dto

import io.swagger.v3.oas.annotations.media.Schema
import kr.byeongmin.stockdaejang.domain.brokerage.entity.Brokerage
import kr.byeongmin.stockdaejang.domain.common.validation.BROKERAGE_CODE_PATTERN

@Schema(description = "거래 기록 저장 또는 조회 필터에서 선택하는 증권사 정보")
data class BrokerageResponseDto(
    @field:Schema(
        description = "증권사 코드",
        example = "240",
        pattern = BROKERAGE_CODE_PATTERN,
    )
    val code: String,

    @field:Schema(
        description = "증권사명",
        example = "삼성증권",
    )
    val name: String,
) {
    companion object {
        fun from(brokerage: Brokerage): BrokerageResponseDto {
            return BrokerageResponseDto(
                code = brokerage.code,
                name = brokerage.name,
            )
        }
    }
}
