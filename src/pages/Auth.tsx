import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`/auth/${isLogin ? 'login' : 'signup'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-dark px-4 font-sans relative overflow-hidden transition-colors duration-500 selection:bg-primary/20">
      {/* Theme Toggle Floating at top right */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Subtle grid background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(var(--color-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-line) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] dark:opacity-50 animate-pulse duration-[10s]"></div>
      </div>
      
      <div className="max-w-md w-full space-y-8 bg-panel/70 backdrop-blur-2xl p-10 rounded-3xl border border-line/50 shadow-2xl relative z-10 transition-all duration-300 hover:shadow-primary/5 hover:border-line">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none transition-all duration-700"></div>
        
        <div className="text-center">
          <div className="mx-auto size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-inner shadow-primary/20 drop-shadow-[0_0_15px_rgba(var(--primary),0.2)]">
            <Zap className="size-7 fill-current drop-shadow-md" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            {isLogin ? 'Authenticate to access your dashboard' : 'Initialize your monitoring environment'}
          </p>
        </div>

        <form className="mt-8 space-y-7" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold uppercase tracking-widest text-center shadow-inner">
              {error}
            </div>
          )}
          
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl bg-slate-800/5 dark:bg-background-dark/50 border border-line/60 text-slate-800 dark:text-slate-200 text-sm px-4 py-3 focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none placeholder:text-slate-400 hover:border-line shadow-sm"
                placeholder="sysadmin@local"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500">Password</label>
                {isLogin && (
                  <button type="button" onClick={() => navigate('/reset-password')} className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">
                    Reset?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl bg-slate-800/5 dark:bg-background-dark/50 border border-line/60 text-slate-800 dark:text-slate-200 text-sm px-4 py-3 focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none placeholder:text-slate-400 hover:border-line shadow-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-2xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-bold text-sm tracking-widest uppercase shadow-[0_0_15px_rgba(var(--primary),0.1)] hover:shadow-[0_4px_20px_rgba(var(--primary),0.2)] transition-all active:scale-95"
          >
            {isLogin ? 'Authenticate' : 'Initialize'}
          </button>
        </form>

        <div className="text-center pt-6 border-t border-line/40">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-primary transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
