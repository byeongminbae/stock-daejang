package kr.byeongmin.stockdaejang.domain.stock.dto

import io.swagger.v3.oas.annotations.Parameter
import jakarta.validation.constraints.Size

data class GetStockSearchRequestDto(
	@field:Parameter(
		description = "종목명 또는 종목코드 검색어",
		example = "삼성전자",
		required = true,
	)
	@field:Size(min = 2, max = 80)
	val stockName: String,
)