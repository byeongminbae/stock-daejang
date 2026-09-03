package kr.byeongmin.stockdaejang.domain.owner.dto

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import kr.byeongmin.stockdaejang.domain.owner.entity.Owner

data class CreateOwnerRequestDto(
	@field:Schema(
		description = "소유주명(고유해야함)",
		example = "병민",
	)
	@field:NotBlank
	val name: String
) {
	fun to(): Owner {
		return Owner(
			name = name
		)
	}
}