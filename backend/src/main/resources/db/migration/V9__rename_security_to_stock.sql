ALTER TABLE securities RENAME TO stocks;
ALTER TABLE stocks RENAME CONSTRAINT securities_item_code_format TO stocks_item_code_format;
ALTER TABLE stocks RENAME CONSTRAINT securities_stock_name_not_blank TO stocks_stock_name_not_blank;
ALTER TABLE stocks RENAME CONSTRAINT securities_market_not_blank TO stocks_market_not_blank;

ALTER TABLE trades RENAME COLUMN security_id TO stock_id;
ALTER TABLE trades RENAME CONSTRAINT trades_security_id_fkey TO trades_stock_id_fkey;

ALTER TABLE dashboard_positions RENAME COLUMN security_id TO stock_id;
ALTER TABLE dashboard_positions RENAME CONSTRAINT dashboard_positions_security_id_fkey TO dashboard_positions_stock_id_fkey;

ALTER TABLE security_catalog_locks RENAME TO stock_catalog_locks;
