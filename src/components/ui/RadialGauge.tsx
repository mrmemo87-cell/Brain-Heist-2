import React, { useState, useEffect } from 'react';

interface RadialGaugeProps {
    value: number;
    maxValue: number;
    label: string;
    color: string;
    size?: number;
    strokeWidth?: number;
}

const RadialGauge: React.FC<RadialGaugeProps> = ({
    value,
    maxValue,
    label,
    color,
    size = 120,
    strokeWidth = 10,
}) => {
    const [isMounted, setIsMounted] = useState(false);
    
    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = isMounted ? Math.min(1, Math.max(0, value / maxValue)) : 0;
    const offset = circumference * (1 - progress);

    const adjustHsl = (hsl: string, l_add: number): string => {
        const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (!match) return hsl;
        const [, h, s, l] = match.map(Number);
        return `hsl(${h}, ${s}%, ${Math.max(0, Math.min(100, l + l_add))}%)`;
    };
    const endColor = adjustHsl(color, 20);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                <defs>
                     <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={endColor} />
                        <stop offset="100%" stopColor={color} />
                    </linearGradient>
                    <filter id={`glow-${label}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                 <circle
                    className="gauge-bg"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <circle
                    className="gauge-fg"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={`url(#gradient-${label})`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    style={{ strokeDashoffset: offset, filter: `url(#glow-${label})` }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white pointer-events-none">
                <span className={`font-orbitron font-bold text-shadow-glow ${size < 100 ? 'text-xl' : 'text-3xl'}`} style={{ color: endColor }}>
                    {Math.round(progress * 100)}<span className="text-base align-middle">%</span>
                </span>
                <span className="text-xs uppercase tracking-widest text-gray-400 mt-1">{label}</span>
            </div>
        </div>
    );
};

export default RadialGauge;