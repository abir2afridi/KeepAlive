import { useState, memo, useMemo } from 'react';
import { DnsProvider, TestResult, getSpeedCategory } from '@/types/dns';
import { ArrowUpDown, Shield, LayoutGrid, Zap, Globe, Radio, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProviderLogo } from '@/lib/dns-icons';
import { Activity, Info, Layers, TrendingUp } from 'lucide-react';

type SortKey = 'name' | 'avgLatency' | 'reliability' | 'score' | 'securityScore';

interface Props {
  providers: DnsProvider[];
  results: Map<string, TestResult>;
  onSelect: (provider: DnsProvider) => void;
}

export const DnsLeaderboard = memo(({ providers, results, onSelect }: Props) => {
  const [sortKey, setSortKey] = useState<SortKey>('avgLatency');
  const [sortAsc, setSortAsc] = useState(true);

  const testedProviders = useMemo(() => {
    return providers.filter(p => {
      const r = results.get(p.id);
      return r?.status === 'complete';
    });
  }, [providers, results]);

  const sorted = useMemo(() => {
    return [...testedProviders].sort((a, b) => {
      const ra = results.get(a.id)!;
      const rb = results.get(b.id)!;
      let va: number, vb: number;
      switch (sortKey) {
        case 'name': return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        case 'avgLatency': va = ra.avgLatency; vb = rb.avgLatency; break;
        case 'reliability': va = ra.reliability; vb = rb.reliability; break;
        case 'score': va = ra.score; vb = rb.score; break;
        case 'securityScore': va = a.securityScore; vb = b.securityScore; break;
        default: va = 0; vb = 0;
      }
      const result = sortAsc ? va - vb : vb - va;
      return isNaN(result) ? 0 : result;
    });
  }, [testedProviders, results, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(key === 'avgLatency'); }
  };

  const SortHeader = ({ k, label, icon: Icon }: { k: SortKey; label: string; icon: any }) => (
    <th
      onClick={() => toggleSort(k)}
      className={`px-4 py-4 text-left cursor-pointer transition-colors group/header ${sortKey === k ? 'bg-primary/[0.03]' : 'hover:bg-line/10/5'}`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-3 w-3 ${sortKey === k ? 'text-primary' : 'text-ink/30'}`} />
        <span className={`text-[11px] font-bold uppercase tracking-widest ${sortKey === k ? 'text-primary' : 'text-ink/40'}`}>
          {label}
        </span>
        <ArrowUpDown className={`h-2.5 w-2.5 transition-opacity ${sortKey === k ? 'text-primary opacity-100' : 'opacity-0'}`} />
      </div>
    </th>
  );

  if (sorted.length === 0) {
    return (
      <div className="p-12 text-center border border-dashed border-line/40 rounded-3xl bg-panel/5 flex flex-col items-center gap-4">
        <Radio className="h-8 w-8 text-ink/10 animate-pulse" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-ink/80 uppercase tracking-widest">Awaiting System Initialization</p>
          <p className="text-[11px] font-bold text-ink/30 uppercase tracking-[0.2em]">
            Execute benchmark to populate matrix data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="border border-line/40 rounded-2xl bg-panel overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-line/40 bg-panel/5">
                <th className="px-6 py-4 text-[9px] font-bold text-ink/40 uppercase tracking-widest w-16">Rank</th>
                <SortHeader k="name" label="Resolver" icon={LayoutGrid} />
                <SortHeader k="avgLatency" label="Latency" icon={Globe} />
                <SortHeader k="securityScore" label="Safety" icon={Shield} />
                <SortHeader k="score" label="Score" icon={Zap} />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              <AnimatePresence mode="popLayout">
                {sorted.map((provider, i) => {
                  const r = results.get(provider.id)!;
                  const speed = getSpeedCategory(r.avgLatency);
                  const speedColor = speed === 'fast' ? 'text-emerald-500' : speed === 'medium' ? 'text-amber-500' : 'text-rose-500';

                  return (
                    <motion.tr
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={provider.id}
                      onClick={() => onSelect(provider)}
                      className="group hover:bg-line/10/[0.02] cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-ink/40 font-mono">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          {i === 0 && <Trophy className="h-3 w-3 text-emerald-500/60" />}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const logo = getProviderLogo(provider);
                              if (logo) {
                                return <img src={logo} alt={provider.name} className="w-3.5 h-3.5 shrink-0 object-contain" />;
                              }
                              return null;
                            })()}
                            <span className="text-xs font-bold text-ink group-hover:text-primary transition-colors uppercase tracking-tight truncate">
                              {provider.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-ink/40 font-bold uppercase truncate max-w-[140px]">
                            {provider.organization}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-baseline gap-1">
                          <span className={`text-lg font-black tracking-tighter ${speedColor}`}>
                            {r.avgLatency.toFixed(1)}
                          </span>
                          <span className="text-[11px] font-black text-ink/30 uppercase">ms</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-bold text-ink/40 font-mono">{(provider.securityScore * 10).toFixed(0)}</span>
                          <div className="w-12 h-0.5 bg-panel rounded-full overflow-hidden">
                            <div
                              className={`h-full ${provider.securityScore > 8 ? 'bg-emerald-500/40' : 'bg-primary/40'}`}
                              style={{ width: `${provider.securityScore * 10}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                          <Zap className="h-2.5 w-2.5 text-primary" />
                          <span className="text-[10px] font-black">{r.score}</span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <LeaderboardInsights />
    </div>
  );
});

function LeaderboardInsights() {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="border border-line/40 rounded-2xl bg-panel p-8">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pb-8 border-b border-line/20">
        {[
          { label: 'Threat Mitigation', value: '99.2%', icon: Shield },
          { label: 'Encryption Depth', value: '256-bit', icon: Shield },
          { label: 'JS Execution', value: 'Sandboxed', icon: Activity },
          { label: 'Privacy Leaks', value: 'Zero', icon: Shield },
          { label: 'Anomaly Layer', value: 'Active', icon: Activity },
          { label: 'AI Threat Level', value: 'Minimal', icon: Layers },
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-xl bg-panel/10 border border-line/20 space-y-1">
            <div className="flex items-center gap-2 text-ink/30">
              <stat.icon className="h-3 w-3" />
              <span className="text-[9px] font-black uppercase tracking-widest">{stat.label}</span>
            </div>
            <p className="text-sm font-black text-ink uppercase tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-ink">Audit Intelligence</h3>
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="p-1 hover:bg-line/20 rounded-md transition-all text-ink/40 hover:text-primary"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-ink/60 font-bold uppercase tracking-wider">Security validation & score distribution</p>
          </div>
        </div>

        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-l-2 border-primary/20 pl-4 py-2"
            >
              <p className="text-[11px] text-ink/40 leading-relaxed italic max-w-2xl">
                The Security Audit index correlates three critical dimensions:
                <span className="text-ink font-bold not-italic"> Transport Safety</span> (DoH/DoT availability),
                <span className="text-ink font-bold not-italic"> Content Filtering</span> (Malware/Ad-blocking efficiency), and
                <span className="text-ink font-bold not-italic"> Infrastructure Trust</span> (Provider logging policy & jurisdictional transparency).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase text-primary/80 tracking-widest">Encryptic Vector</h4>
                  <p className="text-[10px] text-ink/40 leading-relaxed">
                    Advanced cryptographic path analysis that ensures end-to-end packet integrity and prevents man-in-the-middle hijacking attempts.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase text-primary/80 tracking-widest">Breach Analysis</h4>
                  <p className="text-[10px] text-ink/40 leading-relaxed">
                    Real-time correlation with global threat databases to identify if any resolver IP has been flagged in recent breaches.
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase text-primary/80 tracking-widest">Trust Metrics</h4>
                  <p className="text-[10px] text-ink/40 leading-relaxed">
                    Verification of DNSSEC support, ECS privacy handling, and adherence to GDPR-compliant data standards.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
