package kr.byeongmin.stockdaejang.domain.history.dto

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import kr.byeongmin.stockdaejang.global.util.ifNullThrow
import java.math.BigDecimal
import java.time.OffsetDateTime

@Schema(description = "거래 내역")
data class TradeHistoryRowResponseDto(
	@field:Schema(
		description = "거래 ID",
		example = "1",
	)
	val id: Long,

	@field:Schema(
		description = "매수/매도 일시",
		example = "2026-08-20T09:30:00+09:00",
	)
	val executedAt: OffsetDateTime,

	@field:Schema(
		description = "종목명",
		example = "삼성전자",
	)
	val stockName: String,

	@field:Schema(
		description = "종목코드",
		example = "005930",
		pattern = "^[0-9A-Z]{6}$",
	)
	val stockCode: String,

	@field:Schema(
		description = "수량",
		example = "10",
	)
	val quantity: BigDecimal,

	@field:Schema(
		description = "당시 단가",
		example = "70000",
	)
	val unitPrice: BigDecimal,

	@field:Schema(
		description = "매수액 or 매도액 (수량 x 당시 단가)",
		example = "700000",
	)
	val amount: BigDecimal,

	@field:Schema(
		description = "소유주 ID",
		example = "1",
		minimum = "1",
	)
	val ownerId: Long,

	@field:Schema(
		description = "소유주",
		example = "병민",
	)
	val ownerName: String,

	@field:Schema(
		description = "거래 증권사 코드",
		example = "240",
		pattern = "^[0-9]{3}$",
	)
	val brokerageCode: String,

	@field:Schema(
		description = "거래 증권사명",
		example = "삼성증권",
	)
	val brokerageName: String,

	@field:Schema(
		description = "시장",
		example = "코스피",
	)
	val market: String,

	@get:JsonProperty("isEtf")
	@get:Schema(
		name = "isEtf",
		description = "ETF 여부",
		example = "false",
	)
	val isEtf: Boolean,

	@field:Schema(
		description = "손익. 매도 시 실현 손익이며 매수 시 null",
		example = "12345",
		nullable = true,
	)
	val realizedProfit: BigDecimal?,
) {
	companion object {
		fun from(trade: Trade): TradeHistoryRowResponseDto {
			return TradeHistoryRowResponseDto(
				id = trade.id.ifNullThrow(),
				executedAt = trade.executedAt,
				stockName = trade.stock.stockName,
				stockCode = trade.stock.stockCode,
				quantity = trade.quantity,
				unitPrice = trade.unitPrice,
				amount = trade.getActualTotalPrice(),
				ownerId = trade.owner.id.ifNullThrow(),
				ownerName = trade.owner.name,
				brokerageCode = trade.brokerage.code,
				brokerageName = trade.brokerage.name,
				market = trade.stock.market,
				isEtf = trade.stock.isEtf,
				realizedProfit = trade.realizedProfit,
			)
		}
	}
}
