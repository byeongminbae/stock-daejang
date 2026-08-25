package kr.byeongmin.stockdaejang.domain.trade.dto

import kr.byeongmin.stockdaejang.domain.trade.entity.TradeType
import java.math.BigInteger

internal data class ParsedPreviewDto(
    val brokerageCode: String,

    val itemCode: String,

    val ownerId: Long,

    val quantity: BigInteger,

    val side: TradeType,

    val unitPrice: BigInteger,
)
