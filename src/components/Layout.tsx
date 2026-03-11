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
  LogOut,
  ChevronRight,
  ShieldCheck,
  Command
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
    { icon: LayoutGrid, label: 'DASHBOARD', path: '/dashboard' },
    { icon: Activity, label: 'MONITORS', path: '/monitors' },
    { icon: BellRing, label: 'ALERTS', path: '/alerts' },
    { icon: Globe, label: 'STATUS', path: '/status' },
  ];

  const pageTitles: Record<string, string> = {
    '/dashboard': 'DASHBOARD',
    '/monitors': 'MONITOR SYSTEM',
    '/monitors/new': 'PROVISION NODE',
    '/alerts': 'ALERT CHANNELS',
    '/status': 'STATUS PAGES',
    '/settings': 'ACCOUNT SETTINGS',
  };

  const currentPath = location.pathname;
  const currentTitle = Object.entries(pageTitles).find(([path]) => currentPath.startsWith(path))?.[1] || 'OPERATIONS';

  return (
    <div className="flex h-screen overflow-hidden bg-base text-ink font-sans transition-colors duration-700">
      
      {/* Refined Sidebar */}
      <aside className="w-72 flex-shrink-0 border-r border-line bg-panel backdrop-blur-2xl flex flex-col relative z-20 shadow-xl transition-all duration-500 overflow-hidden">
        
        {/* Branding Area */}
         <div className="p-8 pb-6 flex items-center gap-4">
           <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Zap className="size-5 fill-white" />
           </div>
           <div>
              <h1 className="text-xl font-extrabold tracking-tight text-ink uppercase italic leading-none">Keep<span className="text-primary">Alive</span></h1>
              <p className="text-[10px] text-ink/40 font-bold tracking-[0.3em] uppercase mt-1">v4.0 Protocol</p>
           </div>
        </div>

        {/* Navigation Registry */}
        <nav className="flex-1 px-6 py-4 space-y-10 overflow-y-auto custom-scrollbar-minimal">
          <div className="space-y-3">
            <p className="px-3 text-[11px] uppercase tracking-[0.3em] font-bold text-ink/30 italic">Registry</p>
            <div className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group relative",
                      isActive 
                        ? "text-primary bg-primary/5 border border-primary/10 shadow-sm" 
                        : "text-ink/50 hover:text-ink hover:bg-base border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3 relative z-10">
                      <item.icon className={cn("size-5 transition-transform", isActive && "text-primary")} />
                      <span className="text-xs font-bold tracking-widest italic">{item.label}</span>
                    </div>
                    {isActive ? (
                      <div className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_#5551FF]" />
                    ) : (
                      <ChevronRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t border-line/50">
            <p className="px-3 text-[11px] uppercase tracking-[0.3em] font-bold text-ink/30 italic">Systems</p>
            <div className="space-y-1.5">
              <Link
                to="/settings"
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group border border-transparent",
                  location.pathname === '/settings' 
                    ? "text-primary bg-primary/5 border-primary/10" 
                    : "text-ink/50 hover:text-ink hover:bg-base"
                )}
              >
                <div className="flex items-center gap-3">
                  <Settings className="size-4.5 group-hover:rotate-90 transition-transform duration-500" />
                  <span className="text-[10px] font-bold tracking-widest italic uppercase">Settings</span>
                </div>
                <ChevronRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-all" />
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-ink/50 hover:text-rose-500 hover:bg-rose-500/10 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="size-4.5" />
                  <span className="text-[10px] font-bold tracking-widest italic uppercase">Logout</span>
                </div>
              </button>
            </div>
          </div>
        </nav>

        {/* Global Action Removed as requested */}
      </aside>

      {/* Main Command Processor */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Refined Header */}
        <header className="h-16 flex-shrink-0 border-b border-line bg-panel/80 backdrop-blur-xl flex items-center justify-between px-8 relative z-10 transition-all">
          
          <div className="flex items-center gap-6">
             <div className="flex flex-col">
                <h2 className="text-base font-bold tracking-tighter text-ink italic uppercase leading-none">{currentTitle}</h2>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest italic mt-1.5">SECURED REGISTRY</span>
             </div>
          </div>

          <div className="flex items-center gap-6 flex-1 max-w-sm ml-auto mr-6">
            <div className="relative w-full group">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-ink/40">
                <Search className="size-4" />
              </span>
              <input 
                type="text" 
                placeholder="REGISTRY QUERY..." 
                className="block w-full pl-10 pr-4 py-2 border border-line rounded-xl bg-base text-sm font-bold italic tracking-widest placeholder:text-ink/30 focus:outline-none focus:ring-4 focus:ring-primary/5 text-ink transition-all shadow-sm"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-20 group-focus-within:opacity-100 transition-opacity">
                 <Command className="size-2.5" />
                 <span className="text-[8px] font-bold">K</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 pl-6 border-l border-line/50">
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button className="relative p-2.5 rounded-xl bg-base text-ink/40 hover:text-primary transition-all">
                <Bell className="size-4.5" />
                <span className="absolute top-2.5 right-2.5 size-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_#5551FF]" />
              </button>
            </div>
            
            <div className="flex items-center gap-4 pl-4 cursor-pointer group select-none border-l border-line/50">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-ink uppercase tracking-tight truncate max-w-[120px] italic">{user.email?.split('@')[0] || 'ADMIN'}</p>
                <p className="text-[10px] text-ink/40 font-bold uppercase tracking-widest italic">{user.plan || 'CORE'} TIER</p>
              </div>
              <div className="size-10 rounded-xl overflow-hidden border border-line group-hover:border-primary/50 transition-all">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'Alex'}&backgroundColor=111111`} alt="Avatar" className="w-full h-full object-cover saturate-50 group-hover:saturate-100 transition-all" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Canvas Background */}
        <div className="absolute inset-0 pointer-events-none -z-10 opacity-50">
           <div className="absolute top-0 right-0 w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px]" />
           <div className="absolute bottom-0 left-0 w-[20%] h-[20%] bg-blue-500/5 rounded-full blur-[100px]" />
        </div>

        {/* Global Page Processor */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
