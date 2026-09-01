package kr.byeongmin.stockdaejang.domain.trade.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import kr.byeongmin.stockdaejang.domain.trade.dto.*
import kr.byeongmin.stockdaejang.domain.trade.service.TradeService
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import kr.byeongmin.stockdaejang.global.response.SuccessResponse
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping(value = ["/api/v1/trades"], produces = [MediaType.APPLICATION_JSON_VALUE])
@Tag(name = "매수/매도 거래")
class TradeController(
	private val tradeService: TradeService,
) {
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@Operation(summary = "거래 등록")
	fun createTrade(
		@Valid @RequestBody createTradeRequestDto: CreateTradeRequestDto
	): SuccessDataResponse<Long> {
		return tradeService.createTrade(createTradeRequestDto)
	}

	@PutMapping("/{tradeId}")
	@Operation(summary = "거래 수정")
	fun updateTrade(
		@Parameter(description = "수정할 거래 ID", example = "1", required = true)
		@PathVariable tradeId: Long,
		@Valid @RequestBody updateTradeRequestDto: UpdateTradeRequestDto
	): SuccessResponse {
		return tradeService.updateTrade(tradeId, updateTradeRequestDto)
	}

	@DeleteMapping
	@Operation(summary = "거래 삭제")
	fun deleteTrades(
		@Valid @RequestBody deleteTradesRequestDto: DeleteTradesRequestDto
	): SuccessResponse {
		return tradeService.deleteTrades(deleteTradesRequestDto)
	}

	@PostMapping("/preview")
	@Operation(summary = "거래 예상 손익 미리보기")
	fun previewTrade(
		@Valid @RequestBody tradePreviewRequestDto: TradePreviewRequestDto
	): SuccessDataResponse<TradePreviewResponseDto> {
		return tradeService.previewTrade(tradePreviewRequestDto)
	}
}
