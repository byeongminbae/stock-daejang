package kr.byeongmin.stockdaejang.domain.history.service

import kr.byeongmin.stockdaejang.domain.history.dto.StockStatusResponseDto
import kr.byeongmin.stockdaejang.domain.history.repository.HistoryQuerydslRepository
import kr.byeongmin.stockdaejang.domain.trade.types.TradeType
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class StockHistoryService(
	val historyQuerydslRepository: HistoryQuerydslRepository
) {
	@Transactional(readOnly = true)
	fun getTradedStocks(tradeType: TradeType): SuccessDataResponse<List<StockStatusResponseDto>> {
		val tradedStocks = historyQuerydslRepository.findTradedStocks(tradeType)
			.map(StockStatusResponseDto::from)
		return SuccessDataResponse(tradedStocks)
	}
}