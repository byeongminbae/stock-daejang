package kr.byeongmin.stockdaejang.domain.history.repository

import kr.byeongmin.stockdaejang.domain.trade.dto.CreateTradeRequestDto
import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import kr.byeongmin.stockdaejang.domain.trade.enums.TradeType
import kr.byeongmin.stockdaejang.domain.trade.service.TradeService
import kr.byeongmin.stockdaejang.support.QueryDslTestData
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.springframework.context.annotation.Import
import org.springframework.data.domain.PageRequest
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers
import org.testcontainers.postgresql.PostgreSQLContainer
import java.time.OffsetDateTime
import kotlin.test.assertEquals

@SpringBootTest
@Testcontainers
@Import(QueryDslTestData::class)
class HistoryQuerydslRepositoryIntegrationTest {
    @Autowired
    private lateinit var repository: HistoryQuerydslRepository

    @Autowired
    private lateinit var tradeService: TradeService

    @Autowired
    private lateinit var testData: QueryDslTestData

    @BeforeEach
    fun clearHistory() {
        testData.clearTrades()
    }

    @Test
    fun `증권사 필터는 해당 원장만 보이고 매수 종목은 중복 제거한다`() {
        tradeService.createTrade(trade(stockCode = "HST001", brokerageCode = "264", executedAt = "2026-08-01T10:00"))
        tradeService.createTrade(trade(stockCode = "HST001", brokerageCode = "238", executedAt = "2026-08-01T11:00"))
        tradeService.createTrade(trade(stockCode = "HST002", brokerageCode = "264", executedAt = "2026-08-01T12:00"))

        val brokerageRows = findPage(brokerageCode = "238")
        val allRows = findPage()
        val traded = repository.findTradedStocks(TradeType.BUY)

        assertEquals(1L, count(brokerageCode = "238"))
        assertEquals(listOf("HST001"), brokerageRows.map { it.stock.stockCode })
        assertEquals("238", brokerageRows.single().brokerage.code)
        assertEquals("미래에셋증권", brokerageRows.single().brokerage.name)
        assertEquals(3, allRows.size)
        assertEquals(setOf("HST001", "HST002"), traded.map { it.stockCode }.toSet())
        assertEquals(2, traded.size)
    }

    private fun findPage(brokerageCode: String? = null): List<Trade> {
        return repository.findPage(
            side = TradeType.BUY,
            stockNameOrCode = null,
            from = null,
            to = null,
            ownerId = null,
            brokerageCode = brokerageCode,
            pageable = PageRequest.of(0, 25),
        )
    }

    private fun count(brokerageCode: String? = null): Long {
        return repository.count(
            side = TradeType.BUY,
            stockNameOrCode = null,
            from = null,
            to = null,
            ownerId = null,
            brokerageCode = brokerageCode,
        )
    }

    private fun trade(stockCode: String, brokerageCode: String, executedAt: String): CreateTradeRequestDto {
        return CreateTradeRequestDto(
            brokerageCode = brokerageCode,
            executedAt = OffsetDateTime.parse("$executedAt:00+09:00"),
            isEtf = false,
            stockCode = stockCode,
            market = "KRX",
            ownerId = 1,
            quantity = 1,
            stockName = "이력 테스트 종목",
            side = TradeType.BUY,
            unitPrice = 100,
        )
    }

    companion object {
        @Container
        @ServiceConnection
        @JvmStatic
        val postgres = PostgreSQLContainer("postgres:17-alpine")
    }
}
