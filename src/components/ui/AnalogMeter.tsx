import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '../Layout';

interface AnalogMeterProps {
  value: number; // The current value to display (e.g., 90)
  min?: number; // Minimum value (e.g., 0)
  max?: number; // Maximum value (e.g., 100)
  label?: string; // e.g., "Stability"
  unit?: string; // e.g., "%"
  colorClass?: string; // Tailwind text color class, e.g., "text-emerald-500"
  className?: string;
}

export function AnalogMeter({
  value,
  min = 0,
  max = 100,
  label = 'Value',
  unit = '',
  colorClass = 'text-primary',
  className
}: AnalogMeterProps) {
  const [animatedValue, setAnimatedValue] = useState(min);

  useEffect(() => {
    // Delay slightly for initial render animation
    const timeout = setTimeout(() => {
      setAnimatedValue(value);
    }, 100);
    return () => clearTimeout(timeout);
  }, [value]);

  // Calculate rotation. 180 degrees total.
  // 0 is -90deg, 100 is +90deg
  const percentage = Math.max(0, Math.min(100, ((animatedValue - min) / (max - min)) * 100));
  const rotation = -90 + (percentage / 100) * 180;

  // Arc path parameters
  const radius = 80;
  const strokeWidth = 12;
  const cx = 100;
  const cy = 100; // Half circle

  // Path for the background semi-circle
  const arcPath = `M ${cx - radius + strokeWidth/2} ${cy} A ${radius - strokeWidth/2} ${radius - strokeWidth/2} 0 0 1 ${cx + radius - strokeWidth/2} ${cy}`;

  return (
    <div className={cn("relative flex flex-col items-center justify-center p-4", className)}>
      <svg
        viewBox="0 0 200 120"
        className="w-full h-auto drop-shadow-md overflow-visible"
        aria-hidden="true"
      >
        {/* Background Arc */}
        <path
          d={arcPath}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-line/20"
        />
        
        {/* Needle shadow/glow */}
        <motion.g
           style={{ transformOrigin: '100px 100px' }}
           initial={{ rotate: -90 }}
           animate={{ rotate: rotation }}
           transition={{ type: "spring", stiffness: 50, damping: 15 }}
        >
          {/* Real Needle */}
          <polygon
            points="95,100 105,100 100,25"
            className={cn("fill-current drop-shadow-lg", colorClass)}
          />
          {/* Needle Base Pin */}
          <circle cx="100" cy="100" r="8" className="fill-panel stroke-[3px] stroke-ink drop-shadow-md" />
        </motion.g>
        
        {/* Ticks (optional styling) */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const tickRot = -90 + (tick / 100) * 180;
          return (
            <g key={tick} transform={`translate(100 100) rotate(${tickRot})`}>
              <line x1="0" y1="-75" x2="0" y2="-68" className="stroke-ink/30" strokeWidth="2" strokeLinecap="round" />
            </g>
          );
        })}
      </svg>
      
      {/* Label & Value Output */}
      <div className="-mt-6 text-center z-10">
        <div className={cn("text-3xl font-black italic tracking-tighter tabular-nums", colorClass)}>
          {value.toFixed(1)}<span className="text-lg ml-0.5">{unit}</span>
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-ink/50 italic mt-1">
          {label}
        </div>
      </div>
    </div>
  );
}
