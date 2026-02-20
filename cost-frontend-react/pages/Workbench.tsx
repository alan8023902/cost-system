import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { LineItemTable } from '../components/LineItemTable';
import { ExcelImport } from '../components/ExcelImport';
import { AuditLogPanel } from '../components/AuditLogPanel';
import TraceDrawer from '../components/TraceDrawer';
import { fileApi, indicatorApi, lineItemApi, templateApi, versionApi, workflowApi } from '../services/apiService';
import { useToast } from '../components/ToastProvider';
import { Save, Send, RotateCcw, Download, Calculator, Lock, FileCheck, Stamp, FileUp, FileDown, FileBox, ChevronDown, X, ShieldAlert, CircleCheckBig, ClipboardCheck } from 'lucide-react';
import { formatIndicatorLabel, formatStatusLabel, WORKBENCH_TABS } from '../constants';

type ModuleTab = 'material' | 'subcontract' | 'expense';

const tabToModule: Record<ModuleTab, 'MATERIAL' | 'SUBCONTRACT' | 'EXPENSE'> = {
  material: 'MATERIAL',
  subcontract: 'SUBCONTRACT',
  expense: 'EXPENSE',
};

const PRIMARY_TABS = ['material', 'subcontract', 'expense', 'indicators', 'workflow'];
const SECONDARY_TABS = ['reports', 'import-export', 'seal', 'audit'];

type TemplateColumn = {
  field: string;
  label: string;
  type?: string;
  editable?: boolean;
  required?: boolean;
  visible?: boolean;
  width?: number;
  precision?: number;
};

type TemplateModule = {
  code: string;
  name: string;
  enabled?: boolean;
  categories?: string[];
  columns?: TemplateColumn[];
};

type TemplateSchema = {
  modules?: TemplateModule[];
  fields?: TemplateColumn[];
  export_layout?: any[];
  indicator_layout?: any[];
};

const parseTemplateSchema = (schemaJson?: string): TemplateSchema => {
  if (!schemaJson) return {};
  try {
    const raw = JSON.parse(schemaJson);
    const modules = Array.isArray(raw?.modules)
      ? raw.modules.map((mod: any) => ({
          code: mod.module_code || mod.code || mod.moduleCode,
          name: mod.module_name || mod.name || mod.moduleName,
          enabled: mod.enabled !== false,
          categories: Array.isArray(mod.categories) ? mod.categories : undefined,
          columns: Array.isArray(mod.columns)
            ? mod.columns.map((col: any) => ({
                field: col.field || col.code || col.key,
                label: col.label || col.name || col.title,
                type: col.type,
                editable: col.editable !== false,
                required: col.required,
                visible: col.visible !== false,
                width: col.width,
                precision: col.precision,
              }))
            : undefined,
        }))
      : undefined;

    const fields = Array.isArray(raw?.fields)
      ? raw.fields.map((field: any) => ({
          field: field.code || field.field || field.key,
          label: field.name || field.label || field.title,
          type: field.type,
          editable: field.editable !== false,
          required: field.required,
          visible: field.visible !== false,
          width: field.width,
          precision: field.precision,
        }))
      : undefined;

    return {
      modules,
      fields,
      export_layout: Array.isArray(raw?.export_layout) ? raw.export_layout : undefined,
      indicator_layout: Array.isArray(raw?.indicator_layout) ? raw.indicator_layout : undefined,
    };
  } catch (e) {
    return {};
  }
};

const Workbench: React.FC = () => {
  const { versionId } = useParams<{ versionId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') || 'material';
  const hasTab = WORKBENCH_TABS.some((tab) => tab.id === rawTab);
  const activeTab = (hasTab ? rawTab : 'material') as string;

  const [version, setVersion] = useState<any>(null);
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [indicators, setIndicators] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [sealRecords, setSealRecords] = useState<any[]>([]);
  const [workflowDetail, setWorkflowDetail] = useState<any>(null);
  const [templateSchema, setTemplateSchema] = useState<TemplateSchema>({});
  const [categoryFilter, setCategoryFilter] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [fileLoading, setFileLoading] = useState(false);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showMoreTabs, setShowMoreTabs] = useState(false);
  const [hideStatusBanner, setHideStatusBanner] = useState(false);
  const [traceState, setTraceState] = useState<{ open: boolean; key: string; name: string }>(
    { open: false, key: '', name: '' }
  );
  const toast = useToast();

  const isModuleTab = (tab: string): tab is ModuleTab => ['material', 'subcontract', 'expense'].includes(tab);

  const loadVersion = async () => {
    if (!versionId) return null;
    const data = await versionApi.get(versionId);
    setVersion(data);
    return data;
  };

  const loadTemplate = async (templateId?: number | string) => {
    if (!templateId) {
      setTemplateSchema({});
      return;
    }
    try {
      const tpl = await templateApi.get(templateId);
      setTemplateSchema(parseTemplateSchema(tpl?.schemaJson));
    } catch (e) {
      setTemplateSchema({});
    }
  };

  const loadLineItems = async (tab: ModuleTab) => {
    if (!versionId) return;
    const moduleCode = tabToModule[tab];
    const activeCategory = categoryFilter[moduleCode];
    const data = await lineItemApi.list(
      versionId,
      moduleCode,
      activeCategory && activeCategory !== 'ALL' ? activeCategory : undefined
    );
    setLineItems(Array.isArray(data) ? data : []);
  };

  const loadIndicators = async () => {
    if (!versionId) return;
    const data = await indicatorApi.list(versionId);
    setIndicators(Array.isArray(data) ? data : []);
  };

  const loadFiles = async () => {
    if (!versionId) return;
    setFileLoading(true);
    try {
      const [fileList, sealList] = await Promise.all([
        fileApi.listVersionFiles(Number(versionId)),
        fileApi.listSealRecords(Number(versionId)),
      ]);
      setFiles(Array.isArray(fileList) ? fileList : []);
      setSealRecords(Array.isArray(sealList) ? sealList : []);
    } catch (e) {
      console.error(e);
    } finally {
      setFileLoading(false);
    }
  };

  const loadWorkflow = async () => {
    if (!versionId) return;
    setWorkflowLoading(true);
    try {
      const detail = await workflowApi.getVersionWorkflow(String(versionId));
      setWorkflowDetail(detail);
    } catch (e) {
      console.error(e);
      setWorkflowDetail(null);
    } finally {
      setWorkflowLoading(false);
    }
  };

  const loadAll = async () => {
    if (!versionId) return;
    setLoading(true);
    try {
      const versionData = await loadVersion();
      if (versionData?.templateId) {
        await loadTemplate(versionData.templateId);
      }
      if (isModuleTab(activeTab)) {
        await loadLineItems(activeTab);
      } else if (activeTab === 'indicators') {
        await loadIndicators();
      } else if (activeTab === 'import-export' || activeTab === 'seal') {
        await loadFiles();
      } else if (activeTab === 'workflow') {
        await loadWorkflow();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [versionId, activeTab]);

  useEffect(() => {
    if (isModuleTab(activeTab)) {
      loadLineItems(activeTab);
    }
  }, [categoryFilter, activeTab]);

  useEffect(() => {
    setShowMoreTabs(false);
  }, [activeTab]);

  useEffect(() => {
    setHideStatusBanner(false);
  }, [version?.status]);

  const canEdit = version?.status === 'DRAFT';
  const canSeal = version?.status === 'ISSUED';

  const exportFiles = useMemo(() => {
    return files.filter((file) => file.fileType === 'EXPORT_XLSX' || file.fileType === 'EXPORT_PDF');
  }, [files]);

  const formatSize = (size?: number) => {
    if (!size && size !== 0) return '-';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  const fileTypeBadge = (type: string) => {
    const map: Record<string, { label: string; className: string }> = {
      EXPORT_XLSX: { label: 'Excel导出', className: 'ui-badge-blue' },
      EXPORT_PDF: { label: 'PDF导出', className: 'ui-badge-gray' },
      SEALED_PDF: { label: '已盖章PDF', className: 'ui-badge-green' },
    };
    const config = map[type] || { label: type, className: 'ui-badge-gray' };
    return <span className={`ui-badge ${config.className}`}>{config.label}</span>;
  };

  const workflowTaskStatusBadge = (status?: string) => {
    const code = String(status || '').toUpperCase();
    const cls = code === 'PENDING' ? 'ui-badge-amber' : code === 'COMPLETED' ? 'ui-badge-green' : 'ui-badge-gray';
    return <span className={`ui-badge ${cls}`}>{formatStatusLabel(code)}</span>;
  };

  const handleSave = async () => {
    if (!versionId || !isModuleTab(activeTab)) return;
    setWorking(true);
    try {
      await lineItemApi.batchUpdate(Number(versionId), tabToModule[activeTab], lineItems);
      toast.success('保存成功');
    } catch (e: any) {
      toast.error(e?.message || '保存失败');
    } finally {
      setWorking(false);
    }
  };

  const handleRecalculate = async () => {
    if (!versionId) return;
    setWorking(true);
    try {
      await indicatorApi.recalculate(versionId);
      if (activeTab === 'indicators') {
        await loadIndicators();
      }
      toast.success('重算完成');
    } catch (e: any) {
      toast.error(e?.message || '重算失败');
    } finally {
      setWorking(false);
    }
  };

  const handleSubmit = async () => {
    if (!versionId) return;
    setWorking(true);
    try {
      await versionApi.submit(versionId);
      await loadVersion();
      toast.success('提交审批成功');
    } catch (e: any) {
      toast.error(e?.message || '提交审批失败');
    } finally {
      setWorking(false);
    }
  };

  const handleWithdraw = async () => {
    if (!versionId) return;
    setWorking(true);
    try {
      await versionApi.withdraw(versionId);
      await loadVersion();
      toast.success('撤回成功');
    } catch (e: any) {
      toast.error(e?.message || '撤回失败');
    } finally {
      setWorking(false);
    }
  };

  const handleExportExcel = async () => {
    if (!versionId) return;
    setWorking(true);
    try {
      await fileApi.exportExcel(Number(versionId));
      await loadFiles();
      toast.success('已生成Excel导出文件，可在文件中心下载');
    } catch (e: any) {
      toast.error(e?.message || '导出失败');
    } finally {
      setWorking(false);
    }
  };

  const handleExportPdf = async () => {
    if (!versionId) return;
    setWorking(true);
    try {
      await fileApi.exportPdf(Number(versionId));
      await loadFiles();
      toast.success('已生成PDF导出文件，可在文件中心下载');
    } catch (e: any) {
      toast.error(e?.message || '导出失败');
    } finally {
      setWorking(false);
    }
  };

  const handleSeal = async () => {
    if (!versionId) return;
    setWorking(true);
    try {
      await fileApi.sealVersion(Number(versionId));
      await loadFiles();
      toast.success('盖章完成，可在文件中心查看');
    } catch (e: any) {
      toast.error(e?.message || '盖章失败');
    } finally {
      setWorking(false);
    }
  };

  const handleDownloadFile = async (fileId: number) => {
    const { blob, filename } = await fileApi.downloadFile(fileId);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const renderStatusBanner = () => {
    if (!version || hideStatusBanner) return null;
    if (version.status === 'DRAFT') {
      return (
        <div className="mb-4 flex items-start justify-between border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 rounded-lg">
          <div className="flex items-start gap-2">
            <CircleCheckBig size={16} className="mt-0.5 shrink-0" />
            <div>
              <div className="font-medium">草稿状态 · 可编辑</div>
              <div className="text-xs text-emerald-600">支持录入、保存、重算与导入，建议提交前先检查指标与审计日志。</div>
            </div>
          </div>
          <button className="ui-btn-icon !h-6 !w-6 text-emerald-500 hover:text-emerald-700" onClick={() => setHideStatusBanner(true)}>
            <X size={14} />
          </button>
        </div>
      );
    }
    if (version.status === 'IN_APPROVAL') {
      return (
        <div className="mb-4 flex items-start justify-between border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 rounded-lg">
          <div className="flex items-start gap-2">
            <Lock size={16} className="mt-0.5 shrink-0" />
            <div>
              <div className="font-medium">审批中 · 已锁定</div>
              <div className="text-xs text-blue-600">当前版本正在审批，明细不可修改，可执行撤回、查看流程和导出。</div>
            </div>
          </div>
          <button className="ui-btn-icon !h-6 !w-6 text-blue-500 hover:text-blue-700" onClick={() => setHideStatusBanner(true)}>
            <X size={14} />
          </button>
        </div>
      );
    }
    if (version.status === 'APPROVED') {
      return (
        <div className="mb-4 flex items-start justify-between border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 rounded-lg">
          <div className="flex items-start gap-2">
            <ClipboardCheck size={16} className="mt-0.5 shrink-0" />
            <div>
              <div className="font-medium">已审批通过</div>
              <div className="text-xs text-indigo-600">可进行签发与导出，请确认签章位置后执行盖章流程。</div>
            </div>
          </div>
          <button className="ui-btn-icon !h-6 !w-6 text-indigo-500 hover:text-indigo-700" onClick={() => setHideStatusBanner(true)}>
            <X size={14} />
          </button>
        </div>
      );
    }
    if (version.status === 'ISSUED') {
      return (
        <div className="mb-4 flex items-start justify-between border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 rounded-lg">
          <div className="flex items-start gap-2">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" />
            <div>
              <div className="font-medium">已签发 · 严格只读</div>
              <div className="text-xs text-amber-600">当前版本已签发，建议仅执行导出和盖章，不再进行数据录入。</div>
            </div>
          </div>
          <button className="ui-btn-icon !h-6 !w-6 text-amber-500 hover:text-amber-700" onClick={() => setHideStatusBanner(true)}>
            <X size={14} />
          </button>
        </div>
      );
    }
    return null;
  };

  const renderActions = () => {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 rounded border border-neutral-200 bg-white p-1">
          <span className="px-2 text-xs font-medium text-neutral-500">编辑操作</span>
          <button className="ui-btn ui-btn-default gap-1.5" onClick={handleRecalculate} disabled={working || !canEdit}>
            <Calculator size={16} /> 重算
          </button>
          {isModuleTab(activeTab) && (
            <button className="ui-btn ui-btn-default gap-1.5" onClick={handleSave} disabled={working || !canEdit}>
              <Save size={16} /> 保存
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 rounded border border-neutral-200 bg-white p-1">
          <span className="px-2 text-xs font-medium text-neutral-500">审批操作</span>
          <button className="ui-btn ui-btn-primary gap-1.5" onClick={handleSubmit} disabled={working || !canEdit}>
            <Send size={16} /> 提交
          </button>
          <button
            className="ui-btn ui-btn-danger gap-1.5"
            onClick={handleWithdraw}
            disabled={working || version?.status !== 'IN_APPROVAL'}
          >
            <RotateCcw size={16} /> 撤回
          </button>
        </div>

        <div className="flex items-center gap-1 rounded border border-neutral-200 bg-white p-1">
          <span className="px-2 text-xs font-medium text-neutral-500">输出操作</span>
          <button className="ui-btn ui-btn-ghost gap-1.5" onClick={handleExportExcel} disabled={working}>
            <FileDown size={16} /> Excel
          </button>
          <button className="ui-btn ui-btn-ghost gap-1.5" onClick={handleExportPdf} disabled={working}>
            <Download size={16} /> PDF
          </button>
          <button className="ui-btn ui-btn-ghost gap-1.5" onClick={handleSeal} disabled={working || !canSeal}>
            <Stamp size={16} /> 盖章
          </button>
        </div>
      </div>
    );
  };

  const getModuleSchema = (moduleCode: string) => {
    return templateSchema?.modules?.find((mod) => mod.code === moduleCode);
  };

  const getModuleColumns = (moduleCode: string) => {
    const module = getModuleSchema(moduleCode);
    if (module?.columns && module.columns.length > 0) {
      return module.columns;
    }
    return templateSchema?.fields || [];
  };

  const getModuleCategories = (moduleCode: string) => {
    const module = getModuleSchema(moduleCode);
    return module?.categories || [];
  };

  const renderModule = (tab: ModuleTab) => {
    const moduleCode = tabToModule[tab];
    const moduleSchema = getModuleSchema(moduleCode);
    const moduleName = moduleSchema?.name || (tab === 'material' ? '物资明细' : tab === 'subcontract' ? '分包明细' : '费用明细');
    const columns = getModuleColumns(moduleCode);
    const categories = getModuleCategories(moduleCode);
    const activeCategory = categoryFilter[moduleCode] || 'ALL';
    const categoryOptions = ['ALL', ...categories];

    return (
      <div className="h-[calc(100vh-280px)] flex flex-col">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-neutral-900">{moduleName}</h3>
            <span className={`ui-badge ${canEdit ? 'ui-badge-green' : 'ui-badge-gray'}`}>
              {canEdit ? '可编辑' : '只读'}
            </span>
          </div>
          {categoryOptions.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-600">分类筛选</span>
              <select
                value={activeCategory}
                onChange={(e) => {
                  const value = e.target.value;
                  setCategoryFilter((prev) => ({ ...prev, [moduleCode]: value }));
                }}
                className="ui-select w-44"
              >
                <option value="ALL">全部分类</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <LineItemTable
            versionId={Number(versionId)}
            module={moduleCode}
            items={lineItems}
            onItemsChange={setLineItems}
            onRecalculate={handleRecalculate}
            columns={columns}
            defaultCategory={activeCategory === 'ALL' ? undefined : activeCategory}
          />
        </div>
      </div>
    );
  };

  const renderIndicators = () => (
    <div className="ui-table-container">
      <table className="ui-table">
        <thead>
          <tr>
            <th className="w-48">指标代码</th>
            <th>指标名称</th>
            <th className="w-32 text-right">计算值</th>
            <th>计算表达式</th>
            <th className="w-40">计算时间</th>
            <th className="w-24 text-center">操作</th>
          </tr>
        </thead>
        <tbody>
          {indicators.map((ind) => (
            <tr key={ind.indicatorKey}>
              <td>
                <div className="font-mono text-xs text-neutral-600">{ind.indicatorKey || '-'}</div>
              </td>
              <td>
                <div className="font-medium text-neutral-900">{formatIndicatorLabel(ind.indicatorKey, ind.indicatorName)}</div>
              </td>
              <td className="text-right">
                <span className="font-semibold text-neutral-900">{ind.value ?? '-'}</span>
              </td>
              <td>
                <div className="text-xs text-neutral-500 font-mono">{ind.expression || '-'}</div>
              </td>
              <td className="text-xs text-neutral-500">
                {ind.calcTime ? new Date(ind.calcTime).toLocaleString('zh-CN', {
                  year: 'numeric', month: '2-digit', day: '2-digit',
                  hour: '2-digit', minute: '2-digit'
                }) : '-'}
              </td>
              <td className="text-center">
                <button
                  className="text-sm text-[#1A5CFF] hover:underline transition-colors"
                  onClick={() =>
                    setTraceState({
                      open: true,
                      key: ind.indicatorKey,
                      name: formatIndicatorLabel(ind.indicatorKey, ind.indicatorName),
                    })
                  }
                >
                  追溯
                </button>
              </td>
            </tr>
          ))}
          {indicators.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <Calculator className="w-10 h-10 text-neutral-300" />
                  <span className="text-sm text-neutral-400">暂无指标数据，点击"重算指标"生成</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderWorkflow = () => {
    if (workflowLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-neutral-200 border-t-[#1A5CFF] rounded-full animate-spin" />
            <span className="text-sm text-neutral-500">加载审批流程...</span>
          </div>
        </div>
      );
    }
    const definition = workflowDetail?.definition;
    const nodes = Array.isArray(definition?.nodes) ? definition.nodes : [];
    const currentKey = workflowDetail?.currentNodeKey;
    const currentOrder = nodes.find((n: any) => n.nodeKey === currentKey)?.orderNo;
    return (
      <div className="space-y-5">
        {/* 流程概览卡片 */}
        <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-neutral-900">{definition?.name || '审批流程'}</h3>
              <p className="text-sm text-neutral-600 mt-1">当前节点：{workflowDetail?.currentNodeName || '-'}</p>
            </div>
            <div className={`ui-badge ${workflowDetail?.myPending ? 'ui-badge-amber' : 'ui-badge-gray'}`}>
              {workflowDetail?.myPending ? '我的待办' : '非我待办'}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {nodes.length === 0 ? (
              <div className="text-sm text-neutral-400">未配置流程节点</div>
            ) : nodes.map((node: any, index: number) => {
              const isCurrent = node.nodeKey === currentKey;
              const isDone = currentOrder && node.orderNo < currentOrder;
              const cardCls = isCurrent
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : isDone
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-500';
              return (
                <div key={node.nodeKey || index} className="flex items-center gap-2">
                  <div className={`min-w-[132px] rounded border px-3 py-2 text-xs ${cardCls}`}>
                    <div className="font-medium">{node.nodeName}</div>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" />
                      {isCurrent ? '当前节点' : isDone ? '已完成' : '待处理'}
                    </div>
                  </div>
                  {index < nodes.length - 1 && <span className="text-neutral-300">→</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* 审批任务列表 */}
        <div className="ui-table-container">
          <table className="ui-table">
            <thead>
              <tr>
                <th>任务标题</th>
                <th className="w-32">状态</th>
                <th className="w-32">提交人</th>
                <th className="w-40">创建时间</th>
                <th className="w-40">处理时间</th>
              </tr>
            </thead>
            <tbody>
              {(workflowDetail?.tasks || []).map((task: any) => (
                <tr key={task.id}>
                  <td className="font-medium text-neutral-900">{task.title || '-'}</td>
                  <td>{workflowTaskStatusBadge(task.status)}</td>
                  <td>{task.submitter || '-'}</td>
                  <td className="text-xs text-neutral-500">
                    {task.createdAt ? new Date(task.createdAt).toLocaleString('zh-CN', {
                      year: 'numeric', month: '2-digit', day: '2-digit',
                      hour: '2-digit', minute: '2-digit'
                    }) : '-'}
                  </td>
                  <td className="text-xs text-neutral-500">
                    {task.processedAt ? new Date(task.processedAt).toLocaleString('zh-CN', {
                      year: 'numeric', month: '2-digit', day: '2-digit',
                      hour: '2-digit', minute: '2-digit'
                    }) : '-'}
                  </td>
                </tr>
              ))}
              {(workflowDetail?.tasks || []).length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Send className="w-10 h-10 text-neutral-300" />
                      <span className="text-sm text-neutral-400">暂无审批任务</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderImportExport = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-neutral-900 mb-1">导入导出管理</h3>
          <p className="text-sm text-neutral-600">支持 Excel 模板导入与导出文件管理</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="ui-btn ui-btn-primary gap-1.5"
            onClick={() => setShowImport(true)}
            disabled={!canEdit}
          >
            <FileUp size={16} /> Excel导入
          </button>
          <button
            className="ui-btn ui-btn-default gap-1.5"
            onClick={() => versionId && navigate(`/versions/${versionId}/files`)}
          >
            <FileBox size={16} /> 文件中心
          </button>
        </div>
      </div>

      <div className="ui-table-container">
        <table className="ui-table">
          <thead>
            <tr>
              <th>文件名称</th>
              <th className="w-40">文件类型</th>
              <th className="w-28 text-right">文件大小</th>
              <th className="w-40">生成时间</th>
              <th className="w-24 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {exportFiles.map((file) => (
              <tr key={file.id}>
                <td className="font-medium text-neutral-900">{file.fileName}</td>
                <td>{fileTypeBadge(file.fileType)}</td>
                <td className="text-xs text-neutral-500 text-right">{formatSize(file.fileSize)}</td>
                <td className="text-xs text-neutral-500">
                  {file.createdAt ? new Date(file.createdAt).toLocaleString('zh-CN', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                  }) : '-'}
                </td>
                <td className="text-right">
                  <button
                    className="text-sm text-[#1A5CFF] hover:underline transition-colors"
                    onClick={() => handleDownloadFile(file.id)}
                  >
                    下载
                  </button>
                </td>
              </tr>
            ))}
            {exportFiles.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <FileDown className="w-10 h-10 text-neutral-300" />
                    <span className="text-sm text-neutral-400">暂无导出文件</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReports = () => {
    const layouts = Array.isArray(templateSchema?.export_layout) ? templateSchema.export_layout : [];
    const defaultReports = [
      { name: '预算表', description: '对应预算汇总输出' },
      { name: '概算表', description: '对应概算汇总输出' },
      { name: '价差汇总表', description: '对应主材价差汇总输出' },
    ];
    const rows = layouts.length > 0
      ? layouts.map((layout: any) => ({
          name: layout.title || layout.name || layout.sheet || '未命名报表',
          sheet: layout.sheet || '-',
          description: layout.description || layout.note || '-',
          columns: Array.isArray(layout.columns)
            ? layout.columns.map((col: any) => col.label || col.name || col.field || '').filter(Boolean).join(' / ')
            : '-',
        }))
      : defaultReports.map((item) => ({
          name: item.name,
          sheet: '-',
          description: item.description,
          columns: '-'
        }));

    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 mb-1">报表结构配置</h3>
            <p className="text-sm text-neutral-600">报表结构由模板定义驱动，导出时按模板布局生成 Excel/PDF</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="ui-btn ui-btn-default gap-1.5" onClick={handleExportExcel} disabled={working}>
              <FileDown size={16} /> 导出Excel
            </button>
            <button className="ui-btn ui-btn-default gap-1.5" onClick={handleExportPdf} disabled={working}>
              <Download size={16} /> 导出PDF
            </button>
          </div>
        </div>

        <div className="ui-table-container">
          <table className="ui-table">
            <thead>
              <tr>
                <th className="min-w-[180px]">报表名称</th>
                <th className="w-40">Sheet</th>
                <th>说明</th>
                <th className="min-w-[240px]">字段结构</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name}>
                  <td className="font-medium text-neutral-900">{row.name}</td>
                  <td className="text-xs text-neutral-500">{row.sheet}</td>
                  <td className="text-neutral-600">{row.description}</td>
                  <td className="text-xs text-neutral-500">{row.columns}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <FileCheck className="w-10 h-10 text-neutral-300" />
                      <span className="text-sm text-neutral-400">未配置报表布局</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSeal = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-neutral-900 mb-1">签章管理</h3>
          <p className="text-sm text-neutral-600">已签发版本可执行盖章并沉淀签章记录</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="ui-btn ui-btn-default gap-1.5"
            onClick={() => versionId && navigate(`/versions/${versionId}/files`)}
          >
            <FileBox size={16} /> 文件中心
          </button>
        </div>
      </div>

      <div className="ui-table-container">
        <table className="ui-table">
          <thead>
            <tr>
              <th>文件名称</th>
              <th className="w-32">盖章人</th>
              <th className="w-40">盖章时间</th>
              <th className="w-40">文件类型</th>
              <th className="w-24 text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {sealRecords.map((record) => (
              <tr key={record.id}>
                <td className="font-medium text-neutral-900">{record.fileName || '已盖章文件'}</td>
                <td>{record.sealedBy || '-'}</td>
                <td className="text-xs text-neutral-500">
                  {record.sealedAt ? new Date(record.sealedAt).toLocaleString('zh-CN', {
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit'
                  }) : '-'}
                </td>
                <td>{fileTypeBadge(record.fileType || 'SEALED_PDF')}</td>
                <td className="text-right">
                  <button
                    className="text-sm text-[#1A5CFF] hover:underline transition-colors"
                    onClick={() => handleDownloadFile(record.pdfFileId)}
                  >
                    下载
                  </button>
                </td>
              </tr>
            ))}
            {sealRecords.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Stamp className="w-10 h-10 text-neutral-300" />
                    <span className="text-sm text-neutral-400">暂无签章记录</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAudit = () => {
    if (!version?.projectId) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-2">
            <Lock className="w-10 h-10 text-neutral-300" />
            <span className="text-sm text-neutral-400">未获取到项目上下文，无法加载审计日志</span>
          </div>
        </div>
      );
    }
    return <AuditLogPanel projectId={String(version.projectId)} versionId={versionId} />;
  };

  const renderContent = () => {
    if (isModuleTab(activeTab)) {
      return renderModule(activeTab);
    }
    if (activeTab === 'indicators') {
      return renderIndicators();
    }
    if (activeTab === 'workflow') {
      return renderWorkflow();
    }
    if (activeTab === 'reports') {
      return renderReports();
    }
    if (activeTab === 'import-export') {
      return renderImportExport();
    }
    if (activeTab === 'seal') {
      return renderSeal();
    }
    if (activeTab === 'audit') {
      return renderAudit();
    }
    return <div className="flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-2">
        <FileBox className="w-10 h-10 text-neutral-300" />
        <span className="text-sm text-neutral-400">该模块正在开发中...</span>
      </div>
    </div>;
  };

  const title = useMemo(() => {
    if (!version) return '版本工作台';
    return `版本工作台 V${version.versionNo}`;
  }, [version]);

  return (
    <Layout title={title} subtitle={`状态: ${formatStatusLabel(String(version?.status || '').toUpperCase())}`}>
      {/* 状态横幅 */}
      {renderStatusBanner()}

      {/* 顶部操作栏 */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-soft p-4 mb-4">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          {/* Tab 导航 */}
          <div className="flex gap-1.5 flex-wrap items-center">
            {PRIMARY_TABS.map((id) => {
              const tab = WORKBENCH_TABS.find((item) => item.id === id);
              if (!tab) return null;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSearchParams({ tab: tab.id })}
                  className={`
                    px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                    ${activeTab === tab.id
                      ? 'bg-[#1A5CFF] text-white'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'}
                  `}
                >
                  {tab.label}
                </button>
              );
            })}

            <div className="relative">
              <button
                className={`px-3 py-2 text-sm font-medium rounded-lg inline-flex items-center gap-1 ${
                  SECONDARY_TABS.includes(activeTab) ? 'bg-[#1A5CFF] text-white' : 'text-neutral-600 hover:bg-neutral-50'
                }`}
                onClick={() => setShowMoreTabs((prev) => !prev)}
              >
                更多
                <ChevronDown size={14} />
              </button>
              {showMoreTabs && (
                <div className="absolute left-0 top-10 z-20 min-w-[160px] border border-neutral-200 bg-white shadow-lg rounded-lg p-1">
                  {SECONDARY_TABS.map((id) => {
                    const tab = WORKBENCH_TABS.find((item) => item.id === id);
                    if (!tab) return null;
                    return (
                      <button
                        key={tab.id}
                        className={`w-full text-left px-3 py-2 text-sm rounded ${
                          activeTab === tab.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-neutral-600 hover:bg-neutral-50'
                        }`}
                        onClick={() => {
                          setSearchParams({ tab: tab.id });
                          setShowMoreTabs(false);
                        }}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          {renderActions()}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-soft p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-neutral-200 border-t-[#1A5CFF] rounded-full animate-spin" />
              <span className="text-sm text-neutral-500">加载中...</span>
            </div>
          </div>
        ) : (
          renderContent()
        )}
      </div>

      <TraceDrawer
        open={traceState.open}
        versionId={Number(versionId)}
        indicatorKey={traceState.key}
        indicatorName={traceState.name}
        onClose={() => setTraceState({ open: false, key: '', name: '' })}
      />

      {showImport && versionId && (
        <ExcelImport
          versionId={Number(versionId)}
          onSuccess={loadAll}
          onClose={() => setShowImport(false)}
        />
      )}
    </Layout>
  );
};

export default Workbench;
