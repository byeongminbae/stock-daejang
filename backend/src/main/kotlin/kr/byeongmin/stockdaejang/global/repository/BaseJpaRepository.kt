package kr.byeongmin.stockdaejang.global.repository

import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.repository.NoRepositoryBean

@NoRepositoryBean
interface BaseJpaRepository<T : Any, ID : Any> : JpaRepository<T, ID> {
    fun findByIdIfNullDo(id: ID, func: () -> Nothing): T {
        return findById(id).orElseThrow(func)
    }

    fun findByIdIfNullThrow(id: ID): T {
        return findByIdIfNullDo(id) { throw BusinessException(CommonError.RESOURCE_NOT_FOUND) }
    }
}
