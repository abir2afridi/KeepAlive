import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from './Layout';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative flex items-center justify-center size-10 rounded-xl transition-all duration-300",
        "bg-panel/50 backdrop-blur-xl border border-line/40 shadow-sm",
        "hover:bg-primary/10 hover:border-primary/30 hover:shadow-md group",
        "dark:bg-slate-800/40 dark:border-line/40 dark:hover:bg-primary/20",
        className
      )}
      aria-label="Toggle theme"
    >
      <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <Moon 
        className={cn(
          "absolute size-5 text-slate-400 group-hover:text-primary transition-all duration-500",
          theme === 'dark' ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        )} 
      />
      <Sun 
        className={cn(
          "absolute size-5 text-amber-500 group-hover:text-primary transition-all duration-500",
          theme === 'dark' ? "rotate-0 scale-100 opacity-100 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "-rotate-90 scale-0 opacity-0"
        )} 
      />
    </button>
  );
}
