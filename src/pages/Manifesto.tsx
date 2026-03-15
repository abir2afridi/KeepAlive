import React from 'react';
import { Zap, Globe, Shield, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Manifesto() {
  const features = [
    {
      icon: Zap,
      title: 'DoH Engine',
      description: 'Proprietary DNS-over-HTTPS (DoH) engine capable of parallel telemetry collection with sub-millisecond precision.',
      color: 'text-primary',
      bg: 'bg-primary/5',
      border: 'border-primary/20'
    },
    {
      icon: Globe,
      title: 'Global Node Matrix',
      description: 'Distributed network of 300+ recursive resolvers mapped across 96+ geographical clusters for absolute accuracy.',
      color: 'text-blue-400',
      bg: 'bg-blue-400/5',
      border: 'border-blue-400/20'
    },
    {
      icon: Shield,
      title: 'Integrity Protocol',
      description: 'Transparent benchmarking focusing on decentralized performance and user-centric data privacy.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/5',
      border: 'border-emerald-400/20'
    },
    {
      icon: Activity,
      title: 'Live Telemetry',
      description: 'Interactive spatial visualization of network latency using high-fidelity Mercator projection mapping.',
      color: 'text-amber-400',
      bg: 'bg-amber-400/5',
      border: 'border-amber-400/20'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      className="max-w-5xl mx-auto space-y-16 transition-all duration-700 pb-12 pt-8"
    >
      <div className="space-y-24">
        {/* 01. Briefing */}
        <div className="space-y-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Activity className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">System Briefing</span>
          </div>
          <div className="space-y-4">
            <h2 className="text-6xl font-extralight tracking-tighter text-ink lowercase">Netpulse</h2>
            <p className="max-w-xl mx-auto text-sm text-ink/70 font-medium leading-relaxed italic">
              "A high-precision telemetry engine designed to bridge the gap between raw global networking and human-centric infrastructure."
            </p>
          </div>
        </div>

        {/* 02. Feature Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className={`p-10 rounded-3xl bg-panel border ${feature.border} space-y-6 hover:translate-y-[-4px] transition-all duration-500 shadow-sm hover:shadow-md`}>
              <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center border ${feature.border}`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-ink">{feature.title}</h3>
                <p className="text-[11px] text-ink/60 leading-relaxed font-semibold">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 03. Operational Handbook */}
        <div className="space-y-12">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-line/40" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-ink/40 italic">Operational Handbook</h3>
            <div className="h-px flex-1 bg-line/40" />
          </div>

          <div className="grid grid-cols-1 gap-12">
            {/* Monitor Types Section */}
            <div className="space-y-8">
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-ink italic tracking-tight">01. Monitor Architectures</h4>
                <p className="text-xs text-ink/60 italic leading-relaxed">Our telemetry engine supports four primary observation modes designed for high-availability infrastructures.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-8 bg-panel/40 border border-line/40 rounded-3xl space-y-4">
                  <div className="text-primary font-black text-xs tracking-widest uppercase italic">HTTP / HTTPS</div>
                  <p className="text-[11px] text-ink/70 leading-relaxed font-medium italic">
                    Monitors standard web endpoints. It validates SSL handshakes, tracks Time-to-First-Byte (TTFB), and ensures your web server is returning 2xx or 3xx status codes.
                  </p>
                </div>
                <div className="p-8 bg-panel/40 border border-line/40 rounded-3xl space-y-4">
                  <div className="text-blue-400 font-black text-xs tracking-widest uppercase italic">TCP (Port) Monitoring</div>
                  <p className="text-[11px] text-ink/70 leading-relaxed font-medium italic">
                    Low-level socket connectivity. Used for checking databases (Postgres, Redis), mail servers (SMTP), or custom APIs that don't use standard HTTP protocols.
                  </p>
                </div>
                <div className="p-8 bg-panel/40 border border-line/40 rounded-3xl space-y-4">
                  <div className="text-emerald-400 font-black text-xs tracking-widest uppercase italic">SSL Certificate Watch</div>
                  <p className="text-[11px] text-ink/70 leading-relaxed font-medium italic">
                    Observes your encryption pipeline. It calculates the remaining lifecycle of your SSL certificates and triggers warnings weeks before an expiration occurs.
                  </p>
                </div>
                <div className="p-8 bg-panel/40 border border-line/40 rounded-3xl space-y-4">
                  <div className="text-amber-400 font-black text-xs tracking-widest uppercase italic">Supabase Sync</div>
                  <p className="text-[11px] text-ink/70 leading-relaxed font-medium italic">
                    Specialized integration for Supabase. It verifies the health of your edge functions and database pooling, ensuring your backend is proactive and responsive.
                  </p>
                </div>
              </div>
            </div>

            {/* The 3-Strike Rule Section */}
            <div className="bg-slate-900 border border-white/10 p-12 rounded-[3.5rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8">
                <Shield className="size-24 text-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
              </div>
              <div className="relative z-10 space-y-6">
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold text-white italic tracking-tighter uppercase">The 3-Strike Protocol</h4>
                  <p className="text-xs text-white/50 italic font-medium leading-relaxed max-w-lg">
                    To eliminate false positives caused by transient internet noise, our system utilizes a confirmed-incident algorithm.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                  <div className="space-y-2">
                    <div className="text-[10px] font-black text-primary uppercase italic">01. Observation</div>
                    <p className="text-[11px] text-white/40 italic">A ping fails. The telemetry system records the fault but keeps the monitor in the <span className="text-amber-400">AMBER</span> (Degraded) state.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] font-black text-primary uppercase italic">02. Verification</div>
                    <p className="text-[11px] text-white/40 italic">The scheduler queues an immediate re-check. A second failure triggers high-priority observation.</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-[10px] font-black text-primary uppercase italic">03. Confirmation</div>
                    <p className="text-[11px] text-white/40 italic">After the third consecutive failure, the system confirms a <span className="text-rose-500">DOWN</span> incident and broadcasts alerts across all channels.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Terminology */}
            <div className="space-y-8">
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-ink italic tracking-tight">02. Intelligence Indicators</h4>
                <p className="text-xs text-ink/60 italic leading-relaxed">Understanding the metrics on your command center dashboard.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-primary" />
                    <span className="text-[10px] font-black uppercase text-ink/80 italic">Velocity (ms)</span>
                  </div>
                  <p className="text-[11px] text-ink/60 italic">Latency measured from our nearest geographical node. Lower velocity indicates better user proximity and server responsiveness.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black uppercase text-ink/80 italic">Stability Index</span>
                  </div>
                  <p className="text-[11px] text-ink/60 italic">A roll-up metric of uptime over the last 24 hours. Anything above 99.9% is considered nominal.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-black uppercase text-ink/80 italic">Telemetry stream</span>
                  </div>
                  <p className="text-[11px] text-ink/60 italic">The live history of pings. It provides deep visibility into intermittent packet loss or performance spikes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 04. Core Objective */}
        <div className="p-16 rounded-[4rem] bg-gradient-to-br from-primary/5 via-transparent to-transparent border border-line relative overflow-hidden">
          <div className="relative z-10 space-y-8">
            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Operational Goal</h3>
              <p className="text-xl font-light text-ink/90 leading-relaxed italic">
                To provide the definitive lens for observing the internet's pulse—ensuring transparency, speed, and reliability across the decentralized web.
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="space-y-1">
                <p className="text-[8px] font-bold text-ink/40 uppercase tracking-widest">Version</p>
                <p className="text-[10px] font-black text-ink/80 uppercase">4.0.2 Stable Alpha</p>
              </div>
              <div className="w-px h-6 bg-line" />
              <div className="space-y-1">
                <p className="text-[8px] font-bold text-ink/40 uppercase tracking-widest">Network</p>
                <p className="text-[10px] font-black text-ink/80 uppercase">Global Node Matrix Active</p>
              </div>
            </div>
          </div>
          <div className="absolute top-1/2 right-[-10%] translate-y-[-50%] opacity-[0.03] pointer-events-none">
            <Globe className="w-96 h-96 text-ink" />
          </div>
        </div>

        {/* 05. Footer Note */}
        <div className="text-center pt-8">
          <p className="text-[10px] font-bold text-ink/30 uppercase tracking-[0.5em]">
            Designed for the decentralized era — EST. 2026
          </p>
        </div>
      </div>
    </motion.div>
  );
}
