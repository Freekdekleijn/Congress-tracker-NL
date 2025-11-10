/*
  # Drop old trades table

  1. Changes
    - Drop stock_alerts table (has foreign key to trades)
    - Drop old trades table
    - All data has been migrated to stock_trades table
*/

DROP TABLE IF EXISTS stock_alerts CASCADE;
DROP TABLE IF EXISTS trades CASCADE;