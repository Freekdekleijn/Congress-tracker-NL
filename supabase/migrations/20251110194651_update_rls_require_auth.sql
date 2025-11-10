/*
  # Update RLS Policies to Require Authentication

  1. Security Changes
    - Drop all existing public policies
    - Add new policies requiring authentication
    - congress_members: Only authenticated users can view
    - trades: Only authenticated users can view
    - stock_alerts: Only authenticated users can view
    - user_notification_preferences: Users can only manage their own preferences

  2. Important Notes
    - All data is now protected behind authentication
    - Users must be logged in to access any congress data
*/

-- Drop existing public policies
DROP POLICY IF EXISTS "Anyone can view Congress members" ON congress_members;
DROP POLICY IF EXISTS "Anyone can view trades" ON trades;
DROP POLICY IF EXISTS "Users can view stock alerts" ON stock_alerts;
DROP POLICY IF EXISTS "Users can view own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can insert own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON user_notification_preferences;
DROP POLICY IF EXISTS "Users can delete own notification preferences" ON user_notification_preferences;

-- Congress Members policies (authenticated users only)
CREATE POLICY "Authenticated users can view all congress members"
  ON congress_members FOR SELECT
  TO authenticated
  USING (true);

-- Trades policies (authenticated users only)
CREATE POLICY "Authenticated users can view all trades"
  ON trades FOR SELECT
  TO authenticated
  USING (true);

-- Stock Alerts policies (authenticated users only)
CREATE POLICY "Authenticated users can view stock alerts"
  ON stock_alerts FOR SELECT
  TO authenticated
  USING (true);

-- User Notification Preferences policies (users manage their own)
CREATE POLICY "Users can view own notification preferences"
  ON user_notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON user_notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON user_notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notification preferences"
  ON user_notification_preferences FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);