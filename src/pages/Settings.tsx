import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, Zap, CheckCircle2, Activity } from 'lucide-react';

export default function Settings() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [msg, setMsg] = useState('');
  
  const [statusSlug, setStatusSlug] = useState(user.status_slug || '');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (searchParams.get('success')) {
      // Re-verify checkout with backend
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
          setMsg('Subscription upgraded to Pro successfully!');
        }
        setSearchParams({}); // Clear query params
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
      setMsg('Error starting checkout process.');
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
        body: JSON.stringify({ status_slug: statusSlug, password: password || undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      
      const updatedUser = { ...user, status_slug: statusSlug };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setPassword('');
      setMsg('Operator profile updated successfully.');
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 font-sans">
      <div className="mb-8 border-b border-line/40 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">System Configuration</h1>
        <p className="text-sm font-medium text-slate-500 mt-2">Manage your account parameters and billing preferences.</p>
      </div>

      {msg && (
        <div className="mb-6 p-4 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-mono flex items-center gap-3">
          <CheckCircle2 className="size-5" />
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        {/* Profile Section */}
        <section className="bg-panel/70 backdrop-blur-2xl rounded-3xl border border-line/50 p-10 shadow-sm relative overflow-hidden group hover:shadow-primary/5 hover:border-line transition-all duration-300">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/40 group-hover:bg-primary transition-colors duration-300"></div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            Operator Profile
          </h3>
          <div className="flex items-center gap-6">
            <div className="size-20 rounded-xl bg-background-dark/50 flex items-center justify-center overflow-hidden border border-line shadow-sm">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'Alex'}&backgroundColor=0f172a`} alt="Avatar" className="w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-500" />
            </div>
            <div>
              <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">{user.email || 'sysadmin@local'}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-widest shadow-sm">
                  {user.plan || 'Free'} Tier
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-line text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">
                  Active
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="mt-8 pt-8 border-t border-line/50 space-y-5">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Configuration parameters</h4>
            
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer">Public Status Slug</label>
              <div className="flex rounded-2xl shadow-sm hover:border-line transition-colors">
                <span className="inline-flex items-center px-4 rounded-l-2xl border border-r-0 border-line/60 bg-slate-800/5 dark:bg-background-dark/50 text-slate-500 text-sm font-mono">
                  keepalive.com/status/
                </span>
                <input
                  type="text"
                  value={statusSlug}
                  onChange={(e) => setStatusSlug(e.target.value)}
                  className="flex-1 block w-full min-w-0 rounded-none rounded-r-2xl border border-line/60 bg-slate-800/5 dark:bg-background-dark/50 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm"
                  placeholder="your-company-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest cursor-pointer">Change Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-2xl border border-line/60 bg-slate-800/5 dark:bg-background-dark/50 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-sm hover:border-line"
                placeholder="Leave blank to keep unchanged"
              />
            </div>
            
            <button 
              type="submit"
              disabled={saveLoading}
              className="mt-8 w-full flex justify-center py-3.5 px-4 rounded-2xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-bold text-sm tracking-widest uppercase shadow-[0_0_15px_rgba(var(--primary),0.1)] hover:shadow-[0_4px_20px_rgba(var(--primary),0.2)] transition-all active:scale-95 disabled:opacity-50"
            >
              {saveLoading ? 'Applying Changes...' : 'Save Profile Details'}
            </button>
          </form>
        </section>

        {/* Subscription Plan */}
        <section className="bg-panel/70 backdrop-blur-2xl rounded-3xl border border-line/50 p-10 shadow-sm relative overflow-hidden group hover:shadow-emerald-500/5 hover:border-line transition-all duration-300">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500/40 group-hover:bg-emerald-500 transition-colors duration-300"></div>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <CreditCard className="size-4 text-emerald-500" />
              Resource Allocation & Billing
            </h3>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-line text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">
              Current Tier: <span className="text-slate-800 dark:text-slate-200">{user.plan || 'Free'}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <div className={`p-8 rounded-3xl border transition-all duration-300 ${user.plan === 'free' || !user.plan ? 'border-primary/50 bg-primary/5 shadow-sm' : 'border-line/50 bg-slate-50 dark:bg-background-dark/30 hover:border-line'}`}>
              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Hobby Node</h4>
              <p className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6">$0<span className="text-sm font-medium text-slate-500">/mo</span></p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="size-5 text-emerald-500" /> 5 Monitors
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="size-5 text-emerald-500" /> 5-minute intervals
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="size-5 text-emerald-500" /> Email alerts
                </li>
              </ul>
              {user.plan === 'free' || !user.plan ? (
                <button disabled className="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-background-dark border border-line/50 text-slate-400 font-bold uppercase tracking-widest text-xs shadow-inner cursor-not-allowed">
                  Current Allocation
                </button>
              ) : (
                <button className="w-full py-3.5 rounded-2xl border border-line/80 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest text-xs hover:bg-slate-100 dark:hover:bg-line/30 hover:text-slate-900 dark:hover:text-slate-200 shadow-sm transition-all hover:border-line">
                  Downgrade
                </button>
              )}
            </div>

            {/* Pro Plan */}
            <div className={`p-8 rounded-3xl border transition-all duration-300 ${user.plan === 'pro' ? 'border-primary/50 bg-primary/5 shadow-sm' : 'border-line/50 bg-slate-50 dark:bg-background-dark/30 relative overflow-hidden hover:border-primary/30 hover:shadow-primary/5 group/pro'}`}>
              {user.plan !== 'pro' && (
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none group-hover/pro:bg-primary/20 transition-all duration-500"></div>
              )}
              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
                Pro Cluster <Zap className="size-5 text-primary fill-primary/20" />
              </h4>
              <p className="text-4xl font-bold text-slate-800 dark:text-slate-100 mb-6">$12<span className="text-sm font-medium text-slate-500">/mo</span></p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="size-5 text-primary" /> 50 Monitors
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="size-5 text-primary" /> 1-minute intervals
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="size-5 text-primary" /> SMS & Webhook alerts
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="size-5 text-primary" /> Custom Status Pages
                </li>
              </ul>
              {user.plan === 'pro' ? (
                <button disabled className="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-background-dark border border-line/50 text-slate-400 font-bold uppercase tracking-widest text-xs shadow-inner cursor-not-allowed">
                  Current Allocation
                </button>
              ) : (
                <button onClick={handleUpgrade} disabled={loading} className="w-full flex justify-center items-center py-3.5 rounded-2xl bg-primary/10 border border-primary/30 text-primary font-bold uppercase tracking-widest text-xs hover:bg-primary/20 hover:shadow-[0_4px_20px_rgba(var(--primary),0.2)] shadow-[0_0_15px_rgba(var(--primary),0.1)] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 relative overflow-hidden">
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover/pro:animate-[shimmer_1.5s_infinite]"></div>
                  {loading ? <Activity className="size-5 text-primary animate-pulse" /> : 'Upgrade Allocation'}
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
