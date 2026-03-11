import { DnsProvider, TestResult } from '@/types/dns';
import { Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  providers: DnsProvider[];
  results: Map<string, TestResult>;
}

export function ExportButtons({ providers, results }: Props) {
  const tested = providers.filter(p => results.get(p.id)?.status === 'complete');
  if (tested.length === 0) return null;

  const buildData = () =>
    tested.map(p => {
      const r = results.get(p.id)!;
      return { ...p, ...r };
    });

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(buildData(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dns-benchmark-results.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as JSON');
  };

  const exportCSV = () => {
    const data = buildData();
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(d => Object.values(d).map(v => `"${v}"`).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dns-benchmark-results.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as CSV');
  };

  const share = async () => {
    const top3 = tested
      .sort((a, b) => results.get(a.id)!.avgLatency - results.get(b.id)!.avgLatency)
      .slice(0, 3)
      .map(p => `${p.name}: ${results.get(p.id)!.avgLatency.toFixed(1)}ms`)
      .join('\n');
    const text = `🌍 DNS Benchmark Results\n\nTop 3 Fastest:\n${top3}\n\nTested ${tested.length} servers`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Results copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="flex gap-2">
      <button onClick={exportJSON} className="cyber-button flex items-center gap-2 text-xs">
        <Download className="h-3.5 w-3.5" /> JSON
      </button>
      <button onClick={exportCSV} className="cyber-button flex items-center gap-2 text-xs">
        <Download className="h-3.5 w-3.5" /> CSV
      </button>
      <button onClick={share} className="cyber-button flex items-center gap-2 text-xs">
        <Share2 className="h-3.5 w-3.5" /> Share
      </button>
    </div>
  );
}
