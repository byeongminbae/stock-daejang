ALTER TABLE trades
    DROP CONSTRAINT trades_quantity_max_int;

ALTER TABLE trades
    ALTER COLUMN quantity TYPE NUMERIC USING quantity::NUMERIC,
    ALTER COLUMN unit_price TYPE NUMERIC USING unit_price::NUMERIC,
    ALTER COLUMN realized_profit TYPE NUMERIC;

ALTER TABLE dashboard_positions
    ALTER COLUMN quantity TYPE NUMERIC,
    ALTER COLUMN total_buy_amount TYPE NUMERIC;

ALTER TABLE trades
    ADD COLUMN remaining_quantity_snapshot NUMERIC,
    ADD COLUMN remaining_cost_snapshot NUMERIC;

WITH signed AS (
    SELECT
        id,
        owner_id,
        brokerage_id,
        stock_id,
        executed_at,
        CASE side WHEN 'BUY' THEN quantity ELSE -quantity END AS signed_quantity,
        CASE side
            WHEN 'BUY' THEN quantity * unit_price
            ELSE -(quantity * unit_price - realized_profit)
        END AS signed_cost
    FROM trades
),
cumulative AS (
    SELECT
        id,
        SUM(signed_quantity) OVER w AS remaining_quantity_snapshot,
        SUM(signed_cost) OVER w AS remaining_cost_snapshot
    FROM signed
    WINDOW w AS (
        PARTITION BY owner_id, brokerage_id, stock_id
        ORDER BY executed_at, id
    )
)
UPDATE trades
SET remaining_quantity_snapshot = cumulative.remaining_quantity_snapshot,
    remaining_cost_snapshot = cumulative.remaining_cost_snapshot
FROM cumulative
WHERE trades.id = cumulative.id;

ALTER TABLE trades
    ALTER COLUMN remaining_quantity_snapshot SET NOT NULL,
    ALTER COLUMN remaining_cost_snapshot SET NOT NULL;
