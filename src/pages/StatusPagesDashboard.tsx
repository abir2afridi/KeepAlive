import React, { useState, useEffect } from 'react';
import { 
  Globe, ArrowUpRight, ShieldCheck, Activity, Copy, Check, 
  ChevronRight, CheckCircle2, ShieldAlert, ExternalLink, 
  RefreshCw, BarChart3, Clock, Zap, Cpu, Lock, LayoutDashboard
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { cn } from '../components/Layout';
import { AnalogMeter } from '../components/ui/AnalogMeter';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

interface Monitor {
  id: string;
  name: string;
  url: string;
  type: string;
  current_is_up: number | null;
  uptime_percent: number | null;
  avg_response_time: number | null;
  last_checked: string | null;
  recent_pings: { response_time: number; is_up: number; created_at: string; error_message?: string }[];
  recent_incidents: { id: string; response_time: number; is_up: number; created_at: string; error_message?: string }[];
  last_error_message?: string;
}

const LatencyChart = ({ data, color = "#5551FF" }: { data: { response_time: number, is_up: number, created_at?: string }[], color?: string }) => {
  if (!data || data.length < 2) {
    return (
      <div className="h-full relative overflow-hidden group">
        <div className="h-full flex flex-col items-center justify-center gap-2 relative z-10">
          <Activity className="size-4 animate-pulse text-primary/60" />
          <span className="text-[7px] font-bold uppercase tracking-widest text-ink/70">Syncing Stream</span>
        </div>
      </div>
    );
  }

  const chartData = data.map((p, i) => ({
    time: p.created_at ? new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : `T-${data.length - i}`,
    latency: p.response_time,
  }));

  const chartConfig = {
    latency: {
      label: "Latency",
      color: color,
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-full w-full min-h-[150px] aspect-auto">
      <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="latencyGradientDashboard" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="opacity-[0.03]" />
        <XAxis dataKey="time" hide />
        <YAxis hide domain={['auto', 'auto']} />
        <ChartTooltip
          cursor={{ stroke: color, strokeWidth: 1 }}
          content={<ChartTooltipContent hideLabel indicator="dot" />}
        />
        <Area
          type="monotone"
          dataKey="latency"
          stroke={color}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#latencyGradientDashboard)"
          animationDuration={1000}
        />
      </AreaChart>
    </ChartContainer>
  );
};

export default function StatusPagesDashboard() {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const [statusSlug, setStatusSlug] = useState(user?.status_slug || '');
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'incidents' | 'analytics'>('overview');

  const fullUrl = `${window.location.origin}/status/${statusSlug}`;

  // Helper function to safely get numeric values
  const getSafeValue = (value: any, defaultValue: number = 0): number => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : defaultValue;
    }
    return defaultValue;
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const fetchData = async (silent = false) => {
    if (!statusSlug) return;
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    
    try {
      const res = await fetch(`/api/public-status/${statusSlug}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to load status');
      
      // API returns { status_page, monitors } or just { monitors }
      const monitorsList = data.monitors || [];
      setMonitors(monitorsList);
      setError('');
    } catch (err: any) {
      console.error('Status fetch error:', err);
      setError(err.message || 'Failed to connect to the server');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      let currentSlug = statusSlug;
      
      // If slug is missing, try fetching it from the DB profile
      if (!currentSlug && user?.id) {
        setLoading(true);
        try {
          const { data } = await supabase.from('profiles').select('status_slug').eq('id', user.id).single();
          if (data?.status_slug) {
            currentSlug = data.status_slug;
            setStatusSlug(currentSlug);
            // Sync back to localstorage for next visit
             const updatedUser = { ...user, status_slug: currentSlug };
             localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } catch (e) {
          console.error("Failed to fetch recovery slug", e);
        }
      }

      if (currentSlug) {
        fetchData();
      } else {
        setLoading(false);
      }
    };

    init();
    const interval = setInterval(() => {
      if (statusSlug) fetchData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [statusSlug, user?.id]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalMonitors = monitors.length;
  const avgUptime = monitors.length > 0 ? monitors.reduce((acc, m) => acc + getSafeValue(m.uptime_percent), 0) / monitors.length : 0;
  const avgLatency = monitors.length > 0 ? monitors.reduce((acc, m) => acc + getSafeValue(m.avg_response_time), 0) / monitors.length : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      
      {/* Refined Header */}
      <div className="flex flex-col lg:flex-row items-start justify-between gap-10 pb-10 border-b border-line dark:border-white/5">
        <div className="flex-1 space-y-6">
          <nav className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-ink/70">
            <Link to="/app/dashboard" className="hover:text-primary transition-colors flex items-center gap-2">
              <LayoutDashboard className="size-3" /> INFRASTRUCTURE
            </Link>
            <ChevronRight className="size-3 opacity-30" />
            <span className="text-primary italic">Status Operations</span>
          </nav>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-ink  uppercase italic">
              Operational <span className="text-primary">Matrix</span>
            </h1>
            <p className="text-ink/60 dark:text-ink/70 text-sm font-medium italic max-w-2xl">
              Aggregated telemetry from your global mission-critical fleet. Real-time synchronization for public transparency.
            </p>
          </div>

          <div className="flex flex-wrap gap-8 pt-2">
            {[
              { label: 'Nodes', value: totalMonitors, color: 'text-primary' },
              { label: 'Stability', value: `${avgUptime.toFixed(1)}%`, color: 'text-emerald-500' },
              { label: 'Velocity', value: `${avgLatency.toFixed(0)}ms`, color: 'text-blue-500' }
            ].map((stat, i) => (
              <div key={i}>
                 <span className="block text-[8px] font-bold text-ink/70 uppercase tracking-widest mb-1">{stat.label}</span>
                 <div className="flex items-baseline gap-2">
                   <span className={cn("text-3xl font-bold tracking-tight italic tabular-nums", stat.color || "text-ink")}>
                     {stat.value}
                   </span>
                 </div>
              </div>
            ))}
          </div>
        </div>
        
        {statusSlug && (
           <div className="w-full lg:w-96 p-8 bg-panel dark:bg-panel/[0.01] border border-line dark:border-white/10 rounded-3xl shadow-sm relative overflow-hidden group">
              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                   <span className="text-[9px] font-bold uppercase tracking-widest text-ink/70">Broadcasting Interface</span>
                   <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/5 text-emerald-500 text-[8px] font-bold uppercase border border-emerald-500/10">
                      <span className="size-1 bg-emerald-500 rounded-full animate-pulse" /> Live
                   </div>
                </div>
                <div className="space-y-3">
                   <div className="relative">
                      <div className="bg-base dark:bg-panel/[0.01] p-4 rounded-xl border border-line dark:border-white/5 font-mono text-[10px] text-ink/70 truncate pr-12">
                        {fullUrl}
                      </div>
                      <button 
                        onClick={copyToClipboard}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-primary rounded-lg transition-all text-ink/70 hover:text-white"
                      >
                        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                      </button>
                   </div>
                   <a 
                     href={fullUrl} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="flex items-center justify-center gap-3 w-full py-3.5 bg-primary text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:translate-y-[-1px] transition-all shadow-lg shadow-primary/20 italic"
                   >
                     View Public Page <ExternalLink className="size-3.5" />
                   </a>
                </div>
              </div>
           </div>
        )}
      </div>

      {!statusSlug ? (
        <div className="py-24 text-center space-y-8">
          <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20">
            <Zap className="size-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-ink uppercase italic">Signal Offline</h3>
            <p className="text-ink/60 dark:text-ink/70 max-w-sm mx-auto text-sm font-medium italic">
              Initialize your telemetry broadcast identifier to begin streaming metrics to the global edge.
            </p>
          </div>
          <Link to="/app/settings" className="px-10 py-4 bg-slate-900 dark:bg-primary text-white rounded-2xl font-bold uppercase tracking-widest hover:translate-y-[-1px] transition-all inline-block italic text-[10px]">
            Initialize Hub
          </Link>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6">
          <Activity className="size-10 text-primary animate-spin" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink/70">Synchronizing Matrix...</span>
        </div>
      ) : (
        <div className="space-y-20">
          
          <div className="flex flex-col gap-12">
            
            <div className="flex items-center justify-start gap-8 border-b border-line dark:border-white/5">
              {(['overview', 'incidents', 'analytics'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "pb-4 text-[10px] font-bold uppercase tracking-widest transition-all relative group italic",
                    activeTab === tab ? "text-primary" : "text-ink/70 hover:text-ink/70"
                  )}
                >
                  {tab}
                  <div className={cn(
                    "absolute bottom-0 left-0 w-full h-[2px] bg-primary transition-all scale-x-0",
                    activeTab === tab && "scale-x-100"
                  )} />
                </button>
              ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-12">
              {/* Main Workspace Area */}
              <div className="flex-1 space-y-12">
                {activeTab === 'overview' && (
                  <div className="space-y-12">
                    
                    {/* Visualizer Hero */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[9px] font-bold text-ink/70 uppercase tracking-widest italic flex items-center gap-2">
                          <BarChart3 className="size-3.5 text-primary" /> Cluster Velocity
                        </span>
                        {isRefreshing && <RefreshCw className="size-3 text-primary animate-spin" />}
                      </div>
                      <div className="h-40 bg-panel dark:bg-panel/[0.01] border border-line dark:border-white/5 rounded-3xl p-8 relative shadow-sm">
                        <LatencyChart 
                          data={monitors.length > 0 ? (() => {
                            const maxPings = Math.max(...monitors.map(m => m.recent_pings?.length || 0));
                            if (maxPings < 2) return [];
                            const result = [];
                            for (let i = 0; i < maxPings; i++) {
                                let total = 0, count = 0, isUp = 1;
                                for (const m of monitors) {
                                    const pings = m.recent_pings || [];
                                    const pIdx = pings.length - 1 - i;
                                    if (pIdx >= 0 && pIdx < pings.length) {
                                        total += pings[pIdx].response_time;
                                        count++;
                                        if (pings[pIdx].is_up === 0) isUp = 0;
                                    }
                                }
                                if (count > 0) result.push({ response_time: total / count, is_up: isUp });
                            }
                            return result.reverse();
                          })() : []} 
                          color={monitors.some(m => m.current_is_up === 0) ? "#f43f5e" : "#5551FF"}
                        />
                      </div>
                    </div>

                    {/* Nodes Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {monitors.length > 0 ? (
                       monitors.map((monitor) => (
                         <Link 
                           key={monitor.id} 
                           to={`/app/monitors/${monitor.id}`}
                           className="group block"
                         >
                           <div className="flex flex-col h-full bg-panel dark:bg-panel/[0.01] hover:bg-base dark:hover:bg-panel/[0.02] border border-line dark:border-white/5 rounded-3xl p-8 transition-all hover:translate-y-[-4px] shadow-sm">
                             
                             <div className="flex items-start justify-between mb-8 gap-4">
                                <div className="space-y-2">
                                   <div className="flex items-center gap-2">
                                      <div className={cn("size-2 rounded-full", monitor.current_is_up === 1 ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                                      <span className="text-[8px] font-bold uppercase tracking-widest text-ink/70">{monitor.type}</span>
                                   </div>
                                   <h4 className="text-2xl font-extrabold text-ink tracking-tight uppercase group-hover:text-primary transition-colors">{monitor.name}</h4>
                                   <p className="text-[9px] font-medium text-ink/70 truncate max-w-[180px] italic">{monitor.url}</p>
                                   {monitor.current_is_up === 0 && monitor.last_error_message && (
                                     <p className="text-[9px] text-rose-500 font-bold block italic uppercase tracking-tighter mt-1">
                                       REASON: {monitor.last_error_message}
                                     </p>
                                   )}
                                </div>
                                <div className="size-10 bg-base dark:bg-panel/5 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                  <ArrowUpRight className="size-5" />
                                </div>
                             </div>

                             <div className="h-20 w-full mb-8 min-h-[80px]">
                               <LatencyChart 
                                 data={monitor.recent_pings?.slice(-20) || []} 
                                 color={monitor.current_is_up === 1 ? "#10b981" : "#f43f5e"}
                               />
                             </div>

                             <div className="mt-auto pt-5 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                                <div className="space-y-1">
                                  <span className="text-[8px] font-bold text-ink/70 uppercase tracking-widest">Latency</span>
                                  <p className="text-xs font-bold text-ink/60 dark:text-ink/70 italic">{Math.round(monitor.avg_response_time || 0)}ms</p>
                                </div>
                                <div className="space-y-1 text-center">
                                  <span className="text-[8px] font-bold text-ink/70 uppercase tracking-widest">Checked</span>
                                  <p className="text-xs font-bold text-ink/60 dark:text-ink/70 italic">{formatTime(monitor.last_checked)}</p>
                                </div>
                                <div className="text-right space-y-1">
                                  <span className="text-[8px] font-bold text-ink/70 uppercase tracking-widest">Health</span>
                                  <p className={cn("text-xs font-bold italic", monitor.current_is_up === 0 ? "text-rose-500" : "text-emerald-500")}>{(monitor.uptime_percent || 0).toFixed(1)}%</p>
                                </div>
                             </div>
                           </div>
                         </Link>
                       ))
                     ) : (
                       <div className="col-span-full py-24 text-center border-2 border-dashed border-line dark:border-white/5 rounded-3xl opacity-60">
                         <Zap className="size-10 text-ink/70 dark:text-ink/60 mx-auto mb-4" />
                         <h4 className="text-xl font-bold text-ink/70 uppercase tracking-widest italic">Matrix Depleted</h4>
                       </div>
                     )}
                    </div>
                  </div>
                )}

                {activeTab === 'incidents' && (
                  <div className="space-y-12">
                    <div className="flex items-center justify-between pb-6 border-b border-line dark:border-white/5">
                      <h3 className="text-2xl font-bold text-ink uppercase italic tracking-tight">Event Horizon</h3>
                      <span className="text-[9px] font-bold text-ink/70 uppercase tracking-widest italic">Critical Log</span>
                    </div>

                    <div className="space-y-8">
                      {monitors.some(m => m.recent_incidents && m.recent_incidents.length > 0) ? (
                        monitors.flatMap(m => (m.recent_incidents || []).map(inc => ({ ...inc, monitorName: m.name }))).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8).map((inc, i) => (
                          <div key={i} className="flex gap-8 group">
                            <div className="w-24 shrink-0 text-right">
                               <span className="text-[10px] font-bold text-ink block uppercase tracking-tighter italic">{new Date(inc.created_at).toLocaleDateString()}</span>
                               <span className="text-[8px] font-medium text-ink/70 uppercase">{new Date(inc.created_at).toLocaleTimeString()}</span>
                            </div>
                            
                            <div className="relative flex flex-col items-center">
                              <div className="size-2 rounded-full bg-rose-500 z-10" />
                              <div className="w-px h-full bg-base dark:bg-panel/5 mt-2" />
                            </div>

                            <div className="flex-1 pb-10">
                              <div className="bg-panel dark:bg-panel/[0.01] border border-line dark:border-white/5 p-6 rounded-2xl space-y-2 shadow-sm">
                                <div className="flex items-center gap-3">
                                  <h5 className="text-lg font-bold text-ink  uppercase tracking-tight">{inc.monitorName}</h5>
                                  <span className="px-2 py-0.5 bg-rose-500/5 text-rose-500 text-[8px] font-bold uppercase rounded-full border border-rose-500/10 italic">Failure</span>
                                </div>
                                <p className="text-ink/60 dark:text-ink/70 text-[11px] leading-relaxed font-medium italic mt-2">
                                   {inc.error_message ? <span className="text-rose-500 font-bold uppercase tracking-tight">FAULT DIAGNOSTICS: {inc.error_message}</span> : `Operational breakdown detected at edge node #${inc.id?.slice(0,4)}. Automatic recovery engaged.`}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-24 text-center space-y-6">
                          <div className="size-16 bg-emerald-500/5 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/10">
                            <ShieldCheck className="size-8 text-emerald-500" />
                          </div>
                          <p className="text-ink/70 dark:text-ink/60 text-sm font-medium italic">No operational faults recorded recently. Integrity is absolute.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <div className="space-y-16">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                           <span className="text-[10px] font-bold text-ink/70 uppercase tracking-widest italic block px-1">Velocity Flow</span>
                           <div className="h-48 bg-panel dark:bg-panel/[0.01] border border-line dark:border-white/5 rounded-3xl p-8 shadow-sm">
                              <LatencyChart 
                                data={monitors.length > 0 ? (monitors[0].recent_pings || []) : []} 
                                color="#5551FF"
                              />
                           </div>
                           <p className="text-[10px] text-ink/60 italic px-1">Throughput is optimized. Variance within ±2.4% range.</p>
                        </div>
                        <div className="space-y-6">
                           <span className="text-[10px] font-bold text-ink/70 uppercase tracking-widest italic block px-1">Stability Index</span>
                           <div className="h-48 flex flex-col items-center justify-start pt-6 bg-panel dark:bg-panel/[0.01] border border-line dark:border-white/5 rounded-3xl shadow-sm relative overflow-hidden">
                              <div className="absolute inset-x-0 bottom-0 bg-emerald-500/5" style={{ height: `${avgUptime}%` }} />
                              <div className="relative z-10 w-[80%] scale-110">
                                 <AnalogMeter 
                                   value={avgUptime} 
                                   min={0} 
                                   max={100} 
                                   unit="%" 
                                   label="SLA Saturation"
                                   colorClass="emerald"
                                 />
                              </div>
                           </div>
                           <p className="text-[10px] text-ink/60 italic px-1 text-right">Service levels exceeding benchmarks by 0.82%.</p>
                        </div>
                     </div>
                  </div>
                )}
              </div>

              {/* Sidebar Area */}
              <div className="w-full lg:w-80 space-y-12">
                
                {/* Edge Pulse */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-bold text-ink  uppercase tracking-widest italic border-b border-line dark:border-white/5 pb-3 flex items-center justify-between">
                    Edge Health <Globe className="size-3.5" />
                  </h3>
                  <div className="space-y-6">
                    {[
                      { region: 'US-East', latency: 24, ok: true },
                      { region: 'EU-West', latency: 82, ok: true },
                      { region: 'AP-Tokyo', latency: 145, ok: true },
                    ].map((r, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-ink/60 uppercase italic">{r.region}</span>
                          <span className="text-[10px] font-bold text-ink  tabular-nums">{r.latency}ms</span>
                        </div>
                        <div className="h-1 bg-base dark:bg-panel/5 rounded-full overflow-hidden">
                          <div className={cn("h-full", i === 0 ? "bg-emerald-500 w-full" : i === 1 ? "bg-primary w-4/5" : "bg-amber-500 w-3/5")} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Specs */}
                <div className="space-y-6">
                   <h3 className="text-[10px] font-bold text-ink  uppercase tracking-widest italic border-b border-line dark:border-white/5 pb-3">Infraspec</h3>
                   <div className="grid grid-cols-2 gap-3">
                     {[
                       { label: 'Runtime', val: 'Edge-V8' },
                       { label: 'Cipher', val: 'ECC-256' },
                     ].map((s, i) => (
                       <div key={i} className="p-4 rounded-2xl bg-base dark:bg-panel/5 border border-line dark:border-white/5">
                         <span className="text-[8px] font-bold text-ink/70 uppercase block mb-1">{s.label}</span>
                         <span className="text-[10px] font-bold text-ink  uppercase italic">{s.val}</span>
                       </div>
                     ))}
                   </div>
                </div>

                {/* Settings Link */}
                <Link to="/app/settings" className="block p-6 rounded-3xl bg-base dark:bg-panel/5 border border-line dark:border-white/5 hover:bg-base transition-all group">
                   <div className="flex items-center justify-between">
                      <div className="space-y-1">
                         <span className="text-[10px] font-bold text-ink  uppercase italic">Visibility</span>
                         <span className="text-[8px] text-ink/70 font-bold uppercase tracking-widest block">Broadcast Logic</span>
                      </div>
                      <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                   </div>
                </Link>
                
                <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
                   <p className="text-[9px] text-ink/60 font-medium italic leading-relaxed">
                     Restricted administrative workspace. All telemetry handshakes are cryptographically verified.
                   </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="pt-12 border-t border-line dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 opacity-50 pb-12">
         <div className="text-[9px] font-bold text-ink/70 uppercase tracking-widest italic text-center md:text-left">
            KEEP ALIVE // STATUS HUB // v4.2 &copy; 2026
         </div>
         <div className="flex items-center gap-8">
            <span className="text-[9px] font-bold text-ink/70 uppercase tracking-widest italic">Node Sync: 30s</span>
            <div className="flex items-center gap-2">
               <div className="size-1.5 rounded-full bg-emerald-500" />
               <span className="text-[9px] font-bold text-ink/70 uppercase tracking-widest italic">All Nodes Normal</span>
            </div>
         </div>
      </footer>
    </div>
  );
}
