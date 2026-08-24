package kr.byeongmin.stockdaejang

import org.flywaydb.core.Flyway
import org.junit.jupiter.api.Test
import org.testcontainers.postgresql.PostgreSQLContainer
import java.sql.DriverManager
import kotlin.test.assertEquals
import kotlin.test.assertNull

class FlywayLegacyMigrationTest {
    @Test
    fun `identity 시퀀스가 없는 레거시 소유주 스키마를 마이그레이션한다`() {
        val postgres = PostgreSQLContainer("postgres:17-alpine")
        postgres.start()

        try {
            flyway(postgres, target = "1").migrate()
            DriverManager.getConnection(postgres.jdbcUrl, postgres.username, postgres.password).use { connection ->
                connection.createStatement().use { statement ->
                    statement.execute("ALTER TABLE owners ALTER COLUMN id DROP IDENTITY")
                    val brokerageId = statement.executeQuery(
                        "SELECT id FROM brokerages WHERE code = '264'",
                    ).use { resultSet ->
                        resultSet.next()
                        resultSet.getLong("id")
                    }
                    val heldSecurityId = statement.executeQuery(
                        "INSERT INTO securities (item_code, stock_name, market) " +
                            "VALUES ('TST001', '보유 종목', 'KRX') RETURNING id",
                    ).use { resultSet ->
                        resultSet.next()
                        resultSet.getLong("id")
                    }
                    val soldSecurityId = statement.executeQuery(
                        "INSERT INTO securities (item_code, stock_name, market) " +
                            "VALUES ('TST002', '전량 매도 종목', 'KRX') RETURNING id",
                    ).use { resultSet ->
                        resultSet.next()
                        resultSet.getLong("id")
                    }
                    statement.execute(
                        "INSERT INTO trades " +
                            "(owner_id, security_id, brokerage_id, side, executed_at, quantity, unit_price, realized_profit) " +
                            "VALUES " +
                            "(1, $heldSecurityId, $brokerageId, 'BUY', '2026-08-01T01:00:00Z', 10, 100, NULL), " +
                            "(1, $heldSecurityId, $brokerageId, 'SELL', '2026-08-02T01:00:00Z', 4, 150, 200), " +
                            "(1, $heldSecurityId, $brokerageId, 'BUY', '2026-08-03T01:00:00Z', 2, 200, NULL), " +
                            "(1, $soldSecurityId, $brokerageId, 'BUY', '2026-08-01T01:00:00Z', 1, 100, NULL), " +
                            "(1, $soldSecurityId, $brokerageId, 'SELL', '2026-08-02T01:00:00Z', 1, 100, 0)",
                    )
                }
            }

            flyway(postgres).migrate()

            DriverManager.getConnection(postgres.jdbcUrl, postgres.username, postgres.password).use { connection ->
                connection.createStatement().use { statement ->
                    statement.executeQuery(
                        "SELECT data_type FROM information_schema.columns " +
                            "WHERE table_schema = 'public' AND table_name = 'owners' AND column_name = 'id'",
                    ).use { resultSet ->
                        resultSet.next()
                        assertEquals("bigint", resultSet.getString("data_type"))
                    }
                    statement.executeQuery("SELECT pg_get_serial_sequence('public.owners', 'id')").use { resultSet ->
                        resultSet.next()
                        assertNull(resultSet.getString(1))
                    }
                    statement.executeQuery(
                        "SELECT dp.quantity, dp.total_buy_amount " +
                            "FROM dashboard_positions dp " +
                            "JOIN securities s ON s.id = dp.security_id " +
                            "WHERE s.item_code = 'TST001'",
                    ).use { resultSet ->
                        resultSet.next()
                        assertEquals("8", resultSet.getBigDecimal("quantity").toPlainString())
                        assertEquals("1000", resultSet.getBigDecimal("total_buy_amount").toPlainString())
                    }
                    statement.executeQuery(
                        "SELECT COUNT(*) FROM dashboard_positions dp " +
                            "JOIN securities s ON s.id = dp.security_id " +
                            "WHERE s.item_code = 'TST002'",
                    ).use { resultSet ->
                        resultSet.next()
                        assertEquals(0, resultSet.getInt(1))
                    }
                }
            }
        } finally {
            postgres.stop()
        }
    }

    private fun flyway(postgres: PostgreSQLContainer, target: String? = null): Flyway {
        val configuration = Flyway.configure()
            .dataSource(postgres.jdbcUrl, postgres.username, postgres.password)
        if (target != null) {
            configuration.target(target)
        }
        return configuration.load()
    }
}
