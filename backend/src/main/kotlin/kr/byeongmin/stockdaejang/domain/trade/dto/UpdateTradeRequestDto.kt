package kr.byeongmin.stockdaejang.domain.trade.dto

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Positive
import jakarta.validation.constraints.Size
import kr.byeongmin.stockdaejang.domain.common.validation.BROKERAGE_CODE_PATTERN
import kr.byeongmin.stockdaejang.domain.common.validation.BrokerageCode
import kr.byeongmin.stockdaejang.domain.common.validation.STOCK_CODE_PATTERN
import kr.byeongmin.stockdaejang.domain.common.validation.StockCode
import java.math.BigDecimal
import java.time.OffsetDateTime

@Schema(description = "기존 매수 또는 매도 거래 수정 요청. 모든 필드는 필수")
data class UpdateTradeRequestDto(
	@field:Schema(
		description = "수정할 거래 ID",
		minLength = 1,
		maxLength = 19,
		example = "1",
	)
	val id: Long,

	@field:Schema(
		description = "선택한 증권사 코드. 숫자 3자리이며 240은 삼성증권입니다.",
		pattern = BROKERAGE_CODE_PATTERN,
		example = "240",
	)
	@field:BrokerageCode
	val brokerageCode: String,

	@field:Schema(
		description = "거래 일시",
		example = "2026-08-20T09:30:00+09:00",
		format = "date-time",
	)
	val executedAt: OffsetDateTime,

	@get:JsonProperty("isEtf")
	@get:Schema(
		name = "isEtf",
		description = "선택한 종목이 ETF인지 여부",
		example = "false",
	)
	val isEtf: Boolean,

	@field:Schema(
		description = "종목코드",
		pattern = STOCK_CODE_PATTERN,
		example = "005930",
	)
	@field:StockCode
	val stockCode: String,

	@field:Schema(
		description = "시장명",
		minLength = 1,
		maxLength = 30,
		example = "코스피",
	)
	@field:NotBlank
	@field:Size(max = 30)
	val market: String,

	@field:Schema(
		description = "소유주 ID",
		minimum = "1",
		example = "1",
	)
	@field:Positive
	val ownerId: Long,

	@field:Schema(
		description = "거래 수량",
		minimum = "0",
		example = "10",
	)
	@field:Positive
	val quantity: BigDecimal,

	@field:Schema(
		description = "종목명",
		minLength = 1,
		maxLength = 100,
		example = "삼성전자",
	)
	@field:NotBlank
	@field:Size(max = 100)
	val stockName: String,

	@field:Schema(
		description = "당시 단가",
		minimum = "1",
		example = "75000",
	)
	@field:Positive
	val unitPrice: Long,
)
