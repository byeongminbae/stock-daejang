package kr.byeongmin.stockdaejang.domain.trade.dto

import kr.byeongmin.stockdaejang.domain.dashboard.entity.DashboardPosition
import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import kr.byeongmin.stockdaejang.global.util.ifNullThrow

data class PositionKeyDto(
	val ownerId: Long,
	val brokerageId: Long,
	val stockCode: String
) {
	companion object {
		fun from(trade: Trade): PositionKeyDto {
			return PositionKeyDto(
				ownerId = trade.owner.id,
				brokerageId = trade.brokerage.id.ifNullThrow(),
				stockCode = trade.stock.stockCode
			)
		}

		fun from(dashboardPosition: DashboardPosition): PositionKeyDto {
			return PositionKeyDto(
				ownerId = dashboardPosition.owner.id,
				brokerageId = dashboardPosition.brokerage.id.ifNullThrow(),
				stockCode = dashboardPosition.stock.stockCode
			)
		}
	}
}