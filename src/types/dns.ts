export interface DnsProvider {
  id: string;
  name: string;
  organization: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  ipv4Primary: string;
  ipv4Secondary: string;
  ipv6Primary: string;
  ipv6Secondary: string;
  androidPrivateDns: string;
  dohEndpoint: string;
  dotHostname: string;
  website: string;
  adBlocking: boolean;
  malwareProtection: boolean;
  familyFilter: boolean;
  privacyLevel: 'high' | 'medium' | 'low';
  securityScore: number;
  isCustom?: boolean;
}

export interface TestResult {
  providerId: string;
  minLatency: number;
  avgLatency: number;
  maxLatency: number;
  successRate: number;
  reliability: number;
  score: number;
  status: 'pending' | 'testing' | 'complete' | 'error' | 'no-doh';
}

export type SpeedCategory = 'fast' | 'medium' | 'slow' | 'unknown';

export function getSpeedCategory(avgLatency: number): SpeedCategory {
  if (avgLatency <= 0) return 'unknown';
  if (avgLatency < 100) return 'fast';
  if (avgLatency < 300) return 'medium';
  return 'slow';
}

export interface FilterState {
  adBlocking: boolean;
  malwareProtection: boolean;
  familyFilter: boolean;
  privacyHigh: boolean;
  ipv6: boolean;
  doh: boolean;
  dot: boolean;
  region: string;
  search: string;
}
