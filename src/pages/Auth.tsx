import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, Shield, Lock, Mail, UserPlus, 
  ArrowRight, Fingerprint, Activity, 
  RefreshCw, Globe, ShieldAlert, CheckCircle2
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { cn } from '../components/Layout';
import { supabase } from '../supabase/client';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) return;
        if (cancelled) return;

        localStorage.setItem('token', token);

        try {
          const res = await fetch('/auth/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });

          if (res.ok) {
            const payload = await res.json();
            localStorage.setItem('user', JSON.stringify(payload.user));
          }
        } catch {
          // ignore; token is still valid for API calls
        }

        navigate('/app/dashboard');
      } catch (e) {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authErr } = isLogin
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

      if (authErr) throw authErr;

      const token = data.session?.access_token;
      if (!token) throw new Error('Missing session token');
      
      // Try to sync with backend
      let syncSucceeded = false;
      try {
        const res = await fetch('/auth/sync', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('user', JSON.stringify(data.user));
          syncSucceeded = true;
        } else {
          const data = await res.json().catch(() => ({}));
          console.warn('Backend sync failed:', res.status, data);
        }
      } catch (syncErr) {
        console.warn('Backend sync request failed:', syncErr);
      }

      localStorage.setItem('token', token);
      if (!syncSucceeded) {
        const supaUser = data.user;
        localStorage.setItem('user', JSON.stringify({
          email: supaUser?.email,
          name: supaUser?.email?.split('@')[0],
          uid: supaUser?.id,
          plan: 'free',
        }));
      }

      navigate('/app/dashboard');
    } catch (err: any) {
      console.error('Auth sequence error:', err);
      let msg = err.message || 'Authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/auth' },
      });

      if (error) throw error;
      if (!data.url) throw new Error('Missing OAuth redirect URL');
      window.location.href = data.url;
      return;
      
      // Try to sync with backend
      let syncSucceeded = false;
      try {
        // no-op; OAuth completes after redirect
      } catch (syncErr) {
        console.warn('Backend sync request failed:', syncErr);
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      let msg = err.message || 'Verification cancelled';
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col lg:flex-row bg-base text-ink font-sans relative transition-colors duration-1000">
      
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      <div className="absolute top-8 right-8 z-50">
        <ThemeToggle />
      </div>

      {/* Left Side: Branding & Info Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 lg:p-24 bg-panel/30 dark:bg-panel/[0.02] border-r border-line dark:border-white/5 relative overflow-hidden backdrop-blur-sm shrink-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.04] pointer-events-none select-none">
           <Activity className="size-[800px] -ml-40 -mt-40 text-primary animate-pulse" />
        </div>
        
        <div className="relative z-10 space-y-12">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/30 group">
              <Zap className="size-7 fill-white group-hover:scale-110 transition-transform" />
            </div>
            <div>
               <h2 className="text-2xl font-extrabold tracking-tight text-ink uppercase italic">Keep<span className="text-primary">Alive</span></h2>
               <p className="text-[10px] font-black text-ink/70 uppercase tracking-widest italic">Registry 4.0 // Global Sentinel</p>
            </div>
          </div>

          <div className="space-y-6">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-ink tracking-tight uppercase leading-[0.95] lg:max-w-md">
              Global <span className="text-primary italic">Uptime</span> Surveillance
            </h1>
            <p className="text-ink/60 dark:text-ink/70 text-sm md:text-base lg:text-lg font-medium leading-relaxed max-w-sm italic border-l-2 border-primary/30 pl-6">
              Initialize session to authorize and manage high-availability infrastructure across 50+ global edge nodes.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-10">
          <div className="flex items-center gap-12">
             {[
               { label: 'Latency', val: '< 8ms' },
               { label: 'Uptime', val: '99.999%' },
               { label: 'Nodes', val: 'Active' }
             ].map((stat, i) => (
               <div key={i} className="group">
                 <span className="block text-[10px] font-black text-ink/50 uppercase tracking-[0.2em] group-hover:text-primary transition-colors">{stat.label}</span>
                 <span className="block text-2xl font-black text-ink tracking-tight italic">{stat.val}</span>
               </div>
             ))}
          </div>
          <div className="pt-8 border-t border-line dark:border-white/5">
             <div className="flex items-center justify-between text-[10px] font-black text-ink/70 uppercase tracking-widest italic">
                <span className="flex items-center gap-2.5">
                  <Shield className="size-4 text-emerald-500" /> SECURE LINK ACTIVE
                </span>
                <span className="text-ink/40">{isLogin ? 'VERIFY' : 'ENROLL'}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Right Side: Auth Form Panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-4 lg:px-24 lg:py-8 relative bg-base dark:bg-base/95 overflow-hidden">
        <div className="max-w-sm w-full mx-auto space-y-4">
          <div className="space-y-1 lg:text-left">
            <div className="lg:hidden flex items-center gap-3 mb-2">
              <div className="size-8 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/40">
                <Zap className="size-3.5 fill-white" />
              </div>
              <p className="text-xs font-black text-ink uppercase italic">Keep<span className="text-primary">Alive</span></p>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-ink tracking-tight uppercase">
              {isLogin ? 'Grant Access' : 'Create Node'}
            </h3>
            <p className="text-xs font-bold text-ink/60 italic">
              {isLogin ? 'Provide observer credentials for identity verification.' : 'Establish new command center authorization.'}
            </p>
          </div>

          <form className="space-y-3" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 italic">
                <ShieldAlert className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-ink/50 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                  <Mail className="size-3 text-primary" /> Global Identity
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-panel/50 dark:bg-panel/[0.02] border border-line dark:border-white/5 text-ink text-sm font-black italic px-5 py-2.5 focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all placeholder:text-ink/30"
                  placeholder="ADMIN@DOMAIN.CORE"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-ink/50 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Lock className="size-3 text-primary" /> Access Cipher
                  </label>
                  {isLogin && (
                    <button type="button" onClick={() => navigate('/reset-password')} className="text-[9px] font-black text-ink/40 hover:text-primary transition-colors tracking-widest uppercase">
                      Lost Access?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl bg-panel/50 dark:bg-panel/[0.02] border border-line dark:border-white/5 text-ink text-sm font-black italic px-5 py-2.5 focus:ring-4 focus:ring-primary/10 focus:border-primary/50 outline-none transition-all placeholder:text-ink/30"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-3 bg-primary text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group disabled:opacity-50">
                {loading ? <RefreshCw className="size-4 animate-spin" /> : (isLogin ? <Fingerprint className="size-4" /> : <UserPlus className="size-4" />)}
                {loading ? 'AUTHENTICATING...' : (isLogin ? 'VERIFY ACCESS' : 'AUTHORIZE NODE')}
                {!loading && <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />}
              </button>

              <div className="relative flex items-center gap-4">
                <div className="flex-1 h-[1px] bg-line dark:bg-white/5" />
                <span className="text-[9px] font-black text-ink/30 uppercase tracking-[0.3em] italic">Or Interlink</span>
                <div className="flex-1 h-[1px] bg-line dark:bg-white/5" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading}
                className="w-full py-3 bg-panel/50 dark:bg-panel/[0.04] border border-line dark:border-white/10 text-ink rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white dark:hover:bg-white/5 hover:shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 border-dashed"
              >
                {googleLoading ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <svg className="size-5" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                  </svg>
                )}
                {googleLoading ? 'BRIDGING NODE...' : 'AUTHORIZE VIA GOOGLE'}
              </button>
            </div>
          </form>

          <div className="pt-4 border-t border-line dark:border-white/5 flex items-center justify-between">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/40 hover:text-primary transition-all italic border-b border-transparent hover:border-primary/30 pb-0.5"
            >
              {isLogin ? "New Registration" : 'Existing Credentials'}
            </button>
            <div className="flex items-center gap-2 text-ink/20">
              <Globe className="size-3 animate-spin-slow" />
              <CheckCircle2 className="size-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
