package kr.byeongmin.stockdaejang.domain.trade.dto

import io.swagger.v3.oas.annotations.media.Schema
import java.math.BigDecimal

@Schema(description = "거래 입력값으로 미리 계산한 매수액/매도액, 보유 수량, 매수평균단가와 예상 손익")
data class TradePreviewResponseDto(
	@field:Schema(
		description = "수량 x 당시 단가로 계산한 매수액 또는 매도액",
		example = "750000",
	)
	val amount: BigDecimal,

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

	@field:Schema(
		description = "매도일 때만 계산되는 예상 손익. 매수면 null",
		nullable = true,
		example = "38000",
	)
	val expectedProfit: BigDecimal?,
)
