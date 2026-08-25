package kr.byeongmin.stockdaejang.domain.history.service

import kr.byeongmin.stockdaejang.domain.history.dto.StockStatusResponseDto
import kr.byeongmin.stockdaejang.domain.history.repository.HistoryRepository
import kr.byeongmin.stockdaejang.domain.trade.entity.TradeType
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class StockHistoryService(
    val historyRepository: HistoryRepository
) {
    @Transactional(readOnly = true)
    fun getTradedStocks(tradeType: TradeType): SuccessDataResponse<List<StockStatusResponseDto>> {
        val purchasedStocks = historyRepository.findPurchasedStocks(tradeType)
            .map(StockStatusResponseDto::from)
        return SuccessDataResponse(purchasedStocks)
    }
}