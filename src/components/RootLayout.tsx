import { useState, useEffect, Suspense, memo, ReactNode } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';

export const RootLayout = memo(({ children }: { children: ReactNode }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState('grid');
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        if (location.pathname === '/') {
            const tab = searchParams.get('tab');
            setActiveTab(tab || 'grid');
        } else {
            setActiveTab('');
        }
    }, [location.pathname, searchParams]);

    const handleTabChange = (tab: string) => {
        const currentTab = searchParams.get('tab') || 'grid';
        if (tab === currentTab && location.pathname === '/') return;

        if (location.pathname !== '/') {
            navigate(`/?tab=${tab}`);
        } else {
            navigate(`/?tab=${tab}`, { replace: true });
        }
    };

    return (
        <div className="flex h-screen w-full bg-background selection:bg-primary/20 overflow-hidden font-sans transition-colors duration-500">
            <Sidebar
                activeTab={activeTab}
                onTabChange={handleTabChange}
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
            />

            <div className="flex-1 relative flex flex-col min-w-0 h-full overflow-hidden">
                <Suspense fallback={
                    <div className="h-full w-full flex items-center justify-center bg-background z-50 relative">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-[0_0_15px_rgba(var(--primary),0.3)]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Syncing Matrix...</span>
                        </div>
                    </div>
                }>
                    <AnimatePresence initial={false}>
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="absolute inset-0 w-full h-full z-10 overflow-hidden"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </Suspense>
            </div>
        </div>
    );
});
