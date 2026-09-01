package kr.byeongmin.stockdaejang.domain.trade.dto

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.Positive
import kr.byeongmin.stockdaejang.domain.common.validation.BROKERAGE_CODE_PATTERN
import kr.byeongmin.stockdaejang.domain.common.validation.BrokerageCode
import kr.byeongmin.stockdaejang.domain.common.validation.STOCK_CODE_PATTERN
import kr.byeongmin.stockdaejang.domain.common.validation.StockCode
import kr.byeongmin.stockdaejang.domain.trade.types.TradeType
import java.math.BigDecimal
import java.time.OffsetDateTime

@Schema(description = "거래 입력 전 매수액/매도액, 보유 수량, 매수평균단가와 예상 손익을 확인하는 요청")
data class TradePreviewRequestDto(
	@field:Schema(
		description = "선택한 증권사 코드",
		pattern = BROKERAGE_CODE_PATTERN,
		example = "240",
	)
	@field:BrokerageCode
	val brokerageCode: String,

	@field:Schema(
		description = "종목코드",
		pattern = STOCK_CODE_PATTERN,
		example = "005930",
	)
	@field:StockCode
	val stockCode: String,

	@field:Schema(
		description = "거래 일시. 이 시점 직전까지의 보유 수량/매수평균단가를 기준으로 계산",
		example = "2026-08-20T09:30:00+09:00",
		format = "date-time",
	)
	val executedAt: OffsetDateTime,

	@field:Schema(
		description = "소유주 ID",
		minimum = "1",
		example = "1",
	)
	@field:Positive
	val ownerId: Long,

	@field:Schema(
		description = "거래 수량. 해외주식 등 소수점 체결을 위해 소수 허용",
		minimum = "0",
		example = "10",
	)
	@field:Positive
	val quantity: BigDecimal,

	@field:Schema(
		description = "거래 구분",
		example = "SELL",
	)
	val side: TradeType,

	@field:Schema(
		description = "당시 단가",
		minimum = "1",
		example = "75000",
	)
	@field:Positive
	val unitPrice: BigDecimal,
)
