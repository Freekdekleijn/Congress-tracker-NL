/*
  # Create stock trades table

  1. New Tables
    - `stock_trades`
      - `id` (uuid, primary key)
      - `member_id` (uuid, foreign key to congress_members)
      - `disclosure_date` (date) - When the trade was disclosed
      - `transaction_date` (date) - When the trade occurred
      - `ticker` (text) - Stock ticker symbol
      - `asset_description` (text) - Description of the asset
      - `type` (text) - Either 'purchase' or 'sale'
      - `amount` (text) - Transaction amount range (e.g., "$1,001 - $15,000")
      - `comment` (text) - Additional comments
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `stock_trades` table
    - Add policy for authenticated users to read all trades
*/

CREATE TABLE IF NOT EXISTS stock_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES congress_members(id) ON DELETE CASCADE NOT NULL,
  disclosure_date date NOT NULL,
  transaction_date date,
  ticker text NOT NULL,
  asset_description text,
  type text NOT NULL CHECK (type IN ('purchase', 'sale')),
  amount text NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_trades_member_id ON stock_trades(member_id);
CREATE INDEX IF NOT EXISTS idx_stock_trades_ticker ON stock_trades(ticker);
CREATE INDEX IF NOT EXISTS idx_stock_trades_disclosure_date ON stock_trades(disclosure_date DESC);

ALTER TABLE stock_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all trades"
  ON stock_trades
  FOR SELECT
  TO authenticated
  USING (true);