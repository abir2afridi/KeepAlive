import { useState, memo } from 'react';
import { LayoutDashboard, Globe, Shield, History, Activity, Settings, ChevronLeft, Target, HelpCircle, Info, Mail, ChevronDown, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: any) => void;
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar = memo(({ activeTab, onTabChange, isCollapsed, setIsCollapsed }: SidebarProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isSupportExpanded, setIsSupportExpanded] = useState(false);
    const isExpanded = !isCollapsed || isHovered;

    const menuItems = [
        { id: 'grid', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'map', label: 'Geo Clusters', icon: Globe },
        { id: 'leaderboard', label: 'Security', icon: Shield },
        { id: 'charts', label: 'Data Lab', icon: History },
        { id: 'profile', label: 'Profile', icon: User },
    ];

    const itemVariants = {
        expanded: {
            opacity: 1,
            x: 0,
            transition: {
                type: 'spring' as const,
                stiffness: 400,
                damping: 30
            }
        },
        collapsed: {
            opacity: 1,
            x: 0,
        }
    };

    const textVariants = {
        expanded: {
            opacity: 1,
            x: 0,
            transition: {
                type: 'spring' as const,
                stiffness: 300,
                damping: 25
            }
        },
        collapsed: {
            opacity: 0,
            x: -20,
            transition: { duration: 0.2 }
        }
    };

    return (
        <motion.aside
            initial={false}
            animate={{
                width: isExpanded ? 280 : 88,
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="h-screen sticky top-0 border-r border-white/5 flex flex-col z-50 overflow-hidden bg-sidebar-dashboard shadow-2xl shadow-black/50"
        >
            {/* Glossy Backdrop Filter */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

            <motion.div
                animate={{
                    paddingTop: isExpanded ? '24px' : '20px',
                    paddingBottom: isExpanded ? '24px' : '20px',
                }}
                style={{ paddingLeft: '0px', paddingRight: '0px' }} // Locked static padding to prevent internal shifts
                className="flex flex-col h-full text-white relative z-10"
            >
                {/* Logo Section */}
                <div
                    style={{ paddingLeft: '22px' }} // Absolute static centering for 44px logo in 88px sidebar
                    className="flex items-center mb-14 w-full"
                >
                    <div className="p-3 rounded-2xl bg-primary/20 border border-primary/20 shadow-lg shadow-primary/10 shrink-0">
                        <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ delay: 0.1 }}
                                className="flex flex-col whitespace-nowrap overflow-hidden ml-4"
                            >
                                <span className="text-[14px] font-black tracking-[0.2em] uppercase text-white/90">NetPulse</span>
                                <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.3em]">Telemetry Hub</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Nav Section */}
                <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1 -mr-1">
                    <motion.div
                        variants={{
                            expanded: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
                            collapsed: { transition: { staggerChildren: 0.02, staggerDirection: -1 } }
                        }}
                        initial="collapsed"
                        animate={isExpanded ? "expanded" : "collapsed"}
                    >
                        <motion.div
                            variants={itemVariants}
                            className="flex items-center mb-6"
                            style={{ paddingLeft: '34px' }}
                        >
                            <div className="w-5 flex justify-center shrink-0">
                                <Target className="h-3 w-3 text-white/20" />
                            </div>
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        variants={textVariants}
                                        className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] whitespace-nowrap overflow-hidden ml-4"
                                    >
                                        Nodes Operations
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const active = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onTabChange(item.id)}
                                    className={`w-full flex items-center relative group overflow-hidden rounded-2xl text-[13px] ${active
                                        ? 'text-white bg-white/[0.08] shadow-[0_4px_12px_rgba(0,0,0,0.15)]'
                                        : 'text-white/50 hover:text-white/90 hover:bg-white/[0.04]'
                                        }`}
                                >
                                    <div
                                        style={{ paddingLeft: '34px' }}
                                        className="flex items-center w-full py-3.5"
                                    >
                                        <div className="w-5 flex justify-center shrink-0">
                                            <Icon className={`h-5 w-5 transition-transform duration-500 group-hover:scale-110 ${active ? 'text-primary' : 'opacity-80'}`} />
                                        </div>
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.span
                                                    variants={textVariants}
                                                    className={`font-black uppercase tracking-[0.1em] whitespace-nowrap ml-4 ${active ? 'text-white/90' : 'text-inherit'}`}
                                                >
                                                    {item.label}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    {active && (
                                        <motion.div
                                            layoutId="sidebarActive"
                                            className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"
                                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </button>
                            );
                        })}

                        {/* Support Section */}
                        <div className="pt-4 mt-4 border-t border-white/5 space-y-1.5">
                            <motion.div
                                variants={itemVariants}
                                className="flex items-center mb-2"
                                style={{ paddingLeft: '34px' }}
                            >
                                <div className="w-5 flex justify-center shrink-0">
                                    <HelpCircle className="h-3 w-3 text-white/20" />
                                </div>
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            variants={textVariants}
                                            className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] whitespace-nowrap overflow-hidden ml-4"
                                        >
                                            System Help
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            <button
                                onClick={() => setIsSupportExpanded(!isSupportExpanded)}
                                className={`w-full flex items-center relative group overflow-hidden rounded-2xl text-[13px] ${isSupportExpanded
                                    ? 'text-white bg-white/[0.04]'
                                    : 'text-white/50 hover:text-white/90 hover:bg-white/[0.04]'
                                    }`}
                            >
                                <div
                                    style={{ paddingLeft: '34px' }}
                                    className="flex items-center w-full py-3.5"
                                >
                                    <div className="w-5 flex justify-center shrink-0">
                                        <HelpCircle className={`h-5 w-5 transition-transform duration-500 group-hover:scale-110 ${isSupportExpanded ? 'text-primary' : 'opacity-80'}`} />
                                    </div>
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                variants={textVariants}
                                                className="flex items-center justify-between flex-1 ml-4"
                                            >
                                                <span className="font-black uppercase tracking-[0.1em] whitespace-nowrap">
                                                    About & Support
                                                </span>
                                                <motion.div
                                                    animate={{ rotate: isSupportExpanded ? 180 : 0 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <ChevronDown className="h-3 w-3 text-white/20" />
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </button>

                            <AnimatePresence>
                                {isSupportExpanded && isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden space-y-1 ml-4"
                                    >
                                        {[
                                            { id: 'about', label: 'Manifesto', icon: Info },
                                            { id: 'contact', label: 'Direct Line', icon: Mail },
                                        ].map((subItem) => {
                                            const SubIcon = subItem.icon;
                                            const active = activeTab === subItem.id;
                                            return (
                                                <button
                                                    key={subItem.id}
                                                    onClick={() => onTabChange(subItem.id)}
                                                    className={`w-full flex items-center px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${active
                                                        ? 'text-primary bg-primary/5'
                                                        : 'text-white/30 hover:text-white/60 hover:bg-white/[0.02]'
                                                        }`}
                                                >
                                                    <SubIcon className="h-3.5 w-3.5 mr-3 shrink-0" />
                                                    <span>{subItem.label}</span>
                                                </button>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </nav>

                {/* Footer Section */}
                <div className="px-5 mt-auto pt-6 border-t border-white/5 space-y-4">
                    {/* User Profile */}
                    <div className="flex items-center gap-4 py-4">
                        <div className="relative shrink-0 group">
                            <div className="absolute -inset-2 bg-primary/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-primary/40 p-[2px]">
                                <div className="w-full h-full rounded-full bg-sidebar-dashboard flex items-center justify-center text-primary font-black text-xs border border-white/10">
                                    AA
                                </div>
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-sidebar-dashboard rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        </div>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ delay: 0.1 }}
                                    className="flex flex-col whitespace-nowrap"
                                >
                                    <span className="text-sm font-bold text-white/90">A. Afridi</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                        <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Network Architect</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Settings & Collapse */}
                    <div className="flex items-center gap-2 pb-6">
                        <button className="flex-1" title="Settings">
                            <div
                                style={{ paddingLeft: isExpanded ? '14px' : '0px' }}
                                className={`flex items-center justify-center rounded-2xl transition-all text-white/40 hover:text-white/80 hover:bg-white/5 ${isExpanded ? 'h-12 w-full justify-start' : 'h-12 w-88 justify-center'}`}
                            >
                                <Settings className="h-5 w-5" />
                                {isExpanded && <span className="text-[11px] font-black uppercase tracking-widest ml-4">Settings</span>}
                            </div>
                        </button>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={() => setIsCollapsed(!isCollapsed)}
                                    className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-white/40 hover:text-white transition-all group shrink-0"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </motion.aside >
    );
});
