package kr.byeongmin.stockdaejang.domain.history.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import kr.byeongmin.stockdaejang.domain.history.dto.GetHistoryRequestDto
import kr.byeongmin.stockdaejang.domain.history.dto.TradeHistoryResponseDto
import kr.byeongmin.stockdaejang.domain.history.service.TradeHistoryService
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springdoc.core.annotations.ParameterObject
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping(value = ["/api/v1/history/trades"], produces = [MediaType.APPLICATION_JSON_VALUE])
@Tag(name = "거래 내역")
class TradeHistoryController(
    private val tradeHistoryService: TradeHistoryService,
) {
    @GetMapping
    @Operation(
        summary = "매수/매도 거래 내역을 페이지 단위로 조회",
        description = "매수 또는 매도 거래 내역을 선택한 필터와 페이지 크기로 조회합니다. 선택 필터가 형식에 맞지 않으면 400 오류가 발생합니다.",
    )
    fun getHistory(
        @Valid @ParameterObject getHistoryRequestDto: GetHistoryRequestDto,
    ): SuccessDataResponse<TradeHistoryResponseDto> {
        return tradeHistoryService.getHistory(getHistoryRequestDto)
    }
}
