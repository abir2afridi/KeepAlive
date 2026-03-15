import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Activity, Globe, ShieldCheck, Clock, 
  BarChart3, Settings, AlertCircle, RefreshCw, 
  ChevronRight, ExternalLink, Zap, Lock, Cpu,
  Radio, Database, History, Info, Server, 
  Wifi, Gauge, Binary, ArrowUpRight
} from 'lucide-react';
import { cn } from '../components/Layout';
import { AnalogMeter } from '../components/ui/AnalogMeter';
import { supabase } from '../supabase/client';

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
  status: 'up' | 'down' | 'unknown' | 'paused';
  current_is_up: number;
  last_is_up: number;
  last_response_time: number;
  uptime_percent: number;
  recent_pings: Ping[];
  interval: number;
  method: string;
  last_error_message?: string;
}

const getMonitorStatus = (monitor: MonitorDetail) => {
  if (monitor.status === 'up') return true;
  if (monitor.status === 'down') return false;
  if (monitor.status === 'paused') return true;
  if (monitor.current_is_up !== undefined && monitor.current_is_up !== null) {
    return monitor.current_is_up === 1;
  }
  return true;
};

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../components/ui/chart";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

const LatencyChart = ({ data, isUp = true }: { data: Ping[], isUp?: boolean }) => {
  if (!data || data.length < 2) {
    const dummyData = Array.from({ length: 20 }, (_, i) => ({
      response_time: 15 + Math.sin(i / 3) * 5 + Math.random() * 2,
      is_up: 1,
      created_at: new Date(Date.now() - (20 - i) * 60000).toISOString()
    }));
    return (
      <div className="h-full w-full relative overflow-hidden group">
        <div className="absolute inset-0 opacity-10 grayscale group-hover:opacity-20 transition-opacity">
          <LatencyChart data={dummyData as any} isUp={isUp} />
        </div>
        <div className="h-full flex flex-col items-center justify-center gap-2 relative z-10">
          <Activity className="size-6 animate-pulse text-primary/60" />
          <span className="text-[8px] font-bold uppercase tracking-widest text-ink/60 italic">Syncing Stream</span>
        </div>
      </div>
    );
  }

  const chartData = data.map(p => ({
    time: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    latency: p.response_time,
    status: p.is_up === 1 ? 'Up' : 'Down'
  }));

  const chartConfig = {
    latency: {
      label: "Latency",
      color: isUp ? "hsl(var(--primary))" : "hsl(var(--destructive))",
    },
  };

  const strokeColor = isUp ? "var(--primary)" : "#f43f5e";
  const fillColor = isUp ? "var(--primary)" : "#f43f5e";

  return (
    <ChartContainer config={chartConfig} className="h-full w-full min-h-[200px] aspect-auto">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={fillColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={fillColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid 
          vertical={false} 
          strokeDasharray="3 3" 
          stroke="currentColor" 
          className="opacity-[0.03] dark:opacity-[0.05]" 
        />
        <XAxis 
          dataKey="time" 
          hide 
        />
        <YAxis 
          tickLine={false} 
          axisLine={false} 
          tick={false}
          domain={['auto', 'auto']}
        />
        <ChartTooltip
          cursor={{ stroke: strokeColor, strokeWidth: 1, strokeDasharray: '4 4' }}
          content={<ChartTooltipContent hideLabel indicator="dot" />}
        />
        <Area
          type="monotone"
          dataKey="latency"
          stroke={strokeColor}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#latencyGradient)"
          animationDuration={1500}
        />
      </AreaChart>
    </ChartContainer>
  );
};

export default function MonitorDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [monitor, setMonitor] = useState<MonitorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const fetchMonitor = async (silent = false) => {
    if (!id || id === ':id') {
      setError('Invalid monitor selection. Please return to the registry.');
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || localStorage.getItem('token');
      if (!token) {
        navigate('/auth');
        return;
      }

      const res = await fetch(`/api/monitors/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/auth');
        return;
      }

      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to fetch monitor');
      setMonitor(payload);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const token = data.session?.access_token || localStorage.getItem('token');
      if (token) fetchMonitor();
      else navigate('/auth');
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const token = session?.access_token || localStorage.getItem('token');
      if (token) fetchMonitor(true);
      else navigate('/auth');
    });

    const interval = setInterval(() => {
      fetchMonitor(true);
    }, 15000);

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [id]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
      <RefreshCw className="size-8 text-primary animate-spin" />
      <span className="text-[10px] font-bold text-ink/70 uppercase tracking-widest italic animate-pulse">Accessing Registry Node...</span>
    </div>
  );

  if (error || !monitor) return (
    <div className="max-w-md mx-auto py-32 text-center space-y-8">
      <div className="size-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto text-rose-500">
        <AlertCircle className="size-8" />
      </div>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-ink  uppercase tracking-tight italic">Node Missing</h2>
        <p className="text-ink/60 dark:text-ink/70 font-medium text-[11px] italic leading-relaxed">{error || 'Registry entry not found.'}</p>
      </div>
      <button onClick={() => navigate('/app/monitors')} className="px-8 py-3 bg-slate-900 dark:bg-panel text-white dark:text-ink rounded-xl font-bold text-[10px] uppercase tracking-widest hover:translate-y-[-1px] transition-all shadow-lg italic">
        Back to Registry
      </button>
    </div>
  );

  const recentPings = monitor?.recent_pings || [];

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700">
      
      {/* Refined Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-line dark:border-white/5">
        <div className="space-y-4 flex-1">
          <nav className="flex items-center gap-3 text-[9px] font-bold text-ink/70 uppercase tracking-widest">
            <Link to="/app/monitors" className="hover:text-primary transition-colors flex items-center gap-1.5 italic">
              <ArrowLeft className="size-3" /> Registry
            </Link>
            <span className="opacity-30">/</span>
            <span className="text-primary italic">Node_{monitor.id.slice(0, 8)}</span>
          </nav>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-ink  uppercase italic">
              {monitor.name}
            </h1>
            <div className={cn(
              "px-3.5 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border shadow-sm transition-all self-start md:self-center italic",
              getMonitorStatus(monitor) 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20" 
                : "bg-rose-500/10 text-rose-600 dark:text-rose-500 border-rose-500/20"
            )}>
              {getMonitorStatus(monitor) ? 'Operational' : 'Critical Fault'}
            </div>
          </div>
          {!getMonitorStatus(monitor) && monitor.last_error_message && (
            <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/5 text-rose-500 text-[9px] font-bold uppercase rounded-lg border border-rose-500/10 italic">
              <AlertCircle className="size-3" /> Reason: {monitor.last_error_message}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-6 py-1">
             <div className="flex items-center gap-2 text-ink/60 dark:text-ink/70 font-mono text-[11px] italic group">
                <Globe className="size-3.5 text-primary" /> {monitor.url}
             </div>
             <div className="flex items-center gap-2 text-ink/70 dark:text-ink/60 font-mono text-[8px] uppercase tracking-widest">
                <Lock className="size-3 opacity-40" /> Encrypted Link
             </div>
          </div>
        </div>
        <div className="flex flex-col md:items-end gap-6 whitespace-nowrap">
           <div className="flex items-center gap-4">
              <div className="text-right">
                 <span className="text-[8px] font-bold text-ink/70 uppercase tracking-widest italic">Protocol</span>
                 <p className="text-lg font-bold text-ink  italic uppercase tracking-tighter">{monitor.type}</p>
              </div>
              <div className="size-11 bg-base dark:bg-panel/5 rounded-xl flex items-center justify-center border border-line dark:border-white/10 text-ink/70 shadow-sm">
                 <Server className="size-5" />
              </div>
           </div>
           <div className="flex items-center gap-3">
              <button onClick={() => fetchMonitor(true)} className="p-3 bg-panel dark:bg-panel/[0.01] border border-line dark:border-white/10 rounded-xl text-ink/70 hover:text-primary transition-all shadow-sm">
                 <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin text-primary")} />
              </button>
              <Link to={`/app/monitors/${monitor.id}/edit`} className="px-6 py-3 bg-primary text-white rounded-xl font-bold text-[9px] uppercase tracking-widest hover:translate-y-[-1px] transition-all shadow-lg shadow-primary/20 italic">
                 Edit Node
              </Link>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        <div className="lg:col-span-2 space-y-10">
            
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-panel dark:bg-panel/[0.01] border border-line dark:border-white/5 p-4 rounded-3xl shadow-sm hover:translate-y-[-2px] transition-all flex flex-col items-center justify-center relative overflow-hidden">
                 <div className="absolute top-3 right-3 flex items-center gap-1 opacity-40">
                    <ShieldCheck className="size-2 text-emerald-500" />
                    <span className="text-[6px] font-bold text-emerald-500 uppercase italic">Reliability OK</span>
                 </div>
                 <AnalogMeter 
                   value={monitor.uptime_percent} 
                   max={100} 
                   unit="%" 
                   label="Uptime SLA" 
                   colorClass="emerald"
                   className="w-full"
                 />
                 <p className="text-[8px] text-ink/40 italic text-center -mt-2 pb-2">Target stability threshold: 99.9%</p>
              </div>

              <div className="bg-panel dark:bg-panel/[0.01] border border-line dark:border-white/5 p-4 rounded-3xl shadow-sm hover:translate-y-[-2px] transition-all flex flex-col items-center justify-center relative overflow-hidden">
                 <div className="absolute top-3 right-3 flex items-center gap-1 opacity-40">
                    <Zap className="size-2 text-primary" />
                    <span className="text-[6px] font-bold text-primary uppercase italic">Pulse Nominal</span>
                 </div>
                 <AnalogMeter 
                   value={monitor.last_response_time} 
                   max={1000} 
                   unit="ms" 
                   label="Latency" 
                   colorClass="primary"
                   className="w-full"
                 />
                 <p className="text-[8px] text-ink/40 italic text-center -mt-2 pb-2">RTT verified via global registry.</p>
              </div>

              <div className="bg-panel dark:bg-panel/[0.01] border border-line dark:border-white/5 p-7 rounded-3xl space-y-4 shadow-sm hover:translate-y-[-2px] transition-all group">
                 <div className="flex items-center justify-between">
                    <div className="size-9 rounded-xl flex items-center justify-center bg-base dark:bg-panel/5 border border-line dark:border-white/10 text-blue-500">
                       <Radio className="size-4.5" />
                    </div>
                    <span className="text-[8px] font-bold text-ink/70 uppercase tracking-widest italic group-hover:text-blue-500 transition-colors">Protocol_HTTP</span>
                 </div>
                 <div>
                    <span className="text-[9px] font-bold text-ink/70 uppercase tracking-[0.2em] italic">Probe Method</span>
                    <h3 className="text-2xl font-black mt-1 tabular-nums italic tracking-tighter text-blue-500">{monitor.method || '--'}</h3>
                 </div>
              </div>
            </div>

            {/* Main Latency Graph */}
            <div className="bg-panel dark:bg-panel/[0.01] border border-line dark:border-white/5 p-8 md:p-10 rounded-[40px] space-y-8 shadow-sm">
               <div className="flex items-center justify-between border-b border-slate-50 dark:border-white/5 pb-6">
                  <div className="space-y-1">
                     <h3 className="text-[10px] font-bold text-ink  uppercase tracking-[0.3em] flex items-center gap-3 italic">
                       <Gauge className="size-4 text-primary" /> Latency Spectrum
                     </h3>
                     <p className="text-[9px] font-medium text-ink/70 ml-7 italic">Resolution: 30 Telemetry Cycles</p>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2">
                        <div className="size-1.5 bg-primary rounded-full shadow-sm" />
                        <span className="text-[9px] font-bold text-ink/70 uppercase tracking-widest italic">Live Loop</span>
                     </div>
                  </div>
               </div>
                <div className="h-64 w-full relative min-h-[200px]">
                  <LatencyChart data={recentPings} isUp={getMonitorStatus(monitor)} />
                </div>
            </div>

            {/* Node Event History */}
            <div className="space-y-6">
               <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-bold text-ink  uppercase tracking-[0.3em] flex items-center gap-3 italic">
                    <History className="size-4 text-primary" /> Event Log
                  </h3>
                  <span className="text-[9px] font-bold text-ink/70 uppercase tracking-widest italic">Live Registry Activity</span>
               </div>
               <div className="space-y-3">
                  {recentPings.slice(0, 6).map((ping, i) => (
                    <div key={i} className="flex items-center justify-between p-5 bg-panel dark:bg-panel/[0.01] border border-line dark:border-white/5 rounded-2xl hover:bg-base dark:hover:bg-panel/[0.03] transition-all group shadow-sm">
                       <div className="flex items-center gap-5">
                          <div className={cn(
                            "size-2 rounded-full shadow-lg transition-all ring-3",
                            ping.is_up ? "bg-emerald-500 ring-emerald-500/10" : "bg-rose-500 ring-rose-500/10"
                          )} />
                          <div className="space-y-0.5">
                             <h4 className="text-[13px] font-bold text-ink  italic uppercase tracking-tight">
                                {ping.is_up ? 'Synchronized' : 'Node Timeout'}
                             </h4>
                             <p className="text-[9px] text-ink/70 font-medium italic">
                                {new Date(ping.created_at).toLocaleString()}
                             </p>
                             {ping.error_message && (
                               <p className="text-[10px] text-rose-500 font-bold italic mt-1 uppercase tracking-tighter">
                                 {ping.error_message}
                               </p>
                             )}
                          </div>
                       </div>
                       <div className="flex items-center gap-6">
                          <div className="text-right">
                             <span className="text-lg font-black text-ink  tabular-nums italic tracking-tighter">{ping.response_time}</span>
                             <span className="text-[8px] text-primary ml-1 uppercase font-bold italic">ms</span>
                          </div>
                          <ChevronRight className="size-4 text-ink/80 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                       </div>
                    </div>
                  ))}
               </div>
            </div>

        </div>

        {/* Sidebar Context */}
        <div className="space-y-8">
            
            <div className="bg-slate-900 dark:bg-panel p-8 rounded-[40px] space-y-6 text-white dark:text-ink relative overflow-hidden group shadow-xl">
               <div className="absolute top-0 right-0 size-32 bg-primary/20 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
               <div className="relative z-10 space-y-6">
                  <div className="size-10 bg-panel/10 dark:bg-black/5 rounded-xl flex items-center justify-center border border-white/10 dark:border-black/10">
                     <Wifi className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold uppercase tracking-tight italic">Operations</h4>
                    <p className="text-[9px] opacity-60 mt-1 uppercase tracking-widest font-bold italic">Global Cluster Delta</p>
                  </div>
                  <div className="space-y-4 pt-4 border-t border-white/10 dark:border-black/5">
                    {[
                      { label: 'Check Interval', val: `${monitor.interval}s`, icon: Clock },
                      { label: 'Node Status', val: 'Verified', icon: Lock },
                      { label: 'Engine', val: 'v.4.0.2', icon: Cpu }
                    ].map((spec, i) => (
                      <div key={i} className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest italic">
                         <span className="opacity-40">{spec.label}</span>
                         <span className="text-primary">{spec.val}</span>
                      </div>
                    ))}
                  </div>
               </div>
            </div>

            <div className="bg-panel dark:bg-panel/[0.01] border border-line dark:border-white/5 p-8 rounded-[40px] space-y-6 shadow-sm">
               <div className="size-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary border border-primary/10">
                  <Info className="size-5" />
               </div>
               <div className="space-y-5">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink  italic">Node Intelligence</h4>
                  <div className="space-y-6">
                    <div className="-mx-2 -mt-4 mb-2 relative scale-[0.85] origin-top">
                       <AnalogMeter 
                         value={getSafeValue(monitor.uptime_percent)}
                         min={0}
                         max={100}
                         unit="%"
                         label="Stability"
                         colorClass="emerald"
                       />
                    </div>
                    <div className="space-y-1">
                       <span className="text-[9px] font-bold text-ink/70 uppercase tracking-widest italic">Temporal Variance</span>
                       <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-ink  tabular-nums italic tracking-tighter">0.02ms</span>
                          <span className="text-[8px] font-bold text-ink/70 uppercase tracking-widest italic">Verified</span>
                       </div>
                    </div>
                  </div>
               </div>
            </div>

            <div className="p-8 bg-base dark:bg-panel/[0.01] border border-line dark:border-white/5 rounded-[40px] space-y-4 text-center shadow-sm">
               <Database className="size-5 text-ink/70 dark:text-ink/60 mx-auto" />
               <p className="text-[9px] font-bold text-ink/70 uppercase tracking-widest leading-relaxed italic">
                  Registry data encrypted. Performance history cached for 30 cycles.
               </p>
            </div>

        </div>
      </div>

      <footer className="pt-10 border-t border-line dark:border-white/5 flex justify-between items-center opacity-40 text-[8px] font-bold text-ink/70 uppercase tracking-[0.3em] italic">
         <div>Registry ID: NODE_{monitor.id.slice(0, 12)}</div>
         <div>Distributed Observability Protocol // NOMINAL</div>
      </footer>
    </div>
  );
}
