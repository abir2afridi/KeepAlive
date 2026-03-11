import { useState, useCallback, useRef } from 'react';
import { DnsProvider, TestResult } from '@/types/dns';
import { testAllProviders, testDnsProvider } from '@/lib/dnsTestEngine';

export function useDnsTest(providers: DnsProvider[]) {
  const [results, setResults] = useState<Map<string, TestResult>>(new Map());
  const [isRunning, setIsRunning] = useState(false);
  const [testingSingle, setTestingSingle] = useState<string | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const abortRef = useRef(false);

  const runTests = useCallback(async () => {
    setIsRunning(true);
    abortRef.current = false;
    setResults(new Map());

    const total = providers.length;
    setProgress({ completed: 0, total });

    const allResults = await testAllProviders(providers, 10, (result, completed, t) => {
      if (abortRef.current) return;
      setResults(prev => new Map(prev).set(result.providerId, result));
      setProgress({ completed, total: t });
    });

    if (!abortRef.current) {
      setResults(allResults);
    }
    setIsRunning(false);
  }, [providers]);

  const testSingle = useCallback(async (provider: DnsProvider) => {
    setTestingSingle(provider.id);
    setResults(prev => new Map(prev).set(provider.id, {
      providerId: provider.id, minLatency: 0, avgLatency: 0, maxLatency: 0,
      successRate: 0, reliability: 0, score: 0, status: 'testing',
    }));
    try {
      const result = await testDnsProvider(provider);
      setResults(prev => new Map(prev).set(result.providerId, result));
    } catch {
      setResults(prev => new Map(prev).set(provider.id, {
        providerId: provider.id, minLatency: 0, avgLatency: 0, maxLatency: 0,
        successRate: 0, reliability: 0, score: 0, status: 'error',
      }));
    }
    setTestingSingle(null);
  }, []);

  const stopTests = useCallback(() => {
    abortRef.current = true;
    setIsRunning(false);
  }, []);

  const getTopProviders = useCallback((count: number = 3) => {
    return Array.from(results.values())
      .filter(r => r.status === 'complete' && r.avgLatency > 0)
      .sort((a, b) => a.avgLatency - b.avgLatency)
      .slice(0, count);
  }, [results]);

  return { results, isRunning, testingSingle, progress, runTests, stopTests, testSingle, getTopProviders };
}
