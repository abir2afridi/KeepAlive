import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Activity, Globe, Server, CloudCog, Trash2, Edit2, 
  PlusCircle, Search, Filter, ChevronRight, ArrowUpRight,
  Database, Zap, Clock, ShieldCheck, RefreshCw, BarChart3,
  ExternalLink, Info, Activity as PulseIcon
} from 'lucide-react';
import { cn } from '../components/Layout';
import { supabase } from '../supabase/client';

interface Monitor {
  id: string;
  name: string;
  url: string;
  type: string;
  current_is_up: number | null;
  last_response_time: number | null;
  uptime_percent: number | null;
  last_pinged_at: string | null;
  last_error_message?: string;
  recent_pings: { response_time: number; is_up: number; error_message?: string; created_at: string }[];
}

const Sparkline = ({ data, color = "#5551FF" }: { data: any[], color?: string }) => {
  if (!data || data.length < 2) return <div className="h-full w-full bg-slate-200/5 rounded animate-pulse" />;
  const points = data.map(p => p.response_time);
  const max = Math.max(...points, 10);
  const min = Math.min(...points);
  const range = max - min || 10;
  const step = 100 / (data.length - 1);
  const pathData = data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${90 - ((p.response_time - min) / range * 80)}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-2 overflow-visible">
      <path d={pathData} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default function Monitors() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token || localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/monitors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/auth';
        return;
      }
      
      if (res.ok) {
        const data = await res.json();
        // API returns { monitors: [...] } — handle both formats
        const list = Array.isArray(data) ? data : (data.monitors || []);
        setMonitors(list);
      }
    } catch (error) {
      console.error('Failed to fetch monitors', error);
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
      if (token) fetchData();
      else navigate('/auth');
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const token = session?.access_token || localStorage.getItem('token');
      if (token) fetchData(true);
      else navigate('/auth');
    });

    const interval = setInterval(() => {
      fetchData(true);
    }, 15000);

    const handleVisibilityChange = () => {
      if (!document.hidden && mounted) {
        fetchData(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [navigate, searchQuery]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to decommission this monitor node?')) return;
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token || localStorage.getItem('token');
      if (!token) return;
      await fetch(`/api/monitors/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Failed to delete monitor', error);
    }
  };

  const filteredMonitors = monitors.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getMonitorIcon = (type: string) => {
    switch (type) {
      case 'Website': return <Globe className="size-5" />;
      case 'API Monitor': return <Database className="size-5" />;
      case 'API Endpoint': return <Database className="size-5" />;
      case 'Supabase Keep-Alive': return <CloudCog className="size-5" />;
      default: return <Activity className="size-5" />;
    }
  };

  if (loading && monitors.length === 0) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
      <Activity className="size-10 text-primary animate-spin" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading Node Registry...</span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      
      <div className="flex items-center justify-between pb-4 border-b border-line/40">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-bold text-ink/60 uppercase tracking-[0.3em] italic">Telemetry Matrix</h2>
          <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-full tracking-widest uppercase">{monitors.length} Nodes</span>
        </div>
        <Link to="/app/monitors/new" className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:translate-y-[-1px] transition-all shadow-lg shadow-primary/20 flex items-center gap-2 italic">
          <PlusCircle className="size-3" /> Provision Node
        </Link>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input 
            type="text"
            placeholder="SEARCH REGISTRY..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-panel border border-line/40 rounded-2xl py-3.5 pl-12 pr-10 text-ink font-bold italic tracking-widest outline-none focus:ring-4 focus:ring-primary/5 transition-all text-sm"
          />
          {isRefreshing && (
            <RefreshCw className="absolute right-5 top-1/2 -translate-y-1/2 size-3.5 text-primary animate-spin" />
          )}
        </div>
        <button className="px-6 py-3.5 bg-panel border border-line/40 rounded-2xl text-ink font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-panel/80 transition-all italic">
          <Filter className="size-4 text-primary" /> Filters
        </button>
      </div>

      {/* Registry Matrix */}
      <div className="bg-panel border border-line/40 rounded-[32px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar-minimal">
          <table className="w-full text-left border-collapse">
            <thead className="text-[11px] font-bold uppercase tracking-widest text-ink/60 border-b border-line/20 bg-panel/50">
              <tr>
                <th className="px-8 py-6 italic">Node Identity</th>
                <th className="px-6 py-6 italic">Status</th>
                <th className="px-6 py-6 text-center italic">Uptime</th>
                <th className="px-6 py-6 text-center italic">Latency</th>
                <th className="px-8 py-6 text-right italic">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/20">
              {filteredMonitors.map(monitor => (
                <tr 
                  key={monitor.id} 
                  onClick={() => navigate(`/app/monitors/${monitor.id}`)}
                  className="hover:bg-primary/[0.02] transition-all group cursor-pointer"
                >
                  <td className="px-8 py-8">
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "size-12 rounded-2xl flex items-center justify-center border transition-all",
                        monitor.current_is_up === 1 
                          ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/10" 
                          : "bg-rose-500/5 text-rose-500 border-rose-500/10"
                      )}>
                        {getMonitorIcon(monitor.type)}
                      </div>
                      <div className="flex flex-col space-y-1">
                         <div className="flex items-center gap-2">
                           <span className="font-bold text-lg text-ink group-hover:text-primary transition-colors tracking-tight uppercase italic">{monitor.name}</span>
                           <span className="text-[8px] font-bold uppercase tracking-widest text-ink/60 italic px-2 py-0.5 bg-line/10 rounded-full">{monitor.type}</span>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 italic font-mono truncate max-w-[200px]">{monitor.url}</p>
                        {monitor.current_is_up === 0 && monitor.last_error_message && (
                          <p className="text-[9px] text-rose-500 font-bold block italic uppercase tracking-tighter mt-1">
                            REASON: {monitor.last_error_message}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-8">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest border italic",
                      monitor.current_is_up === 1 
                        ? "bg-emerald-500/5 text-emerald-600 dark:text-emerald-500 border-emerald-500/10" 
                        : "bg-rose-500/5 text-rose-600 dark:text-rose-500 border-rose-500/10"
                    )}>
                       <div className={cn("size-2 rounded-full", monitor.current_is_up === 1 ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                       {monitor.current_is_up === 1 ? 'Operational' : 'Critical'}
                    </div>
                  </td>
                  <td className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                       <span className={cn("text-lg font-bold italic tabular-nums", (monitor.uptime_percent || 0) < 99 ? "text-rose-500" : "text-emerald-500")}>
                         {monitor.uptime_percent?.toFixed(2)}%
                       </span>
                        <div className="w-20 h-1 bg-line/10 rounded-full overflow-hidden">
                          <div className={cn("h-full", (monitor.uptime_percent || 0) < 99 ? "bg-rose-500" : "bg-emerald-500")} style={{ width: `${monitor.uptime_percent}%` }} />
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                       <span className="text-lg font-bold text-ink italic tabular-nums">
                         {monitor.last_response_time || '--'}<span className="text-[9px] ml-1 opacity-40 font-bold uppercase">ms</span>
                       </span>
                       <div className="w-24 h-5 opacity-40 group-hover:opacity-100 transition-opacity">
                          <Sparkline data={monitor.recent_pings?.slice(-15) || []} color={monitor.current_is_up === 1 ? "#10b981" : "#f43f5e"} />
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-8 text-right">
                     <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-4">
                       <Link 
                          to={`/app/monitors/${monitor.id}/edit`} 
                          onClick={(e) => e.stopPropagation()}
                          className="p-3 rounded-xl bg-line/10 text-ink/60 hover:text-primary transition-all"
                       >
                          <Edit2 className="size-4" />
                       </Link>
                       <button 
                          onClick={(e) => handleDelete(e, monitor.id)}
                          className="p-3 rounded-xl bg-line/10 text-ink/60 hover:text-rose-500 transition-all"
                       >
                          <Trash2 className="size-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registry Footer */}
      <footer className="pt-10 border-t border-line/20 flex flex-col md:flex-row items-center justify-between gap-8 py-10 opacity-50">
         <div className="text-[11px] font-bold text-ink/60 uppercase tracking-widest italic">
            &copy; 2026 KeepAlive Systems // Node Registry Core v4.2
         </div>
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <div className="size-1.5 rounded-full bg-emerald-500" />
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Asian Edge Cluster</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="size-1.5 rounded-full bg-blue-500" />
               <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Global Mesh Sync</span>
            </div>
         </div>
      </footer>
    </div>
  );
}
