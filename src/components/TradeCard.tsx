import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import type { Trade } from '../lib/supabase';

interface TradeCardProps {
  trade: Trade;
}

export function TradeCard({ trade }: TradeCardProps) {
  const isPurchase = trade.type.toLowerCase() === 'purchase';

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {isPurchase ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            <span className={`font-semibold ${isPurchase ? 'text-green-700' : 'text-red-700'}`}>
              {trade.type}
            </span>
          </div>

          <div className="mb-2">
            <div className="font-semibold text-gray-900">{trade.ticker}</div>
            {trade.asset_description && (
              <div className="text-sm text-gray-600">{trade.asset_description}</div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>{trade.transaction_date ? new Date(trade.transaction_date).toLocaleDateString('nl-NL') : 'Date unknown'}</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-500 mb-1">Amount</div>
          <div className="font-semibold text-gray-900">{trade.amount}</div>
        </div>
      </div>
    </div>
  );
}
