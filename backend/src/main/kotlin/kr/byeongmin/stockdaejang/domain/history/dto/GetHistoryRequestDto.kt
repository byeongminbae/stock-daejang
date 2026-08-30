package kr.byeongmin.stockdaejang.domain.history.dto

import io.swagger.v3.oas.annotations.Parameter
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.Size
import kr.byeongmin.stockdaejang.domain.common.validation.BrokerageCode
import kr.byeongmin.stockdaejang.domain.trade.enums.TradeType
import kr.byeongmin.stockdaejang.global.util.isNotNull
import java.time.OffsetDateTime

data class GetHistoryRequestDto(
    @field:Parameter(
        description = "조회할 거래 구분. ALL, BUY, SELL",
        example = "BUY",
        required = true
    )
    val side: TradeType,

    @field:Parameter(
        description = "종목명 또는 종목코드 검색어",
        example = "삼성전자"
    )
    @field:Size(max = 120)
    val stockNameOrCode: String?,

    @field:Parameter(description = "매수/매도 일시의 시작 경계 포함", example = "2026-08-01T00:00:00+09:00")
    val from: OffsetDateTime?,

    @field:Parameter(description = "매수/매도 일시의 종료 경계 미포함", example = "2026-08-21T00:00:00+09:00")
    val to: OffsetDateTime?,

    @field:Parameter(description = "소유주 아이디", example = "1")
    @field:Positive
    val ownerId: Long?,

    @field:Parameter(description = "증권사 코드", example = "240")
    @field:BrokerageCode
    val brokerageCode: String?,

    @field:Parameter(description = "페이지 번호", example = "1")
    @field:Positive
    val page: Int,

    @field:Parameter(description = "페이지당 건수", example = "25")
    @field:Positive
    val pageSize: Int,
) {
    fun hasFilters(): Boolean =
        stockNameOrCode.isNotNull()
                || from.isNotNull()
                || to.isNotNull()
                || ownerId.isNotNull()
                || brokerageCode.isNotNull()
}