package kr.byeongmin.stockdaejang.domain.brokerage.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import kr.byeongmin.stockdaejang.domain.brokerage.dto.BrokerageResponseDto
import kr.byeongmin.stockdaejang.domain.brokerage.service.BrokerageService
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController


@RestController
@RequestMapping(value = ["/api/v1/brokerages"], produces = [MediaType.APPLICATION_JSON_VALUE])
@Tag(name = "증권사")
class BrokerageController(
    private val brokerageService: BrokerageService,
) {
    @GetMapping
    @Operation(summary = "증권사 목록 조회")
    fun getList(): SuccessDataResponse<List<BrokerageResponseDto>> {
        return brokerageService.getList()
    }
}
