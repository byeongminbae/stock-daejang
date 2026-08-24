package kr.byeongmin.stockdaejang.domain.dashboard.repository

import com.querydsl.jpa.impl.JPAQueryFactory
import jakarta.persistence.EntityManager
import kr.byeongmin.stockdaejang.domain.brokerage.entity.QBrokerage.brokerage
import kr.byeongmin.stockdaejang.domain.brokerage.entity.Brokerage
import kr.byeongmin.stockdaejang.domain.dashboard.entity.DashboardPosition
import kr.byeongmin.stockdaejang.domain.dashboard.entity.QDashboardPosition.dashboardPosition
import kr.byeongmin.stockdaejang.domain.owner.entity.QOwner.owner
import kr.byeongmin.stockdaejang.domain.owner.entity.Owner
import kr.byeongmin.stockdaejang.domain.stock.entity.QSecurity.security
import kr.byeongmin.stockdaejang.global.util.ifNullThrow
import org.springframework.stereotype.Repository
import org.springframework.transaction.annotation.Transactional
import java.math.BigInteger

@Repository
class DashboardPositionRepository(
    private val queryFactory: JPAQueryFactory,
    private val entityManager: EntityManager,
) {
    @Transactional(readOnly = true)
    fun findAll(): List<DashboardPosition> {
        return queryFactory
            .selectFrom(dashboardPosition)
            .join(dashboardPosition.owner, owner).fetchJoin()
            .join(dashboardPosition.security, security).fetchJoin()
            .join(dashboardPosition.brokerage, brokerage).fetchJoin()
            .orderBy(
                owner.id.asc(),
                brokerage.name.asc(),
                brokerage.code.asc(),
                security.stockName.asc(),
                security.itemCode.asc(),
            )
            .fetch()
    }

    internal fun replace(
        ownerId: Long,
        brokerageId: Long,
        itemCode: String,
        quantity: BigInteger,
        totalBuyAmount: BigInteger,
    ) {
        val existingPosition = queryFactory
            .selectFrom(dashboardPosition)
            .join(dashboardPosition.security, security)
            .where(
                dashboardPosition.owner.id.eq(ownerId),
                dashboardPosition.brokerage.id.eq(brokerageId),
                security.itemCode.eq(itemCode),
            )
            .fetchOne()

        if (removePositionIfQuantityEmpty(quantity, existingPosition)) return
        if (replacePositionIfNotNull(existingPosition, quantity, totalBuyAmount)) return

        val positionSecurity = queryFactory
            .selectFrom(security)
            .where(security.itemCode.eq(itemCode))
            .fetchOne()
            .ifNullThrow()

        entityManager.persist(
            DashboardPosition(
                owner = entityManager.getReference(Owner::class.java, ownerId),
                brokerage = entityManager.getReference(Brokerage::class.java, brokerageId),
                security = positionSecurity,
                quantity = quantity,
                totalBuyAmount = totalBuyAmount,
            ),
        )
    }

    private fun replacePositionIfNotNull(
        existingPosition: DashboardPosition?,
        quantity: BigInteger,
        totalBuyAmount: BigInteger
    ): Boolean {
        return if (existingPosition != null) {
            existingPosition.quantity = quantity
            existingPosition.totalBuyAmount = totalBuyAmount
            true
        } else {
            false
        }
    }

    private fun removePositionIfQuantityEmpty(
        quantity: BigInteger,
        existingPosition: DashboardPosition?
    ): Boolean {
        return if (quantity == BigInteger.ZERO) {
            if (existingPosition != null) entityManager.remove(existingPosition)
            true
        } else {
            false
        }
    }
}
