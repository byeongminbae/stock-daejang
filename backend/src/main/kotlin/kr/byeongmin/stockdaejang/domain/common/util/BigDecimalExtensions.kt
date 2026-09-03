package kr.byeongmin.stockdaejang.domain.common.util

import java.math.BigDecimal
import java.math.RoundingMode

private const val MONEY_SCALE = 2

fun BigDecimal.rounded(): BigDecimal {
	return this.setScale(MONEY_SCALE, RoundingMode.HALF_UP)
}

fun <T> Iterable<T>.sumOfDecimal(selector: (T) -> BigDecimal): BigDecimal {
	return this.fold(BigDecimal.ZERO) { total, element ->
		total.add(selector(element)).rounded()
	}
}

fun BigDecimal.zeroOr(value: BigDecimal): BigDecimal {
	if (this.signum() == 0) {
		return BigDecimal.ZERO
	}
	return value
}

fun BigDecimal.divideRounded(divisor: BigDecimal): BigDecimal {
	return this.divide(divisor, MONEY_SCALE, RoundingMode.HALF_UP)
}

fun BigDecimal.toPercentageOf(totalAmount: BigDecimal): BigDecimal {
	val hasNoTotalAmount = totalAmount.signum() == 0
	if (hasNoTotalAmount) {
		return BigDecimal.ZERO
	}
	val percentageRatioScale = 4
	val percentMultiplier = BigDecimal.valueOf(100)
	return this.divide(totalAmount, percentageRatioScale, RoundingMode.HALF_UP)
		.multiply(percentMultiplier)
		.rounded()
}
