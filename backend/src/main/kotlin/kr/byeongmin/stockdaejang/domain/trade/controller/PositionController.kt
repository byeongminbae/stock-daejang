package kr.byeongmin.stockdaejang.domain.trade.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import kr.byeongmin.stockdaejang.domain.trade.dto.GetPositionAverageRequestDto
import kr.byeongmin.stockdaejang.domain.trade.dto.PositionAverageResponseDto
import kr.byeongmin.stockdaejang.domain.trade.service.PositionService
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springdoc.core.annotations.ParameterObject
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping(value = ["/api/v1/positions"], produces = [MediaType.APPLICATION_JSON_VALUE])
@Tag(name = "포지션", description = "소유주-증권사-종목별 정보")
class PositionController(
    private val positionService: PositionService
) {
    @GetMapping("/average")
    @Operation(
        summary = "보유 수량과 매수평균단가 조회",
        description = "소유주-증권사-종목코드로 현재 보유 수량과 매수평균단가를 조회합니다. 세 파라미터는 모두 필수이며 하나라도 누락하면 400 오류를 반환합니다.",
    )
    fun getPositionAverage(
        @Valid @ParameterObject getPositionAverageRequestDto: GetPositionAverageRequestDto,
    ): SuccessDataResponse<PositionAverageResponseDto> {
        return positionService.getPositionAverage(getPositionAverageRequestDto)
    }
}
