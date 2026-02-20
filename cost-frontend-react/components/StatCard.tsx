import React from 'react';
import { LucideIcon } from 'lucide-react';
import MiniChart from './MiniChart';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  iconColor?: 'blue' | 'green' | 'amber' | 'red' | 'gray';
  chartData?: { value: number; label?: string }[];
  chartType?: 'line' | 'bar' | 'area';
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'blue',
  chartData,
  chartType = 'area',
}) => {
  const iconColorMap = {
    blue: 'text-brand-600 bg-brand-50',
    green: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    red: 'text-red-600 bg-red-50',
    gray: 'text-neutral-600 bg-neutral-100',
  };

  const changeColor = change && change > 0
    ? 'text-emerald-600'
    : change && change < 0
    ? 'text-red-600'
    : 'text-neutral-500';

  return (
    <div className="ui-stat-card group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="ui-stat-label">{label}</div>
          <div className="ui-stat-value">{value}</div>
          {change !== undefined && (
            <div className={`ui-stat-change ${changeColor}`}>
              {change > 0 ? '+' : ''}{change}%
              {changeLabel && <span className="text-neutral-400 ml-1">{changeLabel}</span>}
            </div>
          )}
        </div>

        {Icon && (
          <div className={`w-10 h-10 rounded-lg ${iconColorMap[iconColor]} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
            <Icon size={20} />
          </div>
        )}
      </div>

      {chartData && chartData.length > 0 && (
        <div className="mt-4 pt-3 border-t border-neutral-100">
          <MiniChart
            data={chartData}
            type={chartType}
            color={iconColor}
            height={48}
          />
        </div>
      )}
    </div>
  );
};

export default StatCard;
