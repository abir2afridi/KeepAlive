import { useParams, useNavigate } from 'react-router-dom';
import { dnsProviders } from '@/data/dnsProviders';
import { useState, useMemo } from 'react';
import { Clock } from '@/components/Clock';
import {
    Copy,
    ExternalLink,
    Globe,
    Database,
    Activity,
    MapPin,
    ShieldAlert,
    ShieldCheck,
    Zap,
    Server,
    CloudLightning,
    Cpu,
    Fingerprint,
    Users,
    Lock,
    ChevronLeft,
    Share2,
    Shield,
    Sun,
    Moon,
    Info
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { getProviderLogo } from '@/lib/dns-icons';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/theme-provider';

function TechRow({ label, value, icon, subLabel }: { label: string; value: string; icon?: any; subLabel?: string }) {
    if (!value) return null;
    const copy = () => {
        navigator.clipboard.writeText(value);
        toast.success(`${label} copied`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group flex items-center justify-between py-4 border-b border-line/10 last:border-0 hover:bg-line/50 px-3 -mx-3 rounded-xl transition-all"
        >
            <div className="flex items-center gap-5 min-w-0">
                <div className="p-2.5 rounded-xl bg-line/10 text-ink/60 group-hover:text-primary group-hover:bg-primary/5 transition-all border border-line/20 group-hover:border-primary/20 scale-95 shadow-sm overflow-hidden flex items-center justify-center min-w-[42px] min-h-[42px]">
                    {typeof icon === 'string' ? (
                        <img src={icon} alt={label} className="h-6 w-6 object-contain group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                        icon && (() => {
                            const IconComponent = icon;
                            return <IconComponent className="h-4.5 w-4.5" />;
                        })()
                    )}
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-black text-ink/40 uppercase tracking-[0.2em] mb-1">{label}</p>
                    <div className="flex items-center gap-3">
                        <code className="text-[14px] font-mono font-bold text-ink/90 truncate">{value}</code>
                        {subLabel && <span className="px-2 py-0.5 rounded-md bg-line/20 text-[9px] font-black text-ink/60 uppercase tracking-widest border border-line/40">{subLabel}</span>}
                    </div>
                </div>
            </div>
            <Button
                onClick={copy}
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-ink/20 hover:text-ink hover:bg-line/20 transition-all rounded-lg border border-transparent hover:border-line/60"
            >
                <Copy className="h-4 w-4" />
            </Button>
        </motion.div>
    );
}

export default function DnsDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { theme, setTheme } = useTheme();
    const provider = useMemo(() => dnsProviders.find(p => p.id === id), [id]);
    const [expandedFeature, setExpandedFeature] = useState<number | null>(null);

    if (!provider) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-base text-ink">
                <h1 className="text-2xl font-black uppercase tracking-widest mb-4">Node Not Found</h1>
                <Button onClick={() => navigate('/')} variant="outline" className="border-line/50 hover:bg-line/20">
                    Return to Matrix
                </Button>
            </div>
        );
    }

    const shareProvider = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to telemetry clipboard');
    };

    return (
        <main className="h-full flex flex-col min-w-0 relative z-10 overflow-hidden border-l border-line/50">

            <div className="flex-1 flex flex-col xl:flex-row min-w-0 overflow-y-auto xl:overflow-hidden">
                {/* Primary Data Column (Independent Scroll on XL) */}
                <div className="flex-1 xl:overflow-y-auto overflow-x-hidden custom-scrollbar px-10 py-12 relative xl:h-full">
                    {/* Header Backdrop Gradient */}
                    <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

                    <div className="flex items-center justify-between mb-8 relative z-10">
                         <Button
                            onClick={() => navigate(-1)}
                            variant="ghost"
                            className="group flex items-center gap-3 text-ink/60 hover:text-ink transition-all pl-0 h-auto py-2"
                        >
                            <div className="p-1 rounded-lg bg-line/20 group-hover:bg-line/40 border border-line/50 transition-all">
                                <ChevronLeft className="h-4 w-4" />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Matrix</span>
                        </Button>
                        <Button
                            onClick={shareProvider}
                            variant="ghost"
                            className="bg-line/10 hover:bg-line/20 text-ink/60 hover:text-ink transition-all gap-2 h-auto py-2 px-3 border border-line/20"
                        >
                            <Share2 className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Share</span>
                        </Button>
                    </div>

                    {/* Profile Section */}
                    <div className="space-y-12 relative z-10">
                        <section className="space-y-8">
                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                                <div className="p-6 rounded-3xl bg-panel border border-line flex-shrink-0 animate-in fade-in zoom-in duration-500 shadow-xl">
                                    {(() => {
                                        const logo = getProviderLogo(provider);
                                        if (logo) {
                                            return <img src={logo} alt={provider.name} className="h-10 w-10 object-contain" />;
                                        }
                                        return <Globe className="h-10 w-10 text-primary" />;
                                    })()}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-4xl font-black tracking-tighter text-ink uppercase leading-none">
                                            {provider.name}
                                        </h1>
                                        {provider.privacyLevel === 'high' && (
                                            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shadow-lg shadow-emerald-500/5" title="Privacy Enhanced">
                                                <Lock className="h-5 w-5 text-emerald-500" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="text-lg font-bold text-ink/60 uppercase tracking-widest leading-none">{provider.organization}</p>
                                        <div className="w-1 h-1 rounded-full bg-border" />
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-3.5 w-3.5 text-primary opacity-60" />
                                            <span className="text-[12px] font-bold text-ink/60 uppercase tracking-widest">{provider.region} • {provider.country}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                {[
                                    { label: 'Security Score', value: provider.securityScore || 92, unit: '%', icon: Shield },
                                    { label: 'System Uptime', value: '100.0', unit: '%', icon: Activity },
                                    { label: 'Global Rank', value: '1st', unit: '', icon: Zap },
                                    { label: 'Nodes', value: '48+', unit: '', icon: Server }
                                ].map((stat, idx) => (
                                    <div key={idx} className="p-5 rounded-2xl bg-line/10 border border-line/60 space-y-3 shadow-sm group hover:border-primary/20 transition-all">
                                        <div className="flex items-center gap-2 text-ink/60/80">
                                            <stat.icon className="h-4 w-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">{stat.label}</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-ink tabular-nums tracking-tighter">{stat.value}</span>
                                            <span className="text-[11px] font-black text-ink/60 uppercase">{stat.unit}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-12 pb-12">
                            {/* Network Core */}
                            <div>
                                <h3 className="text-[12px] font-black text-ink/40 uppercase tracking-[0.4em] mb-6 border-l-2 border-primary/60 pl-4">Network Infrastructure (IPv4)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                    <TechRow label="Primary IPv4 Gateway" value={provider.ipv4Primary} icon="https://img.icons8.com/fluency/48/database.png" subLabel="Alpha" />
                                    <TechRow label="Secondary IPv4 Gateway" value={provider.ipv4Secondary || '--'} icon="https://img.icons8.com/fluency/48/database.png" subLabel="Beta" />
                                    <TechRow label="Subnet Mask" value="255.255.255.0" icon="https://img.icons8.com/fluency/48/grid.png" subLabel="Standard" />
                                    <TechRow label="Port Configuration" value="53 (UDP/TCP)" icon="https://img.icons8.com/fluency/48/usb-connector.png" subLabel="Open" />
                                </div>
                            </div>

                            {/* IPv6 Core */}
                            {provider.ipv6Primary && (
                                <div>
                                    <h3 className="text-[12px] font-black text-ink/40 uppercase tracking-[0.4em] mb-6 border-l-2 border-primary/60 pl-4">Next-Gen Connectivity (IPv6)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                        <TechRow label="Primary IPv6 Node" value={provider.ipv6Primary} icon="https://img.icons8.com/fluency/48/network-cable.png" subLabel="V6-A" />
                                        <TechRow label="Secondary IPv6 Node" value={provider.ipv6Secondary || '--'} icon="https://img.icons8.com/fluency/48/network-cable.png" subLabel="V6-B" />
                                        <TechRow label="Address Scope" value="Global Unicast" icon="https://img.icons8.com/fluency/48/satellite-sending.png" />
                                        <TechRow label="Routing Type" value="Anycast" icon="https://img.icons8.com/fluency/48/share.png" />
                                    </div>
                                </div>
                            )}

                            {/* Technical Protocols */}
                            <div>
                                <h3 className="text-[12px] font-black text-ink/40 uppercase tracking-[0.4em] mb-6 border-l-2 border-primary/60 pl-4">Technical Protocols</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                    <TechRow label="DNS-over-HTTPS (DoH)" value={provider.dohEndpoint || '--'} icon="https://img.icons8.com/?size=96&id=DwGn7dCaUcoh&format=png" subLabel="TLS 1.3" />
                                    <TechRow label="DNS-over-TLS (DoT)" value={provider.dotHostname || '--'} icon="https://img.icons8.com/fluency/48/lock.png" subLabel="Secure" />
                                    <TechRow label="Android Private DNS" value={provider.androidPrivateDns || '--'} icon="https://img.icons8.com/fluency/48/android-os.png" />
                                    <TechRow label="DNSSEC Support" value="Enabled" icon="https://img.icons8.com/fluency/48/checked-user-male.png" subLabel="Verified" />
                                    <TechRow label="ECS Status" value={provider.id.includes('ecs') ? 'Enabled' : 'Disabled'} icon="https://img.icons8.com/fluency/48/services.png" />
                                    <TechRow label="Node Identifier" value={provider.id.toUpperCase()} icon="https://img.icons8.com/fluency/48/fingerprint.png" />
                                </div>
                            </div>

                            {/* Geospatial Matrix */}
                            <div>
                                <h3 className="text-[12px] font-black text-ink/40 uppercase tracking-[0.4em] mb-6 border-l-2 border-primary/60 pl-4">Geospatial Matrix</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                    <TechRow label="Primary Deployment" value={provider.region} icon="https://img.icons8.com/fluency/48/globe.png" />
                                    <TechRow label="Jurisdiction" value={provider.country} icon="https://img.icons8.com/fluency/48/flag.png" />
                                    <TechRow label="Coordinate X (Lat)" value={provider.lat.toString()} icon="https://img.icons8.com/fluency/48/map-pin.png" />
                                    <TechRow label="Coordinate Y (Lng)" value={provider.lng.toString()} icon="https://img.icons8.com/fluency/48/map-pin.png" />
                                    <TechRow label="Node Precision" value="High Precision" icon="https://img.icons8.com/fluency/48/target.png" />
                                    <TechRow label="Signal Range" value="Global Reach" icon="https://img.icons8.com/fluency/48/wifi.png" />
                                </div>
                            </div>

                            {/* Platform Intelligence */}
                            <div>
                                <h3 className="text-[12px] font-black text-ink/40 uppercase tracking-[0.4em] mb-6 border-l-2 border-primary/60 pl-4">Platform Intelligence</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                                    <TechRow label="Proprietary Entity" value={provider.organization} icon="https://img.icons8.com/fluency/48/building.png" />
                                    <TechRow label="Privacy Profile" value={provider.privacyLevel.toUpperCase()} icon="https://img.icons8.com/fluency/48/private-lock.png" subLabel={provider.privacyLevel === 'high' ? 'Maximum' : 'Standard'} />
                                    <TechRow label="Trust Vector" value={`${provider.securityScore}%`} icon="https://img.icons8.com/fluency/48/shield.png" subLabel="Rating" />
                                    <TechRow label="System Status" value="OPERATIONAL" icon="https://img.icons8.com/fluency/48/ok.png" subLabel="Live" />
                                    <TechRow label="Uptime Record" value="99.99%" icon="https://img.icons8.com/fluency/48/clock.png" />
                                    <TechRow label="Data Compliance" value="GDPR / CCPA" icon="https://img.icons8.com/fluency/48/diploma.png" />
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Right Analytical Side-Matrix (Independent Scroll on XL) */}
                <aside className="w-full xl:w-[400px] xl:border-l border-line/40 bg-panel/20 backdrop-blur-sm p-8 flex flex-col gap-10 xl:h-full xl:overflow-y-auto custom-scrollbar shrink-0">
                    <section className="space-y-8">
                        <div>
                            <h3 className="text-[14px] font-black text-ink/60 uppercase tracking-[0.4em] mb-8">Threat Mitigation</h3>
                            <div className="space-y-3">
                                <div className="space-y-3">
                                    {[
                                        {
                                            label: 'Ads Filter',
                                            status: provider.adBlocking,
                                            icon: "https://img.icons8.com/?size=160&id=rzIxJoAnwiHC&format=png",
                                            desc: 'Block tracking nodes',
                                            note: 'Prevents advertisements and track scripts from loading at the DNS level, improving speed and preventing cross-site tracking.'
                                        },
                                        {
                                            label: 'Malware Guard',
                                            status: provider.malwareProtection,
                                            icon: "https://img.icons8.com/?size=96&id=n0i8GliATitt&format=png",
                                            desc: 'Active link validation',
                                            note: 'Automatically blocks access to known malicious domains, phishing sites, and command-and-control servers.'
                                        },
                                        {
                                            label: 'Family Sync',
                                            status: provider.familyFilter,
                                            icon: "https://img.icons8.com/fluency/48/conference-call.png",
                                            desc: 'Filtered child access',
                                            note: 'Filters out adult content and restricts access to potentially harmful categories to ensure a safe browsing experience for children.'
                                        },
                                        {
                                            label: 'Privacy Protocol',
                                            status: provider.privacyLevel === 'high',
                                            icon: "https://img.icons8.com/?size=96&id=4u2Za4KEhPBZ&format=png",
                                            desc: 'Zero-log processing',
                                            note: 'Ensures that your DNS queries are not logged and your data is not sold to third parties. High level means a strict no-logs policy.'
                                        }
                                    ].map((feat, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-4 rounded-xl border transition-all flex flex-col gap-3.5 ${feat.status
                                                ? 'bg-primary/5 border-primary/20 shadow-sm'
                                                : 'bg-line/20/30 border-line/40 opacity-40 grayscale'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3.5">
                                                <div className={`p-1.5 rounded-lg h-fit flex items-center justify-center ${feat.status ? 'bg-white shadow-sm border border-line/10' : 'bg-line/20'}`}>
                                                    <img src={feat.icon} alt={feat.label} className="h-5 w-5 object-contain" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-0.5">
                                                        <div className="flex items-center gap-2">
                                                            <p className={`text-[11px] font-black uppercase tracking-widest ${feat.status ? 'text-ink' : 'text-ink/60'}`}>{feat.label}</p>
                                                            <button
                                                                onClick={() => setExpandedFeature(expandedFeature === idx ? null : idx)}
                                                                className={`p-0.5 hover:bg-line/20 rounded-md transition-all ${expandedFeature === idx ? 'bg-primary/10 text-primary scale-110' : 'text-ink/40'}`}
                                                            >
                                                                <Info className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                        {feat.status && <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">ACTIVE</span>}
                                                    </div>
                                                    <p className="text-[10px] text-ink/60 font-bold leading-tight">{feat.desc}</p>
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {expandedFeature === idx && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3, ease: 'circOut' }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="pt-3 border-t border-line/20 text-[10px] font-medium text-ink/60/80 leading-relaxed italic">
                                                            {feat.note}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl border border-line/40 bg-line/5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Benchmarking</span>
                            </div>
                            <p className="text-[10px] text-ink/60 font-bold leading-relaxed uppercase tracking-wider">
                                Monitored in real-time by the NetPulse telemetry engine for global stability.
                            </p>
                        </div>

                        {provider.website && (
                            <a
                                href={provider.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-3 py-6 rounded-2xl bg-ink text-base font-black text-[11px] uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-xl shadow-ink/5"
                            >
                                Access Registry <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        )}
                    </section>
                </aside>
            </div>
        </main >
    );
}
