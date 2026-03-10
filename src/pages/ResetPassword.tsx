import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { KeyRound, ShieldCheck } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function ResetPassword() {
  const { token } = useParams<{ token?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');
    
    try {
      const res = await fetch('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request reset');
      setMsg('If an account exists, a reset link has been emailed.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');
    
    try {
      const res = await fetch('/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete reset');
      setMsg('Password updated securely. Redirecting to login...');
      setTimeout(() => navigate('/auth'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-dark px-4 font-sans relative overflow-hidden transition-colors duration-500 selection:bg-primary/20">
      {/* Theme Toggle Floating at top right */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(var(--color-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-line) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] dark:opacity-50 animate-pulse duration-[10s]"></div>
      </div>
      
      <div className="max-w-md w-full space-y-8 bg-panel/70 backdrop-blur-2xl p-10 rounded-3xl border border-line/50 shadow-2xl relative z-10 transition-all duration-300 hover:shadow-primary/5 hover:border-line">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none transition-all duration-700"></div>
        
        <div className="text-center">
          <div className="mx-auto size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-inner shadow-primary/20 drop-shadow-[0_0_15px_rgba(var(--primary),0.2)]">
            {token ? <ShieldCheck className="size-7 fill-current drop-shadow-md" /> : <KeyRound className="size-7 fill-current drop-shadow-md" />}
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {token ? 'Secure New Password' : 'Password Recovery'}
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            {token ? 'Enter a strong, unique password.' : 'Initialize a secure recovery process.'}
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold uppercase tracking-widest text-center shadow-inner">
            {error}
          </div>
        )}
        
        {msg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-widest text-center shadow-inner">
            {msg}
          </div>
        )}

        <form className="mt-8 space-y-7" onSubmit={token ? handleConfirmReset : handleRequestReset}>
          <div className="space-y-5">
            {!token ? (
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 cursor-pointer">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  disabled={loading || !!msg}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl bg-slate-800/5 dark:bg-background-dark/50 border border-line/60 text-slate-800 dark:text-slate-200 text-sm px-4 py-3 focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none placeholder:text-slate-400 hover:border-line shadow-sm"
                  placeholder="sysadmin@local"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500">New Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  disabled={loading || !!msg}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl bg-slate-800/5 dark:bg-background-dark/50 border border-line/60 text-slate-800 dark:text-slate-200 text-sm px-4 py-3 focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none placeholder:text-slate-400 hover:border-line shadow-sm"
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !!msg}
            className="w-full py-3.5 px-4 rounded-2xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-bold text-sm tracking-widest uppercase shadow-[0_0_15px_rgba(var(--primary),0.1)] hover:shadow-[0_4px_20px_rgba(var(--primary),0.2)] transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Processing...' : (token ? 'Reset Password' : 'Send Recovery Link')}
          </button>
        </form>

        <div className="text-center pt-6 border-t border-line/40">
          <Link
            to="/auth"
            className="text-[11px] font-bold uppercase tracking-widest text-slate-500 hover:text-primary transition-colors"
          >
            Return to Authentication
          </Link>
        </div>
      </div>
    </div>
  );
}
