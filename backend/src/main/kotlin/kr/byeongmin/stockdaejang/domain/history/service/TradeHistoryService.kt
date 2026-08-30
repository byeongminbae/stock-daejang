package kr.byeongmin.stockdaejang.domain.history.service

import kr.byeongmin.stockdaejang.domain.history.dto.GetHistoryRequestDto
import kr.byeongmin.stockdaejang.domain.history.dto.TradeHistoryResponseDto
import kr.byeongmin.stockdaejang.domain.history.dto.TradeHistoryRowResponseDto
import kr.byeongmin.stockdaejang.domain.history.repository.HistoryQuerydslRepository
import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import kr.byeongmin.stockdaejang.domain.trade.repository.TradeRepository
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import kotlin.math.ceil

@Service
class TradeHistoryService(
    private val historyQuerydslRepository: HistoryQuerydslRepository,
    private val tradeRepository: TradeRepository,
) {
    @Transactional(readOnly = true)
    fun getHistory(getHistoryRequestDto: GetHistoryRequestDto): SuccessDataResponse<TradeHistoryResponseDto> {
        val totalMatchedCount = historyQuerydslRepository.count(
            getHistoryRequestDto.side,
            getHistoryRequestDto.stockNameOrCode,
            getHistoryRequestDto.from,
            getHistoryRequestDto.to,
            getHistoryRequestDto.ownerId,
            getHistoryRequestDto.brokerageCode,
        )
        val totalCount = tradeRepository.countBySide(getHistoryRequestDto.side)

        val tradeHistoryPage = getTradeHistoryPages(getHistoryRequestDto, totalMatchedCount)
        val tradeHistoryRows = tradeHistoryPage.content.map(TradeHistoryRowResponseDto::from)

        return SuccessDataResponse(
            TradeHistoryResponseDto(
                tradeHistoryRowResponseDtos = tradeHistoryRows,
                totalMatchedCount = totalMatchedCount,
                totalCount = totalCount,
                currentPage = tradeHistoryPage.number + 1,
                totalPages = getTotalPageCount(totalMatchedCount, getHistoryRequestDto.pageSize),
                hasFilters = getHistoryRequestDto.hasFilters(),
            ),
        )
    }

    private fun getTradeHistoryPages(
        getHistoryRequestDto: GetHistoryRequestDto,
        filteredTradeCount: Long,
    ): Page<Trade> {
        val pageSize = getHistoryRequestDto.pageSize
        val totalPageCount = getTotalPageCount(filteredTradeCount, pageSize)
        val currentPage = getHistoryRequestDto.page.coerceIn(1, totalPageCount)
        val pageable = PageRequest.of(currentPage - 1, pageSize)

        val content = historyQuerydslRepository.findPage(
            getHistoryRequestDto.side,
            getHistoryRequestDto.stockNameOrCode,
            getHistoryRequestDto.from,
            getHistoryRequestDto.to,
            getHistoryRequestDto.ownerId,
            getHistoryRequestDto.brokerageCode,
            pageable,
        )
        return PageImpl(content, pageable, filteredTradeCount)
    }

    private fun getTotalPageCount(filteredTradeCount: Long, pageSize: Int): Int {
        val minimumTotalPageCount = 1
        val currentTotalPageCount = ceil(filteredTradeCount.toDouble() / pageSize).toInt()
        return maxOf(minimumTotalPageCount, currentTotalPageCount)
    }
}
