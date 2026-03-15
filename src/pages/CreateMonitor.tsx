import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { 
  Info, Settings2, Zap, Megaphone,
  Trash2, Globe, RefreshCw, ShieldCheck,
  ArrowUpRight, Mail, MessageSquare, Slack, CheckCircle2, Send,
  Terminal, Server, Radio, Lock, Shield, ArrowLeft,
  X, Plus, Settings as SettingsIcon, LayoutDashboard, ChevronRight
} from 'lucide-react';
import { cn } from '../components/Layout';

function SettingLabel({ label, info }: { label: string; info: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-ink/70 italic">{label}</label>
        <button 
          type="button" 
          onClick={() => setExpanded(!expanded)}
          className="text-ink/20 hover:text-primary transition-all p-1"
        >
          <Info className="size-3" />
        </button>
      </div>
      {expanded && (
        <div className="text-[10px] font-medium text-ink/60 bg-base p-3 rounded-xl border border-line/50 animate-in fade-in slide-in-from-top-1 italic">
          {info}
        </div>
      )}
    </div>
  );
}

export default function CreateMonitor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    type: 'WEBSITE',
    interval: 300, 
    method: 'GET',
    body: '',
    port: 80,
    keep_alive: false,
    expected_status: 200
  });

  const [headers, setHeaders] = useState([{ key: 'Content-Type', value: 'application/json' }]);
  
  const [alerts, setAlerts] = useState({
    email: true,
    discord: false,
    discord_url: '',
    slack: false,
    slack_url: ''
  });

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      fetch('/api/monitors', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => res.json())
      .then(data => {
        // API returns { monitors: [...] } — access the array correctly
        const monitorsList = Array.isArray(data) ? data : (data.monitors || []);
        const monitor = monitorsList.find((m: any) => m.id === id);
        if (monitor) {
          setFormData({
            name: monitor.name,
            url: monitor.url,
            type: monitor.type,
            interval: monitor.interval_seconds || monitor.interval || 300,
            method: monitor.method,
            body: monitor.body || '',
            port: monitor.port || 80,
            keep_alive: Boolean(monitor.keep_alive),
            expected_status: monitor.expected_status || 200
          });
          if (monitor.headers) {
            try {
              const parsed = JSON.parse(monitor.headers);
              const h = Object.keys(parsed).map(k => ({ key: k, value: parsed[k] }));
              if (h.length > 0) setHeaders(h);
            } catch (e) { console.error('Failed to parse headers', e); }
          }
          if (monitor.alert_config) {
             try {
                const parsed = JSON.parse(monitor.alert_config);
                setAlerts(parsed);
             } catch (e) { console.error('Failed to parse alerts', e); }
          }
        } else {
          setError('Monitor not found in registry');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load monitor configuration');
        setLoading(false);
      });
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setError('');

    const headerObj = headers.reduce((acc: any, h) => {
      if (h.key.trim()) acc[h.key] = h.value;
      return acc;
    }, {});

    const payload = {
      ...formData,
      headers: JSON.stringify(headerObj),
      alert_config: JSON.stringify(alerts)
    };

    try {
      const res = await fetch(isEditing ? `/api/monitors/${id}` : '/api/monitors', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to save configuration');
      
      // Success! Navigate back to monitors list
      console.log('Monitor saved successfully:', result);
      navigate('/app/monitors');
    } catch (err: any) {
      console.error('Failed to save monitor:', err);
      setError(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const addHeader = () => setHeaders([...headers, { key: '', value: '' }]);
  const removeHeader = (i: number) => setHeaders(headers.filter((_, idx) => idx !== i));
  const updateHeader = (i: number, field: 'key' | 'value', val: string) => {
    const newHeaders = [...headers];
    newHeaders[i][field] = val;
    setHeaders(newHeaders);
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
      <RefreshCw className="size-8 text-primary animate-spin" />
      <span className="text-[10px] font-bold text-ink/60 uppercase tracking-widest italic animate-pulse">Accessing Registry...</span>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12 transition-all duration-700">
      
      {/* Sleek Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-line">
        <div className="space-y-4">
          <nav className="flex items-center gap-3 text-[9px] font-bold text-ink/60 uppercase tracking-widest">
            <Link to="/app/monitors" className="hover:text-primary transition-colors flex items-center gap-1.5 italic">
               <ArrowLeft className="size-3" /> Monitors
            </Link> 
            <span className="opacity-30">/</span>
            <span className="text-primary italic">{isEditing ? 'Parameter Adjustment' : 'Node Initialization'}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-ink uppercase italic">
            {isEditing ? 'Update' : 'Initialize'} <span className="text-primary">Signal</span>
          </h1>
          <p className="text-ink/60 text-xs font-medium italic">
            Configure target endpoint and telemetry synchronization parameters.
          </p>
        </div>
        <div className="hidden md:flex flex-col items-end text-right">
           <div className="size-10 bg-base rounded-xl flex items-center justify-center text-primary shadow-sm border border-line/50 hover:rotate-90 transition-all duration-500">
              <SettingsIcon className="size-5" />
           </div>
        </div>
      </header>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-500 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-3">
              <Shield className="size-4" />
              <p className="text-[10px] font-bold uppercase tracking-widest">{error}</p>
           </div>
           <button onClick={() => setError('')} className="p-2 opacity-50 hover:opacity-100 transition-opacity">
              <X className="size-3.5" />
           </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         
         <div className="lg:col-span-2 space-y-10">
            
            {/* Core Settings */}
            <div className="bg-panel border border-line p-8 rounded-3xl space-y-8 shadow-sm">
               <div className="flex items-center gap-4 border-b border-line/20 pb-6">
                  <div className="size-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary border border-primary/10">
                     <Globe className="size-5" />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-ink italic uppercase tracking-tight">Endpoint Details</h3>
                     <p className="text-[8px] font-bold text-ink/60 uppercase tracking-widest italic">Target Configuration</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <SettingLabel label="Display Name" info="Human-readable identifier for this monitor." />
                     <input 
                       type="text" 
                       required
                       value={formData.name}
                       onChange={(e) => setFormData({...formData, name: e.target.value})}
                       placeholder="My Website"
                       className="w-full bg-base border border-line rounded-xl px-5 py-3.5 text-[11px] font-bold text-ink focus:outline-none focus:border-primary/50 transition-all italic tracking-tight"
                     />
                  </div>

                  <div className="space-y-2">
                     <SettingLabel label="Target Host/URL" info="The full URL or hostname:port of the service." />
                     <div className="flex gap-2">
                        <input 
                          type="text" 
                          required
                          value={formData.url}
                          onChange={(e) => setFormData({...formData, url: e.target.value})}
                          placeholder={formData.type === 'WEBSITE' ? 'https://example.com' : 'example.com'}
                          className="flex-1 bg-base border border-line rounded-xl px-5 py-3.5 text-[11px] font-bold text-ink focus:outline-none focus:border-primary/50 transition-all font-mono lowercase tracking-tight"
                        />
                        {(formData.type === 'TCP' || formData.type === 'SSL') && (
                          <input 
                            type="number" 
                            required
                            value={formData.port}
                            onChange={(e) => setFormData({...formData, port: parseInt(e.target.value)})}
                            placeholder="443"
                            className="w-24 bg-base border border-line rounded-xl px-4 py-3.5 text-[11px] font-bold text-ink focus:outline-none focus:border-primary/50 transition-all font-mono tracking-tight"
                          />
                        )}
                     </div>
                  </div>

                  <div className="space-y-4">
                     <SettingLabel label="Monitor Type" info="The protocol used for checking status." />
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { id: 'WEBSITE', label: 'HTTP(s)', icon: Globe },
                          { id: 'TCP', label: 'TCP Port', icon: Terminal },
                          { id: 'SSL', label: 'SSL Check', icon: ShieldCheck },
                          { id: 'SUPABASE', label: 'Supabase', icon: Zap }
                        ].map((t) => (
                           <button 
                             key={t.id}
                             type="button"
                             onClick={() => {
                               const updates: any = { type: t.id };
                               if (t.id === 'TCP' || t.id === 'SSL') updates.port = 443;
                               setFormData({...formData, ...updates});
                             }}
                             className={cn(
                               "flex flex-col items-center gap-2 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all italic",
                                formData.type === t.id 
                                 ? "bg-primary text-white border-transparent shadow-md" 
                                 : "bg-panel border-line text-ink/70 hover:border-primary/30"
                             )}
                           >
                               <t.icon className="size-4" />
                               {t.label}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-4">
                     <SettingLabel label="Check Interval" info="How often should we ping this node?" />
                     <div className="grid grid-cols-4 gap-2">
                        {[60, 300, 1800, 3600].map((s) => (
                           <button 
                             key={s}
                             type="button"
                             onClick={() => setFormData({...formData, interval: s})}
                             className={cn(
                               "py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all italic",
                                formData.interval === s 
                                 ? "bg-primary text-white border-transparent shadow-lg shadow-primary/20" 
                                 : "bg-panel border-line text-ink/70 hover:border-primary/30"
                             )}
                           >
                               {s === 60 ? '1M' : s === 300 ? '5M' : s === 1800 ? '30M' : '1H'}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* Advanced Settings */}
            <div className="bg-panel border border-line p-8 rounded-3xl space-y-8 shadow-sm">
               <div className="flex items-center gap-4 border-b border-line/20 pb-6">
                  <div className="size-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary border border-primary/10">
                     <Settings2 className="size-5" />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-ink italic uppercase tracking-tight">Request Context</h3>
                     <p className="text-[8px] font-bold text-ink/60 uppercase tracking-widest italic">Protocol Fine-Tuning</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                     <div className="space-y-4">
                        <SettingLabel label="HTTP Method" info="Select the request method." />
                        <div className="grid grid-cols-2 gap-2">
                           {['GET', 'POST', 'PUT', 'HEAD'].map((m) => (
                              <button 
                                key={m}
                                type="button"
                                onClick={() => setFormData({...formData, method: m})}
                                className={cn(
                                  "py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all italic",
                                  formData.method === m 
                                    ? "bg-primary text-white border-transparent shadow-md" 
                                    : "bg-panel border-line text-ink/70 hover:border-primary/30"
                                )}
                              >
                                 {m}
                              </button>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-4">
                        <SettingLabel label="Expected Status" info="Successful response code." />
                        <select 
                           value={formData.expected_status}
                           onChange={(e) => setFormData({...formData, expected_status: parseInt(e.target.value)})}
                           className="w-full bg-base border border-line rounded-xl px-5 py-3 text-[11px] font-bold text-ink focus:outline-none focus:border-primary/40 appearance-none bg-no-repeat bg-[length:16px_16px] bg-[right_16px_center] p-3.5 italic font-mono uppercase tracking-tight"
                           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")` }}
                        >
                           {[200, 201, 204, 301, 302, 401, 403, 404, 500].map(s => (
                              <option key={s} value={s} className="bg-panel text-ink">CODE_{s}</option>
                           ))}
                        </select>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <SettingLabel label="Headers" info="Additional metadata for the probe." />
                        <button type="button" onClick={addHeader} className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[8px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center gap-1 italic">
                           <Plus className="size-3" /> Add Header
                        </button>
                     </div>
                     <div className="space-y-3">
                        {headers.map((h, i) => (
                           <div key={i} className="flex gap-2 group/header items-start">
                              <div className="flex-1 space-y-1">
                                <input 
                                  type="text" 
                                  value={h.key}
                                  placeholder="Key"
                                  onChange={(e) => updateHeader(i, 'key', e.target.value)}
                                   className="w-full bg-base border border-line rounded-xl px-4 py-2.5 text-[9px] font-bold text-ink focus:outline-none focus:border-primary/40 uppercase font-mono tracking-tight"
                                />
                                <input 
                                  type="text" 
                                  value={h.value}
                                  placeholder="Value"
                                  onChange={(e) => updateHeader(i, 'value', e.target.value)}
                                  className="w-full bg-base border border-line rounded-xl px-4 py-2.5 text-[9px] font-bold text-ink focus:outline-none focus:border-primary/40 font-mono tracking-tight"
                                />
                              </div>
                              <button type="button" onClick={() => removeHeader(i)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-40 group-hover/header:opacity-100 mt-1">
                                 <Trash2 className="size-3.5" />
                              </button>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               {['POST', 'PUT'].includes(formData.method) && (
                  <div className="space-y-4 pt-6 border-t border-line dark:border-white/5">
                     <SettingLabel label="Payload (JSON Body)" info="Data packet to be sent." />
                     <textarea 
                        value={formData.body}
                        onChange={(e) => setFormData({...formData, body: e.target.value})}
                        className="w-full h-32 bg-base border border-line rounded-2xl p-6 text-[11px] font-mono text-ink focus:outline-none focus:border-primary/40 transition-all shadow-inner"
                        placeholder='{ "action": "test" }'
                     />
                  </div>
               )}
            </div>

         </div>

         {/* Sidebar Controls */}
         <div className="space-y-8">
            
            <div className="bg-panel border border-line p-8 rounded-3xl space-y-8 shadow-sm">
               <div className="flex items-center gap-4 border-b border-line/20 pb-6">
                  <div className="size-10 bg-amber-500/5 rounded-xl flex items-center justify-center text-amber-500 border border-amber-500/10">
                     <Megaphone className="size-5" />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold text-ink italic uppercase tracking-tight">Alerts</h3>
                     <p className="text-[8px] font-bold text-ink/60 uppercase tracking-widest italic">Channels</p>
                  </div>
               </div>

               <div className="space-y-4">
                  {[
                    { id: 'email', label: 'Email system', icon: Mail },
                    { id: 'slack', label: 'Slack uplink', icon: Slack },
                    { id: 'discord', label: 'Discord sync', icon: MessageSquare },
                    { id: 'telegram', label: 'Telegram relay', icon: Send }
                  ].map((channel) => (
                    <div key={channel.id} className="space-y-3">
                       <button 
                         type="button" 
                         onClick={() => setAlerts({...alerts, [channel.id]: !alerts[channel.id as keyof typeof alerts]})}
                         className={cn(
                           "w-full flex items-center justify-between p-4 rounded-2xl border transition-all italic tracking-tight uppercase",
                            alerts[channel.id as keyof typeof alerts] 
                              ? "bg-primary text-white border-transparent shadow-md" 
                              : "bg-base border-line text-ink/70"
                         )}
                       >
                          <div className="flex items-center gap-3">
                             <channel.icon className="size-3.5" />
                             <span className="text-[10px] font-bold">{channel.label}</span>
                          </div>
                          {alerts[channel.id as keyof typeof alerts] ? <CheckCircle2 className="size-4" /> : <Plus className="size-4" />}
                       </button>
                       {alerts[channel.id as keyof typeof alerts] && channel.id !== 'email' && (
                         <input 
                           type="url" 
                           placeholder="Webhook Connection URL"
                           value={alerts[`${channel.id}_url` as keyof typeof alerts] as string}
                           onChange={(e) => setAlerts({...alerts, [`${channel.id}_url`]: e.target.value})}
                           className="w-full bg-base border border-line rounded-xl px-4 py-3 text-[9px] font-bold text-ink focus:outline-none focus:border-primary/40 font-mono italic"
                         />
                       )}
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-primary p-8 rounded-3xl shadow-xl text-white space-y-6 group">
               <div className="flex items-center justify-between">
                  <div className="space-y-1">
                     <h4 className="text-[11px] font-bold uppercase tracking-widest italic tracking-tighter">Keep Alive</h4>
                     <p className="text-[9px] opacity-60 italic">Force node persistence (3-day cycle)</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, keep_alive: !formData.keep_alive})}
                    className={cn(
                      "size-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm border",
                      formData.keep_alive ? "bg-primary text-white border-primary/20" : "bg-panel/5 dark:bg-black/5 border-transparent"
                    )}
                  >
                    <RefreshCw className={cn("size-5", formData.keep_alive && "animate-spin-slow")} />
                  </button>
               </div>
               <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className={cn("h-full transition-all duration-1000", formData.keep_alive ? "w-full bg-primary" : "w-0")} />
               </div>
            </div>

            <div className="pt-6">
               <button 
                 type="submit" 
                 disabled={saveLoading}
                 className="w-full py-4.5 bg-primary text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest hover:translate-y-[-1px] transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-3 italic bg-primary p-4"
               >
                 {saveLoading ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                 {isEditing ? 'Sync Configuration' : 'Initialize Node'}
               </button>
            </div>

         </div>

      </form>

      <footer className="pt-10 border-t border-line opacity-30 text-[8px] font-bold text-ink/60 uppercase tracking-widest italic text-center">
         Security Verification Matrix Protocol Node v4.0.2 // Active // Registry Alpha
      </footer>
    </div>
  );
}
