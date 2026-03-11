import { motion } from 'framer-motion';
import { Activity, CheckCircle2, Timer } from 'lucide-react';

interface Props {
  completed: number;
  total: number;
  isRunning: boolean;
}

export function TestProgress({ completed, total, isRunning }: Props) {
  if (!isRunning && completed === 0) return null;

  const pct = total > 0 ? (completed / total) * 100 : 0;
  const isComplete = completed === total && total > 0;

  return (
    <div className="glass-card p-5 relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
        <div className="flex items-center gap-4 shrink-0">
          <div className={`p-2.5 rounded-xl transition-all duration-500 ${isComplete ? 'bg-emerald-500/10' : 'bg-primary/10'}`}>
            {isComplete ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <Activity className="h-5 w-5 text-primary animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink tracking-tight">
              {isRunning ? 'Analyzing Nodes' : isComplete ? 'Benchmark Complete' : 'Preparing...'}
            </h3>
            <div className="flex items-center gap-1.5 opacity-60">
              <Timer className="h-3 w-3" />
              <span className="text-[10px] font-medium uppercase tracking-widest">Real-time Metrics</span>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-bold text-ink/60 uppercase tracking-widest opacity-60">
              Process Stability
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isComplete ? 'text-emerald-500 bg-emerald-500/10' : 'text-primary bg-primary/10'}`}>
                {pct.toFixed(0)}%
              </span>
              <span className="text-xs font-bold text-ink">
                {completed} <span className="text-ink/40 font-medium">/ {total}</span>
              </span>
            </div>
          </div>

          <div className="h-1.5 bg-panel/50 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-primary'}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
