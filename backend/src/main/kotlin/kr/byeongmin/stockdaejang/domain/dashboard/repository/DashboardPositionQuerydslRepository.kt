package kr.byeongmin.stockdaejang.domain.dashboard.repository

import com.querydsl.core.types.dsl.BooleanExpression
import com.querydsl.jpa.impl.JPAQueryFactory
import kr.byeongmin.stockdaejang.domain.brokerage.entity.QBrokerage.brokerage
import kr.byeongmin.stockdaejang.domain.dashboard.entity.DashboardPosition
import kr.byeongmin.stockdaejang.domain.dashboard.entity.QDashboardPosition.dashboardPosition
import kr.byeongmin.stockdaejang.domain.owner.entity.QOwner.owner
import kr.byeongmin.stockdaejang.domain.stock.entity.QStock.stock
import kr.byeongmin.stockdaejang.domain.trade.dto.PositionKeyDto
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal

@Repository
class DashboardPositionQuerydslRepository(
	private val queryFactory: JPAQueryFactory,
) {
	@Transactional(readOnly = true)
	fun findAll(): List<DashboardPosition> {
		return queryFactory
			.selectFrom(dashboardPosition)
			.join(dashboardPosition.owner, owner).fetchJoin()
			.join(dashboardPosition.stock, stock).fetchJoin()
			.join(dashboardPosition.brokerage, brokerage).fetchJoin()
			.orderBy(
				owner.id.asc(),
				brokerage.name.asc(),
				brokerage.code.asc(),
				stock.stockName.asc(),
				stock.stockCode.asc(),
			)
			.fetch()
	}

	@Transactional(readOnly = true)
	internal fun find(dashboardPositionReplacements: List<DashboardPositionReplacement>): List<DashboardPosition> {
		if (dashboardPositionReplacements.isEmpty()) return emptyList()

		val requiredPositionsCondition = dashboardPositionReplacements
			.map(::replacementCondition)
			.reduce(BooleanExpression::or)

		return queryFactory
			.selectFrom(dashboardPosition)
			.join(dashboardPosition.stock, stock).fetchJoin()
			.where(requiredPositionsCondition)
			.fetch()
	}

	private fun replacementCondition(replacement: DashboardPositionReplacement): BooleanExpression {
		return dashboardPosition.owner.id.eq(replacement.key.ownerId)
			.and(dashboardPosition.brokerage.id.eq(replacement.key.brokerageId))
			.and(stock.stockCode.eq(replacement.key.stockCode))
	}
}

data class DashboardPositionReplacement(
	val key: PositionKeyDto,
	val quantity: BigDecimal,
	val totalBuyAmount: BigDecimal,
)
