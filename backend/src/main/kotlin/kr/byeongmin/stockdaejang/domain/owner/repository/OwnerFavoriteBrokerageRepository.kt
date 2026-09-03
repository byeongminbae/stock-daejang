package kr.byeongmin.stockdaejang.domain.owner.repository

import kr.byeongmin.stockdaejang.domain.owner.entity.OwnerFavoriteBrokerage
import kr.byeongmin.stockdaejang.global.repository.BaseJpaRepository

interface OwnerFavoriteBrokerageRepository : BaseJpaRepository<OwnerFavoriteBrokerage, Long> {
    fun findAllByOwnerId(ownerId: Long): List<OwnerFavoriteBrokerage>

    fun existsByOwnerIdAndBrokerageId(ownerId: Long, brokerageId: Long): Boolean

    fun deleteByOwnerIdAndBrokerageId(ownerId: Long, brokerageId: Long)

    fun deleteByOwnerId(ownerId: Long)
}
