package kr.byeongmin.stockdaejang.domain.owner.repository

import kr.byeongmin.stockdaejang.domain.owner.entity.Owner
import org.springframework.data.jpa.repository.JpaRepository

interface OwnerRepository : JpaRepository<Owner, Long> {
    fun findAllByOrderByIdAsc(): List<Owner>
}
