import { DnsProvider, TestResult, getSpeedCategory } from '@/types/dns';
import { motion } from 'framer-motion';
import { memo, useState, MouseEvent } from 'react';
import { toast } from 'sonner';
import {
  Server,
  Zap,
  Lock,
  ShieldCheck,
  Globe,
  Ban,
  Users,
  ShieldAlert,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { getProviderLogo } from '@/lib/dns-icons';

interface DnsCardProps {
  provider: DnsProvider;
  result?: TestResult;
  onClick: () => void;
  onTest?: (provider: DnsProvider) => void;
  isTesting?: boolean;
  index: number;
}

export const DnsCard = memo(({ provider, result, onClick, onTest, isTesting, index }: DnsCardProps) => {
  const [copied, setCopied] = useState<string | null>(null);
  const speed = result?.status === 'complete' ? getSpeedCategory(result.avgLatency) : 'unknown';

  const statusColors = {
    fast: 'text-emerald-500',
    medium: 'text-amber-500',
    slow: 'text-rose-500',
    unknown: 'text-ink/40'
  };

  const activeColor = statusColors[speed];

  const handleCopy = (e: MouseEvent, text: string, label: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.005, 0.1), duration: 0.2 }}
      className="relative h-full cursor-pointer group"
      onClick={onClick}
    >
      <div className="h-full bg-panel hover:bg-panel/95 transition-all duration-300 border border-line group-hover:border-primary/30 rounded-2xl p-6 flex flex-col shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl hover:shadow-primary/5">

        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-panel/50 border border-line/50">
              {(() => {
                const logo = getProviderLogo(provider);
                if (logo) {
                  return <img src={logo} alt={provider.name} className="w-3.5 h-3.5 object-contain" />;
                }
                return <Server className={`w-3.5 h-3.5 ${isTesting ? 'text-primary' : 'text-ink/40'}`} />;
              })()}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-ink truncate group-hover:text-primary transition-colors">
                {provider.name}
              </h3>
              <p className="text-[11px] text-ink/40 font-bold uppercase tracking-widest truncate">
                {provider.organization}
              </p>
            </div>
          </div>

          <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${speed === 'fast' ? 'text-emerald-500/90 bg-emerald-500/5' :
            speed === 'medium' ? 'text-amber-500/80 bg-amber-500/5' :
              speed === 'slow' ? 'text-rose-500/80 bg-rose-500/5' :
                'text-ink/40 bg-panel/10'
            }`}>
            {isTesting ? 'READY' : speed === 'unknown' ? 'OFF' : speed}
          </div>
        </div>

        <div className="flex items-end justify-between mb-6">
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-black tabular-nums tracking-tighter ${activeColor}`}>
              {result?.avgLatency ? Math.round(result.avgLatency) : '--'}
            </span>
            <span className="text-[10px] font-bold text-ink/40 uppercase">ms</span>
          </div>

          <div className="flex gap-0.5">
            <FeatureIcon active={!!provider.dohEndpoint} icon={Lock} />
            <FeatureIcon active={!!provider.dotHostname} icon={ShieldCheck} />
            <FeatureIcon active={!!provider.ipv6Primary} icon={Globe} />
          </div>
        </div>

        <div className="space-y-1 mb-6">
          <IpRow label="P" ip={provider.ipv4Primary} copied={copied === 'Primary'} onCopy={(e) => handleCopy(e, provider.ipv4Primary, 'Primary')} />
          {provider.ipv4Secondary && (
            <IpRow label="S" ip={provider.ipv4Secondary} copied={copied === 'Secondary'} onCopy={(e) => handleCopy(e, provider.ipv4Secondary, 'Secondary')} />
          )}
        </div>

        <div className="flex items-center gap-2 mt-auto">
          <div className="flex gap-1.5 opacity-40 group-hover:opacity-60 transition-all duration-500">
            <CapabilityItem active={provider.adBlocking} icon={Ban} />
            <CapabilityItem active={provider.malwareProtection} icon={ShieldAlert} />
            <CapabilityItem active={provider.familyFilter} icon={Users} />
          </div>

          <div className="ml-auto flex items-center gap-1">
            {onTest && (
              <button
                onClick={(e) => { e.stopPropagation(); onTest(provider); }}
                disabled={isTesting}
                className="p-1.5 rounded-lg text-ink/40 hover:text-primary hover:bg-primary/5 transition-all"
              >
                <Zap className={`w-3 h-3 ${isTesting ? 'animate-pulse text-primary' : ''}`} />
              </button>
            )}
            <div className="p-1.5 rounded-lg text-ink/40 group-hover:text-ink/40 transition-colors">
              <ExternalLink className="w-3 h-3" />
            </div>
          </div>
        </div>

        {isTesting && (
          <div className="absolute top-0 left-0 w-full h-[1px] bg-primary/10 overflow-hidden">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="w-1/2 h-full bg-primary/30"
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}, (prev, next) => {
  return prev.isTesting === next.isTesting &&
    prev.result?.status === next.result?.status &&
    prev.result?.avgLatency === next.result?.avgLatency;
});

function FeatureIcon({ active, icon: Icon }: { active: boolean; icon: any }) {
  return (
    <div className={`p-1 transition-colors ${active ? 'text-primary/60' : 'text-ink/40'}`}>
      <Icon className="w-3 h-3" />
    </div>
  );
}

function IpRow({ label, ip, copied, onCopy }: { label: string; ip: string; copied: boolean; onCopy: (e: any) => void }) {
  return (
    <div
      onClick={onCopy}
      className="flex items-center justify-between py-0.5 px-2 rounded hover:bg-panel/20 transition-colors"
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="text-[10px] font-black text-ink/40 italic w-3">{label}</span>
        <code className="text-[11px] font-mono text-ink/40 truncate">{ip}</code>
      </div>
      {copied ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-40 transition-opacity" />}
    </div>
  );
}

function CapabilityItem({ active, icon: Icon }: { active: boolean; icon: any }) {
  return (
    <div className={`${active ? 'text-emerald-500' : 'text-ink/60'}`}>
      <Icon className="w-3 h-3" />
    </div>
  );
}
