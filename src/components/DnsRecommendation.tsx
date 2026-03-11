import { DnsProvider, TestResult } from '@/types/dns';
import { motion } from 'framer-motion';
import { Trophy, Zap, Shield, Sparkles, Cpu } from 'lucide-react';

interface Props {
  topResults: TestResult[];
  providers: DnsProvider[];
  onSelect: (provider: DnsProvider) => void;
}

const medals = [
  { icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/5', border: 'border-amber-500/10', label: 'OPTIMAL' },
  { icon: Zap, color: 'text-slate-400', bg: 'bg-slate-400/5', border: 'border-slate-400/10', label: 'VELOCITY' },
  { icon: Shield, color: 'text-orange-500/80', bg: 'bg-orange-500/5', border: 'border-orange-500/10', label: 'STABLE' },
];

export function DnsRecommendation({ topResults, providers, onSelect }: Props) {
  if (topResults.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden glass-card p-6 sm:p-8 border-line/50 bg-gradient-to-br from-card via-card to-primary/[0.02] rounded-[2rem] shadow-xl"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/70 block">Neural Optimization Insights</span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-ink flex items-center gap-3">
            Top Spatial Resolvers
          </h2>
          <p className="text-[10px] text-ink/60 uppercase tracking-widest mt-1 font-bold opacity-60">Verified recursive resolvers for your current spatial node.</p>
        </div>

        <div className="flex items-center gap-3 bg-panel/30 backdrop-blur-xl px-4 py-2 rounded-xl border border-line shadow-sm">
          <div className="relative">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <div className="absolute top-0 left-0 w-2 h-2 bg-emerald-500 rounded-full" />
          </div>
          <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Active Scan</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {topResults.slice(0, 3).map((result, i) => {
          const provider = providers.find(p => p.id === result.providerId);
          if (!provider) return null;
          const Medal = medals[i];

          return (
            <motion.div
              key={result.providerId}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 200, damping: 25 }}
              onClick={() => onSelect(provider)}
              className={`group relative p-6 rounded-[1.5rem] border ${Medal.border} ${Medal.bg} cursor-pointer hover:bg-accent/5 transition-all duration-300 overflow-hidden`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className={`p-3 rounded-xl bg-base/80 border ${Medal.border} group-hover:scale-105 transition-transform duration-300 shadow-sm`}>
                  <Medal.icon className={`h-5 w-5 ${Medal.color}`} />
                </div>
                <div className="text-right">
                  <span className={`text-[9px] font-black font-mono tracking-widest ${Medal.color} block mb-1 opacity-80 uppercase`}>{Medal.label}</span>
                  <div className={`h-1 w-12 ml-auto rounded-full bg-current opacity-20 ${Medal.color}`} />
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <h3 className="font-bold text-lg text-ink group-hover:text-primary transition-colors duration-300 truncate">{provider.name}</h3>
                <div className="flex items-center gap-2">
                  <Cpu className="w-3 h-3 text-ink/40" />
                  <p className="text-[9px] text-ink/60 font-mono uppercase tracking-wider font-bold truncate opacity-60">{provider.organization}</p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-line/40 pt-5">
                <div>
                  <div className={`text-2xl font-black font-mono tracking-tighter text-ink group-hover:${Medal.color} transition-colors`}>
                    {result.avgLatency.toFixed(1)}<span className="text-[10px] font-bold opacity-30 ml-1 uppercase">ms</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black font-mono text-ink/80">{result.score}</div>
                  <div className="flex items-center gap-1.5 justify-end mt-1">
                    <span className="text-[8px] font-bold font-mono text-ink/40 uppercase tracking-widest">P-IDX</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
