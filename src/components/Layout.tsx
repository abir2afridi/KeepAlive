import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { 
  Zap, 
  LayoutGrid, 
  Activity, 
  BellRing, 
  Globe, 
  Settings, 
  PlusCircle,
  Search,
  Bell,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const navItems = [
    { icon: LayoutGrid, label: 'Dashboard', path: '/dashboard' },
    { icon: Activity, label: 'Monitors', path: '/monitors' },
    { icon: BellRing, label: 'Alert Channels', path: '/alerts' },
    { icon: Globe, label: 'Status Pages', path: '/status' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background-dark text-slate-100 font-sans selection:bg-primary/20">
      
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-line bg-panel/70 backdrop-blur-2xl shadow-lg flex flex-col relative z-20 transition-all duration-300">
        <div className="p-6 flex items-center gap-3 border-b border-line/40">
          <div className="size-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm shadow-primary/20">
            <Zap className="size-4 fill-current drop-shadow-sm" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold tracking-wide text-slate-200">KeepAlive</h1>
            <p className="text-[10px] text-primary/80 font-mono tracking-wider font-medium">v2.0.4-beta</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
          <div className="mb-6">
            <p className="px-3 text-[10px] uppercase tracking-widest font-semibold text-slate-500/70 mb-3">Monitoring</p>
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                      isActive 
                        ? "text-primary bg-primary/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                    )}
                    <item.icon className={cn("size-4.5 transition-transform duration-300 group-hover:scale-110", isActive && "drop-shadow-[0_0_6px_rgba(var(--primary),0.3)]")} />
                    <span className="text-sm font-medium tracking-wide">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="pt-6 pb-2 border-t border-line/40">
            <p className="px-3 text-[10px] uppercase tracking-widest font-semibold text-slate-500/70 mb-3">System</p>
            <div className="space-y-1">
              <Link
                to="/settings"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-all duration-300 group"
              >
                <Settings className="size-4.5 transition-transform duration-300 group-hover:rotate-45" />
                <span className="text-sm font-medium">Settings</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all duration-300 group"
              >
                <LogOut className="size-4.5 transition-transform duration-300 group-hover:-translate-x-1" />
                <span className="text-sm font-medium">Log out</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-line/40 bg-background-dark/20 backdrop-blur-md">
          <Link
            to="/monitors/new"
            className="w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary font-medium text-sm py-2.5 rounded-xl transition-all duration-300 shadow-[0_4px_12px_rgba(var(--primary),0.05)] hover:shadow-[0_4px_16px_rgba(var(--primary),0.1)] active:scale-95"
          >
            <PlusCircle className="size-4.5" />
            New Monitor
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background-dark relative">
        {/* Subtle grid background for premium tech feel */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(var(--color-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-line) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none opacity-50 dark:opacity-20 animate-pulse" style={{ animationDuration: '8s' }}></div>
        
        {/* Header */}
        <header className="h-16 flex-shrink-0 border-b border-line/40 bg-panel/50 backdrop-blur-2xl flex items-center justify-between px-8 relative z-10 shadow-sm transition-all duration-300">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md group">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 group-focus-within:text-primary transition-colors">
                <Search className="size-4.5" />
              </span>
              <input 
                type="text" 
                placeholder="Search monitors (⌘K)..." 
                className="block w-full pl-11 pr-4 py-2 border border-line/60 rounded-2xl bg-slate-800/10 dark:bg-background-dark/50 text-sm placeholder-slate-500 hover:border-line focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 text-slate-200 transition-all shadow-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 border-r border-line/60 pr-5">
              <ThemeToggle />
              <button className="text-slate-400 hover:text-primary transition-colors p-2 rounded-xl hover:bg-slate-800/50 hover:shadow-sm relative group">
                <Bell className="size-5 group-hover:scale-110 transition-transform" />
                <span className="absolute top-1.5 right-1.5 size-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.8)]"></span>
              </button>
              <button className="text-slate-400 hover:text-primary transition-colors p-2 rounded-xl hover:bg-slate-800/50 hover:shadow-sm group">
                <HelpCircle className="size-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
            
            <div className="hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 shadow-sm backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Op. Normal</span>
            </div>
            
            <div className="flex items-center gap-3 pl-2 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-200 leading-none group-hover:text-primary transition-colors">{user.email || 'sysadmin@local'}</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-semibold">{user.plan || 'Free'} TIER</p>
              </div>
              <div className="size-9 rounded-xl overflow-hidden border border-line group-hover:border-primary/50 transition-colors shadow-sm">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'Alex'}&backgroundColor=111111`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 relative z-10 custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
