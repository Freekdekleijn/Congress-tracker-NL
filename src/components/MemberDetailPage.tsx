import { useState, useEffect } from 'react';
import { ArrowLeft, User, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { supabase, type CongressMember, type Trade } from '../lib/supabase';
import { TradeCard } from './TradeCard';

interface MemberDetailPageProps {
  memberId: string;
  onBack: () => void;
}

export function MemberDetailPage({ memberId, onBack }: MemberDetailPageProps) {
  const [member, setMember] = useState<CongressMember | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadMemberData();
  }, [memberId]);

  async function loadMemberData() {
    try {
      setLoading(true);

      const { data: memberData, error: memberError } = await supabase
        .from('congress_members')
        .select('*')
        .eq('id', memberId)
        .maybeSingle();

      if (memberError) throw memberError;
      setMember(memberData);

      const { data: tradesData, error: tradesError } = await supabase
        .from('stock_trades')
        .select('*')
        .eq('member_id', memberId)
        .order('transaction_date', { ascending: false });

      if (tradesError) throw tradesError;
      setTrades(tradesData || []);
    } catch (error) {
      console.error('Error loading member data:', error);
    } finally {
      setLoading(false);
    }
  }

  const partyColors = {
    Democrat: 'bg-blue-100 text-blue-800 border-blue-200',
    Republican: 'bg-red-100 text-red-800 border-red-200',
    Independent: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const filteredTrades = trades.filter(trade => {
    if (filterType === 'all') return true;
    return trade.type.toLowerCase() === filterType;
  });

  const totalPurchases = trades.filter(t => t.type.toLowerCase() === 'purchase').length;
  const totalSales = trades.filter(t => t.type.toLowerCase() === 'sale').length;

  const topTickers = trades.reduce((acc, trade) => {
    acc[trade.ticker] = (acc[trade.ticker] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedTickers = Object.entries(topTickers)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Member not found</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-300 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Members
          </button>

          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
              {member.image_url ? (
                <img src={member.image_url} alt={member.full_name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-slate-400" />
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{member.full_name}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${partyColors[member.party as keyof typeof partyColors] || partyColors.Independent}`}>
                  {member.party}
                </span>
                <span className="text-slate-300">{member.chamber}</span>
                <span className="text-slate-300">• {member.state}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-6 h-6 text-slate-600" />
              <h3 className="text-sm font-medium text-gray-600">Total Trades</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{trades.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h3 className="text-sm font-medium text-gray-600">Purchases</h3>
            </div>
            <p className="text-3xl font-bold text-green-700">{totalPurchases}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="w-6 h-6 text-red-600" />
              <h3 className="text-sm font-medium text-gray-600">Sales</h3>
            </div>
            <p className="text-3xl font-bold text-red-700">{totalSales}</p>
          </div>
        </div>

        {sortedTickers.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Traded Stocks</h3>
            <div className="space-y-3">
              {sortedTickers.map(([ticker, count]) => (
                <div key={ticker} className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{ticker}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-600 rounded-full"
                        style={{ width: `${(count / sortedTickers[0][1]) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{count} trades</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Trade History</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'all' ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('purchase')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'purchase' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Purchases
              </button>
              <button
                onClick={() => setFilterType('sale')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'sale' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sales
              </button>
            </div>
          </div>

          {filteredTrades.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No trades found.</p>
          ) : (
            <div className="space-y-3">
              {filteredTrades.map((trade) => (
                <TradeCard key={trade.id} trade={trade} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
