package kr.byeongmin.stockdaejang.external.naver

import io.github.oshai.kotlinlogging.KotlinLogging
import kr.byeongmin.stockdaejang.domain.stock.enums.DomesticMarketSession
import kr.byeongmin.stockdaejang.domain.stock.provider.MarketPriceProvider
import kr.byeongmin.stockdaejang.domain.stock.provider.StockSearchProvider
import kr.byeongmin.stockdaejang.external.naver.dto.MarketPriceSnapshotDto
import kr.byeongmin.stockdaejang.external.naver.dto.NaverMarketPriceResponseDto
import kr.byeongmin.stockdaejang.external.naver.dto.NaverSearchResponseDto
import kr.byeongmin.stockdaejang.external.naver.dto.StockSearchResultDto
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import org.springframework.beans.factory.annotation.Qualifier
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient

@Component
class NaverStockProvider(
    @Qualifier("naverRestClient") private val restClient: RestClient,
) : StockSearchProvider, MarketPriceProvider {
    private val logger = KotlinLogging.logger {}

    override val maxBatchSize: Int = 50

    override fun search(query: String): List<StockSearchResultDto> {
        val context = "queryLength=${query.length}"
        val searchResponse = try {
            restClient.get()
                .uri { builder ->
                    builder.path("/search")
                        .queryParam("page", 1)
                        .queryParam("q", query)
                        .queryParam("size", 20)
                        .queryParam("target", "stock,index,marketindicator,coin,ipo,fund")
                        .build()
                }
                .retrieve()
                .body(NaverSearchResponseDto::class.java)
                ?: naverRequestFailed("search", context, "empty response body")
        } catch (exception: Exception) {
            naverRequestFailed("search", context, exception)
        }

        if (!searchResponse.isSuccess) {
            externalApiError("search", context, "Naver response isSuccess=false")
        }

        return searchResponse.result.items.map(NaverSearchResponseDto.ItemDto::toStockSearchResultDto)
    }

    override fun fetchMarketPrices(stockCodes: List<String>): List<MarketPriceSnapshotDto> {
        val context = "stockCodeCount=${stockCodes.size}"
        val marketPriceResponse = try {
            restClient.get()
                .uri { builder ->
                    builder.path("/realTime/marketPrice")
                        .queryParam("endType", "stock")
                        .queryParam("itemCodes", stockCodes.joinToString(","))
                        .queryParam("stockType", "domestic")
                        .build()
                }
                .retrieve()
                .body(NaverMarketPriceResponseDto::class.java)
                ?: naverRequestFailed("market-price", context, "empty response body")
        } catch (exception: Exception) {
            naverRequestFailed("market-price", context, exception)
        }

        if (!marketPriceResponse.isSuccess) {
            externalApiError("market-price", context, "Naver response isSuccess=false")
        }

        val marketPriceSnapshots = marketPriceResponse.result.datas.map { marketPriceItem ->
            toMarketPriceSnapshot(marketPriceItem, "stockCode=${marketPriceItem.stockCode}")
        }
        checkRequestedStockCodesAreAllPresent(stockCodes, marketPriceSnapshots)
        return marketPriceSnapshots
    }

    private fun checkRequestedStockCodesAreAllPresent(
        stockCodes: List<String>,
        marketPriceSnapshots: List<MarketPriceSnapshotDto>,
    ) {
        val context = "stockCodeCount=${stockCodes.size}"
        val returnedStockCodes = marketPriceSnapshots.map(MarketPriceSnapshotDto::stockCode)
        if (returnedStockCodes.any { it !in stockCodes }) {
            externalApiError("market-price", context, "Naver returned an unrequested stockCode")
        }
        if (stockCodes.any { it !in returnedStockCodes }) {
            externalApiError("market-price", context, "Naver did not return every requested stockCode")
        }
    }

    private fun toMarketPriceSnapshot(
        marketPriceItem: NaverMarketPriceResponseDto.ItemDto,
        context: String,
    ): MarketPriceSnapshotDto {
        val overMarketPriceInfo = marketPriceItem.overMarketPriceInfo
        return MarketPriceSnapshotDto(
            stockCode = marketPriceItem.stockCode,
            marketStatus = marketPriceItem.marketStatus,
            stockName = marketPriceItem.stockName,
            regularPrice = parsePrice(marketPriceItem.closePriceRaw, context),
            regularTradedAt = marketPriceItem.localTradedAt,
            overPrice = overMarketPriceInfo?.let { parsePrice(it.overPrice, context) },
            overTradedAt = overMarketPriceInfo?.localTradedAt,
            marketSession = overMarketPriceInfo?.let { translateSession(it, context) }
                ?: DomesticMarketSession.REGULAR_MARKET,
        )
    }

    private fun translateSession(
        overMarketPriceInfo: NaverMarketPriceResponseDto.OverMarketPriceInfoDto,
        context: String,
    ): DomesticMarketSession {
        if (overMarketPriceInfo.overMarketStatus == "PREOPEN" && overMarketPriceInfo.tradingSessionType.isBlank()) {
            return DomesticMarketSession.PREOPEN
        }

        return when (val session =
            DomesticMarketSession.entries.firstOrNull { it.name == overMarketPriceInfo.tradingSessionType }) {
            DomesticMarketSession.PRE_MARKET,
            DomesticMarketSession.REGULAR_MARKET,
            DomesticMarketSession.AFTER_MARKET,
                -> session

            DomesticMarketSession.PREOPEN,
            null,
                -> externalApiError("market-price", context, "Unsupported session=$session")
        }
    }

    private fun parsePrice(rawPrice: String, context: String): Long {
        val price = rawPrice.replace(",", "").toLongOrNull()
            ?: externalApiError("market-price", context, "Invalid price=$rawPrice")
        if (price <= 0) {
            externalApiError("market-price", context, "Non-positive price=$rawPrice")
        }
        return price
    }

    private fun naverRequestFailed(operation: String, context: String, exception: Exception): Nothing {
        if (exception is BusinessException) {
            throw exception
        }
        logger.debug(exception) {
            "Naver request failed: operation=$operation, context=$context, " +
                    "exception=${exception::class.simpleName}"
        }
        throw BusinessException(CommonError.EXTERNAL_API_ERROR)
    }

    private fun naverRequestFailed(operation: String, context: String, reason: String): Nothing {
        logger.debug { "Naver request failed: operation=$operation, context=$context, reason=$reason" }
        throw BusinessException(CommonError.EXTERNAL_API_ERROR)
    }

    private fun externalApiError(operation: String, context: String, reason: String): Nothing {
        logger.debug { "Naver response rejected: operation=$operation, context=$context, reason=$reason" }
        throw BusinessException(CommonError.EXTERNAL_API_RESPONSE_FIELD_ERROR)
    }
}
