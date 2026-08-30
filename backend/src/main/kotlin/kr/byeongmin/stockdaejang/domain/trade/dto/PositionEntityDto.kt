package kr.byeongmin.stockdaejang.domain.trade.dto

import kr.byeongmin.stockdaejang.domain.brokerage.entity.Brokerage
import kr.byeongmin.stockdaejang.domain.owner.entity.Owner
import kr.byeongmin.stockdaejang.domain.stock.entity.Stock
import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import kr.byeongmin.stockdaejang.global.util.ifNullThrow
import java.time.OffsetDateTime

data class PositionEntityDto(
	val owner: Owner,
	val brokerage: Brokerage,
	val stock: Stock,
	val executedAt: OffsetDateTime,
) {
	val ownerId: Long get() = owner.id
	val brokerageId: Long get() = brokerage.id.ifNullThrow()
	val stockCode: String get() = stock.stockCode

	fun toPositionKeyDto(): PositionKeyDto = PositionKeyDto(ownerId, brokerageId, stockCode)
	fun toPositionKeyAtDto(): PositionKeyAtDto = PositionKeyAtDto(toPositionKeyDto(), executedAt)

	companion object {
		fun from(trade: Trade): PositionEntityDto {
			return PositionEntityDto(trade.owner, trade.brokerage, trade.stock, trade.executedAt)
		}
	}
}