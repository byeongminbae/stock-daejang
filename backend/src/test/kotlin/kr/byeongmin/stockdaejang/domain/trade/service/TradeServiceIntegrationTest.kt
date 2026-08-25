package kr.byeongmin.stockdaejang.domain.trade.service

import com.querydsl.jpa.impl.JPAQueryFactory
import kr.byeongmin.stockdaejang.domain.brokerage.entity.QBrokerage.brokerage
import kr.byeongmin.stockdaejang.domain.dashboard.entity.QDashboardPosition.dashboardPosition
import kr.byeongmin.stockdaejang.domain.owner.entity.QOwner.owner
import kr.byeongmin.stockdaejang.domain.stock.entity.QStock.stock
import kr.byeongmin.stockdaejang.domain.trade.dto.DeleteTradesRequestDto
import kr.byeongmin.stockdaejang.domain.trade.dto.TradeRequestDto
import kr.byeongmin.stockdaejang.domain.trade.dto.TradePreviewRequestDto
import kr.byeongmin.stockdaejang.domain.trade.dto.UpdateTradeRequestDto
import kr.byeongmin.stockdaejang.domain.trade.error.TradeError
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.domain.trade.entity.QTrade.trade
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import kr.byeongmin.stockdaejang.support.QueryDslTestData
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.springframework.context.annotation.Import
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import org.testcontainers.postgresql.PostgreSQLContainer
import java.math.BigInteger
import java.time.OffsetDateTime
import kotlin.test.assertEquals
import kotlin.test.assertNull

@SpringBootTest
@Testcontainers
@Import(QueryDslTestData::class)
class TradeServiceIntegrationTest {
    @Autowired
    private lateinit var tradeService: TradeService

    @Autowired
    private lateinit var queryFactory: JPAQueryFactory

    @Autowired
    private lateinit var testData: QueryDslTestData

    @BeforeEach
    fun clearLedger() {
        testData.clearTrades()
    }

    @Test
    fun `과거 매수를 수정하면 후속 매도 손익이 재계산되고 원장을 깨는 삭제는 롤백된다`() {
        val firstBuy = tradeService.createTrade(trade(quantity = "3", unitPrice = "100", executedAt = "2026-08-01T10:00"))
        val secondBuy = tradeService.createTrade(trade(quantity = "2", unitPrice = "200", executedAt = "2026-08-01T11:00"))
        val sell = tradeService.createTrade(
            trade(side = "SELL", quantity = "2", unitPrice = "200", executedAt = "2026-08-02T10:00"),
        )
        assertEquals("120", realizedProfit(sell.data.id))
        assertPosition(quantity = 3, totalBuyAmount = 420)

        tradeService.updateTrade(
            update(
                id = secondBuy.data.id,
                quantity = "2",
                unitPrice = "300",
                executedAt = "2026-08-01T11:00",
            ),
        )
        assertEquals("40", realizedProfit(sell.data.id))
        assertPosition(quantity = 3, totalBuyAmount = 540)
        assertEquals("3", tradeService.getPositionAverage(1, "264", "TST001").data.heldQuantity)
        assertEquals(
            "보유 수량 3주를 초과할 수 없습니다.",
            tradeService.previewTrade(preview(quantity = "4")).data.quantityError,
        )
        val validPreview = tradeService.previewTrade(preview(quantity = "2"))
        assertEquals("400", validPreview.data.amount)
        assertEquals("40", validPreview.data.expectedProfit)
        assertEquals(null, validPreview.data.quantityError)
        assertEquals(
            "선택한 증권사에 보유 수량이\u00a0없습니다.",
            tradeService.previewTrade(preview(quantity = "1", itemCode = "TST002")).data.quantityError,
        )

        val exception = assertThrows<BusinessException> {
            tradeService.deleteTrades(DeleteTradesRequestDto(listOf(firstBuy.data.id, secondBuy.data.id), "BUY"))
        }
        assertEquals(TradeError.INSUFFICIENT_HOLDING, exception.errorType)
        assertEquals(
            TradeError.INSUFFICIENT_HOLDING.message,
            exception.fieldErrors["quantity"],
        )
        assertEquals(3L, tradeCount())
        assertEquals("40", realizedProfit(sell.data.id))
        assertPosition(quantity = 3, totalBuyAmount = 540)
    }

    @Test
    fun `다른 증권사에만 보유한 종목은 매도할 수 없고 선택한 증권사 원가로 손익을 계산한다`() {
        tradeService.createTrade(trade(quantity = "2", unitPrice = "100", executedAt = "2026-08-01T10:00"))

        val exception = assertThrows<BusinessException> {
            tradeService.createTrade(
                trade(side = "SELL", quantity = "1", unitPrice = "200", executedAt = "2026-08-02T10:00", brokerageCode = "238"),
            )
        }
        assertEquals(TradeError.INSUFFICIENT_HOLDING, exception.errorType)
        assertEquals(1L, tradeCount())

        tradeService.createTrade(
            trade(quantity = "2", unitPrice = "50", executedAt = "2026-08-01T11:00", brokerageCode = "238"),
        )
        val sell = tradeService.createTrade(
            trade(side = "SELL", quantity = "1", unitPrice = "200", executedAt = "2026-08-02T10:00", brokerageCode = "238"),
        )

        assertEquals("150", realizedProfit(sell.data.id))
        assertEquals("2", tradeService.getPositionAverage(1, "264", "TST001").data.heldQuantity)
        assertEquals("1", tradeService.getPositionAverage(1, "238", "TST001").data.heldQuantity)
    }

    @Test
    fun `매도를 소유주 종목 증권사까지 옮기면 양쪽 원장을 재생하고 대상 보유가 없으면 롤백한다`() {
        tradeService.createTrade(trade(quantity = "2", unitPrice = "100", executedAt = "2026-08-01T10:00"))
        val movableSell = tradeService.createTrade(
            trade(side = "SELL", quantity = "1", unitPrice = "200", executedAt = "2026-08-02T10:00"),
        )
        tradeService.createTrade(
            trade(
                quantity = "2",
                unitPrice = "50",
                executedAt = "2026-08-01T09:00",
                ownerId = 2,
                brokerageCode = "238",
                itemCode = "TST002",
            ),
        )

        tradeService.updateTrade(
            update(
                id = movableSell.data.id,
                side = "SELL",
                quantity = "1",
                unitPrice = "100",
                executedAt = "2026-08-02T10:00",
                ownerId = 2,
                brokerageCode = "238",
                itemCode = "TST002",
            ),
        )

        assertEquals("2", tradeService.getPositionAverage(1, "264", "TST001").data.heldQuantity)
        assertEquals("1", tradeService.getPositionAverage(2, "238", "TST002").data.heldQuantity)
        assertEquals("50", realizedProfit(movableSell.data.id))
        assertPosition(quantity = 2, totalBuyAmount = 200)
        assertPosition(
            ownerId = 2,
            brokerageCode = "238",
            itemCode = "TST002",
            quantity = 1,
            totalBuyAmount = 50,
        )

        val exception = assertThrows<BusinessException> {
            tradeService.updateTrade(
                update(
                    id = movableSell.data.id,
                    side = "SELL",
                    quantity = "1",
                    unitPrice = "100",
                    executedAt = "2026-08-02T10:00",
                    ownerId = 3,
                    brokerageCode = "218",
                    itemCode = "TST003",
                ),
            )
        }

        assertEquals(TradeError.INSUFFICIENT_HOLDING, exception.errorType)
        assertEquals(3L, tradeCount())
        assertEquals("2", tradeService.getPositionAverage(1, "264", "TST001").data.heldQuantity)
        assertEquals("1", tradeService.getPositionAverage(2, "238", "TST002").data.heldQuantity)
        assertEquals(
            2L,
            queryFactory.select(owner.id)
                .from(trade)
                .join(trade.owner, owner)
                .where(trade.id.eq(movableSell.data.id.toLong()))
                .fetchOne(),
        )
        assertEquals(
            "TST002",
            queryFactory.select(stock.itemCode)
                .from(trade)
                .join(trade.stock, stock)
                .where(trade.id.eq(movableSell.data.id.toLong()))
                .fetchOne(),
        )
        assertEquals(
            "238",
            queryFactory.select(brokerage.code)
                .from(trade)
                .join(trade.brokerage, brokerage)
                .where(trade.id.eq(movableSell.data.id.toLong()))
                .fetchOne()
                ?.trim(),
        )
        assertEquals("50", realizedProfit(movableSell.data.id))
        assertPosition(quantity = 2, totalBuyAmount = 200)
        assertPosition(
            ownerId = 2,
            brokerageCode = "238",
            itemCode = "TST002",
            quantity = 1,
            totalBuyAmount = 50,
        )
    }

    @Test
    fun `여러 거래 삭제는 함께 성공하고 반대 매도 요청은 어떤 거래도 삭제하지 않는다`() {
        val firstBuy = tradeService.createTrade(trade(quantity = "1", unitPrice = "100", executedAt = "2026-08-01T10:00"))
        val secondBuy = tradeService.createTrade(trade(quantity = "1", unitPrice = "200", executedAt = "2026-08-01T11:00"))

        val deleted = tradeService.deleteTrades(DeleteTradesRequestDto(listOf(firstBuy.data.id, secondBuy.data.id), "BUY"))

        assertEquals(2, deleted.data.deletedCount)
        assertEquals(0L, tradeCount())
        assertNull(position())

        val buy = tradeService.createTrade(trade(quantity = "2", unitPrice = "100", executedAt = "2026-08-03T10:00"))
        val sell = tradeService.createTrade(trade(side = "SELL", quantity = "1", unitPrice = "200", executedAt = "2026-08-04T10:00"))
        val exception = assertThrows<BusinessException> {
            tradeService.deleteTrades(DeleteTradesRequestDto(listOf(buy.data.id, sell.data.id), "SELL"))
        }

        assertEquals(CommonError.RESOURCE_NOT_FOUND, exception.errorType)
        assertEquals(2L, tradeCount())
        assertEquals("100", realizedProfit(sell.data.id))
        assertEquals("1", tradeService.getPositionAverage(1, "264", "TST001").data.heldQuantity)
        assertPosition(quantity = 1, totalBuyAmount = 100)
    }

    @Test
    fun `전량 매도와 재매수와 수정 삭제마다 대시보드 포지션을 갱신한다`() {
        tradeService.createTrade(trade(quantity = "10", unitPrice = "100", executedAt = "2026-08-01T10:00"))
        assertPosition(quantity = 10, totalBuyAmount = 1_000)

        tradeService.createTrade(
            trade(side = "SELL", quantity = "10", unitPrice = "100", executedAt = "2026-08-02T10:00"),
        )
        assertNull(position())

        val newBuy = tradeService.createTrade(
            trade(quantity = "10", unitPrice = "200", executedAt = "2026-08-03T10:00"),
        )
        assertPosition(quantity = 10, totalBuyAmount = 2_000)

        tradeService.updateTrade(
            update(
                id = newBuy.data.id,
                quantity = "10",
                unitPrice = "300",
                executedAt = "2026-08-03T10:00",
            ),
        )
        assertPosition(quantity = 10, totalBuyAmount = 3_000)

        tradeService.deleteTrades(DeleteTradesRequestDto(listOf(newBuy.data.id), "BUY"))
        assertNull(position())
    }

    @Test
    fun `같은 종목을 영문 이름으로 다시 생성 수정해도 최초 한국어 종목명은 유지한다`() {
        tradeService.createTrade(
            trade(
                quantity = "1",
                unitPrice = "100",
                executedAt = "2026-08-01T10:00",
                itemCode = "TST004",
                stockName = "최초 한국어 종목명",
            ),
        )
        val laterBuy = tradeService.createTrade(
            trade(
                quantity = "1",
                unitPrice = "200",
                executedAt = "2026-08-01T11:00",
                itemCode = "TST004",
                stockName = "English renamed stock",
            ),
        )
        tradeService.updateTrade(
            update(
                id = laterBuy.data.id,
                quantity = "1",
                unitPrice = "300",
                executedAt = "2026-08-01T11:00",
                itemCode = "TST004",
                stockName = "Another English name",
            ),
        )

        assertEquals(
            "최초 한국어 종목명",
            queryFactory.select(stock.stockName)
                .from(stock)
                .where(stock.itemCode.eq("TST004"))
                .fetchOne(),
        )
    }

    @Test
    fun `Short 최댓값을 넘겨 DB에 추가한 소유주도 거래할 수 있다`() {
        testData.createOwner(40_000L, "새 소유주")

        tradeService.createTrade(
            trade(
                quantity = "1",
                unitPrice = "100",
                executedAt = "2026-08-01T10:00",
                ownerId = 40_000L,
            ),
        )

        assertEquals("1", tradeService.getPositionAverage(40_000L, "264", "TST001").data.heldQuantity)
    }

    private fun realizedProfit(id: String): String {
        return queryFactory
            .select(trade.realizedProfit)
            .from(trade)
            .where(trade.id.eq(id.toLong()))
            .fetchOne()
            .toString()
    }

    private fun tradeCount(): Long {
        return queryFactory.select(trade.count()).from(trade).fetchOne() ?: 0
    }

    private fun assertPosition(
        ownerId: Long = 1,
        brokerageCode: String = "264",
        itemCode: String = "TST001",
        quantity: Long,
        totalBuyAmount: Long,
    ) {
        val position = position(ownerId, brokerageCode, itemCode)
        assertEquals(BigInteger.valueOf(quantity), position?.get(dashboardPosition.quantity))
        assertEquals(BigInteger.valueOf(totalBuyAmount), position?.get(dashboardPosition.totalBuyAmount))
    }

    private fun position(
        ownerId: Long = 1,
        brokerageCode: String = "264",
        itemCode: String = "TST001",
    ) = queryFactory
        .select(dashboardPosition.quantity, dashboardPosition.totalBuyAmount)
        .from(dashboardPosition)
        .join(dashboardPosition.brokerage, brokerage)
        .join(dashboardPosition.stock, stock)
        .where(
            dashboardPosition.owner.id.eq(ownerId),
            brokerage.code.eq(brokerageCode),
            stock.itemCode.eq(itemCode),
        )
        .fetchOne()

    private fun trade(
        side: String = "BUY",
        quantity: String,
        unitPrice: String,
        executedAt: String,
        ownerId: Long = 1,
        brokerageCode: String = "264",
        itemCode: String = "TST001",
        stockName: String = "통합 테스트 종목",
    ): TradeRequestDto {
        return TradeRequestDto(
            brokerageCode = brokerageCode,
            executedAt = OffsetDateTime.parse("$executedAt:00+09:00"),
            isEtf = false,
            itemCode = itemCode,
            market = "KRX",
            ownerId = ownerId,
            quantity = quantity,
            stockName = stockName,
            side = side,
            unitPrice = unitPrice,
        )
    }

    private fun update(
        id: String,
        side: String = "BUY",
        quantity: String,
        unitPrice: String,
        executedAt: String,
        ownerId: Long = 1,
        brokerageCode: String = "264",
        itemCode: String = "TST001",
        stockName: String = "통합 테스트 종목",
    ): UpdateTradeRequestDto {
        return UpdateTradeRequestDto(
            id = id,
            brokerageCode = brokerageCode,
            executedAt = OffsetDateTime.parse("$executedAt:00+09:00"),
            isEtf = false,
            itemCode = itemCode,
            market = "KRX",
            ownerId = ownerId,
            quantity = quantity,
            stockName = stockName,
            side = side,
            unitPrice = unitPrice,
        )
    }

    private fun preview(quantity: String, itemCode: String = "TST001"): TradePreviewRequestDto {
        return TradePreviewRequestDto(
            brokerageCode = "264",
            itemCode = itemCode,
            ownerId = 1,
            quantity = quantity,
            side = "SELL",
            unitPrice = "200",
        )
    }

    companion object {
        @Container
        @ServiceConnection
        @JvmStatic
        val postgres = PostgreSQLContainer("postgres:17-alpine")
    }
}
