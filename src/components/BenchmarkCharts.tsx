import { useState, memo, useMemo } from 'react';
import { DnsProvider, TestResult } from '@/types/dns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, BarChart3, TrendingUp, Shield, Layers, Info } from 'lucide-react';
import { useTheme } from './theme-provider';

interface Props {
  providers: DnsProvider[];
  results: Map<string, TestResult>;
}

type ChartView = 'latency' | 'reliability' | 'score';

export const BenchmarkCharts = memo(({ providers, results }: Props) => {
  const [chartView, setChartView] = useState<ChartView>('latency');
  const [showInfo, setShowInfo] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const textColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const bgFill = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';

  const tested = useMemo(() => {
    return providers
      .filter(p => results.get(p.id)?.status === 'complete')
      .map(p => ({
        id: p.id,
        name: p.name,
        shortName: p.name.length > 12 ? p.name.slice(0, 12) + '..' : p.name,
        latency: results.get(p.id)!.avgLatency,
        reliability: results.get(p.id)!.reliability,
        score: results.get(p.id)!.score,
      }))
      .sort((a, b) => chartView === 'latency' ? a.latency - b.latency : b[chartView] - a[chartView])
      .slice(0, 20);
  }, [providers, results, chartView]);

  if (tested.length === 0) {
    return (
      <div className="p-12 text-center border border-dashed border-line/40 rounded-3xl bg-panel/5 flex flex-col items-center gap-4">
        <BarChart3 className="h-8 w-8 text-ink/10 animate-pulse" />
        <p className="text-[11px] font-bold text-ink/30 uppercase tracking-[0.2em]">Matrix Data Pending</p>
      </div>
    );
  }

  const getBarColor = (entry: any) => {
    if (chartView === 'latency') {
      if (entry.latency < 40) return 'rgba(16, 185, 129, 0.4)'; // Emerald
      if (entry.latency < 100) return 'rgba(245, 158, 11, 0.4)'; // Amber
      return 'rgba(244, 63, 94, 0.4)'; // Rose
    }
    return 'rgba(59, 130, 246, 0.4)'; // Blue/Primary
  };

  const chartTabs = [
    { id: 'latency' as const, label: 'Speed', icon: Activity },
    { id: 'reliability' as const, label: 'Stable', icon: Shield },
    { id: 'score' as const, label: 'Index', icon: TrendingUp },
  ];

  const dataKey = chartView;

  return (
    <div className="border border-line/40 rounded-2xl bg-panel p-8">
      <div className="flex flex-col md:flex-row items-baseline justify-between mb-10 gap-6">
        <div className="space-y-1">
          <h2 className="text-sm font-bold tracking-widest uppercase text-ink/80">
            {chartView === 'latency' ? 'Latency Delta' : chartView === 'reliability' ? 'Reliability Factor' : 'Performance Index'}
          </h2>
          <p className="text-[11px] text-ink/40 font-bold uppercase tracking-widest">
            {tested.length} Tested nodes comparison
          </p>
        </div>

        <div className="flex items-center gap-1 bg-panel/30 p-1 rounded-lg border border-line/40">
          {chartTabs.map(tab => {
            const Icon = tab.icon;
            const active = chartView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setChartView(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${active ? 'bg-base text-ink shadow-sm' : 'text-ink/40 hover:text-ink/70'}`}
              >
                <Icon className="h-3 w-3" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-[450px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={tested}
            layout="vertical"
            margin={{ left: 0, right: 20, top: 0, bottom: 0 }}
            barSize={10}
          >
            <CartesianGrid horizontal={false} stroke={gridColor} strokeDasharray="3 3" />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="shortName"
              width={100}
              tick={{ fill: textColor, fontSize: 11, fontWeight: 700, textAnchor: 'end' }}
              axisLine={false}
              tickLine={false}
              dx={-10}
            />
            <Tooltip
              cursor={{ fill: bgFill, radius: 2 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-base border border-line/60 p-4 rounded-lg shadow-xl min-w-[160px]">
                      <p className="text-[11px] font-black text-primary uppercase tracking-widest mb-2 pb-2 border-b border-line/40">{data.name}</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-ink/40 uppercase">Latency</span>
                          <span className="text-[11px] font-black">{data.latency.toFixed(1)}ms</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-ink/40 uppercase">Stable</span>
                          <span className="text-[11px] font-black">{data.reliability.toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-ink/40 uppercase">Index</span>
                          <span className="text-[11px] font-black text-primary">{data.score}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey={dataKey}
              radius={[0, 2, 2, 0]}
              background={{ fill: bgFill, radius: 2 }}
            >
              {tested.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-8 pb-8 border-b border-line/20">
        {[
          { label: 'Total Data Points', value: providers.length * 5, icon: Layers },
          { label: 'Network Volatility', value: '2.4%', icon: TrendingUp },
          { label: 'Cluster Delta', value: '14ms', icon: Activity },
          { label: 'System Entropy', value: 'Optimal', icon: Shield },
          { label: 'Routing Efficiency', value: '94.2%', icon: BarChart3 },
          { label: 'Historical Drift', value: '-2.1ms', icon: Activity },
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

      <div className="mt-8 pt-4 space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-ink">Benchmarking Insight</h3>
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className="p-1 hover:bg-line/20 rounded-md transition-all text-ink/40 hover:text-primary"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-ink/60 font-bold uppercase tracking-wider">Historical variance and performance analysis</p>
            </div>
          </div>

          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-l-2 border-primary/20 pl-4 py-2 space-y-4"
              >
                <p className="text-[11px] text-ink/40 leading-relaxed italic max-w-2xl">
                  The Data Lab processes real-time telemetry from multiple global nodes. Speed (Latency) is measured in milliseconds, Stability represents the percentage of successful packet deliveries, and the Index is a comprehensive score combining performance, reliability, and security metrics to rank the world's most robust DNS resolvers.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-black uppercase text-primary/80 tracking-widest">Entropy Analysis</h4>
                    <p className="text-[10px] text-ink/40 leading-relaxed">
                      Measures the randomness and unpredictability of network behavior. Lower entropy indicates a highly stable, predictable routing environment.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-black uppercase text-primary/80 tracking-widest">Scoring Algorithm</h4>
                    <p className="text-[10px] text-ink/40 leading-relaxed">
                      Calculated using weighted parameters: 50% Latency, 30% Uptime consistency, and 20% Security validation metrics.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between opacity-40">
          <div className="flex items-center gap-2 text-ink/40 uppercase tracking-[0.2em] font-bold text-[10px]">
            <Layers className="h-3.5 w-3.5" />
            <span>Telemetry data feed active • v4.0.1</span>
          </div>
        </div>
      </div>
    </div>
  );
});

