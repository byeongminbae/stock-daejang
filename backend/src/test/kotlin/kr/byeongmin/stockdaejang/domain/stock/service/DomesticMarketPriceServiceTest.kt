package kr.byeongmin.stockdaejang.domain.stock.service

import kr.byeongmin.stockdaejang.domain.stock.dto.MarketStockCodesDto
import kr.byeongmin.stockdaejang.domain.stock.enums.DomesticMarketSession
import kr.byeongmin.stockdaejang.domain.stock.provider.MarketPriceProvider
import kr.byeongmin.stockdaejang.external.naver.dto.MarketPriceSnapshotDto
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import java.time.Clock
import java.time.Instant
import java.time.OffsetDateTime
import java.time.ZoneOffset
import kotlin.test.assertEquals

class DomesticMarketPriceServiceTest {
    @Test
    fun `validates request count before calling the provider`() {
        val provider = FakeMarketPriceProvider()
        val service = DomesticMarketPriceService(provider)

        val tooMany = assertThrows<BusinessException> {
            service.getMarketPrices(MarketStockCodesDto((0..500).map { stockCode -> "%06d".format(stockCode) }))
        }

        assertEquals(CommonError.INVALID_INPUT_VALUE, tooMany.errorType)
        assertEquals(emptyList(), provider.requestedBatches)
    }

    @Test
    fun `rejects a non-positive provider batch capability as an internal error`() {
        val provider = FakeMarketPriceProvider(maxBatchSize = 0)

        val exception = assertThrows<BusinessException> {
            DomesticMarketPriceService(provider).getMarketPrices(MarketStockCodesDto(listOf("005930")))
        }

        assertEquals(CommonError.INTERNAL_SERVER_ERROR, exception.errorType)
    }

    @Test
    fun `returns every normalized requested code in request order when every batch succeeds`() {
        val provider = FakeMarketPriceProvider(maxBatchSize = 2) { stockCodes ->
            stockCodes.asReversed().map { stockCode -> snapshot(stockCode, DomesticMarketSession.REGULAR_MARKET) }
        }
        val service = DomesticMarketPriceService(provider)

        val prices = service.getMarketPrices(MarketStockCodesDto(listOf("005930", "000660", "005930", "035420")))

        assertEquals(listOf(listOf("005930", "000660"), listOf("035420")), provider.requestedBatches)
        assertEquals(listOf("005930", "000660", "035420"), prices.keys.toList())
        assertEquals(100, prices.getValue("005930").price)
        assertEquals(100, prices.getValue("000660").price)
        assertEquals(100, prices.getValue("035420").price)
    }

    @Test
    fun `fails the whole batch when the provider reports an external API error`() {
        val provider = FakeMarketPriceProvider(maxBatchSize = 2) { stockCodes ->
            if (stockCodes == listOf("035420")) {
                throw BusinessException(CommonError.EXTERNAL_API_ERROR)
            }
            stockCodes.map { stockCode -> snapshot(stockCode, DomesticMarketSession.REGULAR_MARKET) }
        }

        val exception = assertThrows<BusinessException> {
            DomesticMarketPriceService(provider).getMarketPrices(
                MarketStockCodesDto(
                    listOf(
                        "005930",
                        "000660",
                        "035420"
                    )
                )
            )
        }

        assertEquals(CommonError.EXTERNAL_API_ERROR, exception.errorType)
        assertEquals(listOf(listOf("005930", "000660"), listOf("035420")), provider.requestedBatches)
    }

    @Test
    fun `propagates non-external provider errors directly`() {
        val invalidInputProvider = FakeMarketPriceProvider {
            throw BusinessException(CommonError.INVALID_INPUT_VALUE)
        }
        val invalidInput = assertThrows<BusinessException> {
            DomesticMarketPriceService(invalidInputProvider).getMarketPrices(MarketStockCodesDto(listOf("005930")))
        }
        assertEquals(CommonError.INVALID_INPUT_VALUE, invalidInput.errorType)
    }

    @Test
    fun `returns an empty map without calling the provider for an empty request`() {
        val provider = FakeMarketPriceProvider(maxBatchSize = 0)

        val prices = DomesticMarketPriceService(provider).getMarketPrices(MarketStockCodesDto(emptyList()))

        assertEquals(emptyMap(), prices)
        assertEquals(emptyList(), provider.requestedBatches)
    }

    @Test
    fun `selects regular and over-market candidates by translated session`() {
        val provider = FakeMarketPriceProvider { stockCodes ->
            stockCodes.map { stockCode ->
                when (stockCode) {
                    "005930" -> snapshot(stockCode, DomesticMarketSession.PREOPEN)
                    "000660" -> snapshot(stockCode, DomesticMarketSession.REGULAR_MARKET)
                    "035420" -> snapshot(stockCode, DomesticMarketSession.PRE_MARKET)
                    else -> snapshot(stockCode, DomesticMarketSession.AFTER_MARKET)
                }
            }
        }
        val service = DomesticMarketPriceService(provider, fixedClock("2026-08-11T17:59:59Z"))

        val prices = service.getMarketPrices(MarketStockCodesDto(listOf("005930", "000660", "035420", "051910")))

        assertEquals(100, prices.getValue("005930").price)
        assertEquals(DomesticMarketSession.PREOPEN, prices.getValue("005930").marketSession)
        assertEquals(100, prices.getValue("000660").price)
        assertEquals(110, prices.getValue("035420").price)
        assertEquals("2026-08-11T20:00+09:00", prices.getValue("035420").localTradedAt.toString())
        assertEquals(110, prices.getValue("051910").price)
        assertEquals(DomesticMarketSession.AFTER_MARKET, prices.getValue("051910").marketSession)
    }

    @Test
    fun `expires after-market at local traded date start plus twenty-seven hours`() {
        val provider = FakeMarketPriceProvider {
            listOf(snapshot("005930", DomesticMarketSession.AFTER_MARKET))
        }
        val service = DomesticMarketPriceService(provider, fixedClock("2026-08-11T18:00:00Z"))

        val price = service.getMarketPrices(MarketStockCodesDto(listOf("005930"))).getValue("005930")

        assertEquals(100, price.price)
        assertEquals("2026-08-11T15:30+09:00", price.localTradedAt.toString())
        assertEquals(DomesticMarketSession.REGULAR_MARKET, price.marketSession)
    }

    @Test
    fun `rejects an off-market snapshot whose selected candidate is missing`() {
        val provider = FakeMarketPriceProvider {
            listOf(snapshot("005930", DomesticMarketSession.PRE_MARKET).copy(overPrice = null))
        }

        val exception = assertThrows<BusinessException> {
            DomesticMarketPriceService(provider).getMarketPrices(MarketStockCodesDto(listOf("005930")))
        }

        assertEquals(CommonError.NULL_CASTING_ERROR, exception.errorType)
    }

    private fun snapshot(stockCode: String, session: DomesticMarketSession): MarketPriceSnapshotDto {
        return MarketPriceSnapshotDto(
            stockCode = stockCode,
            marketStatus = "CLOSE",
            stockName = "종목",
            regularPrice = 100,
            regularTradedAt = OffsetDateTime.parse("2026-08-11T15:30:00+09:00"),
            overPrice = 110,
            overTradedAt = OffsetDateTime.parse("2026-08-11T20:00:00+09:00"),
            marketSession = session,
        )
    }

    private fun fixedClock(instant: String): Clock {
        return Clock.fixed(Instant.parse(instant), ZoneOffset.UTC)
    }

    private class FakeMarketPriceProvider(
        override val maxBatchSize: Int = 50,
        private val fetch: (List<String>) -> List<MarketPriceSnapshotDto> = { emptyList() },
    ) : MarketPriceProvider {
        val requestedBatches = mutableListOf<List<String>>()

        override fun fetchMarketPrices(stockCodes: List<String>): List<MarketPriceSnapshotDto> {
            requestedBatches += stockCodes
            return fetch(stockCodes)
        }
    }
}
