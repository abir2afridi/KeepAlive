import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, Shield, Lock, Mail, UserPlus, 
  ArrowRight, Fingerprint, Activity, 
  RefreshCw, Globe, ShieldAlert
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { cn } from '../components/Layout';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/auth/${isLogin ? 'login' : 'signup'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication sequence failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base text-ink p-6 font-sans relative overflow-hidden transition-colors duration-1000">
      
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="absolute top-8 right-8 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 bg-panel dark:bg-panel/[0.01] backdrop-blur-2xl rounded-[32px] border border-line dark:border-white/5 shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Left Side: Branding & Info */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-base dark:bg-panel/[0.02] border-r border-line dark:border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
             <Activity className="size-[600px] -ml-20 -mt-20 text-primary" />
          </div>
          
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/30 group">
                <Zap className="size-6 fill-white group-hover:scale-110 transition-transform" />
              </div>
              <div>
                 <h2 className="text-xl font-extrabold tracking-tight text-ink  uppercase italic">Keep<span className="text-primary">Alive</span></h2>
                 <p className="text-[9px] font-bold text-ink/70 uppercase tracking-widest italic">Registry 4.0</p>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-extrabold text-ink  tracking-tight uppercase leading-tight">
                Global <span className="text-primary italic">Uptime</span> Hub
              </h1>
              <p className="text-ink/60 dark:text-ink/70 text-sm font-medium leading-relaxed max-w-sm italic">
                Initialize session to monitor and sustain mission-critical infrastructure across the global edge.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-8">
               {[
                 { label: 'Latency', val: '< 10ms' },
                 { label: 'Uptime', val: '99.99%' },
                 { label: 'Nodes', val: '50+' }
               ].map((stat, i) => (
                 <div key={i}>
                   <span className="block text-[8px] font-bold text-ink/70 uppercase tracking-widest">{stat.label}</span>
                   <span className="block text-lg font-bold text-ink  tracking-tight italic">{stat.val}</span>
                 </div>
               ))}
            </div>
            <div className="pt-6 border-t border-line dark:border-white/5">
               <p className="text-[9px] font-bold text-ink/70 uppercase tracking-widest flex items-center gap-2 italic">
                 <Shield className="size-3.5 text-emerald-500" /> SECURE HANDSHAKE ACTIVE
               </p>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="p-10 lg:p-16 flex flex-col justify-center relative">
          <div className="max-w-xs w-full mx-auto space-y-10">
            <div className="space-y-3">
              <div className="lg:hidden flex justify-center mb-6">
                <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg">
                  <Zap className="size-6 fill-white" />
                </div>
              </div>
              <h3 className="text-3xl font-extrabold text-ink  tracking-tight uppercase">
                {isLogin ? 'Grant Access' : 'Register'}
              </h3>
              <p className="text-xs font-semibold text-ink/70 italic">
                {isLogin ? 'Provide credentials for verification.' : 'Establish new observer node authorization.'}
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-500 text-[9px] font-bold uppercase tracking-widest flex items-center gap-3 italic">
                  <ShieldAlert className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-ink/70 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Mail className="size-3 text-primary" /> Identity
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl bg-base dark:bg-panel/[0.01] border border-line dark:border-white/10 text-ink  text-sm font-bold italic px-5 py-4 focus:ring-4 focus:ring-primary/5 focus:border-primary/50 outline-none transition-all placeholder:text-ink/70"
                    placeholder="ADMIN@DOMAIN.CORE"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[9px] font-bold text-ink/70 uppercase tracking-widest flex items-center gap-2">
                      <Lock className="size-3 text-primary" /> Cipher
                    </label>
                    {isLogin && (
                      <button type="button" onClick={() => navigate('/reset-password')} className="text-[8px] font-bold text-ink/70 hover:text-primary transition-colors">
                        Lost Access?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl bg-base dark:bg-panel/[0.01] border border-line dark:border-white/10 text-ink  text-sm font-bold italic px-5 py-4 focus:ring-4 focus:ring-primary/5 focus:border-primary/50 outline-none transition-all placeholder:text-ink/70"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:translate-y-[-1px] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 group"
              >
                {loading ? <RefreshCw className="size-4 animate-spin" /> : (isLogin ? <Lock className="size-3.5" /> : <UserPlus className="size-3.5" />)}
                {loading ? 'Processing...' : (isLogin ? 'Verify Access' : 'Register')}
                {!loading && <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

            <div className="pt-6 border-t border-line dark:border-white/5 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-[9px] font-bold uppercase tracking-widest text-ink/70 hover:text-primary transition-all italic"
              >
                {isLogin ? "Request New Registration" : 'Existing Observer Credentials'}
              </button>
            </div>
            
            <div className="pt-8 text-center">
               <div className="flex items-center justify-center gap-3 text-ink/80 /5">
                 <Globe className="size-3.5" />
                 <span className="text-[7px] font-bold uppercase tracking-widest text-ink/70 dark:text-ink/60">Secure Node Matrix</span>
                 <Activity className="size-3.5" />
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
