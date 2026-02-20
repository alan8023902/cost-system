import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DataPoint {
  value: number;
  label?: string;
}

interface MiniChartProps {
  data: DataPoint[];
  type?: 'line' | 'bar' | 'area';
  color?: 'blue' | 'green' | 'amber' | 'red' | 'gray';
  height?: number;
  showTrend?: boolean;
}

const MiniChart: React.FC<MiniChartProps> = ({
  data,
  type = 'line',
  color = 'blue',
  height = 40,
  showTrend = false,
}) => {
  if (!data || data.length === 0) return null;

  const values = data.map(d => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const colorMap = {
    blue: { stroke: '#2563eb', fill: '#3b82f6', bg: '#eff6ff' },
    green: { stroke: '#059669', fill: '#10b981', bg: '#d1fae5' },
    amber: { stroke: '#d97706', fill: '#f59e0b', bg: '#fef3c7' },
    red: { stroke: '#dc2626', fill: '#ef4444', bg: '#fee2e2' },
    gray: { stroke: '#525252', fill: '#737373', bg: '#f5f5f5' },
  };

  const colors = colorMap[color];

  // Calculate trend
  const trend = values.length > 1 ? values[values.length - 1] - values[0] : 0;
  const trendPercent = values[0] !== 0 ? ((trend / values[0]) * 100).toFixed(1) : '0.0';

  const renderLine = () => {
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((d.value - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="100%" height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colors.fill} stopOpacity="0.3" />
            <stop offset="100%" stopColor={colors.fill} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {type === 'area' && (
          <polygon
            points={`0,100 ${points} 100,100`}
            fill={`url(#gradient-${color})`}
            className="transition-all duration-300"
          />
        )}

        <polyline
          points={points}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-300"
        />

        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 100 - ((d.value - min) / range) * 100;
          return (
            <circle
              key={i}
              cx={`${x}%`}
              cy={`${y}%`}
              r="2"
              fill={colors.stroke}
              className="transition-all duration-300 opacity-0 hover:opacity-100"
            />
          );
        })}
      </svg>
    );
  };

  const renderBar = () => {
    const barWidth = 100 / data.length;
    const gap = 2;

    return (
      <svg width="100%" height={height}>
        {data.map((d, i) => {
          const barHeight = ((d.value - min) / range) * 100;
          const x = i * barWidth;
          const y = 100 - barHeight;

          return (
            <rect
              key={i}
              x={`${x + gap / 2}%`}
              y={`${y}%`}
              width={`${barWidth - gap}%`}
              height={`${barHeight}%`}
              fill={colors.fill}
              rx="2"
              className="transition-all duration-300 hover:opacity-80"
            />
          );
        })}
      </svg>
    );
  };

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-600' : 'text-neutral-500';

  return (
    <div className="relative">
      <div className="w-full" style={{ height }}>
        {type === 'bar' ? renderBar() : renderLine()}
      </div>

      {showTrend && (
        <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${trendColor}`}>
          <TrendIcon size={14} />
          <span>{trend > 0 ? '+' : ''}{trendPercent}%</span>
        </div>
      )}
    </div>
  );
};

export default MiniChart;
