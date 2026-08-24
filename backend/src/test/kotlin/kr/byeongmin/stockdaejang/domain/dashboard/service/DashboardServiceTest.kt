package kr.byeongmin.stockdaejang.domain.dashboard.service

import kr.byeongmin.stockdaejang.domain.brokerage.entity.Brokerage
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardBrokerageResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardOwnerResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.dto.DashboardResponseDto
import kr.byeongmin.stockdaejang.domain.dashboard.entity.DashboardPosition
import kr.byeongmin.stockdaejang.domain.dashboard.repository.DashboardPositionRepository
import kr.byeongmin.stockdaejang.domain.owner.entity.Owner
import kr.byeongmin.stockdaejang.domain.owner.repository.OwnerRepository
import kr.byeongmin.stockdaejang.domain.stock.dto.MarketPriceDto
import kr.byeongmin.stockdaejang.domain.stock.entity.Security
import kr.byeongmin.stockdaejang.domain.stock.provider.MarketSession
import kr.byeongmin.stockdaejang.domain.stock.service.MarketPriceService
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import org.junit.jupiter.api.Test
import org.mockito.Mockito.mock
import org.mockito.Mockito.verify
import org.mockito.Mockito.`when`
import java.math.BigDecimal
import java.math.BigInteger
import java.time.OffsetDateTime
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull

class DashboardServiceTest {
    private val owners = listOf(Owner(1, "병민"), Owner(2, "할머니"), Owner(3, "아빠"))
    private val dashboardPositionRepository = mock(DashboardPositionRepository::class.java)
    private val ownerRepository = mock(OwnerRepository::class.java)
    private val marketPriceService = mock(MarketPriceService::class.java)
    private val dashboardService = DashboardService(dashboardPositionRepository, ownerRepository, marketPriceService)

    @Test
    fun `대시보드와 소유주와 증권사와 종목 단계의 금액과 종목 비중을 반환한다`() {
        val positions = listOf(
            position(quantity = 2, totalBuyAmount = 2_000),
            position(
                quantity = 2,
                totalBuyAmount = 4_000,
                stockCode = "000660",
                stockName = "SK하이닉스",
            ),
        )
        val marketPricesByItemCode = linkedMapOf(
            "005930" to marketPrice("005930", "삼성전자", 2_000, MarketSession.REGULAR_MARKET),
            "000660" to marketPrice("000660", "SK하이닉스", 2_500, MarketSession.REGULAR_MARKET),
        )

        val dashboard = getDashboardResponse(positions, marketPricesByItemCode)

        val owner = dashboard.owner("병민")
        val brokerage = owner.brokerages.single()
        val stock = brokerage.stocks.first()
        assertEquals(2, stock.quantity)
        assertEquals(BigDecimal("1000"), stock.averageBuyPrice)
        assertEquals(BigDecimal("2000"), stock.totalBuyAmount)
        assertEquals(BigDecimal("33.333333333333333333"), stock.brokerageWeight)
        assertEquals(BigDecimal("2000"), stock.currentPrice)
        assertEquals(BigDecimal("4000"), stock.valuation)
        assertEquals(BigDecimal("2000"), stock.unrealizedProfit)
        assertEquals(BigDecimal("100"), stock.returnRate)
        assertEquals(2, owner.stockCount)
        assertEquals(BigDecimal("6000"), owner.totalBuyAmount)
        assertEquals(BigDecimal("9000"), owner.valuation)
        assertEquals(BigDecimal("3000"), owner.unrealizedProfit)
        assertEquals(2, brokerage.stockCount)
        assertEquals(BigDecimal("6000"), brokerage.totalBuyAmount)
        assertEquals(BigDecimal("9000"), brokerage.valuation)
        assertEquals(BigDecimal("3000"), brokerage.unrealizedProfit)
        assertEquals(2, dashboard.stockCount)
        assertEquals(2, dashboard.checkedStockCount)
        assertEquals(BigDecimal("6000"), dashboard.totalBuyAmount)
        assertEquals(BigDecimal("9000"), dashboard.valuation)
        assertEquals(BigDecimal("3000"), dashboard.unrealizedProfit)
    }

    @Test
    fun `보유 포지션이 없으면 모든 단계의 금액은 영이고 적용 시세 정보는 없다`() {
        val dashboard = getDashboardResponse(emptyList(), emptyMap())

        val owner = dashboard.owner("병민")
        assertEquals(emptyList(), owner.brokerages)
        assertEquals(0, owner.stockCount)
        assertEquals(BigDecimal.ZERO, owner.totalBuyAmount)
        assertEquals(BigDecimal.ZERO, owner.valuation)
        assertEquals(BigDecimal.ZERO, owner.unrealizedProfit)
        assertEquals(0, dashboard.stockCount)
        assertEquals(0, dashboard.checkedStockCount)
        assertEquals(BigDecimal.ZERO, dashboard.totalBuyAmount)
        assertEquals(BigDecimal.ZERO, dashboard.valuation)
        assertEquals(BigDecimal.ZERO, dashboard.unrealizedProfit)
        assertNull(dashboard.quoteFetchedAt)
        assertNull(dashboard.valuationSession)
        assertEquals(owners.map(Owner::id), dashboard.owners.map(DashboardOwnerResponseDto::ownerId))
    }

    @Test
    fun `보유 종목의 시세가 하나라도 없으면 널 캐스팅 오류를 반환한다`() {
        val positions = listOf(
            position(quantity = 1, totalBuyAmount = 1_000),
            position(
                quantity = 1,
                totalBuyAmount = 2_000,
                stockCode = "000660",
                stockName = "SK하이닉스",
            ),
        )
        val requestedStockCodes = listOf("005930", "000660")
        val marketPricesByItemCode = mapOf(
            "005930" to marketPrice("005930", "삼성전자", 1_500, MarketSession.PRE_MARKET),
        )
        prepareDashboard(positions, requestedStockCodes, marketPricesByItemCode)

        val exception = assertFailsWith<BusinessException> {
            dashboardService.getDashboard()
        }

        assertEquals(CommonError.NULL_CASTING_ERROR, exception.errorType)
    }

    @Test
    fun `가장 최근에 적용한 시세의 시각과 장 구분을 반환한다`() {
        val positions = listOf(
            position(quantity = 1, totalBuyAmount = 1_000),
            position(
                quantity = 1,
                totalBuyAmount = 2_000,
                stockCode = "000660",
                stockName = "SK하이닉스",
            ),
        )
        val marketPricesByItemCode = linkedMapOf(
            "005930" to marketPrice(
                "005930",
                "삼성전자",
                1_500,
                MarketSession.PRE_MARKET,
                "2026-08-14T08:30:00+09:00",
            ),
            "000660" to marketPrice(
                "000660",
                "SK하이닉스",
                2_500,
                MarketSession.AFTER_MARKET,
                "2026-08-14T18:00:00+09:00",
            ),
        )

        val dashboard = getDashboardResponse(positions, marketPricesByItemCode)

        assertEquals("2026-08-14T18:00+09:00", dashboard.quoteFetchedAt)
        assertEquals(MarketSession.AFTER_MARKET, dashboard.valuationSession)
    }

    @Test
    fun `같은 종목을 두 증권사에 보유하면 증권사별 종목은 분리하고 종목 수는 중복 없이 센다`() {
        val positions = listOf(
            position(
                quantity = 2,
                totalBuyAmount = 2_000,
                brokerage = Brokerage(1, "264", "키움증권"),
            ),
            position(
                quantity = 1,
                totalBuyAmount = 1_000,
                brokerage = Brokerage(2, "238", "미래에셋증권"),
            ),
        )
        val marketPricesByItemCode = mapOf(
            "005930" to marketPrice("005930", "삼성전자", 1_500, MarketSession.REGULAR_MARKET),
        )

        val dashboard = getDashboardResponse(positions, marketPricesByItemCode)

        val owner = dashboard.owner("병민")
        assertEquals(2, owner.brokerages.size)
        assertEquals(setOf("264", "238"), owner.brokerages.map { brokerage -> brokerage.brokerageCode }.toSet())
        assertEquals(
            listOf(BigDecimal("100"), BigDecimal("100")),
            owner.brokerages.map { brokerage -> brokerage.stocks.single().brokerageWeight },
        )
        assertEquals(1, owner.stockCount)
        assertEquals(1, dashboard.stockCount)
        assertEquals(1, dashboard.checkedStockCount)
    }

    @Test
    fun `증권사 코드 공백을 제거하고 같은 증권사와 종목도 소유주별로 분리한다`() {
        val positions = listOf(
            position(
                quantity = 3,
                totalBuyAmount = 3_000,
                brokerage = Brokerage(1, "264   ", "키움증권"),
            ),
            position(
                quantity = 4,
                totalBuyAmount = 4_000,
                owner = owners[1],
                brokerage = Brokerage(1, "264", "키움증권"),
            ),
        )
        val marketPricesByItemCode = mapOf(
            "005930" to marketPrice("005930", "삼성전자", 1_000, MarketSession.REGULAR_MARKET),
        )

        val dashboard = getDashboardResponse(positions, marketPricesByItemCode)

        val firstOwnerBrokerage = dashboard.owner("병민").brokerages.single()
        val secondOwnerBrokerage = dashboard.owner("할머니").brokerages.single()
        assertEquals("264", firstOwnerBrokerage.brokerageCode)
        assertEquals(3, firstOwnerBrokerage.stocks.single().quantity)
        assertEquals(4, secondOwnerBrokerage.stocks.single().quantity)
    }

    @Test
    fun `영속 포지션의 수량과 총매입액으로 매수평균단가를 반환한다`() {
        val positions = listOf(
            position(quantity = 4, totalBuyAmount = 4_800),
        )
        val marketPricesByItemCode = mapOf(
            "005930" to marketPrice("005930", "삼성전자", 1_000, MarketSession.REGULAR_MARKET),
        )

        val stock = getDashboardResponse(positions, marketPricesByItemCode)
            .owner("병민")
            .brokerages
            .single()
            .stocks
            .single()

        assertEquals(4, stock.quantity)
        assertEquals(BigDecimal("1200"), stock.averageBuyPrice)
        assertEquals(BigDecimal("4800"), stock.totalBuyAmount)
    }

    @Test
    fun `보유 포지션은 증권사명 순서로 반환한다`() {
        val positions = listOf(
            position(
                quantity = 3,
                totalBuyAmount = 3_000,
                brokerage = Brokerage(2, "238", "미래에셋증권"),
            ),
            position(
                quantity = 2,
                totalBuyAmount = 2_000,
                brokerage = Brokerage(3, "279", "DB금융투자"),
            ),
        )
        val marketPricesByItemCode = mapOf(
            "005930" to marketPrice("005930", "삼성전자", 1_000, MarketSession.REGULAR_MARKET),
        )

        val brokerages = getDashboardResponse(positions, marketPricesByItemCode)
            .owner("병민")
            .brokerages

        assertEquals(listOf("279", "238"), brokerages.map(DashboardBrokerageResponseDto::brokerageCode))
        assertEquals(listOf(2, 3), brokerages.map { brokerage -> brokerage.stocks.single().quantity })
    }

    private fun getDashboardResponse(
        positions: List<DashboardPosition>,
        marketPricesByItemCode: Map<String, MarketPriceDto>,
        requestedStockCodes: List<String> = marketPricesByItemCode.keys.toList(),
    ): DashboardResponseDto {
        prepareDashboard(positions, requestedStockCodes, marketPricesByItemCode)
        val dashboard = dashboardService.getDashboard().data
        verify(marketPriceService).getMarketPrices(requestedStockCodes)
        return dashboard
    }

    private fun prepareDashboard(
        positions: List<DashboardPosition>,
        requestedStockCodes: List<String>,
        marketPricesByItemCode: Map<String, MarketPriceDto>,
    ) {
        `when`(ownerRepository.findAll()).thenReturn(owners)
        `when`(dashboardPositionRepository.findAll()).thenReturn(positions)
        `when`(marketPriceService.getMarketPrices(requestedStockCodes)).thenReturn(marketPricesByItemCode)
    }

    private fun position(
        quantity: Long,
        totalBuyAmount: Long,
        stockCode: String = "005930",
        stockName: String = "삼성전자",
        owner: Owner = owners.first(),
        brokerage: Brokerage = Brokerage(1, "264", "키움증권"),
    ): DashboardPosition {
        return DashboardPosition(
            owner = owner,
            security = Security.of(stockCode, stockName, "코스피", false),
            brokerage = brokerage,
            quantity = BigInteger.valueOf(quantity),
            totalBuyAmount = BigInteger.valueOf(totalBuyAmount),
        )
    }

    private fun marketPrice(
        stockCode: String,
        stockName: String,
        price: Long,
        session: MarketSession,
        localTradedAt: String = "2026-08-14T10:00:00+09:00",
    ): MarketPriceDto {
        return MarketPriceDto(
            itemCode = stockCode,
            localTradedAt = OffsetDateTime.parse(localTradedAt),
            marketStatus = "장중",
            price = price,
            session = session,
            stockName = stockName,
        )
    }

    private fun DashboardResponseDto.owner(ownerName: String): DashboardOwnerResponseDto {
        return owners.single { owner -> owner.ownerName == ownerName }
    }
}
