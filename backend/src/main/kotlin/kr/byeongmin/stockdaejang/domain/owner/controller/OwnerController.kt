package kr.byeongmin.stockdaejang.domain.owner.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import kr.byeongmin.stockdaejang.domain.brokerage.dto.BrokerageResponseDto
import kr.byeongmin.stockdaejang.domain.owner.dto.OwnerResponseDto
import kr.byeongmin.stockdaejang.domain.owner.service.OwnerService
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import kr.byeongmin.stockdaejang.global.response.SuccessResponse
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping(value = ["/api/v1/owners"], produces = [MediaType.APPLICATION_JSON_VALUE])
@Tag(name = "소유주")
class OwnerController(
	private val ownerService: OwnerService,
) {
	@GetMapping
	@Operation(summary = "소유주 목록 조회")
	fun getList(): SuccessDataResponse<List<OwnerResponseDto>> {
		return ownerService.getList()
	}

	@GetMapping("/{ownerId}/brokerages")
	@Operation(summary = "소유주가 자주 쓰는 증권사 목록 조회")
	fun getFavoriteBrokerages(
		@PathVariable ownerId: Long,
	): SuccessDataResponse<List<BrokerageResponseDto>> {
		return ownerService.getFavoriteBrokerages(ownerId)
	}

	@PostMapping("/{ownerId}/brokerages/{brokerageCode}")
	@Operation(summary = "소유주가 자주 쓰는 증권사 추가")
	fun addFavoriteBrokerage(
		@PathVariable ownerId: Long,
		@PathVariable brokerageCode: String
	): SuccessResponse {
		return ownerService.addFavoriteBrokerage(ownerId, brokerageCode)
	}

	@DeleteMapping("/{ownerId}/brokerages/{brokerageCode}")
	@Operation(summary = "소유주가 자주 쓰는 증권사 삭제")
	fun deleteFavoriteBrokerage(
		@PathVariable ownerId: Long,
		@PathVariable brokerageCode: String
	): SuccessResponse {
		return ownerService.deleteFavoriteBrokerage(ownerId, brokerageCode)
	}
}
