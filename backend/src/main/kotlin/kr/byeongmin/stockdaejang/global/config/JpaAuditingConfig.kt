package kr.byeongmin.stockdaejang.global.config

import kr.byeongmin.stockdaejang.global.util.seoulNow
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.auditing.DateTimeProvider
import org.springframework.data.jpa.repository.config.EnableJpaAuditing
import java.time.temporal.TemporalAccessor
import java.util.*

@Configuration
@EnableJpaAuditing(dateTimeProviderRef = "seoulDateTimeProvider")
class JpaAuditingConfig {
    @Bean
    fun seoulDateTimeProvider(): DateTimeProvider {
        return DateTimeProvider { Optional.of<TemporalAccessor>(seoulNow()) }
    }
}
