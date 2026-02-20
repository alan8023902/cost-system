import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { templateApi } from '../services/apiService';
import {
  Ban,
  CheckCircle2,
  Code,
  Eye,
  FileSpreadsheet,
  Pencil,
  Plus,
  RefreshCcw,
  Table2,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import { useToast } from '../components/ToastProvider';

const TEMPLATE_STATUSES = [
  { value: '', label: '全部状态' },
  { value: 'DRAFT', label: '草稿' },
  { value: 'PUBLISHED', label: '已发布' },
  { value: 'DISABLED', label: '已禁用' },
];

const DEFAULT_TEMPLATE_NAME = '线路工程-成本计划单模板';
const DEFAULT_TEMPLATE_VERSION = '2026.02';

const DEFAULT_LINE_TEMPLATE_SCHEMA = {
  modules: [
    {
      module_code: 'MATERIAL',
      module_name: '物资明细',
      allow_add_row: true,
      allow_delete_row: true,
      allow_import: true,
      allow_export: true,
      categories: ['EQUIP', 'INSTALL', 'CIVIL'],
      columns: [
        { field: 'name', label: '物资名称', type: 'string', editable: true, required: true, visible: true, width: 220 },
        { field: 'spec', label: '规格型号', type: 'string', editable: true, visible: true, width: 160 },
        { field: 'unit', label: '单位', type: 'string', editable: true, required: true, visible: true, width: 90 },
        { field: 'qty', label: '数量', type: 'number', editable: true, required: true, precision: 4, default: 0 },
        { field: 'price_tax', label: '含税单价', type: 'number', editable: true, required: true, precision: 6, default: 0 },
        { field: 'amount_tax', label: '含税合价', type: 'number', editable: false, precision: 2, default: 0 },
        { field: 'remark', label: '备注', type: 'string', editable: true, visible: true, width: 180 },
      ],
    },
    {
      module_code: 'SUBCONTRACT',
      module_name: '分包费用明细',
      allow_add_row: true,
      allow_delete_row: true,
      allow_import: true,
      allow_export: true,
      categories: ['FOUNDATION', 'TOWER', 'LINE'],
      columns: [
        { field: 'name', label: '费用名称', type: 'string', editable: true, required: true, visible: true, width: 220 },
        { field: 'basis', label: '计算依据', type: 'string', editable: true, visible: true, width: 220 },
        { field: 'qty', label: '工程量', type: 'number', editable: true, precision: 4, default: 0 },
        { field: 'price_tax', label: '单价', type: 'number', editable: true, precision: 6, default: 0 },
        { field: 'amount_tax', label: '合价', type: 'number', editable: false, precision: 2, default: 0 },
        { field: 'remark', label: '备注', type: 'string', editable: true, visible: true, width: 180 },
      ],
    },
    {
      module_code: 'EXPENSE',
      module_name: '其他费用明细',
      allow_add_row: true,
      allow_delete_row: true,
      allow_import: true,
      allow_export: true,
      categories: ['MACHINERY', 'CROSSING', 'OTHER'],
      columns: [
        { field: 'name', label: '费用名称', type: 'string', editable: true, required: true, visible: true, width: 220 },
        { field: 'basis', label: '取费依据', type: 'string', editable: true, visible: true, width: 220 },
        { field: 'qty', label: '数量', type: 'number', editable: true, precision: 4, default: 0 },
        { field: 'price_tax', label: '单价', type: 'number', editable: true, precision: 6, default: 0 },
        { field: 'amount_tax', label: '金额', type: 'number', editable: false, precision: 2, default: 0 },
        { field: 'remark', label: '备注', type: 'string', editable: true, visible: true, width: 180 },
      ],
    },
  ],
  validations: [
    { field: 'qty', rule: 'min', value: 0, message: '数量不能为负数' },
    { field: 'price_tax', rule: 'min', value: 0, message: '单价不能为负数' },
  ],
  export_layout: [
    {
      title: '计划单',
      sheet: '计划单',
      description: '工程核算成本控制指标汇总',
      columns: [
        { field: 'name', label: '费用名称' },
        { field: 'basis', label: '费用计算依据' },
        { field: 'amount_tax', label: '预控费用金额' },
        { field: 'remark', label: '备注' },
      ],
    },
    {
      title: '概算汇总',
      sheet: '架空输电线路安装工程汇总概算表',
      description: '汇总概算输出',
      columns: [
        { field: 'name', label: '工程或费用名称' },
        { field: 'basis', label: '取费基数' },
        { field: 'amount_tax', label: '金额' },
      ],
    },
    {
      title: '单位工程预算',
      sheet: '架空输电线路单位工程预算表',
      description: '单位工程预算输出',
      columns: [
        { field: 'name', label: '项目名称及规格' },
        { field: 'unit', label: '单位' },
        { field: 'qty', label: '数量' },
        { field: 'price_tax', label: '单价' },
        { field: 'amount_tax', label: '合价' },
      ],
    },
    {
      title: '主材价差汇总',
      sheet: '架空输电线路工程乙供主材价差汇总表',
      description: '主材价差输出',
      columns: [
        { field: 'name', label: '材料名称' },
        { field: 'unit', label: '单位' },
        { field: 'qty', label: '数量' },
        { field: 'price_tax', label: '含税单价' },
        { field: 'amount_tax', label: '含税金额' },
      ],
    },
  ],
  indicator_layout: [
    { key: 'TOTAL_MATERIAL', label: '物资费用合计', group: '核心指标' },
    { key: 'TOTAL_SUBCONTRACT', label: '分包费用合计', group: '核心指标' },
    { key: 'TOTAL_EXPENSE', label: '其他费用合计', group: '核心指标' },
    { key: 'TOTAL_COST', label: '总成本', group: '核心指标' },
  ],
};

const DEFAULT_SCHEMA_JSON = JSON.stringify(DEFAULT_LINE_TEMPLATE_SCHEMA, null, 2);

type TemplateInfo = {
  id: number;
  name: string;
  templateVersion: string;
  status: string;
  schemaJson: string;
  createdAt?: string;
  updatedAt?: string;
};

type ModalMode = 'create' | 'edit' | 'view';
type SchemaViewMode = 'json' | 'visual';

const TemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [keyword, setKeyword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>('create');
  const [schemaViewMode, setSchemaViewMode] = useState<SchemaViewMode>('json');
  const [saving, setSaving] = useState(false);
  const [creatingDefault, setCreatingDefault] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    id: 0,
    name: '',
    templateVersion: '',
    schemaJson: DEFAULT_SCHEMA_JSON,
  });
  const toast = useToast();

  const loadTemplates = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await templateApi.list(statusFilter || undefined);
      setTemplates(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || '加载模板失败');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [statusFilter]);

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string; icon?: React.ReactNode }> = {
      DRAFT: { label: '草稿', cls: 'ui-badge-gray' },
      PUBLISHED: { label: '已发布', cls: 'ui-badge-green', icon: <CheckCircle2 size={12} className="mr-1" /> },
      DISABLED: { label: '已禁用', cls: 'ui-badge-red', icon: <XCircle size={12} className="mr-1" /> },
    };
    const conf = map[String(status || '').toUpperCase()] || { label: status || '-', cls: 'ui-badge-gray' };
    return (
      <span className={`ui-badge ${conf.cls} inline-flex items-center`}>
        {conf.icon}
        {conf.label}
      </span>
    );
  };

  const filteredTemplates = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    if (!key) return templates;
    return templates.filter((item) => {
      const content = `${item.name || ''} ${item.templateVersion || ''} ${item.status || ''}`.toLowerCase();
      return content.includes(key);
    });
  }, [templates, keyword]);

  const parsedSchema = useMemo(() => {
    try {
      return { value: JSON.parse(form.schemaJson || '{}'), error: '' };
    } catch (e: any) {
      return { value: null, error: e?.message || '解析失败' };
    }
  }, [form.schemaJson]);

  const openModal = (mode: ModalMode, tpl?: TemplateInfo) => {
    setModalMode(mode);
    setSchemaViewMode(mode === 'view' ? 'visual' : 'json');
    setError('');
    if (tpl) {
      setForm({
        id: tpl.id,
        name: tpl.name || '',
        templateVersion: tpl.templateVersion || '',
        schemaJson: tpl.schemaJson || DEFAULT_SCHEMA_JSON,
      });
    } else {
      setForm({
        id: 0,
        name: '',
        templateVersion: '',
        schemaJson: DEFAULT_SCHEMA_JSON,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
  };

  const validateSchemaJson = (value: string) => {
    try {
      JSON.parse(value);
      return '';
    } catch (e: any) {
      return `模板定义不是合法JSON：${e?.message || '解析失败'}`;
    }
  };

  const handleFormatJson = () => {
    const errorMsg = validateSchemaJson(form.schemaJson);
    if (errorMsg) {
      setError(errorMsg);
      return;
    }
    const formatted = JSON.stringify(JSON.parse(form.schemaJson), null, 2);
    setForm((prev) => ({ ...prev, schemaJson: formatted }));
  };

  const handleLoadDefaultSchema = () => {
    setForm((prev) => ({
      ...prev,
      name: prev.name || DEFAULT_TEMPLATE_NAME,
      templateVersion: prev.templateVersion || DEFAULT_TEMPLATE_VERSION,
      schemaJson: DEFAULT_SCHEMA_JSON,
    }));
    setSchemaViewMode('visual');
  };

  const handleCreateDefaultTemplate = async () => {
    const exists = templates.some(
      (item) => item.name === DEFAULT_TEMPLATE_NAME && item.templateVersion === DEFAULT_TEMPLATE_VERSION
    );
    if (exists) {
      toast.info('默认模板已存在，可直接查看或编辑');
      return;
    }

    setCreatingDefault(true);
    setError('');
    try {
      await templateApi.create({
        name: DEFAULT_TEMPLATE_NAME,
        templateVersion: DEFAULT_TEMPLATE_VERSION,
        schemaJson: DEFAULT_SCHEMA_JSON,
      });
      await loadTemplates();
      toast.success('默认模板已创建');
    } catch (e: any) {
      setError(e?.message || '创建默认模板失败');
      toast.error(e?.message || '创建默认模板失败');
    } finally {
      setCreatingDefault(false);
    }
  };

  const handleSave = async () => {
    const errorMsg = validateSchemaJson(form.schemaJson);
    if (errorMsg) {
      setError(errorMsg);
      return;
    }
    if (!form.name.trim()) {
      setError('模板名称不能为空');
      return;
    }
    if (!form.templateVersion.trim()) {
      setError('模板版本不能为空');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (modalMode === 'create') {
        await templateApi.create({
          name: form.name.trim(),
          templateVersion: form.templateVersion.trim(),
          schemaJson: form.schemaJson.trim(),
        });
      } else if (modalMode === 'edit') {
        await templateApi.update(form.id, {
          name: form.name.trim(),
          templateVersion: form.templateVersion.trim(),
          schemaJson: form.schemaJson.trim(),
        });
      }
      await loadTemplates();
      setShowModal(false);
      toast.success(modalMode === 'create' ? '模板已创建' : '模板已更新');
    } catch (e: any) {
      setError(e?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (tpl: TemplateInfo) => {
    if (!confirm(`确认发布模板 ${tpl.name} ? 发布将禁用其他已发布模板。`)) return;
    try {
      await templateApi.publish(tpl.id);
      await loadTemplates();
      toast.success('模板已发布');
    } catch (e: any) {
      toast.error(e?.message || '发布失败');
    }
  };

  const handleDisable = async (tpl: TemplateInfo) => {
    if (!confirm(`确认禁用模板 ${tpl.name} ?`)) return;
    try {
      await templateApi.disable(tpl.id);
      await loadTemplates();
      toast.success('模板已禁用');
    } catch (e: any) {
      toast.error(e?.message || '禁用失败');
    }
  };

  const renderSchemaPreview = () => {
    if (parsedSchema.error) {
      return <div className="ui-alert-warning">JSON解析失败：{parsedSchema.error}</div>;
    }

    const schema = parsedSchema.value || {};
    const modules = Array.isArray(schema.modules) ? schema.modules : [];
    const exportLayout = Array.isArray(schema.export_layout) ? schema.export_layout : [];
    const validations = Array.isArray(schema.validations) ? schema.validations : [];
    const indicators = Array.isArray(schema.indicator_layout) ? schema.indicator_layout : [];

    return (
      <div className="space-y-4 text-xs">
        <section className="border border-slate-200 bg-white p-3">
          <div className="mb-2 font-semibold text-slate-800">来源说明</div>
          <div className="text-slate-600">
            默认结构参考 `docs/线路工程-成本计划单.xlsx`，覆盖计划单、物资表、概算表、预算表和主材价差汇总表。
          </div>
        </section>

        <section className="border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center gap-2 font-semibold text-slate-800">
            <Table2 size={14} className="text-slate-500" />
            模块结构（{modules.length}）
          </div>
          {modules.length === 0 ? (
            <div className="py-4 text-center text-slate-400">暂无模块定义</div>
          ) : (
            <div className="space-y-3">
              {modules.map((module: any, moduleIndex: number) => {
                const columns = Array.isArray(module?.columns) ? module.columns : [];
                return (
                  <div key={`${module?.module_code || 'module'}-${moduleIndex}`} className="border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-800">{module?.module_name || `模块${moduleIndex + 1}`}</span>
                      <span className="ui-badge ui-badge-gray">{module?.module_code || '-'}</span>
                      {Array.isArray(module?.categories) && module.categories.length > 0 && (
                        <span className="text-slate-500">分类：{module.categories.join(' / ')}</span>
                      )}
                    </div>
                    <div className="overflow-auto border border-slate-200 bg-white">
                      <table className="ui-table min-w-[680px]">
                        <thead>
                          <tr>
                            <th>字段</th>
                            <th>显示名</th>
                            <th>类型</th>
                            <th>可编辑</th>
                            <th>必填</th>
                            <th>精度</th>
                          </tr>
                        </thead>
                        <tbody>
                          {columns.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-5 text-center text-slate-400">暂无字段</td>
                            </tr>
                          ) : columns.map((column: any, columnIndex: number) => (
                            <tr key={`${column?.field || 'field'}-${columnIndex}`}>
                              <td>{column?.field || '-'}</td>
                              <td>{column?.label || '-'}</td>
                              <td>{column?.type || '-'}</td>
                              <td>{column?.editable ? '是' : '否'}</td>
                              <td>{column?.required ? '是' : '否'}</td>
                              <td>{column?.precision ?? '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="border border-slate-200 bg-white p-3">
          <div className="mb-2 font-semibold text-slate-800">导出布局（{exportLayout.length}）</div>
          <div className="overflow-auto border border-slate-200">
            <table className="ui-table min-w-[720px]">
              <thead>
                <tr>
                  <th>标题</th>
                  <th>Sheet</th>
                  <th>描述</th>
                  <th className="text-right">字段数</th>
                </tr>
              </thead>
              <tbody>
                {exportLayout.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-5 text-center text-slate-400">暂无导出布局</td>
                  </tr>
                ) : exportLayout.map((item: any, index: number) => (
                  <tr key={`${item?.title || 'layout'}-${index}`}>
                    <td>{item?.title || '-'}</td>
                    <td>{item?.sheet || '-'}</td>
                    <td>{item?.description || '-'}</td>
                    <td className="text-right">{Array.isArray(item?.columns) ? item.columns.length : 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="border border-slate-200 bg-white p-3">
            <div className="mb-2 font-semibold text-slate-800">校验规则（{validations.length}）</div>
            <div className="space-y-2">
              {validations.length === 0 ? (
                <div className="text-slate-400">暂无校验规则</div>
              ) : validations.map((item: any, index: number) => (
                <div key={`validation-${index}`} className="border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="font-medium text-slate-700">{item?.field || '-'} / {item?.rule || '-'}</div>
                  <div className="text-slate-500">{item?.message || '-'}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="border border-slate-200 bg-white p-3">
            <div className="mb-2 font-semibold text-slate-800">指标布局（{indicators.length}）</div>
            <div className="space-y-2">
              {indicators.length === 0 ? (
                <div className="text-slate-400">暂无指标布局</div>
              ) : indicators.map((item: any, index: number) => (
                <div key={`indicator-${index}`} className="border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="font-medium text-slate-700">{item?.label || item?.key || `指标${index + 1}`}</div>
                  <div className="text-slate-500">KEY: {item?.key || '-'}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  };

  return (
    <Layout title="模板管理" subtitle="模板定义、发布与禁用管理">
      <div className="space-y-4">
        <div className="ui-alert-info text-xs">
          已内置“线路工程-成本计划单”默认模板，可一键创建；模板结构提供 JSON 编辑 + 可视化表格预览。
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="ui-select w-40"
            >
              {TEMPLATE_STATUSES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索模板名称/版本/状态"
              className="ui-input w-64"
            />
            <button className="ui-btn ui-btn-default gap-1" onClick={loadTemplates}>
              <RefreshCcw size={14} /> 刷新
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              className="ui-btn ui-btn-default gap-1"
              onClick={handleCreateDefaultTemplate}
              disabled={creatingDefault}
            >
              <FileSpreadsheet size={14} /> {creatingDefault ? '创建中...' : '一键创建默认模板'}
            </button>
            <button className="ui-btn ui-btn-primary gap-1" onClick={() => openModal('create')}>
              <Plus size={14} /> 新建模板
            </button>
          </div>
        </div>

        {error && (
          <div className="ui-alert-error">{error}</div>
        )}

        <div className="ui-table-container">
          <table className="ui-table">
            <thead>
              <tr>
                <th className="min-w-[180px]">模板名称</th>
                <th className="w-32">版本</th>
                <th className="w-28">状态</th>
                <th className="w-48">更新时间</th>
                <th className="w-48 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-10 text-center text-slate-400">加载中...</td></tr>
              ) : filteredTemplates.map((tpl) => (
                <tr key={tpl.id} className="hover:bg-slate-50">
                  <td className="font-medium text-slate-900">{tpl.name}</td>
                  <td>{tpl.templateVersion || '-'}</td>
                  <td>{statusBadge(tpl.status)}</td>
                  <td className="text-xs text-slate-500">{tpl.updatedAt ? new Date(tpl.updatedAt).toLocaleString() : '-'}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="ui-btn ui-btn-sm ui-btn-default gap-1"
                        onClick={() => openModal('view', tpl)}
                      >
                        <Eye size={12} /> 查看
                      </button>
                      <button
                        className="ui-btn ui-btn-sm ui-btn-default gap-1"
                        onClick={() => openModal('edit', tpl)}
                        disabled={tpl.status === 'PUBLISHED'}
                      >
                        <Pencil size={12} /> 编辑
                      </button>
                      <button
                        className="ui-btn ui-btn-sm ui-btn-primary gap-1"
                        onClick={() => handlePublish(tpl)}
                        disabled={tpl.status === 'DISABLED'}
                      >
                        <UploadCloud size={12} /> 发布
                      </button>
                      <button
                        className="ui-btn ui-btn-sm ui-btn-danger gap-1"
                        onClick={() => handleDisable(tpl)}
                        disabled={tpl.status === 'DISABLED'}
                      >
                        <Ban size={12} /> 禁用
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredTemplates.length === 0 && (
                <tr><td colSpan={5} className="py-10 text-center text-slate-400">暂无模板数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-5xl rounded border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900">
                {modalMode === 'create' ? '新建模板' : modalMode === 'edit' ? '编辑模板' : '查看模板'}
              </h3>
              <button onClick={closeModal} className="ui-btn-icon">×</button>
            </div>

            <div className="space-y-4 p-5 text-sm">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-slate-600">模板名称</label>
                  <input
                    className="ui-input"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    disabled={modalMode === 'view'}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-slate-600">模板版本</label>
                  <input
                    className="ui-input"
                    value={form.templateVersion}
                    onChange={(e) => setForm((prev) => ({ ...prev, templateVersion: e.target.value }))}
                    disabled={modalMode === 'view'}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    className="ui-btn ui-btn-default gap-1"
                    onClick={handleFormatJson}
                    disabled={modalMode === 'view'}
                  >
                    <Code size={14} /> 格式化JSON
                  </button>
                  <button
                    className="ui-btn ui-btn-default gap-1"
                    onClick={handleLoadDefaultSchema}
                    disabled={modalMode === 'view'}
                  >
                    <FileSpreadsheet size={14} /> 载入默认模板
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-slate-600">模板定义（schema_json）</label>
                  <div className="flex items-center gap-2">
                    <button
                      className={`ui-btn ui-btn-sm ${schemaViewMode === 'json' ? 'ui-btn-primary' : 'ui-btn-default'}`}
                      onClick={() => setSchemaViewMode('json')}
                    >
                      JSON编辑
                    </button>
                    <button
                      className={`ui-btn ui-btn-sm ${schemaViewMode === 'visual' ? 'ui-btn-primary' : 'ui-btn-default'}`}
                      onClick={() => setSchemaViewMode('visual')}
                    >
                      可视化预览
                    </button>
                  </div>
                </div>

                {schemaViewMode === 'json' ? (
                  <textarea
                    className="ui-input h-[420px] font-mono text-xs"
                    value={form.schemaJson}
                    onChange={(e) => setForm((prev) => ({ ...prev, schemaJson: e.target.value }))}
                    disabled={modalMode === 'view'}
                  />
                ) : (
                  <div className="max-h-[420px] overflow-auto border border-slate-200 bg-slate-50 p-3">
                    {renderSchemaPreview()}
                  </div>
                )}

                <div className="text-xs text-slate-400">
                  提示：模板定义需符合 `Template-Schema-Spec.md` 规范；已发布模板不可直接修改。
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button className="ui-btn ui-btn-default" onClick={closeModal}>关闭</button>
              {modalMode !== 'view' && (
                <button className="ui-btn ui-btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? '保存中...' : '保存'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default TemplateManager;
