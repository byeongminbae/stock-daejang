package kr.byeongmin.stockdaejang.domain.common.util

import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import java.math.BigDecimal
import java.math.MathContext
import java.math.RoundingMode

internal val MONEY_MATH_CONTEXT = MathContext(40, RoundingMode.HALF_UP)

fun <T> Iterable<T>.sumOfDecimal(
    mathContext: MathContext = MONEY_MATH_CONTEXT,
    selector: (T) -> BigDecimal,
): BigDecimal {
    return this.fold(BigDecimal.ZERO) { total, element ->
        total.add(selector(element), mathContext)
    }
}

fun BigDecimal.zeroOr(value: BigDecimal) = if (this.signum() == 0) BigDecimal.ZERO else value

fun BigDecimal.multiplyRounded(multiplicand: BigDecimal, mathContext: MathContext = MONEY_MATH_CONTEXT): BigDecimal {
    return this.multiply(multiplicand, mathContext)
}

fun BigDecimal.subtractRounded(subtrahend: BigDecimal, mathContext: MathContext = MONEY_MATH_CONTEXT): BigDecimal {
    return this.subtract(subtrahend, mathContext)
}

fun BigDecimal.divideRounded(divisor: BigDecimal, mathContext: MathContext = MONEY_MATH_CONTEXT): BigDecimal {
    return this.divide(divisor, mathContext)
}

fun BigDecimal.divideRoundHalfUp(bigDecimal: BigDecimal, mathContext: MathContext = MONEY_MATH_CONTEXT): BigDecimal {
    if (bigDecimal.signum() <= 0) {
        throw BusinessException(CommonError.INTERNAL_SERVER_ERROR)
    }
    return this.divide(bigDecimal, mathContext)
}
