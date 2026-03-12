import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  KeyRound, ShieldCheck, Mail, ShieldAlert, 
  ArrowLeft, RefreshCw, Zap, Lock, Activity,
  Shield, Fingerprint
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { cn } from '../components/Layout';
import { supabase } from '../supabase/client';

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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setMsg('If credentials match, a recovery payload has been dispatched.');
    } catch (err: any) {
      console.error('Password reset request error:', err);
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
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        throw new Error('Recovery session not found. Open the reset link from your email again.');
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMsg('Security credentials updated. Redirecting to terminal...');
      setTimeout(() => navigate('/auth'), 2500);
    } catch (err: any) {
      console.error('Password reset confirm error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base text-ink p-6 font-sans relative overflow-hidden transition-colors duration-1000">
      
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="absolute top-8 right-8 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full relative z-10 space-y-10 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Branding Hub */}
        <div className="text-center space-y-4">
           <div className="mx-auto size-16 rounded-3xl bg-panel border border-line dark:border-white/10 flex items-center justify-center text-primary shadow-xl">
              {token ? <ShieldCheck className="size-8" /> : <KeyRound className="size-8" />}
           </div>
           <div className="space-y-1">
              <h2 className="text-3xl font-extrabold text-ink  tracking-tight uppercase">
                {token ? 'Secure' : 'Access'} <span className="text-primary">Recovery</span>
              </h2>
              <p className="text-[10px] font-bold text-ink/70 uppercase tracking-widest italic">Emergency Re-authorization Protocol</p>
           </div>
        </div>

        {/* Content Box */}
        <div className="bg-panel backdrop-blur-3xl p-10 rounded-[32px] border border-line dark:border-white/10 shadow-xl relative overflow-hidden group">
           
           <div className="space-y-8 relative z-10">
              <div className="space-y-2 text-center">
                 <h3 className="text-lg font-bold text-ink  uppercase tracking-tight">
                    {token ? 'Set New Key' : 'Identity Verification'}
                 </h3>
                 <p className="text-xs font-medium text-ink/60 italic">
                    {token ? 'Define a new cryptographic phase.' : 'Provide your registered identity.'}
                 </p>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 italic">
                  <ShieldAlert className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              {msg && (
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 italic">
                  <ShieldCheck className="size-4 shrink-0" />
                  {msg}
                </div>
              )}

              <form className="space-y-6" onSubmit={token ? handleConfirmReset : handleRequestReset}>
                <div className="space-y-6">
                  {!token ? (
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-ink/70 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Mail className="size-3.5 text-primary" /> Registered Identity
                      </label>
                      <input
                        type="email"
                        required
                        autoComplete="username"
                        value={email}
                        disabled={loading || !!msg}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-2xl bg-base dark:bg-base/[0.01] border border-line dark:border-white/10 text-ink  text-sm font-bold italic px-6 py-4 focus:ring-4 focus:ring-primary/5 focus:border-primary/50 outline-none transition-all placeholder:text-ink/70"
                        placeholder="ADMIN@DOMAIN.CORE"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-ink/70 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Lock className="size-3.5 text-primary" /> New Encryption Key
                      </label>
                      <input
                        type="password"
                        required
                        autoComplete="new-password"
                        value={password}
                        disabled={loading || !!msg}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-2xl bg-base dark:bg-base/[0.01] border border-line dark:border-white/10 text-ink  text-sm font-bold italic px-6 py-4 focus:ring-4 focus:ring-primary/5 focus:border-primary/50 outline-none transition-all placeholder:text-ink/70"
                        placeholder="••••••••"
                        minLength={8}
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !!msg}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:translate-y-[-1px] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 group disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="size-4 animate-spin" /> : <Zap className="size-3.5" />}
                  {loading ? 'Processing...' : (token ? 'Update Secret' : 'Send Reset Link')}
                </button>
              </form>

              <div className="pt-6 border-t border-line dark:border-white/5 text-center">
                <Link
                  to="/auth"
                  className="text-[10px] font-bold uppercase tracking-widest text-ink/70 hover:text-primary transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="size-3" /> Back to Terminal
                </Link>
              </div>
           </div>
        </div>

        {/* Security Meta */}
        <div className="text-center opacity-40 hover:opacity-100 transition-opacity">
           <div className="flex items-center justify-center gap-4 mb-3">
              <Shield className="size-3.5 text-ink/70" />
              <div className="h-[1px] w-8 bg-slate-200 dark:bg-base/10" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-ink/60">Secured</span>
              <div className="h-[1px] w-8 bg-slate-200 dark:bg-base/10" />
              <Activity className="size-3.5 text-ink/70" />
           </div>
           <p className="text-[9px] font-bold text-ink/70 uppercase tracking-[0.2em] italic">
             V4.2 Registry Logging Active
           </p>
        </div>
      </div>
    </div>
  );
}
