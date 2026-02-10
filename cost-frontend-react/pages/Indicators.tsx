
import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  ShieldAlert, 
  Coins, 
  Layers, 
  ChevronRight,
  BarChart3
} from 'lucide-react';

const Indicators: React.FC = () => {
  const groups = [
    {
      title: '成本管控指标',
      metrics: [
        { label: '毛利润率', value: '12.4%', trend: 'up', color: 'blue' },
        { label: '目标利润偏差', value: '-0.5%', trend: 'down', color: 'emerald' },
        { label: '项目结余', value: '¥1,245k', trend: 'up', color: 'indigo' },
        { label: '盈亏平衡点', value: '82%', trend: 'neutral', color: 'slate' }
      ]
    },
    {
      title: '税务风险指标',
      metrics: [
        { label: '平均进项税率', value: '10.2%', trend: 'up', color: 'emerald' },
        { label: '税负压力指数', value: '0.042', trend: 'down', color: 'amber' },
        { label: '合规抵扣比例', value: '98.5%', trend: 'neutral', color: 'blue' },
        { label: '潜在涉税风险点', value: '3', trend: 'down', color: 'red' }
      ]
    },
    {
      title: '物资供应效率',
      metrics: [
        { label: '集采覆盖率', value: '75.0%', trend: 'up', color: 'blue' },
        { label: '合同签订率', value: '100%', trend: 'neutral', color: 'emerald' },
        { label: '三价对比偏差', value: '2.4%', trend: 'down', color: 'slate' },
        { label: '库存周转天数', value: '45d', trend: 'down', color: 'indigo' }
      ]
    }
  ];

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp size={14} className="text-emerald-500" />;
    if (trend === 'down') return <TrendingDown size={14} className="text-red-500" />;
    return <ChevronRight size={14} className="text-slate-300" />;
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'emerald': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'amber': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'red': return 'bg-red-50 text-red-600 border-red-100';
      case 'indigo': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-500">
      {groups.map((group, idx) => (
        <div key={idx} className="space-y-4">
          <div className="flex items-center justify-between">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
               <div className="w-1 h-3 bg-blue-600 rounded-full mr-2"></div>
               {group.title}
             </h3>
             <button className="text-[10px] font-bold text-blue-600 hover:underline">查看详细追溯</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {group.metrics.map((m, mIdx) => (
              <div 
                key={mIdx} 
                className={`p-6 rounded-2xl border transition-all hover:shadow-lg hover:-translate-y-1 cursor-pointer group flex flex-col justify-between h-32 ${getColorClass(m.color)}`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-semibold opacity-80">{m.label}</span>
                  <div className="p-1.5 bg-white/50 rounded-lg group-hover:scale-110 transition-transform">
                    {getTrendIcon(m.trend)}
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                   <span className="text-2xl font-black tracking-tight">{m.value}</span>
                   <span className="text-[10px] font-bold opacity-60 uppercase">Unit / RT</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Summary Chart Area */}
      <div className="bg-slate-50 rounded-2xl p-8 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-4 py-20">
         <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
           <BarChart3 size={32} className="text-slate-300" />
         </div>
         <div>
            <h4 className="text-sm font-bold text-slate-800">趋势分析组件正在载入...</h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1">系统正实时从当前版本数据中计算动态趋势曲线，请稍候</p>
         </div>
      </div>
    </div>
  );
};

export default Indicators;
