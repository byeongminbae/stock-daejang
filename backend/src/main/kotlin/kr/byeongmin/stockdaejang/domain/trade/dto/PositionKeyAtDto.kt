package kr.byeongmin.stockdaejang.domain.trade.dto

import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import java.time.OffsetDateTime

data class PositionKeyAtDto(
	val positionKeyDto: PositionKeyDto,
	val executedAt: OffsetDateTime,
) {
	companion object {
		fun from(positionKeyDto: PositionKeyDto, trade: Trade): PositionKeyAtDto {
			return PositionKeyAtDto(
				positionKeyDto = positionKeyDto,
				executedAt = trade.executedAt
			)
		}

		fun from(trade: Trade): PositionKeyAtDto {
			return PositionKeyAtDto(
				positionKeyDto = PositionKeyDto.from(trade),
				executedAt = trade.executedAt
			)
		}
	}
}
