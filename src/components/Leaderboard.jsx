import React from 'react';
import { Trophy, Signal } from 'lucide-react';

const Leaderboard = ({ data }) => {
  return (
    <div className="card bg-jdv-card border border-jdv-border rounded-2xl p-6 h-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-jdv-green flex items-center gap-2">
          <Trophy size={14} /> Viral Leaderboard
        </h2>
        <Signal size={14} className="text-slate-600" />
      </div>
      
      <ul className="space-y-4">
        {data.length > 0 ? data.map((user) => (
          <li key={user.rank} className="flex items-center justify-between py-2 border-b border-jdv-border/50 last:border-none">
            <div className="flex items-center gap-4">
              <span className="text-xl font-black text-jdv-border w-6">#{user.rank}</span>
              <div>
                <div className="text-sm font-bold">{user.identity}</div>
                <div className="text-[10px] font-mono text-slate-500 uppercase">{user.token}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-[9px] font-black px-2 py-0.5 rounded border mb-1 ${
                user.tier === 'ARCHITECT' ? 'border-jdv-gold text-jdv-gold bg-jdv-gold/5' :
                user.tier === 'ELITE' ? 'border-jdv-blue text-jdv-blue bg-jdv-blue/5' :
                'border-slate-500 text-slate-500'
              }`}>
                {user.tier}
              </div>
              <div className="text-sm font-black text-white">{user.count} <span className="text-[9px] text-slate-500 font-medium lowercase">signals</span></div>
            </div>
          </li>
        )) : (
          <li className="text-center py-10 text-slate-500 text-xs uppercase tracking-widest">
            Scanning for active signals...
          </li>
        )}
      </ul>
    </div>
  );
};

export default Leaderboard;
