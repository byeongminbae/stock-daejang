package kr.byeongmin.stockdaejang.domain.trade.service

import kr.byeongmin.stockdaejang.domain.owner.repository.OwnerRepository
import kr.byeongmin.stockdaejang.domain.trade.dto.GetPositionAverageRequestDto
import kr.byeongmin.stockdaejang.domain.trade.dto.PositionAverageResponseDto
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class PositionService(
    private val ownerRepository: OwnerRepository,
    private val tradeService: TradeService,
) {
    @Transactional(readOnly = true)
    fun getPositionAverage(
        getPositionAverageRequestDto: GetPositionAverageRequestDto
    ): SuccessDataResponse<PositionAverageResponseDto> {
        ownerRepository.findByIdIfNullThrow(getPositionAverageRequestDto.ownerId)

        return SuccessDataResponse(
            tradeService.currentPositionAverage(
                getPositionAverageRequestDto.ownerId,
                getPositionAverageRequestDto.brokerageCode,
                getPositionAverageRequestDto.stockCode,
            ),
        )
    }
}
