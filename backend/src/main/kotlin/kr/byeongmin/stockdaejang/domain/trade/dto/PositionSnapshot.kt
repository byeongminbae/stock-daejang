package kr.byeongmin.stockdaejang.domain.trade.dto

import kr.byeongmin.stockdaejang.domain.common.util.divideRounded
import kr.byeongmin.stockdaejang.domain.common.util.rounded
import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import kr.byeongmin.stockdaejang.global.util.isNull
import kr.byeongmin.stockdaejang.global.util.isZero
import java.math.BigDecimal

data class PositionSnapshot(
	val remainingQuantitySnapshot: BigDecimal,
	val remainingCostSnapshot: BigDecimal,
) {
	fun isQuantityExceeded(quantity: BigDecimal): Boolean {
		return remainingQuantitySnapshot < quantity
	}

	private fun isQuantityEmpty(): Boolean {
		return remainingQuantitySnapshot.signum() <= 0
	}

	// 포지션은 매수 건별로 안 쪼개고 총 수량/총 원가 두 값으로만 관리해서, 판 수량이 어느 매수분인지 알 수 없음.
	// 그래서 원가도 판 비율(quantity / remainingQuantitySnapshot)만큼 통째로 나눠서 떼어냄 (가중평균원가법).
	fun boughtCostFor(quantity: BigDecimal): BigDecimal {
		if (isQuantityEmpty()) {
			throw BusinessException(CommonError.INTERNAL_SERVER_ERROR)
		}
		return remainingCostSnapshot
			.multiply(quantity)
			.rounded()
			.divideRounded(remainingQuantitySnapshot)
	}
	
	fun averagePrice(): BigDecimal {
		if (remainingQuantitySnapshot.isZero()) return BigDecimal.ZERO
		return remainingCostSnapshot.divideRounded(remainingQuantitySnapshot)
	}

	companion object {
		// 매 거래마다 찍어둔 remaining quantity/cost 스냅샷을 읽기만 하면 되므로, 직전까지의 거래를 다시 합산할 필요가 없다.
		fun from(latestTrade: Trade?): PositionSnapshot {
			return if (latestTrade.isNull()) {
				PositionSnapshot(BigDecimal.ZERO, BigDecimal.ZERO)
			} else {
				PositionSnapshot(latestTrade.remainingQuantitySnapshot, latestTrade.remainingCostSnapshot)
			}
		}
	}
}
