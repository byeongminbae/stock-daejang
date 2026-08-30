package kr.byeongmin.stockdaejang.domain.brokerage.repository

import kr.byeongmin.stockdaejang.domain.brokerage.entity.Brokerage
import kr.byeongmin.stockdaejang.global.repository.BaseJpaRepository

interface BrokerageRepository : BaseJpaRepository<Brokerage, Long> {
    fun findAllByOrderByCodeAsc(): List<Brokerage>

    fun findByCode(code: String): Brokerage?
}
