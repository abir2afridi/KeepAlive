import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Activity, CheckCircle2, CloudCog, ShieldAlert } from 'lucide-react';
import { cn } from '../components/Layout';
import ThemeToggle from '../components/ThemeToggle';

interface Monitor {
  id: string;
  name: string;
  url: string;
  type: string;
  current_is_up: number | null;
  uptime_percent: number | null;
  recent_pings: { response_time: number; is_up: number; created_at: string }[];
}

export default function StatusPage() {
  const { slug } = useParams<{ slug: string }>();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/public-status/${slug}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load status page');
        }
        
        setMonitors(data.monitors || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center font-mono text-slate-400">
        <Activity className="size-5 animate-pulse mr-2" /> Loading status...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background-dark flex items-center justify-center font-sans">
        <div className="text-center bg-white dark:bg-panel/50 backdrop-blur-xl p-10 rounded-3xl border border-line shadow-xl">
          <ShieldAlert className="size-16 text-rose-500 mx-auto mb-6 drop-shadow-md" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3 tracking-tight">Status Page Not Found</h1>
          <p className="text-slate-500 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const allOperational = monitors.every(m => m.current_is_up !== 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background-dark font-sans text-slate-800 dark:text-slate-300 selection:bg-primary/30">
      {/* Header */}
      <header className="border-b border-line bg-white/80 dark:bg-panel/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
              <CloudCog className="size-6 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-slate-100">
              Service Status
            </span>
          </div>
          <div className="flex z-50 items-center justify-center gap-4">
             <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-line/50 shadow-sm hidden sm:block">Powered by KeepAlive</span>
             <div className="border-l border-line/50 pl-4">
               <ThemeToggle />
             </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto p-6 space-y-8 mt-6 pb-20">
        {/* Global status banner */}
        <div className={cn(
          "p-8 rounded-3xl border shadow-sm flex flex-col md:flex-row items-center gap-6 transition-all duration-500 relative overflow-hidden group",
          allOperational 
            ? "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
            : "bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
        )}>
          <div className={cn(
            "absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 -mr-20 -mt-20 pointer-events-none transition-transform duration-1000 group-hover:scale-110",
            allOperational ? "bg-emerald-500" : "bg-rose-500"
          )} />
          <div className={cn(
            "p-4 rounded-2xl shadow-inner",
            allOperational ? "bg-emerald-100 dark:bg-emerald-950/50" : "bg-rose-100 dark:bg-rose-950/50"
          )}>
            {allOperational ? (
              <CheckCircle2 className="size-10 text-emerald-500 dark:text-emerald-400 drop-shadow-md" />
            ) : (
              <ShieldAlert className="size-10 text-rose-500 dark:text-rose-400 drop-shadow-md animate-pulse" />
            )}
          </div>
          <div className="text-center md:text-left z-10">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
              {allOperational ? 'All Systems Operational' : 'Some Systems Are Experiencing Issues'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium text-lg">
              {allOperational ? 'Everything is functioning as expected.' : 'We are currently investigating issues with one or more services.'}
            </p>
          </div>
        </div>

        {/* Services List */}
        <div className="bg-white/60 dark:bg-panel/60 backdrop-blur-xl rounded-3xl border border-line shadow-sm overflow-hidden">
          {monitors.map((monitor, index) => (
            <div key={monitor.id} className={cn("p-8 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/20 group/row", index !== monitors.length - 1 && "border-b border-line/50")}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div className="flex flex-col gap-1">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xl tracking-tight flex items-center gap-3">
                    {monitor.name}
                  </h3>
                  <a href={monitor.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors w-fit underline-offset-4 hover:underline">
                    {monitor.url}
                  </a>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                  <div className={cn(
                    "flex items-center gap-2 font-bold text-xs uppercase tracking-widest px-3.5 py-1.5 rounded-full shadow-sm",
                    monitor.current_is_up === 1 ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20" :
                    monitor.current_is_up === 0 ? "bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20" :
                    "bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20"
                  )}>
                    <div className={cn(
                      "size-2 rounded-full",
                      monitor.current_is_up === 1 ? "bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                      monitor.current_is_up === 0 ? "bg-rose-500 dark:bg-rose-400 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]" :
                      "bg-slate-500 dark:bg-slate-400"
                    )} />
                    {monitor.current_is_up === 1 ? 'Operational' :
                     monitor.current_is_up === 0 ? 'Down' : 'Unknown'}
                  </div>
                  <div className="text-sm font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-3 py-1 rounded-lg border border-line/50">
                    <span className="text-slate-800 dark:text-slate-300">{monitor.uptime_percent ? Number(monitor.uptime_percent).toFixed(2) : '0.00'}%</span> uptime
                  </div>
                </div>
              </div>
              
              {/* Ping Bars */}
              <div className="mt-8 flex items-end gap-1 h-12 w-full bg-slate-100 dark:bg-background-dark/50 p-1.5 rounded-xl border border-line/30 shadow-inner group-hover/row:border-line transition-colors">
                {/* Pad with empty bars if < 10 pings */}
                {Array.from({ length: Math.max(0, 50 - (monitor.recent_pings?.length || 0)) }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex-1 bg-slate-200 dark:bg-line rounded-sm h-full opacity-20" />
                ))}
                {monitor.recent_pings && monitor.recent_pings.map((ping, i) => (
                  <div
                    key={i}
                    title={`${ping.response_time}ms at ${new Date(ping.created_at).toLocaleString()}`}
                    className={cn(
                      "flex-1 rounded-sm w-full transition-all duration-300 hover:opacity-100 opacity-80 cursor-ns-resize hover:scale-y-110",
                      ping.is_up === 1 ? "bg-emerald-500" : "bg-rose-500"
                    )}
                    style={{
                      height: ping.is_up === 1 ? `${Math.max(15, Math.min(100, 100 - (ping.response_time / 10)))}%` : '100%'
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-3 font-semibold text-[10px] uppercase tracking-widest text-slate-400">
                <span>Older</span>
                <span>Recent</span>
              </div>
            </div>
          ))}

          {monitors.length === 0 && (
            <div className="p-12 text-center text-slate-500 font-mono">
              No monitors configured for this status page.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
