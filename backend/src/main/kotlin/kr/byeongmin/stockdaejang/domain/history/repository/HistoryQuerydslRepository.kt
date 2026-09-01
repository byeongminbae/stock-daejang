package kr.byeongmin.stockdaejang.domain.history.repository

import com.querydsl.core.types.Predicate
import com.querydsl.jpa.impl.JPAQueryFactory
import kr.byeongmin.stockdaejang.domain.brokerage.entity.QBrokerage.brokerage
import kr.byeongmin.stockdaejang.domain.owner.entity.QOwner.owner
import kr.byeongmin.stockdaejang.domain.stock.entity.QStock.stock
import kr.byeongmin.stockdaejang.domain.stock.entity.Stock
import kr.byeongmin.stockdaejang.domain.trade.entity.QTrade.trade
import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import kr.byeongmin.stockdaejang.domain.trade.types.TradeType
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime

@Repository
class HistoryQuerydslRepository(private val queryFactory: JPAQueryFactory) {
	@Transactional(readOnly = true)
	fun count(
		side: TradeType,
		stockNameOrCode: String?,
		from: OffsetDateTime?,
		to: OffsetDateTime?,
		ownerId: Long?,
		brokerageCode: String?,
	): Long {
		return queryFactory
			.select(trade.count())
			.from(trade)
			.join(trade.owner, owner)
			.join(trade.stock, stock)
			.join(trade.brokerage, brokerage)
			.where(*predicates(side, stockNameOrCode, from, to, ownerId, brokerageCode))
			.fetchOne() ?: 0
	}

	@Transactional(readOnly = true)
	fun findPage(
		side: TradeType,
		stockNameOrCode: String?,
		from: OffsetDateTime?,
		to: OffsetDateTime?,
		ownerId: Long?,
		brokerageCode: String?,
		pageable: Pageable,
	): List<Trade> {
		return queryFactory
			.selectFrom(trade)
			.join(trade.owner, owner).fetchJoin()
			.join(trade.stock, stock).fetchJoin()
			.join(trade.brokerage, brokerage).fetchJoin()
			.where(*predicates(side, stockNameOrCode, from, to, ownerId, brokerageCode))
			.orderBy(trade.executedAt.desc(), trade.id.desc())
			.offset(pageable.offset)
			.limit(pageable.pageSize.toLong())
			.fetch()
	}

	@Transactional(readOnly = true)
	fun findTradedStocks(tradeType: TradeType): List<Stock> {
		return queryFactory
			.select(stock)
			.distinct()
			.from(trade)
			.join(trade.stock, stock)
			.where(trade.side.eq(tradeType))
			.orderBy(stock.stockName.asc(), stock.stockCode.asc())
			.fetch()
	}

	private fun predicates(
		side: TradeType,
		stockNameOrCode: String?,
		from: OffsetDateTime?,
		to: OffsetDateTime?,
		ownerId: Long?,
		brokerageCode: String?,
	): Array<Predicate?> {
		return arrayOf(
			trade.side.eq(side),
			stockNameOrCode?.let {
				stock.stockName.containsIgnoreCase(it).or(stock.stockCode.containsIgnoreCase(it))
			},
			from?.let { trade.executedAt.goe(it) },
			to?.let { trade.executedAt.lt(it) },
			ownerId?.let { owner.id.eq(it) },
			brokerageCode?.let { brokerage.code.eq(it) },
		)
	}
}
