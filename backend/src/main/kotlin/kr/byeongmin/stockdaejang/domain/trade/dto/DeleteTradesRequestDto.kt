package kr.byeongmin.stockdaejang.domain.trade.dto

import io.swagger.v3.oas.annotations.media.ArraySchema
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Size

@Schema(description = "선택한 거래 삭제 요청. 필드는 필수")
data class DeleteTradesRequestDto(
	@field:ArraySchema(
		arraySchema = Schema(
			description = "삭제할 거래 ID 목록.",
			example = "[\"1\", \"2\"]",
		),
		minItems = 1,
		uniqueItems = true,
		schema = Schema(
			description = "거래 ID",
			minLength = 1,
			maxLength = 19,
			pattern = "^[1-9][0-9]{0,18}$",
			example = "1",
		),
	)
	@field:Size(min = 1)
	val tradeIds: List<Long>,
)
