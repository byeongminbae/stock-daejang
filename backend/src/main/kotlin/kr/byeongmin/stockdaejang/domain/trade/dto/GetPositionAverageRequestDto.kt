package kr.byeongmin.stockdaejang.domain.trade.dto

import io.swagger.v3.oas.annotations.Parameter
import jakarta.validation.constraints.Positive
import kr.byeongmin.stockdaejang.domain.common.validation.BrokerageCode
import kr.byeongmin.stockdaejang.domain.common.validation.StockCode

data class GetPositionAverageRequestDto(
	@field:Parameter(description = "소유주 ID", example = "1", required = true)
	@field:Positive
	val ownerId: Long,

	@field:Parameter(description = "증권사 코드", example = "240", required = true)
	@field:BrokerageCode
	val brokerageCode: String,

	@field:Parameter(
		description = "종목코드",
		example = "005930",
		required = true
	)
	@field:StockCode
	val stockCode: String,
)
