import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import { formatRoleLabel } from '../constants';
import { projectApi, workflowApi } from '../services/apiService';
import { Plus, Save, RefreshCcw, Trash2 } from 'lucide-react';
import { useToast } from '../components/ToastProvider';



type WorkflowNode = {
  nodeKey?: string;
  nodeName?: string;
  roleCode?: string;
  taskType?: string;
  orderNo?: number;
  formFields?: WorkflowFormField[];
};

type WorkflowFormField = {
  fieldKey?: string;
  fieldLabel?: string;
  fieldType?: string;
  required?: boolean;
  editable?: boolean;
  placeholder?: string;
  defaultValue?: string;
  options?: string[];
};

const DEFAULT_ROLE_OPTIONS = ['PROJECT_ADMIN', 'APPROVER', 'EDITOR', 'VIEWER', 'SEAL_ADMIN'];

const TASK_TYPE_OPTIONS = [
  { value: 'APPROVE', label: '审批' },
  { value: 'REVIEW', label: '复核' },
  { value: 'SIGN', label: '签章' },
];

const FIELD_TYPE_OPTIONS = [
  { value: 'TEXT', label: '单行文本' },
  { value: 'TEXTAREA', label: '多行文本' },
  { value: 'SELECT', label: '下拉选择' },
  { value: 'NUMBER', label: '数字' },
  { value: 'DATE', label: '日期' },
  { value: 'READONLY', label: '只读展示' },
];

const buildFormField = (index: number): WorkflowFormField => ({
  fieldKey: `field_${index}`,
  fieldLabel: `字段${index}`,
  fieldType: 'TEXT',
  required: false,
  editable: true,
  placeholder: '',
  defaultValue: '',
  options: [],
});

const buildNode = (index: number): WorkflowNode => ({
  nodeKey: `node_${index}`,
  nodeName: `节点${index}`,
  roleCode: 'APPROVER',
  taskType: 'APPROVE',
  orderNo: index,
  formFields: [],
});


const WorkflowSettings: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [definitionName, setDefinitionName] = useState('');
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [roleOptions, setRoleOptions] = useState<string[]>(DEFAULT_ROLE_OPTIONS);
  const [projectRoleOptions, setProjectRoleOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [scope, setScope] = useState<'SYSTEM' | 'PROJECT' | ''>('');


  const loadProjects = async () => {
    const list = (await projectApi.list()) as any;
    const projectArray = Array.isArray(list) ? list : list?.content || [];
    setProjects(projectArray || []);
    if (projectArray && projectArray.length > 0) {
      setSelectedProjectId(String(projectArray[0].id));
    }
  };

  const loadMembers = async (projectId: string) => {
    if (!projectId) {
      setRoleOptions(DEFAULT_ROLE_OPTIONS);
      return;
    }
    try {
      const members = (await projectApi.getMembers(projectId)) as any[];
      const roleList = Array.isArray(members)
        ? members.map((item) => item?.projectRole).filter(Boolean)
        : [];
      const uniqueRoles = Array.from(new Set(roleList));
      const mergedRoles = Array.from(new Set([...uniqueRoles, ...DEFAULT_ROLE_OPTIONS]));
      setProjectRoleOptions(uniqueRoles);
      setRoleOptions(mergedRoles.length > 0 ? mergedRoles : DEFAULT_ROLE_OPTIONS);
    } catch (e) {
      setProjectRoleOptions([]);
      setRoleOptions(DEFAULT_ROLE_OPTIONS);
    }
  };


  const loadDefinition = async (projectId: string) => {

    if (!projectId) return;
    setLoading(true);
    setError('');
    try {
      const definition = await workflowApi.getActiveDefinition(projectId);
      setScope(definition?.scope || 'SYSTEM');
      setDefinitionName(definition?.name || '成本计划审批');
      const incoming = Array.isArray(definition?.nodes) ? definition.nodes : [];
      const normalized = incoming.length > 0 ? incoming : [buildNode(1)];
      setNodes(
        normalized.map((node: WorkflowNode, idx: number) => ({
          ...buildNode(idx + 1),
          ...node,
          orderNo: node.orderNo ?? idx + 1,
          formFields: normalizeFormFields(node.formFields),
        }))
      );
    } catch (e: any) {
      setError(e?.message || '加载流程定义失败');
      setDefinitionName('成本计划审批');
      setNodes([buildNode(1)]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadMembers(selectedProjectId);
      loadDefinition(selectedProjectId);
    }
  }, [selectedProjectId]);


  const sortedNodes = useMemo(() => {
    return [...nodes].sort((a, b) => (a.orderNo ?? 0) - (b.orderNo ?? 0));
  }, [nodes]);

  const updateNode = (index: number, patch: Partial<WorkflowNode>) => {
    setNodes((prev) => prev.map((node, idx) => (idx === index ? { ...node, ...patch } : node)));
  };

  const handleAddNode = () => {
    setNodes((prev) => [...prev, buildNode(prev.length + 1)]);
  };

  const handleRemoveNode = (index: number) => {
    setNodes((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateNodeFields = (nodeIndex: number, updater: (fields: WorkflowFormField[]) => WorkflowFormField[]) => {
    setNodes((prev) =>
      prev.map((node, idx) => {
        if (idx !== nodeIndex) return node;
        const nextFields = updater(normalizeFormFields(node.formFields));
        return { ...node, formFields: nextFields };
      })
    );
  };

  const updateField = (nodeIndex: number, fieldIndex: number, patch: Partial<WorkflowFormField>) => {
    updateNodeFields(nodeIndex, (fields) =>
      fields.map((field, idx) => (idx === fieldIndex ? { ...field, ...patch } : field))
    );
  };

  const addField = (nodeIndex: number) => {
    updateNodeFields(nodeIndex, (fields) => [...fields, buildFormField(fields.length + 1)]);
  };

  const removeField = (nodeIndex: number, fieldIndex: number) => {
    updateNodeFields(nodeIndex, (fields) => fields.filter((_, idx) => idx !== fieldIndex));
  };

  const handleSave = async () => {
    if (!selectedProjectId) {
      setError('请选择项目');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payloadNodes = nodes.map((node, idx) => ({
        nodeKey: node.nodeKey || `node_${idx + 1}`,
        nodeName: node.nodeName || `节点${idx + 1}`,
        roleCode: node.roleCode || 'APPROVER',
        taskType: node.taskType || 'APPROVE',
        orderNo: node.orderNo ?? idx + 1,
        formFields: normalizeFormFields(node.formFields).map((field, fieldIndex) => ({
          fieldKey: field.fieldKey || `field_${fieldIndex + 1}`,
          fieldLabel: field.fieldLabel || `字段${fieldIndex + 1}`,
          fieldType: (field.fieldType || 'TEXT').toUpperCase(),
          required: Boolean(field.required),
          editable: field.editable !== false,
          placeholder: field.placeholder || '',
          defaultValue: field.defaultValue || '',
          options: normalizeOptions(field.options),
        })),
      }));
      await workflowApi.saveProjectDefinition(selectedProjectId, {
        name: definitionName || '成本计划审批',
        nodes: payloadNodes,
      });
      setScope('PROJECT');
      await loadDefinition(selectedProjectId);
      toast.success('项目流程保存成功');
    } catch (e: any) {
      setError(e?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };


  return (
    <Layout title="审批流配置" subtitle="项目级审批流模板维护">
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="ui-input w-64"
          >
            <option value="">选择项目</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || p.projectName || `项目${p.id}`}
              </option>
            ))}
          </select>
          <input
            value={definitionName}
            onChange={(e) => setDefinitionName(e.target.value)}
            placeholder="流程名称"
            className="ui-input w-64"
          />
          <div className="text-xs text-slate-500">当前生效范围：{scope || '-'}</div>
          <button className="ui-btn ui-btn-default gap-1" onClick={() => loadDefinition(selectedProjectId)}>
            <RefreshCcw size={14} /> 刷新
          </button>
          <button className="ui-btn ui-btn-primary gap-1" onClick={handleSave} disabled={saving}>
            <Save size={14} /> {saving ? '保存中...' : '保存项目流程'}
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">角色来源说明</div>
            <div className="text-xs text-slate-500">当前生效范围：{scope || '-'}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
            <div>
              <div className="text-slate-500 mb-2">系统级角色字典</div>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_ROLE_OPTIONS.map((role) => (
                  <span key={role} className="ui-badge ui-badge-slate">{formatRoleLabel(role)}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-slate-500 mb-2">项目成员角色</div>
              <div className="flex flex-wrap gap-2">
                {projectRoleOptions.length > 0 ? projectRoleOptions.map((role) => (
                  <span key={role} className="ui-badge ui-badge-blue">{formatRoleLabel(role)}</span>
                )) : <span className="text-slate-400">暂无项目成员角色</span>}
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3">
            说明：保存后仅覆盖所选项目流程；未配置时默认使用系统流程。
          </div>
        </div>

        {error && (

          <div className="ui-alert-error">
            {error}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">流程图</div>
            <button className="ui-btn ui-btn-default gap-1" onClick={handleAddNode}>
              <Plus size={14} /> 添加节点
            </button>
          </div>
          <div className="mt-4 flex items-center flex-wrap gap-2">
            <span className="px-3 py-1 text-xs rounded-full border bg-emerald-50 text-emerald-600 border-emerald-200">
              开始
            </span>
            <span className="mx-2 text-slate-300">→</span>
            {sortedNodes.length === 0 ? (
              <span className="text-xs text-slate-400">暂无节点</span>
            ) : (
              sortedNodes.map((node, index) => (
                <div key={node.nodeKey || index} className="flex items-center">
                  <span className="px-3 py-1 text-xs rounded-full border bg-slate-50 text-slate-600 border-slate-200">
                    {node.nodeName || `节点${index + 1}`}
                  </span>
                  {index < sortedNodes.length - 1 && <span className="mx-2 text-slate-300">→</span>}
                </div>
              ))
            )}
            <span className="mx-2 text-slate-300">→</span>
            <span className="px-3 py-1 text-xs rounded-full border bg-slate-50 text-slate-500 border-slate-200">
              结束
            </span>
          </div>

        </div>

        <div className="ui-table-container">
          <table className="ui-table">
            <thead>
              <tr>
                <th className="w-16">顺序</th>
                <th className="min-w-[160px]">节点名称</th>
                <th className="min-w-[160px]">角色编码</th>
                <th className="min-w-[120px]">任务类型</th>
                <th className="min-w-[380px]">动态表单字段</th>
                <th className="w-20 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">加载中...</td></tr>
              ) : nodes.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">暂无节点</td></tr>
              ) : nodes.map((node, index) => (
                <tr key={node.nodeKey || index} className="hover:bg-slate-50">
                  <td>
                    <input
                      type="number"
                      value={node.orderNo ?? index + 1}
                      onChange={(e) => updateNode(index, { orderNo: Number(e.target.value) })}
                      className="ui-input w-16"
                    />
                  </td>
                  <td>
                    <input
                      value={node.nodeName || ''}
                      onChange={(e) => updateNode(index, { nodeName: e.target.value })}
                      className="ui-input"
                      placeholder={`节点${index + 1}`}
                    />
                  </td>
                  <td>
                    <select
                      value={node.roleCode || ''}
                      onChange={(e) => updateNode(index, { roleCode: e.target.value })}
                      className="ui-input"
                    >
                      <option value="">选择角色</option>
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {formatRoleLabel(role)}
                        </option>
                      ))}
                    </select>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {node.roleCode ? formatRoleLabel(node.roleCode) : '—'}
                    </div>
                  </td>


                  <td>
                    <select
                      value={node.taskType || 'APPROVE'}
                      onChange={(e) => updateNode(index, { taskType: e.target.value })}
                      className="ui-input"
                    >
                      {TASK_TYPE_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <div className="space-y-2">
                      {normalizeFormFields(node.formFields).length === 0 ? (
                        <div className="rounded border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-400">
                          未配置动态字段
                        </div>
                      ) : (
                        normalizeFormFields(node.formFields).map((field, fieldIndex) => (
                          <div key={`${field.fieldKey || 'field'}-${fieldIndex}`} className="rounded border border-slate-200 p-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                className="ui-input"
                                value={field.fieldKey || ''}
                                onChange={(e) => updateField(index, fieldIndex, { fieldKey: e.target.value })}
                                placeholder={`field_${fieldIndex + 1}`}
                              />
                              <input
                                className="ui-input"
                                value={field.fieldLabel || ''}
                                onChange={(e) => updateField(index, fieldIndex, { fieldLabel: e.target.value })}
                                placeholder="字段名称"
                              />
                              <select
                                className="ui-input"
                                value={field.fieldType || 'TEXT'}
                                onChange={(e) => updateField(index, fieldIndex, { fieldType: e.target.value })}
                              >
                                {FIELD_TYPE_OPTIONS.map((item) => (
                                  <option key={item.value} value={item.value}>{item.label}</option>
                                ))}
                              </select>
                              <input
                                className="ui-input"
                                value={field.placeholder || ''}
                                onChange={(e) => updateField(index, fieldIndex, { placeholder: e.target.value })}
                                placeholder="占位提示"
                              />
                            </div>
                            <div className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2">
                              <input
                                className="ui-input"
                                value={field.defaultValue || ''}
                                onChange={(e) => updateField(index, fieldIndex, { defaultValue: e.target.value })}
                                placeholder="默认值"
                              />
                              <div className="flex items-center gap-3 text-xs text-slate-600">
                                <label className="flex items-center gap-1">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(field.required)}
                                    onChange={(e) => updateField(index, fieldIndex, { required: e.target.checked })}
                                  />
                                  必填
                                </label>
                                <label className="flex items-center gap-1">
                                  <input
                                    type="checkbox"
                                    checked={field.editable !== false}
                                    onChange={(e) => updateField(index, fieldIndex, { editable: e.target.checked })}
                                  />
                                  可编辑
                                </label>
                              </div>
                              <button
                                className="ui-btn ui-btn-sm ui-btn-danger"
                                onClick={() => removeField(index, fieldIndex)}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                            {(field.fieldType || 'TEXT').toUpperCase() === 'SELECT' && (
                              <input
                                className="ui-input mt-2"
                                value={normalizeOptions(field.options).join(',')}
                                onChange={(e) => updateField(index, fieldIndex, { options: splitOptions(e.target.value) })}
                                placeholder="下拉选项，逗号分隔（如：低,中,高）"
                              />
                            )}
                          </div>
                        ))
                      )}
                      <button className="ui-btn ui-btn-default ui-btn-sm gap-1" onClick={() => addField(index)}>
                        <Plus size={12} /> 添加字段
                      </button>
                    </div>
                  </td>

                  <td className="text-center">
                    <button
                      className="ui-btn ui-btn-sm ui-btn-danger"
                      onClick={() => handleRemoveNode(index)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>


        </div>



      </div>
    </Layout>
  );
};

export default WorkflowSettings;

const normalizeFormFields = (fields?: WorkflowFormField[]) => {
  if (!Array.isArray(fields)) return [];
  return fields
    .filter((field) => Boolean(field))
    .map((field, index) => ({
      fieldKey: field.fieldKey || `field_${index + 1}`,
      fieldLabel: field.fieldLabel || `字段${index + 1}`,
      fieldType: (field.fieldType || 'TEXT').toUpperCase(),
      required: Boolean(field.required),
      editable: field.editable !== false,
      placeholder: field.placeholder || '',
      defaultValue: field.defaultValue || '',
      options: normalizeOptions(field.options),
    }));
};

const normalizeOptions = (options?: string[]) => {
  if (!Array.isArray(options)) return [];
  return options.map((item) => String(item).trim()).filter(Boolean);
};

const splitOptions = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
