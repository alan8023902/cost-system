import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { LineItemTable } from '../components/LineItemTable';
import { ExcelImport } from '../components/ExcelImport';
import { versionApi, indicatorApi, lineItemApi } from '../services/apiService';
import { 
  Save, 
  Send, 
  RotateCcw, 
  Upload,
  Download,
  Calculator,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface Version {
  id: number;
  versionName: string;
  status: string;
  projectName: string;
  createTime: string;
}

interface Indicator {
  key: string;
  displayName: string;
  value: number;
  unit: string;
  category: string;
}

type ModuleType = 'MATERIAL' | 'SUBCONTRACT' | 'EXPENSE';

export const Workbench: React.FC = () => {
  const { versionId } = useParams<{ versionId: string }>();
  const navigate = useNavigate();
  
  const [version, setVersion] = useState<Version | null>(null);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [currentModule, setCurrentModule] = useState<ModuleType>('MATERIAL');
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    loadWorkbenchData();
  }, [versionId]);

  useEffect(() => {
    loadLineItems();
  }, [currentModule, versionId]);

  const loadWorkbenchData = async () => {
    if (!versionId) return;
    
    setLoading(true);
    try {
      const [versionData, indicatorsData] = await Promise.all([
        versionApi.get(versionId),
        indicatorApi.list(versionId),
      ]);
      
      setVersion(versionData);
      setIndicators(indicatorsData);
    } catch (error) {
      console.error('Failed to load workbench data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLineItems = async () => {
    if (!versionId) return;
    
    try {
      const items = await lineItemApi.list(versionId, currentModule);
      setLineItems(items);
    } catch (error) {
      console.error('Failed to load line items:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 保存操作会在LineItemTable内部处理
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!versionId) return;
    
    if (confirm('确定要提交审批吗？')) {
      try {
        await versionApi.update(versionId, { status: 'PENDING' });
        alert('提交成功！');
        loadWorkbenchData();
      } catch (error) {
        alert('提交失败：' + error);
      }
    }
  };

  const handleRecalculate = async () => {
    if (!versionId) return;
    
    try {
      const newIndicators = await indicatorApi.recalculate(versionId);
      setIndicators(newIndicators);
    } catch (error) {
      console.error('Failed to recalculate:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      DRAFT: { text: '草稿', className: 'bg-blue-50 text-blue-600 border-blue-100' },
      PENDING: { text: '审批中', className: 'bg-amber-50 text-amber-600 border-amber-100' },
      APPROVED: { text: '已通过', className: 'bg-green-50 text-green-600 border-green-100' },
      REJECTED: { text: '已驳回', className: 'bg-red-50 text-red-600 border-red-100' },
      ISSUED: { text: '已签发', className: 'bg-purple-50 text-purple-600 border-purple-100' },
      ARCHIVED: { text: '已归档', className: 'bg-slate-50 text-slate-600 border-slate-100' },
    };
    const config = statusMap[status] || statusMap.DRAFT;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${config.className}`}>
        {config.text}
      </span>
    );
  };

  const modules = [
    { id: 'MATERIAL' as ModuleType, name: '材料成本', icon: '📦' },
    { id: 'SUBCONTRACT' as ModuleType, name: '分包成本', icon: '🏗️' },
    { id: 'EXPENSE' as ModuleType, name: '费用成本', icon: '💰' },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-slate-400">加载中...</div>
        </div>
      </Layout>
    );
  }

  if (!version) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-slate-400">版本不存在</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-semibold text-slate-900">{version.versionName}</h1>
                <p className="text-sm text-slate-500 mt-1">{version.projectName}</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <Calculator size={14} className="text-slate-400" />
                  <span>实时自动重算</span>
                  <span className="text-emerald-500 font-bold font-mono">ON</span>
                </div>
                <div className="h-6 w-px bg-slate-200"></div>
                {getStatusBadge(version.status)}
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {modules.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => setCurrentModule(module.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      currentModule === module.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="mr-2">{module.icon}</span>
                    {module.name}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowImport(true)}
                  className="flex items-center px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Upload size={14} className="mr-2" />
                  导入Excel
                </button>
                <button
                  onClick={handleRecalculate}
                  className="flex items-center px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Calculator size={14} className="mr-2" />
                  重算
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  <Save size={14} className="mr-2 text-blue-600" />
                  {isSaving ? '保存中...' : '保存'}
                </button>
                <button className="flex items-center px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <RotateCcw size={14} className="mr-2" />
                  撤回
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-md transition-all"
                >
                  <Send size={14} className="mr-2" />
                  提交审核
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Indicator Dashboard */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {indicators.slice(0, 6).map((indicator) => (
              <div
                key={indicator.key}
                className="bg-white rounded-lg p-3 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="text-xs text-slate-500 mb-1">{indicator.displayName}</div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-lg font-bold text-slate-900">
                    {indicator.value.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400">{indicator.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="px-6 py-6">
          <LineItemTable
            versionId={parseInt(versionId!)}
            module={currentModule}
            items={lineItems}
            onItemsChange={setLineItems}
            onRecalculate={handleRecalculate}
          />
        </div>
      </div>

      {/* Excel Import Modal */}
      {showImport && (
        <ExcelImport
          versionId={parseInt(versionId!)}
          onSuccess={() => {
            loadLineItems();
            loadWorkbenchData();
          }}
          onClose={() => setShowImport(false)}
        />
      )}
    </Layout>
  );
};
