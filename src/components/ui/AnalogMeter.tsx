import { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { cn } from '../Layout';

interface AnalogMeterProps {
  value?: number; 
  min?: number; 
  max?: number; 
  label?: string; 
  unit?: string; 
  colorClass?: 'blue' | 'emerald' | 'amber' | 'rose' | 'primary';
  className?: string;
  zones?: { limit: number; color: string }[]; 
}

export function AnalogMeter({
  value,
  min = 0,
  max = 100,
  label = 'Value',
  unit = '',
  colorClass,
  className,
  zones = [
    { limit: 33, color: '#10b981' },   // Emerald 500
    { limit: 66, color: '#f59e0b' },   // Amber 500
    { limit: 100, color: '#ef4444' }   // Red 500
  ]
}: AnalogMeterProps) {
  const isDataMissing = value === undefined || value === null;
  const safeValue = typeof value === 'number' && Number.isFinite(value) ? value : min;
  const [animatedValue, setAnimatedValue] = useState(safeValue);

  useEffect(() => {
    if (isDataMissing) return;
    const timeout = setTimeout(() => {
      setAnimatedValue(safeValue);
    }, 100);
    return () => clearTimeout(timeout);
  }, [safeValue, isDataMissing]);

  // Constrain value between min and max
  const clampedValue = Math.max(min, Math.min(max, typeof animatedValue === 'number' && Number.isFinite(animatedValue) ? animatedValue : min));
  const percentage = max > min ? ((clampedValue - min) / (max - min)) * 100 : 0;
  
  const sweep = 180;
  const startAngle = -90;
  
  // Requirement 4 & 8: Convert the value to angle using formula
  const rotation = isDataMissing ? startAngle : ((clampedValue - min) / (max - min)) * sweep + startAngle;
  
  // Color mapping for colorClass
  const colorMap = {
    blue: '#3b82f6',     // Blue 500
    emerald: '#10b981',  // Emerald 500
    amber: '#f59e0b',    // Amber 500
    rose: '#ef4444',     // Rose 500
    primary: '#6366f1'   // Indigo 500 (Primary)
  };

  // Determine current active color
  const currentColor = useMemo(() => {
    if (isDataMissing) return '#94a3b8'; // Slate 400 for missing data

    if (colorClass && colorMap[colorClass]) {
      return colorMap[colorClass];
    }

    let matchedColor = zones[0]?.color ?? 'currentColor';
    for (const zone of zones) {
      if (percentage <= zone.limit) {
        matchedColor = zone.color;
        break;
      }
    }
    return matchedColor;
  }, [percentage, zones, colorClass, isDataMissing]);
  
  const cx = 160;
  const cy = 160; 
  const radius = 130;
  const strokeWidth = 14;

  // Background arc 
  const arcPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;
  
  // Filled arc path for SVG ring
  const endAngleRadius = Math.PI - (percentage / 100) * Math.PI; 
  const endX = cx + radius * Math.cos(endAngleRadius);
  const endY = cy - radius * Math.sin(endAngleRadius);

  // Generate perfectly upright text labels cleanly positioned along the outer edge
  const generateLabels = () => {
    return [0, 25, 50, 75, 100].map(pct => {
        const val = min + (pct / 100) * (max - min);
        const angle = Math.PI - (pct / 100) * Math.PI; 
        const textRadius = radius - 32; 
        const x = cx + textRadius * Math.cos(angle);
        const y = cy - textRadius * Math.sin(angle);
        
        return (
            <text
                key={pct}
                x={x}
                y={y}
                textAnchor="middle"
                alignmentBaseline="middle"
                className="text-[10px] font-black fill-ink/60 tracking-tighter tabular-nums"
                style={{ fontFamily: 'monospace' }}
            >
                {Math.round(val)}
            </text>
        );
    });
  };

  const generateTicks = () => {
      const ticks = [];
      const totalTicks = 40; 
      for (let i = 0; i <= totalTicks; i++) {
          const isMainTick = i % 10 === 0;
          const isMidTick = i % 5 === 0 && !isMainTick;
          
          const angle = Math.PI - (i / totalTicks) * Math.PI; 
          
          let innerRadiusOffset = radius - strokeWidth/2 - 6; 
          let length = 4;
          let tickClass = "stroke-ink/10";
          let width = 2;

          if (isMainTick) {
              length = 12;
              width = 3;
              tickClass = "stroke-ink/40";
          } else if (isMidTick) {
              length = 8;
              width = 2;
              tickClass = "stroke-ink/20";
          }

          const x1 = cx + innerRadiusOffset * Math.cos(angle);
          const y1 = cy - innerRadiusOffset * Math.sin(angle);
          
          const x2 = cx + (innerRadiusOffset - length) * Math.cos(angle);
          const y2 = cy - (innerRadiusOffset - length) * Math.sin(angle);
          
          ticks.push(
              <line 
                  key={i}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  className={tickClass}
                  strokeWidth={width}
                  strokeLinecap="round"
              />
          );
      }
      return ticks;
  }

  return (
    <div className={cn("relative flex w-full flex-col items-center justify-center pt-4", className)}>
      
      {/* Clock Container - Position: Relative */}
      <div className="relative w-full max-w-[320px] aspect-[2/1] overflow-visible pt-4">
        
        {/* SVG background dials */}
        <svg
          viewBox="0 0 320 160"
          className="absolute inset-x-0 bottom-0 w-full h-[100%] overflow-visible"
          aria-hidden="true"
        >
          {/* Shadow Filter */}
          <defs>
              <filter id="glow-meter" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="8" result="blur"/>
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
          </defs>

          {/* Background Track Arc */}
          <path
            d={arcPath}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="text-line/30"
          />
          {/* Subtle inner track line */}
          <path
            d={`M ${cx - radius + strokeWidth/2 + 4} ${cy} A ${radius - strokeWidth/2 - 4} ${radius - strokeWidth/2 - 4} 0 0 1 ${cx + radius - strokeWidth/2 - 4} ${cy}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            className="text-line/40"
          />

          {/* Filled Active Arc (Glowing & Dynamic Color) */}
          {!isDataMissing && (
            <motion.path
              d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
              fill="none"
              stroke={currentColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              style={{ filter: 'url(#glow-meter)' }}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ type: "spring", stiffness: 45, damping: 15 }}
            />
          )}

          {/* Ticks and Clean Upright Labels */}
          {generateTicks()}
          {generateLabels()}

        </svg>

        {/* CLOCK HAND - Position: Absolute */}
        {/* Anchored EXACTLY at the bottom center of the relative container */}
        <motion.div
           className="absolute z-10"
           style={{
             left: '50%',
             bottom: 0,
             width: '8px', 
             height: '115px', // Exact needle length radiating outward from center
             transformOrigin: 'bottom center', // Required CSS Origin
           }}
           initial={{ x: '-50%', rotate: startAngle }}
           animate={{ x: '-50%', rotate: rotation }}
           transition={{ type: "spring", stiffness: 60, damping: 14 }}
        >
            <div className="relative w-full h-full">
                {/* The blade wrapper extending up */}
                <div 
                  className="absolute bottom-0 left-0 w-full rounded-t-full rounded-b-sm shadow-md transition-colors duration-500"
                  style={{ 
                    height: '100%', 
                    background: `linear-gradient(to top, transparent, ${currentColor})`,
                    boxShadow: isDataMissing ? 'none' : `0 0 12px ${currentColor}80`
                  }}
                />
                
                {/* Central white glow line inside the blade */}
                <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[2px] h-[90%] bg-white/90 rounded-full" />
                
                {/* Needle Tail passing behind the pivot origin */}
                <div 
                  className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-5 rounded-b-md bg-panel border-x border-b shadow-lg border-line/60"
                />
            </div>
        </motion.div>

        {/* Pivot Center Point - Absolute HTML overlay preventing sliding artifacts */}
        <div className="absolute left-1/2 bottom-0 z-20 flex items-center justify-center -translate-x-1/2 translate-y-1/2">
            <div className="size-9 bg-panel border border-line/60 rounded-full flex items-center justify-center shadow-lg">
                <div className="size-6 bg-ink/5 rounded-full flex items-center justify-center">
                    <div className="size-3.5 rounded-full shadow-[0_0_12px_currentColor] transition-colors duration-500" style={{ backgroundColor: currentColor }}>
                       <div className="size-1 bg-white rounded-full mx-auto mt-[3px] opacity-90" />
                    </div>
                </div>
            </div>
        </div>

      </div>

      {/* Floating Center Console Box - Transparent and seamless */}
      <div className="relative mt-8 flex flex-col items-center">
          <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black italic tracking-tighter tabular-nums drop-shadow-sm transition-colors duration-500" style={{ color: currentColor }}>
                  {isDataMissing ? '---' : clampedValue.toFixed(0)}
              </span>
              {!isDataMissing && <span className="text-xl font-bold text-ink/40">{unit}</span>}
          </div>
          <span className="text-[11px] tracking-[0.3em] font-bold text-ink/40 uppercase mt-1">
              {label}
          </span>
      </div>
    </div>
  );
}
