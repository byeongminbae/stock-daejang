package kr.byeongmin.stockdaejang.domain.trade.repository

import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import kr.byeongmin.stockdaejang.domain.trade.enums.TradeType
import kr.byeongmin.stockdaejang.global.repository.BaseJpaRepository

interface TradeRepository : BaseJpaRepository<Trade, Long> {
    fun findAllByIdInOrderByIdAsc(ids: List<Long>): List<Trade>

    fun countBySide(side: TradeType): Long
}
