import { useState, useMemo, Suspense, lazy, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { dnsProviders } from '@/data/dnsProviders';
import { DnsProvider, FilterState, TestResult } from '@/types/dns';
import { useDnsTest } from '@/hooks/useDnsTest';

import { DnsCard } from '@/components/DnsCard';
import { DnsFilters } from '@/components/DnsFilters';
import { TestProgress } from '@/components/TestProgress';
import { DnsRecommendation } from '@/components/DnsRecommendation';
import { DnsLeaderboard } from '@/components/DnsLeaderboard';
import { BenchmarkCharts } from '@/components/BenchmarkCharts';
import { ExportButtons } from '@/components/ExportButtons';
import { Play, Square, Globe, ListOrdered, BarChart3, Sun, Moon, Activity, MapPin, Navigation, Signal, Satellite, Info, Mail, Shield, User, BookOpen, Code2, Terminal, ExternalLink, Cpu, Heart, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LiveTicker } from '@/components/LiveTicker';

const GlobalMap = lazy(() => import('@/components/GlobalMap').then(m => ({ default: m.GlobalMap })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));

const defaultFilters: FilterState = {
  adBlocking: false,
  malwareProtection: false,
  familyFilter: false,
  privacyHigh: false,
  ipv6: false,
  doh: false,
  dot: false,
  region: '',
  search: '',
};

export default function Index() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [activeTab, setActiveTab] = useState<'grid' | 'map' | 'leaderboard' | 'charts' | 'profile'>('grid');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['grid', 'map', 'leaderboard', 'charts', 'profile'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const { results, isRunning, testingSingle, progress, runTests, stopTests, testSingle, getTopProviders } = useDnsTest(dnsProviders);

  const topProviders = useMemo(() => getTopProviders(3), [getTopProviders, results]);

  const filteredProviders = useMemo(() => {
    const list = dnsProviders.filter(p => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.organization.toLowerCase().includes(q) &&
          !p.ipv4Primary.includes(q) && p.country && !p.country.toLowerCase().includes(q)) return false;
      }
      if (filters.adBlocking && !p.adBlocking) return false;
      if (filters.malwareProtection && !p.malwareProtection) return false;
      if (filters.familyFilter && !p.familyFilter) return false;
      if (filters.privacyHigh && p.privacyLevel !== 'high') return false;
      if (filters.ipv6 && !p.ipv6Primary) return false;
      if (filters.doh && !p.dohEndpoint) return false;
      if (filters.dot && !p.dotHostname) return false;
      if (filters.region && p.region !== filters.region) return false;
      return true;
    });
    return list;
  }, [filters]);

  const initialCards = useMemo(() => filteredProviders.slice(0, 12), [filteredProviders]);
  const restCards = useMemo(() => filteredProviders.slice(12), [filteredProviders]);

  const globalAvg = useMemo(() => {
    let sum = 0;
    let count = 0;
    results.forEach((r: any) => {
      if (r.status === 'complete') {
        sum += r.avgLatency;
        count++;
      }
    });
    if (count === 0) return null;
    return (sum / count).toFixed(1);
  }, [results]);

  const [showExtra, setShowExtra] = useState(false);

  useEffect(() => {
    // Reset showExtra when tab changes to preserve navigation speed
    setShowExtra(false);

    if (activeTab === 'grid') {
      const timer = setTimeout(() => setShowExtra(true), 400); // Slightly longer delay for smoother transition
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto overflow-x-hidden relative z-10 custom-scrollbar">
      

      <main className="p-4 sm:p-8 pb-32 w-full space-y-8 sm:space-y-12">
        {/* Minimalist Hero Section */}
        <section className="space-y-6 pt-2">
          {/* Action Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-primary/80">
              <Activity className="h-4 w-4" />
              <span className="text-[12px] font-bold uppercase tracking-[0.3em]">Network Intelligence</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-black text-ink uppercase tracking-[0.2em]">{activeTab}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                <span className="text-[11px] font-bold text-ink/60 uppercase tracking-[0.3em]">
                  {filteredProviders.length} Nodes Online
                </span>
              </div>
              
              <div className="w-px h-6 bg-line/40 mx-2" />
              
              <div className="flex items-center gap-1.5 p-1 bg-panel rounded-lg border border-line/40 shadow-sm">
                <button
                  onClick={isRunning ? stopTests : runTests}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${isRunning
                    ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                    : 'bg-primary text-white hover:bg-primary/90 shadow-[0_0_10px_rgba(85,81,255,0.2)]'}`}
                >
                  {isRunning ? (
                    <>
                      <Square className="h-3 w-3 fill-current" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 fill-current" />
                      <span>Run Benchmark</span>
                    </>
                  )}
                </button>
                <div className="w-px h-3 bg-line/60 mx-1" />
                <ExportButtons providers={dnsProviders} results={results} />
              </div>
            </div>
          </div>

          {['grid', 'map'].includes(activeTab) && (
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4 border-t border-line/20">
              <div className="flex items-baseline gap-2">
                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-bold text-ink/60 uppercase tracking-widest">Global Avg</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black tracking-tighter text-ink">{globalAvg || '--'}</span>
                    <span className="text-[11px] font-bold text-ink/40 uppercase">ms</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {['grid', 'map'].includes(activeTab) && (
          <TestProgress completed={progress.completed} total={progress.total} isRunning={isRunning} />
        )}

        <div className="relative w-full">
          {/* Persistent Tab Views for Instant Switching */}
          <div className={activeTab === 'grid' ? 'block' : 'hidden'}>
            <motion.div
              initial={false}
              animate={activeTab === 'grid' ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-12"
            >
              {topProviders.length > 0 && (
                <DnsRecommendation topResults={topProviders} providers={dnsProviders} onSelect={(p) => navigate(`/app/dns-benchmark/${p.id}`)} />
              )}

              <div className="space-y-8">
                <DnsFilters
                  filters={filters}
                  onChange={setFilters}
                  totalCount={dnsProviders.length}
                  filteredCount={filteredProviders.length}
                />
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  style={{ contain: 'content' }}
                >
                  {initialCards.map((provider, i) => (
                    <DnsCard
                      key={provider.id}
                      provider={provider}
                      result={results.get(provider.id)}
                      onClick={() => navigate(`/app/dns-benchmark/${provider.id}`)}
                      onTest={testSingle}
                      isTesting={testingSingle === provider.id}
                      index={i}
                    />
                  ))}
                  {showExtra && restCards.map((provider, i) => (
                    <DnsCard
                      key={provider.id}
                      provider={provider}
                      result={results.get(provider.id)}
                      onClick={() => navigate(`/app/dns-benchmark/${provider.id}`)}
                      onTest={testSingle}
                      isTesting={testingSingle === provider.id}
                      index={i + 12}
                    />
                  ))}
                  {!showExtra && filteredProviders.length > 12 && (
                    <div className="col-span-full h-32 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {showExtra && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 xl:grid-cols-2 gap-12 pt-12 border-t border-line/40"
                >
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <ListOrdered className="h-4 w-4 text-primary/70" />
                      <h2 className="text-sm font-bold tracking-widest uppercase text-ink/80 border-l border-primary/20 pl-3">Performance Leaders</h2>
                    </div>
                    <DnsLeaderboard providers={filteredProviders.slice(0, 10)} results={results} onSelect={(p) => navigate(`/app/dns-benchmark/${p.id}`)} />
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-4 w-4 text-primary/70" />
                      <h2 className="text-sm font-bold tracking-widest uppercase text-ink/80 border-l border-primary/20 pl-3">Latency Distribution</h2>
                    </div>
                    <BenchmarkCharts providers={filteredProviders} results={results} />
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>

          <div className={activeTab === 'map' ? 'block' : 'hidden'}>
            <motion.div
              initial={false}
              animate={activeTab === 'map' ? { opacity: 1 } : { opacity: 0 }}
              className="space-y-12"
            >
              <div className="h-[400px] md:h-[600px] rounded-2xl overflow-hidden border border-line/40 bg-panel/5 relative z-0">
                <div className="absolute top-6 left-6 z-[1001] px-3 py-1.5 bg-base/80 backdrop-blur-md rounded-lg border border-line/40">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-primary/60">Spatial Node Matrix</span>
                </div>

                <div className="absolute bottom-6 left-6 z-[1001] flex flex-col gap-2 p-3 bg-base/80 backdrop-blur-md rounded-xl border border-line/40">
                  <p className="text-[8px] font-black uppercase tracking-widest text-ink/60 mb-1">Latency Legend</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00e676]" />
                    <span className="text-[9px] font-bold text-ink/80 uppercase">Sub 40ms (Elite)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#ffab00]" />
                    <span className="text-[9px] font-bold text-ink/80 uppercase">40-100ms (Stable)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#ff1744]" />
                    <span className="text-[9px] font-bold text-ink/80 uppercase">100ms+ (Legacy)</span>
                  </div>
                </div>

                <Suspense fallback={<div className="h-full w-full flex flex-col items-center justify-center text-ink/20 gap-4">
                  <Globe className="h-8 w-8 animate-pulse opacity-10" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Geo Layer Sync</span>
                </div>}>
                  <GlobalMap
                    providers={filteredProviders}
                    results={results}
                    onSelectProvider={(p) => navigate(`/app/dns-benchmark/${p.id}`)}
                  />
                </Suspense>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 pt-4">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-primary/70" />
                    <h2 className="text-sm font-bold tracking-widest uppercase text-ink/80 border-l border-primary/20 pl-3">Geographical Distribution</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Node Density', value: 'High', icon: Navigation },
                      { label: 'Routing Hops', value: '3.2 Avg', icon: Signal },
                      { label: 'Proximity Factor', value: '0.84', icon: Globe },
                      { label: 'Packet Pathing', value: 'Dynamic', icon: Satellite },
                    ].map((stat, i) => (
                      <div key={i} className="p-4 rounded-xl bg-panel border border-line/40 space-y-1">
                        <div className="flex items-center gap-2 text-ink/50">
                          <stat.icon className="h-3 w-3" />
                          <span className="text-[9px] font-black uppercase tracking-widest">{stat.label}</span>
                        </div>
                        <p className="text-sm font-black text-ink uppercase tracking-tighter">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <GeoInsight />
              </div>
            </motion.div>
          </div>

          <AnimatePresence>
            {activeTab === 'leaderboard' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="space-y-1">
                  <h2 className="text-2xl font-black tracking-tighter uppercase text-ink">Security Audit</h2>
                  <p className="text-xs text-ink/70 font-bold uppercase tracking-widest">Comprehensive validation metrics</p>
                </div>
                <DnsLeaderboard providers={filteredProviders} results={results} onSelect={(p) => navigate(`/app/dns-benchmark/${p.id}`)} />
              </motion.div>
            )}

            {activeTab === 'charts' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                <div className="space-y-1">
                  <h2 className="text-2xl font-black tracking-tighter uppercase text-ink">Temporal Data</h2>
                  <p className="text-xs text-ink/70 font-bold uppercase tracking-widest">Network variance analytics</p>
                </div>
                <BenchmarkCharts providers={filteredProviders} results={results} />
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="w-full"
              >
                <Suspense fallback={
                  <div className="h-full w-full flex items-center justify-center py-32">
                    <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  </div>
                }>
                  <ProfilePage />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="border-t border-line/10 py-10 mt-auto bg-base">
        <div className="container mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-[10px] font-black text-ink/50 uppercase tracking-[0.2em]">
            © 2026 NETPULSE System • v4.0.1
          </p>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-6">
              <span className="text-[10px] font-black text-ink/70 uppercase tracking-widest hover:text-primary transition-colors cursor-pointer">Manifesto</span>
              <span className="text-[10px] font-black text-ink/70 uppercase tracking-widest hover:text-primary transition-colors cursor-pointer">Telemetry</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AboutSection() {
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
    <div className="max-w-4xl mx-auto space-y-24 py-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* 01. Briefing */}
      <div className="space-y-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          <Activity className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">System Briefing</span>
        </div>
        <div className="space-y-4">
          <h2 className="text-6xl font-extralight tracking-tighter text-ink lowercase">Netpulse</h2>
          <p className="max-w-xl mx-auto text-sm text-ink/80 font-medium leading-relaxed italic">
            "A high-precision telemetry engine designed to bridge the gap between raw global networking and human-centric infrastructure."
          </p>
        </div>
      </div>

      {/* 02. Feature Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {features.map((feature, idx) => (
          <div key={idx} className={`p-10 rounded-3xl bg-panel/10 border ${feature.border} space-y-6 hover:translate-y-[-4px] transition-all duration-500`}>
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
      <div className="p-16 rounded-[4rem] bg-gradient-to-br from-primary/5 via-transparent to-transparent border border-line/40 relative overflow-hidden">
        <div className="relative z-10 space-y-8">
          <div className="space-y-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Operational Goal</h3>
            <p className="text-xl font-light text-ink/80 leading-relaxed italic">
              To provide the definitive lens for observing the internet's pulse—ensuring transparency, speed, and reliability across the decentralized web.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="space-y-1">
              <p className="text-[8px] font-bold text-ink/40 uppercase tracking-widest">Version</p>
              <p className="text-[10px] font-black text-ink/60 uppercase">4.0.1 Stable Alpha</p>
            </div>
            <div className="w-px h-6 bg-border/40" />
            <div className="space-y-1">
              <p className="text-[8px] font-bold text-ink/40 uppercase tracking-widest">Network</p>
              <p className="text-[10px] font-black text-ink/60 uppercase">Global Node Matrix Active</p>
            </div>
          </div>
        </div>
        <div className="absolute top-1/2 right-[-10%] translate-y-[-50%] opacity-5 pointer-events-none">
          <Globe className="w-96 h-96 text-primary" />
        </div>
      </div>

      {/* 04. Footer Note */}
      <div className="text-center pt-8">
        <p className="text-[10px] font-bold text-ink/30 uppercase tracking-[0.5em]">
          Designed for the decentralized era — EST. 2026
        </p>
      </div>
    </div>
  );
}

function ContactSection() {
  const profileDetails = [
    { label: 'Born', value: '17 Nov 2002' },
    { label: 'Age', value: '22' },
    { label: 'Location', value: 'Gazipur, Dhaka' },
    { label: 'Origin', value: 'Tangail' },
    { label: 'Blood', value: 'B+' },
  ];

  const education = [
    { school: 'Independent University of Bangladesh', degree: 'BSc in Computer Science', years: '2021 - Present' },
    { school: 'Misir Ali Khan Memorial School & College', degree: 'Higher Secondary Certificate', years: '2019 - 2020' },
    { school: 'Professor MEH Arif Secondary School', degree: 'Secondary School Certificate', years: '2017 - 2018' },
  ];

  const skillGroups = [
    { category: 'Languages', items: 'Dart (Flutter), React, Python' },
    { category: 'Mobile', items: 'Android APK, Flutter' },
    { category: 'Web Stack', items: 'React.js, HTML, CSS, JS' },
    { category: 'Systems', items: 'Linux, Terminal, CMake, VM' },
    { category: 'UI/Design', items: 'App UI/UX, Gradients' },
    { category: 'VCS', items: 'Git, GitHub (Private Enabled)' },
  ];

  const insights = [
    { title: 'Personal Traits', content: 'Detail-oriented, curious, and thrives on cross-platform solution experimentation.' },
    { title: 'Development Philosophy', content: 'Clean Flutter structures, step-by-step clarity, and multi-OS native optimization.' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-24 py-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* 01. Identity Node */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-12 border-b border-line/40 pb-16">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-1 bg-primary/40 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Lead Developer</span>
          </div>
          <h2 className="text-5xl font-extralight tracking-tight text-ink lowercase leading-none">Abir Hasan Siam</h2>
          <p className="text-sm text-ink/60 font-medium">Focused on high-performance networking & cross-platform ecosystems.</p>
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-6 shrink-0">
          {profileDetails.map((detail, idx) => (
            <div key={idx} className="space-y-1">
              <p className="text-[9px] font-bold text-ink/30 uppercase tracking-[0.2em]">{detail.label}</p>
              <p className="text-sm font-medium text-ink/70">{detail.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 02. Technical Matrix & Education */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
        <div className="space-y-12">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 flex items-center gap-4">
            Skill Matrix <div className="h-px bg-border/40 flex-1" />
          </h3>
          <div className="space-y-8">
            {skillGroups.map((group, idx) => (
              <div key={idx} className="group cursor-default">
                <p className="text-[8px] font-black text-ink/30 uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">{group.category}</p>
                <p className="text-xs font-semibold text-ink/80 leading-relaxed tracking-tight">{group.items}</p>
              </div>
            ))}
          </div>

          <div className="pt-6">
            <p className="text-[10px] font-bold text-ink/40 uppercase mb-4 italic tracking-widest">Interests</p>
            <div className="flex flex-wrap gap-2">
              {['Efficient UI', 'Multi-Platform', 'AI Tools'].map(interest => (
                <span key={interest} className="text-[10px] font-bold px-3 py-1 rounded-full border border-line/40 shadow-sm text-ink">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-12">
          <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 flex items-center gap-4">
            Education <div className="h-px bg-border/40 flex-1" />
          </h3>
          <div className="space-y-10">
            {education.map((edu, idx) => (
              <div key={idx} className="space-y-2 group">
                <p className="text-[9px] font-black text-primary/40 uppercase tracking-widest">{edu.years}</p>
                <h4 className="text-sm font-bold text-ink/90 group-hover:text-primary transition-colors leading-tight">{edu.school}</h4>
                <p className="text-[11px] text-ink/60 font-medium leading-tight">{edu.degree}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 03. Insights Cluster */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {insights.map((insight, idx) => (
          <div key={idx} className="p-10 rounded-3xl bg-panel/5 border border-line/40 space-y-4 hover:border-primary/20 transition-all">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">{insight.title}</h4>
            <p className="text-sm text-ink/80 font-medium leading-relaxed italic">{insight.content}</p>
          </div>
        ))}
      </div>

      {/* 04. Online Presence */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-12 pt-12 border-t border-line/40">
        <div className="flex items-center gap-12">
          <a href="https://github.com/abir2afridi" target="_blank" rel="noopener noreferrer" className="group">
            <div className="flex items-center gap-3">
              <Code2 className="h-4 w-4 text-ink group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-widest text-ink/40 group-hover:text-ink">GitHub</span>
            </div>
          </a>
          <a href="https://abir2afridi.vercel.app/" target="_blank" rel="noopener noreferrer" className="group">
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-ink group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-widest text-ink/40 group-hover:text-ink">Portfolio</span>
            </div>
          </a>
          <a href="mailto:abir2afridi@gmail.com" className="group">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-ink group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-widest text-ink/40 group-hover:text-ink">Email</span>
            </div>
          </a>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-ink/40 italic flex items-center gap-2">
            Status: Available for Collaboration
          </span>
        </div>
      </div>
    </div>
  );
}

function GeoInsight() {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="border border-line/40 rounded-2xl bg-panel p-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Globe className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-ink">Geo Spatial Insight</h3>
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="p-1 hover:bg-muted rounded-md transition-all text-ink/60 hover:text-primary"
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-ink font-bold uppercase tracking-wider">Topological distribution analysis</p>
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
              <p className="text-[11px] text-ink/80 leading-relaxed italic max-w-2xl">
                DNS latency is primarily governed by the physical distance between your infrastructure and the resolver node, as well as the Peering efficiency of the ISP. The <span className="text-ink font-bold not-italic">Spatial Node Matrix</span> visualizes this "Distance Penalty." By selecting nodes closer to your geographical cluster, you minimize the speed-of-light constraints and reduce the number of routing hops, resulting in a more responsive networking experience.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-4 mt-4 border-t border-line/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold text-ink/60 tracking-widest uppercase">
            <Navigation className="h-3 w-3" />
            <span>Map Projection: Mercator EPSG:3857</span>
          </div>
        </div>
      </div>
    </div>
  );
}
