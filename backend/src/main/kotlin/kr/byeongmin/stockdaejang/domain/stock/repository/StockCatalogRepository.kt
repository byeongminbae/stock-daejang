package kr.byeongmin.stockdaejang.domain.stock.repository

import com.querydsl.jpa.impl.JPAQueryFactory
import jakarta.persistence.EntityManager
import jakarta.persistence.LockModeType
import kr.byeongmin.stockdaejang.domain.stock.entity.QStock.stock
import kr.byeongmin.stockdaejang.domain.stock.entity.QStockCatalogLock.stockCatalogLock
import kr.byeongmin.stockdaejang.domain.stock.entity.Stock
import kr.byeongmin.stockdaejang.domain.stock.entity.StockCatalogLockName
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import org.springframework.stereotype.Repository

@Repository
class StockCatalogRepository(
    private val queryFactory: JPAQueryFactory,
    private val entityManager: EntityManager,
) {
    fun upsert(itemCode: String, stockName: String, market: String, isEtf: Boolean): Stock {
        lockCatalog()
        val existingStock = queryFactory
            .selectFrom(stock)
            .where(stock.itemCode.eq(itemCode))
            .fetchOne()

        if (existingStock != null) {
            existingStock.market = market
            existingStock.isEtf = isEtf
            return existingStock
        }

        val newStock = Stock.of(itemCode, stockName, market, isEtf)
        entityManager.persist(newStock)
        entityManager.flush()
        return newStock
    }

    private fun lockCatalog() {
        queryFactory
            .select(stockCatalogLock.name)
            .from(stockCatalogLock)
            .where(stockCatalogLock.name.eq(StockCatalogLockName.CATALOG))
            .setLockMode(LockModeType.PESSIMISTIC_WRITE)
            .fetchOne()
            ?: throw BusinessException(CommonError.INTERNAL_SERVER_ERROR)
    }
}
