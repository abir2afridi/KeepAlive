import { Globe2, Server, ShieldPlus, BarChart3, Wifi } from 'lucide-react';
import { cn } from '../Layout';

export function SystemDistribution({ stats }: { stats: any }) {
  const regions = [
    { name: 'North America', nodes: 8, status: 'Optimal', latency: '40ms' },
    { name: 'Europe', nodes: 12, status: 'Optimal', latency: '28ms' },
    { name: 'Asia Pacific', nodes: 6, status: 'Stable', latency: '110ms' },
  ];

  const categories = [
    { label: 'Total Requests', value: '1.2M+', icon: Server, color: 'text-primary' },
    { label: 'Reliability', value: '99.98%', icon: ShieldPlus, color: 'text-emerald-500' },
    { label: 'Global Coverage', value: '28 Regions', icon: Globe2, color: 'text-blue-500' },
    { label: 'Uptime Index', value: '0.9995', icon: BarChart3, color: 'text-amber-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Metrics Grid - Optimized for Sidebar Column */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {categories.map((cat, i) => (
          <div key={i} className="bg-panel border border-line/40 rounded-[24px] p-6 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <cat.icon className={cn("size-5 mb-4 group-hover:scale-110 transition-transform", cat.color)} />
            <h4 className="text-[10px] font-black text-ink/40 uppercase tracking-[0.2em] italic mb-1">{cat.label}</h4>
            <div className="text-xl font-black italic text-ink">{cat.value}</div>
          </div>
        ))}
      </div>

      {/* Regional Table */}
      <div className="bg-panel border border-line/40 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-3">
              <div className="size-1 w-8 bg-primary rounded-full" />
              <h4 className="text-xs font-bold text-ink uppercase tracking-[0.3em] italic">Regional Propagation Status</h4>
           </div>
           <Wifi className="size-4 text-emerald-500 animate-pulse" />
        </div>
        
        <div className="space-y-4">
           {regions.map((region, i) => (
             <div key={i} className="flex items-center justify-between py-4 border-b last:border-0 border-line/20 group cursor-default">
                <div className="flex items-center gap-4">
                   <div className="size-10 rounded-2xl bg-ink/5 flex items-center justify-center shrink-0 border border-line/30 group-hover:border-primary/40 transition-colors">
                      <span className="text-[10px] font-black text-ink/60 uppercase group-hover:text-primary">{region.name.slice(0, 2)}</span>
                   </div>
                   <div className="space-y-1">
                      <h5 className="text-sm font-bold text-ink italic uppercase tracking-tight">{region.name}</h5>
                      <span className="text-[9px] font-bold text-ink/40 uppercase tracking-widest italic">{region.nodes} Edge Nodes Active</span>
                   </div>
                </div>
                
                <div className="flex items-center gap-10">
                   <div className="text-right">
                      <div className="text-[14px] font-black text-ink tabular-nums italic uppercase">{region.latency}</div>
                      <div className="text-[9px] font-bold text-ink/40 uppercase tracking-widest italic">Latency</div>
                   </div>
                   <div className="flex items-center gap-2 min-w-[80px] justify-end">
                      <div className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest italic">{region.status}</span>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>

    </div>
  );
}
