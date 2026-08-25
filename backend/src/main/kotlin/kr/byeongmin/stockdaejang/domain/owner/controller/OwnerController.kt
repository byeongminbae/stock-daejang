package kr.byeongmin.stockdaejang.domain.owner.controller

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import kr.byeongmin.stockdaejang.domain.owner.dto.OwnerResponseDto
import kr.byeongmin.stockdaejang.domain.owner.service.OwnerService
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.http.MediaType
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

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
}
