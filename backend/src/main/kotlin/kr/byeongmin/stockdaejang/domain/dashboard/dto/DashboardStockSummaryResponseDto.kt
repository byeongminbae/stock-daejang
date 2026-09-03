package kr.byeongmin.stockdaejang.domain.dashboard.dto

import io.swagger.v3.oas.annotations.media.Schema
import kr.byeongmin.stockdaejang.domain.common.util.rounded
import kr.byeongmin.stockdaejang.domain.common.util.sumOfDecimal
import kr.byeongmin.stockdaejang.domain.common.util.toPercentageOf
import java.math.BigDecimal

@Schema(description = "종목별 보유 현황과 평가 합계. 소유주와 증권사를 가리지 않고 같은 종목을 모두 합산")
data class DashboardStockSummaryResponseDto(
	@field:Schema(
		description = "종목코드",
		example = "005930",
		pattern = "^[0-9A-Z]{6}$",
	)
	val stockCode: String,

	@field:Schema(
		description = "종목명",
		example = "삼성전자",
	)
	val stockName: String,

	@field:Schema(
		description = "전체 보유 수량. 해외주식 등은 소수일 수 있음",
		example = "12",
	)
	val quantity: BigDecimal,

	@field:Schema(
		description = "전체 매입액. 원 단위 숫자",
		example = "890000",
	)
	val totalBuyAmount: BigDecimal,

	@field:Schema(
		description = "현재가. 원 단위 숫자",
		example = "79800",
	)
	val currentPrice: BigDecimal,

	@field:Schema(
		description = "전체 평가 손익. 원 단위 숫자",
		example = "107500",
	)
	val unrealizedProfit: BigDecimal,

	@field:Schema(
		description = "전체 평가액. 원 단위 숫자",
		example = "997500",
	)
	val valuation: BigDecimal,

	@field:Schema(
		description = "수익률. 퍼센트 단위 숫자",
		example = "12.08",
	)
	val returnRate: BigDecimal,
) {
	companion object {
		fun of(dashboardStockResponseDtos: List<DashboardStockResponseDto>): DashboardStockSummaryResponseDto {
			val totalBuyAmount =
				dashboardStockResponseDtos.sumOfDecimal(selector = DashboardStockResponseDto::totalBuyAmount)
			val unrealizedProfit =
				dashboardStockResponseDtos.sumOfDecimal(selector = DashboardStockResponseDto::unrealizedProfit)
			// 같은 종목코드로 묶었으므로 아무거나 선택해도 종목코드/종목명/현재가는 동일
			val dashboardResponseDto = dashboardStockResponseDtos.first()
			return DashboardStockSummaryResponseDto(
				stockCode = dashboardResponseDto.stockCode,
				stockName = dashboardResponseDto.stockName,
				quantity = dashboardStockResponseDtos.sumOfDecimal(selector = DashboardStockResponseDto::quantity),
				totalBuyAmount = totalBuyAmount,
				currentPrice = dashboardResponseDto.currentPrice,
				unrealizedProfit = unrealizedProfit,
				valuation = totalBuyAmount.add(unrealizedProfit).rounded(),
				returnRate = unrealizedProfit.toPercentageOf(totalBuyAmount)
			)
		}
	}
}
