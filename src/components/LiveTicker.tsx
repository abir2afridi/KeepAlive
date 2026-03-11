import { cn } from "@/lib/utils";

const TOPICS = [
    { text: "Status", value: "Optimal" },
    { text: "Nodes", value: "300+ Live" },
    { text: "Security", value: "Verified" },
    { text: "Coverage", value: "28 Regions" },
    { text: "Latency", value: "Sub 2ms" },
    { text: "Protocol", value: "DoH/DoQ" },
    { text: "Scanning", value: "Global" },
    { text: "Uptime", value: "99.9%" },
    { text: "Health", value: "Green" },
];

export function LiveTicker({ className }: { className?: string }) {
    // Triple the items for a long, seamless scroll
    const duplicatedTopics = [...TOPICS, ...TOPICS, ...TOPICS, ...TOPICS];

    return (
        <div className={cn("w-full bg-[#6ed5a6] py-1.5 overflow-hidden backdrop-blur-md z-30 select-none border-b border-black/10", className)}>
            <style>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .animate-marquee-smooth {
          display: flex;
          width: max-content;
          animation: marquee 80s linear infinite;
        }
      `}</style>

            <div className="relative flex items-center h-8">
                {/* Custom Gradient Masks for #6ed5a6 */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#6ed5a6] via-[#6ed5a6]/80 to-transparent z-20 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#6ed5a6] via-[#6ed5a6]/80 to-transparent z-20 pointer-events-none" />

                {/* Optimized Marquee Container */}
                <div className="animate-marquee-smooth flex items-center gap-12">
                    {duplicatedTopics.map((topic, i) => {
                        return (
                            <div key={i} className="flex items-center gap-2 whitespace-nowrap px-4">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-900/50">
                                    {topic.text}
                                </span>
                                <span className="text-[14px] font-bold text-slate-900">
                                    {topic.value}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Aesthetic Bottom Glow Line */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-black/10 opacity-50" />
        </div>
    );
}
