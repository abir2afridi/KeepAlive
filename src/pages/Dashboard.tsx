import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, ChevronRight, PlusCircle, ShieldCheck, RefreshCw,
  ArrowUpRight, BarChart3, Clock, Radio, LayoutDashboard
} from 'lucide-react';
import { cn } from '../components/Layout';
import { AnalogMeter } from '../components/ui/AnalogMeter';
import { supabase } from '../supabase/client';

interface Monitor {
  id: string;
  name: string;
  url: string;
  status: string;
  type: string;
  current_is_up: number | null;
  last_response_time: number | null;
  uptime_percent: number | null;
  last_pinged_at: string | null;
  last_error_message?: string;
  recent_pings: { response_time: number; is_up: number; error_message?: string; created_at: string }[];
}

interface Stats {
  total_monitors: number;
  overall_uptime: number;
  avg_response_time: number;
}

import {
  ChartContainer,
} from "../components/ui/chart";
import {
  Area,
  AreaChart,
} from "recharts";

const MiniChart = ({ data, color = "#5551FF" }: { data: any[], color?: string }) => {
  if (!data || data.length < 2) {
    return (
      <div className="h-full w-full bg-base rounded-md flex items-center justify-center opacity-30">
        <Activity className="size-2 text-primary animate-pulse" />
      </div>
    );
  }
  
  const chartData = data.map((p, i) => ({
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
        <Area
          type="monotone"
          dataKey="latency"
          stroke={color}
          strokeWidth={2}
          fill="transparent"
          animationDuration={1000}
        />
      </AreaChart>
    </ChartContainer>
  );
};

export default function Dashboard() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [stats, setStats] = useState<Stats>({ total_monitors: 0, overall_uptime: 0, avg_response_time: 0 });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
  // ─── Hydration from LocalStorage ──────────────────────────────────────────
  useEffect(() => {
    const savedMonitors = localStorage.getItem('ka_monitors');
    const savedStats = localStorage.getItem('ka_stats');
    if (savedMonitors) {
      try { setMonitors(JSON.parse(savedMonitors)); } catch (e) {}
    }
    if (savedStats) {
      try { setStats(JSON.parse(savedStats)); } catch (e) {}
    }
  }, []);
  // ─────────────────────────────────────────────────────────────────────────────

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token || localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        setIsRefreshing(false);
        return;
      }
      const headers = { 'Authorization': `Bearer ${token}` };
      const [monitorsRes, statsRes] = await Promise.all([
        fetch('/api/monitors', { headers }),
        fetch('/api/stats', { headers })
      ]);

      if (monitorsRes.status === 401 || statsRes.status === 401) {
        console.warn('Session might be stale.');
        setLoading(false);
        setIsRefreshing(false);
        return;
      }

      // Server now always returns 200 with data (real, cached, or empty defaults)
      if (monitorsRes.ok && statsRes.ok) {
        const monitorsData = await monitorsRes.json();
        const statsData = await statsRes.json();
        
        // API returns { monitors: [...] } — handle both formats
        const validMonitors = Array.isArray(monitorsData) ? monitorsData : (monitorsData.monitors || []);
        // Handle both old and new API response structures
        const validStats = statsData.total_monitors !== undefined 
          ? {
              total_monitors: validMonitors.length, // ✅ Sync with actual monitors
              overall_uptime: statsData.overall_uptime || 0,
              avg_response_time: statsData.avg_response_time || 0
            }
          : {
              total_monitors: validMonitors.length, // ✅ Sync with actual monitors
              overall_uptime: 0,
              avg_response_time: 0
            };
        
        setMonitors(validMonitors);
        setStats(validStats);
        setQuotaExceeded(false);
        setLastUpdated(new Date());

        // Save for offline/quota-hit use
        if (validMonitors.length > 0) {
          localStorage.setItem('ka_monitors', JSON.stringify(validMonitors));
        }
        if (validStats.total_monitors > 0) {
          localStorage.setItem('ka_stats', JSON.stringify(validStats));
        }
      } else if (monitorsRes.status === 429 || statsRes.status === 429) {
        // Fallback: if server still returns 429 for some reason
        setQuotaExceeded(true);
      }
    } catch (error) {
      console.debug('Dashboard fetch suppressed or failed:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(() => {
      if (!mounted) return;
      setAuthReady(true);
      fetchData();
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, _session) => {
      setAuthReady(true);
      fetchData(true);
    });

    const interval = setInterval(() => {
      fetchData(true);
    }, 60000);

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  if (!authReady || loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
      <RefreshCw className="size-8 text-primary animate-spin" />
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic animate-pulse">Syncing Telemetry...</span>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12 transition-all duration-700">
      
      <div className="flex items-center justify-between pb-4 border-b border-line/40">
        <div className="space-y-1">
          <h2 className="text-xs font-bold text-ink/60 uppercase tracking-[0.3em] italic">Operational Intelligence</h2>
          {lastUpdated && !quotaExceeded && (
            <p className="text-[10px] text-ink/30 italic">Last synchronized: {lastUpdated.toLocaleTimeString()}</p>
          )}
        </div>
        {quotaExceeded && (
          <button 
            onClick={() => fetchData()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all group"
          >
            <RefreshCw className="size-3 group-hover:rotate-180 transition-transform duration-700" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Retry Now</span>
          </button>
        )}
      </div>

      {/* Quota Warning Banner */}
      {quotaExceeded && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="size-10 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-5 text-amber-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-amber-500 italic uppercase tracking-wider">Service Capacity Throttled</h3>
            <p className="text-xs text-ink/60 leading-relaxed italic">
              The platform has reached its free-tier data synchronization limit. Monitoring continues in the background, 
              but dashboard updates are currently throttled. Normal service will resume automatically when the daily quota resets.
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid - Minimalist & Premium */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-panel border border-line/40 p-8 rounded-3xl flex flex-col gap-6 shadow-sm hover:translate-y-[-2px] transition-all">
           <div className="flex items-center justify-between">
              <div className="size-10 rounded-xl flex items-center justify-center border border-current/10 shadow-sm bg-primary/5 text-primary">
                 <Activity className="size-5" />
              </div>
              {(isRefreshing || loading) && !quotaExceeded && <RefreshCw className="size-3 text-primary animate-spin" />}
           </div>
           <div>
              <span className="text-[9px] font-bold text-ink/60 uppercase tracking-[0.2em] italic mb-1.5 block">Active nodes</span>
              <h2 className="text-3xl font-black tracking-tight text-ink tabular-nums italic">{stats.total_monitors}</h2>
           </div>
        </div>

        <div className="bg-panel border border-line/40 p-6 rounded-3xl shadow-sm hover:translate-y-[-2px] transition-all flex flex-col items-center justify-center relative overflow-hidden group">
           <div className="absolute top-4 right-4 text-[8px] font-black text-emerald-500/40 uppercase tracking-widest italic">Stable</div>
           <AnalogMeter 
             value={getSafeValue(stats.overall_uptime)} 
             max={100} 
             unit="%" 
             label="Global Uptime" 
             colorClass="emerald"
             className="w-full"
           />
           <p className="text-[9px] text-ink/40 italic mt-2 text-center px-4">Cluster availability within nominal safety thresholds.</p>
        </div>

        <div className="bg-panel border border-line/40 p-6 rounded-3xl shadow-sm hover:translate-y-[-2px] transition-all flex flex-col items-center justify-center relative overflow-hidden group">
           <div className="absolute top-4 right-4 text-[8px] font-black text-blue-500/40 uppercase tracking-widest italic">Optimized</div>
           <AnalogMeter 
             value={getSafeValue(stats.avg_response_time)} 
             max={500} 
             unit="ms" 
             label="Avg Latency" 
             colorClass="blue"
             className="w-full"
           />
           <p className="text-[9px] text-ink/40 italic mt-2 text-center px-4">Global velocity synchronized across all active edge nodes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Main List */}
        <div className="lg:col-span-2 space-y-8">
           <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-ink uppercase tracking-[0.3em] italic">Telemetry Stream</h3>
              <Link to="/app/monitors" className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline flex items-center gap-1.5 transition-all">
                 Registry <ArrowUpRight className="size-3" />
              </Link>
           </div>
           
           <div className="space-y-4">
              {monitors.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed border-line/20 rounded-3xl opacity-50 flex flex-col items-center gap-4">
                   <Clock className="size-8 text-ink/70" />
                   <p className="text-[10px] font-bold text-ink/60 uppercase tracking-widest italic">No node activity recorded</p>
                </div>
              ) : (
                monitors.slice(0, 6).map(monitor => (
                  <Link 
                    key={monitor.id} 
                    to={`/app/monitors/${monitor.id}`}
                    className="flex items-center justify-between p-6 bg-panel hover:bg-panel/80 border border-line/40 rounded-2xl transition-all shadow-sm group"
                  >
                    <div className="flex items-center gap-6">
                       <div className={cn(
                         "size-2 rounded-full ring-4 shadow-sm transition-colors duration-500",
                         monitor.status === 'up' && monitor.current_is_up === 1 ? "bg-emerald-500 ring-emerald-500/10" : 
                         monitor.status === 'up' && monitor.current_is_up === 0 ? "bg-amber-500 ring-amber-500/10 animate-pulse" :
                         "bg-rose-500 ring-rose-500/10"
                       )} />
                       <div className="space-y-1">
                          <h4 className="text-lg font-bold text-ink group-hover:text-primary transition-colors italic uppercase tracking-tight">{monitor.name}</h4>
                          <span className="text-[10px] text-ink/60 font-medium truncate max-w-[180px] block italic mono tracking-tight">{monitor.url}</span>
                          {monitor.current_is_up === 0 && monitor.last_error_message && (
                            <span className="text-[9px] text-rose-500 font-bold block italic uppercase tracking-tighter mt-0.5">
                               FAULT: {monitor.last_error_message}
                            </span>
                          )}
                       </div>
                    </div>

                    <div className="flex items-center gap-10">
                       <div className="hidden sm:block w-24 h-6 opacity-30 group-hover:opacity-100 transition-opacity">
                          <MiniChart data={monitor.recent_pings?.slice(-15) || []} color={monitor.current_is_up === 1 ? "#10b981" : "#f43f5e"} />
                       </div>
                       <div className="text-right w-16">
                          <div className="text-xl font-bold text-ink tabular-nums tracking-tighter italic">
                            {monitor.last_response_time || '--'}<span className="text-xs ml-0.5 text-primary">ms</span>
                          </div>
                          <div className="text-[9px] font-bold text-ink/60 uppercase tracking-widest italic">Velocity</div>
                       </div>
                       <ChevronRight className="size-4 text-ink/70 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))
              )}
           </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
            
            <div className="bg-slate-900 dark:bg-base p-8 rounded-3xl shadow-xl text-white dark:text-slate-900 relative overflow-hidden group">
               <div className="absolute inset-0 bg-primary/20 blur-3xl scale-150 opacity-0 group-hover:opacity-100 transition-all duration-1000" />
               <div className="relative z-10 space-y-6">
                  <div className="size-10 bg-base/10 dark:bg-black/5 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold tracking-tight uppercase italic">Operational Status</h4>
                    <p className="text-[10px] opacity-60 mt-1.5 leading-relaxed italic">Systems performing within optimal parameters.</p>
                  </div>
                  <div className="pt-4 border-t border-white/10 dark:border-black/5">
                     <div className="flex justify-between items-center mb-[-2rem]">
                        <span className="text-[8px] font-bold uppercase tracking-widest opacity-50 relative z-20">Stability Index</span>
                     </div>
                     <AnalogMeter 
                       value={getSafeValue(stats.overall_uptime)} 
                       min={0} 
                       max={100} 
                       unit="%" 
                       label="System Uptime"
                       colorClass="primary"
                     />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {[
                 { icon: BarChart3, label: 'Analytics', link: '/app/monitors' },
                 { icon: Clock, label: 'Incidents', link: '/app/status' },
               ].map((action, i) => (
                 <Link key={i} to={action.link} className="p-6 bg-panel border border-line/40 rounded-2xl hover:bg-panel/80 transition-all text-center space-y-3 group shadow-sm">
                    <action.icon className="size-4 text-ink/60 mx-auto group-hover:text-primary transition-colors" />
                    <span className="block text-[10px] font-bold text-ink/60 uppercase tracking-widest italic">{action.label}</span>
                 </Link>
               ))}
            </div>

            <div className="p-8 bg-panel border border-line/40 rounded-3xl space-y-6 shadow-sm">
               <h4 className="text-xs font-bold text-ink/60 uppercase tracking-widest flex items-center gap-2 italic">
                  <Clock className="size-3 text-primary" /> Session logs
               </h4>
               <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                     <span className="text-xs font-medium text-ink/60 italic">Security</span>
                     <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest">Active</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                     <span className="text-xs font-medium text-ink/60 italic">Version</span>
                     <span className="text-xs font-bold text-ink uppercase tracking-tight">v4.0.2</span>
                  </div>
               </div>
            </div>

        </div>
      </div>
      
      <footer className="pt-10 border-t border-line/40 flex justify-between items-center opacity-30 text-xs font-bold text-ink/60 uppercase tracking-widest italic">
         <div>Distributed Observability Engine // Nominal</div>
         <div>&copy; 2026 KeepAlive.io</div>
      </footer>
    </div>
  );
}
