package kr.byeongmin.stockdaejang.domain.trade.dto

import kr.byeongmin.stockdaejang.domain.brokerage.entity.Brokerage
import kr.byeongmin.stockdaejang.domain.owner.entity.Owner
import kr.byeongmin.stockdaejang.domain.stock.entity.Security
import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import kr.byeongmin.stockdaejang.domain.trade.entity.TradeType
import java.math.BigInteger
import java.time.OffsetDateTime

internal data class ParsedTradeDto(
    val brokerageCode: String,

    val executedAt: OffsetDateTime,

    val isEtf: Boolean,

    val itemCode: String,

    val market: String,

    val ownerId: Long,

    val quantity: BigInteger,

    val securityName: String,

    val side: TradeType,

    val unitPrice: BigInteger,
) {
    fun toEntity(owner: Owner, brokerage: Brokerage, security: Security): Trade {
        return Trade(
            owner = owner,
            security = security,
            brokerage = brokerage,
            side = side,
            executedAt = executedAt,
            quantity = quantity.longValueExact(),
            unitPrice = unitPrice.longValueExact(),
            realizedProfit = if (side == TradeType.SELL) BigInteger.ZERO else null,
        )
    }
}
