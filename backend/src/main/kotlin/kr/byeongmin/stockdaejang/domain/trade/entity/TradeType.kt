package kr.byeongmin.stockdaejang.domain.trade.entity

import io.swagger.v3.oas.annotations.media.Schema

enum class TradeType {
    @Schema(description = "매수")
    BUY,

    @Schema(description = "매도")
    SELL,
}
