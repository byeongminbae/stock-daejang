package kr.byeongmin.stockdaejang.domain.history.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.Parameter
import io.swagger.v3.oas.annotations.tags.Tag
import kr.byeongmin.stockdaejang.domain.history.dto.StockStatusResponseDto
import kr.byeongmin.stockdaejang.domain.history.service.StockHistoryService
import kr.byeongmin.stockdaejang.domain.trade.types.TradeType
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping(value = ["/api/v1/history/stocks"], produces = [MediaType.APPLICATION_JSON_VALUE])
@Tag(name = "종목 내역", description = "거래 히스토리들을 기반으로 종목에 대한 정보 조회")
class StockHistoryController(
	private val stockHistoryService: StockHistoryService,
) {
	@GetMapping
	@Operation(
		summary = "특정 내역이 존재하는 종목만 조회",
		description = "매수 또는 매도 거래가 한 건이라도 있는 종목 목록을 조회",
	)
	fun getTradedStocks(
		@Parameter(description = "조회할 거래 구분입니다.", example = "BUY", required = true)
		@RequestParam tradeType: TradeType,
	): SuccessDataResponse<List<StockStatusResponseDto>> {
		return stockHistoryService.getTradedStocks(tradeType)
	}
}
