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

        {/* 03. Core Objective */}
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
                <p className="text-[10px] font-black text-ink/80 uppercase">4.0.1 Stable Alpha</p>
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

        {/* 04. Footer Note */}
        <div className="text-center pt-8">
          <p className="text-[10px] font-bold text-ink/30 uppercase tracking-[0.5em]">
            Designed for the decentralized era — EST. 2026
          </p>
        </div>
      </div>
    </motion.div>
  );
}
