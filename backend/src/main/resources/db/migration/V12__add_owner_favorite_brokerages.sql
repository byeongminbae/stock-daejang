CREATE TABLE owner_favorite_brokerages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_id BIGINT NOT NULL REFERENCES owners (id),
    brokerage_id BIGINT NOT NULL REFERENCES brokerages (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT owner_favorite_brokerages_owner_brokerage_unique UNIQUE (owner_id, brokerage_id)
);
