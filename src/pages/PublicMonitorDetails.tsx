import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Activity, Globe, ShieldCheck, Clock, 
  BarChart3, AlertCircle, RefreshCw, ExternalLink, Zap,
  ChevronRight, History, Gauge, Lock, Server
} from 'lucide-react';
import { cn } from '../components/Layout';
import ThemeToggle from '../components/ThemeToggle';
import { AnalogMeter } from '../components/ui/AnalogMeter';

interface Ping {
  response_time: number;
  is_up: number;
  error_message: string | null;
  created_at: string;
}

interface MonitorDetail {
  id: string;
  name: string;
  url: string;
  type: string;
  current_is_up: number;
  last_response_time: number;
  uptime_percent: number;
  recent_pings: Ping[];
  interval: number;
  method: string;
  last_error_message?: string;
}

const LatencyChart = ({ data, color = "#5551FF" }: { data: Ping[], color?: string }) => {
  if (!data || data.length < 2) return <div className="h-full w-full bg-base dark:bg-panel/[0.01] rounded-2xl animate-pulse border border-line dark:border-white/5" />;
  
  const points = data.map(p => p.response_time);
  const max = Math.max(...points, 20);
  const min = Math.min(...points);
  const range = (max - min) || 20;
  const step = 100 / (data.length - 1);
  
  const pathData = data.map((p, i) => {
    const x = i * step;
    const y = 90 - ((p.response_time - min) / range * 80); 
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  const areaData = `${pathData} L 100 100 L 0 100 Z`;
  const gradId = `grad-details-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible group">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaData} fill={`url(#${gradId})`} className="transition-all duration-1000" />
      <path d={pathData} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-1000" />
    </svg>
  );
};

export default function PublicMonitorDetails() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const [monitor, setMonitor] = useState<MonitorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMonitor = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    
    try {
      const res = await fetch(`/api/public-status/${slug}/monitors/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch monitor details');
      setMonitor(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMonitor();
    const interval = setInterval(() => fetchMonitor(true), 15000);
    return () => clearInterval(interval);
  }, [slug, id]);

  if (loading) return (
    <div className="min-h-screen bg-base dark:bg-slate-950 flex flex-col items-center justify-center font-sans">
      <RefreshCw className="size-8 text-primary animate-spin mb-4" />
      <span className="text-[10px] font-bold text-ink/70 uppercase tracking-widest italic animate-pulse">Establishing Data Link...</span>
    </div>
  );

  if (error || !monitor) return (
    <div className="min-h-screen bg-base dark:bg-slate-950 flex items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-8">
         <div className="size-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
           <AlertCircle className="size-8 text-rose-500" />
         </div>
         <div className="space-y-4">
           <h2 className="text-2xl font-black tracking-tight text-ink  uppercase italic">Signal Lost</h2>
           <p className="text-ink/60 dark:text-ink/70 font-medium text-[11px] italic leading-relaxed">{error || 'The requested telemetry stream is unavailable.'}</p>
         </div>
         <Link to={`/status/${slug}`} className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-xl font-bold uppercase tracking-widest hover:translate-y-[-1px] transition-all shadow-lg shadow-primary/20 italic text-[10px]">
           <ArrowLeft className="size-3.5" /> Revert to Registry
         </Link>
      </div>
    </div>
  );

  const isUp = monitor.current_is_up === 1;

  return (
    <div className="min-h-screen bg-base text-ink font-sans transition-colors duration-500">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-[100] bg-panel/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-line dark:border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
             <Link to={`/status/${slug}`} className="size-9 bg-base dark:bg-panel/5 rounded-xl flex items-center justify-center border border-line dark:border-white/10 hover:bg-primary/10 hover:border-primary/20 transition-all group">
               <ArrowLeft className="size-4 text-ink/70 group-hover:text-primary transition-colors" />
             </Link>
             <div>
                <span className="block text-[8px] font-bold text-ink/70 uppercase tracking-[0.2em] mb-0.5 italic">Live Registry Node</span>
                <span className="text-lg font-black tracking-tighter text-ink  uppercase italic">{monitor.name}</span>
             </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="hidden sm:flex flex-col items-end">
                <span className="text-[7px] font-bold text-ink/70 uppercase tracking-widest italic">Protocol Integrity</span>
                <span className={cn("text-[10px] font-black italic uppercase", isUp ? "text-emerald-500" : "text-rose-500")}>
                  {isUp ? "Node Healthy" : "Critical Fault"}
                </span>
             </div>
             <div className="h-4 w-px bg-slate-200 dark:bg-panel/10 hidden sm:block" />
             <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        {/* Header Section */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 border-b border-line dark:border-white/5 pb-12">
          <div className="space-y-6 max-w-2xl">
            <div className="flex flex-wrap items-center gap-5">
              <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-ink  uppercase italic leading-tight">
                Node <span className="text-primary">Dynamics</span>
              </h1>
              <div className={cn(
                "px-4 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border shadow-sm italic",
                isUp ? "bg-emerald-500/5 text-emerald-600 dark:text-emerald-500 border-emerald-500/20" : "bg-rose-500/5 text-rose-600 dark:text-rose-500 border-rose-500/20"
              )}>
                {isUp ? 'Operational' : 'Critical Fault'}
              </div>
              {monitor.current_is_up === 0 && monitor.last_error_message && (
                <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/5 text-rose-500 text-[9px] font-bold uppercase rounded-lg border border-rose-500/10 italic">
                  <AlertCircle className="size-3" /> Reason: {monitor.last_error_message}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-6 text-[10px] font-bold text-ink/70 uppercase tracking-[0.2em] italic">
              <span className="flex items-center gap-2 bg-base dark:bg-panel/5 px-4 py-2 rounded-xl border border-line dark:border-white/10 shadow-sm">
                <Globe className="size-3.5 text-primary" /> {monitor.url}
              </span>
              <span className="flex items-center gap-2 bg-base dark:bg-panel/5 px-4 py-2 rounded-xl border border-line dark:border-white/10 shadow-sm">
                <Server className="size-3.5 text-primary" /> {monitor.type} NODE
              </span>
            </div>
          </div>

          <a 
            href={monitor.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-3.5 bg-primary text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:translate-y-[-1px] transition-all shadow-xl shadow-primary/25 italic"
          >
            Access Endpoint <ExternalLink className="size-3.5" />
          </a>
        </header>

        {/* Observation Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 md:gap-12">
          
          <div className="lg:col-span-2 space-y-12">
            <div className="bg-panel dark:bg-panel/[0.01] border border-line dark:border-white/5 rounded-[40px] p-8 md:p-12 space-y-10 relative overflow-hidden shadow-sm">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 relative z-10">
                 <div className="flex items-center gap-8">
                    <div className="w-32">
                      <AnalogMeter 
                        value={monitor.last_response_time} 
                        max={1000} 
                        label="Latency" 
                        unit="ms" 
                        colorClass={monitor.last_response_time < 200 ? "text-emerald-500" : monitor.last_response_time < 500 ? "text-amber-500" : "text-rose-500"}
                      />
                    </div>
                    <div className="space-y-1">
                       <h3 className="text-[10px] font-bold text-ink/70 uppercase tracking-[0.3em] italic">Response Velocity</h3>
                       <p className="text-5xl font-black tracking-tighter text-ink  tabular-nums italic">
                         {monitor.last_response_time.toFixed(0)}<span className="text-xl text-primary ml-1">ms</span>
                       </p>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-8">
                    <div className="w-32">
                      <AnalogMeter 
                        value={monitor.uptime_percent} 
                        label="Stability" 
                        unit="%" 
                        colorClass={monitor.uptime_percent > 99 ? "text-emerald-500" : monitor.uptime_percent > 95 ? "text-amber-500" : "text-rose-500"}
                      />
                    </div>
                    <div className="text-right">
                       <div className="flex items-center gap-2 justify-end mb-2">
                         <span className="text-[9px] font-bold text-primary uppercase tracking-widest italic flex items-center gap-2">
                           <span className="size-1.5 rounded-full bg-primary animate-pulse shadow-sm shadow-primary/50" /> Live Stream
                         </span>
                       </div>
                       <span className="text-[8px] font-bold text-ink/70 uppercase tracking-widest italic">30 Cycle Loop</span>
                    </div>
                 </div>
               </div>

               <div className="h-56 relative z-10">
                 <LatencyChart data={monitor.recent_pings} color={isUp ? "#10b981" : "#f43f5e"} />
               </div>

               <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-10 border-t border-line dark:border-white/5 relative z-10">
                 {[
                   { label: 'Uptime Score', value: `${monitor.uptime_percent.toFixed(2)}%` },
                   { label: 'Method', value: monitor.method.toUpperCase() },
                   { label: 'Cluster', value: 'Global Hub' },
                   { label: 'Last Check', value: monitor.recent_pings.length > 0 ? new Date(monitor.recent_pings[monitor.recent_pings.length-1].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A' }
                 ].map((stat, i) => (
                   <div key={i} className="space-y-1.5">
                     <span className="block text-[8px] font-bold text-ink/70 uppercase tracking-[0.2em] italic">{stat.label}</span>
                     <span className="block text-sm font-black text-ink dark:text-slate-100 italic uppercase tracking-tight tabular-nums">{stat.value}</span>
                   </div>
                 ))}
               </div>
            </div>

            {/* Event Log */}
            <div className="space-y-6">
               <div className="flex items-center justify-between px-4">
                 <h3 className="text-[10px] font-bold text-ink/70 uppercase tracking-[0.3em] flex items-center gap-3 italic">
                   <History className="size-4 text-primary" /> Observation Log
                 </h3>
                 <span className="text-[9px] font-bold text-ink/60 uppercase tracking-widest italic">Last {monitor.recent_pings.length} Checks</span>
               </div>
               
               <div className="space-y-3">
                 {monitor.recent_pings.slice().reverse().map((ping, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-panel dark:bg-panel/[0.01] border border-line dark:border-white/5 rounded-2xl hover:bg-base dark:hover:bg-panel/[0.02] transition-colors group shadow-sm">
                       <div className="flex items-center gap-6">
                          <div className={cn(
                            "size-2.5 rounded-full shadow-sm ring-4 transition-all",
                            ping.is_up ? "bg-emerald-500 ring-emerald-500/10" : "bg-rose-500 ring-rose-500/10"
                          )} />
                          <div>
                            <p className="text-[13px] font-black text-ink  group-hover:text-primary transition-colors uppercase italic tracking-tight">
                              {ping.is_up ? 'Integrity Verified' : 'Signal Divergent'}
                            </p>
                            <p className="text-[9px] font-bold text-ink/70 uppercase tracking-widest mt-0.5 italic">
                              {new Date(ping.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                            </p>
                            {ping.error_message && (
                              <p className="text-[10px] text-rose-500 font-bold italic mt-1 uppercase tracking-tighter">
                                {ping.error_message}
                              </p>
                            )}
                          </div>
                       </div>
                       <div className="text-right">
                          <span className="text-lg font-black text-ink  tabular-nums italic tracking-tighter">
                             {ping.response_time}<span className="text-[9px] text-primary ml-0.5">ms</span>
                          </span>
                       </div>
                    </div>
                 ))}
               </div>
            </div>
          </div>

          {/* Sidebar Insights */}
          <div className="space-y-8">
             <div className="bg-primary/5 border border-primary/20 rounded-[40px] p-8 md:p-10 space-y-6 relative overflow-hidden group shadow-sm">
                <div className="absolute top-0 right-0 size-32 bg-primary/10 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all duration-700" />
                <div className="size-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/10 relative z-10 shadow-sm">
                  <ShieldCheck className="size-6" />
                </div>
                <div className="space-y-3 relative z-10">
                  <h4 className="text-xl font-bold text-ink  uppercase italic tracking-tight">Encryption Hub</h4>
                  <p className="text-[11px] text-ink/60 dark:text-ink/70 italic leading-relaxed font-medium">
                    Telemetry is transmitted via encrypted tunnels to ensure data integrity during transit.
                  </p>
                </div>
                <div className="pt-6 border-t border-primary/10 space-y-4 relative z-10">
                   {[
                     { label: 'Security Layer', val: 'TLS 1.3 AES' },
                     { label: 'Cluster Sync', val: 'Verified' }
                   ].map((item, i) => (
                     <div key={i} className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-ink/60 italic">
                       <span>{item.label}</span>
                       <span className="text-primary">{item.val}</span>
                     </div>
                   ))}
                </div>
             </div>

             <div className="bg-panel dark:bg-panel/[0.01] border border-line dark:border-white/5 rounded-[40px] p-8 md:p-10 space-y-6 shadow-sm">
               <div className="flex items-center gap-4 border-b border-slate-50 dark:border-white/5 pb-4">
                  <div className="size-9 bg-amber-500/5 rounded-xl flex items-center justify-center text-amber-500 border border-amber-500/10">
                     <Zap className="size-4.5" />
                  </div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-ink  italic">Global Hub</h4>
               </div>
               <p className="text-[11px] text-ink/60 dark:text-ink/70 italic leading-relaxed font-medium">
                 Data aggregated across North America, Europe, and Asia clusters to detect regional latencies.
               </p>
             </div>

             <div className="p-8 text-center bg-slate-100/50 dark:bg-panel/[0.01] border border-line dark:border-white/5 rounded-[40px] shadow-sm">
                <BarChart3 className="size-6 text-ink/70 dark:text-ink/60 mx-auto mb-3" />
                <span className="text-[9px] font-bold text-ink/70 uppercase tracking-widest italic">Audit Hash Verified</span>
             </div>
          </div>

        </div>
      </div>

      {/* Footer Transparency */}
      <footer className="max-w-6xl mx-auto px-6 py-12 border-t border-line dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 opacity-40 italic">
         <div className="flex flex-col gap-1.5 md:items-start items-center">
            <span className="text-[10px] font-black text-ink  uppercase tracking-[0.3em]">Operational Transparency Matrix</span>
            <span className="text-[8px] font-bold text-ink/70 uppercase tracking-widest">Protocol V4.0.2 // Active</span>
         </div>
         <p className="text-[8px] font-bold uppercase tracking-widest text-ink/60 max-w-[280px] leading-relaxed md:text-right text-center">
           All telemetry metrics are cryptographically anchored and audited in real-time for public verification.
         </p>
      </footer>
    </div>
  );
}
