import { useState, lazy, Suspense, ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
    Globe, MapPin, Wifi, Shield, Copy, Check, Activity, Server,
    Monitor, Smartphone, Tablet, Clock, Zap, AlertTriangle, Radio,
    ChevronRight, RefreshCw, Lock, Unlock, Eye, Hash, Languages,
    Phone, DollarSign, Navigation, Cpu, ScreenShare, Cookie,
    EyeOff, Fingerprint, Signal
} from 'lucide-react';
import { toast } from 'sonner';
import { useNetworkProfile } from '@/hooks/useNetworkProfile';

// Lazy load the map component for performance
const ProfileMap = lazy(() => import('@/components/ProfileMap'));

// ─── Copy Button Helper ────────────────────────────────────
function CopyButton({ value, label }: { value: string; label: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        if (!value || value === 'Unavailable') return;
        await navigator.clipboard.writeText(value);
        setCopied(true);
        toast.success(`${label} copied to clipboard`);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-primary/10 border border-white/5 hover:border-primary/20 transition-all group"
            title={`Copy ${label}`}
        >
            {copied ? (
                <Check className="h-3 w-3 text-emerald-400" />
            ) : (
                <Copy className="h-3 w-3 text-ink group-hover:text-primary transition-colors" />
            )}
        </button>
    );
}

// ─── Status Badge ──────────────────────────────────────────
function StatusBadge({ status, type }: { status: string; type: 'vpn' | 'dns' }) {
    const colors: Record<string, string> = {
        'Residential IP': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'VPN Detected': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'Proxy Suspected': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'Tor Exit Node': 'bg-red-500/10 text-red-400 border-red-500/20',
        'Data Center IP': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        'ISP DNS': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        'Public DNS': 'bg-primary/10 text-primary border-primary/20',
        'Custom DNS': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
        'Unknown': 'bg-muted text-ink border-line',
    };
    const c = colors[status] || colors['Unknown'];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${c}`}>
            {type === 'vpn' ? <Eye className="h-3 w-3" /> : <Radio className="h-3 w-3" />}
            {status}
        </span>
    );
}

// ─── Skeleton Loader ───────────────────────────────────────
function SkeletonBlock({ className = '' }: { className?: string }) {
    return <div className={`animate-pulse bg-muted/30 rounded-xl ${className}`} />;
}

// ─── Device Icon ───────────────────────────────────────────
function DeviceIcon({ type }: { type: string }) {
    if (type === 'Mobile') return <Smartphone className="h-4 w-4" />;
    if (type === 'Tablet') return <Tablet className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
}

// ─── Stability Indicator ───────────────────────────────────
function StabilityIndicator({ stability }: { stability: string }) {
    const colors: Record<string, string> = {
        Excellent: 'text-emerald-400',
        Good: 'text-primary',
        Fair: 'text-amber-400',
        Poor: 'text-red-400',
    };
    const bars: Record<string, number> = { Excellent: 4, Good: 3, Fair: 2, Poor: 1 };
    const n = bars[stability] || 0;
    return (
        <div className="flex items-center gap-2">
            <div className="flex items-end gap-0.5 h-4">
                {[1, 2, 3, 4].map(i => (
                    <div
                        key={i}
                        className={`w-1 rounded-full transition-all ${i <= n ? colors[stability] || 'text-ink' : 'bg-muted/20'
                            }`}
                        style={{
                            height: `${i * 25}%`,
                            backgroundColor: i <= n ? 'currentColor' : undefined,
                        }}
                    />
                ))}
            </div>
            <span className={`text-xs font-bold ${colors[stability] || 'text-ink'}`}>{stability}</span>
        </div>
    );
}

// ─── Info Row ──────────────────────────────────────────────
function InfoRow({ icon, label, value, copyable }: { icon: ReactNode; label: string; value: string; copyable?: boolean }) {
    if (!value) return null;
    return (
        <div className="p-3 rounded-xl bg-panel/20 border border-line/20 space-y-1 group hover:border-primary/20 transition-all">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-ink/50">
                    {icon}
                    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
                </div>
                {copyable && <CopyButton value={value} label={label} />}
            </div>
            <p className="text-sm font-bold text-ink truncate" title={value}>
                {value}
            </p>
        </div>
    );
}

// ─── MAIN COMPONENT ────────────────────────────────────────
export default function ProfilePage() {
    const {
        networkInfo, browserInfo, dnsLatencies, resolverGuess,
        vpnDetection, dnsTypeDetection, diagnostics,
        loading, refreshing, dnsTestRunning, lastChecked,
        runDnsTests, refreshAll,
    } = useNetworkProfile();

    const sortedLatencies = [...dnsLatencies]
        .filter(d => d.status === 'success')
        .sort((a, b) => a.latency - b.latency);
    const top3 = sortedLatencies.slice(0, 3);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.06, delayChildren: 0.1 },
        },
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
    };

    const formatLastChecked = () => {
        if (!lastChecked) return null;
        const now = new Date();
        const diff = Math.round((now.getTime() - lastChecked.getTime()) / 1000);
        if (diff < 5) return 'Just now';
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return lastChecked.toLocaleTimeString();
    };

    return (
        <div className="w-full">
            <main className="p-8 pb-32 w-full max-w-7xl mx-auto space-y-10">
                

                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <SkeletonBlock className="col-span-2 h-64" />
                        <SkeletonBlock className="h-64" />
                        <SkeletonBlock className="h-48" />
                        <SkeletonBlock className="h-48" />
                        <SkeletonBlock className="h-48" />
                    </div>
                ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
                        {/* ─── Row 1: Network Profile Card + Map ─── */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Network Profile Card */}
                            <motion.div variants={itemVariants} className="lg:col-span-2 p-6 rounded-2xl bg-panel border border-line/40 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                                            <Globe className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h2 className="text-xs font-black uppercase tracking-widest text-ink">Network Identity</h2>
                                            <p className="text-[10px] text-ink font-bold uppercase tracking-wider">Public endpoint information</p>
                                        </div>
                                    </div>
                                    {networkInfo?.ip && networkInfo.ip !== 'Unavailable' && (
                                        <div className="flex flex-col items-end gap-2">
                                            {/* IPv4 Address */}
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-panel/30 border border-line/40">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-xs font-black text-ink tracking-tight font-mono">{networkInfo.ip}</span>
                                                {networkInfo.ipVersion && (
                                                    <span className="text-[9px] font-bold text-ink bg-muted/30 px-1.5 py-0.5 rounded">{networkInfo.ipVersion}</span>
                                                )}
                                                <CopyButton value={networkInfo.ip} label="IP Address" />
                                            </div>
                                            {/* IPv6 Address */}
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-panel/20 border border-line/30">
                                                {networkInfo.ipv6.type === 'public' ? (
                                                    <>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                                                        <span className="text-[10px] font-bold text-ink tracking-tight font-mono max-w-[220px] truncate" title={networkInfo.ipv6.address}>{networkInfo.ipv6.address}</span>
                                                        <span className="text-[9px] font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">IPv6</span>
                                                        <CopyButton value={networkInfo.ipv6.address} label="IPv6 Address" />
                                                    </>
                                                ) : networkInfo.ipv6.type === 'link-local' ? (
                                                    <>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                        <span className="text-[10px] font-bold text-ink tracking-tight font-mono max-w-[220px] truncate" title={networkInfo.ipv6.address}>{networkInfo.ipv6.address}</span>
                                                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Link-local</span>
                                                        <CopyButton value={networkInfo.ipv6.address} label="IPv6 Address" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500/40" />
                                                        <span className="text-[10px] font-bold text-ink/60 tracking-tight">ISP not providing IPv6</span>
                                                        <span className="text-[9px] font-bold text-red-400/60 bg-red-500/10 px-1.5 py-0.5 rounded">No IPv6</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {[
                                        { label: 'Country', value: networkInfo?.country, icon: MapPin },
                                        { label: 'City', value: networkInfo?.city, icon: MapPin },
                                        { label: 'Region', value: networkInfo?.region, icon: Globe },
                                        { label: 'ISP', value: networkInfo?.isp, icon: Server, copyable: true },
                                        { label: 'ASN', value: networkInfo?.asn, icon: Radio, copyable: true },
                                        { label: 'Timezone', value: networkInfo?.timezone, icon: Clock },
                                        { label: 'Coordinates', value: networkInfo && networkInfo.lat !== 0 ? `${networkInfo.lat.toFixed(4)}, ${networkInfo.lng.toFixed(4)}` : '', icon: Navigation, copyable: true },
                                        { label: 'Postal Code', value: networkInfo?.postalCode, icon: Hash },
                                        { label: 'UTC Offset', value: networkInfo?.utcOffset, icon: Clock },
                                    ].map((item, i) => (
                                        <div key={i} className="p-3.5 rounded-xl bg-panel/20 border border-line/20 space-y-1.5 group hover:border-primary/20 transition-all">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-ink/50">
                                                    <item.icon className="h-3 w-3" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                                                </div>
                                                {item.copyable && item.value && (
                                                    <CopyButton value={item.value} label={item.label} />
                                                )}
                                            </div>
                                            <p className="text-sm font-bold text-ink truncate" title={item.value || ''}>
                                                {item.value || 'N/A'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Location Map */}
                            <motion.div variants={itemVariants} className="rounded-2xl overflow-hidden border border-line/40 bg-panel relative min-h-[280px]">
                                <div className="absolute top-4 left-4 z-[1001] px-2.5 py-1 bg-base/80 backdrop-blur-md rounded-lg border border-line/40">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-primary/60">Your Location</span>
                                </div>
                                {networkInfo && networkInfo.lat !== 0 && (
                                    <Suspense fallback={
                                        <div className="h-full w-full flex items-center justify-center">
                                            <Globe className="h-8 w-8 animate-pulse text-ink/20" />
                                        </div>
                                    }>
                                        <ProfileMap
                                            lat={networkInfo.lat}
                                            lng={networkInfo.lng}
                                            city={networkInfo.city}
                                            country={networkInfo.country}
                                        />
                                    </Suspense>
                                )}
                                {(!networkInfo || networkInfo.lat === 0) && (
                                    <div className="h-full w-full flex flex-col items-center justify-center gap-3 text-ink/30">
                                        <MapPin className="h-8 w-8" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Location unavailable</span>
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        {/* ─── Row 2: Extended Network Info + Country/Regional Data ─── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Regional / Country Info */}
                            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-panel border border-line/40 space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                                        <Globe className="h-5 w-5 text-cyan-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xs font-black uppercase tracking-widest text-ink">Regional Info</h2>
                                        <p className="text-[10px] text-ink font-bold uppercase tracking-wider">Country & locale data</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <InfoRow icon={<Hash className="h-3 w-3" />} label="Country Code" value={networkInfo?.countryCode || ''} copyable />
                                    <InfoRow icon={<Globe className="h-3 w-3" />} label="Continent" value={networkInfo?.continent || ''} />
                                    <InfoRow icon={<DollarSign className="h-3 w-3" />} label="Currency" value={networkInfo?.currency || ''} />
                                    <InfoRow icon={<Phone className="h-3 w-3" />} label="Calling Code" value={networkInfo?.callingCode || ''} />
                                    <InfoRow icon={<Languages className="h-3 w-3" />} label="Languages" value={networkInfo?.languages || ''} />
                                </div>
                            </motion.div>

                            {/* Connection Details */}
                            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-panel border border-line/40 space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                        <Monitor className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xs font-black uppercase tracking-widest text-ink">Connection Details</h2>
                                        <p className="text-[10px] text-ink font-bold uppercase tracking-wider">Device & browser</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {browserInfo && [
                                        { label: 'Browser', value: `${browserInfo.browser} ${browserInfo.browserVersion}`, icon: <Globe className="h-3 w-3" /> },
                                        { label: 'OS', value: browserInfo.os, icon: <Monitor className="h-3 w-3" /> },
                                        { label: 'Device', value: browserInfo.deviceType, icon: <DeviceIcon type={browserInfo.deviceType} /> },
                                        { label: 'Connection', value: browserInfo.connectionType, icon: <Wifi className="h-3 w-3" /> },
                                        { label: 'Screen', value: browserInfo.screenResolution, icon: <ScreenShare className="h-3 w-3" /> },
                                        { label: 'Language', value: browserInfo.language, icon: <Languages className="h-3 w-3" /> },
                                    ].map((item, i) => (
                                        <div key={i} className="p-3 rounded-xl bg-panel/20 border border-line/20 space-y-1">
                                            <div className="flex items-center gap-2 text-ink/50">
                                                {item.icon}
                                                <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                                            </div>
                                            <p className="text-sm font-bold text-ink truncate">{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* System Capabilities */}
                            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-panel border border-line/40 space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                        <Cpu className="h-5 w-5 text-orange-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-xs font-black uppercase tracking-widest text-ink">System Info</h2>
                                        <p className="text-[10px] text-ink font-bold uppercase tracking-wider">Hardware & privacy</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    {browserInfo && [
                                        { label: 'Platform', value: browserInfo.platform, icon: <Fingerprint className="h-3 w-3" /> },
                                        { label: 'CPU Cores', value: browserInfo.cores, icon: <Cpu className="h-3 w-3" /> },
                                        { label: 'Memory', value: browserInfo.memory, icon: <Signal className="h-3 w-3" /> },
                                        { label: 'Touch Support', value: browserInfo.touchSupport, icon: <Smartphone className="h-3 w-3" /> },
                                        { label: 'Cookies', value: browserInfo.cookiesEnabled, icon: <Cookie className="h-3 w-3" /> },
                                        { label: 'Do Not Track', value: browserInfo.doNotTrack, icon: <EyeOff className="h-3 w-3" /> },
                                    ].map((item, i) => (
                                        <div key={i} className="p-3 rounded-xl bg-panel/20 border border-line/20 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-ink/50">
                                                {item.icon}
                                                <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                                            </div>
                                            <span className="text-sm font-bold text-ink">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        {/* ─── Row 3: VPN Detection ─── */}
                        <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-panel border border-line/40 space-y-5">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl border ${vpnDetection?.isVpn || vpnDetection?.isTor
                                    ? 'bg-amber-500/10 border-amber-500/20'
                                    : 'bg-emerald-500/10 border-emerald-500/20'
                                    }`}>
                                    {vpnDetection?.isVpn || vpnDetection?.isTor
                                        ? <AlertTriangle className="h-5 w-5 text-amber-400" />
                                        : <Shield className="h-5 w-5 text-emerald-400" />
                                    }
                                </div>
                                <div>
                                    <h2 className="text-xs font-black uppercase tracking-widest text-ink">Security Analysis</h2>
                                    <p className="text-[10px] text-ink font-bold uppercase tracking-wider">IP intelligence & VPN detection</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { label: 'VPN', detected: vpnDetection?.isVpn },
                                    { label: 'Proxy', detected: vpnDetection?.isProxy },
                                    { label: 'Tor', detected: vpnDetection?.isTor },
                                    { label: 'Data Center', detected: vpnDetection?.isDatacenter },
                                ].map((item, i) => (
                                    <div key={i} className="p-3 rounded-xl bg-panel/20 border border-line/20 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-ink">{item.label}</span>
                                        {item.detected ? (
                                            <div className="flex items-center gap-1.5">
                                                <Unlock className="h-3 w-3 text-amber-400" />
                                                <span className="text-[10px] font-black text-amber-400 uppercase">Detected</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5">
                                                <Lock className="h-3 w-3 text-emerald-400" />
                                                <span className="text-[10px] font-black text-emerald-400 uppercase">Clear</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* ─── Row 4: DNS Latency + Resolver + Diagnostics ─── */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* DNS Latency Test */}
                            <motion.div variants={itemVariants} className="lg:col-span-2 p-6 rounded-2xl bg-panel border border-line/40 space-y-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                                            <Zap className="h-5 w-5 text-violet-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xs font-black uppercase tracking-widest text-ink">DNS Latency Test</h2>
                                            <p className="text-[10px] text-ink font-bold uppercase tracking-wider">Major resolver performance</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={runDnsTests}
                                        disabled={dnsTestRunning}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-panel/30 border border-line/40 text-[10px] font-black uppercase tracking-widest text-ink hover:text-ink hover:border-primary/20 transition-all disabled:opacity-50"
                                    >
                                        <RefreshCw className={`h-3 w-3 ${dnsTestRunning ? 'animate-spin' : ''}`} />
                                        {dnsTestRunning ? 'Testing...' : 'Re-test'}
                                    </button>
                                </div>

                                {/* Latency Table */}
                                <div className="space-y-2">
                                    <div className="grid grid-cols-4 gap-4 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-ink/50">
                                        <span>Provider</span>
                                        <span>IP Address</span>
                                        <span>Latency</span>
                                        <span>Status</span>
                                    </div>
                                    {dnsLatencies.map((item, i) => {
                                        const isTop = top3.some(t => t.provider === item.provider);
                                        const rank = top3.findIndex(t => t.provider === item.provider);
                                        return (
                                            <motion.div
                                                key={item.provider}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className={`grid grid-cols-4 gap-4 px-4 py-3 rounded-xl border transition-all ${isTop && rank === 0
                                                    ? 'bg-primary/5 border-primary/20'
                                                    : 'bg-panel/10 border-line/20 hover:border-line/40'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {isTop && rank === 0 && <Zap className="h-3 w-3 text-primary fill-primary" />}
                                                    <span className="text-sm font-bold text-ink">{item.provider}</span>
                                                </div>
                                                <span className="text-sm font-mono text-ink">{item.ip}</span>
                                                <span className={`text-sm font-black font-mono ${item.status === 'pending' ? 'text-ink/40'
                                                    : item.status === 'error' ? 'text-red-400'
                                                        : item.latency < 50 ? 'text-emerald-400'
                                                            : item.latency < 100 ? 'text-primary'
                                                                : item.latency < 200 ? 'text-amber-400'
                                                                    : 'text-red-400'
                                                    }`}>
                                                    {item.status === 'pending' ? '...' : item.status === 'error' ? 'Failed' : `${item.latency.toFixed(1)} ms`}
                                                </span>
                                                <div>
                                                    {item.status === 'pending' && (
                                                        <div className="w-4 h-4 border-2 border-muted-foreground/20 border-t-primary rounded-full animate-spin" />
                                                    )}
                                                    {item.status === 'success' && (
                                                        <span className="text-[10px] font-black uppercase text-emerald-400">OK</span>
                                                    )}
                                                    {item.status === 'error' && (
                                                        <span className="text-[10px] font-black uppercase text-red-400">ERR</span>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>

                                {/* Recommendation */}
                                {top3.length > 0 && (
                                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Zap className="h-3.5 w-3.5 text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Recommended DNS for Your Network</span>
                                        </div>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            {top3.map((r, i) => (
                                                <div key={r.provider} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${i === 0
                                                    ? 'bg-primary/10 border-primary/30 text-primary'
                                                    : 'bg-panel/20 border-line/30 text-ink'
                                                    }`}>
                                                    <span className="text-[10px] font-black">#{i + 1}</span>
                                                    <span className="text-xs font-bold">{r.provider}</span>
                                                    <span className="text-[10px] font-mono">{r.latency.toFixed(1)}ms</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>

                            {/* Right column: Resolver + Diagnostics */}
                            <div className="space-y-6">
                                {/* DNS Resolver Detection */}
                                <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-panel border border-line/40 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                            <Radio className="h-5 w-5 text-amber-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xs font-black uppercase tracking-widest text-ink">DNS Resolver</h2>
                                            <p className="text-[10px] text-ink font-bold uppercase tracking-wider">Estimated active resolver</p>
                                        </div>
                                    </div>

                                    {resolverGuess ? (
                                        <div className="space-y-3">
                                            <div className="p-4 rounded-xl bg-panel/20 border border-line/20 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-lg font-black text-ink">{resolverGuess.name}</span>
                                                    {dnsTypeDetection && (
                                                        <StatusBadge status={dnsTypeDetection.type} type="dns" />
                                                    )}
                                                </div>
                                                {/* Show the matched DNS server IP */}
                                                {dnsLatencies.filter(d => d.status === 'success').sort((a, b) => a.latency - b.latency)[0] && (
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/20 border border-line/20">
                                                            <Server className="h-3 w-3 text-ink/50" />
                                                            <span className="text-[10px] font-mono font-bold text-ink">
                                                                {dnsLatencies.filter(d => d.status === 'success').sort((a, b) => a.latency - b.latency)[0].ip}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/20 border border-line/20">
                                                            <Zap className="h-3 w-3 text-ink/50" />
                                                            <span className="text-[10px] font-mono font-bold text-ink">
                                                                {dnsLatencies.filter(d => d.status === 'success').sort((a, b) => a.latency - b.latency)[0].latency.toFixed(1)}ms
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Confidence bar */}
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${resolverGuess.confidence * 100}%` }}
                                                            transition={{ duration: 1, delay: 0.5 }}
                                                            className="h-full bg-primary rounded-full"
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-black text-ink">{Math.round(resolverGuess.confidence * 100)}%</span>
                                                </div>
                                                <p className="text-[9px] font-bold text-ink/40 uppercase tracking-widest">Detection via latency correlation</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-xl bg-panel/20 border border-line/20 flex items-center justify-center">
                                            <span className="text-xs text-ink/60 font-bold">Analyzing...</span>
                                        </div>
                                    )}
                                </motion.div>

                                {/* Network Diagnostics */}
                                <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-panel border border-line/40 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                            <Activity className="h-5 w-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-xs font-black uppercase tracking-widest text-ink">Diagnostics</h2>
                                            <p className="text-[10px] text-ink font-bold uppercase tracking-wider">Network health metrics</p>
                                        </div>
                                    </div>

                                    {diagnostics ? (
                                        <div className="space-y-3">
                                            <div className="p-3 rounded-xl bg-panel/20 border border-line/20 flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-ink">DNS Latency</span>
                                                <span className="text-sm font-black font-mono text-ink">{diagnostics.dnsLatency}ms</span>
                                            </div>
                                            <div className="p-3 rounded-xl bg-panel/20 border border-line/20 flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-ink">Stability</span>
                                                <StabilityIndicator stability={diagnostics.stability} />
                                            </div>
                                            <div className="p-3 rounded-xl bg-panel/20 border border-line/20 flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-ink">Packet OK</span>
                                                <span className={`text-sm font-black font-mono ${diagnostics.packetSuccess >= 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                    {diagnostics.packetSuccess}%
                                                </span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-24 flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-muted-foreground/20 border-t-primary rounded-full animate-spin" />
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
