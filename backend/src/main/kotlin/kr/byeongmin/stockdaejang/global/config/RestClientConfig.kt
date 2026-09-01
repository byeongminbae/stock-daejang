package kr.byeongmin.stockdaejang.global.config

import io.github.oshai.kotlinlogging.KotlinLogging
import kr.byeongmin.stockdaejang.global.error.CommonError
import kr.byeongmin.stockdaejang.global.exception.BusinessException
import org.springframework.http.HttpRequest
import org.springframework.http.client.ClientHttpResponse
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import java.io.Reader

@Component
class RestClientConfig {
	private val logger = KotlinLogging.logger {}

	fun configureRestClient(
		restClientBuilder: RestClient.Builder,
		baseUrl: String,
	): RestClient {
		return restClientBuilder
			.baseUrl(baseUrl)
			.defaultStatusHandler(
				{ status -> status.isError },
				{ request, response ->
					val errorLogMessage = buildErrorLogMessage(request, response)
					logger.debug { errorLogMessage }
					throw BusinessException(CommonError.EXTERNAL_API_ERROR)
				},
			)
			.build()
	}

	private fun buildErrorLogMessage(
		request: HttpRequest,
		response: ClientHttpResponse,
	): String {
		return StringBuilder().append("\n")
			.append("==================== 외부 API 요청 ====================").append("\n")
			.append("requestMethod: ${request.method}").append("\n")
			.append("requestUri: ${request.uri}").append("\n")
			.append("requestHeaders: ${request.headers}").append("\n")
			.append("responseHeaders: ${response.headers}").append("\n")
			.append("responseBody: ${responseBody(response)}").append("\n")
			.append("==================== 외부 API 요청 ====================").append("\n")
			.toString()
	}

	private fun responseBody(response: ClientHttpResponse): String {
		val maxResponseBodyLength = 4096
		return response.body.bufferedReader()
			.use(Reader::readText)
			.take(maxResponseBodyLength)
	}
}
