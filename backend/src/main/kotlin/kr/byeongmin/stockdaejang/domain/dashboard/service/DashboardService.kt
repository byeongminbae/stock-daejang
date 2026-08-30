package kr.byeongmin.stockdaejang.domain.dashboard.service

import kr.byeongmin.stockdaejang.domain.common.util.sumOfDecimal
import kr.byeongmin.stockdaejang.domain.dashboard.dto.*
import kr.byeongmin.stockdaejang.domain.dashboard.entity.DashboardPosition
import kr.byeongmin.stockdaejang.domain.dashboard.repository.DashboardPositionQuerydslRepository
import kr.byeongmin.stockdaejang.domain.owner.entity.Owner
import kr.byeongmin.stockdaejang.domain.stock.dto.MarketStockCodesDto
import kr.byeongmin.stockdaejang.domain.stock.dto.MarketPriceDto
import kr.byeongmin.stockdaejang.domain.stock.service.DomesticMarketPriceService
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import kr.byeongmin.stockdaejang.global.util.ifNullThrow
import org.springframework.stereotype.Service

@Service
class DashboardService(
    private val dashboardPositionQuerydslRepository: DashboardPositionQuerydslRepository,
    private val domesticMarketPriceService: DomesticMarketPriceService
) {
    fun getDashboard(): SuccessDataResponse<DashboardResponseDto> {
        val positions = dashboardPositionQuerydslRepository.findAll()
        val stockCodes = positions.map { it.stock.stockCode }.distinct()
        val marketPricesByStockCode = domesticMarketPriceService.getMarketPrices(MarketStockCodesDto(stockCodes))

        val positionsByOwnerId = positions.groupBy { it.owner.id }
        val owners = positions.map { it.owner }.distinctBy { it.id }

        val ownerResponseDtos = getOwnerResponseDtosOrEmptyList(owners, positionsByOwnerId, marketPricesByStockCode)

        val latestMarketPriceDto = getLatestMarketPriceDto(stockCodes, marketPricesByStockCode)

        return SuccessDataResponse(
            DashboardResponseDto.of(
                owners = ownerResponseDtos,
                quoteFetchedAt = latestMarketPriceDto?.localTradedAt?.toString(),
                valuationSession = latestMarketPriceDto?.marketSession,
            ),
        )
    }

    private fun getLatestMarketPriceDto(
        stockCodes: List<String>,
        marketPricesByStockCode: Map<String, MarketPriceDto>
    ): MarketPriceDto? {
        return stockCodes
            .map { marketPricesByStockCode[it].ifNullThrow() }
            .maxWithOrNull(
                compareBy(MarketPriceDto::localTradedAt)
                    .thenBy(MarketPriceDto::stockCode)
                    .thenBy { it.marketSession.ordinal },
            )
    }

    // 소유주가 아무런 종목을 보유하고 있지 않을 시 연산 없이 빈 리스트 반환
    private fun getOwnerResponseDtosOrEmptyList(
        owners: List<Owner>,
        positionsByOwnerId: Map<Long, List<DashboardPosition>>,
        marketPricesByStockCode: Map<String, MarketPriceDto>
    ): List<DashboardOwnerResponseDto> {
        return owners.map { owner ->
            val ownedPositions = positionsByOwnerId[owner.id].orEmpty()
            val ownedPositionsByBrokerageId = ownedPositions.groupBy { it.brokerage.id.ifNullThrow() }

            val dashboardBrokerageResponseDtos = ownedPositionsByBrokerageId.values
                .map { brokeragePositions ->
                    val brokerageTotalBuyAmount = brokeragePositions.sumOfDecimal { it.totalBuyAmount }
                    val dashboardStockResponseDtos = brokeragePositions.map {
                        DashboardStockResponseDto.of(
                            position = it,
                            marketPrice = marketPricesByStockCode[it.stock.stockCode].ifNullThrow(),
                            brokerageTotalBuyAmount = brokerageTotalBuyAmount,
                        )
                    }
                    DashboardBrokerageResponseDto.of(
                        brokerage = brokeragePositions.first().brokerage,
                        stocks = dashboardStockResponseDtos,
                    )
                }
                .sortedBy(DashboardBrokerageResponseDto::brokerageName)

            DashboardOwnerResponseDto.of(
                owner = owner,
                brokerages = dashboardBrokerageResponseDtos,
            )
        }
    }
}
