package kr.byeongmin.stockdaejang.domain.history

import kr.byeongmin.stockdaejang.domain.history.dto.GetHistoryRequestDto
import kr.byeongmin.stockdaejang.domain.trade.types.TradeType
import org.junit.jupiter.api.Test
import java.time.OffsetDateTime
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class GetHistoryRequestDtoTest {
	@Test
	fun `아무 필터도 없으면 필터 미적용 상태가 된다`() {
		val historyFilters = request()

		assertFalse(historyFilters.hasFilters())
	}

	@Test
	fun `필터 중 하나라도 채워지면 필터 적용 상태가 된다`() {
		val from = OffsetDateTime.parse("2026-08-01T00:00:00+09:00")
		val to = OffsetDateTime.parse("2026-08-21T00:00:00+09:00")
		val historyFilters = request(from = from, to = to, ownerId = 2L, brokerageCode = "264")

		assertEquals(from, historyFilters.from)
		assertEquals(to, historyFilters.to)
		assertEquals(2L, historyFilters.ownerId)
		assertEquals("264", historyFilters.brokerageCode)
		assertTrue(historyFilters.hasFilters())
	}

	private fun request(
		stockNameOrCode: String? = null,
		from: OffsetDateTime? = null,
		to: OffsetDateTime? = null,
		ownerId: Long? = null,
		brokerageCode: String? = null,
		page: Int = 1,
		pageSize: Int = 25,
	): GetHistoryRequestDto {
		return GetHistoryRequestDto(
			side = TradeType.BUY,
			stockNameOrCode = stockNameOrCode,
			from = from,
			to = to,
			ownerId = ownerId,
			brokerageCode = brokerageCode,
			page = page,
			pageSize = pageSize,
		)
	}
}
