import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type CongressMember = {
  id: string;
  full_name: string;
  state: string;
  party: string;
  chamber: string;
  image_url: string | null;
  created_at: string;
};

export type Trade = {
  id: string;
  member_id: string;
  transaction_date: string | null;
  disclosure_date: string;
  ticker: string;
  asset_description: string | null;
  type: string;
  amount: string;
  comment: string | null;
  created_at: string;
};

export type MemberWithStats = CongressMember & {
  total_trades?: number;
  total_purchases?: number;
  total_sales?: number;
  latest_trade_date?: string;
};
