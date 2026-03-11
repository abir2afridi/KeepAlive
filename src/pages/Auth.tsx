import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, Shield, Lock, Mail, UserPlus, 
  ArrowRight, Fingerprint, Activity, 
  RefreshCw, Globe, ShieldAlert, CheckCircle2
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { cn } from '../components/Layout';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  getIdToken,
  signInWithPopup
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }

      const token = await getIdToken(userCredential.user);
      
      // Sync with backend to ensure Firestore profile exists and get metadata (plan, etc)
      const res = await fetch('/auth/sync', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Identity synchronization failed');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/app/dashboard');
    } catch (err: any) {
      console.error('Auth sequence error:', err);
      // Simplify Firebase error messages
      let msg = err.message;
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid credentials';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Email already exists';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const token = await getIdToken(userCredential.user);
      console.log('Acquired ID Token, syncing with backend...');
      
      const res = await fetch('/auth/sync', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('Backend sync failed:', data);
        throw new Error(data.details || data.error || 'Identity synchronization failed');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/app/dashboard');
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      setError(err.message || 'Verification cancelled');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-base text-ink font-sans relative overflow-x-hidden transition-colors duration-1000">
      
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
      <div className="flex-1 flex flex-col justify-center px-8 py-16 lg:px-24 lg:py-24 relative bg-base dark:bg-base/95 overflow-y-auto">
        <div className="max-w-sm w-full mx-auto space-y-12">
          <div className="space-y-4 text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-10">
              <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/40">
                <Zap className="size-8 fill-white" />
              </div>
            </div>
            <h3 className="text-4xl font-black text-ink tracking-tight uppercase">
              {isLogin ? 'Grant Access' : 'Create Node'}
            </h3>
            <p className="text-sm font-bold text-ink/60 italic">
              {isLogin ? 'Provide observer credentials for identity verification.' : 'Establish new command center authorization.'}
            </p>
          </div>

          <form className="space-y-7" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-4 italic animate-in fade-in slide-in-from-top-2">
                <ShieldAlert className="size-5 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-ink/50 uppercase tracking-[0.2em] ml-1 flex items-center gap-2.5">
                  <Mail className="size-3.5 text-primary" /> Global Identity
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-[24px] bg-panel/50 dark:bg-panel/[0.02] border border-line dark:border-white/5 text-ink text-sm font-black italic px-6 py-4.5 focus:ring-[6px] focus:ring-primary/10 focus:border-primary/50 outline-none transition-all placeholder:text-ink/30 dark:placeholder:text-ink/10"
                  placeholder="ADMIN@DOMAIN.CORE"
                />
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-ink/50 uppercase tracking-[0.2em] flex items-center gap-2.5">
                    <Lock className="size-3.5 text-primary" /> Access Cipher
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
                  className="w-full rounded-[24px] bg-panel/50 dark:bg-panel/[0.02] border border-line dark:border-white/5 text-ink text-sm font-black italic px-6 py-4.5 focus:ring-[6px] focus:ring-primary/10 focus:border-primary/50 outline-none transition-all placeholder:text-ink/30 dark:placeholder:text-ink/10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="space-y-6 pt-2">
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-5 bg-primary text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] hover:translate-y-[-2px] hover:shadow-2xl hover:shadow-primary/40 transition-all active:scale-[0.98] flex items-center justify-center gap-4 group disabled:opacity-50"
              >
                {loading ? <RefreshCw className="size-5 animate-spin" /> : (isLogin ? <Fingerprint className="size-5" /> : <UserPlus className="size-5" />)}
                {loading ? 'AUTHENTICATING...' : (isLogin ? 'VERIFY ACCESS' : 'AUTHORIZE NODE')}
                {!loading && <ArrowRight className="size-4 group-hover:translate-x-1.5 transition-transform" />}
              </button>

              <div className="relative py-2 flex items-center gap-6">
                <div className="flex-1 h-[1px] bg-line dark:bg-white/5" />
                <span className="text-[9px] font-black text-ink/30 uppercase tracking-[0.3em] italic">Or Interlink</span>
                <div className="flex-1 h-[1px] bg-line dark:bg-white/5" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading}
                className="w-full py-4.5 bg-panel/50 dark:bg-panel/[0.04] border border-line dark:border-white/10 text-ink rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white dark:hover:bg-white/5 hover:shadow-xl transition-all flex items-center justify-center gap-4 disabled:opacity-50 border-dashed"
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

          <div className="pt-10 border-t border-line dark:border-white/5 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/40 hover:text-primary transition-all italic border-b border-transparent hover:border-primary/30 pb-1"
            >
              {isLogin ? "Request New Registration" : 'Existing Observer Credentials'}
            </button>
          </div>
          
          <div className="pt-6">
             <div className="flex items-center justify-center gap-6 text-ink/20">
               <Globe className="size-4 animate-spin-slow" />
               <span className="text-[8px] font-black uppercase tracking-[0.4em] text-ink/30 dark:text-ink/20">Secure Data Mesh active</span>
               <CheckCircle2 className="size-4" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
