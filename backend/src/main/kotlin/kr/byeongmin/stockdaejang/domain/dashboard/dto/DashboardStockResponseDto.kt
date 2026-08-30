package kr.byeongmin.stockdaejang.domain.dashboard.dto

import io.swagger.v3.oas.annotations.media.Schema
import kr.byeongmin.stockdaejang.domain.common.util.MONEY_MATH_CONTEXT
import kr.byeongmin.stockdaejang.domain.common.util.divideRounded
import kr.byeongmin.stockdaejang.domain.common.util.multiplyRounded
import kr.byeongmin.stockdaejang.domain.common.util.subtractRounded
import kr.byeongmin.stockdaejang.domain.dashboard.entity.DashboardPosition
import kr.byeongmin.stockdaejang.domain.stock.dto.MarketPriceDto
import java.math.BigDecimal
import java.math.MathContext
import java.math.RoundingMode

@Schema(description = "증권사에 보유한 개별 종목의 매입 및 평가 정보")
data class DashboardStockResponseDto(
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
        description = "보유 수량. 해외주식 등은 소수일 수 있음",
        example = "12",
    )
    val quantity: BigDecimal,

    @field:Schema(
        description = "매수평균단가. 원 단위 숫자",
        example = "71200",
    )
    val averageBuyPrice: BigDecimal,

    @field:Schema(
        description = "총 매입액. 원 단위 숫자",
        example = "890000",
    )
    val totalBuyAmount: BigDecimal,

    @field:Schema(
        description = "해당 증권사 총 매입액에서 종목 매입액이 차지하는 비중. 퍼센트 단위 숫자",
        example = "35.42",
    )
    val brokerageWeight: BigDecimal,

    @field:Schema(
        description = "현재가. 원 단위 숫자",
        example = "79800",
    )
    val currentPrice: BigDecimal,

    @field:Schema(
        description = "평가액. 원 단위 숫자",
        example = "997500",
    )
    val valuation: BigDecimal,

    @field:Schema(
        description = "평가 손익. 원 단위 숫자",
        example = "107500",
    )
    val unrealizedProfit: BigDecimal,

    @field:Schema(
        description = "수익률. 퍼센트 단위 숫자",
        example = "12.08",
    )
    val returnRate: BigDecimal,
) {
    companion object {
        fun of(
            position: DashboardPosition,
            marketPrice: MarketPriceDto,
            brokerageTotalBuyAmount: BigDecimal,
        ): DashboardStockResponseDto {
            val quantity = position.quantity
            val totalBuyAmount = position.totalBuyAmount
            val averageBuyPrice = totalBuyAmount.divideRounded(quantity)
            val currentPrice = BigDecimal.valueOf(marketPrice.price)
            val valuation = currentPrice.multiplyRounded(quantity)
            val unrealizedProfit = valuation.subtractRounded(totalBuyAmount)
            return DashboardStockResponseDto(
                stockCode = position.stock.stockCode,
                stockName = position.stock.stockName,
                quantity = quantity,
                averageBuyPrice = averageBuyPrice.toDashboardDecimal(),
                totalBuyAmount = totalBuyAmount.toDashboardDecimal(),
                brokerageWeight = totalBuyAmount.toPercentageOf(brokerageTotalBuyAmount),
                currentPrice = currentPrice,
                valuation = valuation.toDashboardDecimal(),
                unrealizedProfit = unrealizedProfit.toDashboardDecimal(),
                returnRate = unrealizedProfit.toPercentageOf(totalBuyAmount),
            )
        }

        private fun BigDecimal.toPercentageOf(totalAmount: BigDecimal, mathContext: MathContext = MONEY_MATH_CONTEXT): BigDecimal {
            val hasNoTotalAmount = totalAmount.signum() == 0
            return if (hasNoTotalAmount) {
                BigDecimal.ZERO
            } else {
                divide(totalAmount, mathContext)
                    .multiply(PERCENT_MULTIPLIER)
                    .toDashboardDecimal()
            }
        }

        private fun BigDecimal.toDashboardDecimal(): BigDecimal {
            val dashboardDecimal = setScale(DASHBOARD_DECIMAL_SCALE, RoundingMode.HALF_UP).stripTrailingZeros()
            val isZero = dashboardDecimal.signum() == 0
            val hasNegativeScale = dashboardDecimal.scale() < 0
            return when {
                isZero -> BigDecimal.ZERO
                hasNegativeScale -> dashboardDecimal.setScale(INTEGER_DECIMAL_SCALE)
                else -> dashboardDecimal
            }
        }

        private const val DASHBOARD_DECIMAL_SCALE = 18
        private const val INTEGER_DECIMAL_SCALE = 0
        private val PERCENT_MULTIPLIER = BigDecimal(100)
    }
}
