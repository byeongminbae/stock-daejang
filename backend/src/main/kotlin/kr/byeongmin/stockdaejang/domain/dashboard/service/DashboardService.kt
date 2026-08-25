package kr.byeongmin.stockdaejang.domain.dashboard.service

import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardBrokerageResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DASHBOARD_MATH_CONTEXT
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardOwnerResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardStockResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.entity.DashboardPosition
import kr.byeongmin.stockdaejang.domain.dashboard.repository.DashboardPositionRepository
import kr.byeongmin.stockdaejang.domain.owner.entity.Owner
import kr.byeongmin.stockdaejang.domain.stock.dto.MarketPriceDto
import kr.byeongmin.stockdaejang.domain.stock.service.MarketPriceService
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import kr.byeongmin.stockdaejang.global.util.ifNullThrow
import kr.byeongmin.stockdaejang.global.util.sumOfDecimal
import org.springframework.stereotype.Service

@Service
class DashboardService(
    private val dashboardPositionRepository: DashboardPositionRepository,
    private val marketPriceService: MarketPriceService
) {
    fun getDashboard(): SuccessDataResponse<DashboardResponseDto> {
        val positions = dashboardPositionRepository.findAll()
        val itemCodes = positions.map { it.security.itemCode }.distinct()
        val marketPricesByItemCode = marketPriceService.getMarketPrices(itemCodes)

        val positionsByOwnerId = positions.groupBy { it.owner.id }
        val owners = positions.map { it.owner }.distinctBy { it.id }

        val ownerResponseDtos = getOwnerResponseDtosOrEmptyList(owners, positionsByOwnerId, marketPricesByItemCode)

        val latestMarketPriceDto = getLatestMarketPriceDto(itemCodes, marketPricesByItemCode)

        return SuccessDataResponse(
            DashboardResponseDto.of(
                owners = ownerResponseDtos,
                quoteFetchedAt = latestMarketPriceDto?.localTradedAt?.toString(),
                valuationSession = latestMarketPriceDto?.session,
            ),
        )
    }

    private fun getLatestMarketPriceDto(
        itemCodes: List<String>,
        marketPricesByItemCode: Map<String, MarketPriceDto>
    ): MarketPriceDto? {
        return itemCodes
            .map { marketPricesByItemCode[it].ifNullThrow() }
            .maxWithOrNull(
                compareBy(MarketPriceDto::localTradedAt)
                    .thenBy(MarketPriceDto::itemCode)
                    .thenBy { it.session.ordinal },
            )
    }

    // 소유주가 아무런 종목을 보유하고 있지 않을 시 연산 없이 빈 리스트 반환
    private fun getOwnerResponseDtosOrEmptyList(
        owners: List<Owner>,
        positionsByOwnerId: Map<Long, List<DashboardPosition>>,
        marketPricesByItemCode: Map<String, MarketPriceDto>
    ): List<DashboardOwnerResponseDto> {
        return owners.map { owner ->
            val ownedPositions = positionsByOwnerId[owner.id].orEmpty()
            val ownedPositionsByBrokerageId = ownedPositions.groupBy { it.brokerage.id.ifNullThrow() }

            val dashboardBrokerageResponseDtos = ownedPositionsByBrokerageId.values
                .map { brokeragePositions ->
                    val brokerageTotalBuyAmount = brokeragePositions.sumOfDecimal(DASHBOARD_MATH_CONTEXT) {
                        it.totalBuyAmount.toBigDecimal()
                    }
                    val dashboardStockResponseDtos = brokeragePositions.map {
                        DashboardStockResponseDto.of(
                            position = it,
                            marketPrice = marketPricesByItemCode[it.security.itemCode].ifNullThrow(),
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
