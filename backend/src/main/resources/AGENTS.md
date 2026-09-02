<!-- Parent: ../../../AGENTS.md -->
<!-- Generated: 2026-09-02 -->

# resources

## Purpose
Application configuration and database schema migrations.

## Key Files
| File | Description |
|------|--------------|
| `application.yaml` | Spring Boot configuration: datasource, Flyway, Jackson, JPA, app CORS, external provider URLs |

## Database Migrations

Flyway migrations live in `db/migration/` and follow the naming convention `V{n}__description.sql`. Never edit an already-applied migration; add a new one instead. Schema is managed entirely by migrations — `ddl-auto: validate` in `application.yaml` ensures JPA doesn't modify the schema.

**Applied Migrations:**
| Version | Description |
|---------|-------------|
| V1 | Initial schema: owners, securities, trades, dashboard_positions |
| V2 | Add UNIQUE constraint on securities (item_code, market) for catalog lock |
| V3 | Convert owners to database-managed (add surrogate PK) |
| V4 | Widen owner IDs from INT to BIGINT |
| V5 | Add NOT NULL constraint to trade.brokerage |
| V6 | Limit trade.quantity to INT (32-bit) |
| V7 | Persist dashboard_positions as a real materialized table (upserted on trade changes) |
| V8 | Add audit timestamps (created_at, updated_at) to entities |
| V9 | Rename security/itemCode to stock/stockCode for consistency |
| V10 | Add ledger snapshot and decimal price columns |
| V11 | Rename stock.itemCode to stock.stockCode (follow-up fix) |
| V12 | Add owner.favoriteBrokerages (list of brokerage codes) |

## For AI Agents

### Working In This Directory
- `application.yaml` is the single source of truth for configuration — environment variables override defaults (e.g. `SPRING_DATASOURCE_URL`, `EXTERNAL_NAVER_BASE_URL`).
- Flyway runs automatically on application startup — no manual migration steps required.
- Add new migrations as `V{n}__description.sql` in `db/migration/` — increment the version number and write idempotent SQL.

<!-- MANUAL: -->
