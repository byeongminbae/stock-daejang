package kr.byeongmin.stockdaejang.domain.trade.repository

import com.querydsl.core.types.dsl.BooleanExpression
import com.querydsl.jpa.impl.JPAQueryFactory
import jakarta.persistence.LockModeType
import kr.byeongmin.stockdaejang.domain.stock.entity.QStock.stock
import kr.byeongmin.stockdaejang.domain.trade.dto.PositionKeyAtDto
import kr.byeongmin.stockdaejang.domain.trade.entity.QTrade.trade
import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import org.springframework.stereotype.Repository
import java.time.OffsetDateTime

@Repository
class TradeQuerydslRepository(
	private val queryFactory: JPAQueryFactory,
) {
	fun lockTradeByTradeId(id: Long) {
		queryFactory
			.select(trade.id)
			.from(trade)
			.where(trade.id.eq(id))
			.setLockMode(LockModeType.PESSIMISTIC_WRITE)
			.fetchOne()
	}

	fun lockAllTradeByTradeIds(ids: List<Long>) {
		queryFactory
			.select(trade.id)
			.from(trade)
			.where(trade.id.`in`(ids))
			.orderBy(trade.id.asc())
			.setLockMode(LockModeType.PESSIMISTIC_WRITE)
			.fetch()
	}

	fun lockAllStockByStockCodes(stockCodes: List<String>) {
		val sortedStockCodes = stockCodes.distinct().sorted()
		queryFactory
			.select(stock.id)
			.from(stock)
			.where(stock.stockCode.`in`(sortedStockCodes))
			.orderBy(stock.stockCode.asc()) // 순환대기 방지
			.setLockMode(LockModeType.PESSIMISTIC_WRITE)
			.fetch()
	}

	fun findLatestTrade(ownerId: Long, brokerageId: Long, stockId: Long): Trade? {
		return queryFactory
			.selectFrom(trade)
			.where(
				trade.owner.id.eq(ownerId),
				trade.brokerage.id.eq(brokerageId),
				trade.stock.id.eq(stockId),
			)
			.orderBy(trade.executedAt.desc(), trade.id.desc())
			.fetchFirst()
	}

	fun findLatestTradeAt(ownerId: Long, brokerageId: Long, stockId: Long, executedAt: OffsetDateTime): Trade? {
		return queryFactory
			.selectFrom(trade)
			.where(
				trade.owner.id.eq(ownerId),
				trade.brokerage.id.eq(brokerageId),
				trade.stock.id.eq(stockId),
				trade.executedAt.loe(executedAt),
			)
			.orderBy(trade.executedAt.desc(), trade.id.desc())
			.fetchFirst()
	}

	fun findPositionTradesBefore(positionKeyAtDtos: List<PositionKeyAtDto>): List<Trade> {
		if (positionKeyAtDtos.isEmpty()) return emptyList()

		return queryFactory
			.selectFrom(trade)
			.join(trade.stock, stock).fetchJoin()
			.where(positionKeyAtDtos.map(::conditionPerBeforePosition).reduce(BooleanExpression::or))
			.orderBy(
				trade.owner.id.asc(),
				trade.brokerage.id.asc(),
				stock.stockCode.asc(),
				trade.executedAt.desc(),
				trade.id.desc(),
			)
			.fetch()
	}

	fun findPositionTradesFrom(positionKeyAtDtos: List<PositionKeyAtDto>): List<Trade> {
		if (positionKeyAtDtos.isEmpty()) return emptyList()
		return queryFactory
			.selectFrom(trade)
			.join(trade.stock, stock).fetchJoin()
			.where(positionKeyAtDtos.map(::conditionPerFromPosition).reduce(BooleanExpression::or))
			.orderBy(
				trade.owner.id.asc(),
				trade.brokerage.id.asc(),
				stock.stockCode.asc(),
				trade.executedAt.asc(),
				trade.id.asc(),
			)
			.fetch()
	}

	private fun conditionPerBeforePosition(positionKeyAtDto: PositionKeyAtDto): BooleanExpression {
		return trade.owner.id.eq(positionKeyAtDto.positionKeyDto.ownerId)
			.and(trade.brokerage.id.eq(positionKeyAtDto.positionKeyDto.brokerageId))
			.and(stock.stockCode.eq(positionKeyAtDto.positionKeyDto.stockCode))
			.and(trade.executedAt.lt(positionKeyAtDto.executedAt))
	}

	private fun conditionPerFromPosition(positionKeyAtDto: PositionKeyAtDto): BooleanExpression {
		return trade.owner.id.eq(positionKeyAtDto.positionKeyDto.ownerId)
			.and(trade.brokerage.id.eq(positionKeyAtDto.positionKeyDto.brokerageId))
			.and(stock.stockCode.eq(positionKeyAtDto.positionKeyDto.stockCode))
			.and(trade.executedAt.goe(positionKeyAtDto.executedAt))
	}
}

