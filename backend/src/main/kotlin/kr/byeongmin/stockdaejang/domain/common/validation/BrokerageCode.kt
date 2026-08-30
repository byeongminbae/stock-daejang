package kr.byeongmin.stockdaejang.domain.common.validation

import jakarta.validation.Constraint
import jakarta.validation.Payload
import jakarta.validation.constraints.Pattern
import kotlin.reflect.KClass

const val BROKERAGE_CODE_PATTERN = "^[0-9]{3}$"

@Target(AnnotationTarget.FIELD)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [])
@Pattern(regexp = BROKERAGE_CODE_PATTERN)
annotation class BrokerageCode(
    val message: String = "{jakarta.validation.constraints.Pattern.message}",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = [],
)
