package kr.byeongmin.stockdaejang.domain.trade.service

import kr.byeongmin.stockdaejang.domain.trade.dto.*
import kr.byeongmin.stockdaejang.domain.trade.entity.TradeType
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import java.math.BigInteger
import java.time.OffsetDateTime

internal object TradeInputParser {
    internal data class ParsedDeleteTradesDto(val ids: List<Long>, val side: TradeType)
    internal data class ParsedUpdateTradeDto(val id: Long, val trade: ParsedTradeDto)

    private val positiveInteger = Regex("^[1-9]\\d*$")
    private val brokerageCode = Regex("^\\d{3}$")
    private val itemCode = Regex("^[0-9A-Z]{6}$")
    private val maxBigint = BigInteger.valueOf(Long.MAX_VALUE)
    private val maxQuantity = BigInteger.valueOf(Int.MAX_VALUE.toLong())

    fun trade(request: TradeRequestDto): ParsedTradeDto {
        return parseTrade(
            brokerageCode = request.brokerageCode,
            executedAt = request.executedAt,
            isEtf = request.isEtf,
            itemCode = request.itemCode,
            market = request.market,
            ownerId = request.ownerId,
            quantity = request.quantity,
            stockName = request.stockName,
            side = request.side,
            unitPrice = request.unitPrice,
        )
    }

    fun update(request: UpdateTradeRequestDto): ParsedUpdateTradeDto {
        return ParsedUpdateTradeDto(
            id = parsePositiveLong(request.id),
            trade = parseTrade(
                request.brokerageCode,
                request.executedAt,
                request.isEtf,
                request.itemCode,
                request.market,
                request.ownerId,
                request.quantity,
                request.stockName,
                request.side,
                request.unitPrice,
            ),
        )
    }

    fun delete(request: DeleteTradesRequestDto): ParsedDeleteTradesDto {
        val rawIds = request.ids
        if (rawIds.isEmpty() || rawIds.size > 25 || rawIds.toSet().size != rawIds.size) invalid()
        return ParsedDeleteTradesDto(rawIds.map(::parsePositiveLong), parseSide(request.side))
    }

    fun preview(request: TradePreviewRequestDto): ParsedPreviewDto {
        return ParsedPreviewDto(
            brokerageCode = parseBrokerageCode(request.brokerageCode),
            itemCode = parseItemCode(request.itemCode),
            ownerId = parseOwnerId(request.ownerId),
            quantity = parsePositiveQuantity(request.quantity),
            side = parseSide(request.side),
            unitPrice = parsePositiveBigint(request.unitPrice),
        )
    }

    fun position(ownerId: Long?, brokerageCode: String?, itemCode: String?): ParsedPositionDto {
        return ParsedPositionDto(
            ownerId = parseOwnerId(ownerId),
            brokerageCode = parseBrokerageCode(brokerageCode),
            itemCode = parseItemCode(itemCode),
        )
    }

    private fun parseTrade(
        brokerageCode: String,
        executedAt: OffsetDateTime,
        isEtf: Boolean,
        itemCode: String,
        market: String,
        ownerId: Long,
        quantity: String,
        stockName: String,
        side: String,
        unitPrice: String,
    ): ParsedTradeDto {
        return ParsedTradeDto(
            brokerageCode = parseBrokerageCode(brokerageCode),
            executedAt = executedAt,
            isEtf = isEtf,
            itemCode = parseItemCode(itemCode),
            market = market.trim().takeIf { it.isNotEmpty() && it.length <= 30 } ?: invalid(),
            ownerId = parseOwnerId(ownerId),
            quantity = parsePositiveQuantity(quantity),
            stockName = stockName.trim().takeIf { it.isNotEmpty() && it.length <= 100 } ?: invalid(),
            side = parseSide(side),
            unitPrice = parsePositiveBigint(unitPrice),
        )
    }

    private fun parseBrokerageCode(rawBrokerageCode: String?): String {
        return rawBrokerageCode?.takeIf(brokerageCode::matches) ?: invalid()
    }

    private fun parseItemCode(rawItemCode: String?): String {
        return rawItemCode?.takeIf(itemCode::matches) ?: invalid()
    }

    private fun parseOwnerId(rawOwnerId: Long?): Long {
        return rawOwnerId?.takeIf { it > 0 } ?: invalid()
    }

    private fun parseSide(rawSide: String?): TradeType {
        return runCatching { TradeType.valueOf(rawSide ?: "") }.getOrElse { invalid() }
    }

    private fun parsePositiveLong(rawPositiveInteger: String?): Long {
        return parsePositiveBigint(rawPositiveInteger).longValueExact()
    }

    private fun parsePositiveBigint(rawPositiveInteger: String?): BigInteger {
        if (rawPositiveInteger == null || !positiveInteger.matches(rawPositiveInteger)) invalid()
        val parsedPositiveInteger = rawPositiveInteger.toBigInteger()
        if (parsedPositiveInteger > maxBigint) invalid()
        return parsedPositiveInteger
    }

    private fun parsePositiveQuantity(rawQuantity: String?): BigInteger {
        return parsePositiveBigint(rawQuantity).takeIf { it <= maxQuantity } ?: invalid()
    }

    private fun invalid(): Nothing {
        throw BusinessException(CommonError.INVALID_INPUT_VALUE)
    }
}
