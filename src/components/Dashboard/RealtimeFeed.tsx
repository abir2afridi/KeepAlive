import { useState, useEffect } from 'react';
import { Terminal, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogEntry {
  id: string;
  timestamp: string;
  event: string;
  status: 'up' | 'down' | 'error';
  target: string;
  latency?: number;
}

export function RealtimeFeed({ monitors }: { monitors: any[] }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (monitors.length === 0) return;

    // Simulate initial logs from existing monitors
    const initialLogs: LogEntry[] = monitors.slice(0, 5).map(m => ({
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      event: 'STATUS_CHECK',
      status: m.current_is_up === 1 ? 'up' : 'down',
      target: m.name,
      latency: m.last_response_time || 0
    }));
    setLogs(initialLogs);

    // Simulate real-time updates
    const interval = setInterval(() => {
      const randomMonitor = monitors[Math.floor(Math.random() * monitors.length)];
      if (!randomMonitor) return;

      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        event: 'PING_SUCCESS',
        status: 'up',
        target: randomMonitor.name,
        latency: Math.floor(Math.random() * 200) + 20
      };

      setLogs(prev => [newLog, ...prev].slice(0, 10));
    }, 4000);

    return () => clearInterval(interval);
  }, [monitors]);

  return (
    <div className="bg-[#050609] border border-white/5 rounded-3xl overflow-hidden flex flex-col h-[400px] shadow-2xl relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Terminal Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/2 relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="size-2.5 rounded-full bg-rose-500/20 border border-rose-500/40" />
            <div className="size-2.5 rounded-full bg-amber-500/20 border border-amber-500/40" />
            <div className="size-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/40" />
          </div>
          <div className="h-4 w-px bg-white/10 mx-1" />
          <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
            <Terminal className="size-3 text-primary" />
            Command Center / Live Telemetry
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-widest">Live Stream</span>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 overflow-y-auto p-6 font-mono relative z-10 scrollbar-hide">
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10, filter: 'blur(8px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: 10, filter: 'blur(8px)' }}
                className="flex items-start gap-4 text-[10px] leading-relaxed group/item"
              >
                <span className="text-white/20 whitespace-nowrap">[{log.timestamp}]</span>
                <span className="text-primary/60 font-bold whitespace-nowrap">{log.event}</span>
                <span className="text-white/80 font-medium whitespace-nowrap min-w-[100px]">{log.target}</span>
                <div className="flex items-center gap-2">
                  {log.status === 'up' ? (
                    <CheckCircle2 className="size-3 text-emerald-500" />
                  ) : (
                    <AlertCircle className="size-3 text-rose-500" />
                  )}
                  <span className={log.status === 'up' ? 'text-emerald-500/80 font-bold' : 'text-rose-500/80 font-bold'}>
                    {log.status.toUpperCase()}
                  </span>
                </div>
                {log.latency && (
                  <span className="text-white/30 italic ml-auto group-hover/item:text-primary/60 transition-colors">
                    latency={log.latency}ms
                  </span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {logs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 gap-4">
              <Activity className="size-8 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Signal...</span>
            </div>
          )}
        </div>
      </div>

      {/* Terminal Footer */}
      <div className="px-6 py-3 border-t border-white/5 bg-black/40 backdrop-blur-md relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[9px] font-bold text-white/30 uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-primary" />
            TCP/SSL
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-1 rounded-full bg-primary" />
            Edge-V4
          </div>
        </div>
        <div className="text-[9px] font-black text-white/20 italic">
          KEEP-ALIVE // CORE-ENGINE v4.0.0
        </div>
      </div>
    </div>
  );
}
