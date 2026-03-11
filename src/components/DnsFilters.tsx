import { FilterState } from '@/types/dns';
import { regions } from '@/data/dnsProviders';
import { Search, Filter, ChevronDown, Check, Globe, Radio, Lock, ShieldAlert, Users, Cpu, SlidersHorizontal, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface Props {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

export function DnsFilters({ filters, onChange, totalCount, filteredCount }: Props) {
  const [showFilters, setShowFilters] = useState(false);

  const update = (partial: Partial<FilterState>) => onChange({ ...filters, ...partial });

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) =>
    key !== 'search' && key !== 'region' && value === true
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Module */}
        <div className="relative flex-1 group">
          <div className="relative flex items-center gap-3 bg-panel border border-line/40 rounded-xl px-5 transition-all duration-300 focus-within:border-primary/20">
            <Search className="h-3.5 w-3.5 text-ink/60" />
            <input
              type="text"
              placeholder="Filter nodes by name, ISP or IP..."
              value={filters.search}
              onChange={e => update({ search: e.target.value })}
              className="flex-1 bg-transparent border-none py-4 text-[13px] font-semibold text-ink placeholder:text-ink/40 focus:outline-none"
            />
            <div className="flex items-center gap-2 pl-3 border-l border-line/40">
              <span className="text-[12px] font-bold text-ink/70 tabular-nums">
                {filteredCount} / {totalCount}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-3 px-6 h-[50px] rounded-xl border transition-all duration-300 ${showFilters
            ? 'bg-foreground text-background border-transparent'
            : 'bg-panel border-line/40 text-ink/60 hover:border-line hover:text-ink'
            }`}
        >
          <Filter className="h-4 w-4" />
          <span className="text-[12px] font-bold uppercase tracking-widest">Filters</span>
          {activeFiltersCount > 0 && (
            <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${showFilters ? 'bg-base text-ink' : 'bg-primary text-primary-foreground'}`}>
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="overflow-hidden"
          >
            <div className="bg-panel/50 border border-line/40 rounded-2xl p-6 mt-2">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-[11px] font-bold text-ink/40 uppercase tracking-[0.2em]">Capability matrix</span>
                    <div className="flex-1 h-px bg-border/40" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    <FilterToggle
                      label="Ad Blocking"
                      sub="Block ads & trackers"
                      icon={Ban}
                      active={filters.adBlocking}
                      onClick={() => update({ adBlocking: !filters.adBlocking })}
                    />
                    <FilterToggle
                      label="Malware X"
                      sub="Threat intelligence"
                      icon={ShieldAlert}
                      active={filters.malwareProtection}
                      onClick={() => update({ malwareProtection: !filters.malwareProtection })}
                    />
                    <FilterToggle
                      label="Secure DNS"
                      sub="Enforce DoH / DoT"
                      icon={Lock}
                      active={filters.doh}
                      onClick={() => update({ doh: !filters.doh })}
                    />
                    <FilterToggle
                      label="High Privacy"
                      sub="Zero-logging nodes"
                      icon={Radio}
                      active={filters.privacyHigh}
                      onClick={() => update({ privacyHigh: !filters.privacyHigh })}
                    />
                    <FilterToggle
                      label="Family Safe"
                      sub="Content filtering"
                      icon={Users}
                      active={filters.familyFilter}
                      onClick={() => update({ familyFilter: !filters.familyFilter })}
                    />
                    <FilterToggle
                      label="IPv6 address"
                      sub="Next-gen addressing"
                      icon={Globe}
                      active={filters.ipv6}
                      onClick={() => update({ ipv6: !filters.ipv6 })}
                    />
                  </div>
                </div>

                <div className="flex flex-col border-t lg:border-t-0 lg:border-l border-line/40 pt-6 lg:pt-0 lg:pl-8">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-[11px] font-bold text-ink/40 uppercase tracking-[0.2em]">Geography</span>
                    <div className="flex-1 h-px bg-border/40" />
                  </div>

                  <div className="relative group">
                    <select
                      value={filters.region}
                      onChange={e => update({ region: e.target.value })}
                      className="w-full appearance-none bg-panel/50 border border-line/40 rounded-xl px-4 py-3 text-xs font-bold text-ink focus:outline-none focus:border-primary/40 transition-all cursor-pointer"
                    >
                      <option value="">All Regions</option>
                      {regions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40 pointer-events-none" />
                  </div>

                  <p className="mt-auto pt-8 text-[11px] font-black text-ink/80 uppercase tracking-[0.1em] leading-relaxed">
                    Filters are applied instantly using localized node metadata.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterToggle({ label, sub, active, onClick, icon: Icon }: { label: string; sub: string; active: boolean; onClick: () => void; icon: any }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 text-left ${active
        ? 'bg-primary/5 border-primary/20 text-primary'
        : 'bg-transparent border-line/20 text-ink/60 hover:border-line/60 hover:text-ink'
        }`}
    >
      <div className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-primary/10' : 'bg-panel/50'}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className={`text-[12px] font-black uppercase tracking-widest ${active ? 'text-ink' : 'text-inherit opacity-90'}`}>
          {label}
        </span>
        <span className="text-[11px] font-bold opacity-80 uppercase tracking-tighter">
          {sub}
        </span>
      </div>
      {active && <Check className="ml-auto h-3 w-3 stroke-[3px]" />}
    </button>
  );
}
