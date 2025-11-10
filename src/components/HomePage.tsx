import { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp } from 'lucide-react';
import { supabase, type MemberWithStats } from '../lib/supabase';
import { MemberCard } from './MemberCard';

interface HomePageProps {
  onMemberSelect: (memberId: string) => void;
}

export function HomePage({ onMemberSelect }: HomePageProps) {
  const [members, setMembers] = useState<MemberWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [partyFilter, setPartyFilter] = useState<string>('all');
  const [chamberFilter, setChamberFilter] = useState<string>('all');

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    try {
      setLoading(true);

      const { data: membersData, error: membersError } = await supabase
        .from('congress_members')
        .select('*')
        .order('full_name');

      if (membersError) throw membersError;

      const { data: tradesData } = await supabase
        .from('stock_trades')
        .select('member_id, type, transaction_date');

      const memberStats = new Map<string, { total_trades: number; total_purchases: number; total_sales: number; latest_trade_date: string }>();

      tradesData?.forEach((trade) => {
        const stats = memberStats.get(trade.member_id) || {
          total_trades: 0,
          total_purchases: 0,
          total_sales: 0,
          latest_trade_date: trade.transaction_date
        };

        stats.total_trades++;
        if (trade.type.toLowerCase() === 'purchase') {
          stats.total_purchases++;
        } else {
          stats.total_sales++;
        }

        if (trade.transaction_date > stats.latest_trade_date) {
          stats.latest_trade_date = trade.transaction_date;
        }

        memberStats.set(trade.member_id, stats);
      });

      const membersWithStats: MemberWithStats[] = (membersData || []).map(member => ({
        ...member,
        ...memberStats.get(member.id),
      }));

      setMembers(membersWithStats);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.state.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesParty = partyFilter === 'all' || member.party === partyFilter;
    const matchesChamber = chamberFilter === 'all' || member.chamber === chamberFilter;

    return matchesSearch && matchesParty && matchesChamber;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Congress Trading Tracker</h1>
          </div>
          <p className="text-slate-300">Track and analyze stock trades by US Congress members</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={partyFilter}
                  onChange={(e) => setPartyFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent appearance-none bg-white cursor-pointer"
                >
                  <option value="all">All Parties</option>
                  <option value="Democrat">Democrat</option>
                  <option value="Republican">Republican</option>
                  <option value="Independent">Independent</option>
                </select>
              </div>

              <select
                value={chamberFilter}
                onChange={(e) => setChamberFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent appearance-none bg-white cursor-pointer"
              >
                <option value="all">All Chambers</option>
                <option value="House">House</option>
                <option value="Senate">Senate</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
            <p className="mt-4 text-gray-600">Loading members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-600">No members found matching your filters.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Showing {filteredMembers.length} of {members.length} members
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  onClick={() => onMemberSelect(member.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
