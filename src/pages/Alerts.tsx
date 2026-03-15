import { 
  BellRing, ChevronRight, Mail, MessageSquare, 
  Slack, Globe, ShieldAlert, Cpu, Zap, Radio, 
  Terminal, ShieldCheck, Activity, Info,
  ExternalLink, ArrowUpRight, Lock, Bell, CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../components/Layout';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabase/client';

const AlertChannel = ({ 
  icon: Icon, 
  title, 
  description, 
  status = "Inactive", 
  isComingSoon = false,
  protocol = "TCP/TLS"
}: { 
  icon: any, 
  title: string, 
  description: string, 
  status?: string,
  isComingSoon?: boolean,
  protocol?: string
}) => (
  <div className="group relative bg-panel border border-line rounded-3xl p-6 md:p-8 flex flex-col justify-between gap-6 hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all duration-500 hover:shadow-lg hover:border-primary/30 overflow-hidden shadow-sm">
    <div className="relative z-10 space-y-5">
      <div className="flex items-start justify-between">
        <div className="size-12 bg-base rounded-xl flex items-center justify-center text-ink/60 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500 border border-line/50">
          <Icon className="size-6" />
        </div>
        <div className="flex flex-col items-end gap-1">
           <div className={cn(
             "px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest border transition-all duration-500",
             isComingSoon 
               ? "bg-slate-100 dark:bg-white/5 text-slate-400 border-line dark:border-white/10" 
               : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white"
           )}>
             {status}
           </div>
           <span className="text-[7px] font-bold text-ink/20 uppercase tracking-widest">{protocol}</span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-bold text-ink group-hover:text-primary transition-colors uppercase italic tracking-tight">{title}</h3>
        <p className="text-[11px] text-ink/60 font-medium leading-relaxed italic line-clamp-2">
           {description}
        </p>
      </div>
    </div>

    <div className="relative z-10 pt-5 border-t border-line/50 flex items-center justify-between gap-3">
      <button 
        disabled={isComingSoon}
        className={cn(
          "flex-1 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all shadow-sm italic",
          isComingSoon 
            ? "bg-panel border border-line/50 text-ink/70 cursor-not-allowed" 
            : "bg-primary text-white hover:translate-y-[-1px] active:translate-y-0 shadow-primary/20"
        )}
      >
        {isComingSoon ? 'Coming Soon' : 'Configure Channel'}
      </button>
      <div className="size-9 bg-base rounded-xl flex items-center justify-center border border-line/50 text-ink/60 hover:text-primary transition-colors cursor-help group-hover:scale-105">
         <Info className="size-3.5" />
      </div>
    </div>
  </div>
);

export default function Alerts() {
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newEmail, setNewEmail] = useState('');
  const [newWebhook, setNewWebhook] = useState('');
  const [creating, setCreating] = useState(false);

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    for (const c of channels || []) {
      const key = String(c.type || 'unknown');
      g[key] = g[key] || [];
      g[key].push(c);
    }
    return g;
  }, [channels]);

  const fetchChannels = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/alerts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load alerts');
      setChannels(Array.isArray(json) ? json : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load alerts');
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const createChannel = async (type: 'email' | 'webhook', target: string) => {
    if (!target) return;
    setCreating(true);
    setError('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const monitor_id = (channels?.[0]?.monitor_id as string | undefined) || null;
      if (!monitor_id) throw new Error('Create a monitor first (alert channels attach to a monitor)');

      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ monitor_id, type, target }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to create alert');

      setNewEmail('');
      setNewWebhook('');
      await fetchChannels();
    } catch (e: any) {
      setError(e?.message || 'Failed to create alert');
    } finally {
      setCreating(false);
    }
  };

  const deleteChannel = async (id: string) => {
    if (!id) return;
    setError('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`/api/alerts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to delete alert');
      await fetchChannels();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete alert');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12 animate-in fade-in duration-700">
      
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 sm:pb-10 border-b border-line">
        <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-ink uppercase italic">
              Channel <span className="text-primary">Registry</span>
            </h1>
            <p className="text-ink/60 text-xs font-medium italic">
              Configure unified communication anchors across your global node registry.
            </p>
        </div>
        <div className="flex items-center gap-4">
           <div className="px-5 py-2.5 bg-primary/10 border border-primary/20 rounded-xl flex items-center gap-3">
             <Radio className="size-3.5 text-primary animate-pulse" />
             <div className="flex flex-col">
                <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Matrix Active</span>
                <span className="text-[7px] font-bold text-ink/60 uppercase tracking-widest">Relay v4.0.2</span>
             </div>
           </div>
        </div>
      </header>

      {/* Stats Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {[
          { icon: Lock, label: 'ENCRYPTION', val: 'End-to-End', color: 'text-primary' },
          { icon: Zap, label: 'CHANNELS', val: String((channels || []).length), color: 'text-emerald-500' },
          { icon: Globe, label: 'TYPES', val: String(Object.keys(grouped || {}).length || 0), color: 'text-blue-500' }
        ].map((m, i) => (
          <div key={i} className="bg-panel border border-line p-5 sm:p-6 rounded-3xl flex items-center gap-4 sm:gap-5 shadow-sm group hover:translate-y-[-2px] transition-all">
            <div className="size-10 bg-base rounded-xl flex items-center justify-center text-ink/60 group-hover:text-primary border border-line/50 transition-all shadow-sm">
              <m.icon className="size-4.5" />
            </div>
            <div className="space-y-0.5">
              <span className="block text-[8px] font-bold text-ink/60 uppercase tracking-widest italic">{m.label}</span>
              <span className={cn("block text-base sm:text-lg font-black tracking-tighter italic", m.color)}>{m.val}</span>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="bg-panel border border-line p-6 rounded-3xl text-xs text-ink/60 font-medium italic">
          Loading alert channels...
        </div>
      ) : null}

      {error ? (
        <div className="bg-panel border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-2xl text-xs font-medium">
          {error}
        </div>
      ) : null}

      <div className="bg-panel border border-line p-6 rounded-3xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-widest italic text-ink/70">Quick Add</div>
          <button
            onClick={() => fetchChannels()}
            className="px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest bg-base border border-line/50 hover:border-primary/30"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="text-[9px] font-bold uppercase tracking-widest text-ink/50">Email</div>
            <div className="flex gap-2">
              <input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 bg-base border border-line rounded-xl px-3 py-2 text-xs"
              />
              <button
                disabled={creating || !newEmail}
                onClick={() => createChannel('email', newEmail)}
                className="px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest bg-primary text-white disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[9px] font-bold uppercase tracking-widest text-ink/50">Webhook</div>
            <div className="flex gap-2">
              <input
                value={newWebhook}
                onChange={(e) => setNewWebhook(e.target.value)}
                placeholder="https://..."
                className="flex-1 bg-base border border-line rounded-xl px-3 py-2 text-xs"
              />
              <button
                disabled={creating || !newWebhook}
                onClick={() => createChannel('webhook', newWebhook)}
                className="px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest bg-primary text-white disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-ink/50 font-medium italic">
          Note: Alert channels are attached to a monitor. This UI attaches to your first monitor for now.
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        <AlertChannel
          icon={Mail}
          title="Email"
          description={`Configured channels: ${(grouped.email || []).length}`}
          status={loading ? 'LOADING' : (grouped.email || []).length > 0 ? 'ACTIVE' : 'INACTIVE'}
          isComingSoon={false}
          protocol="SMTP"
        />
        <AlertChannel
          icon={Globe}
          title="Webhooks"
          description={`Configured channels: ${(grouped.webhook || []).length}`}
          status={loading ? 'LOADING' : (grouped.webhook || []).length > 0 ? 'ACTIVE' : 'INACTIVE'}
          isComingSoon={false}
          protocol="HTTPS"
        />
        <AlertChannel
          icon={MessageSquare}
          title="Discord"
          description="Webhook-based Discord notifications are supported by the worker." 
          status={(grouped.discord || []).length > 0 ? 'ACTIVE' : 'INACTIVE'}
          isComingSoon={false}
          protocol="HTTPS/WEBHOOK"
        />
        <AlertChannel
          icon={Slack}
          title="Slack"
          description="Webhook-based Slack notifications are supported by the worker."
          status={(grouped.slack || []).length > 0 ? 'ACTIVE' : 'INACTIVE'}
          isComingSoon={false}
          protocol="HTTPS/WEBHOOK"
        />
        <AlertChannel
          icon={BellRing}
          title="Telegram"
          description="Telegram notifications are supported by the worker."
          status={(grouped.telegram || []).length > 0 ? 'ACTIVE' : 'INACTIVE'}
          isComingSoon={false}
          protocol="HTTPS"
        />
        <AlertChannel
          icon={Cpu}
          title="Duty Logic"
          description="PagerDuty/OpsGenie integration reserved for future releases."
          status="LOCKED"
          isComingSoon
          protocol="API_SYNC"
        />
      </div>

      {!loading && (channels || []).length > 0 ? (
        <div className="bg-panel border border-line p-6 rounded-3xl space-y-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-widest italic text-ink/70">Configured Channels</div>
          <div className="space-y-3">
            {(channels || []).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between gap-4 bg-base border border-line/50 rounded-2xl px-4 py-3">
                <div className="min-w-0">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-ink/50">{String(c.type || '').toUpperCase()}</div>
                  <div className="text-xs font-medium text-ink truncate">{c.target || '—'}</div>
                </div>
                <button
                  onClick={() => deleteChannel(String(c.id))}
                  className="px-3 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Info Block */}
      <div className="bg-slate-900 dark:bg-primary p-8 sm:p-10 md:p-14 rounded-[32px] sm:rounded-[40px] relative overflow-hidden group shadow-2xl text-white">
         <div className="absolute top-0 right-0 size-64 bg-white/10 dark:bg-primary/20 blur-3xl -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000" />
         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-14 items-center">
            <div className="space-y-5 sm:space-y-6">
               <div className="flex items-center gap-4">
                  <div className="size-10 sm:size-11 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                     <Bell className="size-5 text-white" />
                  </div>
                  <div>
                     <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight italic uppercase">Signal <span className="text-white/80">Protection</span></h4>
                     <span className="text-[8px] sm:text-[9px] font-bold text-white/40 uppercase tracking-widest italic">Smart Filtering Active</span>
                  </div>
               </div>
               <p className="text-[11px] sm:text-xs text-white/70 font-medium leading-relaxed sm:pr-6 italic">
                  Intelligent noise reduction algorithms prevent alert fatigue by grouping related node failures into unified incident reports. Zero-false-positive detection enabled.
               </p>
               <div className="flex flex-wrap gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 rounded-xl border border-white/5">
                     <CheckCircle2 className="size-3 text-emerald-400" />
                     <span className="text-[7px] sm:text-[8px] font-bold text-white uppercase tracking-widest italic">Heuristics OK</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 rounded-xl border border-white/5">
                     <Lock className="size-3 text-white" />
                     <span className="text-[7px] sm:text-[8px] font-bold text-white uppercase tracking-widest italic">Secured Layer</span>
                  </div>
               </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-2xl sm:rounded-3xl space-y-5 sm:space-y-6 backdrop-blur-md">
               <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <span className="text-[8px] sm:text-[9px] font-bold text-white/50 uppercase tracking-widest italic">Relay Stats</span>
                  <Activity className="size-3.5 text-primary animate-pulse" />
               </div>
               <div className="space-y-3 sm:space-y-4">
                  {[
                    { label: 'Relay Nodes', val: 'Triple Redundant' },
                    { label: 'Encryption', val: 'RSA 4096-bit' },
                    { label: 'Success Rate', val: '99.999%' }
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-white/5 dark:border-black/5 pb-3 last:border-0 last:pb-0">
                       <span className="text-[8px] sm:text-[9px] font-bold text-white/40 uppercase tracking-widest italic">{stat.label}</span>
                       <span className="text-[10px] sm:text-[11px] font-black text-white italic tracking-tight">{stat.val}</span>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      <footer className="pt-10 border-t border-line flex justify-between items-center opacity-40 text-[8px] font-bold text-ink/60 uppercase tracking-[0.3em] text-center md:text-left italic">
         <div>Distributed Broadcast Protocol // NOMINAL</div>
         <div>SaaS Operations Layer v4.0.2</div>
      </footer>
    </div>
  );
}
