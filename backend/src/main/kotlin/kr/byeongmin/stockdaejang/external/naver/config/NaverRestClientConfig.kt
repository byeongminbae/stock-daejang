package kr.byeongmin.stockdaejang.external.naver.config

import kr.byeongmin.stockdaejang.global.config.RestClientConfig
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.client.RestClient

@Configuration
class NaverRestClientConfig(
	private val restClientConfig: RestClientConfig,
) {
	@Bean
	fun restClient(
		restClientBuilder: RestClient.Builder,
		@Value("\${external.naver.base-url}") baseUrl: String,
	): RestClient {
		return restClientConfig.configureRestClient(
			restClientBuilder = restClientBuilder,
			baseUrl = baseUrl,
		)
	}
}
