package kr.byeongmin.stockdaejang.domain.trade.service

import kr.byeongmin.stockdaejang.domain.brokerage.repository.BrokerageRepository
import kr.byeongmin.stockdaejang.domain.common.util.rounded
import kr.byeongmin.stockdaejang.domain.dashboard.entity.DashboardPosition
import kr.byeongmin.stockdaejang.domain.dashboard.repository.DashboardPositionQuerydslRepository
import kr.byeongmin.stockdaejang.domain.dashboard.repository.DashboardPositionReplacement
import kr.byeongmin.stockdaejang.domain.dashboard.repository.DashboardPositionRepository
import kr.byeongmin.stockdaejang.domain.owner.repository.OwnerRepository
import kr.byeongmin.stockdaejang.domain.stock.entity.Stock
import kr.byeongmin.stockdaejang.domain.stock.repository.StockCatalogQuerydslRepository
import kr.byeongmin.stockdaejang.domain.stock.repository.StockRepository
import kr.byeongmin.stockdaejang.domain.stock.types.StockCatalogLockName
import kr.byeongmin.stockdaejang.domain.trade.dto.*
import kr.byeongmin.stockdaejang.domain.trade.entity.Trade
import kr.byeongmin.stockdaejang.domain.trade.repository.TradeQuerydslRepository
import kr.byeongmin.stockdaejang.domain.trade.repository.TradeRepository
import kr.byeongmin.stockdaejang.domain.trade.types.TradeErrorType
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import kr.byeongmin.stockdaejang.global.response.SuccessResponse
import kr.byeongmin.stockdaejang.global.util.ifNullThrow
import kr.byeongmin.stockdaejang.global.util.isNotNull
import kr.byeongmin.stockdaejang.global.util.isZero
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.OffsetDateTime

@Service
class TradeService(
	private val ownerRepository: OwnerRepository,
	private val brokerageRepository: BrokerageRepository,
	private val stockRepository: StockRepository,
	private val stockCatalogQuerydslRepository: StockCatalogQuerydslRepository,
	private val tradeQuerydslRepository: TradeQuerydslRepository,
	private val tradeRepository: TradeRepository,
	private val dashboardPositionQuerydslRepository: DashboardPositionQuerydslRepository,
	private val dashboardPositionRepository: DashboardPositionRepository,
) {
	@Transactional
	fun createTrade(createTradeRequestDto: CreateTradeRequestDto): SuccessDataResponse<Long> {
		val positionEntityDto = upsertStockCatalog(
			ownerId = createTradeRequestDto.ownerId,
			brokerageCode = createTradeRequestDto.brokerageCode,
			stockCode = createTradeRequestDto.stockCode,
			stockName = createTradeRequestDto.stockName,
			market = createTradeRequestDto.market,
			isEtf = createTradeRequestDto.isEtf,
			executedAt = createTradeRequestDto.executedAt,
		)

		// 리플레이 할때 db 에서 가져올거라 여기서 영속성 컨텍스트 flush 함
		val savedTrade = tradeRepository.saveAndFlush(
			Trade.of(
				owner = positionEntityDto.owner,
				brokerage = positionEntityDto.brokerage,
				stock = positionEntityDto.stock,
				side = createTradeRequestDto.side,
				executedAt = createTradeRequestDto.executedAt,
				quantity = createTradeRequestDto.quantity,
				unitPrice = createTradeRequestDto.unitPrice
			)
		)

		val dashboardPositionReplacements =
			replayTrades(listOf(positionEntityDto.toPositionKeyAtDto()))
		updateDashboardPositions(dashboardPositionReplacements)
		return SuccessDataResponse(savedTrade.id.ifNullThrow())
	}

	@Transactional
	fun updateTrade(tradeId: Long, updateTradeRequestDto: UpdateTradeRequestDto): SuccessResponse {
		// 조회 이후에 걸게되면 T1, T2 중 하나는 최신이 아닌 엔티티일수도 있음
		tradeQuerydslRepository.lockTradeByTradeId(tradeId)

		val selectedTrade = tradeRepository.findByIdOrNull(tradeId)
			?: throw BusinessException(CommonError.RESOURCE_NOT_FOUND)

		val newPosition = getPositionEntityDto(
			ownerId = updateTradeRequestDto.ownerId,
			brokerageCode = updateTradeRequestDto.brokerageCode,
			stockCode = updateTradeRequestDto.stockCode,
			executedAt = updateTradeRequestDto.executedAt,
		)

		selectedTrade.owner = newPosition.owner
		selectedTrade.brokerage = newPosition.brokerage
		selectedTrade.stock = newPosition.stock
		selectedTrade.executedAt = updateTradeRequestDto.executedAt
		selectedTrade.quantity = updateTradeRequestDto.quantity
		selectedTrade.unitPrice = BigDecimal.valueOf(updateTradeRequestDto.unitPrice)
		// 영속상태니까 걍 replay 때 쓸 엔티티를 위한 flush 만 하면됨
		tradeRepository.flush()

		val previousPosition = PositionEntityDto.from(selectedTrade)
		val affectedPositions = getEarliestByPositionKey(listOf(previousPosition, newPosition))
		val updatedDashboardPositions = replayTrades(
			// 소유주 or 증권사 or 종목 중 하나라도 바뀐경우 previousPosition, updatedPosition 둘다 리플레이 대상이 됨
			affectedPositions.map(PositionEntityDto::toPositionKeyAtDto)
		)
		updateDashboardPositions(updatedDashboardPositions)
		return SuccessResponse()
	}

	@Transactional
	fun deleteTrades(deleteTradesRequestDto: DeleteTradesRequestDto): SuccessResponse {
		val tradeIds = deleteTradesRequestDto.tradeIds
		// 조회 이후에 걸게되면 T1, T2 중 하나는 최신이 아닌 엔티티일수도 있음
		tradeQuerydslRepository.lockAllTradeByTradeIds(tradeIds)

		val selectedTrades = tradeRepository.findAllByIdInOrderByIdAsc(tradeIds)

		if (selectedTrades.size != tradeIds.size) {
			throw BusinessException(CommonError.RESOURCE_NOT_FOUND)
		}

		tradeRepository.deleteAllByIdInBatch(tradeIds)

		val affectedPositions = getEarliestByPositionKey(
			selectedTrades.map(PositionEntityDto::from)
		)
		val dashboardPositionReplacements = replayTrades(
			affectedPositions.map(
				PositionEntityDto::toPositionKeyAtDto
			)
		)
		updateDashboardPositions(dashboardPositionReplacements)
		return SuccessResponse()
	}

	@Transactional(readOnly = true)
	fun previewTrade(tradePreviewRequestDto: TradePreviewRequestDto): SuccessDataResponse<TradePreviewResponseDto> {
		ownerRepository.findByIdIfNullThrow(tradePreviewRequestDto.ownerId)
		val positionSnapshot = getPositionSnapshotAt(
			tradePreviewRequestDto.ownerId,
			tradePreviewRequestDto.brokerageCode,
			tradePreviewRequestDto.stockCode,
			tradePreviewRequestDto.executedAt,
		)
		val tradePreviewResponseDto = buildTradePreview(tradePreviewRequestDto, positionSnapshot)
		return SuccessDataResponse(tradePreviewResponseDto)
	}

	@Transactional(readOnly = true)
	fun currentPositionAverage(ownerId: Long, brokerageCode: String, stockCode: String): PositionAverageResponseDto {
		val state = getPositionSnapshot(ownerId, brokerageCode, stockCode)
		return PositionAverageResponseDto(
			heldQuantity = state.remainingQuantitySnapshot,
			averageBuyPrice = state.averagePrice(),
		)
	}

	private fun upsertStockCatalog(
		ownerId: Long,
		brokerageCode: String,
		stockCode: String,
		stockName: String,
		market: String,
		isEtf: Boolean,
		executedAt: OffsetDateTime,
	): PositionEntityDto {
		val owner = ownerRepository.findByIdIfNullThrow(ownerId)
		val brokerage = brokerageRepository.findByCode(brokerageCode)
			?: throw BusinessException(CommonError.RESOURCE_NOT_FOUND)

		stockCatalogQuerydslRepository.lockByName(StockCatalogLockName.CATALOG)
			?: throw BusinessException(CommonError.INTERNAL_SERVER_ERROR)

		val existingStock = stockRepository.findByStockCode(stockCode)
		val stock = existingStock
			?: stockRepository.saveAndFlush(Stock.of(stockCode, stockName, market, isEtf))

		return PositionEntityDto(owner, brokerage, stock, executedAt)
	}

	private fun getPositionEntityDto(
		ownerId: Long,
		brokerageCode: String,
		stockCode: String,
		executedAt: OffsetDateTime,
	): PositionEntityDto {
		val owner = ownerRepository.findByIdIfNullThrow(ownerId)
		val brokerage = brokerageRepository.findByCode(brokerageCode)
			?: throw BusinessException(CommonError.RESOURCE_NOT_FOUND)
		val stock = stockRepository.findByStockCode(stockCode)
			?: throw BusinessException(CommonError.RESOURCE_NOT_FOUND)

		return PositionEntityDto(owner, brokerage, stock, executedAt)
	}

	private fun replayTrades(positionKeyAtDtos: List<PositionKeyAtDto>): List<DashboardPositionReplacement> {
		if (positionKeyAtDtos.isEmpty()) return emptyList()

		// 리플레이 계산은 무조건 락을 걸어서 순차적으로 진행해야함. T1, T2 동시에 들어오면 한쪽은 반영이 안된 이상한 값으로 갱신됨
		tradeQuerydslRepository.lockAllStockByStockCodes(positionKeyAtDtos.map { it.positionKeyDto.stockCode })

		val baseTradeByPosition = tradeQuerydslRepository.findPositionTradesBefore(positionKeyAtDtos)
			.groupBy(PositionKeyDto::from)

		val targetTradesByPosition = tradeQuerydslRepository.findPositionTradesFrom(positionKeyAtDtos)
			.groupBy(PositionKeyDto::from)

		return positionKeyAtDtos.map { (positionKeyDto, _) ->
			val basePositionSnapshot = PositionSnapshot.from(baseTradeByPosition[positionKeyDto]?.first())

			var accumulatedSnapshot = basePositionSnapshot
			targetTradesByPosition[positionKeyDto].orEmpty().forEach { trade ->
				accumulatedSnapshot = trade.replay(accumulatedSnapshot)
				trade.remainingQuantitySnapshot = accumulatedSnapshot.remainingQuantitySnapshot
				trade.remainingCostSnapshot = accumulatedSnapshot.remainingCostSnapshot
			}

			DashboardPositionReplacement(
				key = positionKeyDto,
				quantity = accumulatedSnapshot.remainingQuantitySnapshot,
				totalBuyAmount = accumulatedSnapshot.remainingCostSnapshot,
			)
		}
	}

	private fun updateDashboardPositions(dashboardPositionReplacements: List<DashboardPositionReplacement>) {
		if (dashboardPositionReplacements.isEmpty()) return

		val dashboardPositionByPositionKeyDto = dashboardPositionQuerydslRepository.find(dashboardPositionReplacements)
			.associateBy(PositionKeyDto::from)

		val toDelete = mutableListOf<DashboardPosition>()
		val toInsert = mutableListOf<DashboardPositionReplacement>()

		dashboardPositionReplacements.forEach { dashboardPositionReplacement ->
			val dashboardPosition = dashboardPositionByPositionKeyDto[dashboardPositionReplacement.key]
			when {
				dashboardPositionReplacement.quantity.isZero() -> {
					// 동일한 포지션이 매수 5개 매도 5개 인 상태에서 단가 오타만 수정할 경우에도 여기 들어오게됨
					// dashboardPosition 이 존재하는걸 보장 못한다는 말임
					// 현재는 null 일 경우 넘어감
					dashboardPosition?.let { toDelete += it }
				}

				dashboardPosition.isNotNull() -> {
					// 쓰기지연 저장소 있으니 성능 괜찮음
					dashboardPosition.quantity = dashboardPositionReplacement.quantity
					dashboardPosition.totalBuyAmount = dashboardPositionReplacement.totalBuyAmount
				}

				else -> {
					// PK 디비에서 받아와야해서 쓰기지연 안먹힘 어쩔수없음...
					toInsert += dashboardPositionReplacement
				}
			}
		}

		dashboardPositionRepository.deleteAllInBatch(toDelete)
		insertDashboardPositions(toInsert)
	}

	private fun insertDashboardPositions(dashboardPositionReplacements: List<DashboardPositionReplacement>) {
		if (dashboardPositionReplacements.isEmpty()) return

		val stockByStockCode = stockRepository
			.findAllByStockCodeIn(dashboardPositionReplacements.map { it.key.stockCode })
			.associateBy { it.stockCode }

		dashboardPositionRepository.saveAll(
			dashboardPositionReplacements.map {
				DashboardPosition(
					// 어차피 저장할거고 조회할 필요 없으니 프록시 만들어서 넣음
					owner = ownerRepository.getReferenceById(it.key.ownerId),
					brokerage = brokerageRepository.getReferenceById(it.key.brokerageId),
					stock = stockByStockCode[it.key.stockCode].ifNullThrow(),
					quantity = it.quantity,
					totalBuyAmount = it.totalBuyAmount,
				)
			},
		)
	}

	private fun getPositionSnapshot(ownerId: Long, brokerageCode: String, stockCode: String): PositionSnapshot {
		val brokerage = brokerageRepository.findByCode(brokerageCode)
			?: throw BusinessException(CommonError.RESOURCE_NOT_FOUND)
		val stock = stockRepository.findByStockCode(stockCode)
			?: return PositionSnapshot(BigDecimal.ZERO, BigDecimal.ZERO)

		val trade = tradeQuerydslRepository.findLatestTrade(
			ownerId,
			brokerage.id.ifNullThrow(),
			stock.id.ifNullThrow(),
		)
		return PositionSnapshot.from(trade)
	}

	private fun getPositionSnapshotAt(
		ownerId: Long,
		brokerageCode: String,
		stockCode: String,
		executedAt: OffsetDateTime,
	): PositionSnapshot {
		val brokerage = brokerageRepository.findByCode(brokerageCode)
			?: throw BusinessException(CommonError.RESOURCE_NOT_FOUND)
		val stock = stockRepository.findByStockCode(stockCode)
			?: return PositionSnapshot(BigDecimal.ZERO, BigDecimal.ZERO)

		val trade = tradeQuerydslRepository.findLatestTradeAt(
			ownerId,
			brokerage.id.ifNullThrow(),
			stock.id.ifNullThrow(),
			executedAt,
		)
		return PositionSnapshot.from(trade)
	}

	private fun buildTradePreview(
		tradePreviewRequestDto: TradePreviewRequestDto,
		positionSnapshot: PositionSnapshot
	): TradePreviewResponseDto {
		val quantity = tradePreviewRequestDto.quantity
		val unitPrice = tradePreviewRequestDto.unitPrice
		val soldAmount = quantity.multiply(unitPrice).rounded()

		val expectedProfit =
			if (tradePreviewRequestDto.side.isSell()) {
				if (positionSnapshot.isQuantityExceeded(quantity)) {
					throw BusinessException(
						TradeErrorType.INSUFFICIENT_HOLDING,
						mapOf("quantity" to quantity.toString()),
					)
				}
				val boughtCost = positionSnapshot.boughtCostFor(quantity)
				soldAmount - boughtCost
			} else {
				null
			}

		return TradePreviewResponseDto(
			amount = soldAmount,
			heldQuantity = positionSnapshot.remainingQuantitySnapshot,
			averageBuyPrice = positionSnapshot.averagePrice(),
			expectedProfit = expectedProfit,
		)
	}

	// 이벤트가 발생한 각포지션에 존재하는 Trade.executedAt 중 가장 오래된 포지션을 선택
	// 같은 포지션 내에선 가장 오래된 포지션부터 업데이트를 진행하면됨
	private fun getEarliestByPositionKey(positionEntityDtos: List<PositionEntityDto>): List<PositionEntityDto> {
		return positionEntityDtos
			.groupBy { it.toPositionKeyDto() }
			.map { (_, positionEntityDtos) ->
				positionEntityDtos.minBy { it.executedAt }
			}
	}
}
