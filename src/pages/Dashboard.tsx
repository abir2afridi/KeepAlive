import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, CheckCircle2, Gauge, ChevronRight, ChevronLeft, Server, Globe, CloudCog, Trash2, MoreVertical, Edit2 } from 'lucide-react';
import { cn } from '../components/Layout';

interface Monitor {
  id: string;
  name: string;
  url: string;
  type: string;
  current_is_up: number | null;
  last_response_time: number | null;
  uptime_percent: number | null;
  last_pinged_at: string | null;
  recent_pings: { response_time: number; is_up: number; created_at: string }[];
}

interface Stats {
  total_monitors: number;
  overall_uptime: number;
  avg_response_time: number;
}

export default function Dashboard() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [stats, setStats] = useState<Stats>({ total_monitors: 0, overall_uptime: 0, avg_response_time: 0 });
  const [loading, setLoading] = useState(true);

  // Get user from localStorage to construct status page link
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const statusSlug = user?.status_slug || '';

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [monitorsRes, statsRes] = await Promise.all([
        fetch('/api/monitors', { headers }),
        fetch('/api/stats', { headers })
      ]);
      const monitorsData = await monitorsRes.json();
      const statsData = await statsRes.json();
      setMonitors(monitorsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this monitor?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/monitors/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Failed to delete monitor', error);
    }
  };

  const getStatusColor = (isUp: number | null) => {
    if (isUp === null) return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    return isUp ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-rose-500 bg-rose-500/10 border-rose-500/20';
  };

  const getStatusDot = (isUp: number | null) => {
    if (isUp === null) return 'bg-slate-500';
    return isUp ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500';
  };

  const getMonitorIcon = (type: string) => {
    switch (type) {
      case 'Website': return <Globe className="size-5 text-slate-400" />;
      case 'API Endpoint': return <Server className="size-5 text-slate-400" />;
      case 'Supabase Keep-Alive': return <CloudCog className="size-5 text-slate-400" />;
      default: return <Activity className="size-5 text-slate-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="relative overflow-hidden bg-panel/70 backdrop-blur-2xl border border-line shadow-sm hover:shadow-lg hover:border-primary/40 p-6 rounded-3xl flex flex-col gap-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/20 transition-colors duration-500"></div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total Monitors</p>
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shadow-inner group-hover:scale-110 transition-transform">
              <Activity className="size-5 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.4)]" />
            </div>
          </div>
          <p className="text-5xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">{stats.total_monitors}</p>
        </div>

        <div className="relative overflow-hidden bg-panel/70 backdrop-blur-2xl border border-line shadow-sm hover:shadow-lg hover:border-emerald-500/40 p-6 rounded-3xl flex flex-col gap-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-500/20 transition-colors duration-500"></div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Overall Uptime</p>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-inner group-hover:scale-110 transition-transform">
              <CheckCircle2 className="size-5 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            </div>
          </div>
          <p className="text-5xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">{stats.overall_uptime.toFixed(2)}%</p>
        </div>

        <div className="relative overflow-hidden bg-panel/70 backdrop-blur-2xl border border-line shadow-sm hover:shadow-lg hover:border-amber-500/40 p-6 rounded-3xl flex flex-col gap-1 transition-all duration-300 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-amber-500/20 transition-colors duration-500"></div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Avg Response</p>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-inner group-hover:scale-110 transition-transform">
              <Gauge className="size-5 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
            </div>
          </div>
          <p className="text-5xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
            {Math.round(stats.avg_response_time)}
            <span className="text-xl font-medium text-slate-400 ml-1">ms</span>
          </p>
        </div>
      </div>

      {/* Active Monitors Table */}
      <div className="bg-panel/60 backdrop-blur-2xl border border-line shadow-lg hover:shadow-xl rounded-3xl overflow-hidden flex flex-col transition-all duration-500">
        <div className="p-6 object-cover border-b border-line flex items-center justify-between bg-slate-800/5 dark:bg-background-dark/30">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-700 dark:text-slate-200">Active Monitors</h2>
          <div className="flex gap-3">
            {statusSlug && (
              <Link to={`/status/${statusSlug}`} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest bg-slate-100/50 hover:bg-slate-200 dark:bg-slate-800/40 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 rounded-xl flex items-center gap-2 transition-all shadow-sm border border-line hover:border-slate-500/30">
                <Globe className="size-4" /> Status Page
              </Link>
            )}
            <button onClick={fetchData} className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest bg-slate-100/50 hover:bg-slate-200 dark:bg-slate-800/40 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 rounded-xl flex items-center gap-2 transition-all shadow-sm border border-line hover:border-slate-500/30">
              <Activity className="size-4" /> Refresh
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-800/10 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-bold border-b border-line">
              <tr>
                <th className="px-6 py-5 font-bold">Name & URL</th>
                <th className="px-6 py-5 font-bold">Status</th>
                <th className="px-6 py-5 font-bold text-center">Type</th>
                <th className="px-6 py-5 font-bold text-center">Uptime</th>
                <th className="px-6 py-5 font-bold">Last Ping</th>
                <th className="px-6 py-5 font-bold">Response</th>
                <th className="px-6 py-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-sm">
              {monitors.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium text-xs">
                    No monitors configured. Create one to get started.
                  </td>
                </tr>
              )}
              {monitors.map(monitor => (
                <tr key={monitor.id} className="hover:bg-slate-800/5 dark:hover:bg-slate-800/20 transition-colors group border-b border-line/40 last:border-0">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-[15px]">{monitor.name}</span>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[200px]">{monitor.url}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 flex items-center h-full">
                    <span className={cn("inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm", getStatusColor(monitor.current_is_up))}>
                      <span className={cn("size-2 rounded-full mr-2 shadow-inner", getStatusDot(monitor.current_is_up))}></span>
                      {monitor.current_is_up === null ? 'PENDING' : monitor.current_is_up ? 'ACTIVE' : 'DOWN'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="mx-auto w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100/50 dark:bg-slate-800/50 border border-line text-slate-400 group-hover:text-primary group-hover:border-primary/40 group-hover:shadow-[0_0_15px_rgba(var(--primary),0.1)] transition-all shadow-sm">
                      {getMonitorIcon(monitor.type)}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={cn("font-bold text-sm", monitor.uptime_percent && monitor.uptime_percent < 99 ? "text-rose-500" : "text-emerald-500")}>
                      {monitor.uptime_percent !== null ? `${monitor.uptime_percent.toFixed(1)}%` : '--'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1 text-[11px] font-medium">
                      <span className="text-slate-500 dark:text-slate-400">
                        {monitor.last_pinged_at ? new Date(monitor.last_pinged_at + 'Z').toLocaleTimeString() : 'NEVER'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex items-end gap-[3px] h-8 bg-slate-800/5 dark:bg-slate-900/30 p-1.5 rounded-lg shadow-inner">
                        {/* Sparkline bars */}
                        {Array.from({ length: 10 }).map((_, i) => {
                          const ping = monitor.recent_pings?.[i];
                          if (!ping) return <div key={i} className="w-1 h-1 bg-line rounded-sm"></div>;
                          
                          if (!ping.is_up) return <div key={i} className="w-1 h-full bg-rose-500 rounded-sm"></div>;
                          
                          // Calculate height based on response time (max 1000ms = full height)
                          const heightPercent = Math.min(100, Math.max(20, (ping.response_time / 1000) * 100));
                          
                          return (
                            <div 
                              key={i} 
                              className="w-[5px] bg-primary rounded-sm opacity-80 group-hover:opacity-100 hover:bg-primary/80 transition-all hover:scale-y-110"
                              style={{ height: `${Math.max(15, heightPercent)}%` }}
                            ></div>
                          );
                        })}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 w-12">
                        {monitor.last_response_time !== null ? `${monitor.last_response_time}ms` : '--'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link to={`/monitors/${monitor.id}/edit`} className="p-2.5 rounded-xl text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors shadow-sm" title="Edit Monitor">
                        <Edit2 className="size-4.5" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(monitor.id)}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors shadow-sm"
                        title="Delete Monitor"
                      >
                        <Trash2 className="size-4.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-5 bg-slate-800/10 dark:bg-slate-900/40 border-t border-line flex justify-between items-center">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Showing {monitors.length} monitors</span>
          <div className="flex gap-2">
            <button className="p-2 rounded-xl border border-line bg-panel/30 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-sm">
              <ChevronLeft className="size-4.5" />
            </button>
            <button className="p-2 rounded-xl border border-line bg-panel/30 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shadow-sm">
              <ChevronRight className="size-4.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
