package kr.byeongmin.stockdaejang.global.util

import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException

fun <T> T?.ifNullThrow(): T {
    if (this == null) throw BusinessException(CommonError.NULL_CASTING_ERROR)
    return this
}

fun <T> T?.isNull(): Boolean = this == null

fun <T> T?.isNotNull(): Boolean = this != null