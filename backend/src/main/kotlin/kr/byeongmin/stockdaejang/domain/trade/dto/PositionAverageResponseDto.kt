package kr.byeongmin.stockdaejang.domain.trade.dto

import io.swagger.v3.oas.annotations.media.Schema
import java.math.BigDecimal

@Schema(description = "선택한 소유주-증권사-종목의 보유 수량과 매수평균단가")
data class PositionAverageResponseDto(
	@field:Schema(
		description = "현재 보유 수량",
		example = "10",
	)
	val heldQuantity: BigDecimal,

	@field:Schema(
		description = "매수평균단가",
		nullable = true,
		example = "71200",
	)
	val averageBuyPrice: BigDecimal,
)
