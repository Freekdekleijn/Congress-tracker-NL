import { TrendingUp, TrendingDown, User } from 'lucide-react';
import type { MemberWithStats } from '../lib/supabase';

interface MemberCardProps {
  member: MemberWithStats;
  onClick: () => void;
}

export function MemberCard({ member, onClick }: MemberCardProps) {
  const partyColors = {
    Democrat: 'bg-blue-100 text-blue-800',
    Republican: 'bg-red-100 text-red-800',
    Independent: 'bg-gray-100 text-gray-800',
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all cursor-pointer border border-gray-200"
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
          {member.image_url ? (
            <img src={member.image_url} alt={member.full_name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-8 h-8 text-gray-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{member.full_name}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${partyColors[member.party as keyof typeof partyColors] || partyColors.Independent}`}>
              {member.party}
            </span>
            <span className="text-sm text-gray-600">{member.chamber}</span>
            <span className="text-sm text-gray-600">• {member.state}</span>
          </div>

          {member.total_trades !== undefined && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <div>
                  <div className="text-xs text-gray-500">Purchases</div>
                  <div className="text-sm font-semibold text-gray-900">{member.total_purchases || 0}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <div>
                  <div className="text-xs text-gray-500">Sales</div>
                  <div className="text-sm font-semibold text-gray-900">{member.total_sales || 0}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
