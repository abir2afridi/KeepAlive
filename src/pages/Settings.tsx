import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Crown, User, Globe, Lock,
  RefreshCw, Fingerprint, Terminal, Settings as SettingsIcon,
  HardDrive, Box, ChevronRight, ShieldCheck
} from 'lucide-react';
import { cn } from '../components/Layout';

export default function Settings() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [msg, setMsg] = useState('');
  
  const [statusSlug, setStatusSlug] = useState(user.status_slug || '');
  const [name, setName] = useState(user.name || '');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (searchParams.get('success')) {
      const token = localStorage.getItem('token');
      fetch('/api/verify-checkout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const updatedUser = { ...user, plan: 'pro' };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
          setMsg('Successfully upgraded to Pro Tier.');
        }
        setSearchParams({});
      });
    }
  }, [searchParams, setSearchParams, user]);

  const handleUpgrade = async () => {
    setLoading(true);
    setMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/checkout-session', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMsg('Failed to initiate checkout.');
      }
    } catch (err) {
      setMsg('Error during checkout initialization.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/auth/profile', {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ status_slug: statusSlug, name, password: password || undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Profile update failed');
      
      const updatedUser = { ...user, status_slug: statusSlug, name };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setPassword('');
      setMsg('Profile parameters updated successfully.');
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      
      <div className="flex items-center justify-between pb-4 border-b border-line/40">
        <h2 className="text-xs font-bold text-ink/60 uppercase tracking-[0.3em] italic">System Preferences</h2>
        <div className="size-8 bg-panel rounded-xl flex items-center justify-center border border-line/40 text-primary shadow-sm hover:rotate-90 transition-all duration-500">
          <SettingsIcon className="size-4" />
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between shadow-lg">
           <div className="flex items-center gap-3">
              <Terminal className="size-4 text-primary" />
              <p className="text-[10px] font-bold uppercase tracking-widest">{msg}</p>
           </div>
           <button onClick={() => setMsg('')} className="opacity-50 hover:opacity-100 transition-opacity p-2">
              <Lock className="size-3.5" />
           </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-1 space-y-6">
           <nav className="flex flex-col gap-1">
              {[
                { label: 'Tactical Identity', icon: User, active: true },
                { label: 'Subscription', icon: Crown },
                { label: 'Security Vault', icon: Lock }
              ].map((item, i) => (
                <button key={i} className={cn(
                  "flex items-center gap-3 px-6 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                  item.active 
                    ? "bg-primary text-white italic" 
                    : "text-ink/60 hover:text-ink hover:bg-panel/80 transition-all"
                )}>
                  <item.icon className="size-3.5" />
                  {item.label}
                </button>
              ))}
           </nav>

           <div className="p-6 bg-panel/50 border border-line/40 rounded-3xl space-y-3">
              <HardDrive className="size-5 text-primary" />
              <div className="space-y-1">
                 <h4 className="text-[10px] font-bold text-ink uppercase tracking-widest">Active Link</h4>
                 <p className="text-[9px] text-ink/60 font-medium italic">System performance optimized for high-frequency polling.</p>
              </div>
           </div>
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-3 space-y-16">
           
           {/* Profile Section */}
           <section className="space-y-8">
              <div className="flex items-center justify-between border-b border-line/20 pb-4">
                 <div>
                    <h2 className="text-xl font-bold text-ink uppercase tracking-tight italic">Identity Profile</h2>
                    <p className="text-[8px] font-bold text-ink/60 uppercase tracking-widest mt-0.5">Personnel Registry</p>
                 </div>
                 <Fingerprint className="size-6 text-primary opacity-20" />
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-8">
                 <div className="flex items-center gap-6">
                    <div className="size-16 bg-panel rounded-2xl border border-line/40 flex items-center justify-center group overflow-hidden relative shadow-sm">
                       <User className="size-6 text-ink/70 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                       <h4 className="text-lg font-bold text-ink uppercase tracking-tight italic">{user.name || 'Anonymous User'}</h4>
                       <p className="text-[10px] font-mono text-ink/60 uppercase tracking-widest">{user.email}</p>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[9px] font-bold text-ink/60 uppercase tracking-widest ml-1">Display Name</label>
                    <div className="relative group">
                       <input 
                         type="text" 
                         value={name}
                         onChange={(e) => setName(e.target.value)}
                         className="w-full bg-panel border border-line/40 rounded-xl px-5 py-3 text-[11px] font-bold text-ink focus:outline-none focus:border-primary/50 transition-all font-mono uppercase tracking-widest p-4 whitespace-nowrap overflow-hidden transition-all duration-300"
                         placeholder="Your Display Name"
                       />
                       <User className="absolute right-4 top-1/2 -translate-y-1/2 size-3.5 text-ink/20 group-focus-within:text-primary transition-colors" />
                    </div>
                 </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-bold text-ink/60 uppercase tracking-widest ml-1">Status Slug</label>
                       <div className="relative group">
                          <input 
                            type="text" 
                            value={statusSlug}
                            onChange={(e) => setStatusSlug(e.target.value)}
                            className="w-full bg-panel border border-line/40 rounded-xl px-5 py-3 text-[11px] font-bold text-ink focus:outline-none focus:border-primary/50 transition-all font-mono uppercase tracking-widest p-4 whitespace-nowrap overflow-hidden transition-all duration-300"
                            placeholder="status-slug"
                          />
                          <Terminal className="absolute right-4 top-1/2 -translate-y-1/2 size-3.5 text-ink/20 group-focus-within:text-primary transition-colors" />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-bold text-ink/60 uppercase tracking-widest ml-1">Security Secret</label>
                       <div className="relative group">
                          <input 
                            type="password" 
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-panel border border-line/40 rounded-xl px-5 py-3 text-[11px] font-bold text-ink focus:outline-none focus:border-primary/50 transition-all font-mono uppercase tracking-widest p-4 whitespace-nowrap overflow-hidden transition-all duration-300"
                            placeholder="Leave blank to maintain"
                          />
                          <Lock className="absolute right-4 top-1/2 -translate-y-1/2 size-3.5 text-ink/20 group-focus-within:text-primary transition-colors" />
                       </div>
                    </div>
                 </div>

                 <button 
                    type="submit" 
                    disabled={saveLoading}
                    className="px-10 py-3.5 bg-primary text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:translate-y-[-1px] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 italic"
                 >
                    {saveLoading && <RefreshCw className="size-3.5 animate-spin" />}
                    {saveLoading ? 'Syncing...' : 'Update Protocol'}
                 </button>
              </form>
           </section>

           {/* Access Tiers */}
           <section className="space-y-8">
              <div className="flex items-center justify-between border-b border-line/20 pb-4">
                 <div>
                    <h2 className="text-xl font-bold text-ink uppercase tracking-tight italic">Access Tiers</h2>
                    <p className="text-[8px] font-bold text-ink/60 uppercase tracking-widest mt-0.5">Computational Matrix</p>
                 </div>
                 <Crown className="size-6 text-primary opacity-20" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {[
                   { 
                     name: 'Free Deck', 
                     desc: 'Standard observability tools for developers.',
                     features: ['5 Global Monitors', '5m Pulse Frequency', 'JSON Logs'],
                     active: user.plan !== 'pro',
                     price: '$0',
                     btn: 'Standard'
                   },
                   { 
                     name: 'Pro Tier', 
                     desc: 'Production-grade telemetry & massive registry.',
                     features: ['Unlimited Monitors', '1m Pulse Frequency', 'SMS Inversion', 'REST API Uplink'],
                     active: user.plan === 'pro',
                     price: '$12',
                     btn: 'Upgrade Access',
                     primary: true
                   }
                 ].map((plan, i) => (
                   <div key={i} className={cn(
                     "relative p-8 rounded-3xl border-2 transition-all duration-500 overflow-hidden group shadow-sm",
                     plan.primary 
                       ? "bg-slate-900 border-primary shadow-xl shadow-primary/10" 
                       : "bg-panel border-line/40"
                   )}>
                      <div className="space-y-6 relative z-10">
                         <div className="space-y-3">
                            <div className="flex items-center justify-between">
                               <h3 className={cn("text-xl font-bold uppercase tracking-tight italic", plan.primary ? "text-white" : "text-ink")}>{plan.name}</h3>
                               {plan.active && <div className="px-2.5 py-0.5 bg-primary text-white text-[7px] font-bold uppercase tracking-widest rounded-full">Active</div>}
                            </div>
                            <p className={cn("text-[11px] font-medium leading-relaxed italic", plan.primary ? "text-slate-400" : "text-ink/60")}>{plan.desc}</p>
                         </div>

                         <div className="flex items-baseline gap-1">
                            <span className={cn("text-3xl font-black italic", plan.primary ? "text-white" : "text-ink")}>{plan.price}</span>
                            <span className={cn("text-[8px] font-bold uppercase tracking-widest", plan.primary ? "text-ink/60" : "text-ink/60")}>/ Perpetual</span>
                         </div>

                         <div className="space-y-2.5">
                            {plan.features.map((f, j) => (
                              <div key={j} className="flex items-center gap-3">
                                 <ShieldCheck className={cn("size-3.5", plan.primary ? "text-primary" : "text-emerald-500")} />
                                 <span className={cn("text-[9px] font-bold uppercase tracking-widest italic", plan.primary ? "text-white" : "text-ink")}>{f}</span>
                              </div>
                            ))}
                         </div>

                         <button 
                           onClick={plan.primary && !plan.active ? handleUpgrade : undefined}
                           disabled={plan.active || loading}
                           className={cn(
                             "w-full py-3.5 rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all shadow-lg italic",
                             plan.active 
                               ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/5" 
                               : plan.primary
                                 ? "bg-primary text-white hover:translate-y-[-1px] shadow-primary/20"
                                 : "bg-panel text-ink border border-line/40 transition-all duration-300"
                           )}
                         >
                            {loading && plan.primary ? <RefreshCw className="size-3.5 animate-spin mx-auto" /> : plan.active ? 'Registry Active' : plan.btn}
                         </button>
                      </div>
                   </div>
                 ))}
              </div>
           </section>

           {/* Metrics Footer */}
           <section className="bg-panel border border-line/40 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="space-y-3 flex-1">
                 <div className="flex items-center gap-3">
                    <Box className="size-4 text-primary" />
                    <h3 className="text-[10px] font-bold text-ink uppercase tracking-widest italic">Storage Allocation</h3>
                 </div>
                 <p className="text-[11px] font-medium text-ink/60 italic leading-relaxed">
                    Data encrypted across redundancy clusters. SHA-256 verified persistence.
                 </p>
              </div>
              <div className="flex items-center gap-6">
                 <div className="text-right">
                    <span className="text-[8px] font-bold text-ink/60 uppercase tracking-widest">Usage</span>
                    <h4 className="text-2xl font-black text-ink italic tracking-tighter">04%</h4>
                 </div>
                 <div className="size-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 shadow-sm">
                    <ShieldCheck className="size-6" />
                 </div>
              </div>
           </section>

        </main>
      </div>

      <footer className="pt-8 border-t border-line/40 flex justify-between items-center opacity-40 text-[10px] font-bold text-ink/60 uppercase tracking-widest italic">
         <div>Identity Persistence: NOMINAL // Registry Alpha</div>
         <div>SaaS System Profile v4.0.2</div>
      </footer>
    </div>
  );
}
