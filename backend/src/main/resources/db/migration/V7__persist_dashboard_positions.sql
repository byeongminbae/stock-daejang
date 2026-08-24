CREATE TABLE dashboard_positions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    owner_id BIGINT NOT NULL REFERENCES owners(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    brokerage_id BIGINT NOT NULL REFERENCES brokerages(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    security_id BIGINT NOT NULL REFERENCES securities(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    quantity NUMERIC(38, 0) NOT NULL,
    total_buy_amount NUMERIC(38, 0) NOT NULL,
    CONSTRAINT dashboard_positions_identity_unique UNIQUE (owner_id, brokerage_id, security_id),
    CONSTRAINT dashboard_positions_quantity_positive CHECK (quantity > 0),
    CONSTRAINT dashboard_positions_total_buy_amount_non_negative CHECK (total_buy_amount >= 0)
);

INSERT INTO dashboard_positions (
    owner_id,
    brokerage_id,
    security_id,
    quantity,
    total_buy_amount
)
SELECT
    owner_id,
    brokerage_id,
    security_id,
    SUM(CASE side WHEN 'BUY' THEN quantity ELSE -quantity END),
    SUM(
        CASE side
            WHEN 'BUY' THEN quantity::NUMERIC * unit_price::NUMERIC
            ELSE -(quantity::NUMERIC * unit_price::NUMERIC - realized_profit)
        END
    )
FROM trades
GROUP BY owner_id, brokerage_id, security_id
HAVING SUM(CASE side WHEN 'BUY' THEN quantity ELSE -quantity END) > 0;
