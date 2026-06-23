import React from 'react';
import { Shield, Radio } from 'lucide-react';

const Header = () => {
  return (
    <header className="flex justify-between items-center py-6 border-b border-jdv-border mb-10">
      <div className="flex items-center gap-3">
        <div className="bg-jdv-blue/10 p-2 rounded-lg border border-jdv-blue/20">
          <Shield className="text-jdv-blue" size={24} />
        </div>
        <h1 className="text-xl font-black tracking-tighter uppercase">
          JDV <span className="text-jdv-blue">Sentry Core</span>
        </h1>
      </div>
      
      <div className="flex items-center gap-4 bg-jdv-card px-4 py-2 rounded-full border border-jdv-border">
        <div className="relative">
          <div className="w-2 h-2 bg-jdv-green rounded-full"></div>
          <div className="absolute inset-0 w-2 h-2 bg-jdv-green rounded-full animate-ping"></div>
        </div>
        <span className="text-[10px] font-bold tracking-[0.2em] text-jdv-green uppercase">
          Ultra-Sentry Mode Active
        </span>
      </div>
    </header>
  );
};

export default Header;
