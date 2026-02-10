
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  Save, 
  Send, 
  RotateCcw, 
  Printer, 
  FileDown, 
  Stamp, 
  ChevronRight,
  Calculator,
  AlertCircle,
  TrendingUp,
  BrainCircuit,
  Search
} from 'lucide-react';
import { WORKBENCH_TABS } from '../constants';
import Indicators from './Indicators';
import { getCostAnalysis } from '../services/geminiService';

const Workbench: React.FC = () => {
  const { versionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const activeTab = location.pathname.split('/').pop();

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleAiAnalysis = async () => {
    setIsAiLoading(true);
    const mockIndicators = [
      { label: '综合利润率', value: 0.12, category: 'Profit' },
      { label: '税负压力', value: 0.04, category: 'Tax' }
    ];
    const summary = await getCostAnalysis(mockIndicators);
    setAiSummary(summary);
    setIsAiLoading(false);
  };

  return (
    <Layout title="版本工作台" subtitle={`版本 ID: ${versionId} | 上海中环超高层项目`}>
      <div className="flex flex-col h-full space-y-4">
        
        {/* Top Operation Area */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">当前状态</span>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">草案编辑中</span>
            </div>
            <div className="h-6 w-[1px] bg-slate-100"></div>
            <div className="flex items-center space-x-2">
              <Calculator size={16} className="text-slate-400" />
              <span className="text-xs text-slate-600">实时自动重算: <span className="text-emerald-500 font-bold font-mono">ON</span></span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button 
              onClick={handleSave}
              className={`flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all ${isSaving ? 'opacity-50' : ''}`}
            >
              {isSaving ? '保存中...' : <><Save size={14} className="mr-2 text-blue-600" /> 保存草案</>}
            </button>
            <button className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all">
              <RotateCcw size={14} className="mr-2 text-slate-500" /> 撤回变更
            </button>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-md shadow-blue-100 transition-all">
              <Send size={14} className="mr-2" /> 提交审核
            </button>
            <div className="h-6 w-[1px] bg-slate-100 mx-2"></div>
            <button className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-all">
              <Stamp size={14} className="mr-2 text-indigo-500" /> 锁定盖章
            </button>
          </div>
        </div>

        {/* Module Content Area */}
        <div className="flex-1 flex space-x-6 min-h-0 overflow-hidden">
          {/* Left Module Navigation */}
          <aside className="w-52 flex flex-col space-y-1 shrink-0">
            {WORKBENCH_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => navigate(`/versions/${versionId}/workbench/${tab.id}`)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between group ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                    : 'text-slate-600 hover:bg-white hover:shadow-sm'
                }`}
              >
                {tab.label}
                <ChevronRight size={14} className={`${activeTab === tab.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'} transition-opacity`} />
              </button>
            ))}

            {/* AI Assistant Insight Card */}
            <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center">
                   <BrainCircuit size={12} className="mr-1" /> Gemini 智能洞察
                 </span>
               </div>
               {aiSummary ? (
                 <p className="text-[11px] text-indigo-800 leading-relaxed font-medium">
                   {aiSummary}
                 </p>
               ) : (
                 <p className="text-[11px] text-indigo-400 italic">点击按钮获取当前版本成本洞察...</p>
               )}
               <button 
                onClick={handleAiAnalysis}
                disabled={isAiLoading}
                className="mt-3 w-full py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
               >
                 {isAiLoading ? '分析中...' : '生成分析'}
               </button>
            </div>
          </aside>

          {/* Right Workspace Content */}
          <section className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-800">
                  {WORKBENCH_TABS.find(t => t.id === activeTab)?.label || '物资明细'}
                </h2>
                <div className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-500 font-mono">V2.4.12</div>
              </div>
              <div className="flex items-center space-x-4">
                 <div className="relative">
                   {/* Correctly using Search icon from lucide-react */}
                   <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input type="text" placeholder="全局检索内容..." className="pl-9 pr-4 py-1.5 bg-slate-50 border-none rounded-lg text-xs w-48 focus:ring-1 focus:ring-blue-500 transition-all" />
                 </div>
                 <button className="text-slate-400 hover:text-blue-600"><FileDown size={18} /></button>
                 <button className="text-slate-400 hover:text-blue-600"><Printer size={18} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <Routes>
                <Route path="material" element={<LineItemTable category="Material" />} />
                <Route path="subcontract" element={<LineItemTable category="Subcontract" />} />
                <Route path="expense" element={<LineItemTable category="Expense" />} />
                <Route path="indicators" element={<Indicators />} />
                <Route path="*" element={<LineItemTable category="Material" />} />
              </Routes>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

// Sub-component for tables
const LineItemTable: React.FC<{ category: string }> = ({ category }) => {
  const [data] = useState([
    { id: '1', code: 'MAT-001', name: 'HRB400 螺纹钢', spec: 'Φ12mm-Φ25mm', unit: '吨', qty: 245.5, price: 4200.00, taxRate: 0.13, total: 1031100.00 },
    { id: '2', code: 'MAT-002', name: 'C30 商品混凝土', spec: '强度等级C30', unit: 'm³', qty: 12500, price: 380.00, taxRate: 0.03, total: 4750000.00 },
    { id: '3', code: 'MAT-003', name: '普通硅酸盐水泥', spec: 'P.O 42.5', unit: '吨', qty: 1200, price: 450.00, taxRate: 0.13, total: 540000.00 },
    { id: '4', code: 'MAT-004', name: '天然中粗砂', spec: '含泥量≤3%', unit: 'm³', qty: 4500, price: 165.00, taxRate: 0.03, total: 742500.00 },
  ]);

  return (
    <div className="min-w-full">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider sticky top-0 z-[5]">
            <th className="px-6 py-4 w-10"><input type="checkbox" className="rounded" /></th>
            <th className="px-6 py-4">物资编码</th>
            <th className="px-6 py-4">名称</th>
            <th className="px-6 py-4">规格型号</th>
            <th className="px-6 py-4">单位</th>
            <th className="px-6 py-4 text-right">数量</th>
            <th className="px-6 py-4 text-right">含税单价</th>
            <th className="px-6 py-4 text-center">税率</th>
            <th className="px-6 py-4 text-right">合价 (含税)</th>
            <th className="px-6 py-4 text-center">风险</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
              <td className="px-6 py-3"><input type="checkbox" className="rounded" /></td>
              <td className="px-6 py-3 font-mono text-slate-400 group-hover:text-blue-600 transition-colors">{item.code}</td>
              <td className="px-6 py-3 font-bold text-slate-700">{item.name}</td>
              <td className="px-6 py-3 text-slate-500">{item.spec}</td>
              <td className="px-6 py-3 text-slate-400">{item.unit}</td>
              <td className="px-6 py-3 text-right font-mono">{item.qty.toLocaleString()}</td>
              <td className="px-6 py-3 text-right font-mono">¥{item.price.toFixed(2)}</td>
              <td className="px-6 py-3 text-center">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-bold">{(item.taxRate * 100).toFixed(0)}%</span>
              </td>
              <td className="px-6 py-3 text-right font-bold text-slate-800 font-mono">¥{item.total.toLocaleString()}</td>
              <td className="px-6 py-3 text-center">
                 <AlertCircle size={14} className={item.taxRate === 0.03 ? 'text-amber-400' : 'text-emerald-400'} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Table Footer / Summary Bar */}
      <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex items-center justify-between text-xs font-bold text-slate-700">
        <div className="flex space-x-8">
           <div className="flex items-center space-x-2">
             <span className="text-slate-400 uppercase tracking-widest text-[10px]">总项数:</span>
             <span>1,248</span>
           </div>
           <div className="flex items-center space-x-2">
             <span className="text-slate-400 uppercase tracking-widest text-[10px]">汇总不含税金额:</span>
             <span className="text-blue-600 font-mono">¥12,455,200.32</span>
           </div>
           <div className="flex items-center space-x-2">
             <span className="text-slate-400 uppercase tracking-widest text-[10px]">进项税金合计:</span>
             <span className="text-emerald-600 font-mono">¥1,120,332.12</span>
           </div>
        </div>
        <div className="flex space-x-2">
          <button className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">批量修改</button>
          <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-100 transition-all">确认合价</button>
        </div>
      </div>
    </div>
  );
};

export default Workbench;
