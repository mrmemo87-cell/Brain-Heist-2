import React from 'react';

interface RadialGaugeProps {
    value: number;
    maxValue: number;
    label: string;
    color: string;
    size?: number;
    strokeWidth?: number;
    icon?: React.ReactNode;
}

const RadialGauge: React.FC<RadialGaugeProps> = ({
    value,
    maxValue,
    label,
    color,
    size = 120,
    strokeWidth = 8,
    icon
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(1, Math.max(0, value / maxValue));
    const offset = circumference * (1 - progress);

    return (
        <div className="flex flex-col items-center justify-center gap-1">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <defs>
                        <filter id={`glow-${label}`} x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
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
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference}
                        strokeLinecap="round"
                        style={{ animationDelay: `${Math.random() * 0.2}s`, strokeDashoffset: offset, filter: `url(#glow-${label})` }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                    {icon && <div className="h-6 w-6" style={{ color }}>{icon}</div>}
                     <span className={`font-orbitron font-bold ${size < 100 ? 'text-lg' : 'text-2xl'}`}>{value}</span>
                     {size < 100 && <span className="text-xs text-gray-400">/{maxValue}</span>}
                </div>
            </div>
             <p className={`font-semibold ${size < 100 ? 'text-xs' : 'text-sm'}`}>{label}</p>
        </div>
    );
};

export default RadialGauge;
