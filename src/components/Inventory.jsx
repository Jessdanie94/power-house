import React from 'react';
import { Package, ArrowUpRight } from 'lucide-react';

const Inventory = ({ products }) => {
  return (
    <div className="card bg-jdv-card border border-jdv-border rounded-2xl p-6 h-full">
      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-jdv-blue flex items-center gap-2 mb-8">
        <Package size={14} /> System Inventory
      </h2>
      
      <div className="grid grid-cols-1 gap-4">
        {products.map((p) => (
          <div key={p.id} className="group bg-jdv-dark border border-jdv-border p-4 rounded-xl flex justify-between items-center hover:border-jdv-blue/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
               <span className="text-2xl">{p.emoji}</span>
               <div>
                  <div className="text-sm font-bold group-hover:text-jdv-blue transition-colors">{p.name}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-tighter">{p.category}</div>
               </div>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-sm font-mono font-bold text-jdv-gold">${p.price}</span>
               <ArrowUpRight size={12} className="text-slate-700 group-hover:text-jdv-blue transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Inventory;
