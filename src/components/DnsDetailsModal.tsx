import { DnsProvider, TestResult } from '@/types/dns';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Copy,
  ExternalLink,
  Shield,
  ShieldCheck,
  Users,
  Lock,
  Globe,
  Database,
  Activity,
  MapPin,
  ShieldAlert,
  Zap,
  Server,
  CloudLightning,
  Cpu,
  Fingerprint
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  provider: DnsProvider | null;
  result?: TestResult;
  open: boolean;
  onClose: () => void;
}

const itemVars = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0 }
};

function TechRow({ label, value, icon: Icon, subLabel }: { label: string; value: string; icon?: any; subLabel?: string }) {
  if (!value) return null;
  const copy = () => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  return (
    <motion.div
      variants={itemVars}
      className="group flex items-center justify-between py-3 border-b border-line/20 last:border-0"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="p-2 rounded bg-panel/80 text-ink/60 group-hover:text-primary transition-colors">
          {Icon && <Icon className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-ink/60/80 uppercase tracking-widest leading-tight">{label}</p>
          <div className="flex items-center gap-2">
            <code className="text-[14px] font-mono text-ink truncate">{value}</code>
            {subLabel && <span className="text-[11px] font-bold text-ink/40 uppercase tracking-tighter">{subLabel}</span>}
          </div>
        </div>
      </div>
      <Button
        onClick={copy}
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-ink/40 hover:text-primary hover:bg-primary/10 transition-all"
      >
        <Copy className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}

export function DnsDetailsModal({ provider, result, open, onClose }: Props) {
  if (!provider) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] w-[95vw] bg-panel border-line/40 p-0 overflow-hidden rounded-2xl shadow-2xl focus:outline-none">
        <div className="max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div className="p-8 pb-12">
            {/* Minimal Header */}
            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-panel border border-line/60">
                    <Globe className="h-6 w-6 text-primary/60" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-ink font-sans">
                      {provider.name}
                    </h2>
                    <p className="text-[14px] font-bold text-ink/60 uppercase tracking-widest">{provider.organization}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary/60" />
                    <span className="text-[12px] font-bold text-ink/60/90 uppercase tracking-widest">{provider.region} • {provider.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-4 w-4 text-primary/60" />
                    <span className="text-[12px] font-bold text-ink/60/90 uppercase tracking-widest">v4 Protocol</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-[12px] font-bold text-ink/60/90 uppercase tracking-widest mb-1">Security Score</span>
                <span className="text-5xl font-black tracking-tighter text-primary">{provider.securityScore || 85}</span>
              </div>
            </header>

            {/* Core Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
              {[
                { label: 'Latency', value: result?.avgLatency ? `${Math.round(result.avgLatency)}ms` : '--', icon: Zap },
                { label: 'Stability', value: '100.0%', icon: Activity },
                { label: 'Status', value: 'Ready', icon: Server }
              ].map((stat, idx) => (
                <div key={idx} className="space-y-2 pb-4 border-b border-line/30">
                  <div className="flex items-center gap-2 text-ink/60/90">
                    <stat.icon className="h-4 w-4" />
                    <span className="text-[13px] font-bold uppercase tracking-widest">{stat.label}</span>
                  </div>
                  <p className="text-3xl font-black tabular-nums text-ink">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Connectivity */}
              <section>
                <h3 className="text-[13px] font-bold text-ink/60/90 uppercase tracking-[0.3em] mb-6 border-l-2 border-primary/40 pl-3">Technical Interface</h3>
                <div className="space-y-1">
                  <TechRow label="Primary IPv4" value={provider.ipv4Primary} icon={Database} />
                  <TechRow label="Secondary IPv4" value={provider.ipv4Secondary} icon={Database} />
                  <TechRow label="DoH Interface" value={provider.dohEndpoint} icon={CloudLightning} />
                  <TechRow label="Private Host" value={provider.dotHostname} icon={Lock} />
                  <TechRow label="Engine" value={provider.androidPrivateDns} icon={Cpu} />
                </div>
              </section>

              {/* Capabilities */}
              <section>
                <h3 className="text-[13px] font-bold text-ink/60/90 uppercase tracking-[0.3em] mb-6 border-l-2 border-primary/40 pl-3">Network Policy</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Ads', status: provider.adBlocking, icon: ShieldAlert },
                    { label: 'Malware', status: provider.malwareProtection, icon: ShieldCheck },
                    { label: 'Family', status: provider.familyFilter, icon: Users },
                    { label: 'Privacy', status: provider.privacyLevel === 'high', icon: Lock }
                  ].map((feat, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all ${feat.status
                        ? 'bg-primary/[0.03] border-primary/20'
                        : 'bg-transparent border-line/10 opacity-30 grayscale'
                        }`}
                    >
                      <feat.icon className={`h-5 w-5 mb-3 ${feat.status ? 'text-primary' : 'text-ink/20'}`} />
                      <p className={`text-[12px] font-black uppercase tracking-widest mb-1 ${feat.status ? 'text-ink' : 'text-ink/30'}`}>{feat.label}</p>
                      <span className={`text-[11px] font-bold uppercase transition-colors ${feat.status ? 'text-primary/70' : 'text-ink/60/30'}`}>{feat.status ? 'Verified' : 'Disabled'}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Actions */}
            <div className="mt-16 flex items-center justify-between pt-8 border-t border-line/20">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500/40 animate-pulse" />
                <span className="text-[11px] font-bold text-ink/40 uppercase tracking-widest">Active System Node</span>
              </div>
              {provider.website && (
                <a
                  href={provider.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3 rounded-xl bg-foreground text-background font-bold text-[11px] uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center gap-3"
                >
                  Provider Site <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
