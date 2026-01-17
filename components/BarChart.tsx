
import React from 'react';

interface BarChartData {
    label: string;
    value: number;
    color: string;
}

interface BarChartProps {
    data: BarChartData[];
}

export const BarChart: React.FC<BarChartProps> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1); // Avoid division by zero
    const chartHeight = 200;
    const barWidth = 50;
    const barMargin = 30;
    const chartWidth = data.length * (barWidth + barMargin);

    return (
        <svg width="100%" height={chartHeight + 40} viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} className="font-sans">
            {data.map((item, index) => {
                const barHeight = (item.value / maxValue) * chartHeight;
                const x = index * (barWidth + barMargin) + barMargin / 2;
                const y = chartHeight - barHeight;

                return (
                    <g key={item.label}>
                        <rect 
                            x={x} 
                            y={y} 
                            width={barWidth} 
                            height={barHeight} 
                            fill={item.color} 
                            rx="4"
                        >
                             <animate attributeName="height" from="0" to={barHeight} dur="0.5s" fill="freeze" />
                             <animate attributeName="y" from={chartHeight} to={y} dur="0.5s" fill="freeze" />
                        </rect>
                        <text 
                            x={x + barWidth / 2} 
                            y={y - 8} 
                            textAnchor="middle" 
                            fill="white"
                            className="text-lg font-bold"
                        >
                            {item.value}
                        </text>
                        <text 
                            x={x + barWidth / 2} 
                            y={chartHeight + 20} 
                            textAnchor="middle" 
                            fill="#94a3b8"
                            className="text-sm"
                        >
                            {item.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
};