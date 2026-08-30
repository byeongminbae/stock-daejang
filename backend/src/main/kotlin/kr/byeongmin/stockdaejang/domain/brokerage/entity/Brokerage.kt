package kr.byeongmin.stockdaejang.domain.brokerage.entity

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import kr.byeongmin.stockdaejang.domain.common.validation.BROKERAGE_CODE_PATTERN
import kr.byeongmin.stockdaejang.global.entity.Base
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes

@Entity
@Table(name = "brokerages")
@Schema(description = "증권사 기준 정보")
class Brokerage(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    @field:Schema(description = "증권사 내부 대리키", example = "1")
    override val id: Long? = null,

    @Column(name = "code", nullable = false, unique = true)
    @JdbcTypeCode(SqlTypes.CHAR)
    @field:Schema(description = "증권사 코드. 숫자 0이 포함되어 String 임", example = "240", pattern = BROKERAGE_CODE_PATTERN)
    val code: String,

    @Column(name = "name", nullable = false, unique = true)
    @field:Schema(description = "증권사명", example = "삼성증권")
    val name: String,
) : Base()
