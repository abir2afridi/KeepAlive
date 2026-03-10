import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Info, Settings2, Zap, Megaphone, ChevronRight, Trash2, Activity, PlusCircle } from 'lucide-react';
import { cn } from '../components/Layout';

export default function CreateMonitor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    type: 'Website',
    interval: 300, // 5m
    method: 'GET',
    body: '',
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
      fetch('/api/monitors', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => res.json())
      .then(data => {
        const monitor = data.find((m: any) => m.id === id);
        if (monitor) {
          setFormData({
            name: monitor.name,
            url: monitor.url,
            type: monitor.type,
            interval: monitor.interval,
            method: monitor.method,
            body: monitor.body || '',
            keep_alive: Boolean(monitor.keep_alive),
            expected_status: monitor.expected_status || 200
          });
          if (monitor.headers) {
            const parsed = JSON.parse(monitor.headers);
            const h = Object.keys(parsed).map(k => ({ key: k, value: parsed[k] }));
            if (h.length > 0) setHeaders(h);
          }
        }
      });
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    let finalInterval = formData.interval;
    if (formData.keep_alive && finalInterval < 259200) {
      // Free users
    }

    const headersObj = headers.reduce((acc, h) => {
      if (h.key && h.value) acc[h.key] = h.value;
      return acc;
    }, {} as Record<string, string>);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(isEditing ? `/api/monitors/${id}` : '/api/monitors', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          headers: headersObj,
          alerts
        })
      });
      
      if (res.ok) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="mb-8">
        <nav className="flex mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500 gap-2 items-center">
          <Link to="/dashboard" className="hover:text-primary transition-colors">Monitors</Link>
          <ChevronRight className="size-4" />
          <span className="text-primary">{isEditing ? 'Edit Monitor' : 'Create New'}</span>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{isEditing ? 'Edit Monitor' : 'Create New Monitor'}</h1>
        <p className="text-slate-500 mt-2 text-sm font-medium">Configure heartbeats and uptime monitoring for your services.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8">
        {/* Basic Info */}
        <section className="bg-panel/70 backdrop-blur-2xl rounded-3xl border border-line/50 p-10 shadow-sm relative overflow-hidden group hover:shadow-primary/5 hover:border-line transition-all duration-300">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors duration-500"></div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-3 border-b border-line/40 pb-5">
            <Info className="size-5 text-primary" />
            Basic Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Monitor Name</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full rounded-2xl bg-slate-800/5 dark:bg-background-dark/50 border border-line/60 text-slate-800 dark:text-slate-200 text-sm px-4 py-3 focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none placeholder:text-slate-400 hover:border-line shadow-sm" 
                placeholder="e.g. Production API Gateway" 
              />
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Target URL</label>
              <input 
                required
                type="url" 
                value={formData.url}
                onChange={e => setFormData({...formData, url: e.target.value})}
                className="w-full rounded-2xl bg-slate-800/5 dark:bg-background-dark/50 border border-line/60 text-slate-800 dark:text-slate-200 text-sm px-4 py-3 focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none placeholder:text-slate-400 hover:border-line shadow-sm" 
                placeholder="https://api.yourdomain.com/health" 
              />
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Monitor Type</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="w-full rounded-2xl bg-slate-800/5 dark:bg-background-dark/50 border border-line/60 text-slate-800 dark:text-slate-200 text-sm px-4 py-3 focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none appearance-none hover:border-line shadow-sm cursor-pointer"
              >
                <option>Website</option>
                <option>API Endpoint</option>
                <option>Supabase Keep-Alive</option>
                <option>Custom Webhook</option>
              </select>
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Check Interval</label>
              <select 
                value={formData.interval}
                onChange={e => setFormData({...formData, interval: parseInt(e.target.value)})}
                className="w-full rounded-2xl bg-slate-800/5 dark:bg-background-dark/50 border border-line/60 text-slate-800 dark:text-slate-200 text-sm px-4 py-3 focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none appearance-none hover:border-line shadow-sm cursor-pointer"
              >
                <option value={60}>1m</option>
                <option value={300}>5m</option>
                <option value={900}>15m</option>
                <option value={3600}>1h</option>
                <option value={259200}>3 Days (Keep-Alive)</option>
                <option value={432000}>5 Days (Keep-Alive)</option>
              </select>
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Expected Status Code</label>
              <input 
                type="number" 
                value={formData.expected_status}
                onChange={e => setFormData({...formData, expected_status: parseInt(e.target.value)})}
                className="w-full rounded-2xl bg-slate-800/5 dark:bg-background-dark/50 border border-line/60 text-slate-800 dark:text-slate-200 text-sm px-4 py-3 focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none hover:border-line shadow-sm" 
              />
            </div>
          </div>
        </section>

        {/* Request Details */}
        <section className="bg-panel/70 backdrop-blur-2xl rounded-3xl border border-line/50 p-10 shadow-sm transition-all hover:shadow-primary/5 hover:border-line group">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-3 border-b border-line/40 pb-5">
            <Settings2 className="size-5 text-primary" />
            Request Details
          </h3>
          <div className="space-y-8">
            <div className="flex flex-col gap-4">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">HTTP Method</label>
              <div className="flex flex-wrap gap-3">
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(method => (
                  <button 
                    key={method}
                    type="button"
                    onClick={() => setFormData({...formData, method})}
                    className={cn(
                      "px-6 py-2.5 rounded-2xl text-sm font-bold transition-all border",
                      formData.method === method 
                        ? "bg-primary/10 text-primary border-primary/30 shadow-[0_4px_12px_rgba(var(--primary),0.1)] scale-[1.02]" 
                        : "bg-slate-800/5 dark:bg-background-dark/50 text-slate-500 dark:text-slate-400 border-line/60 hover:border-primary/30 hover:bg-primary/5"
                    )}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-4 border-t border-line/40">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Custom Headers</label>
                <button 
                  type="button"
                  onClick={() => setHeaders([...headers, { key: '', value: '' }])}
                  className="text-primary hover:text-primary/80 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors px-4 py-2 rounded-2xl hover:bg-primary/10"
                >
                  <PlusCircle className="size-4" /> Add Header
                </button>
              </div>
              
              {headers.map((header, index) => (
                <div key={index} className="grid grid-cols-[1fr,1fr,48px] gap-4">
                  <input 
                    type="text" 
                    value={header.key}
                    onChange={e => {
                      const newHeaders = [...headers];
                      newHeaders[index].key = e.target.value;
                      setHeaders(newHeaders);
                    }}
                    className="rounded-2xl bg-slate-800/5 dark:bg-background-dark/50 border border-line/60 text-slate-800 dark:text-slate-200 text-sm font-mono px-4 py-3 focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none hover:border-line shadow-sm" 
                    placeholder="Key" 
                  />
                  <input 
                    type="text" 
                    value={header.value}
                    onChange={e => {
                      const newHeaders = [...headers];
                      newHeaders[index].value = e.target.value;
                      setHeaders(newHeaders);
                    }}
                    className="rounded-2xl bg-slate-800/5 dark:bg-background-dark/50 border border-line/60 text-slate-800 dark:text-slate-200 text-sm font-mono px-4 py-3 focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none hover:border-line shadow-sm" 
                    placeholder="Value" 
                  />
                  <button 
                    type="button"
                    onClick={() => setHeaders(headers.filter((_, i) => i !== index))}
                    className="flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all border border-line/60 hover:border-rose-500/30 shadow-sm"
                  >
                    <Trash2 className="size-5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-4 pt-4 border-t border-line/40">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Request Body (JSON)</label>
              <textarea 
                value={formData.body}
                onChange={e => setFormData({...formData, body: e.target.value})}
                className="w-full rounded-2xl bg-slate-800/5 dark:bg-background-dark/50 border border-line/60 text-slate-800 dark:text-slate-200 text-sm font-mono px-4 py-4 focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all outline-none resize-y hover:border-line shadow-sm" 
                placeholder='{ "status": "ping" }' 
                rows={5}
              ></textarea>
            </div>
          </div>
        </section>

        {/* Keep-Alive Mode */}
        <section className="bg-panel/70 backdrop-blur-2xl rounded-3xl border border-line/50 p-10 shadow-sm transition-all hover:shadow-primary/5 hover:border-line group">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Zap className="size-5 text-primary fill-primary/20" />
                </div>
                Keep-Alive Mode
              </h3>
              <p className="text-sm font-medium text-slate-500 mt-4 max-w-xl">Automatically ping to prevent service pausing or cold starts (ideal for Serverless, Supabase, Render, Free-tiers).</p>
            </div>
            <label className="inline-flex items-center cursor-pointer mt-2">
              <input 
                type="checkbox" 
                checked={formData.keep_alive}
                onChange={e => {
                   const checked = e.target.checked;
                   setFormData({
                     ...formData, 
                     keep_alive: checked,
                     interval: checked ? 259200 : 300
                   })
                }}
                className="sr-only peer" 
              />
              <div className="relative w-14 h-8 bg-slate-800/10 dark:bg-background-dark/50 border-2 border-line/60 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[4px] after:bg-white dark:after:bg-slate-300 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary/80 peer-checked:border-primary peer-checked:after:bg-white shadow-inner"></div>
            </label>
          </div>
        </section>

        {/* Alerting Section */}
        <section className="bg-panel/70 backdrop-blur-2xl rounded-3xl border border-line/50 p-10 shadow-sm transition-all hover:shadow-primary/5 hover:border-line">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-3 border-b border-line/40 pb-5">
            <Megaphone className="size-5 text-primary" />
            Alert Channels
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <label className={cn("flex flex-col gap-3 p-6 rounded-3xl border transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer", alerts.email ? "bg-primary/5 border-primary/30" : "bg-slate-800/5 dark:bg-background-dark/50 border-line/60 hover:border-primary/30")}>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={alerts.email}
                  onChange={e => setAlerts({...alerts, email: e.target.checked})}
                  className="rounded bg-slate-800/10 border-line/60 text-primary focus:ring-primary/20 h-5 w-5 dark:bg-background-dark cursor-pointer" 
                />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Email Alerts</span>
              </div>
            </label>

            <div className={cn("flex flex-col gap-4 p-6 rounded-3xl border transition-all duration-300 shadow-sm hover:shadow-md", alerts.discord ? "bg-primary/5 border-primary/30" : "bg-slate-800/5 dark:bg-background-dark/50 border-line/60 hover:border-primary/30")}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={alerts.discord}
                  onChange={e => setAlerts({...alerts, discord: e.target.checked})}
                  className="rounded bg-slate-800/10 border-line/60 text-primary focus:ring-primary/20 h-5 w-5 dark:bg-background-dark cursor-pointer" 
                />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Discord Webhook</span>
              </label>
              {alerts.discord && (
                <input type="text" placeholder="https://discord.com/api/webhooks/..." className="w-full rounded-2xl bg-white dark:bg-background-dark/50 border border-line/60 text-slate-800 dark:text-slate-200 text-sm px-4 py-3 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                  value={alerts.discord_url} onChange={e => setAlerts({...alerts, discord_url: e.target.value})} />
              )}
            </div>

            <div className={cn("flex flex-col gap-4 p-6 rounded-3xl border transition-all duration-300 shadow-sm hover:shadow-md", alerts.slack ? "bg-primary/5 border-primary/30" : "bg-slate-800/5 dark:bg-background-dark/50 border-line/60 hover:border-primary/30")}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={alerts.slack}
                  onChange={e => setAlerts({...alerts, slack: e.target.checked})}
                  className="rounded bg-slate-800/10 border-line/60 text-primary focus:ring-primary/20 h-5 w-5 dark:bg-background-dark cursor-pointer" 
                />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Slack Webhook</span>
              </label>
              {alerts.slack && (
                <input type="text" placeholder="https://hooks.slack.com/services/..." className="w-full rounded-2xl bg-white dark:bg-background-dark/50 border border-line/60 text-slate-800 dark:text-slate-200 text-sm px-4 py-3 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm" 
                  value={alerts.slack_url} onChange={e => setAlerts({...alerts, slack_url: e.target.value})} />
              )}
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-5 pt-8">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full sm:w-auto px-10 py-3.5 rounded-2xl bg-primary/10 border border-primary/30 text-primary font-bold uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(var(--primary),0.1)] hover:shadow-[0_4px_20px_rgba(var(--primary),0.2)] hover:bg-primary/20 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
          >
            <PlusCircle className="size-5" />
            {loading ? 'Saving...' : (isEditing ? 'Update Monitor' : 'Create Monitor')}
          </button>
        </div>
      </form>
    </div>
  );
}
