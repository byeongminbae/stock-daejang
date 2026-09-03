package kr.byeongmin.stockdaejang.domain.trade.types

import io.swagger.v3.oas.annotations.media.Schema
import kr.byeongmin.stockdaejang.domain.common.util.zeroOr
import kr.byeongmin.stockdaejang.domain.trade.dto.PositionSnapshot
import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import kr.byeongmin.stockdaejang.global.exception.BusinessException

enum class TradeType {
	@Schema(description = "매수")
	BUY {
		override fun apply(trade: Trade, accumulatedSnapshot: PositionSnapshot): PositionSnapshot {
			return PositionSnapshot(
				remainingQuantitySnapshot = accumulatedSnapshot.remainingQuantitySnapshot + trade.quantity,
				remainingCostSnapshot = accumulatedSnapshot.remainingCostSnapshot + trade.getActualTotalPrice(),
			)
		}
	},

	@Schema(description = "매도")
	SELL {
		override fun apply(trade: Trade, accumulatedSnapshot: PositionSnapshot): PositionSnapshot {
			if (accumulatedSnapshot.isQuantityExceeded(trade.quantity)) {
				throw BusinessException(
					TradeErrorType.INSUFFICIENT_HOLDING,
					mapOf("quantity" to TradeErrorType.INSUFFICIENT_HOLDING.message),
				)
			}

			val boughtCost = trade.updateSellTrade(accumulatedSnapshot)

			val remainingQuantitySnapshot = accumulatedSnapshot.remainingQuantitySnapshot - trade.quantity
			val remainingCostSnapshot =
				remainingQuantitySnapshot.zeroOr(accumulatedSnapshot.remainingCostSnapshot - boughtCost)
			return PositionSnapshot(remainingQuantitySnapshot, remainingCostSnapshot)
		}
	};

	abstract fun apply(trade: Trade, accumulatedSnapshot: PositionSnapshot): PositionSnapshot

	fun isBuy(): Boolean {
		return this == BUY
	}

	fun isSell(): Boolean {
		return this == SELL
	}
}
