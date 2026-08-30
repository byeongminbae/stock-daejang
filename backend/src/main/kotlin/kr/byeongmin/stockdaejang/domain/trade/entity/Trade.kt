package kr.byeongmin.stockdaejang.domain.trade.entity

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.persistence.*
import kr.byeongmin.stockdaejang.domain.brokerage.entity.Brokerage
import kr.byeongmin.stockdaejang.domain.owner.entity.Owner
import kr.byeongmin.stockdaejang.domain.stock.entity.Stock
import kr.byeongmin.stockdaejang.domain.trade.dto.PositionSnapshot
import kr.byeongmin.stockdaejang.domain.trade.enums.TradeType
import kr.byeongmin.stockdaejang.global.entity.Base
import java.math.BigDecimal
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
	@JoinColumn(name = "stock_id", nullable = false)
	@field:Schema(description = "종목")
	var stock: Stock,

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
	@field:Schema(description = "거래 수량", example = "10", minimum = "0")
	var quantity: BigDecimal,

	@Column(name = "unit_price", nullable = false)
	@field:Schema(description = "당시 단가", example = "55000", minimum = "1")
	var unitPrice: BigDecimal,

	@Column(name = "realized_profit")
	@field:Schema(description = "실현 손익. 매수 거래이면 null이고 매도 거래에만 존재", example = "250000", nullable = true)
	var realizedProfit: BigDecimal? = null,

	@Column(name = "remaining_quantity_snapshot", nullable = false)
	@field:Schema(description = "이 거래 반영 직후의 보유 수량 스냅샷", example = "12")
	var remainingQuantitySnapshot: BigDecimal,

	@Column(name = "remaining_cost_snapshot", nullable = false)
	@field:Schema(description = "이 거래 반영 직후의 잔여 매입원가 스냅샷", example = "890000")
	var remainingCostSnapshot: BigDecimal,
) : Base() {
	fun getActualTotalPrice(): BigDecimal {
		return quantity.multiply(unitPrice)
	}

	fun updateSellTrade(accumulatedSnapshot: PositionSnapshot): BigDecimal {
		val boughtCost = accumulatedSnapshot.boughtCostFor(quantity)
		realizedProfit = getActualTotalPrice() - boughtCost
		return boughtCost
	}

	fun replay(snapshot: PositionSnapshot): PositionSnapshot {
		return side.apply(this, snapshot)
	}

	companion object {
		fun of(
			owner: Owner,
			brokerage: Brokerage,
			stock: Stock,
			side: TradeType,
			executedAt: OffsetDateTime,
			quantity: BigDecimal,
			unitPrice: Long,
		): Trade {
			return Trade(
				owner = owner,
				stock = stock,
				brokerage = brokerage,
				side = side,
				executedAt = executedAt,
				quantity = quantity,
				unitPrice = BigDecimal.valueOf(unitPrice),
				realizedProfit = if (side == TradeType.SELL) BigDecimal.ZERO else null,
				remainingQuantitySnapshot = BigDecimal.ZERO,
				remainingCostSnapshot = BigDecimal.ZERO,
			)
		}
	}
}
