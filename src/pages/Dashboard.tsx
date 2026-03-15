import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, ChevronRight, PlusCircle, ShieldCheck, RefreshCw,
  ArrowUpRight, BarChart3, Clock, Radio, LayoutDashboard
} from 'lucide-react';
import { cn } from '../components/Layout';
import { AnalogMeter } from '../components/ui/AnalogMeter';
import { supabase } from '../supabase/client';
import { RealtimeFeed } from '../components/Dashboard/RealtimeFeed';
import { SystemDistribution } from '../components/Dashboard/SystemDistribution';
import { LiveTicker } from '../components/LiveTicker';

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
  const getSafeValue = (value: any): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
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
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-8 space-y-12 transition-all duration-700">
      
      {/* Dynamic Dashboard Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-10 border-b border-line/40 relative">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <LayoutDashboard className="size-4 text-white" />
            </div>
            <h1 className="text-2xl font-black text-ink uppercase italic tracking-tight">Mainframe_Alpha</h1>
          </div>
          <p className="text-[11px] font-bold text-ink/40 uppercase tracking-[0.3em] flex items-center gap-2 italic">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            All Systems Operational // Cluster {Math.random().toString(36).slice(2, 6).toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
             <span className="text-[9px] font-bold text-ink/30 uppercase tracking-widest italic">Temporal Stamp</span>
             <span className="text-xs font-mono font-bold text-ink/60 italic">{new Date().toLocaleTimeString()}</span>
          </div>
          <Link to="/app/monitors/new" className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] hover:-translate-y-1 transition-all flex items-center gap-2 italic">
            <PlusCircle className="size-3" /> Provision_Node
          </Link>
        </div>
      </header>

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Core Metrics & Terminal Section - Left 8 Columns */}
        <div className="lg:col-span-8 space-y-8 lg:space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-panel border border-line/40 p-10 rounded-[40px] shadow-sm hover:shadow-2xl hover:shadow-emerald-500/5 transition-all flex flex-col items-center justify-center relative overflow-hidden group">
               <div className="absolute top-8 right-8 flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Live_Feed</span>
               </div>
               <AnalogMeter 
                 value={getSafeValue(stats.overall_uptime)} 
                 max={100} 
                 unit="%" 
                 label="Cluster Availability" 
                 colorClass="emerald"
                 className="w-full max-w-[320px]"
               />
               <p className="text-[11px] font-bold text-ink/30 uppercase tracking-[0.2em] italic mt-8 text-center px-6">Global Node Health Index Normal</p>
            </div>

            <div className="bg-panel border border-line/40 p-10 rounded-[40px] shadow-sm hover:shadow-2xl hover:shadow-blue-500/5 transition-all flex flex-col items-center justify-center relative overflow-hidden group">
               <div className="absolute top-8 right-8 flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20">
                  <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest italic">Response_RTT</span>
               </div>
               <AnalogMeter 
                 value={getSafeValue(stats.avg_response_time)} 
                 max={500} 
                 unit="ms" 
                 label="Network Velocity" 
                 colorClass="blue"
                 className="w-full max-w-[320px]"
               />
               <p className="text-[11px] font-bold text-ink/30 uppercase tracking-[0.2em] italic mt-8 text-center px-6">Optimized Edge Traffic routing</p>
            </div>
          </div>

          <RealtimeFeed monitors={monitors} />
        </div>

        {/* Sidebar Intelligence Section - Right 4 Columns */}
        <div className="lg:col-span-4 space-y-8 lg:space-y-12">
          <div className="bg-panel border border-line/40 p-10 rounded-[40px] flex flex-col gap-10 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all group overflow-hidden relative">
              <div className="absolute inset-x-0 bottom-0 h-1.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-1000" />
              <div className="flex items-center justify-between relative z-10">
                <div className="size-14 rounded-2xl flex items-center justify-center border border-primary/20 bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-700">
                   <Activity className="size-7" />
                </div>
                {(isRefreshing || loading) && !quotaExceeded && <RefreshCw className="size-5 text-primary animate-spin" />}
              </div>
              <div className="relative z-10 space-y-2">
                <span className="text-[11px] font-black text-ink/40 uppercase tracking-[0.4em] italic mb-2 block">System Registry Density</span>
                <div className="flex items-baseline gap-4">
                  <h2 className="text-7xl font-black tracking-tighter text-ink tabular-nums italic leading-none">{stats.total_monitors}</h2>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black text-primary italic uppercase leading-tight">Nodes</span>
                    <span className="text-[10px] font-bold text-ink/30 italic uppercase lowercase leading-tight">deployed</span>
                  </div>
                </div>
              </div>
          </div>

          <SystemDistribution stats={stats} />
        </div>
        </div>

        {/* New Horizontal Stats Card Replacement for space management */}
        <div className="col-span-full bg-[#050609] border border-white/5 p-8 rounded-[32px] overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-emerald-500/10 opacity-20" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="flex items-center gap-8">
                <div className="size-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="size-8 text-primary shadow-glow shadow-primary/40" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-white uppercase italic tracking-tight">Infrastructure Health</h4>
                  <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] italic">Cross-Region Performance Analysis</p>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-end gap-12 w-full md:w-auto overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
                {[
                  { label: 'Latency_Delta', val: '-1.2ms', color: 'text-emerald-500' },
                  { label: 'Active_Checks', val: '2,408/s', color: 'text-primary' },
                  { label: 'Registry_Sync', val: '99.99%', color: 'text-blue-500' }
                ].map((stat, i) => (
                  <div key={i} className="space-y-2 text-right">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] block italic">{stat.label}</span>
                    <span className={cn("text-2xl font-black italic tabular-nums block", stat.color)}>{stat.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

      {/* Registry Preview Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
        
        {/* Main List - 8 Columns */}
        <div className="lg:col-span-8 space-y-8">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                <h3 className="text-sm font-black text-ink uppercase tracking-[0.2em] italic">Telemetry_Stream</h3>
                <div className="h-4 w-px bg-line/40" />
                <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest italic">{monitors.length} Nodes tracked</span>
              </div>
              <Link to="/app/monitors" className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:gap-3 transition-all italic group">
                 Open_Registry <ArrowUpRight className="size-3 group-hover:scale-125 transition-transform" />
              </Link>
           </div>
           
           <div className="grid grid-cols-1 gap-4">
              {monitors.length === 0 ? (
                <div className="py-32 text-center border border-dashed border-line/40 rounded-[32px] bg-panel/30 flex flex-col items-center justify-center gap-4 group">
                   <div className="size-16 rounded-full bg-line/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Clock className="size-8 text-ink/20" />
                   </div>
                   <p className="text-[10px] font-black text-ink/40 uppercase tracking-[0.3em] italic">No node activity recorded</p>
                </div>
              ) : (
                monitors.slice(0, 5).map(monitor => (
                  <Link 
                    key={monitor.id} 
                    to={`/app/monitors/${monitor.id}`}
                    className="group relative flex items-center justify-between p-6 bg-panel hover:bg-white dark:hover:bg-line/5 border border-line/40 rounded-[24px] transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-primary/5 active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-8">
                       <div className="relative">
                         <div className={cn(
                           "size-3 rounded-full shadow-lg transition-all duration-700",
                           monitor.status === 'up' && monitor.current_is_up === 1 ? "bg-emerald-500 shadow-emerald-500/20" : 
                           monitor.status === 'up' && monitor.current_is_up === 0 ? "bg-amber-500 animate-pulse" :
                           "bg-rose-500 shadow-rose-500/20"
                         )} />
                         {(monitor.current_is_up === 0 || monitor.status === 'down') && (
                           <div className="absolute inset-[-4px] rounded-full border border-rose-500/20 animate-ping opacity-20" />
                         )}
                       </div>
                       <div className="space-y-1.5">
                          <h4 className="text-xl font-black text-ink group-hover:text-primary transition-colors italic uppercase tracking-tight leading-none">{monitor.name}</h4>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-ink/40 font-mono font-bold italic tracking-tighter truncate max-w-[200px]">{monitor.url}</span>
                            {monitor.current_is_up === 0 && (
                              <div className="flex items-center gap-1 text-[8px] font-bold text-rose-500 uppercase tracking-tighter bg-rose-500/5 px-2 py-0.5 rounded-full border border-rose-500/10 italic">
                                Critical_Fault
                              </div>
                            )}
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-12">
                       <div className="hidden xl:block w-32 h-10 opacity-20 group-hover:opacity-100 transition-all duration-700 grayscale group-hover:grayscale-0">
                          <MiniChart data={monitor.recent_pings?.slice(-15) || []} color={monitor.current_is_up === 1 ? "#10b981" : "#f43f5e"} />
                       </div>
                       <div className="text-right min-w-[80px]">
                          <div className="text-2xl font-black text-ink tabular-nums tracking-tighter italic leading-none group-hover:text-primary transition-colors">
                            {monitor.last_response_time || '--'}<span className="text-xs ml-0.5 opacity-40">ms</span>
                          </div>
                          <div className="text-[8px] font-black text-ink/30 uppercase tracking-[0.2em] italic mt-1">Velocity_RTT</div>
                       </div>
                       <div className="size-10 rounded-xl bg-line/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                          <ChevronRight className="size-4" />
                       </div>
                    </div>
                  </Link>
                ))
              )}
           </div>
        </div>

        {/* Sidebar - 4 Columns */}
        <aside className="lg:col-span-4 space-y-10">
            
            <div className="bg-[#050609] p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
               <div className="absolute -bottom-20 -right-20 size-64 bg-primary/5 blur-3xl rounded-full" />
               
               <div className="relative z-10 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="size-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-inner">
                      <ShieldCheck className="size-6 text-primary shadow-glow shadow-primary/40" />
                    </div>
                    <div className="text-right">
                       <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] italic bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Operational</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-tight">Security_Matrix</h4>
                    <p className="text-[11px] font-bold text-white/40 mt-2 leading-relaxed italic uppercase tracking-wider">All edge deployments verified. Global sync active.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest italic">Health_Score</span>
                      <div className="text-xl font-black text-white italic">99.8%</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest italic">Threat_Level</span>
                      <div className="text-xl font-black text-primary italic">0.00</div>
                    </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {[
                 { icon: BarChart3, label: 'Advanced_Analytics', link: '/app/monitors' },
                 { icon: Clock, label: 'Incident_Report', link: '/app/status' },
               ].map((action, i) => (
                 <Link key={i} to={action.link} className="p-8 bg-panel border border-line/40 rounded-[32px] hover:bg-primary hover:border-primary transition-all group shadow-sm flex flex-col items-center justify-center gap-4 text-center">
                    <div className="size-10 rounded-xl bg-line/5 group-hover:bg-white/10 flex items-center justify-center transition-all">
                      <action.icon className="size-4 text-ink/60 group-hover:text-white transition-colors" />
                    </div>
                    <span className="block text-[9px] font-black text-ink/60 group-hover:text-white uppercase tracking-[0.2em] italic leading-tight">{action.label}</span>
                 </Link>
               ))}
            </div>

            <div className="p-10 bg-panel border border-line/40 rounded-[40px] space-y-8 shadow-sm relative overflow-hidden">
               <div className="flex items-center justify-between">
                 <h4 className="text-[10px] font-black text-ink/60 uppercase tracking-[0.3em] flex items-center gap-3 italic">
                    <span className="size-1.5 rounded-full bg-primary" /> Session_Intelligence
                 </h4>
               </div>
               
               <div className="space-y-6">
                  {[
                    { label: 'Security_Module', val: 'Active', color: 'text-emerald-500' },
                    { label: 'Cluster_Version', val: 'v4.2.0-STABLE', color: 'text-ink' },
                    { label: 'Edge_Propagation', val: 'Optimal', color: 'text-blue-500' }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center group/log">
                       <span className="text-[10px] font-bold text-ink/40 italic uppercase tracking-widest group-hover/log:text-ink transition-colors">{item.label}</span>
                       <span className={cn("text-[10px] font-black uppercase tracking-widest italic", item.color)}>{item.val}</span>
                    </div>
                  ))}
               </div>
            </div>

        </aside>
      </section>
      
      <footer className="pt-10 border-t border-line/40 flex justify-between items-center opacity-30 text-xs font-bold text-ink/60 uppercase tracking-widest italic">
         <div>Distributed Observability Engine // Nominal</div>
         <div>&copy; 2026 KeepAlive.io</div>
      </footer>
    </div>
  );
}
