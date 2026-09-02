<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-09-02 -->

# owner

## Purpose
Manages owner/user profiles and their per-owner-brokerage preferences. Each owner is a top-level entity representing a person who trades; owners can mark brokerages as "favorites" for quick access when entering trades.

## Key Files
| File | Description |
|------|--------------|
| `entity/Owner.kt` | Base owner profile (ID, name); extends `Base` for audit timestamps |
| `entity/OwnerFavoriteBrokerage.kt` | Junction entity linking owner to favorite brokerages; uses `@ManyToOne(fetch = FetchType.LAZY)` associations |
| `repository/OwnerRepository.kt` | Spring Data repository for `Owner` queries; includes `findAllByOrderByIdAsc()` |
| `repository/OwnerFavoriteBrokerageRepository.kt` | Spring Data repository for favorite-brokerage junction; methods: `findAllByOwnerId()`, `existsByOwnerIdAndBrokerageId()`, `deleteByOwnerIdAndBrokerageId()` |
| `service/OwnerService.kt` | `getList()`, `getFavoriteBrokerages()`, `addFavoriteBrokerage()`, `deleteFavoriteBrokerage()` |
| `controller/OwnerController.kt` | REST endpoints: `GET /api/v1/owners`, `GET /api/v1/owners/{ownerId}/brokerages`, `POST/DELETE /api/v1/owners/{ownerId}/brokerages/{brokerageCode}` |
| `dto/OwnerResponseDto.kt` | Output DTO with ID and name; maps from `Owner` entity |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `controller/` | HTTP layer: bind path parameters, call service, return response envelope |
| `service/` | Business logic: lookup, validation, transaction boundaries |
| `repository/` | Data access: Spring Data derived-query repositories (not QueryDSL) |
| `entity/` | JPA entities: `Owner`, `OwnerFavoriteBrokerage` |
| `dto/` | Transfer objects for HTTP responses |

## For AI Agents

### Working In This Directory
- **Repositories are Spring Data derived queries**, not QueryDSL — a convention exception within the domain-per-package structure. Simple lookups and deletes by natural keys (ID, code) are clearer and more maintainable with Spring Data method names than QueryDSL builder syntax.
- **Entities use proper `@ManyToOne(fetch = FetchType.LAZY, optional = false)` associations with `@JoinColumn`**, never raw `Long` foreign-key fields. `OwnerFavoriteBrokerage` references both `Owner` and `Brokerage` this way.
- `OwnerFavoriteBrokerage` is a junction entity (many-to-many junction table in SQL terms), not a domain entity with business logic — it exists only to track the relationship and must be created/deleted atomically with owner actions.
- `@Transactional(readOnly = true)` is used on methods that access lazy-loaded associations (e.g., `getFavoriteBrokerages()` accesses `OwnerFavoriteBrokerage.brokerage`). Write methods (`@Transactional` without flag) are required for save/delete operations.

### Testing Requirements
- No test directory exists for the owner domain yet — tests would live at `backend/src/test/kotlin/kr/byeongmin/stockdaejang/domain/owner/`.
- Integration tests for repository methods would need `@Testcontainers` with PostgreSQL.
- Service tests would mock repositories.

### Common Patterns
- Owner lookup before modification: `ownerRepository.findByIdIfNullThrow(ownerId)` throws `BusinessException(CommonError.NULL_CASTING_ERROR)` if not found (see `global.util.ifNullThrow()`).
- Favorite brokerage upsert: check `existsByOwnerIdAndBrokerageId()` before saving to avoid duplicates.
- Deletion by composite key: `deleteByOwnerIdAndBrokerageId()` is a Spring Data convenience over manual entity fetch + delete.

## Dependencies

### Internal
- `domain/brokerage`: `OwnerFavoriteBrokerage` holds a `@ManyToOne` reference to `Brokerage`; `OwnerService` calls `BrokerageRepository.findByCode()` to resolve brokerage codes.
- `global/error/CommonError`: `RESOURCE_NOT_FOUND` when brokerage code is invalid, `NULL_CASTING_ERROR` for unexpected nulls.
- `global/response`: `SuccessDataResponse<T>`, `SuccessResponse`.
- `global/util`: `ifNullThrow()` for invariant-checked null unwrap.

### External
- Spring Data JPA, Jakarta Validation (`@Valid`), springdoc-openapi (Swagger annotations).

<!-- MANUAL: -->
