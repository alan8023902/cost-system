import React, { useEffect, useMemo, useState } from 'react';
import { Search, Send, XCircle, RefreshCw, UserRoundCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useToast } from '../components/ToastProvider';
import { formatStatusLabel } from '../constants';
import { workflowApi } from '../services/apiService';

type TaskStatus = 'PENDING' | 'COMPLETED' | 'APPROVED' | 'REJECTED' | 'RETURNED' | 'CANCELLED';

interface WorkflowTask {
  id: number;
  versionId: number;
  projectId?: number;
  title: string;
  description?: string;
  submitter?: string;
  status: TaskStatus;
  createdAt?: string;
  processedAt?: string;
  currentNodeName?: string;
}

interface WorkflowFormField {
  fieldKey: string;
  fieldLabel?: string;
  fieldType?: string;
  required?: boolean;
  editable?: boolean;
  placeholder?: string;
  defaultValue?: string;
  options?: string[] | string;
}

const MyTasks: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [keyword, setKeyword] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [workflowDetail, setWorkflowDetail] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [transferUserId, setTransferUserId] = useState('');
  const [processing, setProcessing] = useState<'approve' | 'reject' | 'transfer' | ''>('');
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await workflowApi.getMyTasks();
      const list: WorkflowTask[] = (Array.isArray(data) ? data : []).map((item: any) => ({
        id: Number(item.id),
        versionId: Number(item.versionId),
        projectId: item.projectId ? Number(item.projectId) : undefined,
        title: item.title || '审批任务',
        description: item.description || item.taskDescription || '',
        submitter: item.submitter || item.initiatorName || '',
        status: (item.status || 'PENDING').toUpperCase(),
        createdAt: item.createdAt || item.taskCreateTime,
        processedAt: item.processedAt || item.completeTime,
        currentNodeName: item.currentNodeName || item.taskName,
      }));
      setTasks(list);
      if (list.length > 0 && !selectedTaskId) {
        setSelectedTaskId(list[0].id);
      }
    } catch (err: any) {
      toast.error(err?.message || '加载审批任务失败');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkflowDetail = async (versionId?: number) => {
    if (!versionId) {
      setWorkflowDetail(null);
      return;
    }
    try {
      const detail = await workflowApi.getVersionWorkflow(String(versionId));
      setWorkflowDetail(detail || null);
    } catch {
      setWorkflowDetail(null);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    const base = tasks.filter((task) =>
      activeTab === 'pending' ? task.status === 'PENDING' : task.status !== 'PENDING'
    );
    const q = keyword.trim().toLowerCase();
    if (!q) return base;
    return base.filter((task) =>
      [task.title, task.description, String(task.versionId), String(task.projectId || '')]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [tasks, activeTab, keyword]);

  const selectedTask = useMemo(
    () => filteredTasks.find((task) => task.id === selectedTaskId) || filteredTasks[0] || null,
    [filteredTasks, selectedTaskId]
  );

  const currentNode = useMemo(() => {
    const nodes = Array.isArray(workflowDetail?.definition?.nodes) ? workflowDetail.definition.nodes : [];
    if (nodes.length === 0) return null;
    const currentKey = workflowDetail?.currentNodeKey;
    return nodes.find((node: any) => node.nodeKey === currentKey) || nodes[0];
  }, [workflowDetail]);

  const dynamicFields = useMemo<WorkflowFormField[]>(() => {
    if (!currentNode || !Array.isArray(currentNode.formFields)) return [];
    return currentNode.formFields.filter((field: any) => Boolean(field?.fieldKey));
  }, [currentNode]);

  useEffect(() => {
    if (!selectedTask) {
      setWorkflowDetail(null);
      return;
    }
    setSelectedTaskId(selectedTask.id);
    loadWorkflowDetail(selectedTask.versionId);
  }, [selectedTask?.id, selectedTask?.versionId]);

  useEffect(() => {
    if (dynamicFields.length === 0) {
      setFormValues({});
      return;
    }
    const initialValues: Record<string, string> = {};
    dynamicFields.forEach((field) => {
      initialValues[field.fieldKey] = String(field.defaultValue || '');
    });
    setFormValues(initialValues);
  }, [selectedTask?.id, currentNode?.nodeKey]);

  const pendingCount = tasks.filter((task) => task.status === 'PENDING').length;
  const completedCount = tasks.length - pendingCount;

  const buildActionComment = () => {
    const fieldSummary = dynamicFields
      .map((field) => {
        const value = (formValues[field.fieldKey] || '').trim();
        if (!value) return '';
        return `${field.fieldLabel || field.fieldKey}: ${value}`;
      })
      .filter(Boolean)
      .join('；');
    if (!fieldSummary) {
      return comment;
    }
    if (!comment.trim()) {
      return `[表单] ${fieldSummary}`;
    }
    return `${comment}\n[表单] ${fieldSummary}`;
  };

  const doAction = async (action: 'approve' | 'reject' | 'transfer') => {
    if (!selectedTask) return;
    try {
      setProcessing(action);
      const actionComment = buildActionComment();
      if (action === 'approve') {
        await workflowApi.approveTask(String(selectedTask.versionId), selectedTask.id, actionComment);
      } else if (action === 'reject') {
        await workflowApi.rejectTask(String(selectedTask.versionId), selectedTask.id, actionComment);
      } else {
        const targetUserId = Number(transferUserId);
        if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
          toast.error('请输入有效的转交用户ID');
          return;
        }
        await workflowApi.transferTask(String(selectedTask.versionId), selectedTask.id, targetUserId, actionComment);
      }
      toast.success(action === 'approve' ? '审批通过成功' : action === 'reject' ? '驳回成功' : '转交成功');
      setComment('');
      if (action === 'transfer') {
        setTransferUserId('');
      }
      await loadTasks();
      await loadWorkflowDetail(selectedTask.versionId);
    } catch (err: any) {
      toast.error(err?.message || '操作失败');
    } finally {
      setProcessing('');
    }
  };

  return (
    <Layout title="审批中心" subtitle="待办/已办任务处理">
      <div className="grid h-[calc(100vh-176px)] grid-cols-1 gap-4 xl:grid-cols-[380px_1fr]">
        <section className="flex min-h-0 flex-col border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-4">
            <div className="mb-3 flex items-center gap-2">
              <button
                className={`ui-btn ${activeTab === 'pending' ? 'ui-btn-primary' : 'ui-btn-default'}`}
                onClick={() => setActiveTab('pending')}
              >
                待办
                <span className="ml-2 rounded-full bg-red-500 px-2 text-xs text-white">{pendingCount}</span>
              </button>
              <button
                className={`ui-btn ${activeTab === 'completed' ? 'ui-btn-primary' : 'ui-btn-default'}`}
                onClick={() => setActiveTab('completed')}
              >
                已办
                <span className="ml-2 rounded-full bg-slate-200 px-2 text-xs text-slate-600">{completedCount}</span>
              </button>
            </div>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="按流程名称 / 项目 / 版本筛选"
                className="ui-input pl-9"
              />
            </label>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 overflow-auto">
            {loading ? (
              <div className="p-4 text-sm text-slate-500">加载中...</div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-6 text-sm text-slate-400">暂无任务</div>
            ) : (
              filteredTasks.map((task) => {
                const selected = task.id === selectedTask?.id;
                return (
                  <button
                    key={task.id}
                    className={`relative block w-full border-b border-slate-100 px-4 py-3 text-left text-sm ${
                      selected ? 'bg-[#E9F0FF]' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    {selected && <span className="absolute left-0 top-2 h-7 w-1 bg-[#1A5CFF]" />}
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-medium text-slate-800">{task.title}</div>
                      <span className={`ui-badge ${task.status === 'PENDING' ? 'ui-badge-amber' : 'ui-badge-gray'}`}>
                        {task.status === 'PENDING' ? '待办' : '已办'}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      当前节点：{task.currentNodeName || '-'} · 提交人：{task.submitter || '-'}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                      <span>{task.createdAt ? formatTime(task.createdAt) : '-'}</span>
                      <span>版本 #{task.versionId}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="flex min-h-0 flex-col border border-slate-200 bg-white">
          {!selectedTask ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">请选择左侧任务</div>
          ) : (
            <>
              <div className="border-b border-slate-200 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-800">{selectedTask.title}</h2>
                  <button
                    className="ui-btn ui-btn-default"
                    onClick={() => navigate(`/versions/${selectedTask.versionId}/workbench?tab=workflow`)}
                  >
                    查看版本详情
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs text-slate-600 md:grid-cols-4">
                  <div>项目ID：{selectedTask.projectId || '-'}</div>
                  <div>版本ID：{selectedTask.versionId}</div>
                  <div>发起人：{selectedTask.submitter || '-'}</div>
                  <div>发起时间：{selectedTask.createdAt ? formatTime(selectedTask.createdAt) : '-'}</div>
                </div>
              </div>

              <div className="custom-scrollbar min-h-0 flex-1 overflow-auto p-4">
                <section className="mb-4 border border-slate-200 bg-white p-4">
                  <div className="mb-3 text-sm font-semibold text-slate-700">审批流程图（横向泳道）</div>
                  <WorkflowLane detail={workflowDetail} />
                </section>

                <section className="mb-4 border border-slate-200 bg-white p-4">
                  <div className="mb-2 text-sm font-semibold text-slate-700">表单字段区域</div>
                  {dynamicFields.length === 0 ? (
                    <div className="text-sm text-slate-600">
                      <div>任务说明：{selectedTask.description || '-'}</div>
                      <div className="mt-1">处理状态：{formatStatusLabel(String(selectedTask.status || '').toUpperCase())}</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {dynamicFields.map((field) => (
                        <label key={field.fieldKey} className="block">
                          <span className="ui-label">
                            {field.fieldLabel || field.fieldKey}
                            {field.required ? <span className="ml-1 text-red-500">*</span> : null}
                          </span>
                          {renderFieldInput(field, formValues[field.fieldKey] || '', (value) =>
                            setFormValues((prev) => ({ ...prev, [field.fieldKey]: value }))
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </section>

                <section className="border border-slate-200 bg-white p-4">
                  <div className="mb-2 text-sm font-semibold text-slate-700">任务处理</div>
                  <textarea
                    className="ui-textarea mb-3"
                    rows={3}
                    placeholder="请输入审批备注（可选）"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="ui-btn ui-btn-primary"
                      onClick={() => doAction('approve')}
                      disabled={selectedTask.status !== 'PENDING' || processing !== ''}
                    >
                      {processing === 'approve' ? <RefreshCw className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
                      通过
                    </button>
                    <button
                      className="ui-btn ui-btn-default"
                      onClick={() => doAction('reject')}
                      disabled={selectedTask.status !== 'PENDING' || processing !== ''}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      驳回
                    </button>
                    <div className="flex items-center gap-2">
                      <input
                        className="ui-input w-32"
                        value={transferUserId}
                        onChange={(e) => setTransferUserId(e.target.value)}
                        placeholder="转交用户ID"
                      />
                      <button
                        className="ui-btn ui-btn-default"
                        onClick={() => doAction('transfer')}
                        disabled={selectedTask.status !== 'PENDING' || processing !== ''}
                      >
                        <UserRoundCheck className="mr-1 h-4 w-4" />
                        转交
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
        </section>
      </div>
    </Layout>
  );
};

const WorkflowLane: React.FC<{ detail: any }> = ({ detail }) => {
  const nodes = Array.isArray(detail?.definition?.nodes) ? detail.definition.nodes : [];
  const current = detail?.currentNodeKey;
  if (nodes.length === 0) {
    return <div className="text-xs text-slate-400">暂无流程节点数据</div>;
  }
  const currentIndex = nodes.findIndex((node: any) => node.nodeKey === current);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {nodes.map((node: any, idx: number) => {
        const status = idx < currentIndex ? 'done' : idx === currentIndex ? 'current' : 'todo';
        return (
          <div key={`${node.nodeKey}-${idx}`} className="flex items-center gap-2">
            <div
              className={`min-w-[128px] rounded border px-3 py-2 text-xs ${
                status === 'done'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : status === 'current'
                  ? 'border-blue-300 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              <div className="font-medium">{node.nodeName || node.nodeKey}</div>
              <div className="mt-1 flex items-center gap-1 text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" />
                {status === 'done' ? '已完成' : status === 'current' ? '当前节点' : '待处理'}
              </div>
            </div>
            {idx < nodes.length - 1 && <span className="text-slate-300">→</span>}
          </div>
        );
      })}
    </div>
  );
};

const renderFieldInput = (
  field: WorkflowFormField,
  value: string,
  onChange: (value: string) => void
) => {
  const type = String(field.fieldType || 'TEXT').toUpperCase();
  const disabled = field.editable === false;
  if (type === 'TEXTAREA') {
    return (
      <textarea
        className="ui-textarea"
        rows={3}
        placeholder={field.placeholder || '请输入'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    );
  }
  if (type === 'SELECT') {
    const options = normalizeFieldOptions(field.options);
    return (
      <select
        className="ui-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">请选择</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }
  if (type === 'NUMBER') {
    return (
      <input
        className="ui-input"
        type="number"
        placeholder={field.placeholder || '请输入数字'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    );
  }
  if (type === 'DATE') {
    return (
      <input
        className="ui-input"
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    );
  }
  if (type === 'READONLY') {
    return <div className="ui-input flex items-center bg-slate-50 text-slate-500">{value || '-'}</div>;
  }
  return (
    <input
      className="ui-input"
      type="text"
      placeholder={field.placeholder || '请输入'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  );
};

const normalizeFieldOptions = (options: WorkflowFormField['options']) => {
  if (!options) return [];
  if (Array.isArray(options)) return options.map((item) => String(item));
  return String(options)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const formatTime = (value: string) =>
  new Date(value).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

export default MyTasks;
