package kr.byeongmin.stockdaejang.domain.stock.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import kr.byeongmin.stockdaejang.domain.stock.dto.GetStockSearchRequestDto
import kr.byeongmin.stockdaejang.domain.stock.dto.StockSearchItemResponseDto
import kr.byeongmin.stockdaejang.domain.stock.service.StockService
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springdoc.core.annotations.ParameterObject
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping(value = ["/api/v1/stocks"], produces = [MediaType.APPLICATION_JSON_VALUE])
@Tag(name = "종목", description = "거래에 입력할 종목명과 종목코드 검색")
class StockController(
    private val stockService: StockService
) {
    @GetMapping
    @Operation(
        summary = "종목 검색",
        description = "종목명 또는 종목코드로 국내 종목을 검색합니다. 검색어는 앞뒤 공백을 제거해 처리합니다.",
    )
    fun searchStocks(
        @Valid @ParameterObject getStockSearchRequestDto: GetStockSearchRequestDto,
    ): SuccessDataResponse<List<StockSearchItemResponseDto>> {
        return stockService.searchStocks(getStockSearchRequestDto.stockName)
    }
}
