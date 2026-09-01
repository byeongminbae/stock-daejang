package kr.byeongmin.stockdaejang.domain.owner.entity

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import kr.byeongmin.stockdaejang.domain.brokerage.entity.Brokerage
import kr.byeongmin.stockdaejang.global.entity.Base

@Entity
@Table(name = "owner_favorite_brokerages")
@Schema(description = "소유주가 자주 쓰는 증권사")
class OwnerFavoriteBrokerage(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    override val id: Long? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    @field:Schema(description = "소유주")
    var owner: Owner,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "brokerage_id", nullable = false)
    @field:Schema(description = "증권사")
    var brokerage: Brokerage,
) : Base()
