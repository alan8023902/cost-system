import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Plus, Search, Grid, List, User, Calendar, DollarSign, Tag, Upload, X, Image as ImageIcon, FileUp, Pencil, Trash2 } from 'lucide-react';
import { Project, ProjectStatus } from '../types';
import { projectApi } from '../services/apiService';
import { useToast } from '../components/ToastProvider';

// 标签颜色选项 - 用于卡片主题色
const TAG_COLORS = [
  { name: '蓝色', value: 'blue', gradient: 'from-blue-500 to-blue-600', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  { name: '绿色', value: 'green', gradient: 'from-green-500 to-green-600', light: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  { name: '紫色', value: 'purple', gradient: 'from-purple-500 to-purple-600', light: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  { name: '橙色', value: 'orange', gradient: 'from-orange-500 to-orange-600', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  { name: '红色', value: 'red', gradient: 'from-red-500 to-red-600', light: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  { name: '灰色', value: 'gray', gradient: 'from-gray-500 to-gray-600', light: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' },
];

interface ExtendedProject extends Project {
  description?: string;
  tagColor?: string;
  coverUrl?: string;
  orgId?: number | null;
}

const ProjectList: React.FC = () => {
  const navigate = useNavigate();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState<ExtendedProject[]>([]);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importForm, setImportForm] = useState({
    name: '',
    description: '',
    tagColor: 'blue',
    orgId: '',
  });
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    tagColor: 'blue',
    coverUrl: '',
    orgId: '',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  // 自动生成项目编码
  const generateProjectCode = () => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PRJ-${year}${month}-${random}`;
  };

  const normalizeProjects = (payload: any): ExtendedProject[] => {
    const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.content) ? payload.content : []);
    return list.map((item: any) => ({
      id: String(item?.id ?? ''),
      name: item?.name || item?.projectName || '未命名项目',
      code: item?.code || item?.projectCode || generateProjectCode(),
      manager: item?.manager || item?.projectManager || '管理员',
      status: mapStatus(item?.status),
      createDate: item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-',
      budget: Number(item?.budget ?? 0),
      description: item?.description || '',
      tagColor: item?.tagColor || 'blue',
      coverUrl: item?.coverUrl || '',
      orgId: item?.orgId ?? null,
    }));
  };

  const mapStatus = (status?: string): ProjectStatus => {
    switch (status) {
      case 'ARCHIVED':
        return ProjectStatus.ARCHIVED;
      case 'COMPLETED':
        return ProjectStatus.COMPLETED;
      default:
        return ProjectStatus.IN_PROGRESS;
    }
  };

  const loadProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await projectApi.list();
      setProjects(normalizeProjects(data));
    } catch (err: any) {
      setError(err.message || '加载项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return projects;
    return projects.filter((p) =>
      p.name.toLowerCase().includes(keyword) ||
      p.code.toLowerCase().includes(keyword) ||
      p.description?.toLowerCase().includes(keyword)
    );
  }, [projects, searchTerm]);

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.IN_PROGRESS:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">进行中</span>;
      case ProjectStatus.COMPLETED:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">已完工</span>;
      case ProjectStatus.ARCHIVED:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">已归档</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">未知</span>;
    }
  };

  const getTagColorClass = (color: string) => {
    const colorConfig = TAG_COLORS.find(c => c.value === color) || TAG_COLORS[0];
    return colorConfig;
  };

  const resetCreateForm = () => {
    setEditingProjectId(null);
    setCreateForm({
      name: '',
      description: '',
      tagColor: 'blue',
      coverUrl: '',
      orgId: ''
    });
  };

  const resetImportForm = () => {
    setImportForm({
      name: '',
      description: '',
      tagColor: 'blue',
      orgId: ''
    });
    setImportFile(null);
  };

  const readImageAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('读取图片失败'));
      reader.readAsDataURL(file);
    });
  };

  const handlePickCover = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.warning('请选择图片文件');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.warning('图片不能超过2MB');
      return;
    }
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setCreateForm((prev) => ({ ...prev, coverUrl: dataUrl }));
    } catch (err: any) {
      toast.error(err?.message || '处理图片失败');
    }
  };

  const handleImportProject = async () => {
    if (!importForm.name.trim()) {
      toast.warning('请填写项目名称');
      return;
    }
    if (!importFile) {
      toast.warning('请先选择Excel文件');
      return;
    }
    setImporting(true);
    try {
      const code = generateProjectCode();
      const result = await projectApi.importFromExcel(
        {
          code,
          name: importForm.name.trim(),
          description: importForm.description.trim(),
          tagColor: importForm.tagColor,
          coverUrl: '',
          orgId: importForm.orgId ? Number(importForm.orgId) : null,
        },
        importFile
      );
      setShowImportModal(false);
      resetImportForm();
      await loadProjects();
      toast.success(`导入完成：成功 ${result?.importResult?.successCount ?? 0} 行`);
      if (result?.version?.id) {
        navigate(`/versions/${result.version.id}/workbench`);
      }
    } catch (err: any) {
      toast.error(err?.message || '导入失败');
    } finally {
      setImporting(false);
    }
  };

  const openEditProject = (project: ExtendedProject) => {
    setEditingProjectId(String(project.id));
    setCreateForm({
      name: project.name || '',
      description: project.description || '',
      tagColor: project.tagColor || 'blue',
      coverUrl: project.coverUrl || '',
      orgId: project.orgId ? String(project.orgId) : '',
    });
    setShowCreateModal(true);
  };

  const handleArchiveProject = async (project: ExtendedProject) => {
    if (!confirm(`确认删除项目“${project.name}”吗？删除会执行归档。`)) return;
    try {
      await projectApi.archive(String(project.id));
      toast.success('项目已删除（归档）');
      await loadProjects();
    } catch (err: any) {
      toast.error(err?.message || '删除失败');
    }
  };

  const handleCreateProject = async () => {
    if (!createForm.name.trim()) {
      toast.warning('请填写项目名称');
      return;
    }
    const isEditing = Boolean(editingProjectId);
    setCreating(true);
    try {
      if (isEditing && editingProjectId) {
        await projectApi.update(editingProjectId, {
          name: createForm.name.trim(),
          description: createForm.description.trim(),
          tagColor: createForm.tagColor,
          coverUrl: createForm.coverUrl || '',
          orgId: createForm.orgId ? Number(createForm.orgId) : null,
        });
      } else {
        const code = generateProjectCode();
        await projectApi.create({
          code,
          name: createForm.name.trim(),
          description: createForm.description.trim(),
          tagColor: createForm.tagColor,
          coverUrl: createForm.coverUrl || '',
          orgId: createForm.orgId ? Number(createForm.orgId) : null,
        });
      }
      setShowCreateModal(false);
      resetCreateForm();
      await loadProjects();
      toast.success(isEditing ? '项目更新成功' : '项目创建成功');
    } catch (err: any) {
      toast.error(err?.message || (isEditing ? '更新项目失败' : '创建项目失败'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Layout title="项目总览" subtitle="管理所有工程项目">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input
                type="text"
                placeholder="搜索项目名称、编号或描述..."
                className="ui-input pl-10 pr-4"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              className="ui-btn ui-btn-default gap-1.5"
              onClick={() => setShowImportModal(true)}
            >
              <FileUp size={18} />
              <span>Excel导入建项目</span>
            </button>
            {/* View Mode Toggle */}
            <div className="flex bg-neutral-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'card'
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                title="卡片视图"
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                title="表格视图"
              >
                <List size={18} />
              </button>
            </div>

            <button
              className="ui-btn ui-btn-primary gap-1.5"
              onClick={() => {
                resetCreateForm();
                setShowCreateModal(true);
              }}
            >
              <Plus size={18} />
              <span>新建项目</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="ui-alert-error">
            {error}
          </div>
        )}

        {/* Card View */}
        {viewMode === 'card' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-12 text-neutral-500">加载中...</div>
            ) : filteredProjects.length === 0 ? (
              <div className="col-span-full text-center py-12 text-neutral-500">暂无项目</div>
            ) : (
              filteredProjects.map((project) => {
                const tagColor = getTagColorClass(project.tagColor || 'blue');
                return (
                  <div
                    key={project.id}
                    className="bg-white rounded border border-neutral-200 overflow-hidden hover:border-blue-200 transition-all duration-200 cursor-pointer group"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    {/* Cover Image with Gradient Overlay */}
                    <div className="relative h-40 overflow-hidden">
                      {project.coverUrl ? (
                        <img
                          src={project.coverUrl}
                          alt={project.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${tagColor.gradient} flex items-center justify-center`}>
                          <ImageIcon size={48} className="text-white opacity-50" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        {getStatusBadge(project.status)}
                      </div>
                      <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/90 backdrop-blur-sm text-neutral-900 shadow-sm">
                        <Tag size={12} className="inline-block mr-1 mb-0.5" />
                        {project.code}
                      </div>
                    </div>

                    {/* Content */}
                    <div className={`p-4 border-t ${tagColor.border} ${tagColor.light}`}>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2 group-hover:text-brand-600 transition-colors line-clamp-1">
                        {project.name}
                      </h3>

                      {project.description && (
                        <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                          {project.description}
                        </p>
                      )}

                      <div className="space-y-2 text-xs text-neutral-500">
                        <div className="flex items-center gap-2">
                          <User size={14} />
                          <span>{project.manager}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} />
                          <span>{project.createDate}</span>
                        </div>
                        {project.budget > 0 && (
                          <div className="flex items-center gap-2">
                            <DollarSign size={14} />
                            <span className="font-mono">¥{project.budget.toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="ui-btn ui-btn-sm ui-btn-default"
                          onClick={() => openEditProject(project)}
                        >
                          <Pencil size={13} className="mr-1" />
                          编辑
                        </button>
                        <button
                          className="ui-btn ui-btn-sm ui-btn-danger"
                          onClick={() => handleArchiveProject(project)}
                        >
                          <Trash2 size={13} className="mr-1" />
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="ui-table-container">
            <div className="overflow-x-auto">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>状态</th>
                    <th>项目信息</th>
                    <th>项目编号</th>
                    <th>负责人</th>
                    <th>创建日期</th>
                    <th className="text-right">预算总额</th>
                    <th className="w-44 text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-12 text-neutral-500">加载中...</td></tr>
                  ) : filteredProjects.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-neutral-500">暂无项目</td></tr>
                  ) : (
                    filteredProjects.map((project) => {
                      const tagColor = getTagColorClass(project.tagColor || 'blue');
                      return (
                        <tr
                          key={project.id}
                          className="hover:bg-neutral-50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/projects/${project.id}`)}
                        >
                          <td>
                            {getStatusBadge(project.status)}
                          </td>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gradient-to-br ${tagColor.gradient}`}>
                                {project.coverUrl ? (
                                  <img src={project.coverUrl} alt={project.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon size={20} className="text-white opacity-70" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-medium text-neutral-900 hover:text-brand-600 transition-colors">
                                  {project.name}
                                </div>
                                {project.description && (
                                  <div className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                                    {project.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${tagColor.light} ${tagColor.text} border ${tagColor.border}`}>
                              {project.code}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                              <User size={14} />
                              {project.manager}
                            </div>
                          </td>
                          <td className="text-sm text-neutral-600">
                            {project.createDate}
                          </td>
                          <td className="text-right text-sm font-mono text-neutral-900">
                            {project.budget > 0 ? `¥${project.budget.toLocaleString()}` : '-'}
                          </td>
                          <td className="text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-2">
                              <button className="ui-btn ui-btn-sm ui-btn-default" onClick={() => openEditProject(project)}>
                                <Pencil size={13} className="mr-1" />
                                编辑
                              </button>
                              <button className="ui-btn ui-btn-sm ui-btn-danger" onClick={() => handleArchiveProject(project)}>
                                <Trash2 size={13} className="mr-1" />
                                删除
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-neutral-900">{editingProjectId ? '编辑项目' : '新建项目'}</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  项目名称 <span className="text-red-500">*</span>
                </label>
                <input
                  className="ui-input"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入项目名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  项目描述
                </label>
                <textarea
                  className="ui-textarea"
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="简要描述项目内容和目标"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  主题颜色
                </label>
                <div className="grid grid-cols-6 gap-3">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setCreateForm((prev) => ({ ...prev, tagColor: color.value }))}
                      className={`relative aspect-square rounded bg-gradient-to-br ${color.gradient} transition-all ${
                        createForm.tagColor === color.value
                          ? 'ring-4 ring-offset-2 ring-neutral-900 scale-105'
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      title={color.name}
                    >
                      {createForm.tagColor === color.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-neutral-500 mt-2">选择的颜色将作为项目卡片的主题色</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  项目封面
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-3 items-start">
                  <button
                    type="button"
                    className={`aspect-video rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1 ${
                      createForm.coverUrl
                        ? 'border-brand-600 bg-brand-50'
                        : 'border-neutral-300 hover:border-brand-400 hover:bg-neutral-50'
                    }`}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    <Upload size={16} className="text-neutral-400" />
                    <span className="text-[10px] text-neutral-500">选择图片</span>
                  </button>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePickCover(e.target.files?.[0])}
                  />
                  <div className={`aspect-video rounded-lg overflow-hidden border ${createForm.tagColor ? getTagColorClass(createForm.tagColor).border : 'border-neutral-200'}`}>
                    {createForm.coverUrl ? (
                      <img src={createForm.coverUrl} alt="项目封面预览" className="h-full w-full object-cover" />
                    ) : (
                      <div className={`h-full w-full bg-gradient-to-br ${getTagColorClass(createForm.tagColor).gradient} flex items-center justify-center`}>
                        <ImageIcon size={24} className="text-white/80" />
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mt-2">支持 JPG/PNG，建议 16:9，大小不超过 2MB。</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  组织ID（可选）
                </label>
                <input
                  type="number"
                  className="ui-input"
                  value={createForm.orgId}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, orgId: e.target.value }))}
                  placeholder="输入组织ID"
                />
              </div>

              <div className="bg-brand-50 border border-brand-200 rounded p-4">
                <p className="text-xs text-brand-700">
                  <strong>提示:</strong> 项目编码将自动生成,格式为 PRJ-YYYYMM-XXX
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3 sticky bottom-0 bg-white">
              <button
                className="ui-btn ui-btn-default"
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
              >
                取消
              </button>
              <button
                className="ui-btn ui-btn-primary"
                onClick={handleCreateProject}
                disabled={creating}
              >
                {creating ? (editingProjectId ? '保存中...' : '创建中...') : (editingProjectId ? '保存修改' : '确认创建')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">Excel导入并创建项目</h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  resetImportForm();
                }}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  项目名称 <span className="text-red-500">*</span>
                </label>
                <input
                  className="ui-input"
                  value={importForm.name}
                  onChange={(e) => setImportForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入项目名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">项目描述</label>
                <textarea
                  className="ui-textarea"
                  rows={2}
                  value={importForm.description}
                  onChange={(e) => setImportForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">主题颜色</label>
                <div className="grid grid-cols-6 gap-2">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setImportForm((prev) => ({ ...prev, tagColor: color.value }))}
                      className={`relative aspect-square rounded bg-gradient-to-br ${color.gradient} transition-all ${
                        importForm.tagColor === color.value
                          ? 'ring-2 ring-offset-2 ring-neutral-800'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Excel文件 <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => importFileRef.current?.click()}
                  className="w-full border border-dashed border-neutral-300 rounded px-4 py-6 text-sm text-neutral-600 hover:bg-neutral-50"
                >
                  {importFile ? `已选择：${importFile.name}` : '点击选择 Excel 文件（.xlsx / .xls）'}
                </button>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-neutral-500 mt-2">
                  导入后会自动创建项目、创建版本，并写入明细行。
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3">
              <button
                className="ui-btn ui-btn-default"
                onClick={() => {
                  setShowImportModal(false);
                  resetImportForm();
                }}
              >
                取消
              </button>
              <button
                className="ui-btn ui-btn-primary"
                onClick={handleImportProject}
                disabled={importing}
              >
                {importing ? '导入中...' : '开始导入'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProjectList;
