import { useState, useEffect } from 'react';
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
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Command,
  User,
  ActivitySquare,
  MapPin,
  Shield,
  Database,
  UserCircle,
  MessageSquare,
  BookOpen,
  Network,
  Menu,
  X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import { supabase } from '../supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 1200);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isExpanded = (!isCollapsed || isHovered) && window.innerWidth >= 1024;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/auth');
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { icon: LayoutGrid, label: 'DASHBOARD', path: '/app/dashboard' },
    { icon: Activity, label: 'MONITORS', path: '/app/monitors' },
    { icon: BellRing, label: 'ALERTS', path: '/app/alerts' },
    { icon: Globe, label: 'STATUS', path: '/app/status' },
    { 
      icon: ActivitySquare, 
      label: 'DNS BENCHMARK', 
      path: '/app/dns-benchmark?tab=grid',
      children: [
        { icon: MapPin, label: 'GEO CLUSTERS', path: '/app/dns-benchmark?tab=map' },
        { icon: Shield, label: 'SECURITY', path: '/app/dns-benchmark?tab=leaderboard' },
        { icon: Database, label: 'DATA LAB', path: '/app/dns-benchmark?tab=charts' },
        { icon: UserCircle, label: 'PROFILE', path: '/app/dns-benchmark?tab=profile' },
      ]
    },
  ];

  const supportItems = [
    { icon: BookOpen, label: 'MANIFESTO', path: '/app/manifesto' },
    { icon: MessageSquare, label: 'DIRECT LINE', path: '/app/direct-line' },
  ];

  const pageTitles: Record<string, string> = {
    '/app/dashboard': 'DASHBOARD',
    '/app/monitors': 'MONITOR SYSTEM',
    '/app/monitors/new': 'PROVISION NODE',
    '/app/alerts': 'ALERT CHANNELS',
    '/app/status': 'STATUS PAGES',
    '/app/dns-benchmark': 'DNS BENCHMARK',
    '/app/manifesto': 'MANIFESTO',
    '/app/direct-line': 'DIRECT LINE',
    '/app/settings': 'ACCOUNT SETTINGS',
  };

  const currentPath = location.pathname;
  const currentTitle = Object.entries(pageTitles).find(([path]) => currentPath.startsWith(path))?.[1] || 'OPERATIONS';

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {/* Branding Area */}
      <div className="px-5 pt-8 pb-6 flex items-center gap-4">
        <div className="size-10 rounded-xl bg-white flex items-center justify-center text-black shadow-lg shadow-white/5 shrink-0">
          <Network className="size-5 font-black" />
        </div>
        <div className={cn(
          "transition-all duration-300",
          (isExpanded || mobile) ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
        )}>
          <h1 className="text-xl font-black tracking-[0.1em] text-white uppercase italic leading-none whitespace-nowrap">Net<span className="text-white/40">pulse</span></h1>
          <p className="text-[10px] text-white/20 font-bold tracking-[0.4em] uppercase mt-1 whitespace-nowrap">Intelligence</p>
        </div>
      </div>

      {/* Navigation Registry */}
      <nav className="flex-1 px-3 py-4 space-y-10 overflow-y-auto custom-scrollbar-minimal">
        <div className="space-y-3">
          <p className={cn(
            "px-3 text-[11px] uppercase tracking-[0.3em] font-bold text-white/30 italic transition-all duration-300 whitespace-nowrap",
            (isExpanded || mobile) ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden my-0 py-0'
          )}>Registry</p>
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const isParentActive = location.pathname.startsWith(item.path.split('?')[0]);
              const isActive = (() => {
                if (item.path.includes('?')) {
                  const [path, search] = item.path.split('?');
                  if (location.pathname === path && location.search === '' && item.path.includes('tab=grid')) {
                    return true;
                  }
                  return location.pathname === path && location.search.includes(search);
                }
                return location.pathname.startsWith(item.path);
              })();
              
              return (
                <div key={item.path} className="space-y-1">
                  <Link
                    to={item.path}
                    title={!isExpanded && !mobile ? item.label : undefined}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group relative",
                      isActive 
                        ? "text-white bg-white/10 border border-white/20 shadow-sm" 
                        : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3 relative z-10">
                      <item.icon className={cn("size-5 shrink-0 transition-transform", isActive && "text-white")} />
                      <span className={cn(
                        "text-xs font-bold tracking-widest italic whitespace-nowrap transition-all duration-300",
                        (isExpanded || mobile) ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
                      )}>{item.label}</span>
                    </div>
                    {isActive ? (
                      <div className={cn(
                        "size-1.5 rounded-full bg-white shadow-[0_0_8px_#ffffff] shrink-0",
                        (isExpanded || mobile) ? '' : 'absolute right-2 top-1/2 -translate-y-1/2'
                      )} />
                    ) : (isExpanded || mobile) ? (
                      <ChevronRight className="size-3.5 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0 shrink-0" />
                    ) : null}
                  </Link>
                  
                  {item.children && isParentActive && (isExpanded || mobile) && (
                    <div className="pl-12 pr-4 pt-1 pb-2 space-y-2 relative">
                      <div className="absolute left-[31px] top-0 bottom-3 w-[1px] bg-white/10" />
                      {item.children.map((child) => {
                        const isChildActive = location.search.includes(child.path.split('?')[1]);
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={cn(
                              "flex items-center gap-3 py-2 transition-all duration-300 group relative",
                              isChildActive ? "text-white" : "text-white/50 hover:text-white hover:translate-x-1"
                            )}
                          >
                            <div className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-4 h-[1px] bg-white/10" />
                            <child.icon className={cn("size-3.5 transition-transform", isChildActive && "text-white")} />
                            <span className="text-[10px] font-bold tracking-widest italic">{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 pt-6 border-t border-white/10">
          <p className={cn(
            "px-3 text-[11px] uppercase tracking-[0.3em] font-bold text-white/30 italic transition-all duration-300 whitespace-nowrap",
            (isExpanded || mobile) ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden my-0 py-0'
          )}>About & Support</p>
          <div className="space-y-1.5">
            {supportItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group relative",
                    isActive 
                      ? "text-white bg-white/10 border border-white/20 shadow-sm" 
                      : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3 relative z-10">
                    <item.icon className={cn("size-5 shrink-0", isActive && "text-white")} />
                    <span className={cn(
                      "text-xs font-bold tracking-widest italic whitespace-nowrap transition-all duration-300",
                      (isExpanded || mobile) ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
                    )}>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
        
        <div className="space-y-3 pt-6 border-t border-white/10">
           <Link
             to="/app/settings"
             className={cn(
               "flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group",
               location.pathname === '/app/settings' ? "text-white bg-white/10" : "text-white/50 hover:text-white"
             )}
           >
             <div className="flex items-center gap-3">
               <Settings className="size-4.5" />
               <span className={cn(
                 "text-[10px] font-bold tracking-widest italic uppercase",
                 (isExpanded || mobile) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
               )}>Settings</span>
             </div>
           </Link>
           <button
             onClick={handleLogout}
             className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-white/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-300 group"
           >
             <div className="flex items-center gap-3">
               <LogOut className="size-4.5" />
               <span className={cn(
                 "text-[10px] font-bold tracking-widest italic uppercase",
                 (isExpanded || mobile) ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
               )}>Logout</span>
             </div>
           </button>
        </div>
      </nav>

      {/* Sidebar Toggle - Only Desktop */}
      {!mobile && (
        <div className="px-3 pb-6 pt-4 border-t border-white/10 hidden lg:block">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
          >
            {isCollapsed ? <PanelLeftOpen className="size-4.5" /> : <PanelLeftClose className="size-4.5" />}
            <span className={cn(
              "text-[10px] font-bold tracking-widest italic uppercase whitespace-nowrap transition-all",
              isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
            )}>{isCollapsed ? 'Pin Open' : 'Collapse'}</span>
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-base text-ink font-sans transition-colors duration-700">
      
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-[280px] bg-sidebar z-[101] lg:hidden flex flex-col shadow-2xl"
          >
            <div className="absolute top-4 right-4 lg:hidden">
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-white/40 hover:text-white">
                <X className="size-6" />
              </button>
            </div>
            <SidebarContent mobile />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ width: isExpanded ? 288 : 80 }}
        className={cn(
          "hidden lg:flex flex-shrink-0 border-r border-white/10 bg-sidebar flex-col relative z-20 shadow-xl transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <header className="h-16 flex-shrink-0 border-b border-line bg-panel/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-8 relative z-10">
          
          <div className="flex items-center gap-4 sm:gap-6">
             <button 
               onClick={() => setIsMobileMenuOpen(true)}
               className="lg:hidden p-2 -ml-2 text-ink hover:text-primary transition-colors"
             >
               <Menu className="size-6" />
             </button>

             <div className="flex flex-col">
                <h2 className="text-sm sm:text-lg font-black tracking-[-0.05em] text-ink italic uppercase leading-none">{currentTitle}</h2>
                <div className="flex items-center gap-2 mt-1 sm:mt-2">
                   <div className="size-1.5 bg-primary animate-pulse" />
                   <span className="text-[8px] sm:text-[9px] font-black text-ink/30 uppercase tracking-[0.3em]">Sector Active</span>
                </div>
             </div>
          </div>

          <div className="hidden md:flex items-center gap-6 flex-1 max-w-sm ml-auto mr-6">
            <div className="relative w-full group">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-ink/40">
                <Search className="size-4" />
              </span>
              <input 
                type="text" 
                placeholder="REGISTRY QUERY..." 
                className="block w-full pl-10 pr-4 py-2 border border-line rounded-xl bg-base text-sm font-bold italic tracking-widest placeholder:text-ink/30 focus:outline-none focus:ring-4 focus:ring-primary/5 text-ink transition-all shadow-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-6 pl-4 sm:pl-6 border-l border-line/50">
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <button className="relative p-2 rounded-xl bg-base text-ink/40 hover:text-primary transition-all">
                <Bell className="size-4 sm:size-4.5" />
                <span className="absolute top-2 right-2 size-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_#5551FF]" />
              </button>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4 pl-3 sm:pl-4 cursor-pointer group select-none border-l border-line/50">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-ink uppercase tracking-tight truncate max-w-[100px] italic">{user.name || user.email?.split('@')[0] || 'ADMIN'}</p>
                <p className="text-[10px] text-ink/40 font-bold uppercase tracking-widest italic">{user.plan || 'CORE'} TIER</p>
              </div>
              <div className="size-8 sm:size-10 rounded-xl overflow-hidden border border-line group-hover:border-primary/50 transition-all">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email || 'Alex'}&backgroundColor=111111`} alt="Avatar" className="w-full h-full object-cover saturate-50 group-hover:saturate-100 transition-all" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Canvas Background */}
        <div className="absolute inset-0 pointer-events-none -z-10 dark:bg-black bg-base">
           <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] opacity-30 sm:opacity-50" />
           
           {location.pathname.includes('dns-benchmark') && (
              <div className="absolute inset-0 opacity-10 sm:opacity-20">
                 <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-t from-transparent via-primary/20 to-transparent animate-[scan_4s_linear_infinite]" />
              </div>
           )}
        </div>

        {/* Global Page Processor */}
        <div className={cn(
          "flex-1 overflow-y-auto custom-scrollbar",
          location.pathname.startsWith('/app/dns-benchmark') ? '' : 'p-4 sm:p-8'
        )}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
