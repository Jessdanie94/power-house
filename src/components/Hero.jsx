import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Cpu, Fingerprint } from 'lucide-react';

const Hero = ({ product }) => {
  if (!product) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-jdv-blue/10 via-transparent to-transparent p-[1px] rounded-3xl border border-jdv-border overflow-hidden mb-12"
    >
      <div className="bg-jdv-card p-8 md:p-12 flex flex-col md:flex-row gap-12 items-center">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 bg-jdv-blue/20 text-jdv-blue px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-jdv-blue/30">
            <Zap size={12} /> Elite Mission Upgrade
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">{product.name}</h2>
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
            MISSION BRIEFING: For high-stakes operations in volatile environments. 
            This kit bundles the Solar-Flare Generator for off-grid energy independence 
            and secure biometric data encryption.
          </p>
          <div className="flex items-center gap-8 pt-4">
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Funding Required</span>
              <span className="text-3xl font-mono font-bold text-jdv-blue">${product.price.toLocaleString()} CAD</span>
            </div>
            <button className="bg-jdv-blue hover:bg-jdv-blue/90 text-jdv-dark font-black px-8 py-4 rounded-xl transition-all active:scale-95 uppercase tracking-widest text-xs flex items-center gap-2 shadow-[0_10px_20px_-10px_#38bdf8]">
              <Fingerprint size={16} /> Deploy Kit Now
            </button>
          </div>
        </div>
        <div className="w-64 h-64 md:w-80 md:h-80 bg-jdv-dark rounded-full border border-jdv-border flex items-center justify-center relative">
            <div className="absolute inset-0 bg-jdv-blue/5 rounded-full animate-pulse"></div>
            <span className="text-9xl grayscale opacity-40">{product.emoji}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default Hero;
