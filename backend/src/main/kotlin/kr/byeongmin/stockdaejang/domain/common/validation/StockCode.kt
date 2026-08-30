package kr.byeongmin.stockdaejang.domain.common.validation

import jakarta.validation.Constraint
import jakarta.validation.Payload
import jakarta.validation.constraints.Pattern
import kotlin.reflect.KClass

const val STOCK_CODE_PATTERN = "^[0-9A-Z]{6}$"

@Target(AnnotationTarget.FIELD)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [])
@Pattern(regexp = STOCK_CODE_PATTERN)
annotation class StockCode(
    val message: String = "{jakarta.validation.constraints.Pattern.message}",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = [],
)
