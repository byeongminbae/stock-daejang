package kr.byeongmin.stockdaejang.global.validation

import jakarta.validation.Constraint
import jakarta.validation.ConstraintValidator
import jakarta.validation.ConstraintValidatorContext
import jakarta.validation.Payload
import java.math.BigInteger
import kotlin.reflect.KClass

@Target(AnnotationTarget.FIELD, AnnotationTarget.VALUE_PARAMETER, AnnotationTarget.TYPE)
@Retention(AnnotationRetention.RUNTIME)
@Constraint(validatedBy = [PositiveIntegerStringValidator::class])
annotation class PositiveIntegerString(
    val max: String,
    val message: String = "1 이상 {max} 이하의 정수 문자열이어야 합니다.",
    val groups: Array<KClass<*>> = [],
    val payload: Array<KClass<out Payload>> = [],
)

class PositiveIntegerStringValidator : ConstraintValidator<PositiveIntegerString, String> {
    private lateinit var max: BigInteger

    override fun initialize(annotation: PositiveIntegerString) {
        max = BigInteger(annotation.max)
    }

    override fun isValid(value: String?, context: ConstraintValidatorContext): Boolean {
        return value != null && DIGITS_WITHOUT_LEADING_ZERO.matches(value) && value.toBigInteger() <= max
    }

    private companion object {
        val DIGITS_WITHOUT_LEADING_ZERO = Regex("^[1-9][0-9]*$")
    }
}
