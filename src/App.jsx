import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Inventory from './components/Inventory';
import Leaderboard from './components/Leaderboard';
import { Activity, Globe } from 'lucide-react';

function App() {
  const [products, setProducts] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [prodRes, leaderRes, salesRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/growth/leaderboard'),
          fetch('/api/social-proof/live-signals')
        ]);
        
        const p = await prodRes.json();
        const l = await leaderRes.json();
        const s = await salesRes.json();
        
        setProducts(p.products || p);
        setLeaders(l);
        setRecentSales(s);
      } catch (err) {
        console.error("Uplink Failure:", err);
      }
    };
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const eliteKit = products.find(p => p.id === 'bundle-001');
  const regularItems = products.filter(p => p.id !== 'bundle-001');

  return (
    <div className="min-h-screen p-4 md:p-10 max-w-[1600px] mx-auto">
      <Header />
      
      <main>
        <Hero product={eliteKit} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
             <Inventory products={regularItems} />
          </div>
          
          <div className="lg:col-span-1">
             <Leaderboard data={leaders} />
          </div>
          
          <div className="lg:col-span-1">
             <div className="card bg-jdv-card border border-jdv-border rounded-2xl p-6 h-full">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-jdv-blue flex items-center gap-2 mb-8">
                  <Activity size={14} /> Regional Telemetry
                </h2>
                <ul className="space-y-4">
                  {recentSales.length > 0 ? recentSales.map((sale, i) => (
                    <li key={i} className="flex justify-between py-2 border-b border-jdv-border last:border-none">
                      <div className="flex items-center gap-3">
                         <Globe size={14} className="text-jdv-green" />
                         <span className="text-sm font-bold text-slate-300">{sale.initial}</span>
                      </div>
                      <span className="text-xs font-medium text-slate-500">Secured {sale.product}</span>
                    </li>
                  )) : (
                    <li className="text-center py-10 text-slate-600 text-xs italic">Waiting for Saskatchewan signal...</li>
                  )}
                </ul>
             </div>
          </div>
        </div>
      </main>
      
      <footer className="mt-20 pt-8 border-t border-jdv-border text-center">
        <p className="text-[10px] uppercase tracking-[0.5em] text-slate-600 font-bold">
          Jesse's Digital Ventures — Architecting Tomorrow, Today
        </p>
      </footer>
    </div>
  );
}

export default App;
