import { DnsProvider } from "@/types/dns";

export function getProviderLogo(provider: DnsProvider): string | null {
    const org = provider.organization.toLowerCase();
    const name = provider.name.toLowerCase();

    // Cloudflare
    if (org.includes('cloudflare')) {
        return "https://img.icons8.com/?size=160&id=fUGx53gD9Jof&format=png";
    }

    // Quad9
    if (org.includes('quad9') || name.includes('quad9')) {
        return "https://quad9.net/images/logo.svg";
    }

    // OpenDNS
    if (org.includes('opendns') || name.includes('opendns') || org.includes('cisco')) {
        return "https://d3j20uveo70stj.cloudfront.net/opendns-www/img/logo-opendns.png";
    }

    // AdGuard
    if (org.includes('adguard') || name.includes('adguard')) {
        return "https://img.icons8.com/?size=96&id=eDg4L9JahD1R&format=png";
    }

    // CleanBrowsing
    if (org.includes('cleanbrowsing') || name.includes('cleanbrowsing')) {
        return "https://cleanbrowsing.org/custom/images/cleanbrowsing-logo.png";
    }

    // Telenor
    if (org.includes('telenor') || name.includes('telenor')) {
        return "https://www.telenor.no/telenorlogo.svg";
    }

    // Yandex
    if (org.includes('yandex') || name.includes('yandex')) {
        return "https://avatars.mds.yandex.net/get-lpc/10704932/a271237e-3c1d-4dee-ad14-35a47d23c22a/lqip";
    }

    // Proximus
    if (org.includes('proximus') || name.includes('proximus')) {
        return "https://www.proximus.be/dam/jcr:f63bd103-c4a1-4ce1-b536-554a8017ac99/cdn/sites/support/images/common/logo-proximus-white.2015-11-24-13-13-24.png";
    }

    // DNS.WATCH
    if (org.includes('dns.watch') || name.includes('dns.watch') || name.includes('dnswatch')) {
        return "https://dns.watch/img/dnswatch/logo.png";
    }

    // DNS Forge
    if (org.includes('dnsforge') || name.includes('dnsforge')) {
        return "https://dnsforge.de/assets/img/adblock.png";
    }

    // SafeDNS
    if (org.includes('safedns') || name.includes('safedns')) {
        return "https://www.safedns.com/_next/static/media/safedns-main-logo.3354086f.svg";
    }

    // UncensoredDNS
    if (org.includes('uncensoreddns') || name.includes('uncensoreddns') || name.includes('censurfridns')) {
        return "https://blog.uncensoreddns.org/static/images/censurfridns_logo_250x250.png";
    }

    // AhaDNS
    if (org.includes('ahadns') || name.includes('ahadns')) {
        return "https://ahadns.com/wp-content/uploads/elementor/thumbs/pi-dns-icon-q3brehgwlhu7gl1v2nnae4nsxzrgdj1wr0tb65n4qg.png";
    }

    // Viettel
    if (org.includes('viettel') || name.includes('viettel')) {
        return "https://viettel.com.vn/media/viettel/original_images/Viettel_logo_2021.png";
    }

    // Vodafone
    if (org.includes('vodafone') || name.includes('vodafone')) {
        return "https://www.vodafone.de/media/img/icons/mid-render/New_VF_Icon_RGB_RED.svg";
    }

    return null;
}
