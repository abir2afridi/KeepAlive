import { Globe, Activity, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { motion } from 'framer-motion';
import { dnsProviders } from '@/data/dnsProviders';

export function Header() {
  const providerCount = dnsProviders.length;
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl transition-all duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <div className="relative">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 group-hover:scale-105 transition-transform duration-300">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <Activity className="h-2.5 w-2.5 text-primary absolute -bottom-0.5 -right-0.5 animate-pulse" />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-sm font-bold tracking-tight text-foreground uppercase">NetPulse</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest opacity-60 font-bold">Benchmarks</span>
            </div>
          </motion.div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 border border-border">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase border-r border-border pr-1.5 tracking-tighter">Nodes Active</span>
            <span className="text-[10px] font-black text-foreground">{providerCount}/{providerCount}</span>
          </div>

          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="p-2.5 rounded-xl hover:bg-secondary border border-transparent hover:border-border transition-all duration-200 group relative"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-muted-foreground group-hover:text-amber-400 transition-colors" />
            ) : (
              <Moon className="h-4 w-4 text-muted-foreground group-hover:text-amber-600 transition-colors" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
