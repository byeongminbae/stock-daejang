package kr.byeongmin.stockdaejang.domain.owner.repository

import kr.byeongmin.stockdaejang.domain.owner.entity.Owner
import kr.byeongmin.stockdaejang.global.repository.BaseJpaRepository

interface OwnerRepository : BaseJpaRepository<Owner, Long> {
	fun findAllByOrderByIdAsc(): List<Owner>
	fun existsByName(ownerName: String): Boolean
}
