package kr.byeongmin.stockdaejang.domain.stock.repository

import com.querydsl.jpa.impl.JPAQueryFactory
import jakarta.persistence.LockModeType
import kr.byeongmin.stockdaejang.domain.stock.entity.QStockCatalogLock.stockCatalogLock
import kr.byeongmin.stockdaejang.domain.stock.entity.StockCatalogLock
import kr.byeongmin.stockdaejang.domain.stock.types.StockCatalogLockName
import org.springframework.stereotype.Repository

@Repository
class StockCatalogQuerydslRepository(
	private val queryFactory: JPAQueryFactory,
) {
	fun lockByName(name: StockCatalogLockName): StockCatalogLock? {
		return queryFactory
			.selectFrom(stockCatalogLock)
			.where(stockCatalogLock.name.eq(name))
			.setLockMode(LockModeType.PESSIMISTIC_WRITE)
			.fetchOne()
	}
}
