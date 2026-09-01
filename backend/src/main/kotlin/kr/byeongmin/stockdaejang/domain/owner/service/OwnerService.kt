package kr.byeongmin.stockdaejang.domain.owner.service

import kr.byeongmin.stockdaejang.domain.brokerage.dto.BrokerageResponseDto
import kr.byeongmin.stockdaejang.domain.brokerage.repository.BrokerageRepository
import kr.byeongmin.stockdaejang.domain.owner.dto.OwnerResponseDto
import kr.byeongmin.stockdaejang.domain.owner.entity.OwnerFavoriteBrokerage
import kr.byeongmin.stockdaejang.domain.owner.repository.OwnerFavoriteBrokerageRepository
import kr.byeongmin.stockdaejang.domain.owner.repository.OwnerRepository
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import kr.byeongmin.stockdaejang.global.response.SuccessDataResponse
import kr.byeongmin.stockdaejang.global.response.SuccessResponse
import kr.byeongmin.stockdaejang.global.util.ifNullThrow
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class OwnerService(
	private val ownerRepository: OwnerRepository,
	private val brokerageRepository: BrokerageRepository,
	private val ownerFavoriteBrokerageRepository: OwnerFavoriteBrokerageRepository,
) {
	fun getList(): SuccessDataResponse<List<OwnerResponseDto>> {
		return SuccessDataResponse(
			ownerRepository.findAllByOrderByIdAsc()
				.map(OwnerResponseDto::from)
		)
	}

	@Transactional(readOnly = true)
	fun getFavoriteBrokerages(ownerId: Long): SuccessDataResponse<List<BrokerageResponseDto>> {
		ownerRepository.findByIdIfNullThrow(ownerId)
		return SuccessDataResponse(
			ownerFavoriteBrokerageRepository.findAllByOwnerId(ownerId)
				.map { it.brokerage }
				.sortedBy { it.code }
				.map(BrokerageResponseDto::from)
		)
	}

	@Transactional
	fun addFavoriteBrokerage(ownerId: Long, brokerageCode: String): SuccessResponse {
		val owner = ownerRepository.findByIdIfNullThrow(ownerId)
		val brokerage = brokerageRepository.findByCode(brokerageCode)
			?: throw BusinessException(CommonError.RESOURCE_NOT_FOUND)

		val brokerageId = brokerage.id.ifNullThrow()
		if (!ownerFavoriteBrokerageRepository.existsByOwnerIdAndBrokerageId(ownerId, brokerageId)) {
			ownerFavoriteBrokerageRepository.save(OwnerFavoriteBrokerage(owner = owner, brokerage = brokerage))
		}

		return SuccessResponse()
	}

	@Transactional
	fun deleteFavoriteBrokerage(ownerId: Long, brokerageCode: String): SuccessResponse {
		ownerRepository.findByIdIfNullThrow(ownerId)
		val brokerage = brokerageRepository.findByCode(brokerageCode)
			?: throw BusinessException(CommonError.RESOURCE_NOT_FOUND)

		ownerFavoriteBrokerageRepository.deleteByOwnerIdAndBrokerageId(ownerId, brokerage.id.ifNullThrow())

		return SuccessResponse()
	}
}
