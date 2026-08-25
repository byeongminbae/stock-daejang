package kr.byeongmin.stockdaejang.domain.trade.entity

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.persistence.*
import kr.byeongmin.stockdaejang.domain.brokerage.entity.Brokerage
import kr.byeongmin.stockdaejang.domain.owner.entity.Owner
import kr.byeongmin.stockdaejang.domain.stock.entity.Security
import kr.byeongmin.stockdaejang.global.entity.Base
import java.math.BigInteger
import java.time.OffsetDateTime

@Entity
@Table(name = "trades")
@Schema(description = "매수/매도 거래")
class Trade(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    @field:Schema(description = "거래 내부 대리키", example = "1")
    override val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    @field:Schema(description = "소유주")
    var owner: Owner,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "security_id", nullable = false)
    @field:Schema(description = "종목")
    var security: Security,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brokerage_id", nullable = false)
    @field:Schema(description = "거래 증권사")
    var brokerage: Brokerage,

    @Enumerated(EnumType.STRING)
    @Column(name = "side", nullable = false)
    @field:Schema(description = "매수/매도 구분. BUY, SELL", example = "BUY")
    var side: TradeType,

    @Column(name = "executed_at", nullable = false)
    @field:Schema(description = "매수/매도 일시", example = "2026-08-20T09:30:00+09:00")
    var executedAt: OffsetDateTime,

    @Column(name = "quantity", nullable = false)
    @field:Schema(description = "거래 수량", example = "10", minimum = "1")
    var quantity: Long,

    @Column(name = "unit_price", nullable = false)
    @field:Schema(description = "당시 단가", example = "55000", minimum = "1")
    var unitPrice: Long,

    @Column(name = "realized_profit", precision = 38, scale = 0)
    @field:Schema(description = "실현 손익. 매수 거래이면 null이고 매도 거래에만 존재", example = "250000", nullable = true)
    var realizedProfit: BigInteger? = null,
) : Base() {
    fun amount(): BigInteger {
        return BigInteger.valueOf(quantity).multiply(BigInteger.valueOf(unitPrice))
    }
}
