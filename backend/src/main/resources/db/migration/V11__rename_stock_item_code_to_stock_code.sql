ALTER TABLE stocks RENAME COLUMN item_code TO stock_code;
ALTER TABLE stocks RENAME CONSTRAINT stocks_item_code_format TO stocks_stock_code_format;
