package kr.byeongmin.stockdaejang.domain.stock.entity

import com.fasterxml.jackson.annotation.JsonProperty
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.persistence.*
import kr.byeongmin.stockdaejang.domain.common.validation.STOCK_CODE_PATTERN
import kr.byeongmin.stockdaejang.global.entity.Base

@Entity
@Table(name = "stocks")
@Schema(description = "종목 기준 정보")
class Stock(
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "id", nullable = false)
	@field:Schema(description = "종목 내부 대리키", example = "1")
	override val id: Long? = null,

	@Column(name = "stock_code", nullable = false, unique = true)
	@field:Schema(
		description = "종목코드.",
		example = "005930",
		pattern = STOCK_CODE_PATTERN,
	)
	val stockCode: String,

	@Column(name = "stock_name", nullable = false)
	@field:Schema(description = "종목명", example = "삼성전자")
	var stockName: String,

	@Column(name = "market", nullable = false)
	@field:Schema(description = "시장", example = "코스피")
	var market: String,

	@Column(name = "is_etf", nullable = false)
	@get:JsonProperty("isEtf")
	@get:Schema(name = "isEtf", description = "ETF 여부", example = "false")
	var isEtf: Boolean = false,
) : Base() {
	companion object {
		fun of(
			stockCode: String,
			stockName: String,
			market: String,
			isEtf: Boolean,
		): Stock {
			return Stock(
				stockCode = stockCode,
				stockName = stockName,
				market = market,
				isEtf = isEtf,
			)
		}
	}
}
