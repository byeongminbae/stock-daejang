<!-- Parent: ../../../../../../AGENTS.md -->
<!-- Generated: 2026-09-02 -->

# StockDaejangApplication

## Purpose
Root Spring Boot application package. Orchestrates three major subsystems: `domain/` (business logic per area), `external/` (market-data integration), and `global/` (cross-cutting infrastructure).

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `domain/` | Business domains: trade, dashboard, history, stock, owner, brokerage, common (see `domain/AGENTS.md`) |
| `external/naver/` | Naver Finance market-data provider (see `external/naver/AGENTS.md`) |
| `global/` | Cross-cutting: error handling, exception mapping, response envelopes, base entity, shared utilities (see `global/AGENTS.md`) |

<!-- MANUAL: -->
