SELECT setval(pg_get_serial_sequence('owners', 'id'), (SELECT MAX(id) FROM owners));
