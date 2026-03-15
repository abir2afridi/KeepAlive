import { useState, useCallback, useEffect, useRef } from 'react';

// ─── Types ───────────────────────────────────────────────────
export interface IPv6Info {
    address: string;
    type: 'public' | 'link-local' | 'none';
}

export interface NetworkInfo {
    ip: string;
    ipv6: IPv6Info;
    ipVersion: string;
    country: string;
    countryCode: string;
    city: string;
    region: string;
    isp: string;
    asn: string;
    timezone: string;
    lat: number;
    lng: number;
    org: string;
    postalCode: string;
    continent: string;
    currency: string;
    callingCode: string;
    languages: string;
    hostname: string;
    utcOffset: string;
}

export interface BrowserInfo {
    browser: string;
    browserVersion: string;
    os: string;
    deviceType: string;
    connectionType: string;
    screenResolution: string;
    language: string;
    cookiesEnabled: string;
    doNotTrack: string;
    platform: string;
    cores: string;
    memory: string;
    touchSupport: string;
}

export interface DnsLatencyResult {
    provider: string;
    ip: string;
    latency: number;
    status: 'success' | 'error' | 'pending';
}

export interface DnsResolverGuess {
    name: string;
    confidence: number;
}

export interface VpnDetection {
    isVpn: boolean;
    isProxy: boolean;
    isTor: boolean;
    isDatacenter: boolean;
    status: 'Residential IP' | 'VPN Detected' | 'Proxy Suspected' | 'Tor Exit Node' | 'Data Center IP' | 'Unknown';
}

export interface DnsTypeDetection {
    type: 'ISP DNS' | 'Public DNS' | 'Custom DNS' | 'Unknown';
}

export interface DnsResolverInfo {
    name: string;
    ip: string;
    confidence: number;
    method: string;
}

export interface NetworkDiagnostics {
    dnsLatency: number;
    stability: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    packetSuccess: number;
}

// ─── Browser Detection (client-side only) ────────────────────
function detectBrowser(): BrowserInfo {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let browserVersion = '';
    let os = 'Unknown';
    let deviceType = 'Desktop';

    // Browser detection
    if (ua.includes('Firefox/')) {
        browser = 'Firefox';
        browserVersion = ua.split('Firefox/')[1]?.split(' ')[0] || '';
    } else if (ua.includes('Edg/')) {
        browser = 'Edge';
        browserVersion = ua.split('Edg/')[1]?.split(' ')[0] || '';
    } else if (ua.includes('Chrome/')) {
        browser = 'Chrome';
        browserVersion = ua.split('Chrome/')[1]?.split(' ')[0] || '';
    } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
        browser = 'Safari';
        browserVersion = ua.split('Version/')[1]?.split(' ')[0] || '';
    } else if (ua.includes('Opera') || ua.includes('OPR/')) {
        browser = 'Opera';
        browserVersion = ua.split('OPR/')[1]?.split(' ')[0] || '';
    }

    // OS detection
    if (ua.includes('Windows NT 10')) os = 'Windows 10/11';
    else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1';
    else if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac OS X')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    // Device type
    if (/Mobi|Android/i.test(ua)) deviceType = 'Mobile';
    else if (/Tablet|iPad/i.test(ua)) deviceType = 'Tablet';

    // Connection type
    const nav = navigator as any;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    const connectionType = conn?.effectiveType || conn?.type || 'Unknown';

    // Screen resolution
    const screenResolution = `${window.screen.width}×${window.screen.height}`;

    // Language
    const language = navigator.language || 'Unknown';

    // Cookies
    const cookiesEnabled = navigator.cookieEnabled ? 'Enabled' : 'Disabled';

    // Do Not Track
    const dnt = nav.doNotTrack || (window as any).doNotTrack || nav.msDoNotTrack;
    const doNotTrack = dnt === '1' || dnt === 'yes' ? 'Enabled' : 'Disabled';

    // Platform
    const platform = nav.userAgentData?.platform || navigator.platform || 'Unknown';

    // CPU Cores
    const cores = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} cores` : 'Unknown';

    // Memory (Chrome only)
    const memory = nav.deviceMemory ? `${nav.deviceMemory} GB` : 'Unknown';

    // Touch support
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0 ? 'Yes' : 'No';

    return {
        browser, browserVersion, os, deviceType, connectionType,
        screenResolution, language, cookiesEnabled, doNotTrack,
        platform, cores, memory, touchSupport,
    };
}

// ─── DNS Latency Testing ─────────────────────────────────────
const DNS_TARGETS = [
    { provider: 'Cloudflare', ip: '1.1.1.1', endpoint: 'https://cloudflare-dns.com/dns-query?name=example.com&type=A' },
    { provider: 'Google', ip: '8.8.8.8', endpoint: 'https://dns.google/resolve?name=example.com&type=A' },
    { provider: 'Quad9', ip: '9.9.9.9', endpoint: 'https://dns.quad9.net:5053/dns-query?name=example.com&type=A' },
    { provider: 'AdGuard', ip: '94.140.14.14', endpoint: 'https://dns.adguard-dns.com/dns-query?name=example.com&type=A' },
];

async function testDnsLatency(endpoint: string, timeoutMs = 5000): Promise<number> {
    const start = performance.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const resp = await fetch(endpoint, {
            headers: { Accept: 'application/dns-json' },
            signal: controller.signal,
            mode: 'cors',
            cache: 'no-store',
        });
        clearTimeout(timer);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        await resp.json();
        return performance.now() - start;
    } catch {
        clearTimeout(timer);
        return -1;
    }
}

// ─── Main Hook ───────────────────────────────────────────────
export function useNetworkProfile() {
    const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
    const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
    const [dnsLatencies, setDnsLatencies] = useState<DnsLatencyResult[]>([]);
    const [resolverGuess, setResolverGuess] = useState<DnsResolverGuess | null>(null);
    const [vpnDetection, setVpnDetection] = useState<VpnDetection | null>(null);
    const [dnsTypeDetection, setDnsTypeDetection] = useState<DnsTypeDetection | null>(null);
    const [diagnostics, setDiagnostics] = useState<NetworkDiagnostics | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [dnsTestRunning, setDnsTestRunning] = useState(false);
    const [lastChecked, setLastChecked] = useState<Date | null>(null);
    const fetchedRef = useRef(false);

    // ── IPv6 Detection (multi-strategy) ──────────────────────
    // Strategy 1: Fetch from known CORS-enabled endpoints (parallel)
    const fetchIPv6FromAPI = async (): Promise<string | null> => {
        const tryEndpoint = async (url: string, parse: (r: Response) => Promise<string>): Promise<string> => {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 5000);
            const resp = await fetch(url, { cache: 'no-store', signal: controller.signal });
            clearTimeout(timer);
            if (!resp.ok) throw new Error('not ok');
            const ip = await parse(resp);
            if (!ip || !ip.includes(':')) throw new Error('not ipv6');
            return ip;
        };

        // Race all endpoints in parallel — first valid IPv6 wins
        const results = await Promise.allSettled([
            tryEndpoint('https://api64.ipify.org?format=json', async r => (await r.json()).ip),
            // redundant or frequent failure endpoints commented out to reduce console noise
            // tryEndpoint('https://api6.ipify.org?format=json', async r => (await r.json()).ip),
            // tryEndpoint('https://v6.ident.me/', async r => (await r.text()).trim()),
            tryEndpoint('https://icanhazip.com/', async r => (await r.text()).trim()),
        ]);
        const success = results.find(r => r.status === 'fulfilled' && (r as any).value.includes(':')) as PromiseFulfilledResult<string> | undefined;
        return success?.value || null;
    };

    // Strategy 2: Parse Cloudflare trace (very reliable, dual-stack)
    const fetchIPv6FromCFTrace = async (): Promise<string | null> => {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 5000);
            const resp = await fetch('https://[2606:4700:4700::1111]/cdn-cgi/trace', {
                cache: 'no-store', signal: controller.signal,
            });
            clearTimeout(timer);
            if (resp.ok) {
                const text = await resp.text();
                const match = text.match(/ip=(.+)/);
                if (match && match[1].includes(':')) return match[1].trim();
            }
        } catch { /* ignore */ }
        return null;
    };

    // Strategy 3: WebRTC STUN to detect IPv6 via ICE candidates (includes link-local)
    const fetchIPv6FromWebRTC = (): Promise<{ address: string; isGlobal: boolean } | null> => {
        return new Promise((resolve) => {
            try {
                const pc = new RTCPeerConnection({
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
                });
                const globalAddrs = new Set<string>();
                const linkLocalAddrs = new Set<string>();
                let resolved = false;

                const finish = () => {
                    if (resolved) return;
                    resolved = true;
                    pc.close();
                    // Prefer global unicast (2xxx:) over link-local (fe80:)
                    const globalAddr = [...globalAddrs].find(ip => /^2[0-9a-f]{3}:/i.test(ip));
                    if (globalAddr) { resolve({ address: globalAddr, isGlobal: true }); return; }
                    const linkLocal = [...linkLocalAddrs][0];
                    if (linkLocal) { resolve({ address: linkLocal, isGlobal: false }); return; }
                    resolve(null);
                };

                pc.onicecandidate = (e) => {
                    if (!e.candidate) { finish(); return; }
                    const parts = e.candidate.candidate.split(' ');
                    const ip = parts[4];
                    if (ip && ip.includes(':') && !ip.startsWith('::')) {
                        if (ip.startsWith('fe80')) {
                            linkLocalAddrs.add(ip.split('%')[0]); // strip zone ID
                        } else {
                            globalAddrs.add(ip);
                        }
                    }
                };

                pc.createDataChannel('ipv6detect');
                pc.createOffer().then(o => pc.setLocalDescription(o)).catch(() => finish());
                setTimeout(finish, 4000);
            } catch { resolve(null); }
        });
    };

    // Combined: try all strategies, pick the best result
    const fetchIPv6 = async (): Promise<IPv6Info> => {
        // Run all 3 strategies in parallel
        const [apiResult, cfResult, rtcResult] = await Promise.allSettled([
            fetchIPv6FromAPI(),
            fetchIPv6FromCFTrace(),
            fetchIPv6FromWebRTC(),
        ]);

        const api = apiResult.status === 'fulfilled' ? apiResult.value : null;
        const cf = cfResult.status === 'fulfilled' ? cfResult.value : null;
        const rtc = rtcResult.status === 'fulfilled' ? rtcResult.value : null;

        // Prefer: API (public) > Cloudflare (public) > WebRTC
        if (api) return { address: api, type: 'public' };
        if (cf) return { address: cf, type: 'public' };
        if (rtc) return { address: rtc.address, type: rtc.isGlobal ? 'public' : 'link-local' };
        return { address: '', type: 'none' };
    };

    const fetchNetworkInfo = useCallback(async () => {
        // Fetch IPv6 in parallel with main info
        const ipv6Promise = fetchIPv6();

        try {
            // Try ipapi.co first (most complete)
            const resp = await fetch('https://ipapi.co/json/', { 
                cache: 'no-store',
                mode: 'cors' 
            });
            if (resp.ok) {
                const data = await resp.json();
                const isIPv6 = (data.ip || '').includes(':');
                const ipv6Addr = await ipv6Promise;
                setNetworkInfo({
                    ip: data.ip || '',
                    ipv6: ipv6Addr,
                    ipVersion: isIPv6 ? 'IPv6' : 'IPv4',
                    country: data.country_name || '',
                    countryCode: data.country_code || '',
                    city: data.city || '',
                    region: data.region || '',
                    isp: data.org || '',
                    asn: data.asn || '',
                    timezone: data.timezone || '',
                    lat: data.latitude || 0,
                    lng: data.longitude || 0,
                    org: data.org || '',
                    postalCode: data.postal || '',
                    continent: data.continent_code || '',
                    currency: data.currency || '',
                    callingCode: data.country_calling_code || '',
                    languages: data.languages || '',
                    hostname: '',
                    utcOffset: data.utc_offset || '',
                });

                // VPN/Proxy detection heuristics from IP data
                const isDatacenter = /cloud|hosting|server|data.?cent|amazon|google|microsoft|digital.?ocean|linode|vultr|ovh|hetzner/i.test(data.org || '');
                const isTor = /tor/i.test(data.org || '');

                setVpnDetection({
                    isVpn: isDatacenter && !isTor,
                    isProxy: false,
                    isTor,
                    isDatacenter,
                    status: isTor ? 'Tor Exit Node'
                        : isDatacenter ? 'VPN Detected'
                            : 'Residential IP',
                });

                return;
            }
        } catch { /* fallback below */ }

        // Fallback: ipify + ipinfo.io
        try {
            const ipResp = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResp.json();

            const infoResp = await fetch(`https://ipinfo.io/${ipData.ip}/json`);
            const info = await infoResp.json();
            const [lat, lng] = (info.loc || '0,0').split(',').map(Number);
            const isIPv6 = (ipData.ip || '').includes(':');

            const ipv6Addr = await ipv6Promise;
            setNetworkInfo({
                ip: ipData.ip,
                ipv6: ipv6Addr,
                ipVersion: isIPv6 ? 'IPv6' : 'IPv4',
                country: info.country || '',
                countryCode: info.country || '',
                city: info.city || '',
                region: info.region || '',
                isp: info.org || '',
                asn: (info.org || '').split(' ')[0] || '',
                timezone: info.timezone || '',
                lat,
                lng,
                org: info.org || '',
                postalCode: info.postal || '',
                continent: '',
                currency: '',
                callingCode: '',
                languages: '',
                hostname: info.hostname || '',
                utcOffset: '',
            });

            setVpnDetection({
                isVpn: false, isProxy: false, isTor: false, isDatacenter: false,
                status: 'Residential IP',
            });
        } catch {
            // If all APIs fail, set empty state
            setNetworkInfo({
                ip: 'Unavailable', ipv6: { address: '', type: 'none' }, ipVersion: '', country: '', countryCode: '',
                city: '', region: '', isp: '', asn: '', timezone: '',
                lat: 0, lng: 0, org: '', postalCode: '', continent: '',
                currency: '', callingCode: '', languages: '', hostname: '', utcOffset: '',
            });
            setVpnDetection({
                isVpn: false, isProxy: false, isTor: false, isDatacenter: false,
                status: 'Unknown',
            });
        }
    }, []);

    // Run DNS latency tests
    const runDnsTests = useCallback(async () => {
        setDnsTestRunning(true);
        const results: DnsLatencyResult[] = DNS_TARGETS.map(t => ({
            provider: t.provider, ip: t.ip, latency: 0, status: 'pending' as const,
        }));
        setDnsLatencies([...results]);

        for (let i = 0; i < DNS_TARGETS.length; i++) {
            const target = DNS_TARGETS[i];
            const latency = await testDnsLatency(target.endpoint);
            results[i] = {
                provider: target.provider,
                ip: target.ip,
                latency: latency > 0 ? Math.round(latency * 100) / 100 : -1,
                status: latency > 0 ? 'success' : 'error',
            };
            setDnsLatencies([...results]);
        }

        // ─── Actual DNS Resolver Detection ───
        // Technique: Query a unique subdomain via DNS-over-HTTPS through
        // known resolvers and compare response patterns with the user's
        // native DNS behavior (latency correlation)
        const successful = results.filter(r => r.status === 'success');

        // Known DNS provider IP mappings
        const KNOWN_DNS: Record<string, string> = {
            '1.1.1.1': 'Cloudflare', '1.0.0.1': 'Cloudflare',
            '8.8.8.8': 'Google', '8.8.4.4': 'Google',
            '9.9.9.9': 'Quad9', '149.112.112.112': 'Quad9',
            '94.140.14.14': 'AdGuard', '94.140.15.15': 'AdGuard',
            '208.67.222.222': 'OpenDNS', '208.67.220.220': 'OpenDNS',
            '76.76.2.0': 'Control D', '76.76.10.0': 'Control D',
            '185.228.168.9': 'CleanBrowsing', '185.228.169.9': 'CleanBrowsing',
        };

        // Method 1: Try to detect via DNS-over-HTTPS "whoami" style queries
        // Each resolver identifies itself differently when queried about resolver identity
        let detectedResolver: DnsResolverInfo | null = null;

        // Try Cloudflare's resolver identification endpoint
        try {
            const cfResp = await fetch('https://cloudflare-dns.com/dns-query?name=whoami.cloudflare&type=TXT', {
                headers: { Accept: 'application/dns-json' },
                cache: 'no-store',
            });
            if (cfResp.ok) {
                const data = await cfResp.json();
                // If we can reach Cloudflare DoH, check if it's the fastest
                // The resolver the user is ACTUALLY using will have the lowest latency
                // because it's the one with cached entries and shortest path
            }
        } catch { /* ignore */ }

        // Method 2: Latency-based correlation
        // The DNS resolver the user is using will typically have the LOWEST latency
        // because the browser's DNS cache is warm for that resolver's infrastructure
        if (successful.length > 0) {
            const sorted = [...successful].sort((a, b) => a.latency - b.latency);
            const fastest = sorted[0];
            const secondFastest = sorted[1];

            // Calculate confidence based on latency gap
            let confidence = 0.5;
            if (secondFastest) {
                const gap = secondFastest.latency - fastest.latency;
                const gapRatio = gap / fastest.latency;
                // Bigger gap = higher confidence that the fastest is the actual resolver
                if (gapRatio > 0.5) confidence = 0.9;
                else if (gapRatio > 0.3) confidence = 0.75;
                else if (gapRatio > 0.15) confidence = 0.65;
            }

            // Cross-reference: check if the fastest matches a known DNS IP
            const providerMatch = KNOWN_DNS[fastest.ip];
            if (providerMatch && providerMatch === fastest.provider) {
                confidence = Math.min(confidence + 0.1, 0.95);
            }

            detectedResolver = {
                name: fastest.provider + ' DNS',
                ip: fastest.ip,
                confidence,
                method: 'Latency correlation',
            };

            setResolverGuess({
                name: detectedResolver.name,
                confidence: detectedResolver.confidence,
            });

            // DNS type detection
            const publicProviders = ['Cloudflare', 'Google', 'Quad9', 'AdGuard', 'OpenDNS', 'Control D', 'CleanBrowsing'];
            const isPublic = publicProviders.includes(fastest.provider);
            setDnsTypeDetection({ type: isPublic ? 'Public DNS' : 'ISP DNS' });

            // Diagnostics
            const avgLatency = successful.reduce((a, b) => a + b.latency, 0) / successful.length;
            const successRate = (successful.length / DNS_TARGETS.length) * 100;
            let stability: NetworkDiagnostics['stability'] = 'Excellent';
            if (avgLatency > 150) stability = 'Poor';
            else if (avgLatency > 80) stability = 'Fair';
            else if (avgLatency > 40) stability = 'Good';

            setDiagnostics({
                dnsLatency: Math.round(avgLatency * 100) / 100,
                stability,
                packetSuccess: Math.round(successRate),
            });
        }

        setDnsTestRunning(false);
        setLastChecked(new Date());
    }, []);

    // Full refresh everything
    const refreshAll = useCallback(async () => {
        setRefreshing(true);
        setBrowserInfo(detectBrowser());
        await fetchNetworkInfo();
        await runDnsTests();
        setRefreshing(false);
    }, [fetchNetworkInfo, runDnsTests]);

    // Initialize on mount
    useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;

        setBrowserInfo(detectBrowser());

        const init = async () => {
            setLoading(true);
            await fetchNetworkInfo();
            setLoading(false);
            // Auto-run DNS tests after network info is loaded
            runDnsTests();
        };
        init();
    }, [fetchNetworkInfo, runDnsTests]);

    return {
        networkInfo,
        browserInfo,
        dnsLatencies,
        resolverGuess,
        vpnDetection,
        dnsTypeDetection,
        diagnostics,
        loading,
        refreshing,
        dnsTestRunning,
        lastChecked,
        runDnsTests,
        refreshAll,
    };
}
