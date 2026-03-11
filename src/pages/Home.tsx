import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, ShieldCheck, Zap, Globe, ArrowRight, 
  BarChart3, Bell, CheckCircle2, Cpu, Signal, Lock, Network,
  Search, Database, Terminal, Layers, Star, Play, ChevronRight,
  Monitor, Cpu as Processor, Database as ServerIcon, Radio, Wifi,
  TrendingUp, Terminal as TerminalIcon, Activity as PulseIcon
} from 'lucide-react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const tickerData = [
  { label: "Node JS-01", value: "Active", type: "success" },
  { label: "Global Latency", value: "24ms Avg", type: "status" },
  { label: "Supabase Core", value: "Operational", type: "success" },
  { label: "Alert", value: "High Traffic Node EU-W", type: "alert" },
  { label: "DNS Resolve", value: "Cloudflare 12ms", type: "status" },
  { label: "Data Integrity", value: "Verified 100%", type: "success" },
  { label: "Encryption", value: "AES-256 Active", type: "status" },
  { label: "Node SG-04", value: "Syncing...", type: "alert" },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div ref={containerRef} className="bg-[#382370] text-[#FFFFFF] font-sans selection:bg-[#5551FF]/30 selection:text-[#5551FF] overflow-x-hidden">
      {/* Cinematic Visual Architecture */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Deep Field Perspective */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(85,81,255,0.08)_0%,transparent_70%)] opacity-60" />
        
        {/* Vector Grid System */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_90%)]" />
        
        {/* Animated Horizon Line */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>

      {/* Ultra-Minimal Command Header */}
      <nav className="fixed top-0 inset-x-0 z-[100] h-16 flex items-center justify-between px-10 border-b border-white/5 bg-[#382370]/80 backdrop-blur-md">
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="size-8 bg-white flex items-center justify-center group-hover:bg-[#5551FF] transition-colors duration-500">
            <Network className="size-4 text-black group-hover:text-white transition-colors" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-black tracking-[0.3em] uppercase leading-none">Netpulse</div>
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] mt-1">Core System</div>
          </div>
        </div>

        <div className="flex items-center gap-12">
          <div className="hidden lg:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
            <a href="#pulse" className="hover:text-white transition-all">Pulse</a>
            <a href="#matrix" className="hover:text-white transition-all">Matrix</a>
            <a href="#lab" className="hover:text-white transition-all">Lab</a>
          </div>
          
        <div className="flex items-center gap-4">
            <Link to="/auth" className="px-8 py-3 bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#5551FF] hover:text-white transition-all duration-500">
              Initialize
            </Link>
          </div>
        </div>
      </nav>

      {/* Global Live Ticker Strip */}
      <div className="fixed top-16 inset-x-0 z-[90] h-10 border-b border-white/5 bg-[#382370]/60 backdrop-blur-xl flex items-center overflow-hidden">
         <div className="flex whitespace-nowrap animate-marquee items-center gap-12">
            {tickerData.map((item, i) => (
               <div key={i} className="flex items-center gap-4 px-6 border-r border-white/5 last:border-none">
                  <div className={`size-1.5 rounded-full ${item.type === 'alert' ? 'bg-red-500' : 'bg-[#5551FF]'} animate-pulse`} />
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">{item.label}:</span>
                  <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">{item.value}</span>
               </div>
            ))}
            {/* Repeat for seamless loop */}
            {tickerData.map((item, i) => (
               <div key={`dup-${i}`} className="flex items-center gap-4 px-6 border-r border-white/5 last:border-none">
                  <div className={`size-1.5 rounded-full ${item.type === 'alert' ? 'bg-red-500' : 'bg-[#5551FF]'} animate-pulse`} />
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">{item.label}:</span>
                  <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">{item.value}</span>
               </div>
            ))}
         </div>
      </div>

      <main className="relative z-10">
        {/* Kinetic Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center pt-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-12"
          >


            <h1 className="text-[clamp(3.5rem,15vw,14rem)] font-black tracking-[-0.05em] leading-[0.8] uppercase flex flex-col">
              <span className="text-white block">Absolute</span>
              <span className="text-transparent border-t border-white/10 bg-clip-text bg-gradient-to-r from-white via-white/40 to-white/10">Visibility.</span>
            </h1>

            <div className="max-w-4xl mx-auto space-y-10">
              <p className="text-sm md:text-lg text-white/40 font-bold uppercase tracking-[0.4em] leading-relaxed max-w-2xl mx-auto">
                Next-generation telemetry for <br className="hidden md:block" /> global infrastructure nodes.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-10 pt-4">
                <Link to="/auth" className="group relative flex items-center gap-6 text-[12px] font-black uppercase tracking-[0.4em]">
                  <span className="z-10 text-white group-hover:text-[#5551FF] transition-colors duration-300">Start Extraction</span>
                  <div className="size-16 bg-white flex items-center justify-center group-hover:bg-[#5551FF] transition-all duration-500 group-hover:rotate-45">
                    <ArrowRight className="size-6 text-black group-hover:text-white" />
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Abstract Cyber Core Visual */}
          <div className="mt-32 w-full max-w-6xl relative">
             <div className="aspect-[21/9] border border-white/5 bg-white/[0.02] backdrop-blur-3xl overflow-hidden relative">
                {/* Dynamic Data Stream Overlay */}
                <div className="absolute inset-0 p-12 flex items-end justify-between pointer-events-none">
                   <div className="flex gap-4">
                      {Array.from({length: 4}).map((_, i) => (
                         <div key={i} className="w-1.5 h-12 bg-white/10 relative overflow-hidden">
                            <motion.div 
                               className="absolute inset-0 bg-[#5551FF]" 
                               initial={{ y: "100%" }} 
                               animate={{ y: "-100%" }} 
                               transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                            />
                         </div>
                      ))}
                   </div>
                   <div className="text-[60px] font-black text-white/5 uppercase tracking-tighter leading-none">Matrix Active</div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-40">
                   <div className="size-[600px] border border-white/5 rounded-full flex items-center justify-center">
                      <div className="size-[400px] border border-white/10 rounded-full animate-pulse" />
                      <div className="absolute size-[2px] bg-white animate-ping" style={{ top: '30%', left: '40%' }} />
                      <div className="absolute size-[2px] bg-white animate-ping" style={{ top: '60%', left: '70%', animationDelay: '1s' }} />
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* The Grid: Feature Protocol */}
        <section id="pulse" className="py-48 px-10 max-w-7xl mx-auto space-y-32">
          <div className="flex flex-col md:flex-row gap-12 items-end justify-between">
             <div className="space-y-8">
                <div className="text-[10px] font-black text-[#5551FF] uppercase tracking-[0.6em]">Capabilities</div>
                <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-tight">Protocol Scaling.</h2>
             </div>
             <p className="max-w-xs text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] leading-relaxed italic">
                A distributed architecture built for precision, transparency, and sub-millisecond heartbeat verification.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <FeatureBlock 
              icon={<Search className="size-6" />}
              title="Global DNS Radar"
              desc="Simultaneous benchmarking across 24+ resolver nodes for absolute latency profiles."
            />
            <FeatureBlock 
              icon={<Radio className="size-6" />}
              title="Hyper-Uptime"
              desc="Aggressive sub-minute checks with cryptographic verification of node health."
            />
            <FeatureBlock 
              icon={<ShieldCheck className="size-6" />}
              title="Security Armor"
              desc="Deep SSL/TLS protocol auditing with automated vulnerabilities remediation triggers."
            />
            <FeatureBlock 
              icon={<ServerIcon className="size-6" />}
              title="Supabase Pulse"
              desc="Persistent infrastructure keep-alive logic to ensure backend accessibility."
            />
            <FeatureBlock 
              icon={<Signal className="size-6" />}
              title="Alert Stream"
              desc="Proprietary alert matrix routing to Slack, Discord, and Telegram in sub-100ms."
            />
            <FeatureBlock 
              icon={<Database className="size-6" />}
              title="Audit Logs"
              desc="Immutable historical records of every system pulse for total transparency."
            />
          </div>
        </section>

        {/* The Matrix: Real-time Node Monitoring */}
        <section id="matrix" className="py-48 bg-black/20 border-y border-white/5">
           <div className="max-w-7xl mx-auto px-10">
              <div className="flex flex-col lg:flex-row gap-20 items-center">
                 <div className="flex-1 space-y-12">
                    <div className="inline-flex items-center gap-4 px-4 py-2 border border-[#5551FF]/20 bg-[#5551FF]/5 text-[#5551FF] text-[10px] font-black uppercase tracking-[0.4em]">
                       Matrix Active
                    </div>
                    <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none">Global <br /> Node Grid.</h2>
                    <p className="text-sm md:text-base font-bold text-white/40 uppercase tracking-[0.2em] leading-relaxed max-w-lg">
                       Our distributed matrix monitors infrastructure from the edge. Every pulse is verified by a cluster of regional nodes for 0% false positives.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
                       <div>
                          <div className="text-3xl font-black italic">99.99%</div>
                          <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mt-2">Uptime Accuracy</div>
                       </div>
                       <div>
                          <div className="text-3xl font-black italic"> {'<'} 100ms</div>
                          <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mt-2">Alert Latency</div>
                       </div>
                    </div>
                 </div>

                 <div className="flex-1 w-full aspect-square relative group">
                    <div className="absolute inset-0 bg-[#5551FF]/5 rounded-full blur-[100px] group-hover:bg-[#5551FF]/10 transition-colors" />
                    <div className="relative h-full border border-white/5 bg-white/[0.02] backdrop-blur-3xl p-1 overflow-hidden">
                       <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:20px_20px]" />
                       <div className="h-full flex flex-col justify-between p-8">
                          {Array.from({length: 8}).map((_, i) => (
                             <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                   <div className={`size-1.5 rounded-full ${i === 3 ? 'bg-red-500 animate-ping' : 'bg-emerald-500'} `} />
                                   <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Node-{i+102}</span>
                                </div>
                                <div className="flex gap-1">
                                   {Array.from({length: 12}).map((_, j) => (
                                      <div key={j} className={`w-1.5 h-4 ${Math.random() > 0.8 ? 'bg-white/5' : 'bg-[#5551FF]/40'} `} />
                                   ))}
                                </div>
                             </div>
                          ))}
                       </div>
                       <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-t from-transparent via-[#5551FF]/20 to-transparent animate-[scan_4s_linear_infinite]" />
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* The Lab: Experimental Intelligence */}
        <section id="lab" className="py-48 px-10">
           <div className="max-w-7xl mx-auto">
              <div className="text-center space-y-12 mb-32">
                 <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.8em]">Deep Lab Protocols</div>
                 <h2 className="text-6xl md:text-[140px] font-black uppercase tracking-tighter leading-none italic text-transparent bg-clip-text bg-gradient-to-b from-white to-white/5">Research.</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                 <div className="p-16 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
                    <Processor className="size-12 mb-12 text-[#5551FF] group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-black uppercase tracking-[0.2em] mb-6">Neural Latency Prediction</h3>
                    <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] leading-loose">
                       We're training AI models to predict network routing congestion before it happens, allowing for proactive node switching.
                    </p>
                 </div>
                 <div className="p-16 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
                    <Globe className="size-12 mb-12 text-[#5551FF] group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-black uppercase tracking-[0.2em] mb-6">Quantum Hearthbeats</h3>
                    <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] leading-loose">
                       Experimental next-gen verification system using advanced packet sequencing for spoof-proof node health validation.
                    </p>
                 </div>
              </div>
           </div>
        </section>

        {/* Command Center: Contact Protocol */}
        <section id="contact" className="py-48 bg-white/[0.02] border-y border-white/5 overflow-hidden relative">
           <div className="absolute top-0 right-0 p-20 opacity-5">
              <Terminal className="size-[400px]" />
           </div>
           
           <div className="max-w-7xl mx-auto px-10 relative z-10">
              <div className="flex flex-col lg:flex-row gap-32">
                 <div className="flex-1 space-y-12">
                    <div className="space-y-6">
                       <div className="text-[10px] font-black text-[#5551FF] uppercase tracking-[0.6em]">Support Matrix</div>
                       <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none">Command <br /> Center.</h2>
                    </div>
                    <p className="max-w-md text-sm font-bold text-white/40 uppercase tracking-[0.2em] leading-loose">
                       Available 24/7 for critical system escalations, custom infrastructure integrations, and architectural consultations.
                    </p>
                    
                    <div className="pt-12 space-y-8">
                       <div className="flex items-center gap-8 group cursor-pointer">
                          <div className="size-14 border border-white/10 flex items-center justify-center group-hover:border-[#5551FF] transition-colors">
                             <Bell className="size-5 text-white/30 group-hover:text-white" />
                          </div>
                          <div>
                             <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Emergency Operations</div>
                             <div className="text-lg font-black tracking-widest uppercase">ops@netpulse.labs</div>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-8 group cursor-pointer">
                          <div className="size-14 border border-white/10 flex items-center justify-center group-hover:border-[#5551FF] transition-colors">
                             <Layers className="size-5 text-white/30 group-hover:text-white" />
                          </div>
                          <div>
                             <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">System Integration</div>
                             <div className="text-lg font-black tracking-widest uppercase">dev@netpulse.labs</div>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="flex-1">
                    <div className="p-12 border border-white/5 bg-[#382370] space-y-10">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                          <div className="space-y-4">
                             <label className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30">Protocol ID</label>
                             <input type="text" placeholder="NAME / ORG" className="w-full bg-white/5 border border-white/5 p-4 text-[10px] font-black tracking-widest uppercase focus:border-[#5551FF] outline-none transition-all placeholder:text-white/10" />
                          </div>
                          <div className="space-y-4">
                             <label className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30">Comm Link</label>
                             <input type="email" placeholder="EMAIL@ADDR.SYS" className="w-full bg-white/5 border border-white/5 p-4 text-[10px] font-black tracking-widest uppercase focus:border-[#5551FF] outline-none transition-all placeholder:text-white/10" />
                          </div>
                       </div>
                       <div className="space-y-4">
                          <label className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30">Transmission</label>
                          <textarea rows={4} placeholder="ENCODE MESSAGE..." className="w-full bg-white/5 border border-white/5 p-4 text-[10px] font-black tracking-widest uppercase focus:border-[#5551FF] outline-none transition-all placeholder:text-white/10 resize-none md:h-32" />
                       </div>
                       <button className="w-full h-20 bg-white text-black text-[12px] font-black uppercase tracking-[0.5em] hover:bg-[#5551FF] hover:text-white transition-all duration-500 flex items-center justify-center gap-4">
                          Execute Broadcast
                          <Zap className="size-4" />
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Industrial CTA Section */}
        <section className="py-64 relative bg-[#311f62] overflow-hidden">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(85,81,255,0.1),transparent_50%)]" />
           <div className="max-w-5xl mx-auto text-center space-y-20 relative z-10 px-6">
              <h2 className="text-6xl md:text-[120px] font-black uppercase tracking-tighter leading-none opacity-20">Secure the Core.</h2>
              <div className="space-y-12">
                 <p className="text-sm md:text-base font-black uppercase tracking-[0.5em] text-white/50 max-w-xl mx-auto leading-relaxed">
                    Deploy your first monitor grid in less than 60 seconds. <br /> Zero cost initialization.
                 </p>
                 <Link to="/auth" className="inline-flex h-24 px-16 bg-[#5551FF] text-white text-[14px] font-black uppercase tracking-[0.4em] shadow-[0_40px_100px_rgba(85,81,255,0.2)] hover:scale-105 transition-all flex items-center gap-6 group">
                   Initialize Node
                   <div className="size-8 bg-white flex items-center justify-center group-hover:rotate-90 transition-all duration-500">
                      <ChevronRight className="size-5 text-[#5551FF]" />
                   </div>
                 </Link>
              </div>
           </div>
        </section>

        {/* System Footer */}
        <footer className="py-32 px-10 border-t border-white/5 bg-[#382370]">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20">
             <div className="lg:col-span-6 space-y-12">
                <div className="flex items-center gap-4">
                  <div className="size-16 bg-white flex items-center justify-center">
                    <Network className="size-8 text-black" />
                  </div>
                  <span className="text-3xl font-black uppercase tracking-tight italic">Netpulse</span>
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/20 leading-loose max-w-md">
                   Observation protocols for the next era of decentralized infrastructure. Built in service of total system transparency.
                </p>
             </div>
             
             <div className="lg:col-span-3 space-y-8">
                <div className="text-[10px] font-black text-white uppercase tracking-[0.6em]">Architecture</div>
                <ul className="space-y-4 text-[11px] font-bold text-white/30 tracking-[0.2em] uppercase">
                   <li className="hover:text-white transition-colors cursor-pointer">DNS Clusters</li>
                   <li className="hover:text-white transition-colors cursor-pointer">Global Pulse</li>
                   <li className="hover:text-white transition-colors cursor-pointer">Security Lab</li>
                </ul>
             </div>

             <div className="lg:col-span-3 space-y-8">
                <div className="text-[10px] font-black text-white uppercase tracking-[0.6em]">Protocols</div>
                <ul className="space-y-4 text-[11px] font-bold text-white/30 tracking-[0.2em] uppercase">
                   <li className="hover:text-white transition-colors cursor-pointer">Manifesto</li>
                   <li className="hover:text-white transition-colors cursor-pointer">Privacy</li>
                   <li className="hover:text-white transition-colors cursor-pointer">Terms of Ops</li>
                </ul>
             </div>
          </div>

          <div className="max-w-7xl mx-auto mt-32 pt-12 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
             <div className="text-[10px] font-black text-white/10 uppercase tracking-[0.6em]">
                &copy; 2026 Netpulse Engineering Labs.
             </div>
             <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-500/50 uppercase tracking-[0.4em]">System Nodes Active</span>
             </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function FeatureBlock({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="group relative p-12 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-700"
    >
      <div className="absolute top-0 right-0 size-16 border-t border-r border-[#5551FF]/0 group-hover:border-[#5551FF]/50 transition-all duration-500" />
      
      <div className="size-16 bg-white/5 border border-white/10 flex items-center justify-center text-white/50 group-hover:text-white group-hover:bg-[#5551FF]/10 transition-all duration-500 mb-10">
        {icon}
      </div>
      
      <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-4 group-hover:translate-x-2 transition-transform duration-500">{title}</h3>
      <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] leading-relaxed transition-colors group-hover:text-white/50">{desc}</p>
    </motion.div>
  );
}
