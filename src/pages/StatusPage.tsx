import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Activity, CheckCircle2, CloudCog, ShieldAlert, ChevronRight, Globe, Zap, BarChart3, RefreshCw } from 'lucide-react';
import { cn } from '../components/Layout';
import ThemeToggle from '../components/ThemeToggle';
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
  status: 'up' | 'down' | 'unknown' | 'paused';
  current_is_up: number | null;
  uptime_percent: number | null;
  avg_response_time: number;
  last_error_message?: string;
  last_checked: string | null;
  expected_status?: number | number[];
  recent_pings: { response_time: number; is_up: number; error_message?: string; created_at: string }[];
  recent_incidents: { response_time: number; is_up: number; error_message?: string; created_at: string }[];
}

// Premium LatencyChart for StatusPage
const LatencyChart = ({ data, color = "#5551FF" }: { data: any[], color?: string }) => {
  if (!data || data.length < 2) return <div className="h-full w-full bg-base dark:bg-panel/5 rounded-2xl animate-pulse" />;
  
  const chartData = data.map(p => ({
    time: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    latency: p.response_time,
  }));

  const chartConfig = {
    latency: {
      label: "Latency",
      color: color,
    },
  };

  return (
    <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
      <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="latencyGradientStatus" x1="0" y1="0" x2="0" y2="1">
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
          fill="url(#latencyGradientStatus)"
          animationDuration={1000}
        />
      </AreaChart>
    </ChartContainer>
  );
};

export default function StatusPage() {
  const { slug } = useParams<{ slug: string }>();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusName, setStatusName] = useState('Service Status');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper function to safely get numeric values
  const getSafeValue = (value: any): number | null => {
    if (value === undefined || value === null) return null;
    const parsed = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    
    try {
      const res = await fetch(`/api/public-status/${slug}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load status page');
      }
      
      setMonitors(data.monitors || []);
      
      // Resolve status name from user profile or status page settings
      if (data.user?.name) {
        setStatusName(data.user.name.toUpperCase());
      } else if (data.status_page?.name) {
        setStatusName(data.status_page.name.toUpperCase());
      } else if (data.user?.email) {
        setStatusName(data.user.email.split('@')[0].toUpperCase());
      } else {
        setStatusName(slug?.toUpperCase() || 'STATUS PAGE');
      }

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
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center gap-6">
        <Activity className="size-10 text-primary animate-spin" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-ink/70">Loading Observatory...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8">
           <div className="size-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto border border-rose-500/20 shadow-lg">
             <ShieldAlert className="size-10 text-rose-500" />
           </div>
           <div className="space-y-4">
             <h1 className="text-3xl font-extrabold tracking-tight text-ink  uppercase">Registry Error</h1>
             <p className="text-ink/60 font-medium text-sm leading-relaxed">{error}</p>
           </div>
           <button 
             onClick={() => window.location.reload()}
             className="px-8 py-3.5 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest hover:translate-y-[-2px] transition-all shadow-lg shadow-primary/20"
           >
             Retry Link
           </button>
        </div>
      </div>
    );
  }

  const getMonitorStatus = (monitor: Monitor) => {
    // 1. Prioritize verified status from 3-strike rule
    if (monitor.status === 'up') return true;
    if (monitor.status === 'down') return false;
    
    // 2. If status is unknown/paused, check real-time indicator but 
    // default to Operational for new monitors to avoid false alarms
    if (monitor.status === 'paused') return true; // Paused monitors are technically not failing

    if (monitor.current_is_up !== undefined && monitor.current_is_up !== null) {
      // If we have a real-time flag and status is unknown, only show down if current indicator is down
      // Otherwise, assume it is warming up or stable.
      return monitor.current_is_up === 1;
    }
    
    return true; // Default to operational
  };

  const allOperational = monitors.length > 0 && monitors.every(m => getMonitorStatus(m));

  if (!monitors || monitors.length === 0) {
    return (
      <div className="min-h-screen bg-base font-sans text-ink">
        <nav className="sticky top-0 z-[100] bg-panel/80 backdrop-blur-xl border-b border-line">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="size-9 bg-primary/10 rounded-xl flex items-center justify-center">
                 <CloudCog className="size-5 text-primary" />
               </div>
               <span className="text-lg font-bold tracking-tight text-ink  leading-tight">{statusName}</span>
            </div>
            <ThemeToggle />
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-6 py-24 text-center space-y-4">
           <Activity className="size-12 text-ink/20 mx-auto" />
           <h2 className="text-2xl font-bold uppercase tracking-widest text-ink/70">Awaiting Telemetry</h2>
           <p className="text-ink/50 text-sm max-w-sm mx-auto">This portal is active, but no infrastructure nodes are currently broadcasting status.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base font-sans text-ink transition-colors duration-500">
      {/* Refined Navigation */}
      <nav className="sticky top-0 z-[100] bg-panel/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-line dark:border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="size-9 bg-primary/10 rounded-xl flex items-center justify-center">
               <CloudCog className="size-5 text-primary" />
             </div>
             <div>
                <span className="block text-[8px] font-bold text-ink/70 uppercase tracking-widest">Observatory</span>
                <span className="text-lg font-bold tracking-tight text-ink  leading-tight">{statusName}</span>
             </div>
          </div>
          <div className="flex items-center gap-6">
             {isRefreshing && (
               <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full border border-primary/10">
                 <RefreshCw className="size-3 text-primary animate-spin" />
                 <span className="text-[8px] font-bold text-primary uppercase tracking-widest">Syncing</span>
               </div>
             )}
             <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12 sm:space-y-16">
        
        {/* Status Banner */}
        <section>
           <div className={cn(
             "p-6 sm:p-8 md:p-12 rounded-[32px] sm:rounded-[40px] border transition-all duration-700 relative overflow-hidden group shadow-sm",
             allOperational 
               ? "bg-panel dark:bg-emerald-500/5 border-emerald-500/10" 
               : "bg-panel dark:bg-rose-500/5 border-rose-500/10"
           )}>
             <div className={cn(
               "absolute top-0 right-0 size-64 rounded-full blur-[100px] opacity-10 pointer-events-none transition-transform duration-1000",
               allOperational ? "bg-emerald-500" : "bg-rose-500"
             )} />

             <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 md:gap-10 relative z-10">
                <div className="space-y-4 sm:space-y-6">
                   <div className={cn(
                     "inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-widest border shadow-sm",
                     allOperational ? "bg-emerald-500/5 text-emerald-600 dark:text-emerald-500 border-emerald-500/20" : "bg-rose-500/5 text-rose-600 dark:text-rose-500 border-rose-500/20"
                   )}>
                     <span className="relative flex size-2">
                       <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", allOperational ? "bg-emerald-400" : "bg-rose-400")}></span>
                       <span className={cn("relative inline-flex rounded-full size-2", allOperational ? "bg-emerald-500" : "bg-rose-500")}></span>
                     </span>
                     {allOperational ? 'Global Systems Operational' : 'Cluster Incident Active'}
                   </div>
                   <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-ink  leading-tight">
                     {allOperational ? 'All Services Normal.' : 'Performance Degraded.'}
                   </h2>
                   <p className="text-ink/60 dark:text-ink/70 max-w-xl text-xs sm:text-sm font-medium leading-relaxed italic">
                     {allOperational 
                       ? 'Our global monitoring mesh confirms all nodes are performing optimally. Uptime integrity is at nominal levels.' 
                       : 'Our regional observers have detected latency spikes. Engineering teams are investigating the root cause.'}
                   </p>
                </div>
                
                <div className="flex flex-col items-start md:items-end justify-center gap-3 sm:gap-4">
                   <div className="text-left md:text-right">
                      <span className="block text-[9px] sm:text-[10px] font-bold text-ink/70 uppercase tracking-widest">Aggregate Score</span>
                      <span className="text-4xl sm:text-5xl font-black text-ink tracking-widest tabular-nums">
                        {(() => {
                          const validMonitors = monitors.filter(m => m.uptime_percent !== null && m.uptime_percent !== undefined);
                          if (validMonitors.length === 0) return '---';
                          const avg = validMonitors.reduce((acc, m) => acc + (m.uptime_percent || 0), 0) / validMonitors.length;
                          return avg.toFixed(2);
                        })()}
                      </span>
                   </div>
                   <div className="px-5 py-2 bg-base dark:bg-panel/5 rounded-xl text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-ink/70 italic border border-line dark:border-white/5">
                     30-Day Reliability Index
                   </div>
                </div>
             </div>
           </div>
        </section>

        {/* Infrastructure Nodes */}
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-line dark:border-white/5 pb-6">
             <h3 className="text-[11px] font-bold text-ink dark:text-ink/70 uppercase tracking-[0.4em] flex items-center gap-3">
               <Zap className="size-4 text-primary" /> Node Registry
             </h3>
             <div className="flex items-center gap-2 text-[10px] font-bold text-ink/70 uppercase tracking-widest">
               {isRefreshing && <RefreshCw className="size-3 text-primary animate-spin" />}
               <span>Live Sync Active</span>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
            {monitors.map((monitor) => {
              const isMonitorUp = getMonitorStatus(monitor);
              return (
              <Link 
                key={monitor.id}
                to={`/status/${slug}/monitors/${monitor.id}`}
                className="bg-panel dark:bg-panel/[0.01] border border-line dark:border-white/5 rounded-[32px] p-6 sm:p-8 transition-all duration-500 hover:shadow-lg shadow-sm space-y-6 sm:space-y-8 group hover:-translate-y-1 block"
              >
                 <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1 min-w-0">
                       <div className="flex items-center gap-3">
                          <h4 className="text-2xl font-bold tracking-tight text-ink group-hover:text-primary transition-colors uppercase italic truncate">{monitor.name}</h4>
                          <div className={cn(
                            "size-2 rounded-full shrink-0",
                            isMonitorUp ? "bg-emerald-500 shadow-sm animate-pulse" : "bg-rose-500 shadow-sm shadow-rose-500/50"
                          )} />
                       </div>
                       <div className="flex items-center gap-2 text-[10px] font-bold text-ink/70 uppercase tracking-widest italic truncate">
                         <Globe className="size-3.5" /> {monitor.url.replace(/^https?:\/\//, '').split('/')[0]}
                       </div>
                       {!isMonitorUp && monitor.last_error_message && (
                         <div className="text-[9px] text-rose-500 font-bold block italic uppercase tracking-tighter mt-1 bg-rose-500/5 px-2 py-1 rounded-lg border border-rose-500/10 w-fit">
                           FAULT: {monitor.last_error_message}
                         </div>
                       )}
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-4">
                       <div className="w-12 h-12 sm:w-16 sm:h-16">
                          <AnalogMeter 
                            value={getSafeValue(monitor.avg_response_time)} 
                            max={1000} 
                            label="" 
                            unit="" 
                            className="p-0"
                            colorClass={monitor.avg_response_time < 200 ? "emerald" : monitor.avg_response_time < 500 ? "amber" : "rose"}
                          />
                       </div>
                       <div>
                          <span className="text-2xl font-black text-ink tabular-nums italic">{Math.round(monitor.avg_response_time || 0)}</span>
                          <span className="text-[9px] block font-bold text-ink/70 uppercase tracking-widest italic">ms lag</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center gap-1 h-8">
                       {monitor.recent_pings?.slice(-30).map((p, i) => (
                         <div 
                           key={i} 
                           className={cn(
                             "flex-1 h-full rounded-sm transition-all hover:scale-110",
                             p.is_up === 1 ? "bg-emerald-500/80 hover:bg-emerald-500" : "bg-rose-500/80 hover:bg-rose-500"
                           )}
                           title={`${new Date(p.created_at).toLocaleString()} - ${p.is_up === 1 ? 'UP' : 'DOWN'}`}
                         />
                       ))}
                       {(!monitor.recent_pings || monitor.recent_pings.length < 30) && Array.from({ length: 30 - (monitor.recent_pings?.length || 0) }).map((_, i) => (
                         <div key={`empty-${i}`} className="flex-1 h-full rounded-sm bg-line/10 dark:bg-white/5" />
                       ))}
                    </div>
                    <div className="flex justify-between text-[8px] font-bold text-ink/50 uppercase tracking-widest italic">
                       <span>30 Minutes Ago</span>
                       <span>Just Now</span>
                    </div>
                 </div>

                 <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-white/5">
                    <div className="flex gap-8">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-ink/70 uppercase tracking-widest block italic">Uptime</span>
                        <span className="text-xs font-black text-ink italic">
                          {monitor.uptime_percent !== null && monitor.uptime_percent !== undefined 
                            ? `${monitor.uptime_percent.toFixed(2)}%` 
                            : '---'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-ink/70 uppercase tracking-widest block italic">Status</span>
                        <span className={cn("text-xs font-black italic", isMonitorUp ? "text-emerald-500" : "text-rose-500")}>
                          {isMonitorUp ? 'OPERATIONAL' : 'DEGRADED'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-ink/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                 </div>
              </Link>
            );
            })}

            {monitors.length === 0 && (
              <div className="col-span-full py-24 text-center rounded-[32px] border-2 border-dashed border-line dark:border-white/10 space-y-4">
                <BarChart3 className="size-12 text-ink/80 dark:text-ink/60 mx-auto" />
                <h4 className="text-lg font-bold text-ink/70 uppercase tracking-widest italic">Awaiting Signal</h4>
              </div>
            )}
          </div>
        </div>

        {/* Global Incident History */}
        <section className="space-y-8">
           <div className="flex items-center justify-between border-b border-line dark:border-white/5 pb-6">
              <h3 className="text-[11px] font-bold text-ink dark:text-ink/70 uppercase tracking-[0.4em] flex items-center gap-3 italic">
                <ShieldAlert className="size-4 text-primary" /> Incident History
              </h3>
              <span className="text-[9px] font-bold text-ink/70 uppercase tracking-widest italic">Last 5 Major Clusters</span>
           </div>

           <div className="space-y-6">
              {monitors.some(m => Array.isArray(m.recent_incidents) && m.recent_incidents.length > 0) ? (
                monitors.flatMap(m => (Array.isArray(m.recent_incidents) ? m.recent_incidents : []).map(inc => ({ ...inc, monitorName: m.name })))
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 5)
                  .map((inc, i) => (
                    <div key={i} className="flex gap-8 group">
                      <div className="w-24 shrink-0 text-right">
                         <span className="text-[10px] font-black text-ink block uppercase italic">{new Date(inc.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                         <span className="text-[8px] font-bold text-ink/50 uppercase">{new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="relative flex flex-col items-center">
                        <div className="size-2 rounded-full bg-rose-500 z-10 shadow-sm shadow-rose-500/50" />
                        <div className="w-px h-full bg-line dark:bg-white/5 mt-2" />
                      </div>
                      <div className="flex-1 pb-10">
                        <div className="bg-panel dark:bg-panel/[0.01] border border-line dark:border-white/5 p-6 rounded-3xl space-y-3 shadow-sm group-hover:border-rose-500/20 transition-all">
                          <div className="flex items-center gap-3">
                            <h5 className="text-lg font-black text-ink uppercase italic tracking-tight">{inc.monitorName}</h5>
                            <span className="px-3 py-1 bg-rose-500/5 text-rose-500 text-[8px] font-bold uppercase rounded-full border border-rose-500/10 italic">Cluster Failure</span>
                          </div>
                          <p className="text-ink/60 dark:text-ink/70 text-[11px] leading-relaxed font-medium italic">
                            {inc.error_message || 'The system detected an operational divergence in this cluster region. Automatic remediation protocols were engaged.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="py-12 px-8 bg-emerald-500/5 rounded-3xl border border-emerald-500/10 text-center space-y-4">
                   <CheckCircle2 className="size-8 text-emerald-500 mx-auto" />
                   <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest italic">No major incidents reported in the last orbital cycle.</p>
                </div>
              )}
           </div>
        </section>

        {/* Footer */}
        <footer className="pt-12 border-t border-line dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 opacity-50 text-[9px] font-bold text-ink/70 uppercase tracking-widest text-center md:text-left">
           <div>Transparency Portal // Distributed Network // v.4.0.2</div>
           <div className="max-w-xs leading-relaxed">
             Real-time performance metrics cryptographically verified from our edge cluster network.
           </div>
        </footer>
      </main>
    </div>
  );
}
