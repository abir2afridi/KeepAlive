import { useState, useEffect } from 'react';

export const Clock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-muted/30 border border-border/40 backdrop-blur-md">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
            <span className="text-[11px] font-black tabular-nums text-foreground/80 tracking-widest uppercase">
                {time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-[9px] font-black text-muted-foreground/40 border-l border-border/40 pl-2 uppercase tracking-tighter">
                UTC{time.getTimezoneOffset() <= 0 ? '+' : '-'}{Math.abs(Math.floor(time.getTimezoneOffset() / 60))}
            </span>
        </div>
    );
};
