package kr.byeongmin.stockdaejang.domain.stock.entity

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.persistence.*
import kr.byeongmin.stockdaejang.domain.stock.enums.StockCatalogLockName
import kr.byeongmin.stockdaejang.global.entity.Base

@Entity
@Table(name = "stock_catalog_locks")
@Schema(description = "내부 동시성 잠금용")
class StockCatalogLock(
	@Id
	@Enumerated(EnumType.STRING)
	@Column(name = "name", nullable = false)
	@field:Schema(description = "종목 기준 정보 갱신 잠금 이름", example = "CATALOG")
	val name: StockCatalogLockName,
	@Transient
	override val id: Long? = null,
) : Base()
